// =====================================================
// ARQUIVO: src/controllers/beneficiosController.js
// =====================================================

const supabase = require('../config/supabase');
const { validarCPF, formatarCPF } = require('../utils/validators');

const beneficiosController = {

    // Listar todos os benefícios
    async listarTodos(req, res) {
        try {
            const { ano, mes, tipo } = req.query;

            let query = supabase
                .from('beneficios')
                .select(`
          *,
          colaborador:colaboradores(nome_completo, cpf, cargo, departamento)
        `)
                .order('ano_referencia', { ascending: false })
                .order('mes_referencia', { ascending: false });

            if (ano) query = query.eq('ano_referencia', parseInt(ano));
            if (mes) query = query.eq('mes_referencia', parseInt(mes));
            if (tipo) query = query.eq('tipo_beneficio', tipo);

            const { data, error } = await query;

            if (error) throw error;

            res.json({
                success: true,
                data,
                total: data.length
            });
        } catch (error) {
            console.error('Erro ao listar benefícios:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Buscar benefícios por CPF
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
                .from('beneficios')
                .select('*')
                .eq('cpf', cpfLimpo)
                .order('ano_referencia', { ascending: false })
                .order('mes_referencia', { ascending: false });

            if (error) throw error;

            res.json({
                success: true,
                data,
                total: data.length
            });
        } catch (error) {
            console.error('Erro ao buscar benefícios:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Buscar benefícios por período específico
    async buscarPorPeriodo(req, res) {
        try {
            const { cpf, ano, mes } = req.params;
            const cpfLimpo = formatarCPF(cpf);

            if (!validarCPF(cpfLimpo)) {
                return res.status(400).json({
                    success: false,
                    error: 'CPF inválido'
                });
            }

            const { data, error } = await supabase
                .from('beneficios')
                .select(`
          *,
          colaborador:colaboradores(nome_completo, cargo, departamento)
        `)
                .eq('cpf', cpfLimpo)
                .eq('ano_referencia', parseInt(ano))
                .eq('mes_referencia', parseInt(mes));

            if (error) throw error;

            res.json({
                success: true,
                data,
                total: data.length
            });
        } catch (error) {
            console.error('Erro ao buscar benefícios por período:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Criar novo benefício
    async criar(req, res) {
        try {
            const {
                cpf, mes_referencia, ano_referencia,
                tipo_beneficio, descricao,
                valor, quantidade, valor_total,
                fornecedor, status, observacoes
            } = req.body;

            const cpfLimpo = formatarCPF(cpf);

            if (!validarCPF(cpfLimpo)) {
                return res.status(400).json({
                    success: false,
                    error: 'CPF inválido'
                });
            }

            // Validar campos obrigatórios
            if (!mes_referencia || !ano_referencia || !tipo_beneficio) {
                return res.status(400).json({
                    success: false,
                    error: 'Campos obrigatórios: cpf, mes_referencia, ano_referencia, tipo_beneficio'
                });
            }

            // Validar tipo de benefício
            const tiposValidos = [
                'vale_refeicao', 'vale_alimentacao', 'vale_transporte',
                'plano_saude', 'plano_odontologico', 'seguro_vida',
                'auxilio_creche', 'auxilio_educacao', 'gympass',
                'cesta_basica', 'outros'
            ];

            if (!tiposValidos.includes(tipo_beneficio)) {
                return res.status(400).json({
                    success: false,
                    error: `Tipo de benefício inválido. Use: ${tiposValidos.join(', ')}`
                });
            }

            // Buscar colaborador
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

            // Calcular valor total se não fornecido
            const valorFinal = valor_total || (parseFloat(valor || 0) * parseInt(quantidade || 1));

            const { data, error } = await supabase
                .from('beneficios')
                .insert([{
                    colaborador_id: colaborador.id,
                    cpf: cpfLimpo,
                    nome_colaborador: colaborador.nome_completo,
                    mes_referencia: parseInt(mes_referencia),
                    ano_referencia: parseInt(ano_referencia),
                    tipo_beneficio,
                    descricao,
                    valor: parseFloat(valor || 0),
                    quantidade: parseInt(quantidade || 1),
                    valor_total: parseFloat(valorFinal),
                    fornecedor,
                    status: status || 'ativo',
                    observacoes
                }])
                .select()
                .single();

            if (error) throw error;

            res.status(201).json({
                success: true,
                data,
                message: 'Benefício criado com sucesso'
            });
        } catch (error) {
            console.error('Erro ao criar benefício:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Atualizar benefício
    async atualizar(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            // Remove campos que não podem ser alterados
            delete updates.id;
            delete updates.cpf;
            delete updates.colaborador_id;
            delete updates.created_at;

            // Validar tipo se foi alterado
            if (updates.tipo_beneficio) {
                const tiposValidos = [
                    'vale_refeicao', 'vale_alimentacao', 'vale_transporte',
                    'plano_saude', 'plano_odontologico', 'seguro_vida',
                    'auxilio_creche', 'auxilio_educacao', 'gympass',
                    'cesta_basica', 'outros'
                ];

                if (!tiposValidos.includes(updates.tipo_beneficio)) {
                    return res.status(400).json({
                        success: false,
                        error: `Tipo de benefício inválido. Use: ${tiposValidos.join(', ')}`
                    });
                }
            }

            // Recalcular valor_total se valor ou quantidade mudaram
            if (updates.valor !== undefined || updates.quantidade !== undefined) {
                const { data: beneficioAtual } = await supabase
                    .from('beneficios')
                    .select('valor, quantidade')
                    .eq('id', id)
                    .single();

                if (beneficioAtual) {
                    const valor = parseFloat(updates.valor ?? beneficioAtual.valor);
                    const quantidade = parseInt(updates.quantidade ?? beneficioAtual.quantidade);
                    updates.valor_total = valor * quantidade;
                }
            }

            const { data, error } = await supabase
                .from('beneficios')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            res.json({
                success: true,
                data,
                message: 'Benefício atualizado com sucesso'
            });
        } catch (error) {
            console.error('Erro ao atualizar benefício:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Deletar benefício
    async deletar(req, res) {
        try {
            const { id } = req.params;

            const { error } = await supabase
                .from('beneficios')
                .delete()
                .eq('id', id);

            if (error) throw error;

            res.json({
                success: true,
                message: 'Benefício deletado com sucesso'
            });
        } catch (error) {
            console.error('Erro ao deletar benefício:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Criar benefícios em lote
    async criarEmLote(req, res) {
        try {
            const { beneficios } = req.body;

            if (!Array.isArray(beneficios) || beneficios.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Envie um array de benefícios'
                });
            }

            // Buscar todos os colaboradores únicos
            const cpfs = [...new Set(beneficios.map(b => formatarCPF(b.cpf)))];
            const { data: colaboradores } = await supabase
                .from('colaboradores')
                .select('id, cpf, nome_completo')
                .in('cpf', cpfs);

            const cpfToData = {};
            colaboradores.forEach(c => {
                cpfToData[c.cpf] = c;
            });

            // Processar benefícios
            const beneficiosFormatados = beneficios.map(b => {
                const colab = cpfToData[formatarCPF(b.cpf)];
                if (!colab) return null;

                const valor = parseFloat(b.valor || 0);
                const quantidade = parseInt(b.quantidade || 1);
                const valor_total = b.valor_total || (valor * quantidade);

                return {
                    colaborador_id: colab.id,
                    cpf: formatarCPF(b.cpf),
                    nome_colaborador: colab.nome_completo,
                    mes_referencia: parseInt(b.mes_referencia),
                    ano_referencia: parseInt(b.ano_referencia),
                    tipo_beneficio: b.tipo_beneficio,
                    descricao: b.descricao,
                    valor,
                    quantidade,
                    valor_total: parseFloat(valor_total),
                    fornecedor: b.fornecedor,
                    status: b.status || 'ativo',
                    observacoes: b.observacoes
                };
            }).filter(b => b !== null);

            const { data, error } = await supabase
                .from('beneficios')
                .upsert(beneficiosFormatados, {
                    onConflict: 'cpf,mes_referencia,ano_referencia,tipo_beneficio'
                })
                .select();

            if (error) throw error;

            res.status(201).json({
                success: true,
                data,
                total: data.length,
                message: `${data.length} benefício(s) processado(s) com sucesso`
            });
        } catch (error) {
            console.error('Erro ao criar benefícios em lote:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

};

module.exports = beneficiosController;
