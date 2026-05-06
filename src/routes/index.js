const express = require('express');
const router = express.Router();
const bootDiagnostics = require('../utils/bootDiagnostics');

// Função auxiliar para carregar controladores com rastreamento
function safeRequire(path, name) {
  try {
    const module = require(path);
    bootDiagnostics.recordControllerSuccess(name);
    return module;
  } catch (err) {
    bootDiagnostics.recordControllerFailure(name, err);
    console.error(`[Router] Falha ao carregar controlador "${name}":`, err.message);
    // Lançamos novamente para que o try/catch do index.js capture, mas o erro já está registrado
    throw err;
  }
}

// Controllers com rastreamento
const colaboradorController = safeRequire('../controllers/colaboradorController', 'colaboradorController');
const folhaController = safeRequire('../controllers/folhaController', 'folhaController');
const beneficiosController = safeRequire('../controllers/beneficiosController', 'beneficiosController');
const variavelController = safeRequire('../controllers/variavelController', 'variavelController');
const apontamentosController = safeRequire('../controllers/apontamentosController', 'apontamentosController');
const segurosController = safeRequire('../controllers/segurosController', 'segurosController');
const relatoriosController = safeRequire('../controllers/relatoriosController', 'relatoriosController');
const planosController = safeRequire('../controllers/planosController', 'planosController');
const dashboardController = safeRequire('../controllers/dashboardController', 'dashboardController');
const adminUserController = safeRequire('../controllers/adminUserController', 'adminUserController');
const userReportFolderController = safeRequire('../controllers/userReportFolderController', 'userReportFolderController');
const userController = safeRequire('../controllers/userController', 'userController');
const invitationController = safeRequire('../controllers/invitationController', 'invitationController');

// Middlewares
const { authAdminGoogle, requireAdminGoogle } = require('../middlewares/authAdminGoogle');
const { validateGoogleIdentity } = require('../middlewares/authGoogleIdentity');


const dependentesRoutes = require('./dependentesRoutes');
const asyncHandler = require('../utils/asyncHandler');

// 1. ROTAS PÚBLICAS / SISTEMA (Sem proteção admin)
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: bootDiagnostics.routeModuleLoadError ? 'degraded' : 'online',
        timestamp: new Date().toISOString(),
        version: bootDiagnostics.appVersion,
        environment: {
            supabase_url: !!process.env.SUPABASE_URL,
            supabase_key: !!(process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
        }
    });
});

// 1.1 ROTAS DE USUÁRIO AUTENTICADO (Qualquer usuário com Google Identity)
router.get('/me/profile', validateGoogleIdentity, asyncHandler(userController.getProfile));
router.get('/me/report-folder', validateGoogleIdentity, asyncHandler(userReportFolderController.obterMinhaPasta));
router.post('/me/report-folder', validateGoogleIdentity, asyncHandler(userReportFolderController.salvarMinhaPasta));

// 1.2 ROTAS PÚBLICAS DE CONVITE
router.post('/invitations/accept', validateGoogleIdentity, asyncHandler(invitationController.accept));

// 2. ROTAS DE NEGÓCIO (Colaboradores, Folha, etc.)
router.get('/colaboradores', asyncHandler(colaboradorController.listarTodos));
router.get('/colaboradores/:cpf', asyncHandler(colaboradorController.buscarPorCPF));
router.post('/colaboradores', asyncHandler(colaboradorController.criar));
router.put('/colaboradores/:cpf', asyncHandler(colaboradorController.atualizar));
router.delete('/colaboradores/:cpf', asyncHandler(colaboradorController.deletar));
router.post('/colaboradores/batch', asyncHandler(colaboradorController.criarEmLote));
router.post('/colaboradores/buscar', asyncHandler(relatoriosController.buscarComFiltros));

// Dependentes (Usa o router aninhado)
router.use('/', dependentesRoutes);

// Folha
router.get('/folha', asyncHandler(folhaController.listarTodas));
router.get('/folha/:cpf', asyncHandler(folhaController.buscarPorCPF));
router.get('/folha/:cpf/:ano/:mes', asyncHandler(folhaController.buscarPorPeriodo));
router.post('/folha', asyncHandler(folhaController.criar));
router.put('/folha/:id', asyncHandler(folhaController.atualizar));
router.delete('/folha/:id', asyncHandler(folhaController.deletar));
router.post('/folha/batch', asyncHandler(folhaController.criarEmLote));

// Benefícios
router.get('/beneficios', asyncHandler(beneficiosController.listarTodos));
router.get('/beneficios/:cpf', asyncHandler(beneficiosController.buscarPorCPF));
router.get('/beneficios/:cpf/:ano/:mes', asyncHandler(beneficiosController.buscarPorPeriodo));
router.post('/beneficios', asyncHandler(beneficiosController.criar));
router.put('/beneficios/:id', asyncHandler(beneficiosController.atualizar));
router.delete('/beneficios/:id', asyncHandler(beneficiosController.deletar));
router.post('/beneficios/batch', asyncHandler(beneficiosController.criarEmLote));

// Variável
router.get('/variavel', asyncHandler(variavelController.listarTodos));
router.get('/variavel/:cpf', asyncHandler(variavelController.buscarPorCPF));
router.post('/variavel', asyncHandler(variavelController.criar));
router.put('/variavel/:id', asyncHandler(variavelController.atualizar));
router.post('/variavel/batch', asyncHandler(variavelController.criarEmLote));

// Apontamentos
router.get('/apontamentos', asyncHandler(apontamentosController.listarTodos));
router.get('/apontamentos/:cpf', asyncHandler(apontamentosController.buscarPorCPF));
router.post('/apontamentos', asyncHandler(apontamentosController.criar));
router.put('/apontamentos/:id', asyncHandler(apontamentosController.atualizar));
router.post('/apontamentos/batch', asyncHandler(apontamentosController.criarEmLote));

// Seguros
router.get('/seguros', asyncHandler(segurosController.listarTodos));
router.get('/seguros/:cpf', asyncHandler(segurosController.buscarPorCPF));
router.post('/seguros', asyncHandler(segurosController.criar));
router.put('/seguros/:id', asyncHandler(segurosController.atualizar));

// Planos (Catálogo Público para o Sistema)
router.get('/planos', asyncHandler(planosController.listar));
router.get('/colaboradores/:id/planos', asyncHandler(planosController.obterDoColaborador));
router.post('/colaboradores/:id/planos', asyncHandler(planosController.atribuir));
router.delete('/colaboradores/:id/planos/:planoId', asyncHandler(planosController.remover));

// Relatórios
router.post('/relatorios/gerar', asyncHandler(relatoriosController.gerarRelatorio));
router.get('/relatorios/tipos', asyncHandler(relatoriosController.listarTipos));
router.post('/relatorios/exportar', asyncHandler(relatoriosController.exportarRelatorio));
router.post('/relatorios/historico', asyncHandler(relatoriosController.listarHistorico));
router.get('/relatorios/historico/:id', asyncHandler(relatoriosController.obterHistorico));

// Dashboard
router.get('/dashboard/kpis', asyncHandler(dashboardController.obterResumo));


// =====================================================
// 3. ROTAS ADMINISTRATIVAS (Protegidas)
// =====================================================
const adminRouter = express.Router();

// Diagnóstico de Autenticação
adminRouter.get('/auth/diagnostico', authAdminGoogle, asyncHandler(adminUserController.diagnostico));

// Gestão de Planos
adminRouter.get('/planos', authAdminGoogle, asyncHandler(planosController.adminListarCompleto));
adminRouter.post('/planos/salvar', requireAdminGoogle(['OWNER', 'ADMIN']), asyncHandler(planosController.adminSalvar));
adminRouter.get('/planos/diagnostico', authAdminGoogle, asyncHandler(planosController.adminDiagnostico));
adminRouter.delete('/planos/:id', requireAdminGoogle(['OWNER']), asyncHandler(planosController.adminExcluir));

// Gestão de Usuários Administradores
adminRouter.get('/users', requireAdminGoogle(['OWNER', 'ADMIN']), asyncHandler(adminUserController.listar));
adminRouter.post('/users', requireAdminGoogle(['OWNER']), asyncHandler(adminUserController.criar));
adminRouter.patch('/users/:id', requireAdminGoogle(['OWNER']), asyncHandler(adminUserController.atualizar));
adminRouter.delete('/users/:id', requireAdminGoogle(['OWNER']), asyncHandler(adminUserController.deletar));

// Gestão de Convites
adminRouter.get('/invitations', requireAdminGoogle(['OWNER', 'ADMIN']), asyncHandler(invitationController.list));
adminRouter.post('/invitations', requireAdminGoogle(['OWNER', 'ADMIN']), asyncHandler(invitationController.create));
adminRouter.post('/invitations/:id/revoke', requireAdminGoogle(['OWNER', 'ADMIN']), asyncHandler(invitationController.revoke));

// Rota de Mapeamento de Rotas (Para debug de 404 em produção)
adminRouter.get('/routes', authAdminGoogle, (req, res) => {
    const routes = listExpressRoutes(adminRouter);
    res.json({
        success: true,
        base_path: '/api/admin',
        routes: routes
    });
});


// Montar o roteador administrativo sob /admin
router.use('/admin', adminRouter);

module.exports = router;
