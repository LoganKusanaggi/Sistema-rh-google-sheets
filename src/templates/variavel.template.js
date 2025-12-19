const VariavelTemplate = {

    gerar(dados, totais, config = {}) {
        const { mes, ano } = config;
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        return {
            cabecalho: [
                [`APURAÇÃO DE VARIÁVEL - ${meses[mes - 1]}/${ano}`],
                ['']
            ],

            colunas: [
                { campo: 'nome_vendedor', nome: 'Vendedor', largura: 200, rowspan: 2 },
                { campo: 'caffeine_header', nome: 'Caffeine', largura: 400, colspan: 4, align: 'center', background: '#ff6d00' },
                { campo: 'sublyme_header', nome: 'Sublyme', largura: 400, colspan: 4, align: 'center', background: '#ab47bc' },
                { campo: 'koala_header', nome: 'Koala', largura: 400, colspan: 4, align: 'center', background: '#00acc1' },
                { campo: 'variavel_header', nome: 'Variável', largura: 300, colspan: 3, align: 'center', background: '#43a047' }
            ],

            subcolunas: [
                { campo: 'caffeine_fat_meta', nome: 'Meta Fat.', largura: 100, formato: 'moeda' },
                { campo: 'caffeine_fat_realizado', nome: 'Real. Fat.', largura: 100, formato: 'moeda' },
                { campo: 'caffeine_fat_percentual', nome: '%', largura: 80, formato: 'percentual' },
                { campo: 'caffeine_pos_realizado', nome: 'Posit.', largura: 80 },

                { campo: 'sublyme_fat_meta', nome: 'Meta Fat.', largura: 100, formato: 'moeda' },
                { campo: 'sublyme_fat_realizado', nome: 'Real. Fat.', largura: 100, formato: 'moeda' },
                { campo: 'sublyme_fat_percentual', nome: '%', largura: 80, formato: 'percentual' },
                { campo: 'sublyme_pos_realizado', nome: 'Posit.', largura: 80 },

                { campo: 'koala_fat_meta', nome: 'Meta Fat.', largura: 100, formato: 'moeda' },
                { campo: 'koala_fat_realizado', nome: 'Real. Fat.', largura: 100, formato: 'moeda' },
                { campo: 'koala_fat_percentual', nome: '%', largura: 80, formato: 'percentual' },
                { campo: 'koala_pos_realizado', nome: 'Posit.', largura: 80 },

                { campo: 'salario_base', nome: 'Salário', largura: 100, formato: 'moeda' },
                { campo: 'multiplicador', nome: 'Multip.', largura: 80, formato: 'percentual' },
                { campo: 'valor_variavel', nome: 'Variável', largura: 120, formato: 'moeda' }
            ],

            dados: dados.map(linha => ({
                nome_vendedor: linha.nome_vendedor,
                caffeine_fat_meta: linha.caffeine_fat_meta,
                caffeine_fat_realizado: linha.caffeine_fat_realizado,
                caffeine_fat_percentual: linha.caffeine_fat_percentual,
                caffeine_pos_realizado: linha.caffeine_pos_realizado,
                sublyme_fat_meta: linha.sublyme_fat_meta,
                sublyme_fat_realizado: linha.sublyme_fat_realizado,
                sublyme_fat_percentual: linha.sublyme_fat_percentual,
                sublyme_pos_realizado: linha.sublyme_pos_realizado,
                koala_fat_meta: linha.koala_fat_meta,
                koala_fat_realizado: linha.koala_fat_realizado,
                koala_fat_percentual: linha.koala_fat_percentual,
                koala_pos_realizado: linha.koala_pos_realizado,
                salario_base: linha.salario_base,
                multiplicador: linha.multiplicador,
                valor_variavel: linha.valor_variavel
            })),

            rodape: [
                [''],
                [
                    `TOTAL: ${dados.length} vendedores`,
                    '', '', '', '',
                    '', '', '', '',
                    '', '', '', '',
                    '', '',
                    totais.valor_total
                ]
            ],

            formatacao: {
                cabecalho: {
                    fontSize: 14,
                    bold: true,
                    align: 'center'
                },
                colunas: {
                    fontSize: 9,
                    bold: true,
                    color: '#ffffff'
                },
                subcolunas: {
                    fontSize: 8,
                    bold: true,
                    background: '#f3f3f3'
                },
                dados: {
                    fontSize: 9,
                    zebraStripe: true
                },
                rodape: {
                    fontSize: 10,
                    bold: true,
                    background: '#d9ead3'
                }
            }
        };
    }

};

module.exports = VariavelTemplate;
