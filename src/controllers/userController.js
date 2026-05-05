const supabase = require('../config/supabase');

/**
 * Controlador para informações do usuário logado.
 */
const userController = {
  /**
   * Retorna o perfil do usuário autenticado via Google.
   */
  async getProfile(req, res) {
    try {
      const { email, sub } = req.authUser;

      // Buscar usuário na tabela de sistema
      const { data: user, error } = await supabase
        .from('system_users')
        .select('email, google_sub, role, tenant_id, status, created_at')
        .eq('email', email)
        .eq('status', 'ACTIVE')
        .single();

      if (error || !user) {
        return res.status(403).json({
          success: false,
          error: 'Usuário não autorizado. Solicite um convite ao administrador.'
        });
      }

      // Verificar se já possui pasta de relatórios configurada
      const { data: folder } = await supabase
        .from('user_report_folders')
        .select('id')
        .eq('user_email', email)
        .eq('tenant_id', user.tenant_id)
        .eq('is_active', true)
        .limit(1)
        .single();

      return res.json({
        success: true,
        user: {
          ...user,
          needs_report_folder_setup: !folder
        }
      });
    } catch (err) {
      console.error('[User Profile] Erro:', err.message);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar perfil do usuário.'
      });
    }
  }
};

module.exports = userController;
