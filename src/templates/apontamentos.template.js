const ApontamentosTemplate = {

    gerar(dados, totais, config = {}) {
        const { mes, ano, codigo_empresa = '0000312', razao_social = 'SUPER INDUSTRIA DE ALIMENTOS LTDA' } = config;

        return {
            cabecalho: [
                ['RELAÇÃO DE VALORES PARA FOLHA DE PAGAMENTO'],
                [''],
                [`Codigo Empresa: ${codigo_empresa}`],
                [`Razão Social: ${razao_social}`],
                [`Inscrição Cnpj: 43707279000150`],
                [`Competência: ${String(mes).padStart(2, '0')}/${ano}`],
                ['']
            ],

            colunas: [
                { campo: 'tipo_calculo', nome: 'Tipo de Calculo', largura: 100 },
                { campo: 'codigo_folha', nome: 'Código Folha', largura: 120 },
                { campo: 'nome_completo', nome: 'Nome dos Colaboradores', largura: 300 },
                { campo: 'desc_autorizado', nome: 'Desc Autorizado\n0298', largura: 120, formato: 'moeda' },
                { campo: 'reembolso', nome: 'Reembolso\n0281', largura: 100, formato: 'moeda' },
                { campo: 'comissoes', nome: 'Comissoes\n0037', largura: 100, formato: 'moeda' },
                { campo: 'horas_extras_50', nome: 'HE 50%\n0150', largura: 100, formato: 'decimal' },
                { campo: 'horas_extras_100', nome: 'HE 100%\n0200', largura: 100, formato: 'decimal' },
                { campo: 'horas_noturnas', nome: 'H. Noturnas\n0025', largura: 100, formato: 'decimal' },
                { campo: 'dias_faltas', nome: 'Dias Faltas\n8792', largura: 100 }
            ],

            dados: dados.map(linha => ({
                tipo_calculo: linha.tipo_calculo,
                codigo_folha: linha.codigo_folha,
                nome_completo: linha.nome_completo,
                desc_autorizado: linha.desc_autorizado,
                reembolso: linha.reembolso,
                comissoes: linha.comissoes,
                horas_extras_50: linha.horas_extras_50,
                horas_extras_100: linha.horas_extras_100,
                horas_noturnas: linha.horas_noturnas,
                dias_faltas: linha.dias_faltas
            })),

            rodape: [
                [''],
                [
                    `TOTAL ${dados.length} Colaboradores`,
                    '',
                    '',
                    '0,00',
                    '0,00',
                    '0,00',
                    totais.horas_extras_50,
                    totais.horas_extras_100,
                    totais.horas_noturnas,
                    totais.dias_faltas
                ]
            ],

            formatacao: {
                cabecalho: {
                    fontSize: 12,
                    bold: true,
                    align: 'left'
                },
                colunas: {
                    fontSize: 9,
                    bold: true,
                    background: '#4285f4',
                    color: '#ffffff',
                    wrapText: true
                },
                dados: {
                    fontSize: 10,
                    zebraStripe: true
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

module.exports = ApontamentosTemplate;
