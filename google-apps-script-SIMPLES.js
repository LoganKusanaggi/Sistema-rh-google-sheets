// =====================================================
// GOOGLE APPS SCRIPT - Sistema RH v2.0 SIMPLIFICADO
// =====================================================

const API_URL = 'https://sistema-rh-google-sheets.vercel.app/api';

// ===== MENU =====
function onOpen() {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu('📊 Sistema RH')
        .addItem('🔍 Buscar Todos Colaboradores', 'buscarTodosColaboradores')
        .addItem('✅ Buscar Somente Ativos', 'buscarColaboradoresAtivos')
        .addToUi();
}

// ===== BUSCAR COLABORADORES =====
function buscarTodosColaboradores() {
    try {
        Logger.log('Buscando colaboradores em: ' + API_URL + '/colaboradores');

        const response = UrlFetchApp.fetch(API_URL + '/colaboradores', {
            muteHttpExceptions: true
        });

        const responseCode = response.getResponseCode();
        const responseText = response.getContentText();

        Logger.log('Response Code: ' + responseCode);
        Logger.log('Response: ' + responseText);

        if (responseCode !== 200) {
            throw new Error('Erro HTTP ' + responseCode + ': ' + responseText);
        }

        const data = JSON.parse(responseText);

        if (data.success) {
            preencherAbaColaboradores(data.data);
            SpreadsheetApp.getUi().alert('✅ ' + data.total + ' colaborador(es) carregado(s)!');
        } else {
            throw new Error(data.error || 'Erro desconhecido');
        }
    } catch (error) {
        Logger.log('ERRO: ' + error.toString());
        SpreadsheetApp.getUi().alert('❌ Erro ao buscar colaboradores:\n\n' + error.message + '\n\nVerifique View > Logs para mais detalhes.');
    }
}

function buscarColaboradoresAtivos() {
    try {
        const response = UrlFetchApp.fetch(API_URL + '/colaboradores?status=ativo', {
            muteHttpExceptions: true
        });

        const data = JSON.parse(response.getContentText());

        if (data.success) {
            preencherAbaColaboradores(data.data);
            SpreadsheetApp.getUi().alert('✅ ' + data.total + ' colaborador(es) ativo(s) carregado(s)!');
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        Logger.log('ERRO: ' + error.toString());
        SpreadsheetApp.getUi().alert('❌ Erro: ' + error.message);
    }
}

// ===== PREENCHER ABA =====
function preencherAbaColaboradores(colaboradores) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Colaboradores');

    if (!sheet) {
        sheet = ss.insertSheet('Colaboradores');
    }

    sheet.clear();

    // Cabeçalhos
    const headers = ['☑️', 'CPF', 'Nome', 'Email', 'Cargo', 'Departamento', 'Status'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#4285f4')
        .setFontColor('#ffffff');

    // Dados
    if (colaboradores.length > 0) {
        const rows = colaboradores.map(c => [
            false,
            c.cpf,
            c.nome_completo,
            c.email || '',
            c.cargo || '',
            c.departamento || '',
            c.status
        ]);

        sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
        sheet.getRange(2, 1, rows.length, 1).insertCheckboxes();
    }

    sheet.autoResizeColumns(1, headers.length);
    sheet.setFrozenRows(1);
}
