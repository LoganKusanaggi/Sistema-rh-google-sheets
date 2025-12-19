// =====================================================
// ARQUIVO: src/controllers/segurosController.js
// =====================================================

const supabase = require('../config/supabase');
const { validarCPF, formatarCPF } = require('../utils/validators');

const segurosController = {

    // Listar todos os seguros
    async listarTodos(req, res) {
        try {
            const { status, seguradora, colaborador_id } = req.query;

            let query = supabase
                .from('seguros')
                .select(`
          *,
          colaborador:colaboradores(nome_completo, cpf, cargo, departamento)
        `)
                .order('created_at', { ascending: false });

            if (status) query = query.eq('status', status);
            if (seguradora) query = query.ilike('seguradora', `%${seguradora}%`);
            if (colaborador_id) query = query.eq('colaborador_id', colaborador_id);

            const { data, error } = await query;

            if (error) throw error;

            res.json({
                success: true,
                data,
                total: data.length
            });
        } catch (error) {
            console.error('Erro ao listar seguros:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Buscar seguros por CPF do colaborador
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

            // Buscar colaborador primeiro
            const { data: colaborador, error: errColaborador } = await supabase
                .from('colaboradores')
                .select('id, nome_completo')
                .eq('cpf', cpfLimpo)
                .single();

            if (errColaborador || !colaborador) {
                return res.status(404).json({
                    success: false,
                    error: 'Colaborador não encontrado'
                });
            }

            // Buscar seguros do colaborador
            const { data, error } = await supabase
                .from('seguros')
                .select('*')
                .eq('colaborador_id', colaborador.id)
                .order('data_inicio', { ascending: false });

            if (error) throw error;

            res.json({
                success: true,
                data,
                total: data.length
            });
        } catch (error) {
            console.error('Erro ao buscar seguros:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Criar novo seguro
    async criar(req, res) {
        try {
            const {
                colaborador_id,
                seguradora,
                apolice,
                tipo_seguro = 'vida',
                valor_cobertura,
                premio_mensal,
                data_inicio,
                data_vencimento,
                beneficiario_nome,
                beneficiario_cpf,
                beneficiario_parentesco,
                observacoes = ''
            } = req.body;

            // Validações básicas
            if (!colaborador_id || !seguradora || !apolice || !valor_cobertura ||
                !premio_mensal || !data_inicio || !data_vencimento) {
                return res.status(400).json({
                    success: false,
                    error: 'Campos obrigatórios: colaborador_id, seguradora, apolice, valor_cobertura, premio_mensal, data_inicio, data_vencimento'
                });
            }

            // Validar tipo de seguro
            const tiposValidos = ['vida', 'acidentes_pessoais', 'invalidez', 'funeral', 'outros'];
            if (!tiposValidos.includes(tipo_seguro)) {
                return res.status(400).json({
                    success: false,
                    error: `Tipo de seguro inválido. Use: ${tiposValidos.join(', ')}`
                });
            }

            // Validar CPF do beneficiário se fornecido
            if (beneficiario_cpf && !validarCPF(formatarCPF(beneficiario_cpf))) {
                return res.status(400).json({
                    success: false,
                    error: 'CPF do beneficiário inválido'
                });
            }

            // Verificar se colaborador existe e está ativo
            const { data: colaborador, error: errColaborador } = await supabase
                .from('colaboradores')
                .select('id, status')
                .eq('id', colaborador_id)
                .single();

            if (errColaborador || !colaborador) {
                return res.status(404).json({
                    success: false,
                    error: 'Colaborador não encontrado'
                });
            }

            if (colaborador.status !== 'ativo') {
                return res.status(400).json({
                    success: false,
                    error: 'Não é possível criar seguro para colaborador inativo'
                });
            }

            // Validar datas
            if (new Date(data_vencimento) <= new Date(data_inicio)) {
                return res.status(400).json({
                    success: false,
                    error: 'Data de vencimento deve ser posterior à data de início'
                });
            }

            // Inserir seguro
            const { data, error } = await supabase
                .from('seguros')
                .insert([{
                    colaborador_id,
                    seguradora,
                    apolice,
                    tipo_seguro,
                    valor_cobertura: parseFloat(valor_cobertura),
                    premio_mensal: parseFloat(premio_mensal),
                    data_inicio,
                    data_vencimento,
                    beneficiario_nome,
                    beneficiario_cpf: beneficiario_cpf ? formatarCPF(beneficiario_cpf) : null,
                    beneficiario_parentesco,
                    observacoes,
                    status: 'ativo'
                }])
                .select()
                .single();

            if (error) throw error;

            res.status(201).json({
                success: true,
                data,
                message: 'Seguro criado com sucesso'
            });
        } catch (error) {
            console.error('Erro ao criar seguro:', error);

            if (error.code === '23505') {
                return res.status(409).json({
                    success: false,
                    error: 'Já existe seguro com este número de apólice'
                });
            }

            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Atualizar seguro
    async atualizar(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            // Remove campos que não podem ser alterados
            delete updates.id;
            delete updates.colaborador_id;
            delete updates.created_at;

            // Validar tipo se foi alterado
            if (updates.tipo_seguro) {
                const tiposValidos = ['vida', 'acidentes_pessoais', 'invalidez', 'funeral', 'outros'];
                if (!tiposValidos.includes(updates.tipo_seguro)) {
                    return res.status(400).json({
                        success: false,
                        error: `Tipo de seguro inválido. Use: ${tiposValidos.join(', ')}`
                    });
                }
            }

            // Validar status se foi alterado
            if (updates.status) {
                const statusValidos = ['ativo', 'suspenso', 'cancelado', 'vencido', 'sinistro'];
                if (!statusValidos.includes(updates.status)) {
                    return res.status(400).json({
                        success: false,
                        error: `Status inválido. Use: ${statusValidos.join(', ')}`
                    });
                }
            }

            // Validar CPF do beneficiário se foi alterado
            if (updates.beneficiario_cpf) {
                const cpfFormatado = formatarCPF(updates.beneficiario_cpf);
                if (!validarCPF(cpfFormatado)) {
                    return res.status(400).json({
                        success: false,
                        error: 'CPF do beneficiário inválido'
                    });
                }
                updates.beneficiario_cpf = cpfFormatado;
            }

            // Converter valores para float se fornecidos
            if (updates.valor_cobertura) {
                updates.valor_cobertura = parseFloat(updates.valor_cobertura);
            }
            if (updates.premio_mensal) {
                updates.premio_mensal = parseFloat(updates.premio_mensal);
            }

            const { data, error } = await supabase
                .from('seguros')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            res.json({
                success: true,
                data,
                message: 'Seguro atualizado com sucesso'
            });
        } catch (error) {
            console.error('Erro ao atualizar seguro:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

};

module.exports = segurosController;
