// =====================================================
// GOOGLE APPS SCRIPT - SISTEMA RH v2.0 (ARQUITETURA CORRETA)
// =====================================================
// FLUXO: Buscar → Selecionar → Gerar Relatório
// SUPABASE = Única fonte da verdade
// SHEETS = Interface + Gerador de relatórios
// =====================================================

const CONFIG = {
    API_URL: 'https://sistema-rh-google-sheets.vercel.app/api', // ← SEM barra no final + /api

    ABAS: {
        DASHBOARD: 'Dashboard',
        COLABORADORES: 'Colaboradores',
        LANCAMENTOS: 'Lançamentos',
        RELATORIOS: 'Relatórios',
        CONFIGURACOES: 'Configurações'
    },

    EMPRESA: {
        codigo: '0000312',
        razao_social: 'SUPER INDUSTRIA DE ALIMENTOS LTDA',
        cnpj: '43707279000150'
    }
};

// =====================================================
// CRIAR MENU PERSONALIZADO
// =====================================================

function onOpen() {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu('🔄 Sistema RH')
        .addItem('📈 Dashboard Gerencial RH', 'abrirDashboardModal')
        .addSeparator()
        .addSubMenu(ui.createMenu('👥 Colaboradores')
            .addItem('🔍 Buscar Colaborador', 'buscarColaboradorModal')
            .addItem('➕ Novo Colaborador', 'novoColaboradorModal')
            .addItem('📝 Editar Selecionados', 'editarSelecionados')
            .addItem('🗑️ Excluir Selecionados', 'excluirSelecionados'))
        .addSeparator()
        .addSubMenu(ui.createMenu('📝 Lançamentos')
            .addItem('💰 Lançar Folha', 'lancarFolha')
            .addItem('🚀 Enviar Folha para Sistema', 'enviarFolhaParaAPI') // <--- NOVO
            .addSeparator()
            .addItem('🎁 Lançar Benefícios', 'lancarBeneficios')
            .addItem('🚀 Enviar Benefícios', 'enviarBeneficiosParaAPI')
            .addSeparator()
            .addItem('📊 Lançar Variável', 'lancarVariavel')
            .addItem('🚀 Enviar Variável', 'enviarVariavelParaAPI')
            .addSeparator()
            .addItem('⏰ Lançar Apontamentos', 'lancarApontamentos')
            .addItem('🚀 Enviar Apontamentos', 'enviarApontamentosParaAPI'))
        .addSeparator()
        .addSubMenu(ui.createMenu('📄 Relatórios')
            .addItem('💰 Folha de Pagamento', 'gerarRelatorioFolha')
            .addItem('🎁 Benefícios Caju', 'gerarRelatorioBeneficios')
            .addItem('📊 Apuração de Variável', 'gerarRelatorioVariavel')
            .addItem('⏰ Apontamentos', 'gerarRelatorioApontamentos')
            .addItem('🛡️ Seguros de Vida', 'gerarRelatorioSeguros'))
        .addSeparator()
        .addSeparator()
        .addItem('📜 Histórico de Versões', 'listarHistoricoModal') // <--- NOVO
        .addItem('🔄 Atualizar Dashboard', 'atualizarDashboard')
        .addItem('⚙️ Configurações', 'abrirConfiguracoes')
        .addToUi();
}

// =====================================================
// ABA COLABORADORES - BUSCA E GESTÃO
// =====================================================

function buscarColaboradorModal() {
    const html = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial; padding: 20px; }
      input, select { width: 100%; padding: 8px; margin: 5px 0; }
      button { background: #4285f4; color: white; padding: 10px 20px; 
               border: none; margin: 5px; cursor: pointer; }
      button:hover { background: #357ae8; }
      .filtros { background: #f5f5f5; padding: 15px; margin: 10px 0; }
    </style>
    
    <h2>🔍 Buscar Colaboradores</h2>
    
    <div class="filtros">
      <label>Busca Rápida:</label>
      <input type="text" id="termo_busca" placeholder="Nome ou CPF">
      
      <label>Status:</label>
      <select id="status">
        <option value="">Todos</option>
        <option value="ativo" selected>Ativo</option>
        <option value="inativo">Inativo</option>
        <option value="ferias">Férias</option>
      </select>
      
      <label>Departamento:</label>
      <select id="departamento">
        <option value="">Todos</option>
        <option value="Comercial">Comercial</option>
        <option value="RH">RH</option>
        <option value="Financeiro">Financeiro</option>
        <option value="Vendas">Vendas</option>
      </select>
      
      <label>Cargo:</label>
      <input type="text" id="cargo" placeholder="Ex: Analista, Gerente">
    </div>
    
    <button onclick="buscar()">🔍 Buscar</button>
    <button onclick="google.script.host.close()">Cancelar</button>
    
    <div id="resultado"></div>
    
    <script>
      function buscar() {
        const termo = document.getElementById('termo_busca').value;
        const status = document.getElementById('status').value;
        const departamento = document.getElementById('departamento').value;
        const cargo = document.getElementById('cargo').value;

        const filtros = {
          status: status,
          departamento: departamento,
          cargo: cargo
        };

        // Lógica simples para decidir se é CPF ou Nome
        if (termo) {
          const soDigitos = termo.replace(/\D/g, '');
          if (soDigitos.length === 11) {
             filtros.cpf = soDigitos; 
          } else {
             filtros.nome = termo;
          }
        }
        
        google.script.run
          .withSuccessHandler(exibirResultados)
          .withFailureHandler(err => alert('Erro: ' + err))
          .buscarColaboradoresAPI(filtros);
      }
      
      function exibirResultados(colaboradores) {
        const div = document.getElementById('resultado');
        if (colaboradores.length === 0) {
          div.innerHTML = '<p>Nenhum colaborador encontrado.</p>';
          return;
        }
        
        let html = '<h3>Encontrados: ' + colaboradores.length + '</h3>';
        html += '<table border="1" style="width:100%; border-collapse:collapse;">';
        html += '<tr><th>CPF</th><th>Nome</th><th>Cargo</th><th>Status</th></tr>';
        
        colaboradores.forEach(c => {
          html += '<tr>';
          html += '<td>' + formatarCPF(c.cpf) + '</td>';
          html += '<td>' + c.nome_completo + '</td>';
          html += '<td>' + (c.cargo || '-') + '</td>';
          html += '<td>' + c.status + '</td>';
          html += '</tr>';
        });
        
        html += '</table>';
        div.innerHTML = html;
      }
      
      function formatarCPF(cpf) {
        return cpf.replace(/(\\d{3})(\\d{3})(\\d{3})(\\d{2})/, '$1.$2.$3-$4');
      }
    </script>
  `).setWidth(600).setHeight(500);

    SpreadsheetApp.getUi().showModalDialog(html, 'Buscar Colaboradores');
}

function atualizarAbaColaboradores(colaboradores) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CONFIG.ABAS.COLABORADORES);

    if (!sheet) {
        criarAbaColaboradores();
        sheet = ss.getSheetByName(CONFIG.ABAS.COLABORADORES);
    }

    // UX: Redirecionar imediatamente
    ss.setActiveSheet(sheet);

    // 1. Limpar Tudo (Conteúdo, Formatação, Filtros, Validations/Checkboxes)
    // sheet.clear() nem sempre remove validações (checkboxes), então forçamos:
    const rangeTotal = sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns());
    rangeTotal.clearDataValidations();
    rangeTotal.clear();

    sheet.clearNotes();
    sheet.setFrozenRows(0);
    if (sheet.getFilter()) {
        sheet.getFilter().remove();
    }

    // 2. LAYOUT (LINHAS 1-5)
    const agora = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');

    // LINHA 1: Título
    sheet.getRange('A1:G1').merge();
    sheet.getRange('A1').setValue('🔍 SISTEMA RH - BUSCA DE COLABORADORES')
        .setFontSize(14).setFontWeight('bold')
        .setHorizontalAlignment('center').setVerticalAlignment('middle')
        .setBackground('#1a73e8').setFontColor('#ffffff');

    // LINHA 2: Data e Hora
    sheet.getRange('A2:G2').merge();
    sheet.getRange('A2').setValue(`Gerado em: ${agora}`)
        .setFontStyle('italic').setFontSize(9).setHorizontalAlignment('right');

    // LINHA 3: Resumo
    sheet.getRange('A3:G3').merge();
    const resumo = colaboradores.length > 0
        ? `✅ Total de registros encontrados: ${colaboradores.length}`
        : `⚠️ Nenhum registro encontrado para os filtros informados.`;
    sheet.getRange('A3').setValue(resumo)
        .setFontWeight('bold').setBackground('#f3f3f3').setVerticalAlignment('middle');

    // LINHA 4: Separador
    sheet.setRowHeight(4, 5);

    // LINHA 5: Cabeçalhos
    // LINHA 5: Cabeçalhos
    const headers = [['', 'CPF', 'Nome Completo', 'Cargo', 'Departamento', 'Cidade', 'Salário Base', 'Status', 'Data Admissão']];
    sheet.getRange(5, 1, 1, 9).setValues(headers); // Aumentado para 9 colunas
    sheet.getRange(5, 1, 1, 9)
        .setFontWeight('bold')
        .setBackground('#e8f0fe')
        .setFontColor('#000000')
        .setBorder(true, true, true, true, true, true);

    // Larguras das colunas
    sheet.setColumnWidth(1, 40);  // Check
    sheet.setColumnWidth(2, 120); // CPF
    sheet.setColumnWidth(3, 250); // Nome
    sheet.setColumnWidth(4, 150); // Cargo
    sheet.setColumnWidth(5, 120); // Depto
    sheet.setColumnWidth(6, 120); // Cidade (NOVO)
    sheet.setColumnWidth(7, 110); // Salário
    sheet.setColumnWidth(8, 100); // Status
    sheet.setColumnWidth(9, 110); // Data

    sheet.setFrozenRows(5);

    // Checkbox "Selecionar Todos" (A5)
    sheet.getRange('A5').insertCheckboxes();

    // 3. INSERIR DADOS (LINHA 6+)
    if (colaboradores.length > 0) {
        // DEBUG: Log do primeiro colaborador
        Logger.log('DEBUG - Primeiro colaborador: ' + JSON.stringify(colaboradores[0]));

        const dados = colaboradores.map(c => {
            // Tratamento seguro de data para evitar problemas de fuso horário
            let dataAdmissao = '-';
            if (c.data_admissao) {
                // Se for YYYY-MM-DD
                if (c.data_admissao.includes('-')) {
                    const partes = c.data_admissao.split('-'); // [2025, 03, 16]
                    if (partes.length === 3) {
                        // Cria data localmente sem horário para não sofrer conversão de fuso
                        const dataObj = new Date(partes[0], partes[1] - 1, partes[2]);
                        dataAdmissao = Utilities.formatDate(dataObj, Session.getScriptTimeZone(), 'dd/MM/yyyy');
                    } else {
                        // Tenta parse normal
                        const d = new Date(c.data_admissao);
                        if (!isNaN(d.getTime())) {
                            dataAdmissao = Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd/MM/yyyy');
                        } else {
                            dataAdmissao = 'RAW: ' + c.data_admissao;
                        }
                    }
                } else {
                    dataAdmissao = 'RAW: ' + c.data_admissao;
                }
            }

            // Tratamento Salário
            const salario = c.salario_base ? Number(c.salario_base) : 0;

            return [
                false, // checkbox
                formatarCPFParaExibicao(c.cpf),
                c.nome_completo,
                c.cargo || '-',
                c.departamento || '-',
                c.cidade || c.local_trabalho || '-', // Cidade
                salario,
                c.status,
                dataAdmissao
            ];
        });

        const startRow = 6;
        sheet.getRange(startRow, 1, dados.length, 9).setValues(dados);

        // Formatação
        sheet.getRange(startRow, 1, dados.length, 1).insertCheckboxes();
        sheet.getRange(startRow, 7, dados.length, 1).setNumberFormat('R$ #,##0.00'); // Formatar Salário (Col 7)
        sheet.getRange(startRow, 1, dados.length, 9)
            .setVerticalAlignment('middle')
            .setBorder(true, true, true, true, true, true);

        // Zebra striping
        for (let i = 0; i < dados.length; i++) {
            if (i % 2 !== 0) {
                sheet.getRange(startRow + i, 1, 1, 9).setBackground('#fafafa');
            }
        }
    }
}

// ===== FUNÇÃO DE DEBUG PARA BUSCA =====
function buscarColaboradoresAPI(filtros) {
    try {
        // DEBUG: Ver o que está sendo enviado
        Logger.log('=== DEBUG BUSCA ===');
        Logger.log('Filtros recebidos: ' + JSON.stringify(filtros));

        const url = CONFIG.API_URL + '/colaboradores/buscar';

        // DEBUG: Ver URL
        Logger.log('URL da API: ' + url);

        const options = {
            method: 'post',
            contentType: 'application/json',
            payload: JSON.stringify({ filtros }), // ← TESTAR SEM O WRAPPER SE NÃO FUNCIONAR
            muteHttpExceptions: true
        };

        // DEBUG: Ver payload
        Logger.log('Payload enviado: ' + options.payload);

        const response = UrlFetchApp.fetch(url, options);

        // DEBUG: Ver resposta
        Logger.log('Status HTTP: ' + response.getResponseCode());
        Logger.log('Resposta completa: ' + response.getContentText());

        const resultado = JSON.parse(response.getContentText());

        if (resultado.success) {
            Logger.log('Colaboradores encontrados: ' + resultado.colaboradores.length);
            atualizarAbaColaboradores(resultado.colaboradores);
            return resultado.colaboradores;
        } else {
            throw new Error(resultado.error);
        }
    } catch (erro) {
        Logger.log('❌ ERRO NA BUSCA: ' + erro);
        throw erro;
    }
}

// ===== FUNÇÃO DE CRIAÇÃO (LAYOUT BASE) =====
function criarAbaColaboradores() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ss.insertSheet(CONFIG.ABAS.COLABORADORES);
    // A função atualizarAbaColaboradores vai cuidar de desenhar tudo, 
    // então aqui só criamos a aba limpa para evitar duplicação de lógica.
}

// =====================================================
// GERAR RELATÓRIOS
// =====================================================

function gerarRelatorioFolha() {
    gerarRelatorioGenerico('folha', 'Folha de Pagamento');
}

function gerarRelatorioBeneficios() {
    gerarRelatorioGenerico('beneficios', 'Benefícios Caju');
}

function gerarRelatorioVariavel() {
    gerarRelatorioGenerico('variavel', 'Apuração de Variável');
}

function gerarRelatorioApontamentos() {
    gerarRelatorioGenerico('apontamentos', 'Apontamentos');
}

function gerarRelatorioSeguros() {
    gerarRelatorioGenerico('seguros', 'Seguros de Vida');
}

function gerarRelatorioGenerico(tipo, nome) {
    const ui = SpreadsheetApp.getUi();

    // Obter CPFs selecionados
    const cpfsSelecionados = obterCPFsSelecionados();

    if (cpfsSelecionados.length === 0) {
        ui.alert('⚠️ Nenhum colaborador selecionado',
            'Vá para a aba Colaboradores e marque os checkboxes dos colaboradores desejados.',
            ui.ButtonSet.OK);
        return;
    }

    // Pedir período (se necessário)
    let periodo = null;
    if (['folha', 'beneficios', 'variavel', 'apontamentos'].includes(tipo)) {
        periodo = pedirPeriodo();
        if (!periodo) return; // Usuário cancelou
    }

    // Gerar relatório
    ui.alert('🔄 Gerando relatório...',
        `Processando ${cpfsSelecionados.length} colaborador(es). Aguarde...`,
        ui.ButtonSet.OK);

    try {
        const dados = chamarAPIRelatorio(tipo, cpfsSelecionados, periodo);

        if (dados.success) {
            // Criar nova aba com o relatório
            criarAbaRelatorio(tipo, nome, dados, periodo);

            ui.alert('✅ Relatório gerado!',
                `Relatório "${nome}" criado com sucesso!\nVerifique a nova aba criada.`,
                ui.ButtonSet.OK);
        } else {
            throw new Error(dados.error);
        }
    } catch (erro) {
        ui.alert('❌ Erro', 'Erro ao gerar relatório: ' + erro.message, ui.ButtonSet.OK);
    }
}

function obterCPFsSelecionados() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.ABAS.COLABORADORES);
    if (!sheet) return [];

    const ultimaLinha = sheet.getLastRow();
    if (ultimaLinha < 6) return [];

    const dados = sheet.getRange(6, 1, ultimaLinha - 5, 2).getValues();

    const cpfs = dados
        .filter(linha => linha[0] === true) // checkbox marcado
        .map(linha => linha[1].replace(/\D/g, '')); // remover formatação do CPF

    return cpfs;
}

function pedirPeriodo() {
    const ui = SpreadsheetApp.getUi();

    const dataAtual = new Date();
    const mesAtual = dataAtual.getMonth() + 1;
    const anoAtual = dataAtual.getFullYear();

    const resposta = ui.prompt(
        '📅 Período do Relatório',
        `Digite o período no formato MM/AAAA\nExemplo: ${String(mesAtual).padStart(2, '0')}/${anoAtual}`,
        ui.ButtonSet.OK_CANCEL
    );

    if (resposta.getSelectedButton() !== ui.Button.OK) {
        return null;
    }

    const texto = resposta.getResponseText().trim();
    const match = texto.match(/^(\d{1,2})\/(\d{4})$/);

    if (!match) {
        ui.alert('❌ Formato inválido', 'Use o formato MM/AAAA (ex: 12/2024)', ui.ButtonSet.OK);
        return null;
    }

    return {
        mes: parseInt(match[1]),
        ano: parseInt(match[2])
    };
}

function chamarAPIRelatorio(tipo, cpfs, periodo) {
    const url = CONFIG.API_URL + '/relatorios/gerar';
    const payload = {
        tipo,
        cpfs,
        periodo,
        formato: 'json'
    };

    const options = {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    return JSON.parse(response.getContentText());
}

function criarAbaRelatorio(tipo, nome, dados, periodo) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Nome da aba
    let nomeAba = nome;
    if (periodo) {
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        nomeAba = `${nome} ${meses[periodo.mes - 1]}-${periodo.ano}`;
    }

    // Criar ou limpar aba
    let sheet = ss.getSheetByName(nomeAba);
    if (sheet) {
        sheet.clear();
    } else {
        sheet = ss.insertSheet(nomeAba);
    }

    // Aplicar layout baseado no template
    aplicarLayoutRelatorio(sheet, tipo, dados);
}

function aplicarLayoutRelatorio(sheet, tipo, dados) {
    const layout = dados.layout;
    let linhaAtual = 1;

    // CABEÇALHO
    if (layout.cabecalho) {
        layout.cabecalho.forEach(linha => {
            sheet.getRange(linhaAtual, 1).setValue(linha[0]);
            if (layout.formatacao.cabecalho) {
                const range = sheet.getRange(linhaAtual, 1);
                range.setFontSize(layout.formatacao.cabecalho.fontSize || 12);
                range.setFontWeight(layout.formatacao.cabecalho.bold ? 'bold' : 'normal');
                if (layout.formatacao.cabecalho.background) {
                    range.setBackground(layout.formatacao.cabecalho.background);
                }
                if (layout.formatacao.cabecalho.color) {
                    range.setFontColor(layout.formatacao.cabecalho.color);
                }
            }
            linhaAtual++;
        });
    }

    // COLUNAS (Header da tabela)
    const colunas = layout.colunas.map(c => c.nome);
    sheet.getRange(linhaAtual, 1, 1, colunas.length).setValues([colunas]);

    const headerRange = sheet.getRange(linhaAtual, 1, 1, colunas.length);
    if (layout.formatacao.colunas) {
        headerRange.setFontWeight('bold');
        headerRange.setFontSize(layout.formatacao.colunas.fontSize || 10);
        if (layout.formatacao.colunas.background) {
            headerRange.setBackground(layout.formatacao.colunas.background);
        }
        if (layout.formatacao.colunas.color) {
            headerRange.setFontColor(layout.formatacao.colunas.color);
        }
    }

    // Aplicar larguras
    layout.colunas.forEach((col, i) => {
        sheet.setColumnWidth(i + 1, col.largura || 120);
    });

    linhaAtual++;

    // DADOS
    if (layout.dados && layout.dados.length > 0) {
        const dadosTabela = layout.dados.map((linha, idx) => {
            return layout.colunas.map(col => {
                const valor = linha[col.campo];

                // DEBUG RENDERING only for first row/first col
                if (idx === 0 && col.campo === layout.colunas[0].campo) {
                    console.log(`RENDER CHECK: Campo=${col.campo}, Valor=${valor}, Tipo=${typeof valor}`);
                }

                // Formatar valor baseado no tipo
                if (col.formato === 'moeda' && typeof valor === 'number') {
                    return 'R$ ' + valor.toFixed(2).replace('.', ',');
                }
                if (col.formato === 'percentual' && typeof valor === 'number') {
                    return valor.toFixed(2) + '%';
                }
                if (col.formato === 'cpf' && typeof valor === 'string') {
                    return formatarCPFParaExibicao(valor);
                }

                return valor !== null && valor !== undefined ? valor : '';
            });
        });

        sheet.getRange(linhaAtual, 1, dadosTabela.length, colunas.length).setValues(dadosTabela);

        // Zebra stripe
        if (layout.formatacao.dados && layout.formatacao.dados.zebraStripe) {
            for (let i = 0; i < dadosTabela.length; i += 2) {
                sheet.getRange(linhaAtual + i, 1, 1, colunas.length).setBackground('#f9f9f9');
            }
        }

        linhaAtual += dadosTabela.length;
    }

    // RODAPÉ
    if (layout.rodape) {
        layout.rodape.forEach(linha => {
            sheet.getRange(linhaAtual, 1, 1, linha.length).setValues([linha]);

            if (layout.formatacao.rodape) {
                const range = sheet.getRange(linhaAtual, 1, 1, linha.length);
                range.setFontWeight('bold');
                if (layout.formatacao.rodape.background) {
                    range.setBackground(layout.formatacao.rodape.background);
                }
            }

            linhaAtual++;
        });
    }

    // Congelar linhas do cabeçalho
    sheet.setFrozenRows(layout.cabecalho ? layout.cabecalho.length + 1 : 1);
}

// =====================================================
// LANÇAMENTOS
// =====================================================

function lancarFolha() {
    const cpfs = obterCPFsSelecionados();
    if (cpfs.length === 0) {
        SpreadsheetApp.getUi().alert('⚠️ Nenhum colaborador selecionado', 'Selecione os colaboradores na aba Colaboradores.', SpreadsheetApp.getUi().ButtonSet.OK);
        return;
    }

    const periodo = pedirPeriodo();
    if (!periodo) return;

    // Buscar dados detalhados (Cargo, Admissão, etc.) da API
    const dadosApi = buscarDadosColaboradores(cpfs);

    // Passar dados da API para criação da planilha
    criarPlanilhaLancamentoFolha(cpfs, periodo, null, dadosApi);
}

function criarPlanilhaLancamentoFolha(cpfs, periodo, dadosMap = null, dadosApi = []) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const nomeAba = `Lançamento Folha ${meses[periodo.mes - 1]}-${periodo.ano}`; // Ex: Lançamento Folha Jan-2025

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

    // Buscar nomes dos CPFs
    const sheetColab = ss.getSheetByName(CONFIG.ABAS.COLABORADORES);
    const dadosColab = sheetColab.getDataRange().getValues(); // Cache local rápido
    const mapNomes = {};
    for (let i = 5; i < dadosColab.length; i++) {
        if (dadosColab[i][1]) {
            const cpfLimpo = String(dadosColab[i][1]).replace(/\D/g, '');
            mapNomes[cpfLimpo] = dadosColab[i][2];
        }
    }

    // Helper Local de Idade
    function calcIdade(dataNasc) {
        if (!dataNasc) return '';
        const hoje = new Date();
        const nasc = new Date(dataNasc);
        let idade = hoje.getFullYear() - nasc.getFullYear();
        const m = hoje.getMonth() - nasc.getMonth();
        if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
            idade--;
        }
        return idade;
    }

    // Cabeçalhos (LAYOUT EXATO 2025)
    // Removidos: Extras, INSS, Vale Transporte, etc.
    const headers = [
        'CPF', 'Nome', 'Mês', 'Ano',
        'Local', 'Admissão', 'Sócio', 'Salário Base', 'Cargo', 'Departamento',
        'Convênio Escolhido', 'DN', 'Idade', 'Faixa Etária',
        'Vl 100% Amil', 'Vl Empresa Amil', 'Vl Func. Amil', 'Amil Saúde Dep',
        'Odont. Func.', 'Odont. Dep.',
        'Status (Pendente/Pago)', 'Data Pagto', 'Obs'
    ];

    // Montar linhas
    const linhas = cpfs.map(cpf => {
        const cpfLimpo = String(cpf).replace(/\D/g, '');
        const nome = mapNomes[cpfLimpo] || 'Não encontrado';

        let d = {};
        if (dadosMap && dadosMap[cpfLimpo] && dadosMap[cpfLimpo].length > 0) d = dadosMap[cpfLimpo][0];

        // Dados fresquinhos da API (Cadastro)
        // A API retorna CPF formatado ou limpo? O filter no `buscar` limpou?
        // buscarDadosColaboradores retorna objetos limpos filtrados.
        // Vamos achar pelo CPF limpo.
        const apiData = dadosApi.find(c => String(c.cpf).replace(/\D/g, '') === cpfLimpo) || {};

        const formatDate = (dateStr) => {
            if (!dateStr) return '';
            const dt = new Date(dateStr);
            return isNaN(dt.getTime()) ? '' : dt.toISOString().split('T')[0];
        };

        const dataNasc = apiData.data_nascimento || d.data_nascimento;
        const idade = calcIdade(dataNasc);

        // Preenchimento: Prioridade Histórico (se for edição) -> API (Cadastro) -> Default
        // Mas se dadosMap for null (lançamento novo), é API -> Default.
        // Se houver dadosMap, supomos que queremos ver o que estava salvo?
        // Sim, mas o user disse "Lançamento". Geralmente é novo.
        // Mas se ele recriar a aba de um mês já lançado?
        // Vamos dar prioridade ao que já foi lançado (d) se existir.

        return [
            formatarCPFParaExibicao(cpf), nome, periodo.mes, periodo.ano,
            d.local_trabalho || apiData.local_trabalho || '',
            formatDate(d.data_admissao || apiData.data_admissao),
            d.socio || 0,
            parseFloat(d.salario_base || apiData.salario_base || 0),
            d.cargo || apiData.cargo || '',
            d.departamento || apiData.departamento || '',
            d.convenio_escolhido || apiData.convenio_escolhido || '',
            formatDate(dataNasc),
            idade,
            d.faixa_etaria || apiData.faixa_etaria || '',

            parseFloat(d.vl_100_amil || apiData.vl_100_amil || 0),
            parseFloat(d.vl_empresa_amil || apiData.vl_empresa_amil || 0),
            parseFloat(d.vl_func_amil || apiData.vl_func_amil || 0),
            parseFloat(d.amil_saude_dep || apiData.amil_saude_dep || 0),
            parseFloat(d.odont_func || apiData.odont_func || 0),
            parseFloat(d.odont_dep || apiData.odont_dep || 0),

            d.status_pagamento || 'pendente',
            d.data_pagamento ? String(d.data_pagamento).substring(0, 10) : '',
            d.observacoes || ''
        ];
    });

    if (linhas.length === 0) {
        SpreadsheetApp.getUi().alert('⚠️ Erro', 'Nenhum dado gerado para os CPFs selecionados.', SpreadsheetApp.getUi().ButtonSet.OK);
        return;
    }

    // Renderizar Header
    sheet.getRange(1, 1, 1, headers.length).setValues([headers])
        .setFontWeight('bold').setBackground('#4a86e8').setFontColor('white');

    // Renderizar Dados (Check bounds)
    if (linhas.length > 0) {
        sheet.getRange(2, 1, linhas.length, headers.length).setValues(linhas);
    }

    // Formatação
    if (sheet.getMaxColumns() >= 2) sheet.setColumnWidth(2, 200); // Nome
    if (sheet.getMaxColumns() >= 5) sheet.setColumnWidth(5, 100); // Local
    if (sheet.getMaxColumns() >= 10) sheet.setColumnWidth(10, 150); // Depto

    // Validação Status (Coluna 21 -> index 20 (0-based) -> Col 21 = U)
    const colStatus = 21;
    const ruleStatus = SpreadsheetApp.newDataValidation()
        .requireValueInList(['pendente', 'pago'], true)
        .setAllowInvalid(false)
        .build();

    if (linhas.length > 0 && sheet.getMaxColumns() >= colStatus) {
        sheet.getRange(2, colStatus, linhas.length, 1).setDataValidation(ruleStatus);
    }

    // Travar Colunas CPF/Nome
    sheet.setFrozenColumns(2);

    ss.setActiveSheet(sheet);
    SpreadsheetApp.getUi().alert('✅ Planilha Criada!',
        `Preencha os valores na aba "${nomeAba}".\n\nQuando terminar, vá no menu "Lançamentos" > "Enviar Folha para Sistema".`,
        SpreadsheetApp.getUi().ButtonSet.OK);
}

function enviarFolhaParaAPI() {
    const sheet = SpreadsheetApp.getActiveSheet();
    const nomeAba = sheet.getName();

    // 1. DETECÇÃO ROBUSTA (LANÇAMENTO OU SNAPSHOT)
    // Aceita: "Lançamento Folha", "V. 2025-01-01 - Folha", "V. 2025-01-01 - Folha Pagamento"
    const isFolha = nomeAba.toLowerCase().includes('folha');
    const isSnapshot = nomeAba.startsWith('V.');
    const isLancamento = nomeAba.includes('Lançamento');

    if (!isFolha || (!isSnapshot && !isLancamento)) {
        SpreadsheetApp.getUi().alert('⚠️ Aba Incorreta', 'Você deve estar na aba "Lançamento Folha" ou "Histórico Folha" para enviar.', SpreadsheetApp.getUi().ButtonSet.OK);
        return;
    }

    const ui = SpreadsheetApp.getUi();
    const resp = ui.alert('Confirmar Envio', 'Deseja enviar os dados desta planilha para o sistema? Isso atualizará ou criará os registros de folha.', ui.ButtonSet.YES_NO);
    if (resp == ui.Button.NO) return;

    const data = sheet.getDataRange().getValues();
    // Headers na linha 1. Dados começam na linha 2.
    if (data.length < 2) {
        ui.alert('⚠️ Sem dados', 'A planilha está vazia.', ui.ButtonSet.OK);
        return;
    }

    const headers = data[0].map(h => String(h).trim().toLowerCase());

    // Helper para buscar valor dinamicamente
    function getVal(row, keywords) {
        const keys = Array.isArray(keywords) ? keywords : [keywords];
        let colIndex = -1;

        // 1. Tenta match exato ou parcial
        for (const k of keys) {
            colIndex = headers.findIndex(h => h === k || h.includes(k));
            if (colIndex > -1) break;
        }

        // 2. Tenta normalizar (remover acentos)
        if (colIndex === -1) {
            const normalizedHeaders = headers.map(h => h.normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
            for (const k of keys) {
                const kNorm = k.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                colIndex = normalizedHeaders.findIndex(h => h === kNorm || h.includes(kNorm));
                if (colIndex > -1) break;
            }
        }

        if (colIndex === -1) return null;
        return row[colIndex];
    }

    // Helper para Data
    function getDateVal(row, keywords) {
        const val = getVal(row, keywords);
        if (!val) return null;
        if (val instanceof Date) return val.toISOString().split('T')[0];
        // Tenta parsear string DD/MM/YYYY se necessário, ou retorna string crua se formato YYYY-MM-DD
        return String(val).substring(0, 10);
    }

    const folhas = [];
    for (let i = 1; i < data.length; i++) {
        const row = data[i];

        const cpfRaw = getVal(row, 'cpf');
        if (!cpfRaw) continue;

        folhas.push({
            cpf: String(cpfRaw).replace(/\D/g, ''),
            mes_referencia: getVal(row, ['mês', 'mes', 'mes_referencia']) || 0,
            ano_referencia: getVal(row, ['ano', 'ano_referencia']) || 0,

            // Novos Campos 2025
            local_trabalho: getVal(row, ['local', 'local_trabalho']),
            data_admissao: getDateVal(row, ['admissão', 'admissao', 'data_admissao']),
            socio: getVal(row, 'sócio') || 0,
            novo_salario: getVal(row, ['novo salário', 'novo_salario']) || 0,
            cargo: getVal(row, 'cargo'),
            departamento: getVal(row, ['departamento', 'depto']),
            convenio_escolhido: getVal(row, ['convênio', 'convenio']),
            data_nascimento: getDateVal(row, ['dn', 'nascimento', 'data_nascimento']),
            idade: getVal(row, 'idade') || 0,
            faixa_etaria: getVal(row, ['faixa', 'faixa etária', 'faixa_etaria']),

            vl_100_amil: getVal(row, ['vl 100% amil', 'vl_100_amil']) || 0,
            vl_empresa_amil: getVal(row, ['vl empresa amil', 'vl_empresa_amil']) || 0,
            vl_func_amil: getVal(row, ['vl func. amil', 'vl_func_amil']) || 0,
            amil_saude_dep: getVal(row, ['amil saúde dep', 'amil_saude_dep']) || 0,

            odont_func: getVal(row, ['odont. func.', 'odont_func']) || 0,
            odont_dep: getVal(row, ['odont. dep.', 'odont_dep']) || 0,

            // Campos Legados Removidos da Interface de Lançamento
            // Backend ainda suporta se vierem, mas script não envia mais se não tiver na planilha
            // Se necessário manter compatibilidade, enviamos zero
            // (Para não quebrar validadores de schema estrito no backend se houver)
            salario_base: getVal(row, ['salário base', 'salario base', 'salario_base']) || 0,

            status_pagamento: String(getVal(row, ['status', 'status_pagamento']) || 'pendente').toLowerCase(),
            data_pagamento: getDateVal(row, ['data pagto', 'data pagamento', 'data_pagamento']),
            observacoes: getVal(row, ['obs', 'observacoes', 'observações']) || ''
        });
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

            // Perguntar se deseja excluir (sempre, seja Lançamento ou Snapshot)
            const respDel = ui.alert('Limpeza', 'Deseja excluir esta aba para manter a planilha organizada?', ui.ButtonSet.YES_NO);
            if (respDel == ui.Button.YES) {
                try { SpreadsheetApp.getActiveSpreadsheet().deleteSheet(sheet); } catch (e) { }
            }
        } else {
            throw new Error(resultado.error);
        }
    } catch (erro) {
        ui.alert('❌ Erro', 'Erro ao enviar folhas: ' + erro.message, ui.ButtonSet.OK);
    }
}

// =====================================================
// UTILITÁRIOS DE API
// =====================================================

function buscarDadosColaboradores(cpfs) {
    if (!cpfs || cpfs.length === 0) return [];

    try {
        const url = CONFIG.API_URL + '/colaboradores/buscar';
        const options = {
            method: 'post',
            contentType: 'application/json',
            payload: JSON.stringify({ filtros: { status: 'ativo' } }),
            muteHttpExceptions: true
        };
        const response = UrlFetchApp.fetch(url, options);
        const res = JSON.parse(response.getContentText());

        if (res.success) {
            // Retorna todos os encontrados (o filtro final é feito na função de criar planilha)
            return res.colaboradores || [];
        } else {
            return [];
        }
    } catch (e) {
        Logger.log('Erro ao buscar dados colaboradores: ' + e);
        return [];
    }
}

function lancarBeneficios() {
    const cpfs = obterCPFsSelecionados();
    if (cpfs.length === 0) {
        SpreadsheetApp.getUi().alert('⚠️ Nenhum colaborador selecionado', 'Selecione os colaboradores na aba Colaboradores.', SpreadsheetApp.getUi().ButtonSet.OK);
        return;
    }

    const periodo = pedirPeriodo();
    if (!periodo) return;

    // Buscar dados completos (incluindo Cidade) da API
    const dadosCompletos = buscarDadosColaboradores(cpfs);

    criarPlanilhaBeneficiosCaju(cpfs, periodo, dadosCompletos);
}

function criarPlanilhaBeneficiosCaju(cpfs, periodo, dadosCompletos, dadosMap = null) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const nomeAba = `Lançamento Benefícios ${meses[periodo.mes - 1]}-${periodo.ano}`;

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

    // --- 1. CONFIGURAÇÃO VISUAL (Cores do Template) ---
    const COR_AMARELO_TITULO = '#f1c232';
    const COR_VERDE_FIXO = '#d9ead3';
    const COR_HEADER_TABELA = '#f1c232';

    // --- 2. CABEÇALHO DE PARÂMETROS (Linhas 2-10) ---

    // Transporte (B2:C6)
    sheet.getRange('B2:C2').merge().setValue('Transporte')
        .setBackground(COR_AMARELO_TITULO).setFontWeight('bold').setHorizontalAlignment('center').setBorder(true, true, true, true, true, true);
    sheet.getRange('B3').setValue('VALOR DIA').setFontWeight('bold').setBorder(true, true, true, true, true, true);
    sheet.getRange('C3').setValue(14.35).setNumberFormat('R$ #,##0.00').setBorder(true, true, true, true, true, true);
    sheet.getRange('B4').setValue('DIAS CORRIDOS NO MÊS').setFontWeight('bold').setBorder(true, true, true, true, true, true);
    sheet.getRange('C4').setValue(20).setBorder(true, true, true, true, true, true);
    sheet.getRange('B5').setValue('VALOR TOTAL').setFontWeight('bold').setBorder(true, true, true, true, true, true);
    sheet.getRange('C5').setFormula('=C3*C4').setNumberFormat('R$ #,##0.00').setFontWeight('bold').setBorder(true, true, true, true, true, true);
    sheet.getRange('B6').setValue('VALOR FIXO').setFontWeight('bold').setBackground(COR_VERDE_FIXO).setBorder(true, true, true, true, true, true);
    sheet.getRange('C6').setValue(330.00).setNumberFormat('R$ #,##0.00').setBackground(COR_VERDE_FIXO).setBorder(true, true, true, true, true, true);

    // Alimentação (B7:C10)
    sheet.getRange('B7:C7').merge().setValue('Alimentação')
        .setBackground(COR_AMARELO_TITULO).setFontWeight('bold').setHorizontalAlignment('center').setBorder(true, true, true, true, true, true);
    sheet.getRange('B8').setValue('VALOR DIA').setFontWeight('bold').setBorder(true, true, true, true, true, true);
    sheet.getRange('C8').setValue(35.00).setNumberFormat('R$ #,##0.00').setBorder(true, true, true, true, true, true);
    sheet.getRange('B9').setValue('DIAS ÚTEIS NO MÊS').setFontWeight('bold').setBorder(true, true, true, true, true, true);
    sheet.getRange('C9').setValue(20).setBorder(true, true, true, true, true, true);
    sheet.getRange('B10').setValue('VALOR TOTAL').setFontWeight('bold').setBorder(true, true, true, true, true, true);
    sheet.getRange('C10').setFormula('=C8*C9').setNumberFormat('R$ #,##0.00').setFontWeight('bold').setBorder(true, true, true, true, true, true);

    // Totais (Row 9-11)
    sheet.getRange('E9:F9').merge().setValue('Total Beneficios').setHorizontalAlignment('center');
    // E10:F10 = Grand Total (Sum of Subtotals below)
    sheet.getRange('E10:F10').merge().setFormula('=E11+F11').setNumberFormat('R$ #,##0.00').setFontWeight('bold').setFontSize(12).setHorizontalAlignment('center');

    // Subtotals per column (E11, F11)
    sheet.getRange('E11').setFormula('=SUM(E13:E)').setNumberFormat('R$ #,##0.00').setFontWeight('bold').setHorizontalAlignment('center');
    sheet.getRange('F11').setFormula('=SUM(F13:F)').setNumberFormat('R$ #,##0.00').setFontWeight('bold').setHorizontalAlignment('center');

    // Header Names just for labeling totals (Row 11 is values, maybe put "Total" text in Row 11 of Cols C/D? Screenshot has values in E11/F11 directly).
    sheet.getRange('E12').setValue('Alimentação').setFontWeight('bold').setBackground(COR_AMARELO_TITULO).setBorder(true, true, true, true, true, true).setHorizontalAlignment('center');
    sheet.getRange('F12').setValue('Transporte').setFontWeight('bold').setBackground(COR_AMARELO_TITULO).setBorder(true, true, true, true, true, true).setHorizontalAlignment('center');

    // --- 3. TABELA DE DADOS (Começa Row 12 header, 13 dados) ---
    const headers = ['#', 'NOME', 'Cidade', 'FÉRIAS', 'Alimentação', 'Transporte'];
    const startRow = 12;

    sheet.getRange(startRow, 1, 1, headers.length).setValues([headers])
        .setFontWeight('bold')
        .setBorder(true, true, true, true, true, true)
        .setHorizontalAlignment('center');

    // Colors
    sheet.getRange(startRow, 4, 1, 3).setBackground(COR_HEADER_TABELA); // D, E, F Amarelo
    sheet.getRange(startRow, 1, 1, 3).setBackground('#f3f3f3'); // A, B, C Cinza

    // Overwrite Alimentação/Transporte header text color if needed (Black default)

    // Map Dados de Nome e Cidade
    const mapDados = {};

    // Prioridade 1: Dados da API (tem cidade)
    if (dadosCompletos && dadosCompletos.length > 0) {
        dadosCompletos.forEach(c => {
            const cpfLimpo = String(c.cpf).replace(/\D/g, '');
            mapDados[cpfLimpo] = {
                nome: c.nome_completo,
                cidade: c.cidade || c.local_trabalho || '-'
            };
        });
    }

    // Prioridade 2: Dados do Snapshot (dadosMap) - Para garantir que snapshots tenham cidade e nome
    if (dadosMap) {
        for (const [cpf, itens] of Object.entries(dadosMap)) {
            // dadosMap é um MAP de CPF -> ARRAY de itens
            // Pega o primeiro item para extrair metadados do colab
            const d = itens[0];
            if (d && !mapDados[cpf]) {
                mapDados[cpf] = {
                    nome: d.nome || d.nome_colaborador || d.nome_completo || 'Sem Nome',
                    cidade: d.cidade || d.local_trabalho || '-'
                };
            }
        }
    }

    // Prioridade 3: Dados da Aba Colaboradores (Fallback final)
    const sheetColab = ss.getSheetByName(CONFIG.ABAS.COLABORADORES);
    const dadosColab = sheetColab.getDataRange().getValues();
    for (let i = 5; i < dadosColab.length; i++) {
        const cpfLimpo = String(dadosColab[i][1]).replace(/\D/g, '');
        if (!mapDados[cpfLimpo]) { // Só preenche se não veio da API nem do Snapshot
            mapDados[cpfLimpo] = {
                nome: dadosColab[i][2],
                cidade: dadosColab[i][5] || '-' // Index 5 = Cidade (Atualizado)
            };
        }
    }

    // Gerar Linhas
    const linhas = cpfs.map((cpf, index) => {
        const d = mapDados[cpf] || { nome: 'Não encontrado', cidade: '-' };
        const seq = String(index + 1).padStart(4, '0');

        let valAlim = sheet.getRange('C10').getValue();
        let valTransp = sheet.getRange('C6').getValue();

        if (dadosMap && dadosMap[cpf]) {
            // Snapshot pode ser Lista (tipo_beneficio) ou já processado flat
            const itens = dadosMap[cpf];

            // Tenta achar itens por tipo
            const alim = itens.find(x => x.tipo_beneficio === 'vale_alimentacao' || x.vale_alimentacao);
            const transp = itens.find(x => x.tipo_beneficio === 'vale_transporte' || x.vale_transporte);

            if (alim) valAlim = alim.valor || alim.vale_alimentacao || 0;
            if (transp) valTransp = transp.valor || transp.vale_transporte || 0;

            // Se for um snapshot "flat" que tem tudo num objeto só (ex: restored from folha?)
            // Mas beneficios geralmente é lista.
        }

        return [
            seq,
            d.nome,
            d.cidade,
            '', // Férias
            valAlim,
            valTransp
        ];
    });

    if (linhas.length > 0) {
        sheet.getRange(startRow + 1, 1, linhas.length, headers.length).setValues(linhas);
        sheet.getRange(startRow + 1, 5, linhas.length, 2).setNumberFormat('R$ #,##0.00'); // Cols E,F
        sheet.getRange(startRow + 1, 1, linhas.length, 1).setHorizontalAlignment('center');
        sheet.getRange(startRow + 1, 3, linhas.length, 1).setHorizontalAlignment('center');
    }

    // Column Widths
    sheet.setColumnWidth(1, 50);  // #
    sheet.setColumnWidth(2, 300); // Nome
    sheet.setColumnWidth(3, 100); // Cidade
    sheet.setColumnWidth(4, 150); // Férias
    sheet.setColumnWidth(5, 120); // Alim
    sheet.setColumnWidth(6, 120); // Transp

    ss.setActiveSheet(sheet);
    SpreadsheetApp.getUi().alert('✅ Planilha Benefícios Ajustada!',
        `Layout corrigido conforme solicitação.\n\nPreencha "Férias" se necessário.\n\nQuando terminar: Lançamentos > Enviar Benefícios.`,
        SpreadsheetApp.getUi().ButtonSet.OK);
}

function enviarBeneficiosParaAPI() {
    const sheet = SpreadsheetApp.getActiveSheet();
    const nomeAba = sheet.getName();
    const ui = SpreadsheetApp.getUi();

    // 1. DETECÇÃO ROBUSTA (LANÇAMENTO OU SNAPSHOT)
    const isBeneficios = nomeAba.toLowerCase().includes('benef');
    const isSnapshot = nomeAba.startsWith('V.');
    const isLancamento = nomeAba.includes('Lançamento');

    if (!isBeneficios || (!isSnapshot && !isLancamento)) {
        ui.alert('⚠️ Aba Incorreta', 'Esta não é uma aba de Benefícios (Lançamento ou Histórico).', ui.ButtonSet.OK);
        return;
    }

    // RECUPERAR METADADOS (se for snapshot restaurado)
    let metadados = null;
    try {
        const metaStr = sheet.getRange('A1').getValue();
        if (typeof metaStr === 'string' && metaStr.startsWith('{')) {
            metadados = JSON.parse(metaStr);
        }
    } catch (e) { }

    // Se não tem metadados (Lançamento ou Snapshot antigo), extrair do nome
    if (!metadados) {
        const match = nomeAba.match(/V\.\s(\d{4})-(\d{2})-\d{2}/) || nomeAba.match(/(\d{{1,2})[-/](\d{4})/);
        // Tenta pegar periodo, mas sem ID de snapshot
        // Lógica de fallback simples
        // Para Lançamento Benefícios Jan-2026:
        const matchLanc = nomeAba.match(/([a-zA-Z]{3})-(\d{4})/);
        if (matchLanc) {
            const meses = { 'Jan': 1, 'Fev': 2, 'Mar': 3, 'Abr': 4, 'Mai': 5, 'Jun': 6, 'Jul': 7, 'Ago': 8, 'Set': 9, 'Out': 10, 'Nov': 11, 'Dez': 12 };
            metadados = { mes_referencia: meses[matchLanc[1]], ano_referencia: parseInt(matchLanc[2]), tipo: 'beneficios' };
        } else if (nomeAba.match(/V\./)) {
            // Tentar extrair data da string V. 2025-01-01
            const matchV = nomeAba.match(/(\d{4})-(\d{2})-\d{2}/);
            if (matchV) metadados = { mes_referencia: parseInt(matchV[2]), ano_referencia: parseInt(matchV[1]), tipo: 'beneficios' };
        }
    }

    if (!metadados || !metadados.mes_referencia) {
        // Ultima tentativa: Pedir ao usuário
        // Mas vamos abortar por segurança
        ui.alert('⚠️ Erro de Competência', 'Não foi possível identificar Mês/Ano. Verifique o nome da aba.', ui.ButtonSet.OK);
        return;
    }

    const resp = ui.alert('Confirmar',
        `Enviar benefícios de ${metadados.mes_referencia}/${metadados.ano_referencia}?\n\n` +
        (metadados.snapshot_id ? `⚠️ ATUALIZANDO snapshot existente (ID: ...${metadados.snapshot_id.substring(0, 6)})` : 'Novo lançamento será criado.'),
        ui.ButtonSet.YES_NO);
    if (resp == ui.Button.NO) return;

    // DETECTAR LAYOUT (SEMPRE MATRIZ AGORA, POIS O RESTAURADOR CONVERTEU)
    // Headers na linha 12, Dados na 13
    const startRow = 13;
    const lastRow = sheet.getLastRow();
    if (lastRow < startRow) {
        ui.alert('⚠️ Sem dados', 'A planilha está vazia.', ui.ButtonSet.OK);
        return;
    }

    // Leitura fixa das colunas 1 a 6 (#, Nome, Cidade, Ferias, Alim, Transp)
    const data = sheet.getRange(startRow, 1, lastRow - startRow + 1, 6).getValues();
    const beneficios = [];

    // MAP Nome → CPF (Necessário pois o layout restaurado só mostra Nome)
    // Robustez: Vamos pegar da aba Colaboradores
    const sheetColab = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.ABAS.COLABORADORES);
    const dadosColab = sheetColab.getDataRange().getValues();
    const mapNomeParaCPF = {};
    for (let i = 5; i < dadosColab.length; i++) {
        const nome = String(dadosColab[i][2]).trim().toUpperCase();
        const cpfRaw = String(dadosColab[i][1]).replace(/\D/g, '');
        mapNomeParaCPF[nome] = cpfRaw;
    }

    let duplicatas = 0;
    const chavesUnicas = new Set();

    data.forEach(row => {
        const nome = String(row[1]).trim().toUpperCase();
        let cpf = mapNomeParaCPF[nome];

        // As vezes o snapshot pode ter o CPF na coluna oculta ou seq? Nao, no layout restaurado é #.
        // Se não achar, loga e pula
        if (!cpf) return;

        const valAlim = parseFloat(row[4]);
        const valTransp = parseFloat(row[5]);

        // Alimentação
        if (valAlim > 0) {
            const key = `${cpf}-vale_alimentacao`;
            if (!chavesUnicas.has(key)) {
                beneficios.push({
                    cpf, mes_referencia: metadados.mes_referencia, ano_referencia: metadados.ano_referencia,
                    tipo_beneficio: 'vale_alimentacao', valor: valAlim, quantidade: 1, valor_total: valAlim, status: 'ativo'
                });
                chavesUnicas.add(key);
            }
        }

        // Transporte
        if (valTransp > 0) {
            const key = `${cpf}-vale_transporte`;
            if (!chavesUnicas.has(key)) {
                beneficios.push({
                    cpf, mes_referencia: metadados.mes_referencia, ano_referencia: metadados.ano_referencia,
                    tipo_beneficio: 'vale_transporte', valor: valTransp, quantidade: 1, valor_total: valTransp, status: 'ativo'
                });
                chavesUnicas.add(key);
            }
        }
    });

    if (beneficios.length === 0) {
        ui.alert('⚠️ Nada a enviar', 'Nenhum valor > 0 encontrado nos colaboradores identificados.', ui.ButtonSet.OK);
        return;
    }

    // ENVIAR PARA API
    try {
        const url = CONFIG.API_URL + '/beneficios/batch';
        const options = {
            'method': 'post', 'contentType': 'application/json',
            'payload': JSON.stringify({ beneficios }), 'muteHttpExceptions': true
        };
        const response = UrlFetchApp.fetch(url, options);
        const res = JSON.parse(response.getContentText());

        if (res.success) {
            ui.alert('✅ Sucesso!', res.message, ui.ButtonSet.OK);
            // Se for lançamento (não snapshot), oferece deletar
            const respDel = ui.alert('Limpeza', 'Deseja excluir esta aba?', ui.ButtonSet.YES_NO);
            if (respDel == ui.Button.YES) try { SpreadsheetApp.getActiveSpreadsheet().deleteSheet(sheet); } catch (e) { }
        } else {
            throw new Error(res.error);
        }
    } catch (e) {
        ui.alert('❌ Erro', e.message, ui.ButtonSet.OK);
    }
}

// =====================================================
// LANÇAMENTO DE VARIÁVEL (COMISSÕES/BÔNUS)
// =====================================================

function lancarVariavel() {
    const cpfs = obterCPFsSelecionados();
    if (cpfs.length === 0) {
        SpreadsheetApp.getUi().alert('⚠️ Nenhum colaborador selecionado', 'Selecione os colaboradores na aba Colaboradores.', SpreadsheetApp.getUi().ButtonSet.OK);
        return;
    }

    const periodo = pedirPeriodo();
    if (!periodo) return;

    criarPlanilhaVariavel(cpfs, periodo);
}

function criarPlanilhaVariavel(cpfs, periodo, dadosMap = null) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const nomeAba = `Lançamento Variável ${meses[periodo.mes - 1]}-${periodo.ano}`;

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

    // Lookup de nomes e cargos
    const sheetColab = ss.getSheetByName(CONFIG.ABAS.COLABORADORES);
    const dadosColab = sheetColab.getDataRange().getValues();
    const mapDados = {};
    for (let i = 5; i < dadosColab.length; i++) {
        const cpfLimpo = String(dadosColab[i][1]).replace(/\D/g, '');
        mapDados[cpfLimpo] = {
            nome: dadosColab[i][2],
            cargo: dadosColab[i][3]
        };
    }

    const headers = [
        'CPF', 'Nome', 'Cargo',
        'Tipo Variável', 'Valor (R$)', 'Data Referência', 'Observação'
    ];

    // Gerar linhas
    const dataPadrao = Utilities.formatDate(new Date(periodo.ano, periodo.mes - 1, 1), Session.getScriptTimeZone(), 'yyyy-MM-dd');

    const linhas = cpfs.map(cpf => {
        const d = mapDados[cpf] || { nome: 'Não encontrado', cargo: '-' };

        let item = {};
        if (dadosMap && dadosMap[cpf] && dadosMap[cpf].length > 0) item = dadosMap[cpf][0];

        return [
            formatarCPFParaExibicao(cpf),
            d.nome,
            d.cargo,
            item.tipo_variavel || 'comissao',
            item.valor || 0.00,
            item.data_referencia ? item.data_referencia.substring(0, 10) : dataPadrao,
            item.observacoes || ''
        ];
    });

    // Renderizar Header
    sheet.getRange(1, 1, 1, headers.length).setValues([headers])
        .setFontWeight('bold')
        .setBackground('#6aa84f') // Verde
        .setFontColor('white')
        .setHorizontalAlignment('center');

    // Renderizar Dados
    if (linhas.length > 0) {
        const range = sheet.getRange(2, 1, linhas.length, headers.length);
        range.setValues(linhas);

        // Formatar Moeda (Valor)
        sheet.getRange(2, 5, linhas.length, 1).setNumberFormat('R$ #,##0.00');

        // Validação Tipo Variável
        const tipos = ['comissao', 'bonus', 'plr', 'gratificacao', 'premio', 'dsr_variavel'];
        const rule = SpreadsheetApp.newDataValidation().requireValueInList(tipos).build();
        sheet.getRange(2, 4, linhas.length, 1).setDataValidation(rule);

        // Centralizar
        sheet.getRange(2, 1, linhas.length, 1).setHorizontalAlignment('center'); // CPF
        sheet.getRange(2, 6, linhas.length, 1).setHorizontalAlignment('center'); // Data
    }

    // Larguras
    sheet.setColumnWidth(1, 130); // CPF
    sheet.setColumnWidth(2, 250); // Nome
    sheet.setColumnWidth(3, 150); // Cargo
    sheet.setColumnWidth(4, 120); // Tipo
    sheet.setColumnWidth(5, 100); // Valor
    sheet.setColumnWidth(7, 200); // Obs

    sheet.setFrozenRows(1);

    ss.setActiveSheet(sheet);
    SpreadsheetApp.getUi().alert('✅ Planilha Variável Criada!',
        `Lance as comissões/bônus na aba "${nomeAba}".\n\nQuando terminar: Lançamentos > Enviar Variável.`,
        SpreadsheetApp.getUi().ButtonSet.OK);
}

function enviarVariavelParaAPI() {
    const sheet = SpreadsheetApp.getActiveSheet();
    const nomeAba = sheet.getName();

    // 1. DETECÇÃO ROBUSTA (LANÇAMENTO OU SNAPSHOT)
    const isVariavel = nomeAba.toLowerCase().includes('vari') || nomeAba.toLowerCase().includes('comis');
    const isSnapshot = nomeAba.startsWith('V.');
    const isLancamento = nomeAba.includes('Lançamento');

    if (!isVariavel || (!isSnapshot && !isLancamento)) {
        SpreadsheetApp.getUi().alert('⚠️ Aba Incorreta', 'Você deve estar na aba "Lançamento Variável" ou "Histórico Variável".', SpreadsheetApp.getUi().ButtonSet.OK);
        return;
    }

    // Extrair Período do nome da aba (Ex: ... Jan-2025)
    // Isso é importante para preencher mes_referencia na API
    const partesNome = nomeAba.split(' ');
    const periodoStr = partesNome[partesNome.length - 1]; // "Jan-2025"
    let mes = 0;
    let ano = 0;
    const meses = { 'Jan': 1, 'Fev': 2, 'Mar': 3, 'Abr': 4, 'Mai': 5, 'Jun': 6, 'Jul': 7, 'Ago': 8, 'Set': 9, 'Out': 10, 'Nov': 11, 'Dez': 12 };

    if (periodoStr && periodoStr.includes('-')) {
        const [mStr, aStr] = periodoStr.split('-');
        mes = meses[mStr] || 0;
        ano = parseInt(aStr) || 0;
    } else {
        // Fallback: Pede pro usuário se falhar parse
        const p = pedirPeriodo();
        if (p) { mes = p.mes; ano = p.ano; }
        else return;
    }

    const ui = SpreadsheetApp.getUi();
    const resp = ui.alert('Confirmar', `Enviar remuneração variável para ${mes}/${ano}?`, ui.ButtonSet.YES_NO);
    if (resp == ui.Button.NO) return;

    const data = sheet.getDataRange().getValues();
    // Header na linha 1, dados na 2
    if (data.length < 2) return;

    const variaveis = [];
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row[0]) continue; // Sem CPF

        const cpf = String(row[0]).replace(/\D/g, '');
        const tipo = row[3];
        const valor = parseFloat(row[4]);
        const dataRef = row[5];
        const obs = row[6];

        if (!valor || valor <= 0) continue; // Pula zerados

        // Tratamento da data
        let dataIso = '';
        if (dataRef instanceof Date) {
            dataIso = Utilities.formatDate(dataRef, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        } else {
            // Tentar criar data
            dataIso = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
        }

        variaveis.push({
            cpf: cpf,
            mes_referencia: mes,
            ano_referencia: ano,
            tipo_variavel: tipo,
            valor: valor,
            data_referencia: dataIso,
            observacoes: obs,
            status: 'pendente' // Default
        });
    }

    if (variaveis.length === 0) {
        ui.alert('⚠️ Nada a enviar', 'Nenhum valor > 0 encontrado.', ui.ButtonSet.OK);
        return;
    }

    try {
        const url = CONFIG.API_URL + '/variavel/batch'; // <--- TERA QUE CRIAR ROTA
        const options = {
            'method': 'post', 'contentType': 'application/json',
            'payload': JSON.stringify({ variaveis: variaveis }), 'muteHttpExceptions': true
        };
        const response = UrlFetchApp.fetch(url, options);
        const res = JSON.parse(response.getContentText());

        if (res.success) {
            ui.alert('✅ Sucesso!', res.message, ui.ButtonSet.OK);
            const respDel = ui.alert('Limpeza', 'Deseja excluir esta aba de lançamento?', ui.ButtonSet.YES_NO);
            if (respDel == ui.Button.YES) {
                try { SpreadsheetApp.getActiveSpreadsheet().deleteSheet(sheet); } catch (e) { }
            }
        } else {
            throw new Error(res.error);
        }
    } catch (e) {
        ui.alert('❌ Erro', e.message, ui.ButtonSet.OK);
    }
}

function lancarApontamentos() {
    const cpfs = obterCPFsSelecionados();
    if (cpfs.length === 0) {
        SpreadsheetApp.getUi().alert('⚠️ Nenhum colaborador selecionado', 'Selecione os colaboradores na aba Colaboradores.', SpreadsheetApp.getUi().ButtonSet.OK);
        return;
    }

    const periodo = pedirPeriodo();
    if (!periodo) return;

    criarPlanilhaLancamentoApontamentos(cpfs, periodo);
}

function criarPlanilhaLancamentoApontamentos(cpfs, periodo, dadosMap = null) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const nomeAba = `Lançamento Apontamentos ${meses[periodo.mes - 1]}-${periodo.ano}`;

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

    // Lookup de nomes
    const sheetColab = ss.getSheetByName(CONFIG.ABAS.COLABORADORES);
    const dadosColab = sheetColab.getDataRange().getValues();
    const mapNomes = {};
    for (let i = 5; i < dadosColab.length; i++) {
        const cpfLimpo = String(dadosColab[i][1]).replace(/\D/g, '');
        mapNomes[cpfLimpo] = dadosColab[i][2];
    }

    const headers = [
        'CPF', 'Nome', 'Data', 'Tipo (presenca/falta/etc)',
        'Hora Entrada', 'Hora Saída', 'Inicio Intervalo', 'Fim Intervalo',
        'Horas Trab.', 'Horas Extras', 'Horas Noturnas',
        'Falta (S/N)', 'Atraso (min)', 'Saída Anec. (min)',
        'Justificativa', 'Atestado (S/N)', 'Status (pendente)', 'Obs'
    ];

    // Gerar linhas - Para apontamentos, normalmente é dia a dia, mas aqui vamos gerar UMA linha por CPF para o usuário duplicar se necessário ou preencher datas?
    // Decisão: Gerar uma linha com a data atual (ou dia 1 do mês) como sugestão.
    const dataPadrao = Utilities.formatDate(new Date(periodo.ano, periodo.mes - 1, 1), Session.getScriptTimeZone(), 'yyyy-MM-dd');

    const linhas = [];
    cpfs.forEach(cpf => {
        const nome = mapNomes[cpf] || 'Não encontrado';

        if (dadosMap && dadosMap[cpf] && dadosMap[cpf].length > 0) {
            // Se tem histórico, cria uma linha para cada apontamento
            dadosMap[cpf].forEach(item => {
                linhas.push([
                    formatarCPFParaExibicao(cpf), nome,
                    item.data_apontamento ? item.data_apontamento.substring(0, 10) : dataPadrao,
                    item.tipo_apontamento || 'presenca',
                    item.hora_entrada || '08:00', item.hora_saida || '17:00',
                    item.hora_inicio_intervalo || '12:00', item.hora_fim_intervalo || '13:00',
                    item.horas_trabalhadas || 8, item.horas_extras || 0, item.horas_noturnas || 0,
                    item.falta ? 'Sim' : 'Não', item.atraso_minutos || 0, item.saida_antecipada_minutos || 0,
                    item.justificativa || '', item.atestado ? 'Sim' : 'Não', item.status || 'pendente', item.observacoes || ''
                ]);
            });
        } else {
            // Default
            linhas.push([
                formatarCPFParaExibicao(cpf), nome, dataPadrao, 'presenca',
                '08:00', '17:00', '12:00', '13:00',
                8, 0, 0,
                'Não', 0, 0,
                '', 'Não', 'pendente', ''
            ]);
        }
    });

    // Renderizar
    sheet.getRange(1, 1, 1, headers.length).setValues([headers])
        .setFontWeight('bold').setBackground('#fbbc04').setFontColor('black'); // Cor diferente para diferenciar de Folha

    sheet.getRange(2, 1, linhas.length, headers.length).setValues(linhas);

    // Validação de Dados para Tipo
    const tipos = ['presenca', 'falta', 'falta_justificada', 'atestado', 'ferias', 'folga', 'licenca', 'home_office', 'hora_extra', 'banco_horas'];
    const rule = SpreadsheetApp.newDataValidation().requireValueInList(tipos).build();
    sheet.getRange(2, 4, linhas.length, 1).setDataValidation(rule);

    // Formatação
    sheet.setColumnWidth(2, 200);
    sheet.setFrozenColumns(2);

    ss.setActiveSheet(sheet);
    SpreadsheetApp.getUi().alert('✅ Planilha de Apontamentos Criada!',
        `Preencha o DIÁRIO na aba "${nomeAba}".\nOBS: Você pode copiar e colar as linhas para lançar múltiplos dias para o mesmo CPF.\n\nQuando terminar: Lançamentos > Enviar Apontamentos.`,
        SpreadsheetApp.getUi().ButtonSet.OK);
}

function enviarApontamentosParaAPI() {
    const sheet = SpreadsheetApp.getActiveSheet();
    const nomeAba = sheet.getName();

    // 1. DETECÇÃO ROBUSTA (LANÇAMENTO OU SNAPSHOT)
    const isApontamentos = nomeAba.toLowerCase().includes('apont') || nomeAba.toLowerCase().includes('ponto');
    const isSnapshot = nomeAba.startsWith('V.');
    const isLancamento = nomeAba.includes('Lançamento');

    if (!isApontamentos || (!isSnapshot && !isLancamento)) {
        SpreadsheetApp.getUi().alert('⚠️ Aba Incorreta', 'Você deve estar na aba "Lançamento Apontamentos" ou "Histórico Apontamentos" para enviar.', SpreadsheetApp.getUi().ButtonSet.OK);
        return;
    }

    const ui = SpreadsheetApp.getUi();
    const resp = ui.alert('Confirmar', 'Enviar apontamentos para o sistema?', ui.ButtonSet.YES_NO);
    if (resp == ui.Button.NO) return;

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return;

    const apontamentos = [];
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row[0]) continue;

        // Tratamento de Data
        let dataApont = row[2];
        if (dataApont instanceof Date) {
            dataApont = Utilities.formatDate(dataApont, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        }

        apontamentos.push({
            cpf: String(row[0]).replace(/\D/g, ''),
            data_apontamento: dataApont,
            tipo_apontamento: row[3],
            hora_entrada: row[4] ? formatarHora(row[4]) : null,
            hora_saida: row[5] ? formatarHora(row[5]) : null,
            hora_inicio_intervalo: row[6] ? formatarHora(row[6]) : null,
            hora_fim_intervalo: row[7] ? formatarHora(row[7]) : null,
            horas_trabalhadas: row[8],
            horas_extras: row[9],
            horas_noturnas: row[10],
            falta: row[11] === 'Sim',
            atraso_minutos: row[12],
            saida_antecipada_minutos: row[13],
            justificativa: row[14],
            atestado: row[15] === 'Sim',
            status: row[16],
            observacoes: row[17]
        });
    }

    try {
        const url = CONFIG.API_URL + '/apontamentos/batch';
        const options = {
            'method': 'post', 'contentType': 'application/json',
            'payload': JSON.stringify({ apontamentos: apontamentos }), 'muteHttpExceptions': true
        };
        const response = UrlFetchApp.fetch(url, options);
        const res = JSON.parse(response.getContentText());

        if (res.success) {
            ui.alert('✅ Sucesso!', res.message, ui.ButtonSet.OK);
            const respDel = ui.alert('Limpeza', 'Deseja excluir esta aba de lançamento?', ui.ButtonSet.YES_NO);
            if (respDel == ui.Button.YES) {
                try { SpreadsheetApp.getActiveSpreadsheet().deleteSheet(sheet); } catch (e) { }
            }
        } else {
            throw new Error(res.error);
        }
    } catch (e) {
        ui.alert('❌ Erro', e.message, ui.ButtonSet.OK);
    }
}

function formatarHora(val) {
    // Se vier Date do sheets (ex: 1899-12-30T08:00:00)
    if (val instanceof Date) {
        return Utilities.formatDate(val, Session.getScriptTimeZone(), 'HH:mm:ss');
    }
    return val;
}

function mostrarFormularioLancamento(tipo, nome) {
    // TODO: Criar formulários específicos para cada tipo
    const ui = SpreadsheetApp.getUi();
    ui.alert('Em Desenvolvimento',
        `Formulário de ${nome} será implementado em breve.\nPor enquanto, use a API diretamente.`,
        ui.ButtonSet.OK);
}

// =====================================================
// UTILITÁRIOS
// =====================================================

function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
    let resto = 11 - (soma % 11);
    if ((resto >= 10 ? 0 : resto) !== parseInt(cpf.charAt(9))) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
    resto = 11 - (soma % 11);
    return (resto >= 10 ? 0 : resto) === parseInt(cpf.charAt(10));
}

function formatarCPFParaExibicao(cpf) {
    cpf = cpf.replace(/\D/g, '');
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function atualizarDashboard() {
    const ui = SpreadsheetApp.getUi();
    ui.alert('🔄 Dashboard', 'Funcionalidade em desenvolvimento', ui.ButtonSet.OK);
}

function abrirConfiguracoes() {
    const ui = SpreadsheetApp.getUi();
    ui.alert('⚙️ Configurações',
        `URL da API: ${CONFIG.API_URL}\n\nPara alterar, edite o script.`,
        ui.ButtonSet.OK);
}
// =====================================================
// FUNÇÕES FALTANTES - ADICIONE NO FINAL DO CÓDIGO
// =====================================================

function novoColaboradorModal() {
    const html = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial; padding: 20px; }
      label { display: block; margin-top: 10px; font-weight: bold; font-size: 13px; }
      input, select { width: 100%; padding: 8px; margin: 5px 0; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; }
      button { background: #4285f4; color: white; padding: 10px 20px; 
               border: none; margin: 15px 5px 0 0; cursor: pointer; border-radius: 4px; font-weight: bold; }
      button:hover { background: #357ae8; }
      .required { color: red; }
      .row { display: flex; gap: 10px; }
      .col { flex: 1; }
      h2 { color: #202124; margin-top: 0; }
    </style>
    
    <h2>➕ Novo Colaborador</h2>
    
    <form id="formColaborador">
      <div class="row">
        <div class="col">
          <label>CPF <span class="required">*</span></label>
          <input type="text" id="cpf" placeholder="000.000.000-00" required maxlength="14">
        </div>
        <div class="col">
          <label>Matrícula</label>
          <input type="text" id="matricula" placeholder="Ex: 1234">
        </div>
      </div>
      
      <label>Nome Completo <span class="required">*</span></label>
      <input type="text" id="nome_completo" required>
      
      <div class="row">
        <div class="col">
          <label>Email</label>
          <input type="email" id="email" placeholder="email@empresa.com">
        </div>
        <div class="col">
          <label>Telefone</label>
          <input type="text" id="telefone" placeholder="(00) 00000-0000">
        </div>
      </div>

      <div class="row">
        <div class="col">
          <label>Cargo</label>
          <input type="text" id="cargo" placeholder="Ex: Analista">
        </div>
        <div class="col">
          <label>Departamento</label>
          <select id="departamento">
            <option value="">Selecione...</option>
            <option value="Comercial">Comercial</option>
            <option value="RH">RH</option>
            <option value="Financeiro">Financeiro</option>
            <option value="Vendas">Vendas</option>
            <option value="TI">TI</option>
            <option value="Operações">Operações</option>
          </select>
        </div>
      </div>
      
      <div class="row">
         <div class="col">
            <label>Código Folha</label>
            <input type="text" id="codigo_folha" placeholder="Ex: 001">
         </div>
         <div class="col">
            <label>Local de Trabalho</label>
            <input type="text" id="local_trabalho" placeholder="Ex: Matriz">
         </div>
         <div class="col">
            <label>Cidade</label>
            <input type="text" id="cidade" placeholder="Ex: São Paulo">
         </div>
      </div>

      <div class="row">
        <div class="col">
          <label>Data Nascimento</label>
          <input type="date" id="data_nascimento">
        </div>
        <div class="col">
           <label>Data Admissão</label>
           <input type="date" id="data_admissao">
        </div>
        <div class="col">
           <label>Salário Base (R$)</label>
           <input type="number" step="0.01" id="salario_base" placeholder="0,00">
        </div>
      </div>
      
      <label>Status</label>
      <select id="status">
        <option value="ativo" selected>Ativo</option>
        <option value="inativo">Inativo</option>
        <option value="ferias">Férias</option>
        <option value="afastado">Afastado</option>
      </select>
      
      <div style="margin-top: 20px;">
        <button type="submit">✅ Salvar</button>
        <button type="button" onclick="google.script.host.close()">Cancelar</button>
      </div>
    </form>
    
    <div id="mensagem" style="margin-top: 20px; padding: 10px; display: none;"></div>
    
    <script>
      // Formatar CPF enquanto digita
      document.getElementById('cpf').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\\D/g, '');
        if (value.length <= 11) {
          value = value.replace(/(\\d{3})(\\d)/, '$1.$2');
          value = value.replace(/(\\d{3})(\\d)/, '$1.$2');
          value = value.replace(/(\\d{3})(\\d{1,2})$/, '$1-$2');
          e.target.value = value;
        }
      });
      
      // Formatar telefone
      document.getElementById('telefone').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\\D/g, '');
        if (value.length <= 11) {
          value = value.replace(/(\\d{2})(\\d)/, '($1) $2');
          value = value.replace(/(\\d{5})(\\d)/, '$1-$2');
          e.target.value = value;
        }
      });
      
      // Enviar formulário
      document.getElementById('formColaborador').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const colaborador = {
          cpf: document.getElementById('cpf').value.replace(/\\D/g, ''),
          matricula: document.getElementById('matricula').value,
          nome_completo: document.getElementById('nome_completo').value,
          email: document.getElementById('email').value,
          telefone: document.getElementById('telefone').value.replace(/\\D/g, ''),
          cargo: document.getElementById('cargo').value,
          departamento: document.getElementById('departamento').value,
          codigo_folha: document.getElementById('codigo_folha').value,
          local_trabalho: document.getElementById('local_trabalho').value,
          cidade: document.getElementById('cidade').value,
          data_nascimento: document.getElementById('data_nascimento').value,
          data_admissao: document.getElementById('data_admissao').value,
          salario_base: document.getElementById('salario_base').value,
          status: document.getElementById('status').value
        };
        
        // Remove campos vazios para não enviar string vazia
        Object.keys(colaborador).forEach(k => {
            if (colaborador[k] === '') delete colaborador[k];
        });
        
        // Validar CPF básico
        if (colaborador.cpf.length !== 11) {
          mostrarMensagem('❌ CPF inválido! Digite 11 dígitos.', 'error');
          return;
        }
        
        // Validar nome
        if (!colaborador.nome_completo || colaborador.nome_completo.trim().length < 3) {
          mostrarMensagem('❌ Nome deve ter pelo menos 3 caracteres.', 'error');
          return;
        }
        
        mostrarMensagem('⏳ Salvando dados...', 'info');
        
        google.script.run
          .withSuccessHandler(function(resultado) {
            if (resultado.success) {
              mostrarMensagem('✅ Salvo com sucesso!', 'success');
              setTimeout(function() { google.script.host.close(); }, 1500);
            } else {
              mostrarMensagem('❌ Erro: ' + resultado.error, 'error');
            }
          })
          .withFailureHandler(function(erro) {
            mostrarMensagem('❌ Erro no servidor: ' + erro.message, 'error');
          })
          .criarColaboradorAPI(colaborador);
      });
      
      function mostrarMensagem(texto, tipo) {
        const div = document.getElementById('mensagem');
        div.style.display = 'block';
        div.innerHTML = texto;
        
        if (tipo === 'success') {
          div.style.background = '#d4edda';
          div.style.color = '#155724';
          div.style.border = '1px solid #c3e6cb';
        } else if (tipo === 'error') {
          div.style.background = '#f8d7da';
          div.style.color = '#721c24';
          div.style.border = '1px solid #f5c6cb';
        } else {
          div.style.background = '#d1ecf1';
          div.style.color = '#0c5460';
          div.style.border = '1px solid #bee5eb';
        }
      }
    </script>
  `).setWidth(500).setHeight(650);

    SpreadsheetApp.getUi().showModalDialog(html, 'Novo Colaborador');
}

function criarColaboradorAPI(colaborador) {
    try {
        const url = CONFIG.API_URL + '/colaboradores';
        const options = {
            method: 'post',
            contentType: 'application/json',
            payload: JSON.stringify(colaborador),
            muteHttpExceptions: true
        };

        const response = UrlFetchApp.fetch(url, options);
        const resultado = JSON.parse(response.getContentText());

        if (resultado.success) {
            // Atualizar lista de colaboradores
            buscarColaboradoresAPI({});
            return { success: true };
        } else {
            return { success: false, error: resultado.error };
        }
    } catch (erro) {
        Logger.log('Erro ao criar colaborador:', erro);
        return { success: false, error: erro.message };
    }
}

function editarSelecionados() {
    const ui = SpreadsheetApp.getUi();
    const cpfs = obterCPFsSelecionados();

    if (cpfs.length === 0) {
        ui.alert('⚠️ Nenhum colaborador selecionado', 'Marque o checkbox de UM colaborador.', ui.ButtonSet.OK);
        return;
    }

    if (cpfs.length > 1) {
        ui.alert('⚠️ Selecione apenas um colaborador', 'A edição funciona com um colaborador por vez.', ui.ButtonSet.OK);
        return;
    }

    // Buscar dados do colaborador
    try {
        const cpf = cpfs[0];
        const url = CONFIG.API_URL + '/colaboradores/' + cpf;
        const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
        const resultado = JSON.parse(response.getContentText());

        Logger.log('BUSCA COLABORADOR (' + cpf + '): ' + JSON.stringify(resultado));

        if (resultado.success) {
            // Tenta obter os dados de várias formas possíveis
            var dadosColaborador = resultado.data || resultado.colaborador || resultado.body;

            if (!dadosColaborador && resultado.nome_completo) {
                dadosColaborador = resultado;
            }

            if (!dadosColaborador) {
                ui.alert('Erro', 'Dados do colaborador não encontrados na resposta da API.\nVerifique os logs.', ui.ButtonSet.OK);
                return;
            }

            mostrarModalEdicao(dadosColaborador);
        } else {
            throw new Error(resultado.error || 'Erro na API');
        }
    } catch (erro) {
        ui.alert('❌ Erro', 'Erro ao buscar colaborador: ' + erro.message, ui.ButtonSet.OK);
    }
}

// =====================================================
// MODAL COM EMOJIS E DESIGN PREMIUM
// =====================================================


function mostrarModalEdicao(colaborador) {
    Logger.log('=== ABRINDO MODAL ===');
    Logger.log('Dados recebidos: ' + JSON.stringify(colaborador));

    // Tratamento seguro de valores
    var nome = colaborador.nome_completo || '';
    var email = colaborador.email || '';
    var telefone = colaborador.telefone || '';
    var cargo = colaborador.cargo || '';
    var dep = colaborador.departamento || '';
    var local = colaborador.local_trabalho || '';
    var cidade = colaborador.cidade || '';
    var motivo = colaborador.motivo_alteracao || '';
    var status = colaborador.status || 'ativo';

    // Tratamento robusto da Data de Admissão (YYYY-MM-DD)
    var admissao = colaborador.data_admissao || '';
    if (admissao) {
        // Se vier como ISO (2023-01-01T00:00:00.000Z), pega só a data
        if (admissao.indexOf('T') > -1) {
            admissao = admissao.split('T')[0];
        }
    }

    // Tratamento robusto do Salário
    var salario = colaborador.salario_base || colaborador.salario; // Aceita ambos
    // Se vier nulo ou undefined
    if (salario === undefined || salario === null) salario = 0;

    // Se vier como string (ex: "2.500,00" ou "R$ 2500"), tenta limpar
    if (typeof salario === 'string') {
        // Remove tudo que não é dígito, ponto, vírgula ou traço
        var limpo = salario.replace(/[^\d,.-]/g, '');
        // Se tiver vírgula, assume que é decimal pt-BR e troca por ponto
        if (limpo.indexOf(',') > -1) {
            limpo = limpo.replace('.', '').replace(',', '.');
        }
        salario = parseFloat(limpo);
    }

    // Garante que é número
    if (typeof salario !== 'number' || isNaN(salario)) salario = 0;

    // Formata para exibição (pt-BR)
    salario = salario.toFixed(2).replace('.', ',');

    // FIX EDGE PERMISSION_DENIED: Pre-carrega TODOS OS DADOS no servidor antes de montar o modal.
    // Elimina google.script.run para o carregamento inicial.
    var colabId = colaborador.id || colaborador.colaborador_id || colaborador.cpf;
    var planosList = null, pUsuario = null, depsRes = null;

    // 1. Planos Gerais
    try { planosList = listarPlanosAPI(); } catch (e) { planosList = { success: false, error: e.message }; }
    var pTag = '<script type="application/json" id="srvplanos">' + JSON.stringify(planosList).replace(/<\//g, '\\u003c/') + '<\/script>';

    // 2. Planos do Colaborador
    try { pUsuario = buscarPlanosColaboradorAPI(colabId); } catch (e) { pUsuario = { success: false, error: e.message }; }
    var puTag = '<script type="application/json" id="srvplanosuser">' + JSON.stringify(pUsuario).replace(/<\//g, '\\u003c/') + '<\/script>';

    // 3. Dependentes do Colaborador
    try { depsRes = listarDependentesAPI(colabId); } catch (e) { depsRes = { success: false, error: e.message }; }
    var dTag = '<script type="application/json" id="srvdeps">' + JSON.stringify(depsRes).replace(/<\//g, '\\u003c/') + '<\/script>';

    var dataTags = pTag + puTag + dTag;

    const html = HtmlService.createHtmlOutput(dataTags + `
    <style>
      body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 20px; background-color: #f8f9fa; }
      h2 { color: #202124; border-bottom: 2px solid #4285f4; padding-bottom: 10px; margin-top: 0; }
      label { display: block; margin-top: 12px; font-weight: 600; color: #5f6368; font-size: 13px; }
      input, select { width: 100%; padding: 10px; margin: 5px 0; box-sizing: border-box; border: 1px solid #dadce0; border-radius: 6px; font-size: 14px; transition: border 0.2s; }
      input:focus, select:focus { border-color: #4285f4; outline: none; box-shadow: 0 0 0 2px rgba(66,133,244,0.2); }
      
      .btn { padding: 10px 24px; border: none; margin: 15px 5px 0 0; cursor: pointer; border-radius: 4px; font-weight: 600; font-size: 14px; transition: background 0.2s; }
      .btn-primary { background: #1a73e8; color: white; }
      .btn-primary:hover { background: #1557b0; box-shadow: 0 1px 2px rgba(60,64,67,0.3); }
      .btn-secondary { background: #fff; color: #5f6368; border: 1px solid #dadce0; }
      .btn-secondary:hover { background: #f1f3f4; color: #202124; }
      .btn-danger { background: #d93025; color: white; }
      .btn-success { background: #1e8e3e; color: white; }
      
      .info-box { background: #e8f0fe; padding: 12px; margin-bottom: 20px; border-radius: 8px; color: #1967d2; display: flex; align-items: center; gap: 10px; }
      .section-box { background: white; padding: 20px; border-radius: 8px; border: 1px solid #dadce0; margin-top: 20px; box-shadow: 0 1px 2px rgba(60,64,67,0.1); }
      .section-title { font-weight: bold; color: #202124; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; font-size: 16px; }
      
      .row { display: flex; gap: 15px; }
      .col { flex: 1; }
      
      /* Status Badge */
      .status-badge { padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
      .status-ativo { background: #ceead6; color: #0d652d; }
    </style>
    
    <h2>✏️ Editar Colaborador</h2>
    
    <div class="info-box">
      <span style="font-size: 20px;">👤</span>
      <div>
        <strong>${formatarCPFParaExibicao(colaborador.cpf)}</strong><br>
        <small>O CPF é o identificador único e não pode ser alterado.</small>
      </div>
    </div>
    
    <form id="formEdicao">
      <input type="hidden" id="colaborador_id" value="${colaborador.id}">
      <input type="hidden" id="cpf" value="${colaborador.cpf}">
      
      <div class="row">
        <div class="col" style="flex: 2;">
            <label>Nome Completo</label>
            <input type="text" id="nome_completo" value="${nome}" required>
        </div>
        <div class="col">
            <label>Status</label>
            <select id="status">
                <option value="ativo" ${status === 'ativo' ? 'selected' : ''}>🟢 Ativo</option>
                <option value="inativo" ${status === 'inativo' ? 'selected' : ''}>🔴 Inativo</option>
                <option value="ferias" ${status === 'ferias' ? 'selected' : ''}>🏖️ Férias</option>
                <option value="afastado" ${status === 'afastado' ? 'selected' : ''}>⚠️ Afastado</option>
            </select>
        </div>
      </div>
      
      <div class="row">
        <div class="col">
            <label>📧 Email</label>
            <input type="email" id="email" value="${email}">
        </div>
        <div class="col">
            <label>📱 Telefone</label>
            <input type="text" id="telefone" value="${telefone}">
        </div>
      </div>
      
      <div class="row">
        <div class="col">
            <label>💼 Cargo</label>
            <input type="text" id="cargo" value="${cargo}">
        </div>
        <div class="col">
            <label>🏢 Departamento</label>
            <select id="departamento">
                <option value="">Selecione...</option>
                <option value="Comercial" ${dep === 'Comercial' ? 'selected' : ''}>Comercial</option>
                <option value="RH" ${dep === 'RH' ? 'selected' : ''}>RH</option>
                <option value="Financeiro" ${dep === 'Financeiro' ? 'selected' : ''}>Financeiro</option>
                <option value="Vendas" ${dep === 'Vendas' ? 'selected' : ''}>Vendas</option>
                <option value="TI" ${dep === 'TI' ? 'selected' : ''}>TI</option>
                <option value="Operações" ${dep === 'Operações' ? 'selected' : ''}>Operações</option>
            </select>
        </div>
      </div>
      
      <div class="row">
        <div class="col">
            <label>📍 Local de Trabalho</label>
            <input type="text" id="local_trabalho" value="${local}">
        </div>
        <div class="col">
            <label>🏙️ Cidade</label>
            <input type="text" id="cidade" value="${cidade}">
        </div>
        <div class="col">
            <label>📅 Admissão</label>
            <input type="date" id="data_admissao" value="${admissao}">
        </div>
      </div>
      
      <div class="section-box" style="background: #fff8e1; border-color: #ffe0b2;">
          <div class="section-title">💰 Dados Financeiros</div>
          <div class="row">
              <div class="col">
                 <label style="margin-top:0">Salário Base (R$)</label>
                 <input type="text" id="salario_base" value="${salario}" oninput="formatarMoeda(this)" style="font-weight:bold; color:#1e8e3e;">
              </div>
              <div class="col">
                 <label style="margin-top:0">Motivo Alteração</label>
                 <input type="text" id="motivo_alteracao" value="${motivo}" placeholder="Ex: Promoção, Dissídio">
              </div>
          </div>
      </div>

      <div class="section-box">
        <div class="section-title">🏥 Planos de Saúde e Odonto</div>
        
        <div class="row">
          <div class="col" style="flex: 2;">
            <label>Plano de Saúde</label>
            <select id="plano_saude"><option value="">🔄 Carregando...</option></select>
          </div>
          <div class="col" style="flex: 1;">
            <label>💳 Carteirinha / Matrícula</label>
            <input type="text" id="matricula_saude" placeholder="Ex: 95445982">
          </div>
        </div>
        
        <label>🦷 Plano Odontológico (Opcional)</label>
        <select id="plano_odonto"><option value="">🔄 Carregando...</option></select>
        
        <hr style="margin: 20px 0; border: 0; border-top: 1px solid #eee;">
        
        <div class="section-title">👨‍👩‍👧‍👦 Dependentes</div>
        <div id="lista_dependentes" style="margin-bottom: 15px; font-size: 13px; color: #666;">🔄 Carregando lista...</div>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border: 1px dashed #ccc;">
          <input type="hidden" id="dep_id">
          <label style="margin-top:0; color:#1a73e8;" id="titulo_dep">➕ Adicionar Dependente:</label>
          <div class="row">
            <input type="text" id="dep_nome" placeholder="Nome Completo" style="flex: 2;">
            <input type="text" id="dep_cpf" placeholder="CPF" style="flex: 1;">
            <input type="date" id="dep_nasc" style="flex: 1;">
          </div>
          <div class="row">
            <select id="dep_parentesco" style="flex: 1;">
              <option value="">Parentesco...</option>
              <option value="Filho(a)">Filho(a)</option>
              <option value="Conjuge">Cônjuge</option>
              <option value="Pai/Mae">Pai/Mãe</option>
            </select>
            <input type="text" id="dep_matricula" placeholder="Matrícula (Opcional)" style="flex: 1;">
            <div style="display:flex; gap:5px;">
                <button type="button" id="btn_salvar_dep" onclick="adicionarDependenteUI(this)" class="btn btn-success" style="margin: 5px 0 0 0; padding: 8px 15px;">Adicionar</button>
                <button type="button" id="btn_cancelar_dep" onclick="cancelarEdicaoDependente()" class="btn btn-secondary" style="margin: 5px 0 0 0; padding: 8px 15px; display:none;">Cancelar</button>
            </div>
          </div>
        </div>
      </div>

      <div style="margin-top: 25px; text-align: right; border-top: 1px solid #eee; padding-top: 15px;">
        <button type="button" onclick="google.script.host.close()" class="btn btn-secondary">❌ Cancelar</button>
        <button type="submit" class="btn btn-primary">💾 Salvar Alterações</button>
      </div>
    </form>
    
    <div id="mensagem" style="margin-top: 20px; padding: 15px; display: none; border-radius: 6px;"></div>
    
    <script>
      // Formata moeda - Versao Segura (Sem backslash hell)
      function formatarMoeda(el) {
        var v = el.value;
        v = v.replace(/[^0-9]/g, ''); // Apenas numeros
        v = (v/100).toFixed(2) + '';
        v = v.replace('.', ',');
        // Adiciona pontos de milhar: busca grupos de 3 digitos
        // Usando loop simples ou regex literal segura
        v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
        el.value = v;
      }

      document.getElementById('telefone').addEventListener('input', function(e) {
        var v = e.target.value;
        v = v.replace(/[^0-9]/g, '');
        if (v.length > 11) v = v.substring(0, 11);
        e.target.value = v;
      });
      
      document.getElementById('formEdicao').addEventListener('submit', function(e) {
        e.preventDefault();
        
        var salarioStr = document.getElementById('salario_base').value;
        
        // LIMPEZA SEGURA: Remove tudo que nao for numero ou virgula
        // Ex: "R$ 1.500,00" -> "1500,00"
        var salarioLimpo = salarioStr.replace(/[^0-9,]/g, '').replace(',', '.');
        var salarioNum = parseFloat(salarioLimpo);
        
        var dados = {
          nome_completo: document.getElementById('nome_completo').value,
          email: document.getElementById('email').value,
          telefone: document.getElementById('telefone').value,
          cargo: document.getElementById('cargo').value,
          departamento: document.getElementById('departamento').value,
          local_trabalho: document.getElementById('local_trabalho').value,
          cidade: document.getElementById('cidade').value,
          data_admissao: document.getElementById('data_admissao').value,
          salario_base: salarioNum || 0,
          motivo_alteracao: document.getElementById('motivo_alteracao').value,
          status: document.getElementById('status').value
        };
        
        var cpf = document.getElementById('cpf').value;
        
        mostrarMensagem('⏳ Salvando dados do colaborador...', 'info');
        
        google.script.run
          .withSuccessHandler(handleSalvarSucesso)
          .withFailureHandler(handleSalvarErro)
          .atualizarColaboradorAPI(cpf, dados);
      });
      
      function handleSalvarSucesso(res) {
        if (res.success) {
           salvarPlanos();
        } else {
           mostrarMensagem('❌ Erro ao salvar colaborador: ' + res.error, 'error');
        }
      }
      
      function handleSalvarErro(e) {
        mostrarMensagem('❌ Erro de comunicação: ' + e.message, 'error');
      }
      
      function salvarPlanos() {
         mostrarMensagem('🏥 Salvando planos de saúde...', 'info');
         var cid = document.getElementById('colaborador_id').value;
         var pSaude = document.getElementById('plano_saude').value;
         var pOdonto = document.getElementById('plano_odonto').value;
         var matSaude = document.getElementById('matricula_saude').value;
         
         // Log para debug
         console.log('Salvando Planos - ID:', cid, 'Saude:', pSaude, 'Mat:', matSaude);
         
         if (pSaude) {
             google.script.run
               .withSuccessHandler(function(res) {
                   console.log('Resposta Saude:', res);
                   salvarOdonto(cid, pOdonto);
               })
               .withFailureHandler(function(err) {
                   console.error('Erro Saude:', err);
                   mostrarMensagem('❌ Erro ao salvar plano de saúde: ' + err.message, 'error');
               })
               .salvarPlanoColaboradorAPI(cid, pSaude, matSaude);
         } else {
             salvarOdonto(cid, pOdonto);
         }
      }
      
      function salvarOdonto(cid, pOdonto) {
          if (pOdonto) {
              google.script.run.withSuccessHandler(finalizarSalvar)
              .salvarPlanoColaboradorAPI(cid, pOdonto, null);
          } else {
              finalizarSalvar();
          }
      }
      
      function finalizarSalvar() {
          mostrarMensagem('✅ Sucesso! Todas as alterações foram salvas.', 'success');
          setTimeout(function() { google.script.host.close(); }, 2000);
      }
      
      function mostrarMensagem(texto, tipo) {
        var div = document.getElementById('mensagem');
        div.style.display = 'block';
        div.innerHTML = texto;
        div.style.background = (tipo === 'success') ? '#d4edda' : (tipo === 'error' ? '#f8d7da' : '#d1ecf1');
        div.style.color = (tipo === 'success') ? '#155724' : (tipo === 'error' ? '#721c24' : '#0c5460');
        div.style.border = '1px solid ' + ((tipo === 'success') ? '#c3e6cb' : (tipo === 'error' ? '#f5c6cb' : '#bee5eb'));
      }
      
      // FIX EDGE: Planos pre-carregados pelo servidor — sem google.script.run.
      // Fonte: <script type="application/json" id="srvplanos"> injetado pelo GAS.
      // Fallback para google.script.run caso o elemento nao exista (compatibilidade).
      document.addEventListener('DOMContentLoaded', function() {
          var el = document.getElementById('srvplanos');
          if (el) {
              var res = JSON.parse(el.textContent);
              console.log('✅ Planos carregados pelo servidor (sem google.script.run):', res);
              if (res && res.success) {
                  popularSelects(res.data);
                  carregarPlanosDoUsuario();
              } else {
                  console.warn('Servidor retornou erro; tentando via google.script.run como fallback...');
                  _carregarPlanosFallback();
              }
          } else {
              _carregarPlanosFallback();
          }
      });

      // Fallback: usa google.script.run se a pre-carga falhar
      function _carregarPlanosFallback() {
          console.log('🔵 Iniciando fallback google.script.run para planos...');
          var _t = setTimeout(function() {
              var s = document.getElementById('plano_saude');
              var o = document.getElementById('plano_odonto');
              if (s) s.innerHTML = '<option value="">⚠️ Erro ao carregar. Tente reabrir.</option>';
              if (o) o.innerHTML = '<option value="">⚠️ Erro ao carregar. Tente reabrir.</option>';
          }, 12000);
          google.script.run
              .withSuccessHandler(function(res) {
                  clearTimeout(_t);
                  if (res && res.success) { popularSelects(res.data); carregarPlanosDoUsuario(); }
                  else { console.error('Fallback falhou:', res); }
              })
              .withFailureHandler(function(err) {
                  clearTimeout(_t);
                  console.error('🔴 Falha fallback (listarPlanosAPI):', err);
                  var s = document.getElementById('plano_saude');
                  var o = document.getElementById('plano_odonto');
                  if (s) s.innerHTML = '<option value="">❌ ' + (err.message||err) + '</option>';
                  if (o) o.innerHTML = '<option value="">❌ Tente reabrir o modal</option>';
              })
              .listarPlanosAPI();
      }

      function popularSelects(planos) {
          var selSaude = document.getElementById('plano_saude');
          var selOdonto = document.getElementById('plano_odonto');
          
          selSaude.innerHTML = '<option value="">Sem Plano</option>';
          selOdonto.innerHTML = '<option value="">Sem Plano</option>';
          
          planos.forEach(function(p) {
              var opt = document.createElement('option');
              opt.value = p.id;
              var preco = (p.precos && p.precos.length > 0) ? p.precos[0].valor : '?';
              opt.textContent = p.nome + ' (R$ ' + preco + ')';
              
              if (p.tipo === 'SAUDE') selSaude.appendChild(opt);
              else if (p.tipo === 'ODONTO') selOdonto.appendChild(opt);
          });
      }

      // FIX B1c: Adicionado withFailureHandler para prevenir falha silenciosa no Edge
      function carregarPlanosDoUsuario() {
          var id = document.getElementById('colaborador_id').value;
          console.log('Carregando planos para colaborador ID:', id);

          var el = document.getElementById('srvplanosuser');
          if (el) {
              var res = JSON.parse(el.textContent);
              console.log('✅ Planos do Usuario carregados pelo servidor:', res);
              _processarPlanosUsuario(res);
          } else {
              _carregarPlanosUsuarioFallback(id);
          }
          carregarDependentesUI(id);
      }

      function _processarPlanosUsuario(res) {
          if (res && res.success && res.data) {
              res.data.forEach(function(pu) {
                  if (!pu.plano) return;
                  var tipo = (pu.plano.tipo || '').toUpperCase();
                  if (tipo === 'SAUDE') {
                      var elSaude = document.getElementById('plano_saude');
                      elSaude.value = String(pu.plano_id);
                      var mat = pu.matricula || pu.carteirinha || pu.numero_carteirinha;
                      if (mat) document.getElementById('matricula_saude').value = mat;
                  }
                  if (tipo === 'ODONTO') {
                      var elOdonto = document.getElementById('plano_odonto');
                      elOdonto.value = pu.plano_id;
                      if (elOdonto.value != pu.plano_id) elOdonto.value = String(pu.plano_id);
                  }
              });
          } else {
              console.warn('Nenhum plano (usuario) retornado ou erro:', res);
          }
      }

      function _carregarPlanosUsuarioFallback(id) {
          var _t = setTimeout(function() { console.warn('⏰ Timeout usuario planos (12s).'); }, 12000);
          google.script.run
              .withSuccessHandler(function(res) { clearTimeout(_t); _processarPlanosUsuario(res); })
              .withFailureHandler(function(err) { clearTimeout(_t); console.error('🔴 Falha Edge API planosUsu:', err); })
              .buscarPlanosColaboradorAPI(id);
      }

      // FIX B1b: Alterado para carregar via server-script tag para Edge
      function carregarDependentesUI(colabId) {
          var div = document.getElementById('lista_dependentes');
          div.innerHTML = '🔄 Carregando...';

          var el = document.getElementById('srvdeps');
          if (el) {
              var res = JSON.parse(el.textContent);
              console.log('✅ Dependentes carregados pelo servidor:', res);
              if (res && res.success) renderizarDependentes(res.data);
              else div.innerHTML = '❌ Erro dependentes: ' + (res ? res.error : 'invalido');
              
              // OBRIGATORIO: Se for chamado novamente (ex: apos adicioar dep), bate na API
              el.parentNode.removeChild(el);
          } else {
              _carregarDependentesFallback(colabId);
          }
      }

      function _carregarDependentesFallback(colabId) {
          var div = document.getElementById('lista_dependentes');
          var _t = setTimeout(function() { div.innerHTML = '<i style="color:#d93025;">⚠️ Timeout (12s). Tente reabrir.</i>'; }, 12000);
          google.script.run
              .withSuccessHandler(function(res) {
                  clearTimeout(_t);
                  if (res && res.success) renderizarDependentes(res.data);
                  else div.innerHTML = '❌ Erro dependentes: ' + (res ? res.error : 'invalido');
              })
              .withFailureHandler(function(err) {
                  clearTimeout(_t);
                  console.error('🔴 Falha dependentes Edge:', err);
                  div.innerHTML = '❌ Falha comunicacao (F12).';
              })
              .listarDependentesAPI(colabId);
      }
      // ... (previous functions) ...

      function renderizarDependentes(lista) {
          var div = document.getElementById('lista_dependentes');
          if (!lista || lista.length === 0) {
              div.innerHTML = '<i>Nenhum dependente cadastrado.</i>';
              return;
          }
          var html = '<table style="width:100%; border-collapse: collapse;">';
          lista.forEach(function(d) {
              // Prepare params safely for onclick
              var dadosSafe = JSON.stringify(d).replace(/"/g, '&quot;');
              
              html += '<tr style="border-bottom: 1px solid #eee;">' +
                      '<td style="padding: 8px;">' + d.nome + '</td>' +
                      '<td style="padding: 8px; color: #666;">' + d.parentesco + '</td>' +
                      '<td style="text-align:right; padding: 8px;">' +
                      '<span style="cursor:pointer; color:#1a73e8; font-weight:bold; margin-right:10px;" onclick="prepararEdicaoDependente(' + dadosSafe + ')">✏️ Editar</span>' +
                      '<span style="cursor:pointer; color:#d93025; font-weight:bold;" onclick="removerDependenteUI(\\'' + d.id + '\\')">🗑️ Excluir</span>' +
                      '</td></tr>';
          });
          html += '</table>';
          div.innerHTML = html;
      }

      function prepararEdicaoDependente(d) {
          document.getElementById('dep_id').value = d.id;
          document.getElementById('dep_nome').value = d.nome;
          document.getElementById('dep_cpf').value = d.cpf || '';
          document.getElementById('dep_cpf').disabled = true; // CPF nao editavel
          document.getElementById('dep_nasc').value = d.data_nasc ? d.data_nasc.split('T')[0] : '';
          document.getElementById('dep_parentesco').value = d.parentesco;
          document.getElementById('dep_matricula').value = d.matricula || '';
          
          document.getElementById('titulo_dep').innerText = '✏️ Editar Dependente:';
          document.getElementById('btn_salvar_dep').textContent = 'Salvar Alteração';
          document.getElementById('btn_cancelar_dep').style.display = 'block';
          
          // Scroll to form
          document.getElementById('titulo_dep').scrollIntoView({ behavior: 'smooth' });
      }

      function cancelarEdicaoDependente() {
          document.getElementById('dep_id').value = '';
          document.getElementById('dep_nome').value = '';
          document.getElementById('dep_cpf').value = '';
          document.getElementById('dep_cpf').disabled = false;
          document.getElementById('dep_nasc').value = '';
          document.getElementById('dep_parentesco').value = '';
          document.getElementById('dep_matricula').value = '';
          
          document.getElementById('titulo_dep').innerText = '➕ Adicionar Dependente:';
          document.getElementById('btn_salvar_dep').textContent = 'Adicionar';
          document.getElementById('btn_cancelar_dep').style.display = 'none';
      }

      function adicionarDependenteUI(btn) {
          var id = document.getElementById('colaborador_id').value;
          var depId = document.getElementById('dep_id').value;
          
          var nome = document.getElementById('dep_nome').value;
          var cpf = document.getElementById('dep_cpf').value;
          var nasc = document.getElementById('dep_nasc').value;
          var parentesco = document.getElementById('dep_parentesco').value;
          var matricula = document.getElementById('dep_matricula').value;

          if (!nome || !nasc || !parentesco) {
              alert('Preencha Nome, Data de Nascimento e Parentesco.');
              return;
          }

          btn.disabled = true;
          btn.textContent = '⏳ ...';

          var dadosDep = { nome: nome, cpf: cpf, data_nasc: nasc, parentesco: parentesco, matricula: matricula };

          if (depId) {
              // UPDATE
              google.script.run.withSuccessHandler(function(res) {
                  console.log('CLIENTE: Resposta Update:', res); // Log no browser
                  btn.disabled = false;
                  btn.textContent = 'Salvar Alteração';
                  if (res.success) {
                      cancelarEdicaoDependente(); // Reset form
                      carregarDependentesUI(id);
                  } else {
                      // Mostra o erro COMPLETO no alert
                      alert('Erro ao atualizar (Detalhes): ' + (typeof res.error === 'object' ? JSON.stringify(res.error) : res.error));
                  }
              }).atualizarDependenteAPI(depId, dadosDep);
          } else {
              // CREATE
              google.script.run.withSuccessHandler(function(res) {
                  btn.disabled = false;
                  btn.textContent = 'Adicionar';
                  if (res.success) {
                      cancelarEdicaoDependente(); // Reset form
                      carregarDependentesUI(id);
                  } else {
                      alert('Erro ao adicionar: ' + res.error);
                  }
              }).adicionarDependenteAPI(id, dadosDep);
          }
      }

      // FIX B1d: Adicionado withFailureHandler
      function removerDependenteUI(depId) {
          if(!confirm('Tem certeza que deseja excluir este dependente?')) return;
          var id = document.getElementById('colaborador_id').value;
          google.script.run
              .withSuccessHandler(function(res) {
                  if (res && res.success === false) {
                      alert('❌ Erro ao remover dependente: ' + res.error);
                  }
                  carregarDependentesUI(id);
              })
              .withFailureHandler(function(err) {
                  console.error('🔴 Falha ao remover dependente (Edge):', err);
                  alert('❌ Falha de comunicação ao excluir. Tente novamente.');
              })
              .removerDependenteAPI(depId);
      }
    </script>
  `).setWidth(600).setHeight(750);

    SpreadsheetApp.getUi().showModalDialog(html, '✏️ Editar Colaborador');
}


// FUNÇÕES DE API RESTAURADAS E SEGURAS
// =====================================================

function atualizarColaboradorAPI(cpf, dados) {
    try {
        Logger.log('ATUALIZANDO COLABORADOR ' + cpf);
        Logger.log('PAYLOAD: ' + JSON.stringify(dados));

        var url = CONFIG.API_URL + '/colaboradores/' + cpf;
        var options = {
            method: 'put',
            contentType: 'application/json',
            payload: JSON.stringify(dados),
            muteHttpExceptions: true
        };
        var response = UrlFetchApp.fetch(url, options);
        var res = JSON.parse(response.getContentText());

        Logger.log('RESPOSTA ATUALIZACAO: ' + JSON.stringify(res));

        return res;
    } catch (e) {
        return { success: false, error: e.message };
    }
}

// =====================================================
// HELPER HTML SECURITY
// =====================================================
function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

function listarPlanosAPI() {
    try {
        var url = CONFIG.API_URL + '/planos';
        var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
        var status = response.getResponseCode();
        if (status !== 200) return { success: false, error: 'HTTP ' + status };
        return JSON.parse(response.getContentText());
    } catch (e) {
        Logger.log('listarPlanosAPI ERR: ' + e.toString());
        return { success: false, error: e.message };
    }
}

function buscarPlanosColaboradorAPI(id) {
    try {
        var url = CONFIG.API_URL + '/colaboradores/' + id + '/planos';
        var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
        var status = response.getResponseCode();
        if (status !== 200) return { success: false, data: [], error: 'HTTP ' + status };
        var res = JSON.parse(response.getContentText());
        Logger.log('BUSCA PLANOS (' + id + '): ' + JSON.stringify(res).substring(0, 200));
        if (res.success && !res.data) {
            res.data = res.planos || res.lista || [];
        }
        return res;
    } catch (e) {
        Logger.log('buscarPlanosColaboradorAPI ERR: ' + e.toString());
        return { success: false, data: [], error: e.message };
    }
}

function salvarPlanoColaboradorAPI(id, planoId, matricula) {
    Logger.log('=== SALVANDO PLANO ===');
    Logger.log('Colaborador ID: ' + id);
    Logger.log('Plano ID: ' + planoId);
    Logger.log('Matricula recebida: ' + matricula);

    try {
        var url = CONFIG.API_URL + '/colaboradores/' + id + '/planos';

        // Payload robusto: envia matricula em múltiplos campos possíveis
        var payload = {
            plano_id: planoId,
            matricula: matricula || null,
            carteirinha: matricula || null, // Caso o backend espere este nome
            numero_carteirinha: matricula || null // Outra possibilidade comum
        };

        Logger.log('Payload enviado: ' + JSON.stringify(payload));

        var options = {
            method: 'post',
            contentType: 'application/json',
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
        };

        var response = UrlFetchApp.fetch(url, options);
        var content = response.getContentText();
        Logger.log('Resposta da API: ' + content);

        return JSON.parse(content);
    } catch (e) {
        Logger.log('❌ ERRO AO SALVAR PLANO: ' + e.message);
        return { success: false, error: e.message };
    }
}


function listarDependentesAPI(colaboradorId) {
    try {
        var url = CONFIG.API_URL + '/colaboradores/' + colaboradorId + '/dependentes';
        var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
        var status = response.getResponseCode();
        if (status !== 200) return { success: false, data: [], error: 'HTTP ' + status };
        var res = JSON.parse(response.getContentText());
        if (res.success && !res.data) {
            res.data = res.dependentes || res.lista || [];
        }
        return res;
    } catch (e) {
        Logger.log('listarDependentesAPI ERR: ' + e.toString());
        return { success: false, data: [], error: e.message };
    }
}

function adicionarDependenteAPI(colaboradorId, dependente) {
    try {
        // FIX: Rota correta aninhada
        var url = CONFIG.API_URL + '/colaboradores/' + colaboradorId + '/dependentes';

        // Payload não precisa do colaborador_id pois vai na URL, mas vamos enviar limpo
        var payload = dependente;

        var options = {
            method: 'post',
            contentType: 'application/json',
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
        };
        var response = UrlFetchApp.fetch(url, options);
        return JSON.parse(response.getContentText());
    } catch (e) {
        return { success: false, error: e.message };
    }
}

function atualizarDependenteAPI(id, dependente) {
    var raw = '';
    var url = '';
    try {
        url = CONFIG.API_URL + '/dependentes/' + id;

        // Remove CPF do payload para garantir que nao vá
        var payloadFinal = JSON.parse(JSON.stringify(dependente));
        delete payloadFinal.cpf;

        console.log('PUT Dependente URL (V2):', url);
        console.log('Payload V2:', JSON.stringify(payloadFinal));

        var options = {
            method: 'put',
            contentType: 'application/json',
            payload: JSON.stringify(payloadFinal),
            muteHttpExceptions: true
        };
        var response = UrlFetchApp.fetch(url, options);
        raw = response.getContentText();
        console.log('Response Raw:', raw);

        // Se retornar HTML (erro do express/vercel), trate
        if (raw.indexOf('<') === 0) {
            return { success: false, error: 'Erro HTML retornado: ' + raw.substring(0, 50) + '...' };
        }

        return JSON.parse(raw);
    } catch (e) {
        console.error('Erro atualizarDependenteAPI:', e);
        return { success: false, error: 'Exc: ' + e.message + ' | Raw: ' + raw };
    }
}

function removerDependenteAPI(id) {
    try {
        var url = CONFIG.API_URL + '/dependentes/' + id;
        var options = { method: 'delete', muteHttpExceptions: true };
        var response = UrlFetchApp.fetch(url, options);
        return JSON.parse(response.getContentText());
    } catch (e) {
        return { success: false, error: e.message };
    }
}

function formatarDataInteligente(data) {
    if (!data) return "";
    var dataObj = new Date(data);
    if (isNaN(dataObj.getTime())) return data;
    return Utilities.formatDate(dataObj, Session.getScriptTimeZone(), "dd/MM/yyyy");
}

function onEdit(e) {
    // FAST EXIT: Se nao for na aba Colaboradores ou nao for Coluna 1 (A)
    if (!e) return; // Execucao manual

    const sheet = e.source.getActiveSheet();
    if (sheet.getName() !== CONFIG.ABAS.COLABORADORES) return;

    const range = e.range;
    const row = range.getRow();
    const col = range.getColumn();

    // LOGICA CHECKBOX "SELECIONAR TUDO"
    // Funciona para o checkbox da linha 3 (Filtro) ou linha 5 (Cabecalho)
    if (col === 1 && (row === 3 || row === 5)) {
        const isChecked = range.getValue();

        // Valida se eh booleano para evitar disparos falsos
        if (typeof isChecked !== 'boolean' && isChecked !== 'TRUE' && isChecked !== 'FALSE') return;

        const lastRow = sheet.getLastRow();
        if (lastRow < 6) return; // Sem dados

        // Aplica a todos os checkboxes de dados (A6 em diante)
        // Otimizado: setValue unico para o range inteiro
        const numRows = lastRow - 5;
        sheet.getRange(6, 1, numRows, 1).setValue(isChecked);

        // Feedback visual opcional (Toast)
        e.source.toast(isChecked ? '✅ Todos selecionados' : '⬜ Seleção limpa');
    }
}



// =====================================================
// HISTÓRICO DE VERSÕES (RESTAURADO)
// =====================================================
// FUNCIONALIDADES DE HISTÓRICO (RESTAURADO)
// =====================================================

// 1. API WRAPPERS
// FIX B2: Adicionado muteHttpExceptions + validação de status HTTP
// Sem muteHttpExceptions, o Edge (com headers diferentes) acionava PERMISSION_DENIED
function listarHistoricoAPI(tipo) {
    const endpoint = CONFIG.API_URL + '/relatorios/historico';
    const payload = { tipo: tipo || null, limit: 20 };

    const options = {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true  // FIX: previne ScriptError PERMISSION_DENIED
    };

    try {
        const response = UrlFetchApp.fetch(endpoint, options);
        const statusCode = response.getResponseCode();
        const body = response.getContentText();

        Logger.log('[Historico] HTTP ' + statusCode);
        Logger.log('[Historico] Body: ' + body.substring(0, 300));

        if (statusCode !== 200) {
            return { success: false, error: 'HTTP ' + statusCode + ': ' + body.substring(0, 150) };
        }

        return JSON.parse(body);
    } catch (e) {
        Logger.log('[Historico] Exception: ' + e.toString());
        return { success: false, error: e.message };
    }
}

// FIX B3: Adicionado muteHttpExceptions para evitar PERMISSION_DENIED no Edge
function obterHistoricoAPI(id) {
    const endpoint = CONFIG.API_URL + '/relatorios/historico/' + id;

    try {
        const response = UrlFetchApp.fetch(endpoint, { muteHttpExceptions: true });
        const statusCode = response.getResponseCode();
        const body = response.getContentText();

        Logger.log('[ObterHistorico] HTTP ' + statusCode + ' | ID: ' + id);

        if (statusCode !== 200) {
            return { success: false, error: 'HTTP ' + statusCode + ': ' + body.substring(0, 100) };
        }

        return JSON.parse(body);
    } catch (e) {
        Logger.log('[ObterHistorico] Exception: ' + e.toString());
        return { success: false, error: e.message };
    }
}

// 2. MODAL UI
// ABORDAGEM DEFINITIVA: Gera o HTML da tabela 100% no servidor (GAS).
// ZERO injecao de JSON. ZERO google.script.run no carregamento.
// Imune a qualquer caracter especial nos dados do snapshot.
function listarHistoricoModal() {

    // Busca dados no servidor (codigo GAS, nao cliente)
    var resultado = listarHistoricoAPI(null);

    // Gera HTML da tabela diretamente no GAS — sem intermediacao de JSON
    var contentHtml = '';
    if (!resultado || !resultado.success) {
        var errMsg = escapeHtml(resultado ? (resultado.error || 'Erro desconhecido') : 'Servidor nao respondeu');
        contentHtml = '<div style="color:#d93025;background:#fce8e6;padding:14px;border-radius:6px;border-left:4px solid #d93025;">'
            + '<strong>❌ Erro ao carregar histórico:</strong><br>' + errMsg + '</div>';
    } else {
        var lista = resultado.historico;
        if (!lista || lista.length === 0) {
            contentHtml = '<div style="color:#666;font-style:italic;padding:20px;text-align:center;">📭 Nenhum snapshot encontrado.<br>Gere relatórios para criar snapshots automaticamente.</div>';
        } else {
            contentHtml = '<table style="width:100%;border-collapse:collapse;background:white;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-radius:6px;overflow:hidden;">'
                + '<thead><tr style="background:#f1f3f4;">'
                + '<th style="padding:11px 14px;text-align:left;font-size:13px;font-weight:600;color:#5f6368;border-bottom:1px solid #eee;">Data/Hora</th>'
                + '<th style="padding:11px 14px;text-align:left;font-size:13px;font-weight:600;color:#5f6368;border-bottom:1px solid #eee;">Tipo</th>'
                + '<th style="padding:11px 14px;text-align:left;font-size:13px;font-weight:600;color:#5f6368;border-bottom:1px solid #eee;">Referência</th>'
                + '<th style="padding:11px 14px;text-align:left;font-size:13px;font-weight:600;color:#5f6368;border-bottom:1px solid #eee;">Ação</th>'
                + '</tr></thead><tbody>';

            for (var i = 0; i < lista.length; i++) {
                var item = lista[i];
                var createdAt = item.created_at || '';
                var dataFmt = '';
                try {
                    dataFmt = new Date(createdAt).toLocaleString('pt-BR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                    });
                } catch (_) { dataFmt = String(createdAt).substring(0, 16); }

                var tipo = String(item.tipo || 'desconhecido').toLowerCase();
                var tipoLabel = tipo.toUpperCase();

                var badgeColors = {
                    'folha': 'background:#e8f0fe;color:#1967d2',
                    'beneficios': 'background:#e6f4ea;color:#137333',
                    'variavel': 'background:#fce8e6;color:#c5221f',
                    'apontamentos': 'background:#fef7e0;color:#b06000',
                    'seguros': 'background:#f3e8fd;color:#7527a1'
                };
                var badgeStyle = badgeColors[tipo] || 'background:#e8eaed;color:#3c4043';

                var ref = '-';
                if (item.mes_referencia && item.ano_referencia) {
                    ref = String(item.mes_referencia).length === 1
                        ? '0' + item.mes_referencia + '/' + item.ano_referencia
                        : item.mes_referencia + '/' + item.ano_referencia;
                }

                // ID é UUID (alfanumérico + hífens) — escapeHtml para garantia
                var idSafe = escapeHtml(String(item.id));

                contentHtml += '<tr>'
                    + '<td style="padding:11px 14px;font-size:13px;border-bottom:1px solid #eee;">' + escapeHtml(dataFmt) + '</td>'
                    + '<td style="padding:11px 14px;font-size:13px;border-bottom:1px solid #eee;">'
                    + '<span style="padding:3px 8px;border-radius:12px;font-size:11px;font-weight:700;' + badgeStyle + '">' + escapeHtml(tipoLabel) + '</span>'
                    + '</td>'
                    + '<td style="padding:11px 14px;font-size:13px;border-bottom:1px solid #eee;">' + escapeHtml(ref) + '</td>'
                    + '<td style="padding:11px 14px;font-size:13px;border-bottom:1px solid #eee;">'
                    + '<button onclick="restaurar(&quot;' + idSafe + '&quot;)" style="background:#1a73e8;color:white;border:none;padding:6px 13px;border-radius:4px;cursor:pointer;font-size:12px;">📂 Restaurar</button>'
                    + '</td>'
                    + '</tr>';
            }
            contentHtml += '</tbody></table>';
            contentHtml += '<p style="color:#999;font-size:11px;margin-top:10px;">✅ ' + lista.length + ' snapshot(s) — gerado pelo servidor | Chrome e Edge compatíveis</p>';
        }
    }

    // HTML FINAL: nenhuma variavel de dados injetada via script tag
    // Apenas o HTML da tabela (ja escapado) e a funcao restaurar (recebe UUID seguro via onclick)
    var htmlStr = '<!DOCTYPE html><html><head><meta charset="UTF-8">'
        + '<style>body{font-family:\'Segoe UI\',Roboto,Arial,sans-serif;padding:20px;background:#f8f9fa;margin:0}'
        + 'h2{color:#1a73e8;margin-top:0;font-size:18px}'
        + 'p.sub{color:#5f6368;margin-top:0;font-size:13px}'
        + '</style></head><body>'
        + '<h2>📜 Histórico de Versões</h2>'
        + '<p class="sub">Visualize e restaure snapshots gerados pelo sistema.</p>'
        + contentHtml
        + '<script>'
        // Funcao restaurar: recebe UUID (sem caracteres perigosos), chama GAS server action
        + 'function restaurar(id) {'
        + '  if(!confirm("⚠️ Restaurar este snapshot irá criar uma nova aba na planilha. Continuar?")) return;'
        + '  var btns = document.querySelectorAll("button");'
        + '  btns.forEach(function(b){ b.disabled=true; });'
        + '  google.script.run'
        + '    .withSuccessHandler(function(res) {'
        + '      if(res && res.success === false) {'
        + '        alert("❌ Erro ao restaurar: " + res.error);'
        + '        btns.forEach(function(b){ b.disabled=false; });'
        + '      } else {'
        + '        alert("✅ Snapshot restaurado! Verifique a nova aba criada na planilha.");'
        + '        google.script.host.close();'
        + '      }'
        + '    })'
        + '    .withFailureHandler(function(err) {'
        + '      alert("❌ Falha ao restaurar: " + (err && err.message ? err.message : String(err)));'
        + '      btns.forEach(function(b){ b.disabled=false; });'
        + '    })'
        + '    .carregarSnapshotParaAba(id);'
        + '}'
        + '<\/script>'
        + '</body></html>';

    var html = HtmlService.createHtmlOutput(htmlStr).setWidth(720).setHeight(520);
    SpreadsheetApp.getUi().showModalDialog(html, '📜 Histórico de Versões');
}

// HELPERS CRÍTICOS (CORREÇÃO DE SNAPSHOTS)
// =====================================================

function mapearColunasDoHeader(headers, mapeamentoPossivel) {
    const map = {};
    const headersNorm = headers.map(h => String(h).toUpperCase().trim());

    for (const [campoFinal, variacoes] of Object.entries(mapeamentoPossivel)) {
        let colIndex = -1;
        // Tenta encontrar alguma variação nos headers
        for (const v of variacoes) {
            const vNorm = String(v).toUpperCase().trim();
            colIndex = headersNorm.findIndex(h => h === vNorm || h.includes(vNorm));
            if (colIndex > -1) break;
        }
        if (colIndex > -1) {
            map[campoFinal] = colIndex;
        }
    }
    return map;
}

function normalizarDadosParaEnvio(dados, tipo) {
    return dados.map(item => {
        // Clone raso
        const normalizado = JSON.parse(JSON.stringify(item));

        // Normalização de Nomes
        if (normalizado.nome_colaborador && !normalizado.nome) normalizado.nome = normalizado.nome_colaborador;
        if (normalizado.nome_completo && !normalizado.nome) normalizado.nome = normalizado.nome_completo;

        // Limpeza de campos internos de snapshot
        delete normalizado.dados_snapshot;
        delete normalizado.relatorio_id;
        delete normalizado.created_at;
        delete normalizado.id; // ID do snapshot não deve ir como ID do registro novo

        // Garantias por Tipo
        if (tipo === 'folha') {
            normalizado.mes_referencia = normalizado.mes_referencia || normalizado.mes || 0;
            normalizado.ano_referencia = normalizado.ano_referencia || normalizado.ano || 0;
        }

        return normalizado;
    });
}

// 3. LOGICA DE CARREGAR SNAPSHOT PARA ABA (REFATORADA V4)
// 3. LOGICA DE CARREGAR SNAPSHOT PARA ABA (REFATORADA V5 - DEDUPLICADA)
function carregarSnapshotParaAba(id) {
    const res = obterHistoricoAPI(id);
    if (!res.success) throw new Error(res.error);

    const header = res.relatorio;
    const itens = res.itens;
    const tipo = header.tipo;

    // METADADOS CRÍTICOS
    const metadados = {
        snapshot_id: header.id,
        data_geracao: header.created_at,
        mes_referencia: header.mes_referencia,
        ano_referencia: header.ano_referencia,
        tipo: tipo
    };

    // ROTEAMENTO POR TIPO
    if (tipo === 'folha' || tipo === 'folha_pagamento') {
        restaurarSnapshotFolha(itens, metadados);
    } else if (tipo === 'beneficios') {
        restaurarSnapshotBeneficios(itens, metadados);
    } else if (tipo === 'variavel') {
        restaurarSnapshotVariavel(itens, metadados);
    } else if (tipo === 'apontamentos') {
        restaurarSnapshotApontamentos(itens, metadados);
    } else {
        throw new Error('Tipo de snapshot não suportado: ' + tipo);
    }

    return { success: true };
}

// === RESTAURADORES ESPECÍFICOS ===

function restaurarSnapshotBeneficios(itens, metadados) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const dataStr = new Date(metadados.data_geracao).toISOString().split('T')[0];
    const nomeAba = `V.${dataStr} - Benefícios ${metadados.mes_referencia}/${metadados.ano_referencia}`;

    // Criar ou limpar aba
    let sheet = ss.getSheetByName(nomeAba);
    if (sheet) sheet.clear();
    else sheet = ss.insertSheet(nomeAba);

    // === CORESDO TEMPLATE ORIGINAL ===
    const COR_AMARELO = '#f1c232';
    const COR_VERDE_FIXO = '#d9ead3';

    // === RECONSTRUIR CABEÇALHO DE PARÂMETROS ===

    // TRANSPORTE (B2:C6)
    sheet.getRange('B2:C2').merge().setValue('Transporte')
        .setBackground(COR_AMARELO).setFontWeight('bold').setHorizontalAlignment('center').setBorder(true, true, true, true, true, true);
    sheet.getRange('B3').setValue('VALOR DIA').setFontWeight('bold').setBorder(true, true, true, true, true, true);
    sheet.getRange('C3').setValue(14.35).setNumberFormat('R$ #,##0.00').setBorder(true, true, true, true, true, true);
    sheet.getRange('B4').setValue('DIAS CORRIDOS NO MÊS').setFontWeight('bold').setBorder(true, true, true, true, true, true);
    sheet.getRange('C4').setValue(20).setBorder(true, true, true, true, true, true);
    sheet.getRange('B5').setValue('VALOR TOTAL').setFontWeight('bold').setBorder(true, true, true, true, true, true);
    sheet.getRange('C5').setFormula('=C3*C4').setNumberFormat('R$ #,##0.00').setFontWeight('bold').setBorder(true, true, true, true, true, true);
    sheet.getRange('B6').setValue('VALOR FIXO').setFontWeight('bold').setBackground(COR_VERDE_FIXO).setBorder(true, true, true, true, true, true);
    sheet.getRange('C6').setValue(330.00).setNumberFormat('R$ #,##0.00').setBackground(COR_VERDE_FIXO).setBorder(true, true, true, true, true, true);

    // ALIMENTAÇÃO (B7:C10)
    sheet.getRange('B7:C7').merge().setValue('Alimentação')
        .setBackground(COR_AMARELO).setFontWeight('bold').setHorizontalAlignment('center').setBorder(true, true, true, true, true, true);
    sheet.getRange('B8').setValue('VALOR DIA').setFontWeight('bold').setBorder(true, true, true, true, true, true);
    sheet.getRange('C8').setValue(35.00).setNumberFormat('R$ #,##0.00').setBorder(true, true, true, true, true, true);
    sheet.getRange('B9').setValue('DIAS ÚTEIS NO MÊS').setFontWeight('bold').setBorder(true, true, true, true, true, true);
    sheet.getRange('C9').setValue(20).setBorder(true, true, true, true, true, true);
    sheet.getRange('B10').setValue('VALOR TOTAL').setFontWeight('bold').setBorder(true, true, true, true, true, true);
    sheet.getRange('C10').setFormula('=C8*C9').setNumberFormat('R$ #,##0.00').setFontWeight('bold').setBorder(true, true, true, true, true, true);

    // TOTALIZADORES (E9:F11)
    sheet.getRange('E9:F9').merge().setValue('Total Beneficios').setHorizontalAlignment('center');
    sheet.getRange('E10:F10').merge().setFormula('=E11+F11').setNumberFormat('R$ #,##0.00').setFontWeight('bold').setFontSize(12).setHorizontalAlignment('center');
    sheet.getRange('E11').setFormula('=SUM(E13:E)').setNumberFormat('R$ #,##0.00').setFontWeight('bold').setHorizontalAlignment('center');
    sheet.getRange('F11').setFormula('=SUM(F13:F)').setNumberFormat('R$ #,##0.00').setFontWeight('bold').setHorizontalAlignment('center');

    // HEADERS COLS (E12, F12)
    sheet.getRange('E12').setValue('Alimentação').setFontWeight('bold').setBackground(COR_AMARELO).setBorder(true, true, true, true, true, true).setHorizontalAlignment('center');
    sheet.getRange('F12').setValue('Transporte').setFontWeight('bold').setBackground(COR_AMARELO).setBorder(true, true, true, true, true, true).setHorizontalAlignment('center');

    // === CABEÇALHO DA TABELA (Linha 12) ===
    const headers = ['#', 'NOME', 'Cidade', 'FÉRIAS', 'Alimentação', 'Transporte'];
    sheet.getRange(12, 1, 1, headers.length).setValues([headers])
        .setFontWeight('bold')
        .setBorder(true, true, true, true, true, true)
        .setHorizontalAlignment('center');

    sheet.getRange(12, 4, 1, 3).setBackground(COR_AMARELO); // Cols D, E, F
    sheet.getRange(12, 1, 1, 3).setBackground('#f3f3f3'); // Cols A, B, C

    // === PROCESSAMENTO E DEDUPLICAÇÃO ===
    const mapaCPF = new Map();

    // MAPA DE CIDADES (Lookup na aba Colaboradores para garantir preenchimento) (CORREÇÃO DE CIDADE VAZIA)
    const sheetColab = ss.getSheetByName(CONFIG.ABAS.COLABORADORES);
    const dadosColab = sheetColab ? sheetColab.getDataRange().getValues() : [];
    const mapCidades = {};
    if (dadosColab.length > 5) {
        for (let i = 5; i < dadosColab.length; i++) {
            const cpfC = String(dadosColab[i][1]).replace(/\D/g, '');
            // Coluna 5 era Depto. Agora Cidade é Coluna 6 (Index 5)
            // Se o usuário ainda não atualizou a aba Colaboradores, isso pode pegar Salário (se for a layout antigo).
            // Vamos tentar detectar header? Não, assumir que user vai atualizar.
            const cidadeC = dadosColab[i][5];
            if (cpfC) mapCidades[cpfC] = cidadeC;
        }
    }

    itens.forEach(item => {
        const d = item.dados_snapshot;
        const cpf = d.cpf ? String(d.cpf).replace(/\D/g, '') : null;
        if (!cpf) return;

        if (!mapaCPF.has(cpf)) {
            // Tenta pegar cidade do snapshot, se falhar pega do cadastro atual
            let cidade = d.cidade || d.local_trabalho || '-';
            if ((!cidade || cidade === '-') && mapCidades[cpf]) {
                cidade = mapCidades[cpf];
            }

            mapaCPF.set(cpf, {
                cpf: cpf,
                nome: d.nome || d.nome_colaborador || d.nome_completo || 'SEM NOME',
                cidade: cidade,
                ferias: d.ferias || '',
                valAlim: 0,
                valTransp: 0
            });
        }

        const r = mapaCPF.get(cpf);

        // Atualizar Nome/Cidade se o registro atual tiver dados melhores
        if (r.nome === 'SEM NOME' && (d.nome || d.nome_colaborador)) r.nome = d.nome || d.nome_colaborador;
        if ((!r.cidade || r.cidade === '-') && (d.cidade || d.local_trabalho)) r.cidade = d.cidade || d.local_trabalho;

        // Somar Valores (Tratar Lista e Matriz)
        let valor = parseFloat(d.valor) || 0;
        let tipo = (d.tipo_beneficio || '').toLowerCase(); // Lista (Snapshot V1 e V2)

        // Se o snapshot for antigo/flat (Matriz - Ex: restaurado de planilha antiga)
        if (d.vale_alimentacao) { r.valAlim = parseFloat(d.vale_alimentacao); }
        if (d.vale_transporte) { r.valTransp = parseFloat(d.vale_transporte); }

        // Se for lista (rows separados - Padrão V3)
        if (tipo === 'vale_alimentacao' && valor > 0) r.valAlim += valor;
        else if (tipo === 'vale_transporte' && valor > 0) r.valTransp += valor;
        // Se o tipo for indefinido mas tiver valor, assumir algo? Não, perigoso.
    });

    const linhas = Array.from(mapaCPF.values()).map((r, i) => {
        const seq = String(i + 1).padStart(4, '0');
        return [seq, r.nome, r.cidade, r.ferias, r.valAlim, r.valTransp];
    });

    if (linhas.length > 0) {
        sheet.getRange(13, 1, linhas.length, headers.length).setValues(linhas);
        sheet.getRange(13, 5, linhas.length, 2).setNumberFormat('R$ #,##0.00'); // Cols E, F
        sheet.getRange(13, 1, linhas.length, 1).setHorizontalAlignment('center'); // # centralizado
        sheet.getRange(13, 3, linhas.length, 1).setHorizontalAlignment('center'); // Cidade centralizada
    }

    // === LARGURAS ===
    sheet.setColumnWidth(1, 50);  // #
    sheet.setColumnWidth(2, 300); // Nome
    sheet.setColumnWidth(3, 100); // Cidade
    sheet.setColumnWidth(4, 150); // Férias
    sheet.setColumnWidth(5, 120); // Alim
    sheet.setColumnWidth(6, 120); // Transp

    // === METADADOS OCULTOS (Linha 1 - Invisível) ===
    sheet.getRange('A1').setValue(JSON.stringify(metadados)).setFontColor('#ffffff').setBackground('#ffffff');
    sheet.hideRows(1);

    ss.setActiveSheet(sheet);
    SpreadsheetApp.getUi().alert('✅ Snapshot Restaurado!',
        `Snapshot de ${dataStr}\nCompetência: ${metadados.mes_referencia}/${metadados.ano_referencia}\n\nEdite os valores e use "Enviar Benefícios" para salvar.`,
        SpreadsheetApp.getUi().ButtonSet.OK);
}

function restaurarSnapshotFolha(itens, metadados) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const dataStr = new Date(metadados.data_geracao).toISOString().split('T')[0];
    const nomeAba = `V. ${dataStr} - Folha ${metadados.mes_referencia}/${metadados.ano_referencia}`;

    let sheet = ss.getSheetByName(nomeAba);
    if (sheet) sheet.clear();
    else sheet = ss.insertSheet(nomeAba);

    const headers = [
        'CPF', 'Nome', 'Mês', 'Ano',
        'Local', 'Admissão', 'Sócio', 'Salário Base', 'Cargo', 'Departamento',
        'Convênio Escolhido', 'DN', 'Idade', 'Faixa Etária',
        'Vl 100% Amil', 'Vl Empresa Amil', 'Vl Func. Amil', 'Amil Saúde Dep',
        'Odont. Func.', 'Odont. Dep.',
        'Status (Pendente/Pago)', 'Data Pagto', 'Obs'
    ];

    sheet.getRange(1, 1, 1, headers.length).setValues([headers])
        .setFontWeight('bold').setBackground('#4a86e8').setFontColor('white');

    const mapaCPF = new Map();
    itens.forEach(item => {
        const d = item.dados_snapshot;
        const cpf = d.cpf ? String(d.cpf).replace(/\D/g, '') : null;
        if (cpf) mapaCPF.set(cpf, d);
    });

    const linhas = Array.from(mapaCPF.values()).map(d => {
        const nome = d.nome || d.nome_colaborador || 'SEM NOME';
        const cpf = d.cpf ? formatarCPFParaExibicao(d.cpf) : '';
        const formatDate = (val) => {
            if (!val) return '';
            const dt = new Date(val);
            return isNaN(dt.getTime()) ? '' : dt.toISOString().split('T')[0];
        };

        return [
            cpf, nome,
            d.mes_referencia || metadados.mes_referencia,
            d.ano_referencia || metadados.ano_referencia,
            d.local_trabalho || '',
            formatDate(d.data_admissao),
            parseFloat(d.socio || 0),
            parseFloat(d.salario_base || 0),
            d.cargo || '',
            d.departamento || '',
            d.convenio_escolhido || '',
            formatDate(d.data_nascimento),
            d.idade || '',
            d.faixa_etaria || '',
            parseFloat(d.vl_100_amil || 0),
            parseFloat(d.vl_empresa_amil || 0),
            parseFloat(d.vl_func_amil || 0),
            parseFloat(d.amil_saude_dep || 0),
            parseFloat(d.odont_func || 0),
            parseFloat(d.odont_dep || 0),
            d.status_pagamento || 'pendente',
            formatDate(d.data_pagamento),
            d.observacoes || ''
        ];
    });

    if (linhas.length > 0) {
        sheet.getRange(2, 1, linhas.length, headers.length).setValues(linhas);
    }
    sheet.setColumnWidth(2, 200);
    sheet.setFrozenColumns(2);

    // Metadados
    sheet.insertRowBefore(1);
    sheet.getRange('A1').setValue(JSON.stringify(metadados)).setFontColor('#ffffff').setBackground('#ffffff');
    sheet.hideRows(1);

    ss.setActiveSheet(sheet);
    SpreadsheetApp.getUi().alert('✅ Snapshot Restaurado!',
        `Snapshot de ${dataStr}\nCompetência: ${metadados.mes_referencia}/${metadados.ano_referencia}`,
        SpreadsheetApp.getUi().ButtonSet.OK);
}

// Stubs para Variavel e Apontamentos
function restaurarSnapshotVariavel(itens, metadados) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const dataStr = new Date(metadados.data_geracao).toISOString().split('T')[0];
    const nomeAba = `V. ${dataStr} - Variável ${metadados.mes_referencia}/${metadados.ano_referencia}`;
    let sheet = ss.getSheetByName(nomeAba);
    if (sheet) sheet.clear(); else sheet = ss.insertSheet(nomeAba);

    // Assumindo lista simples
    const headers = ['CPF', 'Nome', 'Cargo', 'Valor Comissão', 'Valor Bônus', 'Total', 'Descrição', 'Status'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');

    const mapa = new Map();
    itens.forEach(i => {
        const d = i.dados_snapshot;
        const cpf = String(d.cpf).replace(/\D/g, '');
        if (!mapa.has(cpf)) mapa.set(cpf, { cpf, nome: d.nome || d.nome_colaborador, cargo: d.cargo, comissao: 0, bonus: 0, desc: [], status: 'pendente' });

        const r = mapa.get(cpf);
        const val = parseFloat(d.valor) || 0;
        const tipo = (d.tipo || d.tipo_apontamento || '').toLowerCase(); // variavel pode ter campo tipo

        // Inferência simples
        if (tipo.includes('bonus')) r.bonus += val;
        else r.comissao += val;

        if (d.descricao) r.desc.push(d.descricao);
    });

    const linhas = Array.from(mapa.values()).map(r => [
        r.cpf, r.nome, r.cargo, r.comissao, r.bonus, r.comissao + r.bonus, r.desc.join('; '), r.status
    ]);

    if (linhas.length > 0) sheet.getRange(2, 1, linhas.length, headers.length).setValues(linhas);

    sheet.insertRowBefore(1);
    sheet.getRange('A1').setValue(JSON.stringify(metadados)).setFontColor('white');
    sheet.setRowHeight(1, 1);
    ss.setActiveSheet(sheet);
}

function restaurarSnapshotApontamentos(itens, metadados) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const dataStr = new Date(metadados.data_geracao).toISOString().split('T')[0];
    const nomeAba = `V. ${dataStr} - Apontamentos ${metadados.mes_referencia}/${metadados.ano_referencia}`;
    let sheet = ss.getSheetByName(nomeAba);
    if (sheet) sheet.clear(); else sheet = ss.insertSheet(nomeAba);

    const headers = ['CPF', 'Nome', 'Dias Trabalhados', 'Faltas', 'Horas Atraso', 'Horas Extras', 'Banco Horas', 'Obs'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');

    const mapa = new Map();
    itens.forEach(i => {
        const d = i.dados_snapshot;
        const cpf = String(d.cpf).replace(/\D/g, '');
        if (!mapa.has(cpf)) mapa.set(cpf, { cpf, nome: d.nome || d.nome_colaborador, dias: 20, faltas: 0, atrasos: 0, he: 0, banco: 0, obs: [] });

        const r = mapa.get(cpf);
        const val = parseFloat(d.valor) || 0;
        const tipo = (d.tipo_apontamento || '').toLowerCase();

        if (tipo.includes('falta')) r.faltas += val;
        else if (tipo.includes('atraso')) r.atrasos += val;
        else if (tipo.includes('extra')) r.he += val;
        else if (tipo.includes('banco')) r.banco += val;

        if (d.obs) r.obs.push(d.obs);
    });

    const linhas = Array.from(mapa.values()).map(r => [
        r.cpf, r.nome, r.dias, r.faltas, r.atrasos, r.he, r.banco, r.obs.join('; ')
    ]);
    if (linhas.length > 0) sheet.getRange(2, 1, linhas.length, headers.length).setValues(linhas);

    sheet.insertRowBefore(1);
    sheet.getRange('A1').setValue(JSON.stringify(metadados)).setFontColor('white');
    sheet.setRowHeight(1, 1);
    ss.setActiveSheet(sheet);
}


// =====================================================
// FUNCAO DE DIAGNOSTICO - Execute no Apps Script Editor
// =====================================================
function testarCompatibilidadeEdge() {
    Logger.log('=== DIAGNOSTICO DE COMPATIBILIDADE ===');
    try { var t1 = listarPlanosAPI(); Logger.log('listarPlanosAPI: ' + (t1.success ? 'OK ' + (t1.data || []).length + ' planos' : 'FALHA ' + t1.error)); } catch (e) { Logger.log('listarPlanosAPI ERR: ' + e.message); }
    try { var t2 = listarHistoricoAPI(null); Logger.log('listarHistoricoAPI: ' + (t2.success ? 'OK ' + (t2.historico || []).length + ' snapshots' : 'FALHA ' + t2.error)); } catch (e) { Logger.log('listarHistoricoAPI ERR: ' + e.message); }
    Logger.log('API URL: ' + CONFIG.API_URL);
    Logger.log('escapeHtml test: ' + escapeHtml('<script>alert(1)</script>'));
    SpreadsheetApp.getUi().alert('Diagnostico concluido! Veja Apps Script > Logs');
}

// =====================================================

// =====================================================
// DASHBOARD GERENCIAL RH (PRO MAX - SPRINT 2)
// =====================================================

function buscarDashboardAPI() {
    try {
        var options = {
            method: 'get',
            headers: { 'Content-Type': 'application/json' },
            muteHttpExceptions: true
        };
        var url = CONFIG.API_URL + '/dashboard/kpis';
        var response = UrlFetchApp.fetch(url, options);
        var statusCode = response.getResponseCode();
        
        if (statusCode !== 200) {
            throw new Error('HTTP ' + statusCode + ': ' + response.getContentText());
        }
        return JSON.parse(response.getContentText());
    } catch (e) {
        Logger.log('Erro Dashboard API: ' + e.message);
        return { success: false, error: e.message };
    }
}

function abrirDashboardModal() {
    var ui = SpreadsheetApp.getUi();
    
    // PRE-LOAD SERVER SIDE
    var dashboardData = { success: false, error: "Inicializando" };
    try {
        dashboardData = buscarDashboardAPI();
    } catch(e) {
        dashboardData = { success: false, error: e.message };
    }
    
    var srvTag = '<script type="application/json" id="srvdashboard">' + JSON.stringify(dashboardData).replace(/<\//g, '\\u003c/') + '<\/script>\n';
    
    var htmlContent = srvTag + 
    '<!-- HTML START -->
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <base target="_top">
  <script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
  <style>
    :root {
      --primary: #1a73e8;
      --primary-dark: #1557b0;
      --primary-light: #e8f0fe;
      --success: #1e8e3e;
      --success-light: #e6f4ea;
      --warning: #f9ab00;
      --warning-light: #fef7e0;
      --danger: #d93025;
      --danger-light: #fce8e6;
      --bg-main: #f3f4f6;
      --bg-card: #ffffff;
      --text-main: #202124;
      --text-muted: #5f6368;
      --border: #e2e8f0;
      --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    * { box-sizing: border-box; }
    body { 
      font-family: \\'Inter\\', -apple-system, BlinkMacSystemFont, \\'Segoe UI\\', Roboto, Helvetica, Arial, sans-serif; 
      background-color: var(--bg-main); 
      color: var(--text-main);
      margin: 0;
      padding: 0;
    }
    .dashboard-header {
      background: var(--bg-card);
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
    }
    .dashboard-header h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: var(--primary-dark);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .ticker-container {
      width: 100%;
      background: linear-gradient(135deg, #1a73e8 0%, #1557b0 100%);
      color: white;
      overflow: hidden;
      padding: 10px 0;
      box-shadow: inset 0 -2px 4px rgba(0,0,0,0.1);
    }
    .ticker-wrapper { width: 100%; overflow: hidden; }
    .ticker { display: flex; white-space: nowrap; animation: scroll 30s linear infinite; }
    .ticker:hover { animation-play-state: paused; }
    .ticker-item {
      display: inline-flex; align-items: center; margin-right: 40px; cursor: default;
      padding: 6px 16px; border-radius: 20px; background: rgba(255,255,255,0.1);
      transition: background 0.3s; font-size: 13px; font-weight: 500;
    }
    .ticker-item:hover { background: rgba(255,255,255,0.2); }
    @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
    .container { padding: 24px; max-width: 1600px; margin: 0 auto; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .kpi-card {
      background: var(--bg-card); padding: 20px; border-radius: 12px;
      box-shadow: var(--shadow-sm); border: 1px solid var(--border);
      display: flex; flex-direction: column; position: relative; overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .kpi-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
    .kpi-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
    .kpi-icon { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
    .kpi-icon svg { width: 20px; height: 20px; stroke-width: 2; stroke: currentColor; fill: none; }
    .kpi-title { font-size: 13px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .kpi-value { font-size: 28px; font-weight: 800; color: var(--text-main); margin-bottom: 8px; }
    .kpi-footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto; }
    .pill { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .pill.up { color: var(--success); background: var(--success-light); }
    .pill.down { color: var(--danger); background: var(--danger-light); }
    .pill.neutral { color: var(--text-muted); background: var(--bg-main); }
    .sparkline { width: 60px; height: 24px; stroke-width: 2; fill: none; }
    .chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
    .chart-card { background: var(--bg-card); padding: 24px; border-radius: 12px; box-shadow: var(--shadow-sm); border: 1px solid var(--border); }
    .chart-card h3 { font-size: 16px; font-weight: 600; margin-top: 0; margin-bottom: 16px; color: var(--text-main); }
    .chart-container { width: 100%; height: 320px; }
    .insights-panel {
      background: linear-gradient(to right, #f8fafc, #ffffff); border-left: 4px solid var(--primary);
      padding: 20px 24px; border-radius: 8px; box-shadow: var(--shadow-sm);
      border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); border-right: 1px solid var(--border);
    }
    .insights-title { font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px; color: var(--primary-dark); margin-bottom: 16px; }
    .insights-list { display: flex; flex-direction: column; gap: 12px; }
    .insight-item { display: flex; align-items: flex-start; gap: 12px; font-size: 14px; line-height: 1.5; }
    .loading-state, .error-state { padding: 60px; text-align: center; font-size: 16px; color: var(--text-muted); }
    .error-state { color: var(--danger); background: var(--danger-light); border-radius: 8px; border: 1px solid #f87171; }
  </style>
</head>
<body>
  <div class="dashboard-header">
    <h2>
      <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
      Dashboard Gerencial RH
    </h2>
    <div style="font-size: 13px; color: var(--text-muted);">Atualizado em tempo real</div>
  </div>
  <div class="ticker-container" id="ticker-container" style="display:none;">
    <div class="ticker-wrapper">
      <div class="ticker" id="ticker-content"></div>
    </div>
  </div>
  <div class="container" id="content_area">
    <div class="loading-state">
       <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
       <div style="margin-top: 16px;">Processando métricas no servidor...</div>
    </div>
  </div>
  <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
  <script>
    var formatBRL = new Intl.NumberFormat(\\'pt-BR\\', { style: \\'currency\\', currency: \\'BRL\\' });
    var formatNum = new Intl.NumberFormat(\\'pt-BR\\');
    var icons = {
        users: \\'<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>\\',
        userOff: \\'<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="18" y1="8" x2="23" y2="13"></line><line x1="23" y1="8" x2="18" y2="13"></line></svg>\\',
        money: \\'<svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>\\',
        gift: \\'<svg viewBox="0 0 24 24"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>\\',
        chart: \\'<svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>\\',
        refresh: \\'<svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>\\',
        target: \\'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>\\',
        ticket: \\'<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="7" y1="4" x2="7" y2="20"></line><line x1="17" y1="4" x2="17" y2="20"></line></svg>\\'
    };
    window.onload = function() {
        var el = document.getElementById(\\'srvdashboard\\');
        if (el) {
            try {
                var data = JSON.parse(el.textContent);
                if (data && data.success) {
                    google.charts.load(\\'current\\', {\\'packages\\':[\\'corechart\\', \\'line\\', \\'bar\\']});
                    google.charts.setOnLoadCallback(function() { renderizarDashboard(data); });
                } else { mostrarErro(data ? data.error : \\'Erro desconhecido na API\\'); }
            } catch(e) { mostrarErro("Erro de parsing: " + e.message); }
        } else { mostrarErro("Falha: Payload JSON do servidor não encontrado."); }
    };
    function mostrarErro(msg) { document.getElementById(\\'content_area\\').innerHTML = \\'<div class="error-state">❌ \\' + msg + \\'</div>\\'; }
    function renderizarDashboard(payload) {
        var html = \\'\\';
        var k = payload.kpis;
        if (payload.alertas && payload.alertas.length > 0) {
            document.getElementById(\\'ticker-container\\').style.display = \\'block\\';
            var tkContainer = document.getElementById(\\'ticker-content\\');
            var tkItems = \\'\\';
            var itemsLoop = payload.alertas.concat(payload.alertas, payload.alertas);
            itemsLoop.forEach(function(a) { tkItems += \\'<div class="ticker-item">\\' + a.mensagem + \\'</div>\\'; });
            tkContainer.innerHTML = tkItems;
        }
        html += \\'<div class="kpi-grid">\\';
        html += buildKpiCard(\\'Colab. Ativos\\', k.ativos.valor, k.ativos.variacao, k.ativos.sparkline, icons.users, false);
        html += buildKpiCard(\\'Colab. Inativos\\', k.inativos.valor, k.inativos.variacao, k.inativos.sparkline, icons.userOff, true); 
        html += buildKpiCard(\\'Folha Bruta\\', formatBRL.format(k.folha.valor), k.folha.variacao, k.folha.sparkline, icons.money, true);
        html += buildKpiCard(\\'Benefícios Totais\\', formatBRL.format(k.beneficios.valor), k.beneficios.variacao, k.beneficios.sparkline, icons.gift, true);
        html += buildKpiCard(\\'Variável / Bônus\\', formatBRL.format(k.variavel.valor), k.variavel.variacao, k.variavel.sparkline, icons.chart, false);
        html += buildKpiCard(\\'Turnover Mês\\', k.turnover.valor.toFixed(1) + \\'%\\', k.turnover.variacao, k.turnover.sparkline, icons.refresh, true);
        html += buildKpiCard(\\'Vagas Abertas\\', k.vagas.valor, k.vagas.variacao, k.vagas.sparkline, icons.target, false);
        html += buildKpiCard(\\'Ticket Médio\\', formatBRL.format(k.ticketMedio.valor), k.ticketMedio.variacao, k.ticketMedio.sparkline, icons.ticket, false);
        html += \\'</div><div class="chart-grid">\\';
        html += \\'<div class="chart-card"><h3>Evolução da Folha (6 Meses)</h3><div id="cEvolucao" class="chart-container"></div></div>\\';
        html += \\'<div class="chart-card"><h3>Distribuição por Departamento</h3><div id="cDeptos" class="chart-container"></div></div>\\';
        html += \\'<div class="chart-card"><h3>Top Performers (Variável)</h3><div id="cPerformers" class="chart-container"></div></div>\\';
        html += \\'<div class="chart-card"><h3>Histórico de Admissões (12 Meses)</h3><div id="cAdmissoes" class="chart-container"></div></div>\\';
        html += \\'</div><div class="insights-panel">\\';
        html += \\'<div class="insights-title"><svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> Insights Inteligentes</div>\\';
        html += \\'<div class="insights-list" id="insights_content">Gerando insights...</div></div>\\';
        document.getElementById(\\'content_area\\').innerHTML = html;
        if (payload.graficos) {
            desenharGraficoEvolucao(payload.graficos.evolucao);
            desenharGraficoDeptos(payload.graficos.departamentos);
            desenharGraficoPerformers(payload.graficos.performers);
            desenharGraficoAdmissoes(payload.graficos.contratacoes);
        }
        document.getElementById(\\'insights_content\\').innerHTML = compilarInsights(payload.kpis, payload.graficos);
    }
    function buildKpiCard(title, value, varMoM, sparkArray, iconSvg, inverseColors) {
        var bgClass = \\'neutral\\', arrow = \\'→\\', varFormatada = Math.abs(varMoM).toFixed(1) + \\'%\\';
        if (varMoM > 0.1) { bgClass = inverseColors ? \\'down\\' : \\'up\\'; arrow = \\'↑\\'; } 
        else if (varMoM < -0.1) { bgClass = inverseColors ? \\'up\\' : \\'down\\'; arrow = \\'↓\\'; }
        var strokeColor = \\'#475569\\';
        if (bgClass === \\'up\\') strokeColor = \\'var(--success)\\';
        if (bgClass === \\'down\\') strokeColor = \\'var(--danger)\\';
        return \\'<div class="kpi-card"><div class="kpi-header"><div class="kpi-title">\\' + title + \\'</div><div class="kpi-icon" style="background:var(--primary-light); color:var(--primary)">\\' + iconSvg + \\'</div></div><div class="kpi-value">\\' + value + \\'</div><div class="kpi-footer"><div class="pill \\' + bgClass + \\'">\\' + arrow + \\' \\' + varFormatada + \\'</div>\\' + gerarSparkline(sparkArray, strokeColor) + \\'</div></div>\\';
    }
    function gerarSparkline(dataArr, color) {
        if (!dataArr || dataArr.length < 2) return \\'\\';
        var max = Math.max.apply(null, dataArr), min = Math.min.apply(null, dataArr), range = max - min || 1;
        var width = 60, height = 24, stepX = width / (dataArr.length - 1);
        var pts = dataArr.map(function(val, idx) { return (idx * stepX) + \\',\\' + (height - (((val - min) / range) * height)); }).join(\\' \\');
        return \\'<svg class="sparkline" stroke="\\' + color + \\'"><polyline points="\\' + pts + \\'"></polyline></svg>\\';
    }
    function desenharGraficoEvolucao(evolucaoData) {
        if(!evolucaoData || evolucaoData.length === 0) return;
        var data = new google.visualization.DataTable();
        data.addColumn(\\'string\\', \\'Mês\\'); data.addColumn(\\'number\\', \\'Folha (R$)\\'); data.addColumn(\\'number\\', \\'Benefícios (R$)\\');
        evolucaoData.slice().reverse().forEach(function(item) { data.addRow([item.mes, item.folha || 0, item.beneficios || 0]); });
        var options = { fontName: \\'Inter\\', colors: [\\'#1a73e8\\', \\'#1e8e3e\\'], chartArea: { width: \\'85%\\', height: \\'70%\\' }, legend: { position: \\'top\\' }, vAxis: { minValue: 0, textStyle: { color: \\'#5f6368\\'}, gridlines: { color: \\'#e2e8f0\\'} }, hAxis: { textStyle: { color: \\'#5f6368\\'} }, animation: { startup: true, duration: 800, easing: \\'out\\' }, lineWidth: 3, pointSize: 5 };
        new google.visualization.AreaChart(document.getElementById(\\'cEvolucao\\')).draw(data, options);
    }
    function desenharGraficoDeptos(depsData) {
        if(!depsData || depsData.length === 0) return;
        var data = new google.visualization.DataTable();
        data.addColumn(\\'string\\', \\'Departamento\\'); data.addColumn(\\'number\\', \\'Ativos\\');
        depsData.sort(function(a,b) { return b[1] - a[1]; }).forEach(function(row) { data.addRow([row[0], parseInt(row[1])||0]); });
        var options = { fontName: \\'Inter\\', colors: [\\'#4285f4\\', \\'#34a853\\', \\'#fbbc04\\', \\'#ea4335\\', \\'#9c27b0\\', \\'#00bcd4\\'], chartArea: { width: \\'90%\\', height: \\'80%\\' }, pieHole: 0.45, legend: { position: \\'right\\', textStyle: { fontSize: 13 } } };
        new google.visualization.PieChart(document.getElementById(\\'cDeptos\\')).draw(data, options);
    }
    function desenharGraficoPerformers(perfData) {
        if(!perfData || perfData.length === 0) return;
        var data = new google.visualization.DataTable();
        data.addColumn(\\'string\\', \\'Colaborador\\'); data.addColumn(\\'number\\', \\'Comissão (R$)\\');
        perfData.forEach(function(p) { data.addRow([p.nome, p.valor]); });
        var options = { fontName: \\'Inter\\', colors: [\\'#f9ab00\\'], chartArea: { width: \\'70%\\', height: \\'80%\\' }, legend: { position: \\'none\\' }, hAxis: { textStyle: { color: \\'#5f6368\\'} }, vAxis: { textStyle: { color: \\'#202124\\', fontSize: 12, bold: true } }, animation: { startup: true, duration: 800, easing: \\'out\\' } };
        new google.visualization.BarChart(document.getElementById(\\'cPerformers\\')).draw(data, options);
    }
    function desenharGraficoAdmissoes(admData) {
        if(!admData || admData.length === 0) return;
        var data = new google.visualization.DataTable();
        data.addColumn(\\'string\\', \\'Mês\\'); data.addColumn(\\'number\\', \\'Admissões\\');
        admData.slice().reverse().forEach(function(a) { data.addRow([a.mes, a.valor]); });
        var options = { fontName: \\'Inter\\', colors: [\\'#9c27b0\\'], chartArea: { width: \\'85%\\', height: \\'70%\\' }, legend: { position: \\'none\\' }, vAxis: { minValue: 0, format: \\'#\\', gridlines: { color: \\'#e2e8f0\\'} }, animation: { startup: true, duration: 800, easing: \\'out\\' }, lineWidth: 2 };
        new google.visualization.LineChart(document.getElementById(\\'cAdmissoes\\')).draw(data, options);
    }
    function compilarInsights(kpis, graficos) {
        var lines = [];
        var check = \\'<svg width="16" height="16" stroke="var(--success)" fill="none" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>\\';
        var warn  = \\'<svg width="16" height="16" stroke="var(--danger)" fill="none" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>\\';
        var info  = \\'<svg width="16" height="16" stroke="var(--primary)" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>\\';
        if (kpis.folha.variacao > 3) { lines.push({ ic: warn, t: \\'Custo de folha aumentou <b>\\' + kpis.folha.variacao.toFixed(1) + \\'%</b> vs mês anterior. Recomenda-se analisar impacto das horas extras.\\' }); } 
        else if (kpis.folha.variacao < -1) { lines.push({ ic: check, t: \\'Folha reduziu \\' + Math.abs(kpis.folha.variacao).toFixed(1) + \\'%. Movimento que favorece o ticket médio.\\' }); }
        if (kpis.turnover.valor > 4) { lines.push({ ic: warn, t: \\'Taxa de turnover alta (<b>\\' + kpis.turnover.valor.toFixed(1) + \\'%</b>). Isso indica risco de evasão e aumento de custos rescisórios.\\' }); } 
        else { lines.push({ ic: check, t: \\'Turnover sob controle (\\' + kpis.turnover.valor.toFixed(1) + \\'%), sinalizando boa retenção de talentos no período.\\' }); }
        if (kpis.folha.valor > 0) {
            var benRatio = ((kpis.beneficios.valor / kpis.folha.valor) * 100).toFixed(1);
            lines.push({ ic: info, t: \\'Atualmente os benefícios equivalem a <b>\\' + benRatio + \\'%</b> da base salarial. Padrão saudável de mercado varia de 15% a 25%.\\' });
        }
        if (graficos.departamentos && graficos.departamentos.length > 0) {
            var maxDep = graficos.departamentos.reduce(function(a,b) { return a[1]>b[1] ? a : b; });
            var pct = ((maxDep[1] / kpis.ativos.valor) * 100).toFixed(1);
            lines.push({ ic: info, t: \\'O departamento <b>\\' + maxDep[0] + \\'</b> é a maior força motriz atual, agrupando \\' + pct + \\'% dos colaboradores ativos.\\' });
        }
        var html = \\'\\';
        lines.forEach(function(l) { html += \\'<div class="insight-item"><div>\\' + l.ic + \\'</div><div>\\' + l.t + \\'</div></div>\\'; });
        return html;
    }
  </script>
</body>
</html>
<!-- HTML END -->\n';
    
    var htmlOutput = HtmlService.createHtmlOutput(htmlContent)
        .setWidth(1400)
        .setHeight(850);
        
    ui.showModalDialog(htmlOutput, 'Dashboard Gerencial RH');
}
