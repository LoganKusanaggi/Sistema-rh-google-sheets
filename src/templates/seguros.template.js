const SegurosTemplate = {

    gerar(dados, totais, config = {}) {
        const { vigencia = 'dez-25' } = config;

        return {
            cabecalho: [
                ['PLANILHA SEGURO DE VIDA - NOV/2025'],
                ['']
            ],

            colunas: [
                { campo: 'substipulamento', nome: 'Substipulamento', largura: 120 },
                { campo: 'modulo', nome: 'Modulo', largura: 80 },
                { campo: 'vigencia', nome: 'Vigência', largura: 100 },
                { campo: 'nome_completo', nome: 'Nome', largura: 300 },
                { campo: 'cargo', nome: 'Cargo/Profissão', largura: 200 },
                { campo: 'data_nascimento', nome: 'Data de Nascimento', largura: 150, formato: 'data' },
                { campo: 'data_admissao', nome: 'Data de Admissão', largura: 150, formato: 'data' },
                { campo: 'cpf', nome: 'CPF', largura: 150, formato: 'cpf' },
                { campo: 'sexo', nome: 'SEXO', largura: 80 }
            ],

            dados: dados.map(linha => ({
                substipulamento: linha.substipulamento,
                modulo: linha.modulo,
                vigencia: linha.vigencia || vigencia,
                nome_completo: linha.nome_completo,
                cargo: linha.cargo,
                data_nascimento: linha.data_nascimento,
                data_admissao: linha.data_admissao,
                cpf: linha.cpf,
                sexo: linha.sexo
            })),

            rodape: [
                [''],
                [`TOTAL: ${dados.length} colaboradores com seguro ativo`]
            ],

            formatacao: {
                cabecalho: {
                    fontSize: 14,
                    bold: true,
                    align: 'center',
                    background: '#ea4335',
                    color: '#ffffff'
                },
                colunas: {
                    fontSize: 10,
                    bold: true,
                    background: '#ea4335',
                    color: '#ffffff'
                },
                dados: {
                    fontSize: 10,
                    zebraStripe: true
                },
                rodape: {
                    fontSize: 11,
                    bold: true,
                    background: '#f4cccc'
                }
            }
        };
    }

};

module.exports = SegurosTemplate;
