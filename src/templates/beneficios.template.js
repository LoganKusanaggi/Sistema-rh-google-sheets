const BeneficiosTemplate = {

    gerar(dados, totais, config = {}) {
        const { mes, ano } = config;
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        return {
            cabecalho: [
                [`RECARGA BENEFÍCIOS CAJU - ${meses[mes - 1]}/${ano}`],
                ['']
            ],

            colunas: [
                { campo: 'nome_completo', nome: 'NOME', largura: 300 },
                { campo: 'cidade', nome: 'Cidade', largura: 100 },
                { campo: 'ferias', nome: 'FÉRIAS', largura: 80 },
                { campo: 'alimentacao', nome: 'Alimentação', largura: 120, formato: 'moeda' },
                { campo: 'transporte', nome: 'Transporte', largura: 120, formato: 'moeda' },
                { campo: 'cultura', nome: 'Cultura', largura: 100, formato: 'moeda' },
                { campo: 'saude', nome: 'Saúde', largura: 100, formato: 'moeda' },
                { campo: 'educacao', nome: 'Educação', largura: 100, formato: 'moeda' },
                { campo: 'home_office', nome: 'Home Office', largura: 120, formato: 'moeda' },
                { campo: 'total_beneficios', nome: 'Total', largura: 130, formato: 'moeda' }
            ],

            dados: dados.map((linha, index) => ({
                _row: index + 1,
                nome_completo: linha.nome_completo,
                cidade: linha.cidade,
                ferias: linha.ferias,
                alimentacao: linha.alimentacao,
                transporte: linha.transporte,
                cultura: linha.cultura,
                saude: linha.saude,
                educacao: linha.educacao,
                home_office: linha.home_office,
                total_beneficios: linha.total_beneficios
            })),

            rodape: [
                [''],
                [
                    `TOTAL: ${dados.length} colaboradores`,
                    '',
                    '',
                    totais.alimentacao,
                    totais.transporte,
                    '',
                    '',
                    '',
                    '',
                    totais.total
                ]
            ],

            formatacao: {
                cabecalho: {
                    fontSize: 14,
                    bold: true,
                    align: 'center',
                    background: '#34a853',
                    color: '#ffffff'
                },
                colunas: {
                    fontSize: 10,
                    bold: true,
                    background: '#34a853',
                    color: '#ffffff'
                },
                dados: {
                    fontSize: 10,
                    zebraStripe: true
                },
                rodape: {
                    fontSize: 11,
                    bold: true,
                    background: '#d9ead3'
                }
            }
        };
    }

};

module.exports = BeneficiosTemplate;
