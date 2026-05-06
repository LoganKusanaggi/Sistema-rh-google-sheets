/**
 * Serviço de e-mail transacional.
 * Atualmente configurado para usar Resend.
 */
let Resend;
try {
  Resend = require('resend').Resend;
} catch (e) {
  console.warn('[Email Service] Biblioteca "resend" não encontrada. O serviço de e-mail estará desabilitado.');
}

const resend = (Resend && process.env.RESEND_API_KEY) ? new Resend(process.env.RESEND_API_KEY) : null;


const emailService = {
  /**
   * Envia um convite por e-mail.
   */
  async sendInvitation(email, role, token) {
    if (!resend) {
      console.warn('[Email Service] RESEND_API_KEY não configurada. E-mail não enviado.');
      console.log(`[DEBUG] Convite para ${email} | Role: ${role} | Token: ${token}`);
      return { success: false, error: 'Provedor de e-mail não configurado.' };
    }

    const baseUrl = process.env.INVITATION_BASE_URL || 'https://docs.google.com/spreadsheets/d/SEU_ID_DA_PLANILHA';
    const invitationLink = `${baseUrl}?invite_token=${token}`;
    const fromEmail = process.env.INVITATION_EMAIL_FROM || 'onboarding@resend.dev';

    try {
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Convite para acessar o Sistema RH',
        html: `
          <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
            <h2 style="color: #2563eb;">Olá!</h2>
            <p>Você foi convidado para acessar o <strong>Sistema RH</strong>.</p>
            <p>Clique no link abaixo para aceitar o convite e ativar seu acesso:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Aceitar Convite</a>
            </div>
            <p>Use obrigatoriamente o e-mail <strong>${email}</strong> para acessar via Google.</p>
            <p style="font-size: 0.9em; color: #666;">Após o primeiro acesso, você deverá configurar sua pasta de relatórios no Google Drive.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 0.8em; color: #999;">Se você não esperava este convite, ignore este e-mail.</p>
          </div>
        `
      });

      if (error) {
        console.error('[Email Service] Erro Resend:', error);
        return { success: false, error: error.message };
      }

      return { success: true, messageId: data.id };
    } catch (err) {
      console.error('[Email Service] Erro:', err.message);
      return { success: false, error: err.message };
    }
  }
};

module.exports = emailService;
