// =====================================================
// ARQUIVO: src/controllers/colaboradorController.js
// =====================================================

const supabase = require('../config/supabase');
const { validarCPF, formatarCPF } = require('../utils/validators');

const colaboradorController = {
  
  // Listar todos os colaboradores
  async listarTodos(req, res) {
    try {
      const { status, departamento } = req.query;
      
      let query = supabase
        .from('colaboradores')
        .select('*')
        .order('nome_completo', { ascending: true });

      if (status) query = query.eq('status', status);
      if (departamento) query = query.eq('departamento', departamento);

      const { data, error } = await query;

      if (error) throw error;

      res.json({
        success: true,
        data,
        total: data.length
      });
    } catch (error) {
      console.error('Erro ao listar colaboradores:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Buscar colaborador por CPF
  async buscarPorCPF(req, res) {
    try {
      const { cpf } = req.params;
      const cpfLimpo = formatarCPF(cpf);

      if (!validarCPF(cpfLimpo)) {
        return res.status(400).json({
          success: false,
          error: 'CPF inválido'
        });
      }

      const { data, error } = await supabase
        .from('colaboradores')
        .select('*')
        .eq('cpf', cpfLimpo)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            error: 'Colaborador não encontrado'
          });
        }
        throw error;
      }

      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error('Erro ao buscar colaborador:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Criar novo colaborador
  async criar(req, res) {
    try {
      const { 
        cpf, nome_completo, email, telefone, cargo, 
        departamento, data_admissao, matricula, codigo_folha,
        local_trabalho, cidade, data_nascimento
      } = req.body;
      
      const cpfLimpo = formatarCPF(cpf);

      if (!validarCPF(cpfLimpo)) {
        return res.status(400).json({
          success: false,
          error: 'CPF inválido'
        });
      }

      if (!nome_completo) {
        return res.status(400).json({
          success: false,
          error: 'Nome completo é obrigatório'
        });
      }

      const { data, error } = await supabase
        .from('colaboradores')
        .insert([{
          cpf: cpfLimpo,
          codigo_folha,
          matricula,
          nome_completo,
          email,
          telefone,
          cargo,
          departamento,
          local_trabalho,
          cidade,
          data_nascimento,
          data_admissao,
          status: 'ativo'
        }])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        data,
        message: 'Colaborador criado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao criar colaborador:', error);
      
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          error: 'CPF já cadastrado'
        });
      }

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Atualizar colaborador
  async atualizar(req, res) {
    try {
      const { cpf } = req.params;
      const cpfLimpo = formatarCPF(cpf);
      const updates = req.body;

      // Remove campos que não podem ser alterados
      delete updates.cpf;
      delete updates.id;
      delete updates.criado_em;

      const { data, error } = await supabase
        .from('colaboradores')
        .update(updates)
        .eq('cpf', cpfLimpo)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        data,
        message: 'Colaborador atualizado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao atualizar colaborador:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Deletar colaborador
  async deletar(req, res) {
    try {
      const { cpf } = req.params;
      const cpfLimpo = formatarCPF(cpf);

      const { error } = await supabase
        .from('colaboradores')
        .delete()
        .eq('cpf', cpfLimpo);

      if (error) throw error;

      res.json({
        success: true,
        message: 'Colaborador deletado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao deletar colaborador:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Criar múltiplos colaboradores de uma vez
  async criarEmLote(req, res) {
    try {
      const { colaboradores } = req.body;

      if (!Array.isArray(colaboradores) || colaboradores.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Envie um array de colaboradores'
        });
      }

      // Validar e formatar todos os CPFs
      const colaboradoresFormatados = colaboradores.map(c => ({
        ...c,
        cpf: formatarCPF(c.cpf),
        status: c.status || 'ativo'
      }));

      // Verificar CPFs inválidos
      const cpfsInvalidos = colaboradoresFormatados.filter(c => !validarCPF(c.cpf));
      if (cpfsInvalidos.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Existem CPFs inválidos na lista',
          cpfsInvalidos: cpfsInvalidos.map(c => c.cpf)
        });
      }

      const { data, error } = await supabase
        .from('colaboradores')
        .upsert(colaboradoresFormatados, { onConflict: 'cpf' })
        .select();

      if (error) throw error;

      res.status(201).json({
        success: true,
        data,
        total: data.length,
        message: `${data.length} colaborador(es) processado(s) com sucesso`
      });
    } catch (error) {
      console.error('Erro ao criar colaboradores em lote:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

};

module.exports = colaboradorController;
