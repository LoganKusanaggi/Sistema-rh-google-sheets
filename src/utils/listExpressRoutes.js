/**
 * Helper para listar rotas registradas no Express.
 * Útil para diagnosticar problemas de roteamento em produção.
 */
function listExpressRoutes(appOrRouter) {
  const routes = [];

  function processLayer(layer, prefix = '') {
    if (layer.route) {
      const path = prefix + layer.route.path;
      const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());
      routes.push({ methods, path });
    } else if (layer.name === 'router' && layer.handle.stack) {
      const newPrefix = prefix + (layer.regexp.source.replace('\\/?(?=\\/|$)', '').replace('^', '').replace('\\', ''));
      layer.handle.stack.forEach(l => processLayer(l, newPrefix));
    }
  }

  const stack = appOrRouter.stack || (appOrRouter._router && appOrRouter._router.stack);
  
  if (stack) {
    stack.forEach(layer => processLayer(layer));
  }

  return routes;
}

module.exports = listExpressRoutes;
