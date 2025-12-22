// =====================================================
// ARQUIVO: src/controllers/folhaController.js
// =====================================================

const supabase = require('../config/supabase');
const { validarCPF, formatarCPF } = require('../utils/validators');

const folhaController = {

    // Listar todas as folhas de pagamento
    async listarTodas(req, res) {
        try {
            const { ano, mes, status } = req.query;

            let query = supabase
                .from('folha_pagamento')
                .select(`
          *,
          colaborador:colaboradores(nome_completo, cpf, cargo, departamento)
        `)
                .order('ano_referencia', { ascending: false })
                .order('mes_referencia', { ascending: false });

            if (ano) query = query.eq('ano_referencia', parseInt(ano));
            if (mes) query = query.eq('mes_referencia', parseInt(mes));
            if (status) query = query.eq('status_pagamento', status);

            const { data, error } = await query;

            if (error) throw error;

            res.json({
                success: true,
                data,
                total: data.length
            });
        } catch (error) {
            console.error('Erro ao listar folhas:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Buscar folhas por CPF
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
                .from('folha_pagamento')
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
            console.error('Erro ao buscar folhas:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Buscar folha por período específico
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
                .from('folha_pagamento')
                .select(`
          *,
          colaborador:colaboradores(nome_completo, cargo, departamento)
        `)
                .eq('cpf', cpfLimpo)
                .eq('ano_referencia', parseInt(ano))
                .eq('mes_referencia', parseInt(mes))
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return res.status(404).json({
                        success: false,
                        error: 'Folha não encontrada para este período'
                    });
                }
                throw error;
            }

            res.json({
                success: true,
                data
            });
        } catch (error) {
            console.error('Erro ao buscar folha por período:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Criar nova folha de pagamento
    async criar(req, res) {
        try {
            const {
                cpf, mes_referencia, ano_referencia,
                salario_base, horas_extras, adicional_noturno,
                insalubridade, periculosidade, comissoes,
                gratificacoes, outros_proventos,
                inss, irrf, vale_transporte, vale_refeicao,
                plano_saude, outros_descontos,
                status_pagamento, data_pagamento, observacoes
            } = req.body;

            const cpfLimpo = formatarCPF(cpf);

            if (!validarCPF(cpfLimpo)) {
                return res.status(400).json({
                    success: false,
                    error: 'CPF inválido'
                });
            }

            // Validar campos obrigatórios
            if (!mes_referencia || !ano_referencia || salario_base === undefined) {
                return res.status(400).json({
                    success: false,
                    error: 'Campos obrigatórios: cpf, mes_referencia, ano_referencia, salario_base'
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

            // Calcular totais
            const total_proventos =
                parseFloat(salario_base || 0) +
                parseFloat(horas_extras || 0) +
                parseFloat(adicional_noturno || 0) +
                parseFloat(insalubridade || 0) +
                parseFloat(periculosidade || 0) +
                parseFloat(comissoes || 0) +
                parseFloat(gratificacoes || 0) +
                parseFloat(outros_proventos || 0);

            const total_descontos =
                parseFloat(inss || 0) +
                parseFloat(irrf || 0) +
                parseFloat(vale_transporte || 0) +
                parseFloat(vale_refeicao || 0) +
                parseFloat(plano_saude || 0) +
                parseFloat(outros_descontos || 0);

            const salario_liquido = total_proventos - total_descontos;

            const { data, error } = await supabase
                .from('folha_pagamento')
                .insert([{
                    colaborador_id: colaborador.id,
                    cpf: cpfLimpo,
                    nome_colaborador: colaborador.nome_completo,
                    mes_referencia: parseInt(mes_referencia),
                    ano_referencia: parseInt(ano_referencia),
                    salario_base: parseFloat(salario_base),
                    horas_extras: parseFloat(horas_extras || 0),
                    adicional_noturno: parseFloat(adicional_noturno || 0),
                    insalubridade: parseFloat(insalubridade || 0),
                    periculosidade: parseFloat(periculosidade || 0),
                    comissoes: parseFloat(comissoes || 0),
                    gratificacoes: parseFloat(gratificacoes || 0),
                    outros_proventos: parseFloat(outros_proventos || 0),
                    total_proventos,
                    inss: parseFloat(inss || 0),
                    irrf: parseFloat(irrf || 0),
                    vale_transporte: parseFloat(vale_transporte || 0),
                    vale_refeicao: parseFloat(vale_refeicao || 0),
                    plano_saude: parseFloat(plano_saude || 0),
                    outros_descontos: parseFloat(outros_descontos || 0),
                    total_descontos,
                    salario_liquido,
                    status_pagamento: status_pagamento || 'pendente',
                    data_pagamento,
                    observacoes
                }])
                .select()
                .single();

            if (error) throw error;

            res.status(201).json({
                success: true,
                data,
                message: 'Folha de pagamento criada com sucesso'
            });
        } catch (error) {
            console.error('Erro ao criar folha:', error);

            if (error.code === '23505') {
                return res.status(409).json({
                    success: false,
                    error: 'Já existe folha para este colaborador neste período'
                });
            }

            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Atualizar folha de pagamento
    async atualizar(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            // Remove campos que não podem ser alterados
            delete updates.id;
            delete updates.cpf;
            delete updates.colaborador_id;
            delete updates.created_at;

            // Recalcular totais se houver mudanças nos valores
            if (updates.salario_base !== undefined ||
                updates.horas_extras !== undefined ||
                updates.adicional_noturno !== undefined ||
                updates.insalubridade !== undefined ||
                updates.periculosidade !== undefined ||
                updates.comissoes !== undefined ||
                updates.gratificacoes !== undefined ||
                updates.outros_proventos !== undefined) {

                // Buscar dados atuais
                const { data: folhaAtual } = await supabase
                    .from('folha_pagamento')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (folhaAtual) {
                    const total_proventos =
                        parseFloat(updates.salario_base ?? folhaAtual.salario_base) +
                        parseFloat(updates.horas_extras ?? folhaAtual.horas_extras) +
                        parseFloat(updates.adicional_noturno ?? folhaAtual.adicional_noturno) +
                        parseFloat(updates.insalubridade ?? folhaAtual.insalubridade) +
                        parseFloat(updates.periculosidade ?? folhaAtual.periculosidade) +
                        parseFloat(updates.comissoes ?? folhaAtual.comissoes) +
                        parseFloat(updates.gratificacoes ?? folhaAtual.gratificacoes) +
                        parseFloat(updates.outros_proventos ?? folhaAtual.outros_proventos);

                    const total_descontos =
                        parseFloat(updates.inss ?? folhaAtual.inss) +
                        parseFloat(updates.irrf ?? folhaAtual.irrf) +
                        parseFloat(updates.vale_transporte ?? folhaAtual.vale_transporte) +
                        parseFloat(updates.vale_refeicao ?? folhaAtual.vale_refeicao) +
                        parseFloat(updates.plano_saude ?? folhaAtual.plano_saude) +
                        parseFloat(updates.outros_descontos ?? folhaAtual.outros_descontos);

                    updates.total_proventos = total_proventos;
                    updates.total_descontos = total_descontos;
                    updates.salario_liquido = total_proventos - total_descontos;
                }
            }

            const { data, error } = await supabase
                .from('folha_pagamento')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            res.json({
                success: true,
                data,
                message: 'Folha de pagamento atualizada com sucesso'
            });
        } catch (error) {
            console.error('Erro ao atualizar folha:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Deletar folha de pagamento
    async deletar(req, res) {
        try {
            const { id } = req.params;

            const { error } = await supabase
                .from('folha_pagamento')
                .delete()
                .eq('id', id);

            if (error) throw error;

            res.json({
                success: true,
                message: 'Folha de pagamento deletada com sucesso'
            });
        } catch (error) {
            console.error('Erro ao deletar folha:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Criar folhas em lote
    async criarEmLote(req, res) {
        try {
            const { folhas } = req.body;

            if (!Array.isArray(folhas) || folhas.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Envie um array de folhas'
                });
            }

            // Buscar todos os colaboradores únicos
            const cpfs = [...new Set(folhas.map(f => formatarCPF(f.cpf)))];
            const { data: colaboradores } = await supabase
                .from('colaboradores')
                .select('id, cpf, nome_completo')
                .in('cpf', cpfs);

            const cpfToData = {};
            colaboradores.forEach(c => {
                cpfToData[c.cpf] = c;
            });

            // Processar folhas
            const folhasFormatadas = folhas.map(f => {
                const colab = cpfToData[formatarCPF(f.cpf)];
                if (!colab) return null;

                const total_proventos =
                    parseFloat(f.salario_base || 0) +
                    parseFloat(f.horas_extras || 0) +
                    parseFloat(f.adicional_noturno || 0) +
                    parseFloat(f.insalubridade || 0) +
                    parseFloat(f.periculosidade || 0) +
                    parseFloat(f.comissoes || 0) +
                    parseFloat(f.gratificacoes || 0) +
                    parseFloat(f.outros_proventos || 0);

                const total_descontos =
                    parseFloat(f.inss || 0) +
                    parseFloat(f.irrf || 0) +
                    parseFloat(f.vale_transporte || 0) +
                    parseFloat(f.vale_refeicao || 0) +
                    parseFloat(f.plano_saude || 0) +
                    parseFloat(f.outros_descontos || 0);

                return {
                    colaborador_id: colab.id,
                    cpf: formatarCPF(f.cpf),
                    nome_colaborador: colab.nome_completo,
                    mes_referencia: parseInt(f.mes_referencia),
                    ano_referencia: parseInt(f.ano_referencia),
                    salario_base: parseFloat(f.salario_base || 0),
                    horas_extras: parseFloat(f.horas_extras || 0),
                    adicional_noturno: parseFloat(f.adicional_noturno || 0),
                    insalubridade: parseFloat(f.insalubridade || 0),
                    periculosidade: parseFloat(f.periculosidade || 0),
                    comissoes: parseFloat(f.comissoes || 0),
                    gratificacoes: parseFloat(f.gratificacoes || 0),
                    outros_proventos: parseFloat(f.outros_proventos || 0),
                    total_proventos,
                    inss: parseFloat(f.inss || 0),
                    irrf: parseFloat(f.irrf || 0),
                    vale_transporte: parseFloat(f.vale_transporte || 0),
                    vale_refeicao: parseFloat(f.vale_refeicao || 0),
                    plano_saude: parseFloat(f.plano_saude || 0),
                    outros_descontos: parseFloat(f.outros_descontos || 0),
                    total_descontos,
                    salario_liquido: total_proventos - total_descontos,
                    status_pagamento: f.status_pagamento || 'pendente',
                    data_pagamento: f.data_pagamento,
                    observacoes: f.observacoes
                };
            }).filter(f => f !== null);

            const { data, error } = await supabase
                .from('folha_pagamento')
                .upsert(folhasFormatadas, {
                    onConflict: 'cpf,mes_referencia,ano_referencia'
                })
                .select();

            if (error) throw error;

        });

        // =========================================================
        // LÓGICA DE SNAPSHOT (HISTÓRICO)
        // =========================================================
        try {
            // 1. Criar o cabeçalho do relatório (Snapshot)
            // Ex Nome: "Folha Pagamento 01 - 22/12/2025 14:30"
            const now = new Date();
            const timestampStr = now.toLocaleString('pt-BR');
            const nomeRelatorio = `Folha ${now.getTime()} - ${timestampStr}`;

            const { data: relCriado, error: errCriacao } = await supabase
                .from('relatorios_gerados')
                .insert({
                    nome: nomeRelatorio,
                    tipo: 'folha',
                    mes_referencia: folhasFormatadas[0].mes_referencia,
                    ano_referencia: folhasFormatadas[0].ano_referencia,
                    filtros_usados: { origem: 'upload_planilha', total_registros: folhasFormatadas.length },
                    status: 'gerado'
                })
                .select()
                .single();

            if (!errCriacao && relCriado) {
                // 2. Salvar os itens (Snapshot imutável)
                const itensParaSalvar = folhasFormatadas.map(linha => ({
                    relatorio_id: relCriado.id,
                    cpf: linha.cpf,
                    nome_colaborador: linha.nome_colaborador,
                    dados_snapshot: linha
                }));

                const { error: errItens } = await supabase
                    .from('relatorios_itens')
                    .insert(itensParaSalvar);

                if (errItens) console.error('Erro ao salvar snapshot itens (Folha):', errItens);
            } else {
                console.error('Erro ao criar snapshot header (Folha):', errCriacao);
            }
        } catch (snapError) {
            // Não falha a requisição principal se o snapshot falhar, apenas loga
            console.error('Erro crítico no processo de snapshot (Folha):', snapError);
        }

        // Retorna sucesso da operação principal
        res.status(201).json({
            success: true,
            data,
            total: data.length,
            message: `${data.length} folha(s) processada(s) com sucesso. Histórico salvo.`
        });
    } catch(error) {
        console.error('Erro ao criar folhas em lote:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

};

module.exports = folhaController;
