const supabase = require('../config/supabase');
const { formatarCPF } = require('../utils/validators');
const RelatorioService = require('../services/relatorioService');

const relatoriosController = {

    // ===== GERAR RELATÓRIO GENÉRICO =====
    async gerarRelatorio(req, res) {
        try {
            const { tipo, cpfs, periodo, formato = 'json', opcoes = {}, salvar_historico = true } = req.body;

            // Validações
            if (!tipo) {
                return res.status(400).json({ success: false, error: 'Tipo de relatório é obrigatório' });
            }
            if (!cpfs || !Array.isArray(cpfs) || cpfs.length === 0) {
                return res.status(400).json({ success: false, error: 'CPFs dos colaboradores são obrigatórios' });
            }

            const cpfsFormatados = cpfs.map(formatarCPF);

            // Delegar para o serviço específico
            let resultado;
            switch (tipo) {
                case 'folha': resultado = await RelatorioService.gerarFolha(cpfsFormatados, periodo, opcoes); break;
                case 'beneficios': resultado = await RelatorioService.gerarBeneficios(cpfsFormatados, periodo, opcoes); break;
                case 'variavel': resultado = await RelatorioService.gerarVariavel(cpfsFormatados, periodo, opcoes); break;
                case 'apontamentos': resultado = await RelatorioService.gerarApontamentos(cpfsFormatados, periodo, opcoes); break;
                case 'seguros': resultado = await RelatorioService.gerarSeguros(cpfsFormatados, opcoes); break;
                default: return res.status(400).json({ success: false, error: `Tipo inválido: ${tipo}` });
            }

            // ===== PERSISTIR NO BANCO (HISTÓRICO) =====
            let relatorioId = null;
            if (salvar_historico) {
                // 1. Criar o cabeçalho do relatório
                // Nome Ex: "folha 01-202512" (timestamp)
                const timestamp = new Date().getTime();
                const nomeRelatorio = `${tipo} ${timestamp}`;

                const { data: relCriado, error: errCriacao } = await supabase
                    .from('relatorios_gerados')
                    .insert({
                        nome: nomeRelatorio,
                        tipo: tipo,
                        mes_referencia: periodo?.mes,
                        ano_referencia: periodo?.ano,
                        filtros_usados: { cpfs: cpfsFormatados, opcoes },
                        status: 'gerado'
                    })
                    .select()
                    .single();

                if (errCriacao) {
                    console.error('Erro ao salvar cabeçalho do relatório:', errCriacao);
                    // Não aborta a resposta, apenas loga
                } else {
                    relatorioId = relCriado.id;

                    // 2. Salvar os itens (linhas)
                    const itensParaSalvar = resultado.dados.map(linha => ({
                        relatorio_id: relatorioId,
                        colaborador_id: linha.colaborador_id || null, // Novo campo
                        cpf: linha.cpf || null,
                        nome_colaborador: linha.nome_completo || linha.nome,
                        dados_snapshot: linha
                    }));

                    if (itensParaSalvar.length > 0) {
                        const { error: errItens } = await supabase
                            .from('relatorios_itens')
                            .insert(itensParaSalvar);

                        if (errItens) console.error('Erro ao salvar itens do relatório:', errItens);
                    }
                }
            }

            res.json({
                success: true,
                tipo,
                relatorio_id: relatorioId,
                dados: resultado.dados,
                totais: resultado.totais,
                layout: resultado.layout,
                metadata: {
                    total_colaboradores: cpfsFormatados.length,
                    periodo: periodo,
                    gerado_em: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // ===== BUSCAR COLABORADORES COM FILTROS =====
    async buscarComFiltros(req, res) {
        try {
            console.log('--- BUSCAR COM FILTROS CHAMADO ---');
            console.log('Body recebido:', JSON.stringify(req.body, null, 2));

            const { filtros } = req.body;
            // Filtros esperados: { nome, cpf, departamento, cargo, status }

            let query = supabase
                .from('colaboradores')
                .select('id, cpf, nome_completo, departamento, cargo, status, data_admissao, email, telefone, matricula, codigo_folha, local_trabalho, cidade, data_nascimento')
                .order('nome_completo', { ascending: true });

            if (filtros) {
                console.log('Aplicando filtros:', filtros);
                if (filtros.nome) {
                    query = query.ilike('nome_completo', `%${filtros.nome}%`);
                }
                if (filtros.cpf) {
                    const cpfLimpo = filtros.cpf.replace(/\D/g, '');
                    console.log('Filtrando por CPF:', cpfLimpo);
                    query = query.eq('cpf', cpfLimpo);
                }
                if (filtros.departamento) {
                    query = query.eq('departamento', filtros.departamento);
                }
                if (filtros.cargo) {
                    query = query.ilike('cargo', `%${filtros.cargo}%`);
                }
                if (filtros.status) {
                    query = query.eq('status', filtros.status);
                }
            } else {
                console.log('Nenhum filtro fornecido no objeto filtros');
            }

            const { data, error } = await query;

            if (error) throw error;

            console.log('Registros encontrados:', data ? data.length : 0);
            if (data && data.length > 0) {
                console.log('Exemplo de registro (primeiro):', JSON.stringify(data[0], null, 2));
                console.log('CHAVES ENCONTRADAS NO BANCO:', Object.keys(data[0]));
            }

            res.json({
                success: true,
                colaboradores: data,
                total: data.length
            });

        } catch (error) {
            console.error('Erro ao buscar colaboradores:', error);
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
            { id: 'seguros', nome: 'Seguro de Vida' }
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

            // Buscar cabeçalho
            const { data: header, error: errHeader } = await supabase
                .from('relatorios_gerados')
                .select('*')
                .eq('id', id)
                .single();

            if (errHeader) throw errHeader;

            // Buscar itens
            const { data: itens, error: errItens } = await supabase
                .from('relatorios_itens')
                .select('*')
                .eq('relatorio_id', id);

            if (errItens) throw errItens;

            res.json({ success: true, relatorio: header, itens: itens });
        } catch (error) {
            console.error('Erro ao obter detalhes:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

module.exports = relatoriosController;
