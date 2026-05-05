const supabase = require('../config/supabase');

/**
 * Controller para gestão da pasta de relatórios do usuário autenticado.
 */
module.exports = {
  // Obter a configuração da pasta do usuário logado
  async obterMinhaPasta(req, res) {
    try {
      const { email } = req.authUser;
      const tenant_id = req.query.tenant_id || 'default';

      const { data, error } = await supabase
        .from('user_report_folders')
        .select('*')
        .eq('user_email', email)
        .eq('tenant_id', tenant_id)
        .eq('is_active', true)
        .eq('is_default', true)
        .maybeSingle();

      if (error) throw error;

      res.json({
        success: true,
        data: data || null
      });
    } catch (error) {
      console.error('Erro ao obter pasta do usuário:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Salvar/Atualizar a configuração da pasta do usuário logado
  async salvarMinhaPasta(req, res) {
    try {
      const { email, sub, name } = req.authUser;
      const { folder_id, folder_url, folder_name, tenant_id = 'default' } = req.body;

      if (!folder_id || !folder_url) {
        return res.status(400).json({
          success: false,
          error: 'ID e URL da pasta são obrigatórios.'
        });
      }

      // 1. Inativar pastas anteriores deste usuário neste tenant
      const { error: updateError } = await supabase
        .from('user_report_folders')
        .update({ is_active: false, is_default: false })
        .eq('user_email', email)
        .eq('tenant_id', tenant_id);

      if (updateError) throw updateError;

      // 2. Inserir nova configuração
      const { data, error: insertError } = await supabase
        .from('user_report_folders')
        .insert([{
          tenant_id,
          user_email: email,
          google_sub: sub,
          folder_id,
          folder_url,
          folder_name,
          is_active: true,
          is_default: true,
          verified_at: new Date().toISOString(),
          created_by_email: email,
          updated_by_email: email
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // 3. Auditoria (Opcional, mas recomendado)
      try {
        await supabase.from('admin_audit_logs').insert([{
          actor_email: email,
          action: 'UPDATE_USER_FOLDER',
          target_email: email,
          payload: { folder_id, folder_name, tenant_id },
          ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
        }]);
      } catch (auditErr) {
        console.warn('Falha ao registrar auditoria de pasta:', auditErr.message);
      }

      res.json({
        success: true,
        message: 'Configuração de pasta salva com sucesso.',
        data
      });
    } catch (error) {
      console.error('Erro ao salvar pasta do usuário:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};
