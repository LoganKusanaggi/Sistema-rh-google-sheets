const supabase = require('../config/supabase');
const RelatorioService = require('../services/relatorioService');

const relatoriosController = {

    // ===== GERAR RELATÓRIO (EXISTENTE) =====
    async gerarRelatorio(req, res) {
        try {
            const { tipoRelatorio, filtros, user_id } = req.body;

            console.log(`Iniciando geração de relatório: ${tipoRelatorio}`);

            // Chama o Service
            const resultado = await RelatorioService.gerarRelatorio(tipoRelatorio, filtros, user_id);

            res.status(200).json({
                success: true,
                ...resultado
            });

        } catch (error) {
            console.error('Erro no controller de relatórios:', error);
            res.status(500).json({
                success: false,
                error: error.message
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

            // --- CARREGAR DADOS AUXILIARES EM MASSA ---
            const ids = colabs.map(c => c.id);

            // 1. Planos Ativos
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

            // 2. Preços
            const { data: todosPrecos } = await supabase.from('planos_precos').select('*');
            console.log(`Preços retornados: ${todosPrecos ? todosPrecos.length : 0}`);

            // Map de preços por PlanoID
            const precosPorPlano = {};
            if (todosPrecos) {
                todosPrecos.forEach(pp => {
                    if (!precosPorPlano[pp.plano_id]) precosPorPlano[pp.plano_id] = [];
                    precosPorPlano[pp.plano_id].push(pp);
                });
            }

            // 3. Dependentes (para calcular custos)
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

            // --- PROCESSAR ENRIQUECIMENTO ---
            const enrichedData = [];

            for (const c of colabs) {
                const idade = benefitCalculator.calcularIdade(c.data_nascimento);

                // Defaults
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

                // Achar planos do colaborador
                const meusVinculos = vinculos ? vinculos.filter(v => v.colaborador_id === c.id) : [];
                // console.log(`Colab ${c.nome_completo} tem ${meusVinculos.length} vinculos`);

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

                        // Custo Titular
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

                        // Custo Dependentes (Iteração Manual)
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

            res.json({
                success: true,
                colaboradores: enrichedData,
                total: enrichedData.length
            });

        } catch (error) {
            console.error('Erro ao buscar colaboradores com filtros:', error);
            res.status(500).json({ success: false, error: error.message });
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
        res.json({ success: true, tipos });
    },

    // ===== EXPORTAR RELATÓRIO (Stub) =====
    async exportarRelatorio(req, res) {
        // Futuro: Gerar PDF/Excel aqui
        const { relatorio_id, formato } = req.body;
        res.json({
            success: true,
            message: 'Funcionalidade de exportação em desenvolvimento',
            download_url: null
        });
    },

    // ===== LISTAR HISTÓRICO =====
    async listarHistorico(req, res) {
        try {
            const { tipo, limit = 50 } = req.body; // ou query params

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

            res.json({ success: true, historico: data });
        } catch (error) {
            console.error('Erro ao listar histórico:', error);
            res.status(500).json({ success: false, error: error.message });
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

            // Compatibilidade com GAS: enviar itens na raiz
            const itens = relatorio.itens || [];

            // Limpeza opcional: remover itens de dentro do objeto relatorio para economizar bytes?
            // delete relatorio.itens; 

            res.json({ success: true, relatorio, itens });
        } catch (error) {
            console.error('Erro ao obter histórico:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

module.exports = relatoriosController;
