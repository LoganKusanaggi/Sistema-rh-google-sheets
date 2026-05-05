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
        const { email, name } = req.authUser;

        // 1. Verificar no Banco de Dados
        let { data: adminUser, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', email)
          .eq('ativo', true)
          .single();

        let role = adminUser ? adminUser.role : null;
        let isBootstrap = false;
        let adminUserId = adminUser ? adminUser.id : null;

        // 2. Fallback de Bootstrap (Emergência)
        if (!adminUser) {
          // Verificar se existem OWNERS ativos no banco
          const { count } = await supabase
            .from('admin_users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'OWNER')
            .eq('ativo', true);

          const bootstrapEmails = getBootstrapEmails();
          
          if ((count === 0 || count === null) && bootstrapEmails.indexOf(email) !== -1) {
            role = 'OWNER';
            isBootstrap = true;
            
            // Auto-seed
            const { data: newUser, error: insertError } = await supabase
              .from('admin_users')
              .insert([{
                email: email,
                nome: name || 'Bootstrap Admin',
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

        // 3. Validação Final de Autorização Admin
        if (!role) {
          console.warn(`[Admin Auth] Acesso negado: ${email} não é administrador.`);
          return res.status(403).json({
            success: false,
            error: 'Seu usuário Google não tem permissão para acessar esta área administrativa.'
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

        // 5. Atualizar último acesso
        if (adminUserId) {
          supabase.from('admin_users')
            .update({ ultimo_acesso_em: new Date().toISOString() })
            .eq('id', adminUserId)
            .then(() => {});
        }

        // 6. Anexar ao objeto req.admin
        req.admin = {
          email: email,
          role: role,
          adminUserId: adminUserId,
          isBootstrap: isBootstrap,
          name: name
        };

        return next();
      } catch (err) {
        console.error('[Admin Auth] Erro interno:', err.message);
        return res.status(500).json({
          success: false,
          error: 'Erro interno ao validar autorização administrativa.'
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
