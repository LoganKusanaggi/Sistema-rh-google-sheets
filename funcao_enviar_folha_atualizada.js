// =====================================================
// FUNÇÃO ATUALIZADA: enviarFolhaParaAPI
// Baseada na nova estrutura do template
// =====================================================

function enviarFolhaParaAPI() {
    const sheet = SpreadsheetApp.getActiveSheet();
    const nomeAba = sheet.getName();

    if (!nomeAba.includes('Lançamento Folha')) {
        SpreadsheetApp.getUi().alert('⚠️ Aba Incorreta', 'Você deve estar na aba "Lançamento Folha ..." para enviar os dados.', SpreadsheetApp.getUi().ButtonSet.OK);
        return;
    }

    const ui = SpreadsheetApp.getUi();
    const resp = ui.alert('Confirmar Envio', 'Deseja enviar os dados desta planilha para o sistema?', ui.ButtonSet.YES_NO);
    if (resp == ui.Button.NO) return;

    const data = sheet.getDataRange().getValues();
    // Linha 1: Header dos planos (opcional)
    // Linha 2: Headers principais
    // Dados começam na linha 3
    if (data.length < 3) {
        ui.alert('⚠️ Sem dados', 'A planilha está vazia.', ui.ButtonSet.OK);
        return;
    }

    // Extrair período do nome da aba
    const match = nomeAba.match(/([A-Z][a-z]{2})-(\d{4})/);
    let mes = 0, ano = 0;
    if (match) {
        const meses = {
            'Jan': 1, 'Fev': 2, 'Mar': 3, 'Abr': 4, 'Mai': 5, 'Jun': 6,
            'Jul': 7, 'Ago': 8, 'Set': 9, 'Out': 10, 'Nov': 11, 'Dez': 12
        };
        mes = meses[match[1]];
        ano = parseInt(match[2]);
    }

    const folhas = [];

    // Processar dados (começando da linha 3, índice 2)
    for (let i = 2; i < data.length; i++) {
        const row = data[i];

        // Buscar CPF do colaborador pelo nome (necessário fazer lookup)
        const nome = String(row[0]);
        if (!nome || nome === 'Não encontrado') continue;

        // Converter datas do formato serial do Excel para Date
        let dataAdmissao = null;
        if (row[2] && typeof row[2] === 'number') {
            const excelEpoch = new Date(1899, 11, 30);
            const dataAdm = new Date(excelEpoch.getTime() + row[2] * 24 * 60 * 60 * 1000);
            dataAdmissao = Utilities.formatDate(dataAdm, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        }

        let dataNascimento = null;
        if (row[9] && typeof row[9] === 'number') {
            const excelEpoch = new Date(1899, 11, 30);
            const dataNasc = new Date(excelEpoch.getTime() + row[9] * 24 * 60 * 60 * 1000);
            dataNascimento = Utilities.formatDate(dataNasc, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        }

        folhas.push({
            nome_colaborador: nome,                    // A: NOME
            local_trabalho: row[1] || '',              // B: LOCAL
            data_admissao: dataAdmissao,               // C: ADMISSÃO
            socio: row[3] || '',                       // D: SÓCIO
            salario_base: row[4] || 0,                 // E: SALÁRIO
            novo_salario: row[5] || null,              // F: NOVO SALÁRIO
            cargo: row[6] || '',                       // G: CARGO
            departamento: row[7] || '',                // H: DEPARTAMENTO
            convenio_escolhido: row[8] || '',          // I: CONVENIO ESCOLHIDO
            data_nascimento: dataNascimento,           // J: DN
            idade: row[10] || null,                    // K: IDADE
            faixa_etaria: row[11] || '',               // L: FAIXA ETÁRIA
            vl_100_amil: row[12] || 0,                 // M: VL 100% AMIL
            vl_empresa_amil: row[13] || 0,             // N: VL EMPRESA AMIL
            vl_func_amil: row[14] || 0,                // O: VL FUNC. AMIL
            amil_saude_dep: row[15] || 0,              // P: AMIL SAÚDE DEP
            odont_func: row[16] || 0,                  // Q: ODONT. FUNC.
            odont_dep: row[17] || 0,                   // R: ODONT. DEP.
            mes_referencia: mes,
            ano_referencia: ano
        });
    }

    if (folhas.length === 0) {
        ui.alert('⚠️ Nenhum dado válido', 'Não há dados válidos para enviar.', ui.ButtonSet.OK);
        return;
    }

    try {
        const url = CONFIG.API_URL + '/folha/batch';
        const options = {
            'method': 'post',
            'contentType': 'application/json',
            'payload': JSON.stringify({ folhas: folhas }),
            'muteHttpExceptions': true
        };

        const response = UrlFetchApp.fetch(url, options);
        const resultado = JSON.parse(response.getContentText());

        if (resultado.success) {
            ui.alert('✅ Sucesso!', resultado.message || 'Folhas enviadas com sucesso.', ui.ButtonSet.OK);

            // Perguntar se deseja excluir a aba
            const respDel = ui.alert('Limpeza', 'Deseja excluir esta aba de lançamento?', ui.ButtonSet.YES_NO);
            if (respDel == ui.Button.YES) {
                try {
                    SpreadsheetApp.getActiveSpreadsheet().deleteSheet(sheet);
                } catch (e) {
                    Logger.log('Erro ao deletar aba: ' + e);
                }
            }
        } else {
            throw new Error(resultado.error);
        }
    } catch (erro) {
        ui.alert('❌ Erro', 'Erro ao enviar folhas: ' + erro.message, ui.ButtonSet.OK);
    }
}
