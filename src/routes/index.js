const express = require('express');
const router = express.Router();

// Controllers
const colaboradorController = require('../controllers/colaboradorController');
const folhaController = require('../controllers/folhaController');
const beneficiosController = require('../controllers/beneficiosController');
const variavelController = require('../controllers/variavelController');
const apontamentosController = require('../controllers/apontamentosController');
const segurosController = require('../controllers/segurosController');
const relatoriosController = require('../controllers/relatoriosController');
const planosController = require('../controllers/planosController');
const dashboardController = require('../controllers/dashboardController');
const adminUserController = require('../controllers/adminUserController');
const userReportFolderController = require('../controllers/userReportFolderController');

// Middlewares
const { authAdminGoogle, requireAdminGoogle } = require('../middlewares/authAdminGoogle');
const { validateGoogleIdentity } = require('../middlewares/authGoogleIdentity');

// Rotas Externas
const dependentesRoutes = require('./dependentesRoutes');

// 1. ROTAS PÚBLICAS / SISTEMA (Sem proteção admin)
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'online',
        timestamp: new Date().toISOString(),
        version: '2.1.0'
    });
});

// 1.1 ROTAS DE USUÁRIO AUTENTICADO (Qualquer usuário com Google Identity)
router.get('/me/report-folder', validateGoogleIdentity, userReportFolderController.obterMinhaPasta);
router.post('/me/report-folder', validateGoogleIdentity, userReportFolderController.salvarMinhaPasta);

// 2. ROTAS DE NEGÓCIO (Colaboradores, Folha, etc.)
router.get('/colaboradores', colaboradorController.listarTodos);
router.get('/colaboradores/:cpf', colaboradorController.buscarPorCPF);
router.post('/colaboradores', colaboradorController.criar);
router.put('/colaboradores/:cpf', colaboradorController.atualizar);
router.delete('/colaboradores/:cpf', colaboradorController.deletar);
router.post('/colaboradores/batch', colaboradorController.criarEmLote);
router.post('/colaboradores/buscar', relatoriosController.buscarComFiltros);

// Dependentes (Usa o router aninhado)
router.use('/', dependentesRoutes);

// Folha
router.get('/folha', folhaController.listarTodas);
router.get('/folha/:cpf', folhaController.buscarPorCPF);
router.get('/folha/:cpf/:ano/:mes', folhaController.buscarPorPeriodo);
router.post('/folha', folhaController.criar);
router.put('/folha/:id', folhaController.atualizar);
router.delete('/folha/:id', folhaController.deletar);
router.post('/folha/batch', folhaController.criarEmLote);

// Benefícios
router.get('/beneficios', beneficiosController.listarTodos);
router.get('/beneficios/:cpf', beneficiosController.buscarPorCPF);
router.get('/beneficios/:cpf/:ano/:mes', beneficiosController.buscarPorPeriodo);
router.post('/beneficios', beneficiosController.criar);
router.put('/beneficios/:id', beneficiosController.atualizar);
router.delete('/beneficios/:id', beneficiosController.deletar);
router.post('/beneficios/batch', beneficiosController.criarEmLote);

// Variável
router.get('/variavel', variavelController.listarTodos);
router.get('/variavel/:cpf', variavelController.buscarPorCPF);
router.post('/variavel', variavelController.criar);
router.put('/variavel/:id', variavelController.atualizar);
router.post('/variavel/batch', variavelController.criarEmLote);

// Apontamentos
router.get('/apontamentos', apontamentosController.listarTodos);
router.get('/apontamentos/:cpf', apontamentosController.buscarPorCPF);
router.post('/apontamentos', apontamentosController.criar);
router.put('/apontamentos/:id', apontamentosController.atualizar);
router.post('/apontamentos/batch', apontamentosController.criarEmLote);

// Seguros
router.get('/seguros', segurosController.listarTodos);
router.get('/seguros/:cpf', segurosController.buscarPorCPF);
router.post('/seguros', segurosController.criar);
router.put('/seguros/:id', segurosController.atualizar);

// Planos (Catálogo Público para o Sistema)
router.get('/planos', planosController.listar);
router.get('/colaboradores/:id/planos', planosController.obterDoColaborador);
router.post('/colaboradores/:id/planos', planosController.atribuir);
router.delete('/colaboradores/:id/planos/:planoId', planosController.remover);

// Relatórios
router.post('/relatorios/gerar', relatoriosController.gerarRelatorio);
router.get('/relatorios/tipos', relatoriosController.listarTipos);
router.post('/relatorios/exportar', relatoriosController.exportarRelatorio);
router.post('/relatorios/historico', relatoriosController.listarHistorico);
router.get('/relatorios/historico/:id', relatoriosController.obterHistorico);

// Dashboard
router.get('/dashboard/kpis', dashboardController.obterResumo);

// =====================================================
// 3. ROTAS ADMINISTRATIVAS (Protegidas)
// =====================================================
const adminRouter = express.Router();

// Diagnóstico de Autenticação
adminRouter.get('/auth/diagnostico', authAdminGoogle, adminUserController.diagnostico);

// Gestão de Planos
adminRouter.get('/planos', authAdminGoogle, planosController.adminListarCompleto);
adminRouter.post('/planos/salvar', requireAdminGoogle(['OWNER', 'ADMIN']), planosController.adminSalvar);
adminRouter.get('/planos/diagnostico', authAdminGoogle, planosController.adminDiagnostico);
adminRouter.delete('/planos/:id', requireAdminGoogle(['OWNER']), planosController.adminExcluir);

// Gestão de Usuários Administradores
adminRouter.get('/users', requireAdminGoogle(['OWNER', 'ADMIN']), adminUserController.listar);
adminRouter.post('/users', requireAdminGoogle(['OWNER']), adminUserController.criar);
adminRouter.patch('/users/:id', requireAdminGoogle(['OWNER']), adminUserController.atualizar);
adminRouter.delete('/users/:id', requireAdminGoogle(['OWNER']), adminUserController.deletar);

// Rota de Mapeamento de Rotas (Para debug de 404 em produção)
adminRouter.get('/routes', authAdminGoogle, (req, res) => {
    const routes = [];
    adminRouter.stack.forEach(layer => {
        if (layer.route) {
            routes.push(`${Object.keys(layer.route.methods).join(',').toUpperCase()} ${layer.route.path}`);
        }
    });
    res.json({
        success: true,
        base_path: '/api/admin',
        routes: routes
    });
});

// Montar o roteador administrativo sob /admin
router.use('/admin', adminRouter);

module.exports = router;
