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
    const headers = [['', 'CPF', 'Nome Completo', 'Cargo', 'Departamento', 'Salário Base', 'Status', 'Data Admissão']];
    sheet.getRange(5, 1, 1, 8).setValues(headers); // Aumentado para 8 colunas
    sheet.getRange(5, 1, 1, 8)
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
    sheet.setColumnWidth(6, 110); // Salário
    sheet.setColumnWidth(7, 100); // Status
    sheet.setColumnWidth(8, 110); // Data

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
                salario,
                c.status,
                dataAdmissao
            ];
        });

        const startRow = 6;
        sheet.getRange(startRow, 1, dados.length, 8).setValues(dados);

        // Formatação
        sheet.getRange(startRow, 1, dados.length, 1).insertCheckboxes();
        sheet.getRange(startRow, 6, dados.length, 1).setNumberFormat('R$ #,##0.00'); // Formatar Salário
        sheet.getRange(startRow, 1, dados.length, 8)
            .setVerticalAlignment('middle')
            .setBorder(true, true, true, true, true, true);

        // Zebra striping
        for (let i = 0; i < dados.length; i++) {
            if (i % 2 !== 0) {
                sheet.getRange(startRow + i, 1, 1, 7).setBackground('#fafafa');
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
        const dadosTabela = layout.dados.map(linha => {
            return layout.colunas.map(col => {
                const valor = linha[col.campo];

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

    criarPlanilhaLancamentoFolha(cpfs, periodo);
}

function criarPlanilhaLancamentoFolha(cpfs, periodo, dadosMap = null) {
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

    // Buscar nomes dos CPFs (simples lookup na aba Colaboradores para evitar chamada de API lenta)
    const sheetColab = ss.getSheetByName(CONFIG.ABAS.COLABORADORES);
    const dadosColab = sheetColab.getDataRange().getValues(); // Cache local rápido
    const mapNomes = {};
    // Assumindo CPF col 2 (index 1), Nome col 3 (index 2) - Ajustado conforme layout atual (Check, CPF, Nome...)
    for (let i = 5; i < dadosColab.length; i++) { // Linha 6+
        const cpfLimpo = String(dadosColab[i][1]).replace(/\D/g, '');
        mapNomes[cpfLimpo] = dadosColab[i][2];
    }

    // Cabeçalhos (Mapeados para o Controller)
    const headers = [
        'CPF', 'Nome', 'Mês', 'Ano',
        'Salário Base', 'Horas Extras', 'Adic. Noturno', 'Insalubridade', 'Periculosidade', 'Comissões', 'Gratificações', 'Outros Prov.',
        'INSS', 'IRRF', 'Vale Transp.', 'Vale Refeição', 'Plano Saúde', 'Outros Desc.',
        'Status (Pendente/Pago)', 'Data Pagto', 'Obs'
    ];

    // Montar linhas
    // Montar linhas
    const linhas = cpfs.map(cpf => {
        const nome = mapNomes[cpf] || 'Não encontrado';
        let d = {};
        // Se for recuperação, pega o primeiro item do array (Folha é único por CPF)
        if (dadosMap && dadosMap[cpf] && dadosMap[cpf].length > 0) d = dadosMap[cpf][0];

        // Se tiver dados, usa. Se não, zero.
        return [
            formatarCPFParaExibicao(cpf), nome, periodo.mes, periodo.ano,
            d.salario_base || 0, d.horas_extras || 0, d.adicional_noturno || 0, d.insalubridade || 0, d.periculosidade || 0, d.comissoes || 0, d.gratificacoes || 0, d.outros_proventos || 0,
            d.inss || 0, d.irrf || 0, d.vale_transporte || 0, d.vale_refeicao || 0, d.plano_saude || 0, d.outros_descontos || 0,
            d.status_pagamento || 'pendente',
            d.data_pagamento ? d.data_pagamento.substring(0, 10) : '',
            d.observacoes || ''
        ];
    });

    // Renderizar
    sheet.getRange(1, 1, 1, headers.length).setValues([headers])
        .setFontWeight('bold').setBackground('#4a86e8').setFontColor('white');

    sheet.getRange(2, 1, linhas.length, headers.length).setValues(linhas);

    // Formatação
    sheet.setColumnWidth(2, 200); // Nome
    sheet.getRange(2, 5, linhas.length, 14).setNumberFormat('#,##0.00'); // Moeda

    // Validação Status
    const ruleStatus = SpreadsheetApp.newDataValidation()
        .requireValueInList(['pendente', 'pago'], true)
        .setAllowInvalid(false)
        .build();
    sheet.getRange(2, 19, linhas.length, 1).setDataValidation(ruleStatus);

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

    if (!nomeAba.includes('Lançamento Folha')) {
        SpreadsheetApp.getUi().alert('⚠️ Aba Incorreta', 'Você deve estar na aba "Lançamento Folha ..." para enviar os dados.', SpreadsheetApp.getUi().ButtonSet.OK);
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

    const folhas = [];
    // Mapeamento baseado na ordem das colunas em lancarFolha
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const cpfRaw = String(row[0]);
        if (!cpfRaw) continue;

        folhas.push({
            cpf: cpfRaw.replace(/\D/g, ''),
            mes_referencia: row[2],
            ano_referencia: row[3],
            salario_base: row[4],
            horas_extras: row[5],
            adicional_noturno: row[6],
            insalubridade: row[7],
            periculosidade: row[8],
            comissoes: row[9],
            gratificacoes: row[10],
            outros_proventos: row[11],
            inss: row[12],
            irrf: row[13],
            vale_transporte: row[14],
            vale_refeicao: row[15],
            plano_saude: row[16],
            outros_descontos: row[17],
            status_pagamento: row[18] ? String(row[18]).toLowerCase() : 'pendente',
            data_pagamento: row[19] ? new Date(row[19]).toISOString().split('T')[0] : null,
            observacoes: row[20]
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

            // Perguntar se deseja excluir
            const respDel = ui.alert('Limpeza', 'Deseja excluir esta aba de lançamento para manter a planilha organizada?', ui.ButtonSet.YES_NO);
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
            const cpfsLimpos = cpfs.map(c => String(c).replace(/\D/g, ''));
            return res.colaboradores.filter(c => cpfsLimpos.includes(String(c.cpf).replace(/\D/g, '')));
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

    // Prioridade 2: Dados da Aba (Fallback se API falhar)
    const sheetColab = ss.getSheetByName(CONFIG.ABAS.COLABORADORES);
    const dadosColab = sheetColab.getDataRange().getValues();
    for (let i = 5; i < dadosColab.length; i++) {
        const cpfLimpo = String(dadosColab[i][1]).replace(/\D/g, '');
        if (!mapDados[cpfLimpo]) { // Só preenche se não veio da API
            mapDados[cpfLimpo] = {
                nome: dadosColab[i][2],
                cidade: dadosColab[i][4] || '-'
            };
        }
    }

    // Gerar Linhas
    const linhas = cpfs.map((cpf, index) => {
        const d = mapDados[cpf] || { nome: 'Não encontrado', cidade: '' };
        const seq = String(index + 1).padStart(4, '0');

        let valAlim = sheet.getRange('C10').getValue();
        let valTransp = sheet.getRange('C6').getValue();

        if (dadosMap && dadosMap[cpf]) {
            const alim = dadosMap[cpf].find(x => x.tipo_beneficio === 'vale_alimentacao');
            const transp = dadosMap[cpf].find(x => x.tipo_beneficio === 'vale_transporte');
            valAlim = alim ? alim.valor : 0;
            valTransp = transp ? transp.valor : 0;
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

    if (!nomeAba.includes('Lançamento Benefícios')) {
        SpreadsheetApp.getUi().alert('⚠️ Aba Incorreta', 'Você deve estar na aba "Lançamento Benefícios ..." para enviar.', SpreadsheetApp.getUi().ButtonSet.OK);
        return;
    }

    const ui = SpreadsheetApp.getUi();
    const resp = ui.alert('Confirmar', 'Enviar benefícios para o sistema?', ui.ButtonSet.YES_NO);
    if (resp == ui.Button.NO) return;

    const startRow = 13;
    const lastRow = sheet.getLastRow();
    if (lastRow < startRow) return;

    // Lendo colunas A até F (1 a 6)
    const data = sheet.getRange(startRow, 1, lastRow - startRow + 1, 6).getValues();
    const beneficios = [];

    // Map Name -> CPF (Recuperação inversa, já que CPF não está na linha visualmente)
    const sheetColab = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.ABAS.COLABORADORES);
    const dadosColab = sheetColab.getDataRange().getValues();
    const mapNomeParaCPF = {};
    for (let i = 5; i < dadosColab.length; i++) {
        const nome = String(dadosColab[i][2]).trim().toUpperCase();
        const cpf = String(dadosColab[i][1]).replace(/\D/g, '');
        mapNomeParaCPF[nome] = cpf;
    }

    const match = nomeAba.match(/([a-zA-Z]{3})-(\d{4})/);
    let mes = 0, ano = 0;
    if (match) {
        const meses = { 'Jan': 1, 'Fev': 2, 'Mar': 3, 'Abr': 4, 'Mai': 5, 'Jun': 6, 'Jul': 7, 'Ago': 8, 'Set': 9, 'Out': 10, 'Nov': 11, 'Dez': 12 };
        mes = meses[match[1]];
        ano = parseInt(match[2]);
    }

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const nome = String(row[1]).trim().toUpperCase();
        if (!nome) continue;

        const cpf = mapNomeParaCPF[nome];
        if (!cpf) continue;

        // Col 4 (Index 4) = Alimentação (E)
        if (row[4] && typeof row[4] === 'number' && row[4] > 0) {
            beneficios.push({ cpf, mes_referencia: mes, ano_referencia: ano, tipo_beneficio: 'vale_alimentacao', valor: row[4], quantidade: 1, valor_total: row[4], status: 'ativo' });
        }

        // Col 5 (Index 5) = Transporte (F)
        if (row[5] && typeof row[5] === 'number' && row[5] > 0) {
            beneficios.push({ cpf, mes_referencia: mes, ano_referencia: ano, tipo_beneficio: 'vale_transporte', valor: row[5], quantidade: 1, valor_total: row[5], status: 'ativo' });
        }
    }

    if (beneficios.length === 0) {
        ui.alert('⚠️ Nenhum benefício para enviar', 'Verifique se há valores preenchidos em Alimentação ou Transporte.', ui.ButtonSet.OK);
        return;
    }

    try {
        const url = CONFIG.API_URL + '/beneficios/batch';
        const options = {
            'method': 'post', 'contentType': 'application/json',
            'payload': JSON.stringify({ beneficios: beneficios }), 'muteHttpExceptions': true
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

    if (!nomeAba.includes('Lançamento Variável')) {
        SpreadsheetApp.getUi().alert('⚠️ Aba Incorreta', 'Você deve estar na aba "Lançamento Variável ..." para enviar.', SpreadsheetApp.getUi().ButtonSet.OK);
        return;
    }

    // Extrair Período do nome da aba (Ex: ... Jan-2025)
    // Isso é importante para preencher mes_referencia na API
    const partesNome = nomeAba.split(' ');
    const periodoStr = partesNome[partsNome.length - 1]; // "Jan-2025"
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

    if (!nomeAba.includes('Lançamento Apontamentos')) {
        SpreadsheetApp.getUi().alert('⚠️ Aba Incorreta', 'Você deve estar na aba "Lançamento Apontamentos ..." para enviar.', SpreadsheetApp.getUi().ButtonSet.OK);
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
        ui.alert('⚠️ Nenhum colaborador selecionado',
            'Marque o checkbox de UM colaborador que deseja editar.',
            ui.ButtonSet.OK);
        return;
    }

    if (cpfs.length > 1) {
        ui.alert('⚠️ Selecione apenas um colaborador',
            'A edição funciona com um colaborador por vez.\nMarque apenas um checkbox.',
            ui.ButtonSet.OK);
        return;
    }

    // Buscar dados do colaborador
    try {
        const cpf = cpfs[0];
        const url = CONFIG.API_URL + '/colaboradores/' + cpf;
        const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
        const resultado = JSON.parse(response.getContentText());

        if (resultado.success) {
            // CORREÇÃO: Usar 'resultado.data' em vez de 'resultado.colaborador'
            mostrarModalEdicao(resultado.data);
        } else {
            throw new Error(resultado.error);
        }
    } catch (erro) {
        ui.alert('❌ Erro', 'Erro ao buscar colaborador: ' + erro.message, ui.ButtonSet.OK);
    }
}

function mostrarModalEdicao(colaborador) {
    const html = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial; padding: 20px; }
      label { display: block; margin-top: 10px; font-weight: bold; }
      input, select { width: 100%; padding: 8px; margin: 5px 0; box-sizing: border-box; }
      button { background: #4285f4; color: white; padding: 10px 20px; 
               border: none; margin: 10px 5px 0 0; cursor: pointer; }
      button:hover { background: #357ae8; }
      .info { background: #e3f2fd; padding: 10px; margin-bottom: 15px; border-left: 4px solid #2196f3; }
      .readonly { background: #f5f5f5; cursor: not-allowed; }
    </style>
    
    <h2>📝 Editar Colaborador</h2>
    
    <div class="info">
      <strong>CPF:</strong> ${formatarCPFParaExibicao(colaborador.cpf)}<br>
      <small>O CPF não pode ser alterado</small>
    </div>
    
    <form id="formEdicao">
      <input type="hidden" id="colaborador_id" value="${colaborador.id}">
      <input type="hidden" id="cpf" value="${colaborador.cpf}">
      
      <label>Nome Completo</label>
      <input type="text" id="nome_completo" value="${colaborador.nome_completo || ''}" required>
      
      <label>Email</label>
      <input type="email" id="email" value="${colaborador.email || ''}" placeholder="email@empresa.com">
      
      <label>Telefone</label>
      <input type="text" id="telefone" value="${colaborador.telefone || ''}" placeholder="(00) 00000-0000">
      
      <label>Cargo</label>
      <input type="text" id="cargo" value="${colaborador.cargo || ''}" placeholder="Ex: Analista, Gerente">
      
      <label>Departamento</label>
      <select id="departamento">
        <option value="">Selecione...</option>
        <option value="Comercial" ${colaborador.departamento === 'Comercial' ? 'selected' : ''}>Comercial</option>
        <option value="RH" ${colaborador.departamento === 'RH' ? 'selected' : ''}>RH</option>
        <option value="Financeiro" ${colaborador.departamento === 'Financeiro' ? 'selected' : ''}>Financeiro</option>
        <option value="Vendas" ${colaborador.departamento === 'Vendas' ? 'selected' : ''}>Vendas</option>
        <option value="TI" ${colaborador.departamento === 'TI' ? 'selected' : ''}>TI</option>
        <option value="Operações" ${colaborador.departamento === 'Operações' ? 'selected' : ''}>Operações</option>
      </select>
      
      <label>Local de Trabalho</label>
      <input type="text" id="local_trabalho" value="${colaborador.local_trabalho || ''}" placeholder="Ex: Matriz, Filial SP">
      
      <label>Cidade</label>
      <input type="text" id="cidade" value="${colaborador.cidade || ''}" placeholder="Ex: São Paulo">
      
      <label>Data de Admissão</label>
      <input type="date" id="data_admissao" value="${colaborador.data_admissao || ''}">
      
      <div class="row" style="background: #fff3e0; padding: 10px; border: 1px solid #ffe0b2; border-radius: 4px; margin: 10px 0;">
          <div class="col">
             <label style="margin-top:0">Salário Base (R$)</label>
             <input type="number" step="0.01" id="salario_base" value="${colaborador.salario_base || 0}">
          </div>
          <div class="col">
             <label style="margin-top:0">Motivo Alteração</label>
             <input type="text" id="motivo_alteracao" placeholder="Ex: Promoção, Dissídio" style="font-size: 11px;">
          </div>
      </div>

      <!-- SEÇÃO PLANOS -->
      <fieldset style="border: 1px solid #ccc; padding: 10px; border-radius: 4px; margin-top: 15px;">
        <legend style="font-weight:bold; color:#1a73e8;">🏥 Planos de Saúde e Odonto</legend>
        
        <div class="row">
          <div class="col" style="flex: 2;">
            <label>Plano de Saúde</label>
            <select id="plano_saude"><option value="">Carregando...</option></select>
          </div>
          <div class="col" style="flex: 1;">
            <label>Cteirinha (Matrícula Titular)</label>
            <input type="text" id="matricula_saude" placeholder="Ex: 95445982">
          </div>
        </div>
        
        <label>Plano Odontológico (Opcional)</label>
        <select id="plano_odonto"><option value="">Carregando...</option></select>
        
        <hr style="margin: 15px 0; border: 0; border-top: 1px solid #eee;">
        
        <label style="font-weight:bold;">👨‍👩‍👧‍👦 Dependentes</label>
        <div id="lista_dependentes" style="margin-bottom: 10px; font-size: 12px;">Carregando...</div>
        
        <div style="background: #f8f9fa; padding: 10px; border-radius: 4px; border: 1px solid #ddd;">
          <label style="margin-top:0">Adicionar Dependente:</label>
          <div class="row">
            <input type="text" id="dep_nome" placeholder="Nome Completo" style="flex: 2;">
            <input type="text" id="dep_cpf" placeholder="CPF" style="flex: 1;">
            <input type="date" id="dep_nasc" style="flex: 1;">
          </div>
          <div class="row">
            <select id="dep_parentesco" style="flex: 1;">
              <option value="">Parentesco...</option>
              <option value="Filho(a)">Filho(a)</option>
              <option value="Cônjuge">Cônjuge</option>
              <option value="Pai/Mãe">Pai/Mãe</option>
            </select>
            <input type="text" id="dep_matricula" placeholder="Matrícula Dep." style="flex: 1;">
            <button type="button" onclick="adicionarDependenteUI()" style="background:#28a745; padding: 5px 10px;">+</button>
          </div>
        </div>
      </fieldset>

      <div class="row" style="background: #fff3e0; padding: 10px; border: 1px solid #ffe0b2; border-radius: 4px; margin: 10px 0;">

      <label>Status</label>
      <select id="status">
        <option value="ativo" ${colaborador.status === 'ativo' ? 'selected' : ''}>Ativo</option>
        <option value="inativo" ${colaborador.status === 'inativo' ? 'selected' : ''}>Inativo</option>
        <option value="ferias" ${colaborador.status === 'ferias' ? 'selected' : ''}>Férias</option>
        <option value="afastado" ${colaborador.status === 'afastado' ? 'selected' : ''}>Afastado</option>
      </select>
      
      <div style="margin-top: 20px;">
        <button type="submit">✅ Salvar Alterações</button>
        <button type="button" onclick="google.script.host.close()">Cancelar</button>
      </div>
    </form>
    
    <div id="mensagem" style="margin-top: 20px; padding: 10px; display: none;"></div>
    
    <script>
      // Formatar telefone enquanto digita
      document.getElementById('telefone').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\\D/g, '');
        if (value.length <= 11) {
          value = value.replace(/(\\d{2})(\\d)/, '($1) $2');
          value = value.replace(/(\\d{5})(\\d)/, '$1-$2');
          e.target.value = value;
        }
      });
      
      // Enviar formulário
      document.getElementById('formEdicao').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const dadosAtualizados = {
          nome_completo: document.getElementById('nome_completo').value,
          email: document.getElementById('email').value,
          telefone: document.getElementById('telefone').value.replace(/\\D/g, ''),
          cargo: document.getElementById('cargo').value,
          departamento: document.getElementById('departamento').value,
          local_trabalho: document.getElementById('local_trabalho').value,
          cidade: document.getElementById('cidade').value,
          data_admissao: document.getElementById('data_admissao').value,
          salario_base: document.getElementById('salario_base').value,
          motivo_alteracao: document.getElementById('motivo_alteracao').value,
          status: document.getElementById('status').value
        };
        
        const cpf = document.getElementById('cpf').value;
        
        mostrarMensagem('⏳ Salvando alterações...', 'info');
        
        google.script.run
          .withSuccessHandler(function(resultado) {
            if (resultado.success) {
              // SAVE PLANS
              mostrarMensagem('⏳ Salvando planos...', 'info');
              
              const cid = document.getElementById('colaborador_id').value;
              const pSaude = document.getElementById('plano_saude').value;
              const pOdonto = document.getElementById('plano_odonto').value;
              const matriculaSaude = document.getElementById('matricula_saude').value;
              
              const finalizar = function() {
                 mostrarMensagem('✅ Dados salvos com sucesso!', 'success');
                 setTimeout(() => google.script.host.close(), 1500);
              };

              const salvarOdonto = function() {
                  if (pOdonto) {
                      // Odonto geralmente não tem matrícula separada neste contexto simplificado, ou usa a mesma.
                      // Passamos null ou trataremos no futuro se o usuário pedir.
                      google.script.run.withSuccessHandler(finalizar)
                      .salvarPlanoColaboradorAPI(cid, pOdonto, null);
                  } else {
                      finalizar();
                  }
              };

              if (pSaude) {
                  google.script.run.withSuccessHandler(salvarOdonto)
                  .salvarPlanoColaboradorAPI(cid, pSaude, matriculaSaude);
              } else {
                  salvarOdonto();
              }
              
              const finalizar = function() {
                  mostrarMensagem('✅ Dados salvos com sucesso!', 'success');
                  setTimeout(function() { google.script.host.close(); }, 1500);
              };

              
              // 1. Salvar Plano de Saúde (com matrícula Titular)
              const pSaude = document.getElementById('plano_saude').value;
              const matriculaSaude = document.getElementById('matricula_saude').value;
              
              const salvarOdonto = () => {
                 const pOdonto = document.getElementById('plano_odonto').value;
                 if (pOdonto) {
                     google.script.run
                     .salvarPlanoColaboradorAPI(cid, pOdonto, null); 
                     // Obs: Odonto geralmente usa a mesma matricula ou independente? 
                     // Por simplicidade, assume-se que matricula é atrelada ao Saúde ou genérica na tabela colaboradores_planos.
                     // Se for necessário matricula especifica para odonto, precisaria de outro campo.
                     // O usuario pediu "Matricula" (singular) no prompt. Assumo Saude.
                 }
                 mostrarMensagem('✅ Dados salvos com sucesso!', 'success');
                 setTimeout(() => google.script.host.close(), 1500);
              };

              if (pSaude) {
                  google.script.run.withSuccessHandler(salvarOdonto)
                  .salvarPlanoColaboradorAPI(cid, pSaude, matriculaSaude); // Passando matricula em vez de qtd deps
              } else {
                  salvarOdonto();
              }
              
            } else {
              mostrarMensagem('❌ Erro: ' + resultado.error, 'error');
            }
          })
          .withFailureHandler(function(erro) {
            mostrarMensagem('❌ Erro ao salvar: ' + erro.message, 'error');
          })
          .atualizarColaboradorAPI(cpf, dadosAtualizados);
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
      // 1. Carregar Planos ao Abrir
      window.onload = function() {
          carregarListasPlanos(); 
      };

      let listaPlanosCache = [];

      function carregarListasPlanos() {
          google.script.run.withSuccessHandler(function(res) {
              if (res.success) {
                  listaPlanosCache = res.data;
                  popularSelects(res.data);
                  carregarPlanosDoUsuario();
              } else {
                  console.error('Erro ao listar planos:', res.error);
                  alert('Erro ao carregar planos: ' + res.error); // Alertar usuário
                  // Remover placeholder para não ficar travado
                  const selSaude = document.getElementById('plano_saude');
                  const selOdonto = document.getElementById('plano_odonto');
                  if(selSaude) selSaude.innerHTML = '<option value="">Erro ao carregar</option>';
                  if(selOdonto) selOdonto.innerHTML = '<option value="">Erro ao carregar</option>';
              }
          }).listarPlanosAPI();
      }

      function popularSelects(planos) {
          const selSaude = document.getElementById('plano_saude');
          const selOdonto = document.getElementById('plano_odonto');
          
          selSaude.innerHTML = '<option value="">Sem Plano</option>';
          selOdonto.innerHTML = '<option value="">Sem Plano</option>';
          
          planos.forEach(p => {
              const opt = document.createElement('option');
              opt.value = p.id;
              opt.textContent = p.nome + ' (R$ ' + (p.precos?.[0]?.valor || '?') + ')';
              
              if (p.tipo === 'SAUDE') selSaude.appendChild(opt);
              else if (p.tipo === 'ODONTO') selOdonto.appendChild(opt);
          });
      }

      let dependentesCache = [];

      function carregarPlanosDoUsuario() {
          const id = document.getElementById('colaborador_id').value;
          if (!id) return;

          // 1. Carregar Planos do Titular
          google.script.run.withSuccessHandler(function(res) {
              if (res.success && res.data) {
                  const planosUser = res.data;
                  // Limpar
                  document.getElementById('plano_saude').value = "";
                  document.getElementById('matricula_saude').value = "";
                  document.getElementById('plano_odonto').value = "";

                  planosUser.forEach(pu => {
                      if (pu.plano && pu.plano.tipo === 'SAUDE') {
                          document.getElementById('plano_saude').value = pu.plano_id;
                          // Preencher matrícula titular
                          if (pu.matricula) document.getElementById('matricula_saude').value = pu.matricula;
                      }
                      if (pu.plano && pu.plano.tipo === 'ODONTO') {
                          document.getElementById('plano_odonto').value = pu.plano_id;
                      }
                  });
              }
          }).buscarPlanosColaboradorAPI(id);

          // 2. Carregar Dependentes
          carregarDependentesUI(id);
      }

      function carregarDependentesUI(colabId) {
          document.getElementById('lista_dependentes').innerHTML = 'Carregando...';
          
          google.script.run.withSuccessHandler(function(res) {
              if (res.success) {
                  dependentesCache = res.data;
                  renderizarDependentes();
              } else {
                  document.getElementById('lista_dependentes').innerHTML = 'Erro ao carregar.';
              }
          }).listarDependentesAPI(colabId);
      }

      function renderizarDependentes() {
          const div = document.getElementById('lista_dependentes');
          if (dependentesCache.length === 0) {
              div.innerHTML = '<span style="color:#666;">Nenhum dependente cadastrado.</span>';
              return;
          }

          let html = '<table style="width:100%; border-collapse: collapse;">';
          html += '<tr style="background:#eee; text-align:left;"><th>Nome</th><th>CPF</th><th>Nasc.</th><th>Idade</th><th>Parentesco</th><th>Matrícula</th><th></th></tr>';
          
          dependentesCache.forEach(d => {
              const idade = calcularIdade(d.data_nasc);
              const dataFmt = d.data_nasc ? new Date(d.data_nasc).toLocaleDateString() : '';
              html += '<tr>' +
                '<td style="border-bottom:1px solid #ddd; padding:4px;">' + d.nome + '</td>' +
                '<td style="border-bottom:1px solid #ddd; padding:4px;">' + (d.cpf || '-') + '</td>' +
                '<td style="border-bottom:1px solid #ddd; padding:4px;">' + dataFmt + '</td>' +
                '<td style="border-bottom:1px solid #ddd; padding:4px;">' + idade + ' anos</td>' +
                '<td style="border-bottom:1px solid #ddd; padding:4px;">' + d.parentesco + '</td>' +
                '<td style="border-bottom:1px solid #ddd; padding:4px;">' + (d.matricula || '-') + '</td>' +
                '<td style="border-bottom:1px solid #ddd; padding:4px; text-align:right;">' +
                  '<span onclick="removerDependenteUI(\'' + d.id + '\')" style="cursor:pointer; color:red;">🗑️</span>' +
                '</td>' +
              '</tr>';
          });
          html += '</table>';
          div.innerHTML = html;
      }

      function calcularIdade(dataNasc) {
          const hoje = new Date();
          const nasc = new Date(dataNasc);
          let idade = hoje.getFullYear() - nasc.getFullYear();
          const m = hoje.getMonth() - nasc.getMonth();
          if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
              idade--;
          }
          return idade;
      }

      function adicionarDependenteUI() {
          const id = document.getElementById('colaborador_id').value;
          const nome = document.getElementById('dep_nome').value;
          const cpf = document.getElementById('dep_cpf').value;
          const nasc = document.getElementById('dep_nasc').value;
          const parentesco = document.getElementById('dep_parentesco').value;
          const matricula = document.getElementById('dep_matricula').value;

          if (!nome || !nasc || !parentesco) {
              alert('Preencha Nome, Data Nasc. e Parentesco!');
              return;
          }

          const btn = event.target;
          btn.textContent = '⏳';
          btn.disabled = true;

          const novoDep = {
              nome: nome,
              cpf: cpf,
              data_nasc: nasc,
              parentesco: parentesco,
              matricula: matricula
          };

          google.script.run.withSuccessHandler(function(res) {
              btn.textContent = '+';
              btn.disabled = false;
              if (res.success) {
                  // Limpar campos
                  document.getElementById('dep_nome').value = '';
                  document.getElementById('dep_cpf').value = '';
                  document.getElementById('dep_nasc').value = '';
                  document.getElementById('dep_matricula').value = '';
                  
                  // Recarregar lista
                  carregarDependentesUI(id);
              } else {
                  alert('Erro ao salvar: ' + res.error);
              }
          }).adicionarDependenteAPI(id, novoDep);
      }

      function removerDependenteUI(depId) {
          if(!confirm('Remover este dependente?')) return;
          const id = document.getElementById('colaborador_id').value;
          
          google.script.run.withSuccessHandler(function(res) {
              if (res.success) {
                  carregarDependentesUI(id);
              } else {
                  alert('Erro ao remover: ' + res.error);
              }
          }).removerDependenteAPI(depId);
      }
    </script>
  `).setWidth(500).setHeight(700);

    SpreadsheetApp.getUi().showModalDialog(html, 'Editar Colaborador');
}

function atualizarColaboradorAPI(cpf, dadosAtualizados) {
    try {
        const url = CONFIG.API_URL + '/colaboradores/' + cpf;
        const options = {
            method: 'put',
            contentType: 'application/json',
            payload: JSON.stringify(dadosAtualizados),
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
        Logger.log('Erro ao atualizar colaborador:', erro);
        return { success: false, error: erro.message };
    }
}

function excluirSelecionados() {
    const ui = SpreadsheetApp.getUi();

    const cpfs = obterCPFsSelecionados();
    if (cpfs.length === 0) {
        ui.alert('⚠️ Nenhum colaborador selecionado',
            'Marque os checkboxes dos colaboradores que deseja excluir.',
            ui.ButtonSet.OK);
        return;
    }

    const confirmacao = ui.alert(
        '⚠️ Confirmar Exclusão',
        `Deseja realmente excluir ${cpfs.length} colaborador(es)?\n\nEsta ação não pode ser desfeita!`,
        ui.ButtonSet.YES_NO
    );

    if (confirmacao !== ui.Button.YES) {
        return;
    }

    try {
        let sucessos = 0;
        let erros = 0;

        cpfs.forEach(cpf => {
            try {
                const url = CONFIG.API_URL + '/colaboradores/' + cpf;
                const options = {
                    method: 'delete',
                    muteHttpExceptions: true
                };

                const response = UrlFetchApp.fetch(url, options);
                const resultado = JSON.parse(response.getContentText());

                if (resultado.success) {
                    sucessos++;
                } else {
                    erros++;
                }
            } catch (erro) {
                erros++;
                Logger.log('Erro ao excluir CPF ' + cpf + ':', erro);
            }
        });

        // Atualizar lista
        buscarColaboradoresAPI({});

        ui.alert('Exclusão Concluída',
            `✅ ${sucessos} colaborador(es) excluído(s)\n❌ ${erros} erro(s)`,
            ui.ButtonSet.OK);

    } catch (erro) {
        ui.alert('❌ Erro', 'Erro ao excluir colaboradores: ' + erro.message, ui.ButtonSet.OK);
    }
}



// =====================================================
// API PROXIES FOR PLANS
// =====================================================

function listarPlanosAPI() {
    try {
        const url = CONFIG.API_URL + '/planos';
        const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
        return JSON.parse(response.getContentText());
    } catch (e) {
        return { success: false, error: e.message };
    }
}

function buscarPlanosColaboradorAPI(id) {
    try {
        const url = CONFIG.API_URL + '/colaboradores/' + id + '/planos';
        const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
        return JSON.parse(response.getContentText());
    } catch (e) {
        return { success: false, error: e.message };
    }
}

function salvarPlanoColaboradorAPI(id, planoId, dependentes) {
    try {
        const url = CONFIG.API_URL + '/colaboradores/' + id + '/planos';
        const options = {
            method: 'post',
            contentType: 'application/json',
            payload: JSON.stringify({ plano_id: planoId, dependente_qtd: dependentes }),
            muteHttpExceptions: true
        };
        const response = UrlFetchApp.fetch(url, options);
        return JSON.parse(response.getContentText());
    } catch (e) {
        return { success: false, error: e.message };
    }
}

function removerPlanoColaboradorAPI(id, planoId) {
    try {
        const url = CONFIG.API_URL + '/colaboradores/' + id + '/planos/' + planoId;
        const options = { method: 'delete', muteHttpExceptions: true };
        const response = UrlFetchApp.fetch(url, options);
        return JSON.parse(response.getContentText());
    } catch (e) {
        return { success: false, error: e.message };
    }
}

// =====================================================
// HISTÓRICO DE VERSÕES (SNAPSHOTS)
// =====================================================

function listarHistoricoModal() {
    const html = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
      h2 { color: #1a73e8; border-bottom: 2px solid #eee; padding-bottom: 10px; }
      .loading { text-align: center; color: #666; margin-top: 20px; }
      table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
      th { text-align: left; background: #f8f9fa; padding: 10px; border-bottom: 2px solid #dee2e6; color: #495057; }
      td { padding: 10px; border-bottom: 1px solid #dee2e6; vertical-align: middle; }
      tr:hover { background-color: #f1f3f4; }
      .badge { padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
      .badge-folha { background: #e8f0fe; color: #1967d2; }
      .badge-beneficios { background: #fce8e6; color: #c5221f; }
      .badge-variavel { background: #e6f4ea; color: #137333; }
      .badge-apontamentos { background: #fef7e0; color: #ea8600; }
      button { background: #fff; border: 1px solid #dadce0; color: #1a73e8; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: 500; transition: all 0.2s; }
      button:hover { background: #1a73e8; color: #fff; border-color: #1a73e8; }
      button.load { color: #137333; border-color: #ceead6; }
      button.load:hover { background: #137333; color: white; border-color: #137333; }
    </style>
    
    <h2>📜 Histórico de Envios</h2>
    <div id="content" class="loading">Carregando histórico...</div>
    
    <script>
      function carregar() {
        google.script.run
          .withSuccessHandler(renderizar)
          .withFailureHandler(err => document.getElementById('content').innerHTML = 'Erro: ' + err.message)
          .buscarHistoricoAPI();
      }
      
      function renderizar(dados) {
        if (!dados || dados.length === 0) {
          document.getElementById('content').innerHTML = '<p>Nenhum histórico encontrado.</p>';
          return;
        }
        
        let html = '<table><thead><tr><th>Data</th><th>Tipo</th><th>Ref</th><th>Ação</th></tr></thead><tbody>';
        
        dados.forEach(item => {
          const data = new Date(item.created_at).toLocaleString('pt-BR');
          const tipoClass = 'badge-' + item.tipo;
          const mes = item.mes_referencia ? String(item.mes_referencia).padStart(2,'0') : '--';
          const ano = item.ano_referencia || '----';
          
          html += '<tr>';
          html += '<td>' + data + '</td>';
          html += '<td><span class="badge ' + tipoClass + '">' + item.tipo + '</span></td>';
          html += '<td>' + mes + '/' + ano + '</td>';
          html += '<td><button class="load" onclick="carregarSnapshot(\\'' + item.id + '\\', \\'' + item.tipo + '\\')">📂 Abrir</button></td>';
          html += '</tr>';
        });
        
        html += '</tbody></table>';
        document.getElementById('content').innerHTML = html;
      }
      
      function carregarSnapshot(id, tipo) {
        // Agora a confirmação é feita no Backend (Modal do Sheets)
        
        document.getElementById('content').innerHTML = '<div class="loading">⏳ Processando solicitação... Verifique o Google Sheets.</div>';
        
        google.script.run
            .withSuccessHandler((res) => {
                 if(res && res.cancelado) {
                     // Recarrega a lista se cancelou
                     carregar();
                 } else {
                     google.script.host.close();
                 }
            })
            .withFailureHandler(err => {
                alert('Erro: ' + err.message);
                carregar();
            })
            .carregarSnapshotGAS(id, tipo);
      }
      
      window.onload = carregar;
    </script>
    `).setWidth(600).setHeight(500);
    SpreadsheetApp.getUi().showModalDialog(html, 'Histórico de Versões');
}

function buscarHistoricoAPI() {
    try {
        const url = CONFIG.API_URL + '/relatorios/historico';
        const options = {
            method: 'post',
            contentType: 'application/json',
            payload: JSON.stringify({ limit: 20 }),
            muteHttpExceptions: true
        };
        const response = UrlFetchApp.fetch(url, options);
        const res = JSON.parse(response.getContentText());
        return res.success ? res.historico : [];
    } catch (e) {
        throw new Error('Falha na API: ' + e.message);
    }
}

function carregarSnapshotGAS(id, tipo) {
    const ui = SpreadsheetApp.getUi();
    const resp = ui.alert(
        '📂 Carregar Histórico',
        'Deseja carregar esta versão antiga?\n\nIsso criará uma nova aba de "Lançamento" com os dados recuperados para correção.',
        ui.ButtonSet.YES_NO
    );

    if (resp == ui.Button.NO) {
        return { cancelado: true };
    }

    // 1. Buscar detalhes
    const url = CONFIG.API_URL + '/relatorios/historico/' + id;
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const res = JSON.parse(response.getContentText());

    if (!res.success) throw new Error(res.error);

    const header = res.relatorio;
    const itens = res.itens;

    if (!periodoEhValido(header)) throw new Error('Dados de período inválidos no snapshot.');

    const periodo = { mes: header.mes_referencia, ano: header.ano_referencia };

    // Obter CPFs do snapshot para recriar as linhas
    // (Poderíamos usar header.filtros_usados.cpfs, mas relatorios_itens é mais garantido sobre o que foi salvo)
    const cpfs = itens.map(i => i.cpf).filter(c => c);
    const dadosMap = {};
    itens.forEach(i => {
        if (!dadosMap[i.cpf]) dadosMap[i.cpf] = [];
        dadosMap[i.cpf].push(i.dados_snapshot);
    });

    // Switch tipo
    if (tipo === 'folha') {
        const nomeAba = `Lançamento Folha ${periodo.mes}-${periodo.ano} (Recup)`;
        // PRECISO ADAPTAR criarPlanilhaLancamentoFolha PARA ACEITAR DADOS
        // Por enquanto, vou criar a aba e preencher "manualmente" aqui ou refatorar a função.
        // Melhor refatorar a função original para aceitar (cpfs, periodo, DADOS_PREENCHIDOS)
        criarPlanilhaLancamentoFolha(cpfs, periodo, dadosMap);
        SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().setName(nomeAba); // Renomear para evitar conflito
    } else if (tipo === 'beneficios') {
        // Benefícios precisa de 'dadosCompletos' (lookup cidade) + 'dadosValores' (snapshot)
        const dadosCompletos = buscarDadosColaboradores(cpfs);
        criarPlanilhaBeneficiosCaju(cpfs, periodo, dadosCompletos, dadosMap);
    } else if (tipo === 'variavel') {
        criarPlanilhaVariavel(cpfs, periodo, dadosMap);
    } else if (tipo === 'apontamentos') {
        criarPlanilhaLancamentoApontamentos(cpfs, periodo, dadosMap);
    }

    SpreadsheetApp.getUi().alert('✅ Versão Recuperada!',
        `Os dados da versão de ${new Date(header.created_at).toLocaleString()} foram carregados.\n\nFaça as correções e envie novamente (criará uma nova versão).`,
        SpreadsheetApp.getUi().ButtonSet.OK);
}

function periodoEhValido(h) {
    return h.mes_referencia && h.ano_referencia;
}

function onEdit(e) {
    if (!e) return;
    const sheet = e.range.getSheet();
    const name = sheet.getName();
    const row = e.range.getRow();
    const col = e.range.getColumn();

    // 1. SELECT ALL (Aba Colaboradores)
    // Checkbox no cabeçalho (Linha 5, Coluna 1)
    if (name === CONFIG.ABAS.COLABORADORES && row === 5 && col === 1) {
        const isChecked = e.range.getValue() === true;
        selecionarTodosColaboradores(sheet, isChecked);
    }

    // 2. MÁSCARA INTELIGENTE DE DATA (Abas de Lançamento)
    if (name.includes('Lançamento') && e.value) {
        formatarDataInteligente(e);
    }
}

function selecionarTodosColaboradores(sheet, checked) {
    const lastRow = sheet.getLastRow();
    if (lastRow < 6) return;

    // Coluna 1 (A) da linha 6 até o fim
    const range = sheet.getRange(6, 1, lastRow - 5, 1);

    // Checkbox precisa de booleano ou "TRUE"/"FALSE"
    const values = [];
    for (let i = 0; i < lastRow - 5; i++) {
        values.push([checked]);
    }
    range.setValues(values);
}

function formatarDataInteligente(e) {
    const sheet = e.range.getSheet();
    const col = e.range.getColumn();
    const header = sheet.getRange(1, col).getValue();

    const termosData = ['data', 'nascimento', 'admissao', 'pagto', 'referência', 'inicio', 'fim', 'entrada', 'saída'];
    const headerLower = String(header).toLowerCase();

    const ehColunaData = termosData.some(termo => headerLower.includes(termo));

    if (!ehColunaData) return;

    const val = String(e.value).replace(/\D/g, '');

    if (val.length === 6) {
        // Tenta DDMMAA (Ex: 011225 -> 01/12/2025)
        const d = parseInt(val.substring(0, 2));
        const m = parseInt(val.substring(2, 4));
        const a = parseInt(val.substring(4, 6)); // 25

        // Se Mes > 12, provavelmente é MMAAAA (Ex: 122025)
        if (m > 12) {
            const mesFull = parseInt(val.substring(0, 2));
            const anoFull = parseInt(val.substring(2, 6));
            if (mesFull >= 1 && mesFull <= 12 && anoFull >= 2000) {
                dia = '01';
                mes = val.substring(0, 2);
                ano = val.substring(2, 6);
            }
        } else {
            // DDMMAA Padrão
            dia = val.substring(0, 2);
            mes = val.substring(2, 4);
            ano = '20' + val.substring(4, 6);
        }
    } else if (val.length === 8) {
        // DDMMAAAA
        dia = val.substring(0, 2);
        mes = val.substring(2, 4);
        ano = val.substring(4, 8);
    } else {
        return;
    }

    if (!dia || parseInt(mes) > 12 || parseInt(mes) === 0 || parseInt(dia) > 31 || parseInt(dia) === 0) {
        return;
    }

    const dataFmt = `${dia}/${mes}/${ano}`;
    e.range.setValue(dataFmt);
}

// =====================================================
// DEPENDENTES API PROXIES
// =====================================================

function listarDependentesAPI(colaboradorId) {
    try {
        const url = CONFIG.API_URL + '/colaboradores/' + colaboradorId + '/dependentes';
        const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
        return JSON.parse(response.getContentText());
    } catch (e) {
        return { success: false, error: e.message };
    }
}

function adicionarDependenteAPI(colaboradorId, dados) {
    try {
        const url = CONFIG.API_URL + '/colaboradores/' + colaboradorId + '/dependentes';
        const options = {
            method: 'post',
            contentType: 'application/json',
            payload: JSON.stringify(dados),
            muteHttpExceptions: true
        };
        const response = UrlFetchApp.fetch(url, options);
        return JSON.parse(response.getContentText());
    } catch (e) {
        return { success: false, error: e.message };
    }
}

function removerDependenteAPI(dependenteId) {
    try {
        const url = CONFIG.API_URL + '/dependentes/' + dependenteId;
        const options = {
            method: 'delete',
            muteHttpExceptions: true
        };
        const response = UrlFetchApp.fetch(url, options);
        return JSON.parse(response.getContentText());
    } catch (e) {
        return { success: false, error: e.message };
    }
}
