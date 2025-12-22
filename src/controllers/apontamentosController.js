// =====================================================
// ARQUIVO: src/controllers/apontamentosController.js
// =====================================================

const supabase = require('../config/supabase');
const { validarCPF, formatarCPF } = require('../utils/validators');

const apontamentosController = {

    // Listar todos os apontamentos
    async listarTodos(req, res) {
        try {
            const { ano, mes, tipo, status } = req.query;

            let query = supabase
                .from('apontamentos')
                .select(`
          *,
          colaborador:colaboradores(nome_completo, cpf, cargo, departamento)
        `)
                .order('data_apontamento', { ascending: false });

            if (ano) query = query.eq('ano_referencia', parseInt(ano));
            if (mes) query = query.eq('mes_referencia', parseInt(mes));
            if (tipo) query = query.eq('tipo_apontamento', tipo);
            if (status) query = query.eq('status', status);

            const { data, error } = await query;

            if (error) throw error;

            res.json({
                success: true,
                data,
                total: data.length
            });
        } catch (error) {
            console.error('Erro ao listar apontamentos:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Buscar apontamentos por CPF
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
                .from('apontamentos')
                .select('*')
                .eq('cpf', cpfLimpo)
                .order('data_apontamento', { ascending: false });

            if (error) throw error;

            res.json({
                success: true,
                data,
                total: data.length
            });
        } catch (error) {
            console.error('Erro ao buscar apontamentos:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Criar novo apontamento
    async criar(req, res) {
        try {
            const {
                cpf, data_apontamento, tipo_apontamento,
                hora_entrada, hora_saida, hora_inicio_intervalo, hora_fim_intervalo,
                horas_trabalhadas, horas_extras, horas_noturnas,
                falta, atraso_minutos, saida_antecipada_minutos,
                justificativa, atestado, status, observacoes
            } = req.body;

            const cpfLimpo = formatarCPF(cpf);

            if (!validarCPF(cpfLimpo)) {
                return res.status(400).json({
                    success: false,
                    error: 'CPF inválido'
                });
            }

            // Validar campos obrigatórios
            if (!data_apontamento || !tipo_apontamento) {
                return res.status(400).json({
                    success: false,
                    error: 'Campos obrigatórios: cpf, data_apontamento, tipo_apontamento'
                });
            }

            // Validar tipo de apontamento
            const tiposValidos = [
                'presenca', 'falta', 'falta_justificada', 'atestado',
                'ferias', 'folga', 'licenca', 'home_office',
                'hora_extra', 'banco_horas', 'atraso', 'saida_antecipada'
            ];

            if (!tiposValidos.includes(tipo_apontamento)) {
                return res.status(400).json({
                    success: false,
                    error: `Tipo de apontamento inválido. Use: ${tiposValidos.join(', ')}`
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

            // Extrair mês e ano da data
            const dataObj = new Date(data_apontamento);
            const mes_referencia = dataObj.getMonth() + 1;
            const ano_referencia = dataObj.getFullYear();

            const { data, error } = await supabase
                .from('apontamentos')
                .insert([{
                    colaborador_id: colaborador.id,
                    cpf: cpfLimpo,
                    nome_colaborador: colaborador.nome_completo,
                    data_apontamento,
                    mes_referencia,
                    ano_referencia,
                    tipo_apontamento,
                    hora_entrada,
                    hora_saida,
                    hora_inicio_intervalo,
                    hora_fim_intervalo,
                    horas_trabalhadas: parseFloat(horas_trabalhadas || 0),
                    horas_extras: parseFloat(horas_extras || 0),
                    horas_noturnas: parseFloat(horas_noturnas || 0),
                    falta: falta || false,
                    atraso_minutos: parseInt(atraso_minutos || 0),
                    saida_antecipada_minutos: parseInt(saida_antecipada_minutos || 0),
                    justificativa,
                    atestado: atestado || false,
                    status: status || 'pendente',
                    observacoes
                }])
                .select()
                .single();

            if (error) throw error;

            res.status(201).json({
                success: true,
                data,
                message: 'Apontamento criado com sucesso'
            });
        } catch (error) {
            console.error('Erro ao criar apontamento:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Atualizar apontamento
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
            if (updates.tipo_apontamento) {
                const tiposValidos = [
                    'presenca', 'falta', 'falta_justificada', 'atestado',
                    'ferias', 'folga', 'licenca', 'home_office',
                    'hora_extra', 'banco_horas', 'atraso', 'saida_antecipada'
                ];

                if (!tiposValidos.includes(updates.tipo_apontamento)) {
                    return res.status(400).json({
                        success: false,
                        error: `Tipo de apontamento inválido. Use: ${tiposValidos.join(', ')}`
                    });
                }
            }

            // Validar status se foi alterado
            if (updates.status) {
                const statusValidos = ['pendente', 'aprovado', 'rejeitado', 'em_analise'];
                if (!statusValidos.includes(updates.status)) {
                    return res.status(400).json({
                        success: false,
                        error: `Status inválido. Use: ${statusValidos.join(', ')}`
                    });
                }
            }

            // Atualizar mês/ano se a data foi alterada
            if (updates.data_apontamento) {
                const dataObj = new Date(updates.data_apontamento);
                updates.mes_referencia = dataObj.getMonth() + 1;
                updates.ano_referencia = dataObj.getFullYear();
            }

            // Converter valores numéricos
            if (updates.horas_trabalhadas !== undefined) {
                updates.horas_trabalhadas = parseFloat(updates.horas_trabalhadas);
            }
            if (updates.horas_extras !== undefined) {
                updates.horas_extras = parseFloat(updates.horas_extras);
            }
            if (updates.horas_noturnas !== undefined) {
                updates.horas_noturnas = parseFloat(updates.horas_noturnas);
            }
            if (updates.atraso_minutos !== undefined) {
                updates.atraso_minutos = parseInt(updates.atraso_minutos);
            }
            if (updates.saida_antecipada_minutos !== undefined) {
                updates.saida_antecipada_minutos = parseInt(updates.saida_antecipada_minutos);
            }

            const { data, error } = await supabase
                .from('apontamentos')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            res.json({
                success: true,
                data,
                message: 'Apontamento atualizado com sucesso'
            });
        } catch (error) {
            console.error('Erro ao atualizar apontamento:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Criar apontamentos em lote
    async criarEmLote(req, res) {
        try {
            const { apontamentos } = req.body;

            if (!Array.isArray(apontamentos) || apontamentos.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Envie um array de apontamentos'
                });
            }

            // Buscar todos os colaboradores únicos
            const cpfs = [...new Set(apontamentos.map(a => formatarCPF(a.cpf)))];
            const { data: colaboradores } = await supabase
                .from('colaboradores')
                .select('id, cpf, nome_completo')
                .in('cpf', cpfs);

            const cpfToData = {};
            colaboradores.forEach(c => {
                cpfToData[c.cpf] = c;
            });

            // Processar apontamentos
            const apontamentosFormatados = apontamentos.map(a => {
                const colab = cpfToData[formatarCPF(a.cpf)];
                if (!colab) return null;

                const dataObj = new Date(a.data_apontamento);
                const mes_referencia = dataObj.getMonth() + 1;
                const ano_referencia = dataObj.getFullYear();

                return {
                    colaborador_id: colab.id,
                    cpf: formatarCPF(a.cpf),
                    nome_colaborador: colab.nome_completo,
                    data_apontamento: a.data_apontamento,
                    mes_referencia,
                    ano_referencia,
                    tipo_apontamento: a.tipo_apontamento,
                    hora_entrada: a.hora_entrada,
                    hora_saida: a.hora_saida,
                    hora_inicio_intervalo: a.hora_inicio_intervalo,
                    hora_fim_intervalo: a.hora_fim_intervalo,
                    horas_trabalhadas: parseFloat(a.horas_trabalhadas || 0),
                    horas_extras: parseFloat(a.horas_extras || 0),
                    horas_noturnas: parseFloat(a.horas_noturnas || 0),
                    falta: a.falta || false,
                    atraso_minutos: parseInt(a.atraso_minutos || 0),
                    saida_antecipada_minutos: parseInt(a.saida_antecipada_minutos || 0),
                    justificativa: a.justificativa,
                    atestado: a.atestado || false,
                    status: a.status || 'pendente',
                    observacoes: a.observacoes
                };
            }).filter(a => a !== null);

            const { data, error } = await supabase
                .from('apontamentos')
                .upsert(apontamentosFormatados, {
                    onConflict: 'cpf,data_apontamento'
                })
                .select();

            if (error) throw error;

            res.status(201).json({
                success: true,
                data,
                total: data.length,
                message: `${data.length} apontamento(s) processado(s) com sucesso`
            });
        } catch (error) {
            console.error('Erro ao criar apontamentos em lote:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

};

module.exports = apontamentosController;
