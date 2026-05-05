const crypto = require('crypto');
const supabase = require('../config/supabase');
const emailService = require('../services/emailService');

/**
 * Controlador para gestão de convites de usuários.
 */
const invitationController = {
  /**
   * Cria um novo convite.
   */
  async create(req, res) {
    try {
      const { email: invitedEmail, role, tenant_id = 'default' } = req.body;
      const { email: adminEmail, role: adminRole } = req.admin;

      // Validação de hierarquia
      if (role === 'OWNER' && adminRole !== 'OWNER') {
        return res.status(403).json({
          success: false,
          error: 'Apenas um OWNER pode convidar outro OWNER.'
        });
      }

      const normalizedEmail = String(invitedEmail).toLowerCase().trim();

      // Verificar se usuário já existe
      const { data: existingUser } = await supabase
        .from('system_users')
        .select('id')
        .eq('email', normalizedEmail)
        .eq('tenant_id', tenant_id)
        .single();

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Este usuário já está cadastrado no sistema.'
        });
      }

      // Gerar token seguro
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Salvar convite
      const { data: invitation, error: invError } = await supabase
        .from('user_invitations')
        .insert([{
            tenant_id,
            email: normalizedEmail,
            role,
            token_hash: tokenHash,
            invited_by_email: adminEmail,
            status: 'PENDING',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dias
        }])
        .select()
        .single();

      if (invError) throw invError;

      // Auditoria
      console.log(`[Audit] Convite criado para ${normalizedEmail} por ${adminEmail}`);

      // Preparar payload de entrega para o Apps Script
      const baseUrl = process.env.INVITATION_BASE_URL || 'https://docs.google.com/spreadsheets/d/SEU_ID';
      const invitationLink = `${baseUrl}?invite_token=${token}`;

      return res.json({
        success: true,
        message: 'Convite criado com sucesso. O token foi gerado para entrega.',
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          expires_at: invitation.expires_at,
          plaintext_token: token, // Retornado apenas uma vez aqui
          delivery: {
            subject: 'Convite para acessar o Sistema RH',
            body: `Olá,\n\nVocê foi convidado para acessar o Sistema RH com o papel de ${role}.\n\nPara aceitar o convite e ativar seu acesso, utilize o link abaixo:\n${invitationLink}\n\nOU utilize o código de ativação manualmente na planilha:\nCódigo: ${token}\n\nUse obrigatoriamente o e-mail ${normalizedEmail} para acessar via Google.\n\nSe você não esperava este convite, ignore este e-mail.`,
            html: `<div style="font-family:sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;border:1px solid #eee;padding:20px;border-radius:10px;">
              <h2 style="color:#2563eb;">Olá!</h2>
              <p>Você foi convidado para acessar o <strong>Sistema RH</strong>.</p>
              <p>Clique no botão abaixo para aceitar o convite e ativar seu acesso:</p>
              <div style="text-align:center;margin:30px 0;">
                <a href="${invitationLink}" style="background-color:#2563eb;color:white;padding:12px 24px;text-decoration:none;border-radius:5px;font-weight:bold;display:inline-block;">Aceitar Convite</a>
              </div>
              <p>Ou utilize o código abaixo no menu <strong>"Ativar Convite"</strong> da planilha:</p>
              <code style="display:block;background:#f1f5f9;padding:10px;border-radius:5px;text-align:center;font-weight:bold;">${token}</code>
              <p style="font-size:0.9em;color:#666;margin-top:20px;">Use o e-mail <strong>${normalizedEmail}</strong>.</p>
            </div>`
          }
        }
      });
    } catch (err) {
      console.error('[Invitation Create] Erro:', err.message);
      return res.status(500).json({
        success: false,
        error: 'Erro ao criar convite.'
      });
    }
  },

  /**
   * Lista convites do tenant.
   */
  async list(req, res) {
    try {
      const { tenant_id } = req.admin;

      const { data: invitations, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('tenant_id', tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.json({
        success: true,
        data: invitations
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Erro ao listar convites.' });
    }
  },

  /**
   * Aceita um convite.
   */
  async accept(req, res) {
    try {
      const { token } = req.body;
      const { email: googleEmail, sub: googleSub, email_verified } = req.authUser;

      if (!email_verified) {
        return res.status(403).json({ success: false, error: 'E-mail Google não verificado.' });
      }

      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Buscar convite
      const { data: invitation, error: invError } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('token_hash', tokenHash)
        .eq('status', 'PENDING')
        .single();

      if (invError || !invitation) {
        return res.status(404).json({ success: false, error: 'Convite inválido ou já utilizado.' });
      }

      // Validar expiração
      if (new Date(invitation.expires_at) < new Date()) {
        await supabase.from('user_invitations').update({ status: 'EXPIRED' }).eq('id', invitation.id);
        return res.status(400).json({ success: false, error: 'Convite expirado.' });
      }

      // Validar e-mail do token vs convite
      if (googleEmail.toLowerCase() !== invitation.email.toLowerCase()) {
        return res.status(403).json({
          success: false,
          error: `Este convite foi enviado para ${invitation.email}, mas você está logado como ${googleEmail}.`
        });
      }

      // 1. Criar Usuário
      const { error: userError } = await supabase
        .from('system_users')
        .insert([{
          tenant_id: invitation.tenant_id,
          email: invitation.email,
          google_sub: googleSub,
          role: invitation.role,
          status: 'ACTIVE'
        }]);

      if (userError) throw userError;

      // 2. Marcar convite como aceito
      await supabase
        .from('user_invitations')
        .update({
          status: 'ACCEPTED',
          accepted_by_google_sub: googleSub,
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      return res.json({
        success: true,
        message: 'Convite aceito com sucesso. Bem-vindo ao Sistema RH!'
      });
    } catch (err) {
      console.error('[Invitation Accept] Erro:', err.message);
      return res.status(500).json({ success: false, error: 'Erro ao processar aceite de convite.' });
    }
  },

  /**
   * Revoga um convite.
   */
  async revoke(req, res) {
    try {
        const { id } = req.params;
        const { tenant_id } = req.admin;

        const { error } = await supabase
            .from('user_invitations')
            .update({ status: 'REVOKED' })
            .eq('id', id)
            .eq('tenant_id', tenant_id)
            .eq('status', 'PENDING');

        if (error) throw error;

        return res.json({ success: true, message: 'Convite revogado.' });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Erro ao revogar convite.' });
    }
  }
};

module.exports = invitationController;
