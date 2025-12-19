const FolhaTemplate = {

    gerar(dados, totais, config = {}) {
        const { mes, ano, codigo_empresa = '0000312', razao_social = 'SUPER INDUSTRIA DE ALIMENTOS LTDA' } = config;

        return {
            cabecalho: [
                ['RELAÇÃO DE VALORES PARA FOLHA DE PAGAMENTO'],
                [''],
                [`Código Empresa: ${codigo_empresa}`],
                [`Razão Social: ${razao_social}`],
                [`Inscrição CNPJ: 43707279000150`],
                [`Competência: ${String(mes).padStart(2, '0')}/${ano}`],
                ['']
            ],

            colunas: [
                { campo: 'tipo_calculo', nome: 'Tipo de Calculo', largura: 100 },
                { campo: 'codigo_folha', nome: 'Código Folha', largura: 120 },
                { campo: 'nome_completo', nome: 'Nome dos Colaboradores', largura: 300 },
                { campo: 'salario_base', nome: 'Salário Base', largura: 120, formato: 'moeda' },
                { campo: 'horas_extras_50', nome: 'HE 50%', largura: 100, formato: 'moeda' },
                { campo: 'horas_extras_100', nome: 'HE 100%', largura: 100, formato: 'moeda' },
                { campo: 'horas_noturnas', nome: 'H. Noturnas', largura: 100, formato: 'moeda' },
                { campo: 'inss', nome: 'INSS', largura: 100, formato: 'moeda' },
                { campo: 'irrf', nome: 'IRRF', largura: 100, formato: 'moeda' },
                { campo: 'salario_liquido', nome: 'Líquido', largura: 150, formato: 'moeda' }
            ],

            dados: dados.map(linha => ({
                tipo_calculo: linha.tipo_calculo,
                codigo_folha: linha.codigo_folha,
                nome_completo: linha.nome_completo,
                salario_base: linha.salario_base,
                horas_extras_50: linha.horas_extras_50,
                horas_extras_100: linha.horas_extras_100,
                horas_noturnas: linha.horas_noturnas,
                inss: linha.inss,
                irrf: linha.irrf,
                salario_liquido: linha.salario_liquido
            })),

            rodape: [
                [''],
                [
                    `TOTAL ${dados.length} Colaboradores`,
                    '',
                    '',
                    totais.salario_base,
                    '',
                    '',
                    '',
                    totais.inss,
                    totais.irrf,
                    totais.liquido
                ]
            ],

            formatacao: {
                cabecalho: {
                    fontSize: 12,
                    bold: true,
                    align: 'left'
                },
                colunas: {
                    fontSize: 10,
                    bold: true,
                    background: '#4285f4',
                    color: '#ffffff',
                    align: 'center'
                },
                dados: {
                    fontSize: 10,
                    zebraStripe: true,
                    align: 'left'
                },
                rodape: {
                    fontSize: 11,
                    bold: true,
                    background: '#f3f3f3'
                }
            }
        };
    }

};

module.exports = FolhaTemplate;
