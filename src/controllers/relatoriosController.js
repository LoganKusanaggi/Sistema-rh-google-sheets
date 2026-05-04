const supabase = require('../config/supabase');
const RelatorioService = require('../services/relatorioService');

const relatoriosController = {

    // ===== GERAR RELATÓRIO =====
    async gerarRelatorio(req, res) {
        try {
            const body = req.body || {};
            const tipo = String(body.tipo || body.tipoRelatorio || '').trim().toLowerCase();
            const cpfs = Array.isArray(body.cpfs) ? body.cpfs : [];
            const filtros = body.filtros && typeof body.filtros === 'object' ? body.filtros : {};
            const formato = body.formato || 'json';

            let periodo = null;
            if (body.periodo && typeof body.periodo === 'object') {
                const mes = parseInt(body.periodo.mes, 10);
                const ano = parseInt(body.periodo.ano, 10);

                if (!isNaN(mes) && !isNaN(ano)) {
                    periodo = { mes: mes, ano: ano };
                }
            }

            console.log('[relatorios/gerar] payload:', {
                tipo: tipo,
                hasCpfs: cpfs.length > 0,
                cpfsCount: cpfs.length,
                periodo: periodo,
                filtros: filtros
            });

            const resultado = await RelatorioService.gerarRelatorio({
                tipo: tipo,
                cpfs: cpfs,
                periodo: periodo,
                filtros: filtros,
                formato: formato,
                user_id: body.user_id || null
            });

            if (!resultado || resultado.success === false) {
                return res.status(400).json(resultado || {
                    success: false,
                    error: 'Não foi possível gerar o relatório.'
                });
            }

            return res.status(200).json(resultado);
        } catch (error) {
            console.error('Erro no controller de relatórios:', error);
            return res.status(500).json({
                success: false,
                error: error.message || 'Erro interno ao gerar relatório.'
            });
        }
    },

    // ===== BUSCAR COLABORADORES COM FILTROS (ATUALIZADO PARA PREENCHIMENTO DO GAS) =====
    async buscarComFiltros(req, res) {
        try {
            console.log('--- BUSCAR COM FILTROS CHAMADO (V3 - DEBUG) ---');
            const { filtros } = req.body;
            const benefitCalculator = require('../utils/benefitCalculator');

            let query = supabase
                .from('colaboradores')
                .select('id, cpf, nome_completo, departamento, cargo, status, data_admissao, email, telefone, matricula, codigo_folha, local_trabalho, cidade, data_nascimento, salario_base')
                .order('nome_completo', { ascending: true });

            if (filtros) {
                if (filtros.nome) query = query.ilike('nome_completo', `%${filtros.nome}%`);
                if (filtros.cpf) query = query.eq('cpf', filtros.cpf.replace(/\D/g, ''));
                if (filtros.status) query = query.eq('status', filtros.status);
            }

            const { data: colabs, error } = await query;
            if (error) throw error;

            console.log(`Encontrados ${colabs.length} colaboradores.`);
            if (colabs.length > 0) {
                console.log(`Exemplo de ID: ${colabs[0].id}`);
            }

            const ids = colabs.map(c => c.id);

            console.log(`Buscando planos ativos para ${ids.length} IDs...`);
            const { data: vinculos, error: linkError } = await supabase
                .from('colaboradores_planos')
                .select('*, plano:planos(*)')
                .in('colaborador_id', ids)
                .eq('ativo', true);

            if (linkError) {
                console.error('Erro ao buscar vinculos:', linkError);
            }
            console.log(`Vinculos retornados: ${vinculos ? vinculos.length : 0}`);

            const { data: todosPrecos } = await supabase.from('planos_precos').select('*');
            console.log(`Preços retornados: ${todosPrecos ? todosPrecos.length : 0}`);

            const precosPorPlano = {};
            if (todosPrecos) {
                todosPrecos.forEach(pp => {
                    if (!precosPorPlano[pp.plano_id]) precosPorPlano[pp.plano_id] = [];
                    precosPorPlano[pp.plano_id].push(pp);
                });
            }

            const { data: todosDependentes } = await supabase
                .from('dependentes')
                .select('*')
                .in('colaborador_id', ids);
            const depPorColab = {};
            if (todosDependentes) {
                todosDependentes.forEach(d => {
                    if (!depPorColab[d.colaborador_id]) depPorColab[d.colaborador_id] = [];
                    depPorColab[d.colaborador_id].push(d);
                });
            }

            const enrichedData = [];

            for (const c of colabs) {
                const idade = benefitCalculator.calcularIdade(c.data_nascimento);

                let item = {
                    ...c,
                    idade: idade,
                    faixa_etaria: '',
                    convenio_escolhido: '',
                    vl_100_amil: 0,
                    vl_empresa_amil: 0,
                    vl_func_amil: 0,
                    amil_saude_dep: 0,
                    odont_func: 0,
                    odont_dep: 0
                };

                const meusVinculos = vinculos ? vinculos.filter(v => v.colaborador_id === c.id) : [];

                for (const v of meusVinculos) {
                    if (!v.plano) {
                        console.warn(`Vinculo ${v.id} sem plano associado!`);
                        continue;
                    }
                    const p = v.plano;
                    const precos = precosPorPlano[p.plano_id] || precosPorPlano[p.id] || [];

                    if (precos.length === 0) {
                        console.warn(`Plano ${p.nome} (ID ${p.id}) sem preços cadastrados!`);
                    }

                    if (p.tipo === 'SAUDE') {
                        item.convenio_escolhido = p.nome;

                        const precoTitular = benefitCalculator.encontrarPreco(precos, idade);
                        const faixaObj = precos.find(price => parseFloat(price.valor) === parseFloat(precoTitular));

                        if (faixaObj) {
                            item.faixa_etaria = faixaObj.faixa_etaria;
                        } else {
                            item.faixa_etaria = `${idade} anos`;
                        }

                        const calc = benefitCalculator.calcularSaudeTitular(precoTitular);
                        item.vl_100_amil = calc.valor_total;
                        item.vl_empresa_amil = calc.parte_empresa;
                        item.vl_func_amil = calc.parte_funcionario;

                        const meusDeps = depPorColab[c.id] || [];
                        let custoDeps = 0;
                        for (const dep of meusDeps) {
                            const idDep = benefitCalculator.calcularIdade(dep.data_nasc);
                            custoDeps += benefitCalculator.encontrarPreco(precos, idDep);
                        }
                        item.amil_saude_dep = custoDeps;
                    }

                    if (p.tipo === 'ODONTO') {
                        const precoOdonto = precos.length > 0 ? parseFloat(precos[0].valor) : 0;
                        item.odont_func = precoOdonto;

                        const meusDeps = depPorColab[c.id] || [];
                        item.odont_dep = meusDeps.length * precoOdonto;
                    }
                }

                enrichedData.push(item);
            }

            return res.json({
                success: true,
                colaboradores: enrichedData,
                total: enrichedData.length
            });

        } catch (error) {
            console.error('Erro ao buscar colaboradores com filtros:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    // ===== LISTAR TIPOS DE RELATÓRIOS =====
    async listarTipos(req, res) {
        const tipos = [
            { id: 'folha', nome: 'Folha de Pagamento' },
            { id: 'beneficios', nome: 'Benefícios Flexíveis' },
            { id: 'variavel', nome: 'Remuneração Variável' },
            { id: 'apontamentos', nome: 'Apontamentos' },
            { id: 'seguros', nome: 'Seguro de Vida' },
            { id: 'planos', nome: 'Conferência Planos de Saúde' }
        ];
        return res.json({ success: true, tipos });
    },

    // ===== EXPORTAR RELATÓRIO (Stub) =====
    async exportarRelatorio(req, res) {
        const { relatorio_id, formato } = req.body;
        return res.json({
            success: true,
            message: 'Funcionalidade de exportação em desenvolvimento',
            download_url: null
        });
    },

    // ===== LISTAR HISTÓRICO =====
    async listarHistorico(req, res) {
        try {
            const { tipo, limit = 50 } = req.body;

            let query = supabase
                .from('relatorios_gerados')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (tipo) {
                query = query.eq('tipo', tipo);
            }

            const { data, error } = await query;
            if (error) throw error;

            return res.json({ success: true, historico: data });
        } catch (error) {
            console.error('Erro ao listar histórico:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    // ===== OBTER DETALHES DO HISTÓRICO =====
    async obterHistorico(req, res) {
        try {
            const { id } = req.params;

            const { data: relatorio, error } = await supabase
                .from('relatorios_gerados')
                .select('*, itens:relatorios_itens(*)')
                .eq('id', id)
                .single();

            if (error) throw error;

            const itens = relatorio.itens || [];

            return res.json({ success: true, relatorio, itens });
        } catch (error) {
            console.error('Erro ao obter histórico:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }
};

module.exports = relatoriosController;
