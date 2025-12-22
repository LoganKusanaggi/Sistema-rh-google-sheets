// =====================================================
// ARQUIVO: src/controllers/variavelController.js
// =====================================================

const supabase = require('../config/supabase');
const { formatarCPF } = require('../utils/validators');

const variavelController = {

    async listarTodos(req, res) {
        try {
            const { ano, mes, status } = req.query;

            let query = supabase
                .from('apuracao_variavel')
                .select('*')
                .order('ano_referencia', { ascending: false });

            if (ano) query = query.eq('ano_referencia', parseInt(ano));
            if (mes) query = query.eq('mes_referencia', parseInt(mes));
            if (status) query = query.eq('status_aprovacao', status);

            const { data, error } = await query;
            if (error) throw error;

            res.json({ success: true, data, total: data.length });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async buscarPorCPF(req, res) {
        try {
            const { cpf } = req.params;
            const { data, error } = await supabase
                .from('apuracao_variavel')
                .select('*')
                .eq('cpf', formatarCPF(cpf))
                .order('ano_referencia', { ascending: false });

            if (error) throw error;
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async criar(req, res) {
        try {
            const {
                cpf, mes_referencia, ano_referencia,
                // Caffeine
                caffeine_fat_meta, caffeine_fat_realizado,
                caffeine_pos_meta, caffeine_pos_realizado,
                // Sublyme
                sublyme_fat_meta, sublyme_fat_realizado,
                sublyme_pos_meta, sublyme_pos_realizado,
                // Koala
                koala_fat_meta, koala_fat_realizado,
                koala_pos_meta, koala_pos_realizado,
                // Variável
                salario_base, multiplicador,
                status_aprovacao, observacoes
            } = req.body;

            const { data: colaborador } = await supabase
                .from('colaboradores')
                .select('id, nome_completo')
                .eq('cpf', formatarCPF(cpf))
                .single();

            if (!colaborador) {
                return res.status(404).json({
                    success: false,
                    error: 'Colaborador não encontrado'
                });
            }

            const { data, error } = await supabase
                .from('apuracao_variavel')
                .insert([{
                    colaborador_id: colaborador.id,
                    cpf: formatarCPF(cpf),
                    nome_vendedor: colaborador.nome_completo,
                    mes_referencia: parseInt(mes_referencia),
                    ano_referencia: parseInt(ano_referencia),
                    // Caffeine
                    caffeine_fat_meta: parseFloat(caffeine_fat_meta) || 0,
                    caffeine_fat_realizado: parseFloat(caffeine_fat_realizado) || 0,
                    caffeine_pos_meta: parseInt(caffeine_pos_meta) || 0,
                    caffeine_pos_realizado: parseInt(caffeine_pos_realizado) || 0,
                    // Sublyme
                    sublyme_fat_meta: parseFloat(sublyme_fat_meta) || 0,
                    sublyme_fat_realizado: parseFloat(sublyme_fat_realizado) || 0,
                    sublyme_pos_meta: parseInt(sublyme_pos_meta) || 0,
                    sublyme_pos_realizado: parseInt(sublyme_pos_realizado) || 0,
                    // Koala
                    koala_fat_meta: parseFloat(koala_fat_meta) || 0,
                    koala_fat_realizado: parseFloat(koala_fat_realizado) || 0,
                    koala_pos_meta: parseInt(koala_pos_meta) || 0,
                    koala_pos_realizado: parseInt(koala_pos_realizado) || 0,
                    // Variável
                    salario_base: parseFloat(salario_base) || 0,
                    multiplicador: parseFloat(multiplicador) || 0,
                    status_aprovacao: status_aprovacao || 'pendente',
                    observacoes
                }])
                .select()
                .single();

            if (error) throw error;

            res.status(201).json({
                success: true,
                data,
                message: 'Variável criada com sucesso'
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async atualizar(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            delete updates.id;
            delete updates.cpf;
            delete updates.colaborador_id;

            const { data, error } = await supabase
                .from('apuracao_variavel')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            res.json({
                success: true,
                data,
                message: 'Variável atualizada'
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async criarEmLote(req, res) {
        try {
            const { variaveis } = req.body;

            const cpfs = [...new Set(variaveis.map(v => formatarCPF(v.cpf)))];
            const { data: colaboradores } = await supabase
                .from('colaboradores')
                .select('id, cpf, nome_completo')
                .in('cpf', cpfs);

            const cpfToData = {};
            colaboradores.forEach(c => {
                cpfToData[c.cpf] = c;
            });

            const variaveisFormatadas = variaveis.map(v => {
                const colab = cpfToData[formatarCPF(v.cpf)];
                if (!colab) return null;

                return {
                    colaborador_id: colab.id,
                    cpf: formatarCPF(v.cpf),
                    nome_vendedor: colab.nome_completo,
                    mes_referencia: parseInt(v.mes_referencia),
                    ano_referencia: parseInt(v.ano_referencia),
                    caffeine_fat_meta: parseFloat(v.caffeine_fat_meta) || 0,
                    caffeine_fat_realizado: parseFloat(v.caffeine_fat_realizado) || 0,
                    caffeine_pos_meta: parseInt(v.caffeine_pos_meta) || 0,
                    caffeine_pos_realizado: parseInt(v.caffeine_pos_realizado) || 0,
                    sublyme_fat_meta: parseFloat(v.sublyme_fat_meta) || 0,
                    sublyme_fat_realizado: parseFloat(v.sublyme_fat_realizado) || 0,
                    sublyme_pos_meta: parseInt(v.sublyme_pos_meta) || 0,
                    sublyme_pos_realizado: parseInt(v.sublyme_pos_realizado) || 0,
                    koala_fat_meta: parseFloat(v.koala_fat_meta) || 0,
                    koala_fat_realizado: parseFloat(v.koala_fat_realizado) || 0,
                    koala_pos_meta: parseInt(v.koala_pos_meta) || 0,
                    koala_pos_realizado: parseInt(v.koala_pos_realizado) || 0,
                    salario_base: parseFloat(v.salario_base) || 0,
                    multiplicador: parseFloat(v.multiplicador) || 0,
                    status_aprovacao: v.status_aprovacao || 'pendente'
                };
            }).filter(v => v !== null);

            const { data, error } = await supabase
                .from('apuracao_variavel')
                .upsert(variaveisFormatadas, {
                    onConflict: 'cpf,mes_referencia,ano_referencia'
                })
                .select();

            if (error) throw error;



            // =========================================================
            // LÓGICA DE SNAPSHOT (HISTÓRICO)
            // =========================================================
            try {
                const now = new Date();
                const timestampStr = now.toLocaleString('pt-BR');
                const nomeRelatorio = `Variável ${now.getTime()} - ${timestampStr}`;

                const { data: relCriado, error: errCriacao } = await supabase
                    .from('relatorios_gerados')
                    .insert({
                        nome: nomeRelatorio,
                        tipo: 'variavel',
                        mes_referencia: variaveisFormatadas[0].mes_referencia,
                        ano_referencia: variaveisFormatadas[0].ano_referencia,
                        filtros_usados: { origem: 'upload_planilha', total_registros: variaveisFormatadas.length },
                        status: 'gerado'
                    })
                    .select()
                    .single();

                if (!errCriacao && relCriado) {
                    const itensParaSalvar = variaveisFormatadas.map(linha => ({
                        relatorio_id: relCriado.id,
                        cpf: linha.cpf,
                        nome_colaborador: linha.nome_vendedor,
                        dados_snapshot: linha
                    }));

                    const { error: errItens } = await supabase
                        .from('relatorios_itens')
                        .insert(itensParaSalvar);

                    if (errItens) console.error('Erro ao salvar snapshot itens (Variável):', errItens);
                } else {
                    console.error('Erro ao criar snapshot header (Variável):', errCriacao);
                }
            } catch (snapError) {
                console.error('Erro crítico no processo de snapshot (Variável):', snapError);
            }

            res.status(201).json({
                success: true,
                data,
                total: data.length,
                message: `${data.length} registro(s) de variável processado(s) com sucesso. Histórico salvo.`
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

module.exports = variavelController;
