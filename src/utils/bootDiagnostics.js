/**
 * Módulo de Diagnóstico de Boot - Sistema RH
 * Rastreia o estado da aplicação durante o carregamento inicial e runtime.
 * NÃO EXPÕE VALORES SECRETOS.
 */

const bootDiagnostics = {
  appStartedAt: new Date().toISOString(),
  nodeEnv: process.env.NODE_ENV || 'development',
  vercelEnv: process.env.VERCEL_ENV || 'local',
  vercelRegion: process.env.VERCEL_REGION || 'unknown',
  appVersion: process.env.npm_package_version || '2.2.1',
  
  // Metadados de Deploy
  gitMetadata: {
    commit: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    branch: process.env.VERCEL_GIT_COMMIT_REF || 'unknown',
    message: process.env.VERCEL_GIT_COMMIT_MESSAGE || 'unknown'
  },

  // Presença de Variáveis (Booleans)
  envPresence: {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    ADMIN_BOOTSTRAP_EMAILS: !!process.env.ADMIN_BOOTSTRAP_EMAILS,
    ADMIN_ALLOWED_EMAILS: !!process.env.ADMIN_ALLOWED_EMAILS,
    INVITATION_BASE_URL: !!process.env.INVITATION_BASE_URL,
    RESEND_API_KEY: !!process.env.RESEND_API_KEY
  },

  // Status de Carregamento
  routerLoaded: false,
  routeModuleLoadStatus: 'pending',
  routeModuleLoadError: null,
  
  // Inventário de Módulos
  loadedControllers: [],
  failedControllers: [],

  // Erros de Runtime
  lastUnhandledRejection: null,
  lastUncaughtException: null,

  /**
   * Registra um erro fatal ocorrido fora do fluxo de requisição.
   */
  recordRuntimeError(type, err) {
    const summary = {
      timestamp: new Date().toISOString(),
      message: err.message,
      stack: process.env.DEBUG_DIAGNOSTICS_ENABLED === 'true' ? err.stack : 'Stack oculta (DEBUG_DIAGNOSTICS_ENABLED=false)'
    };

    if (type === 'unhandledRejection') {
      this.lastUnhandledRejection = summary;
    } else {
      this.lastUncaughtException = summary;
    }
    
    console.error(`[BootDiagnostics] ${type}:`, err);
  },

  /**
   * Registra o sucesso de carregamento de um controlador.
   */
  recordControllerSuccess(name) {
    this.loadedControllers.push({ name, timestamp: new Date().toISOString() });
  },

  /**
   * Registra falha de carregamento de um controlador.
   */
  recordControllerFailure(name, error) {
    this.failedControllers.push({
      name,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = bootDiagnostics;
