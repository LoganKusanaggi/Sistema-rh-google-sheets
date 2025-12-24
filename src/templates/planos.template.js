const planosTemplate = {
    gerar(dados, totais, periodo) {
        const { mes, ano } = periodo;

        // Estrutura simplificada para JSON (frontend trata a exibição)
        // Se fosse CSV/Excel real, aqui formataríamos.

        // Colunas
        const colunas = [
            { key: 'nome_colaborador', label: 'Colaborador' },
            { key: 'matricula_plano', label: 'Matrícula (Carteirinha)' },
            { key: 'tipo_beneficiario', label: 'Tipo' }, // Titular ou Dependente
            { key: 'parentesco', label: 'Parentesco' },
            { key: 'data_nascimento', label: 'Dt. Nascimento' },
            { key: 'idade', label: 'Idade' },
            { key: 'nome_plano', label: 'Plano' },
            { key: 'valor_tabela', label: 'Valor Tabela', format: 'currency' },
            { key: 'parte_empresa', label: 'Parte Empresa', format: 'currency' },
            { key: 'parte_colaborador', label: 'Parte Colaborador', format: 'currency' }
        ];

        return {
            titulo: `Conferência Planos de Saúde/Odonto - ${mes}/${ano}`,
            colunas: colunas,
            dados: dados, // Dados já devem vir "achatados" (uma linha por pessoa)
            totais: totais
        };
    }
};

module.exports = planosTemplate;
