const supabase = require('../config/supabase');

/**
 * Controller para gestão de administradores e auditoria.
 */
module.exports = {
  // Listar todos os administradores (OWNER ou ADMIN)
  async listar(req, res) {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('role', { ascending: true })
        .order('email', { ascending: true });

      if (error) throw error;

      res.json({ success: true, data });
    } catch (error) {
      console.error('Erro ao listar administradores:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Criar novo administrador (OWNER apenas)
  async criar(req, res) {
    try {
      const { email, nome, role, ativo } = req.body;
      const actor = req.admin;

      if (!email) {
        return res.status(400).json({ success: false, error: 'E-mail é obrigatório.' });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // 1. Criar usuário
      const { data, error } = await supabase
        .from('admin_users')
        .insert([{
          email: normalizedEmail,
          nome: nome || null,
          role: role || 'ADMIN',
          ativo: ativo !== false,
          criado_por: actor.email
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return res.status(400).json({ success: false, error: 'Este e-mail já está cadastrado como administrador.' });
        }
        throw error;
      }

      // 2. Auditoria
      await supabase.from('admin_audit_logs').insert([{
        actor_email: actor.email,
        action: 'CREATE_ADMIN',
        target_email: normalizedEmail,
        payload: { nome, role, ativo },
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        user_agent: req.headers['user-agent']
      }]);

      res.json({ success: true, message: 'Administrador criado com sucesso.', data });
    } catch (error) {
      console.error('Erro ao criar administrador:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Atualizar administrador (OWNER apenas)
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { nome, role, ativo } = req.body;
      const actor = req.admin;

      // 1. Buscar usuário atual
      const { data: currentUser, error: fetchError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !currentUser) {
        return res.status(404).json({ success: false, error: 'Administrador não encontrado.' });
      }

      // 2. Regra de Segurança: Não permitir desativar ou rebaixar o último OWNER
      if (currentUser.role === 'OWNER' && (role !== 'OWNER' || ativo === false)) {
        const { count } = await supabase
          .from('admin_users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'OWNER')
          .eq('ativo', true);

        if (count <= 1) {
          return res.status(400).json({ 
            success: false, 
            error: 'Operação negada. Não é possível desativar ou rebaixar o único OWNER ativo do sistema.' 
          });
        }
      }

      // 3. Atualizar
      const { data, error } = await supabase
        .from('admin_users')
        .update({
          nome: nome !== undefined ? nome : currentUser.nome,
          role: role !== undefined ? role : currentUser.role,
          ativo: ativo !== undefined ? ativo : currentUser.ativo
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // 4. Auditoria
      await supabase.from('admin_audit_logs').insert([{
        actor_email: actor.email,
        action: 'UPDATE_ADMIN',
        target_email: currentUser.email,
        payload: { nome, role, ativo },
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        user_agent: req.headers['user-agent']
      }]);

      res.json({ success: true, message: 'Administrador atualizado com sucesso.', data });
    } catch (error) {
      console.error('Erro ao atualizar administrador:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Deletar (Inativar) administrador (OWNER apenas)
  async deletar(req, res) {
    try {
      const { id } = req.params;
      const actor = req.admin;

      // 1. Buscar usuário atual
      const { data: currentUser, error: fetchError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !currentUser) {
        return res.status(404).json({ success: false, error: 'Administrador não encontrado.' });
      }

      // 2. Regra de Segurança: Não permitir remover o último OWNER
      if (currentUser.role === 'OWNER') {
        const { count } = await supabase
          .from('admin_users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'OWNER')
          .eq('ativo', true);

        if (count <= 1) {
          return res.status(400).json({ 
            success: false, 
            error: 'Operação negada. Não é possível remover o único OWNER ativo do sistema.' 
          });
        }
      }

      // 3. Soft Delete (Inativar)
      const { error } = await supabase
        .from('admin_users')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;

      // 4. Auditoria
      await supabase.from('admin_audit_logs').insert([{
        actor_email: actor.email,
        action: 'DELETE_ADMIN',
        target_email: currentUser.email,
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        user_agent: req.headers['user-agent']
      }]);

      res.json({ success: true, message: 'Administrador inativado com sucesso.' });
    } catch (error) {
      console.error('Erro ao deletar administrador:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Diagnóstico de Autenticação
  async diagnostico(req, res) {
    res.json({
      success: true,
      auth: {
        email: req.admin.email,
        name: req.admin.name,
        role: req.admin.role,
        adminUserId: req.admin.adminUserId,
        isBootstrap: req.admin.isBootstrap,
        source: req.admin.isBootstrap ? 'bootstrap' : 'database'
      },
      message: 'Autorização administrativa validada com sucesso.',
      timestamp: new Date().toISOString()
    });
  }
};
