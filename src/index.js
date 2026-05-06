require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bootDiagnostics = require('./utils/bootDiagnostics');
const listExpressRoutes = require('./utils/listExpressRoutes');

// 1. Captura de Erros Globais do Processo
process.on('unhandledRejection', (reason, promise) => {
    bootDiagnostics.recordRuntimeError('unhandledRejection', reason instanceof Error ? reason : new Error(String(reason)));
});

process.on('uncaughtException', (err) => {
    bootDiagnostics.recordRuntimeError('uncaughtException', err);
    // Em Vercel, uncaughtException não mata o processo imediatamente se for capturado, 
    // mas o estado pode estar corrompido.
});

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// 2. Middlewares Básicos (Sempre Seguros)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
    req.requestId = req.headers['x-vercel-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${req.requestId}] ${req.method} ${req.path}`);
    next();
});

// 3. Endpoints de Diagnóstico Prioritários (Carregados antes das rotas de negócio)
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: bootDiagnostics.routeModuleLoadError ? 'degraded' : 'online',
        timestamp: new Date().toISOString(),
        version: bootDiagnostics.appVersion,
        requestId: req.requestId,
        diagnostics: {
            env: bootDiagnostics.envPresence,
            routerLoaded: bootDiagnostics.routerLoaded,
            hasRouteLoadError: !!bootDiagnostics.routeModuleLoadError
        }
    });
});

app.get('/api/_debug/boot', (req, res) => {
    // Proteção por variável de ambiente ou OIDC (simplificado para debug inicial)
    const debugEnabled = process.env.DEBUG_DIAGNOSTICS_ENABLED === 'true';
    
    if (!debugEnabled) {
        return res.status(403).json({ success: false, error: 'Acesso negado. DEBUG_DIAGNOSTICS_ENABLED deve ser true.' });
    }

    res.json({
        success: true,
        requestId: req.requestId,
        data: {
            ...bootDiagnostics,
            registeredRoutes: listExpressRoutes(app)
        }
    });
});

app.get('/api/_debug/db', async (req, res) => {
    const debugEnabled = process.env.DEBUG_DIAGNOSTICS_ENABLED === 'true';
    if (!debugEnabled) {
        return res.status(403).json({ success: false, error: 'Acesso negado.' });
    }

    const checks = [];
    let success = true;

    try {
        // Teste 1: Presença de Envs
        checks.push({ name: 'env_presence', status: bootDiagnostics.envPresence.SUPABASE_URL && (bootDiagnostics.envPresence.SUPABASE_SERVICE_KEY || bootDiagnostics.envPresence.SUPABASE_SERVICE_ROLE_KEY) });

        // Teste 2: Inicialização Lazy
        const supabase = require('./config/supabase');
        checks.push({ name: 'client_initialization', status: !!supabase });

        // Teste 3: Query Leve (system_users)
        const { data, error } = await supabase.from('system_users').select('id').limit(1);
        if (error) throw error;
        checks.push({ name: 'query_execution', status: true, data_found: !!data });

    } catch (err) {
        success = false;
        checks.push({ name: 'error', status: false, message: err.message });
    }

    res.json({ success, requestId: req.requestId, checks });
});

// 4. Carregamento Seguro das Rotas de Negócio
try {
    const routes = require('./routes');
    app.use('/api', routes);
    bootDiagnostics.routerLoaded = true;
    bootDiagnostics.routeModuleLoadStatus = 'success';
} catch (err) {
    bootDiagnostics.routeModuleLoadStatus = 'failed';
    bootDiagnostics.routeModuleLoadError = {
        message: err.message,
        stack: process.env.DEBUG_DIAGNOSTICS_ENABLED === 'true' ? err.stack : 'Stack oculta'
    };
    console.error('[Critical] Falha ao carregar rotas de negócio:', err);
    
    // Fallback: Registrar uma rota de erro para todas as chamadas /api/...
    app.use('/api', (req, res) => {
        res.status(503).json({
            success: false,
            error: 'Serviço em estado degradado devido a falha crítica na inicialização.',
            requestId: req.requestId,
            diagnostics: {
                moduleLoadError: bootDiagnostics.routeModuleLoadError.message
            }
        });
    });
}

// 5. Rota raiz
app.get('/', (req, res) => {
    res.json({
        success: true,
        status: bootDiagnostics.routerLoaded ? 'online' : 'degraded',
        message: 'API Sistema RH - Diagnostics Layer Active',
        version: bootDiagnostics.appVersion,
        timestamp: new Date().toISOString()
    });
});

// 6. Handlers de Erro e 404 (Sempre JSON)
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint não encontrado',
        requestId: req.requestId,
        path: req.path,
        method: req.method
    });
});

app.use((err, req, res, next) => {
    console.error(`[ERROR] [${req.requestId || 'unknown'}] ${req.method} ${req.path}:`, err);
    
    const statusCode = err.status || 500;
    const message = err.message || 'Erro interno do servidor';

    res.status(statusCode).json({
        success: false,
        error: message,
        requestId: req.requestId,
        code: err.code || 'INTERNAL_SERVER_ERROR',
        ...( !isProduction && { stack: err.stack, details: err })
    });
});

// 7. Iniciar servidor local
if (!isProduction) {
    app.listen(PORT, () => {
        console.log('===============================================');
        console.log('🚀 API Sistema RH - DIAGNOSTICS ACTIVE (LOCAL)');
        console.log('===============================================');
        console.log(`📍 URL: http://localhost:${PORT}`);
        console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
        console.log('===============================================');
    });
}

module.exports = app;


