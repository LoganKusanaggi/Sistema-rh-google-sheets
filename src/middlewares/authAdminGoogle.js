const { OAuth2Client } = require('google-auth-library');
const supabase = require('../config/supabase');

const googleClient = new OAuth2Client();

/**
 * Obtém a lista de e-mails de bootstrap a partir das variáveis de ambiente.
 * ADMIN_BOOTSTRAP_EMAILS substitui ADMIN_ALLOWED_EMAILS como fallback de emergência.
 */
function getBootstrapEmails() {
  const bootstrap = process.env.ADMIN_BOOTSTRAP_EMAILS || process.env.ADMIN_ALLOWED_EMAILS || '';
  return String(bootstrap)
    .split(',')
    .map(function (email) { return email.trim().toLowerCase(); })
    .filter(Boolean);
}

/**
 * Middleware principal de autenticação via Google Identity Token.
 * Suporta RBAC (Role Based Access Control) via banco de dados.
 * 
 * @param {string[]} allowedRoles - Lista de papéis permitidos (OWNER, ADMIN, VIEWER)
 */
function requireAdminGoogle(allowedRoles = []) {
  return async function (req, res, next) {
    try {
      const auth = req.headers.authorization || '';

      if (!auth.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Acesso administrativo não autorizado. Token de identidade ausente.'
        });
      }

      const token = auth.substring('Bearer '.length).trim();

      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Acesso administrativo não autorizado. Token de identidade vazio.'
        });
      }

      // 1. Validar Token com Google
      let ticket;
      try {
        ticket = await googleClient.verifyIdToken({
          idToken: token
        });
      } catch (err) {
        console.error('[Admin Auth] Erro ao verificar token:', err.message);
        return res.status(401).json({
          success: false,
          error: 'Token de identidade inválido ou expirado.'
        });
      }

      const payload = ticket.getPayload();

      if (!payload || !payload.email) {
        return res.status(401).json({
          success: false,
          error: 'Acesso administrativo não autorizado. E-mail não encontrado no token.'
        });
      }

      if (payload.email_verified === false) {
        return res.status(401).json({
          success: false,
          error: 'Acesso administrativo não autorizado. E-mail não verificado.'
        });
      }

      const email = String(payload.email).toLowerCase();

      // 2. Verificar no Banco de Dados
      let { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('ativo', true)
        .single();

      let role = adminUser ? adminUser.role : null;
      let isBootstrap = false;
      let adminUserId = adminUser ? adminUser.id : null;

      // 3. Fallback de Bootstrap (Emergência)
      if (!adminUser) {
        // Verificar se existem OWNERS ativos no banco
        const { count, error: countError } = await supabase
          .from('admin_users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'OWNER')
          .eq('ativo', true);

        const bootstrapEmails = getBootstrapEmails();
        
        // Se não houver nenhum OWNER ativo e o e-mail estiver no bootstrap
        if ((count === 0 || count === null) && bootstrapEmails.indexOf(email) !== -1) {
          role = 'OWNER';
          isBootstrap = true;
          
          // Auto-seed: Criar o usuário no banco se for bootstrap bem-sucedido
          const { data: newUser, error: insertError } = await supabase
            .from('admin_users')
            .insert([{
              email: email,
              nome: payload.name || 'Bootstrap Admin',
              role: 'OWNER',
              ativo: true,
              criado_por: 'SYSTEM_BOOTSTRAP'
            }])
            .select()
            .single();
            
          if (!insertError && newUser) {
            adminUserId = newUser.id;
            console.log(`[Admin Auth] Seed de bootstrap realizado para: ${email}`);
          }
        }
      }

      // 4. Validação Final de Autorização
      if (!role) {
        console.warn(`[Admin Auth] Acesso negado: ${email} não é administrador.`);
        return res.status(403).json({
          success: false,
          error: 'Seu usuário Google não tem permissão para acessar esta área administrativa.'
        });
      }

      // 5. Verificação de Papéis (RBAC)
      if (allowedRoles.length > 0 && allowedRoles.indexOf(role) === -1) {
        console.warn(`[Admin Auth] Acesso negado por papel: ${email} possui papel ${role}, mas requer ${allowedRoles.join('/')}`);
        return res.status(403).json({
          success: false,
          error: `Acesso negado. Esta operação requer privilégios de ${allowedRoles.join(' ou ')}.`
        });
      }

      // 6. Atualizar último acesso (não bloqueante)
      if (adminUserId) {
        supabase.from('admin_users')
          .update({ ultimo_acesso_em: new Date().toISOString() })
          .eq('id', adminUserId)
          .then(() => {});
      }

      // 7. Anexar ao objeto req
      req.admin = {
        email: email,
        role: role,
        adminUserId: adminUserId,
        isBootstrap: isBootstrap,
        name: payload.name || null
      };

      // Compatibilidade com código legado (se houver)
      req.adminUser = req.admin;

      return next();
    } catch (err) {
      console.error('[Admin Auth] Erro interno:', err.message);
      return res.status(500).json({
        success: false,
        error: 'Erro interno ao validar autorização administrativa.'
      });
    }
  };
}

// Exportar o middleware padrão (qualquer admin ativo)
const authAdminGoogle = requireAdminGoogle();

module.exports = {
  authAdminGoogle,
  requireAdminGoogle
};
