// =====================================================
// FUNÇÃO ATUALIZADA: criarPlanilhaLancamentoFolha
// Baseada no Template Real da Empresa
// =====================================================

function criarPlanilhaLancamentoFolha(cpfs, periodo) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const nomeAba = `Lançamento Folha ${meses[periodo.mes - 1]}-${periodo.ano}`;

    let sheet = ss.getSheetByName(nomeAba);
    if (!sheet) {
        sheet = ss.insertSheet(nomeAba);
    } else {
        const ui = SpreadsheetApp.getUi();
        const resp = ui.alert('Aba já existe', `A aba "${nomeAba}" já existe. Deseja limpá-la e recriar?`, ui.ButtonSet.YES_NO);
        if (resp == ui.Button.NO) {
            ss.setActiveSheet(sheet);
            return;
        }
        sheet.clear();
    }

    // Buscar dados completos dos colaboradores da API
    const dadosCompletos = buscarDadosColaboradores(cpfs);
    const mapDados = {};
    dadosCompletos.forEach(c => {
        const cpfLimpo = String(c.cpf).replace(/\D/g, '');
        mapDados[cpfLimpo] = c;
    });

    // LINHA 1: Cabeçalhos dos planos (opcional, pode ser removido se não necessário)
    const headerPlanos = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '8111 (AMIL 2)', '313 (AMIL 2)', '370 (AMIL ODONTO 13)', '392 (AMIL ODONTO 13)'];
    sheet.getRange(1, 1, 1, 18).setValues([headerPlanos]);
    sheet.getRange(1, 1, 1, 18).setFontSize(8).setFontColor('#666666');

    // LINHA 2: Cabeçalhos principais (conforme template)
    const headers = [
        'NOME', 'LOCAL', 'ADMISSÃO', 'SÓCIO', 'SALÁRIO', 'NOVO SALÁRIO',
        'CARGO', 'DEPARTAMENTO', 'CONVENIO ESCOLHIDO', 'DN', 'IDADE',
        'FAIXA ETÁRIA', 'VL 100% AMIL', 'VL EMPRESA AMIL', 'VL FUNC. AMIL',
        'AMIL SAÚDE DEP', 'ODONT. FUNC.', 'ODONT. DEP.'
    ];

    sheet.getRange(2, 1, 1, 18).setValues([headers]);
    sheet.getRange(2, 1, 1, 18)
        .setFontWeight('bold')
        .setBackground('#4a86e8')
        .setFontColor('white')
        .setHorizontalAlignment('center')
        .setVerticalAlignment('middle');

    // Montar linhas de dados
    const linhas = cpfs.map(cpf => {
        const dados = mapDados[cpf] || {};

        // Calcular idade se tiver data de nascimento
        let idade = '';
        let faixaEtaria = '';
        if (dados.data_nascimento) {
            const hoje = new Date();
            const nascimento = new Date(dados.data_nascimento);
            idade = hoje.getFullYear() - nascimento.getFullYear();

            // Determinar faixa etária
            if (idade >= 0 && idade <= 18) faixaEtaria = '0-18';
            else if (idade >= 19 && idade <= 23) faixaEtaria = '19-23';
            else if (idade >= 24 && idade <= 28) faixaEtaria = '24-28';
            else if (idade >= 29 && idade <= 33) faixaEtaria = '29-33';
            else if (idade >= 34 && idade <= 38) faixaEtaria = '34-38';
            else if (idade >= 39 && idade <= 43) faixaEtaria = '39-43';
            else if (idade >= 44 && idade <= 48) faixaEtaria = '44-48';
            else if (idade >= 49 && idade <= 53) faixaEtaria = '49-53';
            else if (idade >= 54 && idade <= 58) faixaEtaria = '54-58';
            else faixaEtaria = '59+';
        }

        // Formatar data de admissão para número serial do Excel
        let dataAdmissaoSerial = '';
        if (dados.data_admissao) {
            const dataAdm = new Date(dados.data_admissao);
            // Converter para número serial do Excel (dias desde 1900-01-01)
            const excelEpoch = new Date(1899, 11, 30);
            dataAdmissaoSerial = Math.floor((dataAdm - excelEpoch) / (1000 * 60 * 60 * 24));
        }

        // Formatar data de nascimento para número serial do Excel
        let dataNascimentoSerial = '';
        if (dados.data_nascimento) {
            const dataNasc = new Date(dados.data_nascimento);
            const excelEpoch = new Date(1899, 11, 30);
            dataNascimentoSerial = Math.floor((dataNasc - excelEpoch) / (1000 * 60 * 60 * 24));
        }

        return [
            dados.nome_completo || 'Não encontrado',  // A: NOME
            dados.local_trabalho || 'Matriz',          // B: LOCAL
            dataAdmissaoSerial,                        // C: ADMISSÃO (número serial)
            '',                                        // D: SÓCIO (vazio ou 'S')
            dados.salario_base || 1000,                // E: SALÁRIO
            '',                                        // F: NOVO SALÁRIO
            dados.cargo || '',                         // G: CARGO
            dados.departamento || '',                  // H: DEPARTAMENTO
            '-',                                       // I: CONVENIO ESCOLHIDO
            dataNascimentoSerial,                      // J: DN (data nascimento como número)
            idade,                                     // K: IDADE
            faixaEtaria,                               // L: FAIXA ETÁRIA
            0,                                         // M: VL 100% AMIL
            0,                                         // N: VL EMPRESA AMIL
            0,                                         // O: VL FUNC. AMIL
            0,                                         // P: AMIL SAÚDE DEP
            0,                                         // Q: ODONT. FUNC.
            0                                          // R: ODONT. DEP.
        ];
    });

    // Inserir dados
    if (linhas.length > 0) {
        sheet.getRange(3, 1, linhas.length, 18).setValues(linhas);

        // Formatação das colunas
        sheet.setColumnWidth(1, 200);  // A: NOME
        sheet.setColumnWidth(2, 100);  // B: LOCAL
        sheet.setColumnWidth(3, 100);  // C: ADMISSÃO
        sheet.setColumnWidth(4, 60);   // D: SÓCIO
        sheet.setColumnWidth(5, 100);  // E: SALÁRIO
        sheet.setColumnWidth(6, 120);  // F: NOVO SALÁRIO
        sheet.setColumnWidth(7, 200);  // G: CARGO
        sheet.setColumnWidth(8, 150);  // H: DEPARTAMENTO
        sheet.setColumnWidth(9, 150);  // I: CONVENIO ESCOLHIDO
        sheet.setColumnWidth(10, 100); // J: DN
        sheet.setColumnWidth(11, 60);  // K: IDADE
        sheet.setColumnWidth(12, 100); // L: FAIXA ETÁRIA
        sheet.setColumnWidth(13, 100); // M: VL 100% AMIL
        sheet.setColumnWidth(14, 120); // N: VL EMPRESA AMIL
        sheet.setColumnWidth(15, 110); // O: VL FUNC. AMIL
        sheet.setColumnWidth(16, 120); // P: AMIL SAÚDE DEP
        sheet.setColumnWidth(17, 110); // Q: ODONT. FUNC.
        sheet.setColumnWidth(18, 110); // R: ODONT. DEP.

        // Formatar colunas de valores monetários
        sheet.getRange(3, 5, linhas.length, 1).setNumberFormat('#,##0'); // E: SALÁRIO
        sheet.getRange(3, 6, linhas.length, 1).setNumberFormat('#,##0'); // F: NOVO SALÁRIO
        sheet.getRange(3, 13, linhas.length, 6).setNumberFormat('#,##0.00'); // M-R: Valores AMIL/Odonto

        // Formatar colunas de data
        sheet.getRange(3, 3, linhas.length, 1).setNumberFormat('dd/mm/yyyy'); // C: ADMISSÃO
        sheet.getRange(3, 10, linhas.length, 1).setNumberFormat('dd/mm/yyyy'); // J: DN

        // Bordas
        sheet.getRange(2, 1, linhas.length + 1, 18).setBorder(
            true, true, true, true, true, true,
            '#000000', SpreadsheetApp.BorderStyle.SOLID
        );

        // Zebra striping
        for (let i = 0; i < linhas.length; i++) {
            if (i % 2 !== 0) {
                sheet.getRange(3 + i, 1, 1, 18).setBackground('#f9f9f9');
            }
        }
    }

    // Congelar linhas de cabeçalho
    sheet.setFrozenRows(2);

    ss.setActiveSheet(sheet);
    SpreadsheetApp.getUi().alert('✅ Planilha Criada!',
        `Planilha "${nomeAba}" criada conforme template.\n\nPreencha os valores e quando terminar, vá no menu "Lançamentos" > "Enviar Folha para Sistema".`,
        SpreadsheetApp.getUi().ButtonSet.OK);
}
