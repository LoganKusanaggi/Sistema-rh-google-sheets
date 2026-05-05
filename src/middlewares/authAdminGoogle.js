const supabase = require('../config/supabase');
const { validateGoogleIdentity } = require('./authGoogleIdentity');

/**
 * Obtém a lista de e-mails de bootstrap a partir das variáveis de ambiente.
 */
function getBootstrapEmails() {
  const bootstrap = process.env.ADMIN_BOOTSTRAP_EMAILS || process.env.ADMIN_ALLOWED_EMAILS || '';
  return String(bootstrap)
    .split(',')
    .map(function (email) { return email.trim().toLowerCase(); })
    .filter(Boolean);
}

/**
 * Middleware de autorização Admin que complementa a identidade Google.
 * Exige que o usuário seja um administrador cadastrado ou esteja no bootstrap.
 * 
 * @param {string[]} allowedRoles - Lista de papéis permitidos (OWNER, ADMIN, VIEWER)
 */
function requireAdminGoogle(allowedRoles = []) {
  return [
    validateGoogleIdentity, // Primeiro valida a identidade Google
    async function (req, res, next) {
      try {
        const { email, name, sub } = req.authUser;

        // 1. Verificar no Banco de Dados
        let { data: user, error } = await supabase
          .from('system_users')
          .select('*')
          .eq('email', email)
          .eq('status', 'ACTIVE')
          .single();

        let role = user ? user.role : null;
        let isBootstrap = false;
        let userId = user ? user.id : null;

        // 2. Fallback de Bootstrap (Emergência)
        if (!user) {
          // Verificar se existem OWNERS ativos no banco
          const { count } = await supabase
            .from('system_users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'OWNER')
            .eq('status', 'ACTIVE');

          const bootstrapEmails = getBootstrapEmails();
          
          if ((count === 0 || count === null) && bootstrapEmails.indexOf(email) !== -1) {
            role = 'OWNER';
            isBootstrap = true;
            
            // Auto-seed
            const { data: newUser, error: insertError } = await supabase
              .from('system_users')
              .insert([{
                email: email,
                google_sub: sub,
                role: 'OWNER',
                status: 'ACTIVE'
              }])
              .select()
              .single();
              
            if (!insertError && newUser) {
              userId = newUser.id;
              console.log(`[Admin Auth] Seed de bootstrap realizado para: ${email}`);
            }
          }
        }

        // 3. Validação Final de Autorização Admin
        if (!role) {
          console.warn(`[Admin Auth] Acesso negado: ${email} não é usuário do sistema.`);
          return res.status(403).json({
            success: false,
            error: 'Seu usuário Google não está autorizado a acessar este sistema.'
          });
        }

        // 4. Verificação de Papéis (RBAC)
        if (allowedRoles.length > 0 && allowedRoles.indexOf(role) === -1) {
          console.warn(`[Admin Auth] Acesso negado por papel: ${email} possui papel ${role}, mas requer ${allowedRoles.join('/')}`);
          return res.status(403).json({
            success: false,
            error: `Acesso negado. Esta operação requer privilégios de ${allowedRoles.join(' ou ')}.`
          });
        }

        // 5. Atualizar último acesso e Google Sub se necessário
        if (userId) {
          const updates = { last_login_at: new Date().toISOString() };
          if (!user?.google_sub && sub) updates.google_sub = sub;

          supabase.from('system_users')
            .update(updates)
            .eq('id', userId)
            .then(() => {});
        }

        // 6. Anexar ao objeto req.admin (para compatibilidade) e req.user
        req.admin = {
          email: email,
          role: role,
          userId: userId,
          isBootstrap: isBootstrap,
          name: name,
          tenant_id: user?.tenant_id || 'default'
        };

        req.systemUser = req.admin;

        return next();
      } catch (err) {
        console.error('[Admin Auth] Erro interno:', err.message);
        
        // Verificar se é erro de tabela inexistente (comum se a migração 009 não foi rodada)
        if (err.message && (err.message.includes('relation "system_users" does not exist') || err.code === 'PGRST116')) {
           return res.status(500).json({
            success: false,
            error: 'Infraestrutura: A tabela de usuários (system_users) não foi encontrada.',
            details: 'Por favor, execute a migração SQL 009 no painel do Supabase para ativar o novo sistema de convites.'
          });
        }

        return res.status(500).json({
          success: false,
          error: 'Erro interno ao validar autorização: ' + err.message
        });
      }
    }
  ];
}

// Exportar o middleware padrão (qualquer admin ativo)
const authAdminGoogle = requireAdminGoogle();

module.exports = {
  authAdminGoogle,
  requireAdminGoogle
};
