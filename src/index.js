require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// FIX EMERGÊNCIA: Rota explícita PRIORITÁRIA para dependentes
// Deve vir ANTES de app.use('/api', routes) para garantir que capture
const dependentesController = require('./controllers/dependentesController');
app.put('/api/dependentes/:id', (req, res, next) => {
    console.log('[DEBUG INDEX TOP] Acessou PUT /api/dependentes/' + req.params.id);
    next();
}, dependentesController.atualizar);

// Rotas Gerais
app.use('/api', routes);

// Rota raiz
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        message: 'API Sistema RH - v2.1 FIX ROUTING',
        version: '2.1.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            colaboradores: '/api/colaboradores',
            folha: '/api/folha',
            beneficios: '/api/beneficios',
            variavel: '/api/variavel',
            apontamentos: '/api/apontamentos',
            seguros: '/api/seguros',
            relatorios: '/api/relatorios/gerar'
        }
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        error: true,
        message: 'Endpoint não encontrado',
        path: req.path,
        method: req.method
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('Erro:', err);
    res.status(err.status || 500).json({
        error: true,
        message: err.message || 'Erro interno do servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Iniciar servidor
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log('===============================================');
        console.log('🚀 API Sistema RH v2.0 - ONLINE');
        console.log('===============================================');
        console.log(`📍 URL: http://localhost:${PORT}`);
        console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
        console.log(`⏰ Iniciado em: ${new Date().toLocaleString('pt-BR')}`);
        console.log('===============================================');
        console.log('Endpoints disponíveis:');
        console.log('  GET  /');
        console.log('  GET  /api/health');
        console.log('  POST /api/colaboradores/buscar');
        console.log('  POST /api/relatorios/gerar');
        console.log('  GET  /api/relatorios/tipos');
        console.log('===============================================');
    });
}

module.exports = app;
