const FolhaTemplate = {

    gerar(dados, totais, config = {}) {
        const { mes, ano } = config;
        const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
        const mesExtenso = meses[mes - 1] || '';

        // Cabeçalho complexo conforme layout Amil/Saúde
        // Planilha 02. Templeta_ 2025 FOLHA DE PAGAMENTO - ...xlsx
        return {
            cabecalho: [
                ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '8111 (AMIL 2)', '313 (AMIL 2)', '370 (AMIL ODONTO 13)', '392 (AMIL ODONTO 13)']
            ],

            colunas: [
                { campo: 'nome', nome: 'NOME', largura: 250 },
                { campo: 'local', nome: 'LOCAL', largura: 100 },
                { campo: 'admissao', nome: 'ADMISSÃO', largura: 100, formato: 'data_excel' }, // Ex: 45459
                { campo: 'socio', nome: 'SÓCIO', largura: 80 },
                { campo: 'salario', nome: 'SALÁRIO', largura: 100, formato: 'moeda' },
                { campo: 'novo_salario', nome: 'NOVO SALÁRIO', largura: 100, formato: 'moeda' },
                { campo: 'cargo', nome: 'CARGO', largura: 200 },
                { campo: 'departamento', nome: 'DEPARTAMENTO', largura: 150 },
                { campo: 'convenio', nome: 'CONVENIO ESCOLHIDO', largura: 100 },
                { campo: 'dn', nome: 'DN', largura: 100, formato: 'data_excel' }, // Data Nascimento serial
                { campo: 'idade', nome: 'IDADE', largura: 60 },
                { campo: 'faixa_etaria', nome: 'FAIXA ETÁRIA', largura: 100 },
                // AMIL SAUDE
                { campo: 'vl_100_amil', nome: 'VL 100% AMIL', largura: 100, formato: 'moeda' },
                { campo: 'vl_empresa_amil', nome: 'VL EMPRESA AMIL', largura: 100, formato: 'moeda' },
                { campo: 'vl_func_amil', nome: 'VL FUNC. AMIL', largura: 100, formato: 'moeda' },
                { campo: 'amil_saude_dep', nome: 'AMIL SAÚDE DEP', largura: 100, formato: 'moeda' },
                // ODONTO
                { campo: 'odonto_func', nome: 'ODONT. FUNC.', largura: 100, formato: 'moeda' },
                { campo: 'odonto_dep', nome: 'ODONT. DEP.', largura: 100, formato: 'moeda' }
            ],

            dados: dados.map(linha => ({
                nome: linha.nome_completo,
                local: linha.local_trabalho || 'Matriz',
                admissao: linha.data_admissao, // Deve ser convertido para serial no serviço ou front
                socio: linha.socio || '',
                salario: linha.salario_base,
                novo_salario: linha.novo_salario || '',
                cargo: linha.cargo,
                departamento: linha.departamento,
                convenio: linha.convenio || '-',
                dn: linha.data_nascimento, // Deve ser convertido para serial
                idade: linha.idade,
                faixa_etaria: linha.faixa_etaria || '-',

                vl_100_amil: linha.vl_100_amil || 0,
                vl_empresa_amil: linha.vl_empresa_amil || 0,
                vl_func_amil: linha.vl_func_amil || 0,
                amil_saude_dep: linha.amil_saude_dep || 0,

                odonto_func: linha.odonto_func || 0,
                odonto_dep: linha.odonto_dep || 0
            })),

            rodape: [], // Pelo visto não tem rodapé de totais na linha final do exemplo

            formatacao: {
                cabecalho: {
                    fontSize: 10,
                    bold: true,
                    align: 'center',
                    background: '#d9e1f2' // Azul claro excel
                },
                colunas: {
                    fontSize: 10,
                    bold: true,
                    background: '#4472c4', // Azul escuro
                    color: '#ffffff'
                },
                dados: {
                    fontSize: 10,
                    zebraStripe: false
                }
            }
        };
    }

};

module.exports = FolhaTemplate;
