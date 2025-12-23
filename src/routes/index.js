const express = require('express');
const router = express.Router();

const colaboradorController = require('../controllers/colaboradorController');
const folhaController = require('../controllers/folhaController');
const beneficiosController = require('../controllers/beneficiosController');
const variavelController = require('../controllers/variavelController');
const apontamentosController = require('../controllers/apontamentosController');
const segurosController = require('../controllers/segurosController');
const relatoriosController = require('../controllers/relatoriosController');

// ===== ROTAS DE COLABORADORES =====
router.get('/colaboradores', colaboradorController.listarTodos);
router.get('/colaboradores/:cpf', colaboradorController.buscarPorCPF);
router.post('/colaboradores', colaboradorController.criar);
router.put('/colaboradores/:cpf', colaboradorController.atualizar);
router.delete('/colaboradores/:cpf', colaboradorController.deletar);
router.post('/colaboradores/batch', colaboradorController.criarEmLote);

// NOVO: Busca avançada com filtros
router.post('/colaboradores/buscar', relatoriosController.buscarComFiltros);

// NOVO: Operações em lote
router.put('/colaboradores/bulk', async (req, res) => {
    // TODO: Implementar atualização em lote
    res.json({ success: true, message: 'Em desenvolvimento' });
});

router.delete('/colaboradores/bulk', async (req, res) => {
    // TODO: Implementar exclusão em lote
    res.json({ success: true, message: 'Em desenvolvimento' });
});

// ===== ROTAS DE FOLHA DE PAGAMENTO =====
router.get('/folha', folhaController.listarTodas);
router.get('/folha/:cpf', folhaController.buscarPorCPF);
router.get('/folha/:cpf/:ano/:mes', folhaController.buscarPorPeriodo);
router.post('/folha', folhaController.criar);
router.put('/folha/:id', folhaController.atualizar);
router.delete('/folha/:id', folhaController.deletar);
router.post('/folha/batch', folhaController.criarEmLote);

// ===== ROTAS DE BENEFÍCIOS =====
router.get('/beneficios', beneficiosController.listarTodos);
router.get('/beneficios/:cpf', beneficiosController.buscarPorCPF);
router.get('/beneficios/:cpf/:ano/:mes', beneficiosController.buscarPorPeriodo);
router.post('/beneficios', beneficiosController.criar);
router.put('/beneficios/:id', beneficiosController.atualizar);
router.delete('/beneficios/:id', beneficiosController.deletar);
router.post('/beneficios/batch', beneficiosController.criarEmLote);

// ===== ROTAS DE VARIÁVEL =====
router.get('/variavel', variavelController.listarTodos);
router.get('/variavel/:cpf', variavelController.buscarPorCPF);
router.post('/variavel', variavelController.criar);
router.put('/variavel/:id', variavelController.atualizar);
router.post('/variavel/batch', variavelController.criarEmLote);

// ===== ROTAS DE APONTAMENTOS =====
router.get('/apontamentos', apontamentosController.listarTodos);
router.get('/apontamentos/:cpf', apontamentosController.buscarPorCPF);
router.post('/apontamentos', apontamentosController.criar);
router.put('/apontamentos/:id', apontamentosController.atualizar);
router.post('/apontamentos/batch', apontamentosController.criarEmLote);

// ===== ROTAS DE SEGUROS =====
router.get('/seguros', segurosController.listarTodos);
router.get('/seguros/:cpf', segurosController.buscarPorCPF);
router.post('/seguros', segurosController.criar);
router.put('/seguros/:id', segurosController.atualizar);

// ===== ROTAS DE RELATÓRIOS (NOVO!) =====
// Gerar relatório genérico
router.post('/relatorios/gerar', relatoriosController.gerarRelatorio);

// Listar tipos disponíveis
router.get('/relatorios/tipos', relatoriosController.listarTipos);

// Exportar relatório
router.post('/relatorios/exportar', relatoriosController.exportarRelatorio);

// Histórico de Relatórios
router.post('/relatorios/historico', relatoriosController.listarHistorico);
router.get('/relatorios/historico/:id', relatoriosController.obterHistorico);

// ===== ROTA DE HEALTH CHECK =====
router.get('/health', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        version: '2.0.0'
    });
});

module.exports = router;
