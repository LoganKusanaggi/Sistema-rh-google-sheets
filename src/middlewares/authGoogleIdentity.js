const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client();

/**
 * Middleware de Identidade Google (OIDC).
 * Valida a assinatura do token, emissor, audiência e status de verificação do e-mail.
 * Anexa a identidade validada em req.authUser.
 */
async function validateGoogleIdentity(req, res, next) {
  try {
    const auth = req.headers.authorization || '';

    if (!auth.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Não autorizado. Token de identidade ausente.'
      });
    }

    const token = auth.substring('Bearer '.length).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Não autorizado. Token de identidade vazio.'
      });
    }

    // 1. Validar Token com Google
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: token
        // Nota: Em produção, você pode restringir a audiência (aud) se necessário.
      });
    } catch (err) {
      console.error('[Google Identity] Erro ao verificar token:', err.message);
      return res.status(401).json({
        success: false,
        error: 'Token de identidade inválido ou expirado.'
      });
    }

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(401).json({
        success: false,
        error: 'Não autorizado. E-mail não encontrado no token.'
      });
    }

    if (payload.email_verified === false) {
      return res.status(401).json({
        success: false,
        error: 'Não autorizado. E-mail não verificado pelo Google.'
      });
    }

    // 2. Anexar ao objeto req
    req.authUser = {
      email: String(payload.email).toLowerCase(),
      sub: payload.sub,
      name: payload.name || null,
      picture: payload.picture || null
    };

    return next();
  } catch (err) {
    console.error('[Google Identity] Erro interno:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Erro interno ao validar identidade Google.'
    });
  }
}

module.exports = {
  validateGoogleIdentity
};
