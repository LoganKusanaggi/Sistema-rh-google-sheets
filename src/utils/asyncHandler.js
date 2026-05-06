/**
 * Wrapper para rotas assíncronas do Express.
 * Garante que qualquer erro seja capturado e enviado ao handler global.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    // Anexa metadados úteis para o log
    err.requestId = req.headers['x-vercel-id'] || `req-${Date.now()}`;
    err.path = req.path;
    err.method = req.method;
    next(err);
  });
};

module.exports = asyncHandler;
