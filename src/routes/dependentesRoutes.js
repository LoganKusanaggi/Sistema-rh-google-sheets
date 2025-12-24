const express = require('express');
const router = express.Router();
const dependentesController = require('../controllers/dependentesController');

// Rotas: /api/dependentes...
// Mas como vamos aninhar em Colaboradores? 
// Opção A: /colaboradores/:colaboradorId/dependentes
// Opção B: /dependentes (com colab_id no body)
// Vamos usar o padrão RESTful aninhado onde faz sentido, mas o controller pode ser independente.
// Vamos seguir o padrão:
// GET /colaboradores/:colaboradorId/dependentes
// POST /colaboradores/:colaboradorId/dependentes
// DELETE /dependentes/:id

router.get('/colaboradores/:colaboradorId/dependentes', dependentesController.listar);
router.post('/colaboradores/:colaboradorId/dependentes', dependentesController.adicionar);
router.delete('/dependentes/:id', dependentesController.remover);

module.exports = router;
