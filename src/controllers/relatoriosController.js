const supabase = require('../config/supabase');
const { formatarCPF } = require('../utils/validators');
const RelatorioService = require('../services/relatorioService');

const relatoriosController = {

    // ===== GERAR RELATÓRIO GENÉRICO =====
    async gerarRelatorio(req, res) {
        try {
            const { tipo, cpfs, periodo, formato = 'json', opcoes = {} } = req.body;

            // Validações
            if (!tipo) {
                return res.status(400).json({
                    success: false,
                    error: 'Tipo de relatório é obrigatório'
                });
            }

            if (!cpfs || !Array.isArray(cpfs) || cpfs.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'CPFs dos colaboradores são obrigatórios'
                });
            }

            // Formatar CPFs
            const cpfsFormatados = cpfs.map(formatarCPF);

            // Delegar para o serviço específico
            let resultado;

            switch (tipo) {
                case 'folha':
                    resultado = await RelatorioService.gerarFolha(cpfsFormatados, periodo, opcoes);
                    break;
                case 'beneficios':
                    resultado = await RelatorioService.gerarBeneficios(cpfsFormatados, periodo, opcoes);
                    break;
                case 'variavel':
                    resultado = await RelatorioService.gerarVariavel(cpfsFormatados, periodo, opcoes);
                    break;
                case 'apontamentos':
                    resultado = await RelatorioService.gerarApontamentos(cpfsFormatados, periodo, opcoes);
                    break;
                case 'seguros':
                    resultado = await RelatorioService.gerarSeguros(cpfsFormatados, opcoes);
                    break;
                case 'ficha_completa':
                    resultado = await RelatorioService.gerarFichaCompleta(cpfsFormatados);
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        error: `Tipo de relatório inválido: ${tipo}`
                    });
            }

            // Registrar log
            await supabase.from('logs_sincronizacao').insert({
                tabela_origem: 'relatorios',
                operacao: 'SYNC',
                dados_depois: { tipo, cpfs: cpfsFormatados, periodo },
                sucesso: true,
                quantidade_registros: cpfsFormatados.length
            });

            res.json({
                success: true,
                tipo,
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

            // Log de erro
            await supabase.from('logs_sincronizacao').insert({
                tabela_origem: 'relatorios',
                operacao: 'SYNC',
                sucesso: false,
                mensagem_erro: error.message
            });

            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // ===== LISTAR TIPOS DE RELATÓRIOS DISPONÍVEIS =====
    async listarTipos(req, res) {
        try {
            const tipos = [
                {
                    id: 'folha',
                    nome: 'Folha de Pagamento',
                    descricao: 'Relatório completo de folha de pagamento mensal',
                    requer_periodo: true,
                    campos: [
                        'nome', 'codigo_folha', 'salario_base', 'horas_extras',
                        'inss', 'irrf', 'salario_liquido'
                    ]
                },
                {
                    id: 'beneficios',
                    nome: 'Benefícios Flexíveis (Caju)',
                    descricao: 'Relatório de benefícios flexíveis',
                    requer_periodo: true,
                    campos: [
                        'nome', 'cidade', 'alimentacao', 'transporte',
                        'cultura', 'saude', 'total_beneficios'
                    ]
                },
                {
                    id: 'variavel',
                    nome: 'Apuração de Variável',
                    descricao: 'Comissões e variáveis por marca',
                    requer_periodo: true,
                    campos: [
                        'nome_vendedor', 'caffeine_fat_realizado', 'sublyme_fat_realizado',
                        'koala_fat_realizado', 'multiplicador', 'valor_variavel'
                    ]
                },
                {
                    id: 'apontamentos',
                    nome: 'Apontamentos (Controle de Ponto)',
                    descricao: 'Relatório de apontamentos mensais',
                    requer_periodo: true,
                    campos: [
                        'nome', 'codigo_folha', 'horas_extras_50', 'horas_extras_100',
                        'horas_noturnas', 'dias_faltas'
                    ]
                },
                {
                    id: 'seguros',
                    nome: 'Seguros de Vida',
                    descricao: 'Relatório de apólices de seguro de vida',
                    requer_periodo: false,
                    campos: [
                        'nome', 'data_nascimento', 'data_admissao', 'cpf',
                        'vigencia', 'valor_segurado', 'sexo'
                    ]
                },
                {
                    id: 'ficha_completa',
                    nome: 'Ficha Completa do Colaborador',
                    descricao: 'Todos os dados do colaborador',
                    requer_periodo: false,
                    campos: ['todos']
                }
            ];

            res.json({
                success: true,
                tipos
            });

        } catch (error) {
            console.error('Erro ao listar tipos:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // ===== BUSCAR COLABORADORES COM FILTROS =====
    async buscarComFiltros(req, res) {
        try {
            const {
                status,
                departamento,
                cargo,
                data_admissao_de,
                data_admissao_ate,
                cidade,
                termo_busca,
                campos = ['id', 'cpf', 'nome_completo', 'cargo', 'departamento', 'status']
            } = req.body;

            let query = supabase
                .from('colaboradores')
                .select(campos.join(','));

            // Aplicar filtros
            if (status) query = query.eq('status', status);
            if (departamento) query = query.eq('departamento', departamento);
            if (cargo) query = query.eq('cargo', cargo);
            if (cidade) query = query.eq('cidade', cidade);
            if (data_admissao_de) query = query.gte('data_admissao', data_admissao_de);
            if (data_admissao_ate) query = query.lte('data_admissao', data_admissao_ate);

            // Busca por termo (nome ou CPF)
            if (termo_busca) {
                query = query.or(`nome_completo.ilike.%${termo_busca}%,cpf.ilike.%${termo_busca}%`);
            }

            query = query.order('nome_completo', { ascending: true });

            const { data, error } = await query;

            if (error) throw error;

            res.json({
                success: true,
                colaboradores: data,
                total: data.length,
                filtros_aplicados: {
                    status,
                    departamento,
                    cargo,
                    data_admissao_de,
                    data_admissao_ate,
                    termo_busca
                }
            });

        } catch (error) {
            console.error('Erro ao buscar colaboradores:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // ===== EXPORTAR RELATÓRIO (Excel, PDF) =====
    async exportarRelatorio(req, res) {
        try {
            const { tipo, cpfs, periodo, formato = 'excel' } = req.body;

            // Gerar dados do relatório
            const resultado = await relatoriosController.gerarRelatorio(req, res);

            // TODO: Implementar conversão para Excel/PDF
            // Aqui você pode usar bibliotecas como:
            // - exceljs (para Excel)
            // - pdfkit (para PDF)

            res.json({
                success: true,
                message: 'Funcionalidade de exportação em desenvolvimento',
                formato,
                dados: resultado
            });

        } catch (error) {
            console.error('Erro ao exportar:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

};

module.exports = relatoriosController;
