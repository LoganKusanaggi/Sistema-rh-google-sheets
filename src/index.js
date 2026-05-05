require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração de ambiente
const isProduction = process.env.NODE_ENV === 'production';

// Middlewares
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware (Seguro para produção)
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// FIX EMERGÊNCIA: Rota explícita PRIORITÁRIA para dependentes
const dependentesController = require('./controllers/dependentesController');
app.put('/api/dependentes/:id', dependentesController.atualizar);

// Montagem Principal das Rotas
app.use('/api', routes);

// Rota raiz / status
app.get('/', (req, res) => {
    res.json({
        success: true,
        status: 'online',
        message: 'API Sistema RH - v2.2 ACTIVE ADMIN',
        version: '2.2.0',
        timestamp: new Date().toISOString()
    });
});

// 404 Handler - Padronizado
app.use((req, res) => {
    console.warn(`[404] ${req.method} ${req.path} - Endpoint não encontrado`);
    res.status(404).json({
        success: false,
        error: 'Endpoint não encontrado',
        path: req.path,
        method: req.method
    });
});

// Global Error Handler - Padronizado
app.use((err, req, res, next) => {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err);
    
    const statusCode = err.status || 500;
    const message = err.message || 'Erro interno do servidor';

    res.status(statusCode).json({
        success: false,
        error: message,
        ...( !isProduction && { stack: err.stack, details: err })
    });
});

// Iniciar servidor local
if (!isProduction) {
    app.listen(PORT, () => {
        console.log('===============================================');
        console.log('🚀 API Sistema RH v2.2 - ONLINE (LOCAL)');
        console.log('===============================================');
        console.log(`📍 URL: http://localhost:${PORT}`);
        console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
        console.log('===============================================');
    });
}

module.exports = app;
