// =====================================================
// GOOGLE APPS SCRIPT - Sistema RH Supabase v2.0
// =====================================================
// Cole este código em: Extensões → Apps Script

// ===== CONFIGURAÇÃO =====
const API_URL = 'https://seu-projeto.vercel.app/api'; // ALTERE PARA SUA URL DA VERCEL

// ===== MENU PERSONALIZADO =====
function onOpen() {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu('📊 Sistema RH')
        .addSubMenu(ui.createMenu('🔍 Buscar Colaboradores')
            .addItem('Todos os Colaboradores', 'buscarTodosColaboradores')
            .addItem('Somente Ativos', 'buscarColaboradoresAtivos')
            .addItem('Por Departamento', 'buscarPorDepartamento'))
        .addSeparator()
        .addSubMenu(ui.createMenu('📄 Gerar Relatórios')
            .addItem('Folha de Pagamento', 'gerarRelatorioFolha')
            .addItem('Benefícios', 'gerarRelatorioBeneficios')
            .addItem('Variável/Comissões', 'gerarRelatorioVariavel')
            .addItem('Apontamentos', 'gerarRelatorioApontamentos')
            .addItem('Seguros', 'gerarRelatorioSeguros'))
        .addSeparator()
        .addItem('⚙️ Configurar API', 'configurarAPI')
        .addItem('ℹ️ Sobre', 'mostrarSobre')
        .addToUi();
}

// ===== FUNÇÕES DE BUSCA =====

function buscarTodosColaboradores() {
    try {
        const response = UrlFetchApp.fetch(`${API_URL}/colaboradores`);
        const data = JSON.parse(response.getContentText());

        if (data.success) {
            preencherAbaColaboradores(data.data);
            SpreadsheetApp.getUi().alert(`✅ ${data.total} colaborador(es) carregado(s)!`);
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        SpreadsheetApp.getUi().alert(`❌ Erro: ${error.message}`);
    }
}

function buscarColaboradoresAtivos() {
    try {
        const response = UrlFetchApp.fetch(`${API_URL}/colaboradores?status=ativo`);
        const data = JSON.parse(response.getContentText());

        if (data.success) {
            preencherAbaColaboradores(data.data);
            SpreadsheetApp.getUi().alert(`✅ ${data.total} colaborador(es) ativo(s) carregado(s)!`);
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        SpreadsheetApp.getUi().alert(`❌ Erro: ${error.message}`);
    }
}

function buscarPorDepartamento() {
    const ui = SpreadsheetApp.getUi();
    const response = ui.prompt('Buscar por Departamento', 'Digite o nome do departamento:', ui.ButtonSet.OK_CANCEL);

    if (response.getSelectedButton() == ui.Button.OK) {
        const departamento = response.getResponseText();

        try {
            const apiResponse = UrlFetchApp.fetch(`${API_URL}/colaboradores?departamento=${encodeURIComponent(departamento)}`);
            const data = JSON.parse(apiResponse.getContentText());

            if (data.success) {
                preencherAbaColaboradores(data.data);
                ui.alert(`✅ ${data.total} colaborador(es) encontrado(s) no departamento "${departamento}"!`);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            ui.alert(`❌ Erro: ${error.message}`);
        }
    }
}

// ===== FUNÇÕES DE RELATÓRIOS =====

function gerarRelatorioFolha() {
    const ui = SpreadsheetApp.getUi();

    // Solicitar período
    const mesResponse = ui.prompt('Mês de Referência', 'Digite o mês (1-12):', ui.ButtonSet.OK_CANCEL);
    if (mesResponse.getSelectedButton() != ui.Button.OK) return;

    const anoResponse = ui.prompt('Ano de Referência', 'Digite o ano (ex: 2024):', ui.ButtonSet.OK_CANCEL);
    if (anoResponse.getSelectedButton() != ui.Button.OK) return;

    const mes = parseInt(mesResponse.getResponseText());
    const ano = parseInt(anoResponse.getResponseText());

    // Obter CPFs selecionados
    const cpfs = obterCPFsSelecionados();
    if (cpfs.length === 0) {
        ui.alert('⚠️ Selecione pelo menos um colaborador na aba "Colaboradores"');
        return;
    }

    try {
        const payload = {
            tipo: 'folha',
            cpfs: cpfs,
            periodo: { mes: mes, ano: ano }
        };

        const options = {
            method: 'post',
            contentType: 'application/json',
            payload: JSON.stringify(payload)
        };

        const response = UrlFetchApp.fetch(`${API_URL}/relatorios/gerar`, options);
        const data = JSON.parse(response.getContentText());

        if (data.success) {
            criarAbaRelatorio('Folha Pagamento', data.relatorio);
            ui.alert(`✅ Relatório de Folha gerado com sucesso!\nPeríodo: ${mes}/${ano}\nColaboradores: ${cpfs.length}`);
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        ui.alert(`❌ Erro: ${error.message}`);
    }
}

function gerarRelatorioBeneficios() {
    const ui = SpreadsheetApp.getUi();

    const mesResponse = ui.prompt('Mês de Referência', 'Digite o mês (1-12):', ui.ButtonSet.OK_CANCEL);
    if (mesResponse.getSelectedButton() != ui.Button.OK) return;

    const anoResponse = ui.prompt('Ano de Referência', 'Digite o ano (ex: 2024):', ui.ButtonSet.OK_CANCEL);
    if (anoResponse.getSelectedButton() != ui.Button.OK) return;

    const mes = parseInt(mesResponse.getResponseText());
    const ano = parseInt(anoResponse.getResponseText());

    const cpfs = obterCPFsSelecionados();
    if (cpfs.length === 0) {
        ui.alert('⚠️ Selecione pelo menos um colaborador na aba "Colaboradores"');
        return;
    }

    try {
        const payload = {
            tipo: 'beneficios',
            cpfs: cpfs,
            periodo: { mes: mes, ano: ano }
        };

        const options = {
            method: 'post',
            contentType: 'application/json',
            payload: JSON.stringify(payload)
        };

        const response = UrlFetchApp.fetch(`${API_URL}/relatorios/gerar`, options);
        const data = JSON.parse(response.getContentText());

        if (data.success) {
            criarAbaRelatorio('Benefícios', data.relatorio);
            ui.alert(`✅ Relatório de Benefícios gerado!\nPeríodo: ${mes}/${ano}`);
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        ui.alert(`❌ Erro: ${error.message}`);
    }
}

function gerarRelatorioVariavel() {
    const ui = SpreadsheetApp.getUi();

    const mesResponse = ui.prompt('Mês de Referência', 'Digite o mês (1-12):', ui.ButtonSet.OK_CANCEL);
    if (mesResponse.getSelectedButton() != ui.Button.OK) return;

    const anoResponse = ui.prompt('Ano de Referência', 'Digite o ano (ex: 2024):', ui.ButtonSet.OK_CANCEL);
    if (anoResponse.getSelectedButton() != ui.Button.OK) return;

    const mes = parseInt(mesResponse.getResponseText());
    const ano = parseInt(anoResponse.getResponseText());

    const cpfs = obterCPFsSelecionados();
    if (cpfs.length === 0) {
        ui.alert('⚠️ Selecione pelo menos um colaborador na aba "Colaboradores"');
        return;
    }

    try {
        const payload = {
            tipo: 'variavel',
            cpfs: cpfs,
            periodo: { mes: mes, ano: ano }
        };

        const options = {
            method: 'post',
            contentType: 'application/json',
            payload: JSON.stringify(payload)
        };

        const response = UrlFetchApp.fetch(`${API_URL}/relatorios/gerar`, options);
        const data = JSON.parse(response.getContentText());

        if (data.success) {
            criarAbaRelatorio('Variável', data.relatorio);
            ui.alert(`✅ Relatório de Variável gerado!\nPeríodo: ${mes}/${ano}`);
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        ui.alert(`❌ Erro: ${error.message}`);
    }
}

function gerarRelatorioApontamentos() {
    const ui = SpreadsheetApp.getUi();

    const mesResponse = ui.prompt('Mês de Referência', 'Digite o mês (1-12):', ui.ButtonSet.OK_CANCEL);
    if (mesResponse.getSelectedButton() != ui.Button.OK) return;

    const anoResponse = ui.prompt('Ano de Referência', 'Digite o ano (ex: 2024):', ui.ButtonSet.OK_CANCEL);
    if (anoResponse.getSelectedButton() != ui.Button.OK) return;

    const mes = parseInt(mesResponse.getResponseText());
    const ano = parseInt(anoResponse.getResponseText());

    const cpfs = obterCPFsSelecionados();
    if (cpfs.length === 0) {
        ui.alert('⚠️ Selecione pelo menos um colaborador na aba "Colaboradores"');
        return;
    }

    try {
        const payload = {
            tipo: 'apontamentos',
            cpfs: cpfs,
            periodo: { mes: mes, ano: ano }
        };

        const options = {
            method: 'post',
            contentType: 'application/json',
            payload: JSON.stringify(payload)
        };

        const response = UrlFetchApp.fetch(`${API_URL}/relatorios/gerar`, options);
        const data = JSON.parse(response.getContentText());

        if (data.success) {
            criarAbaRelatorio('Apontamentos', data.relatorio);
            ui.alert(`✅ Relatório de Apontamentos gerado!\nPeríodo: ${mes}/${ano}`);
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        ui.alert(`❌ Erro: ${error.message}`);
    }
}

function gerarRelatorioSeguros() {
    const ui = SpreadsheetApp.getUi();

    const cpfs = obterCPFsSelecionados();
    if (cpfs.length === 0) {
        ui.alert('⚠️ Selecione pelo menos um colaborador na aba "Colaboradores"');
        return;
    }

    try {
        const payload = {
            tipo: 'seguros',
            cpfs: cpfs
        };

        const options = {
            method: 'post',
            contentType: 'application/json',
            payload: JSON.stringify(payload)
        };

        const response = UrlFetchApp.fetch(`${API_URL}/relatorios/gerar`, options);
        const data = JSON.parse(response.getContentText());

        if (data.success) {
            criarAbaRelatorio('Seguros', data.relatorio);
            ui.alert(`✅ Relatório de Seguros gerado!`);
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        ui.alert(`❌ Erro: ${error.message}`);
    }
}

// ===== FUNÇÕES AUXILIARES =====

function preencherAbaColaboradores(colaboradores) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Colaboradores');

    // Criar aba se não existir
    if (!sheet) {
        sheet = ss.insertSheet('Colaboradores');
    }

    // Limpar conteúdo anterior
    sheet.clear();

    // Cabeçalhos
    const headers = [
        '☑️', 'CPF', 'Nome Completo', 'Email', 'Telefone',
        'Cargo', 'Departamento', 'Status', 'Data Admissão'
    ];

    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');

    // Dados
    if (colaboradores.length > 0) {
        const rows = colaboradores.map(c => [
            false, // Checkbox
            c.cpf,
            c.nome_completo,
            c.email || '',
            c.telefone || '',
            c.cargo || '',
            c.departamento || '',
            c.status,
            c.data_admissao || ''
        ]);

        sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);

        // Formatar checkbox
        sheet.getRange(2, 1, rows.length, 1).insertCheckboxes();
    }

    // Ajustar largura das colunas
    sheet.autoResizeColumns(1, headers.length);

    // Congelar primeira linha
    sheet.setFrozenRows(1);
}

function obterCPFsSelecionados() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Colaboradores');

    if (!sheet) return [];

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    const checkboxes = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    const cpfs = sheet.getRange(2, 2, lastRow - 1, 1).getValues();

    const selecionados = [];
    for (let i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i][0] === true) {
            selecionados.push(cpfs[i][0]);
        }
    }

    return selecionados;
}

function criarAbaRelatorio(nomeBase, dados) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd-MM-yyyy HH:mm');
    const nomeAba = `${nomeBase} ${timestamp}`;

    // Criar nova aba
    const sheet = ss.insertSheet(nomeAba);

    // Preencher dados
    if (dados && dados.length > 0) {
        sheet.getRange(1, 1, dados.length, dados[0].length).setValues(dados);

        // Formatar cabeçalho
        sheet.getRange(1, 1, 1, dados[0].length)
            .setFontWeight('bold')
            .setBackground('#34a853')
            .setFontColor('#ffffff');

        // Ajustar colunas
        sheet.autoResizeColumns(1, dados[0].length);

        // Congelar primeira linha
        sheet.setFrozenRows(1);
    }

    // Ativar a aba criada
    ss.setActiveSheet(sheet);
}

function configurarAPI() {
    const ui = SpreadsheetApp.getUi();
    const response = ui.prompt(
        'Configurar URL da API',
        `URL atual: ${API_URL}\n\nDigite a nova URL (ou deixe em branco para manter):`,
        ui.ButtonSet.OK_CANCEL
    );

    if (response.getSelectedButton() == ui.Button.OK) {
        const novaURL = response.getResponseText().trim();
        if (novaURL) {
            // Nota: Esta alteração é temporária. Para permanente, edite o código diretamente.
            ui.alert(`⚠️ Para alterar permanentemente, edite a constante API_URL no código do Apps Script.\n\nURL desejada: ${novaURL}`);
        }
    }
}

function mostrarSobre() {
    const ui = SpreadsheetApp.getUi();
    ui.alert(
        'Sistema RH Supabase v2.0',
        '📊 Sistema de Gestão de RH\n\n' +
        '✅ Buscar colaboradores\n' +
        '✅ Gerar relatórios\n' +
        '✅ Integração com Supabase\n\n' +
        'Desenvolvido com Node.js + Express + Supabase',
        ui.ButtonSet.OK
    );
}

// ===== INICIALIZAÇÃO =====
// Executar automaticamente ao abrir a planilha
function onInstall(e) {
    onOpen(e);
}
