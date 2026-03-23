// =====================================================
// CORREÇÕES DASHBOARD - MESCLAR NO google-apps-script.js
// =====================================================
// Substituir as funções buscarDashboardAPI() e abrirDashboardModal()
// pelas versões abaixo que incluem:
// 1. Suporte a filtros (mes/ano/depto)
// 2. Barra de filtros na UI
// 3. Funções popularDepartamentos(), limparFiltros(), aplicarFiltros()
// =====================================================

// ===== SUBSTITUIR ESTA FUNÇÃO =====
function buscarDashboardAPI(filtros) {
    try {
        var options = {
            method: 'get',
            headers: { 'Content-Type': 'application/json' },
            muteHttpExceptions: true
        };

        // Construir query string com filtros
        var queryString = '';
        if (filtros) {
            var parts = [];
            if (filtros.mes) parts.push('mes=' + encodeURIComponent(filtros.mes));
            if (filtros.ano) parts.push('ano=' + encodeURIComponent(filtros.ano));
            if (filtros.departamento) parts.push('departamento=' + encodeURIComponent(filtros.departamento));
            if (parts.length > 0) queryString = '?' + parts.join('&');
        }

        var url = CONFIG.API_URL + '/dashboard/kpis' + queryString;
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

// ===== SUBSTITUIR ESTA FUNÇÃO =====
function abrirDashboardModal() {
    var ui = SpreadsheetApp.getUi();
    var dashboardData = buscarDashboardAPI(null);

    var srvTag = '<script type="application/json" id="srvdashboard">' + JSON.stringify(dashboardData).replace(/<\//g, '\\u003c/') + '<\/script>\n';

    var htmlContent = srvTag +
        '<!-- HTML START -->\n' +
        '<!DOCTYPE html>\n' +
        '<html lang="pt-BR">\n' +
        '<head>\n' +
        '  <meta charset="UTF-8">\n' +
        '  <base target="_top">\n' +
        '  <script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>\n' +
        '  <style>\n' +
        '    :root {\n' +
        '      --primary: #1a73e8;\n' +
        '      --primary-dark: #1557b0;\n' +
        '      --primary-light: #e8f0fe;\n' +
        '      --success: #1e8e3e;\n' +
        '      --success-light: #e6f4ea;\n' +
        '      --warning: #f9ab00;\n' +
        '      --warning-light: #fef7e0;\n' +
        '      --danger: #d93025;\n' +
        '      --danger-light: #fce8e6;\n' +
        '      --bg-main: #f3f4f6;\n' +
        '      --bg-card: #ffffff;\n' +
        '      --text-main: #202124;\n' +
        '      --text-muted: #5f6368;\n' +
        '      --border: #e2e8f0;\n' +
        '      --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);\n' +
        '      --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);\n' +
        '    }\n' +
        '    * { box-sizing: border-box; }\n' +
        '    body { \n' +
        '      font-family: \'Inter\', -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; \n' +
        '      background-color: var(--bg-main); \n' +
        '      color: var(--text-main);\n' +
        '      margin: 0;\n' +
        '      padding: 0;\n' +
        '    }\n' +
        '    .dashboard-header {\n' +
        '      background: var(--bg-card);\n' +
        '      padding: 16px 24px;\n' +
        '      display: flex;\n' +
        '      justify-content: space-between;\n' +
        '      align-items: center;\n' +
        '      border-bottom: 1px solid var(--border);\n' +
        '      box-shadow: var(--shadow-sm);\n' +
        '    }\n' +
        '    .dashboard-header h2 {\n' +
        '      margin: 0;\n' +
        '      font-size: 20px;\n' +
        '      font-weight: 700;\n' +
        '      color: var(--primary-dark);\n' +
        '      display: flex;\n' +
        '      align-items: center;\n' +
        '      gap: 12px;\n' +
        '    }\n' +
        '    .ticker-container {\n' +
        '      width: 100%;\n' +
        '      background: linear-gradient(135deg, #1a73e8 0%, #1557b0 100%);\n' +
        '      color: white;\n' +
        '      overflow: hidden;\n' +
        '      padding: 10px 0;\n' +
        '      box-shadow: inset 0 -2px 4px rgba(0,0,0,0.1);\n' +
        '    }\n' +
        '    .ticker-wrapper { width: 100%; overflow: hidden; }\n' +
        '    .ticker { display: flex; white-space: nowrap; animation: scroll 30s linear infinite; }\n' +
        '    .ticker:hover { animation-play-state: paused; }\n' +
        '    .ticker-item {\n' +
        '      display: inline-flex; align-items: center; margin-right: 40px; cursor: default;\n' +
        '      padding: 6px 16px; border-radius: 20px; background: rgba(255,255,255,0.1);\n' +
        '      transition: background 0.3s; font-size: 13px; font-weight: 500;\n' +
        '    }\n' +
        '    .ticker-item:hover { background: rgba(255,255,255,0.2); }\n' +
        '    @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }\n' +
        '    .container { padding: 24px; max-width: 1600px; margin: 0 auto; }\n' +
        '    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }\n' +
        '    .kpi-card {\n' +
        '      background: var(--bg-card); padding: 20px; border-radius: 12px;\n' +
        '      box-shadow: var(--shadow-sm); border: 1px solid var(--border);\n' +
        '      display: flex; flex-direction: column; position: relative; overflow: hidden;\n' +
        '      transition: transform 0.2s, box-shadow 0.2s;\n' +
        '    }\n' +
        '    .kpi-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }\n' +
        '    .kpi-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }\n' +
        '    .kpi-icon { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }\n' +
        '    .kpi-icon svg { width: 20px; height: 20px; stroke-width: 2; stroke: currentColor; fill: none; }\n' +
        '    .kpi-title { font-size: 13px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }\n' +
        '    .kpi-value { font-size: 28px; font-weight: 800; color: var(--text-main); margin-bottom: 8px; }\n' +
        '    .kpi-footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto; }\n' +
        '    .pill { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; }\n' +
        '    .pill.up { color: var(--success); background: var(--success-light); }\n' +
        '    .pill.down { color: var(--danger); background: var(--danger-light); }\n' +
        '    .pill.neutral { color: var(--text-muted); background: var(--bg-main); }\n' +
        '    .sparkline { width: 60px; height: 24px; stroke-width: 2; fill: none; }\n' +
        '    .chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }\n' +
        '    .chart-card { background: var(--bg-card); padding: 24px; border-radius: 12px; box-shadow: var(--shadow-sm); border: 1px solid var(--border); }\n' +
        '    .chart-card h3 { font-size: 16px; font-weight: 600; margin-top: 0; margin-bottom: 16px; color: var(--text-main); }\n' +
        '    .chart-container { width: 100%; height: 320px; }\n' +
        '    .insights-panel {\n' +
        '      background: linear-gradient(to right, #f8fafc, #ffffff); border-left: 4px solid var(--primary);\n' +
        '      padding: 20px 24px; border-radius: 8px; box-shadow: var(--shadow-sm);\n' +
        '      border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); border-right: 1px solid var(--border);\n' +
        '    }\n' +
        '    .insights-title { font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px; color: var(--primary-dark); margin-bottom: 16px; }\n' +
        '    .insights-list { display: flex; flex-direction: column; gap: 12px; }\n' +
        '    .insight-item { display: flex; align-items: flex-start; gap: 12px; font-size: 14px; line-height: 1.5; }\n' +
        '    .loading-state, .error-state { padding: 60px; text-align: center; font-size: 16px; color: var(--text-muted); }\n' +
        '    .error-state { color: var(--danger); background: var(--danger-light); border-radius: 8px; border: 1px solid #f87171; }\n' +
        '  </style>\n' +
        '</head>\n' +
        '<body>\n' +
        '  <div class="dashboard-header">\n' +
        '    <h2>\n' +
        '      <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>\n' +
        '      Dashboard Gerencial RH\n' +
        '    </h2>\n' +
        '    <div style="font-size: 13px; color: var(--text-muted);">Atualizado em tempo real</div>\n' +
        '  </div>\n' +
        '  <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>\n' +
        '  <div id="filtros_bar" style="display:flex;gap:12px;align-items:center;padding:10px 24px;background:var(--bg-card);border-bottom:1px solid var(--border);flex-wrap:wrap;">\n' +
        '    <div style="display:flex;align-items:center;gap:8px;">\n' +
        '        <label style="font-size:13px;color:var(--text-muted);white-space:nowrap;">Período:</label>\n' +
        '        <select id="f_mes" style="padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:13px;">\n' +
        '            <option value="">Mês atual</option>\n' +
        '            <option value="1">Janeiro</option><option value="2">Fevereiro</option>\n' +
        '            <option value="3">Março</option><option value="4">Abril</option>\n' +
        '            <option value="5">Maio</option><option value="6">Junho</option>\n' +
        '            <option value="7">Julho</option><option value="8">Agosto</option>\n' +
        '            <option value="9">Setembro</option><option value="10">Outubro</option>\n' +
        '            <option value="11">Novembro</option><option value="12">Dezembro</option>\n' +
        '        </select>\n' +
        '        <input type="number" id="f_ano" value="2025" min="2020" max="2030" style="width:80px;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:13px;">\n' +
        '    </div>\n' +
        '    <div style="display:flex;align-items:center;gap:8px;">\n' +
        '        <label style="font-size:13px;color:var(--text-muted);">Depto:</label>\n' +
        '        <select id="f_depto" style="padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:13px;">\n' +
        '            <option value="">Todos</option>\n' +
        '        </select>\n' +
        '    </div>\n' +
        '    <button onclick="aplicarFiltros()" style="padding:6px 16px;background:var(--primary);color:white;border:none;border-radius:6px;font-size:13px;cursor:pointer;font-weight:600;">🔍 Aplicar</button>\n' +
        '    <button onclick="limparFiltros()" style="padding:6px 12px;background:transparent;color:var(--text-muted);border:1px solid var(--border);border-radius:6px;font-size:13px;cursor:pointer;">✕ Limpar</button>\n' +
        '    <span id="filtro_status" style="font-size:12px;color:var(--text-muted);margin-left:8px;"></span>\n' +
        '  </div>\n' +
        '  <div class="ticker-container" id="ticker-container" style="display:none;">\n' +
        '    <div class="ticker-wrapper">\n' +
        '      <div class="ticker" id="ticker-content"></div>\n' +
        '    </div>\n' +
        '  </div>\n' +
        '  <div class="container" id="content_area">\n' +
        '    <div class="loading-state">\n' +
        '       <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>\n' +
        '       <div style="margin-top: 16px;">Processando métricas no servidor...</div>\n' +
        '    </div>\n' +
        '  </div>\n' +
        '  <script>\n' +
        '    var formatBRL = new Intl.NumberFormat(\'pt-BR\', { style: \'currency\', currency: \'BRL\' });\n' +
        '    var formatNum = new Intl.NumberFormat(\'pt-BR\');\n' +
        '    \n' +
        '    function aplicarFiltros() {\n' +
        '        var mes = document.getElementById("f_mes").value;\n' +
        '        var ano = document.getElementById("f_ano").value;\n' +
        '        var depto = document.getElementById("f_depto").value;\n' +
        '        var status = document.getElementById("filtro_status");\n' +
        '        if (status) status.textContent = "⏳ Buscando...";\n' +
        '        document.getElementById("content_area").innerHTML = \'<div class="loading-state"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg><div style="margin-top: 16px;">Aplicando filtros...</div></div>\';\n' +
        '        var params = {\n' +
        '            mes: mes,\n' +
        '            ano: ano ? parseInt(ano) : "",\n' +
        '            departamento: depto\n' +
        '        };\n' +
        '        google.script.run.withSuccessHandler(function(data) {\n' +
        '            if (status) status.textContent = depto ? "Filtrado: " + depto : (mes ? "Filtrado: " + mes + "/" + (ano || "") : "");\n' +
        '            if (data && data.success) { \n' +
        '                google.charts.load("current", {"packages":["corechart","line","bar"]});\n' +
        '                google.charts.setOnLoadCallback(function() { renderizarDashboard(data); });\n' +
        '            } else { mostrarErro(data ? data.error : "Erro filtrando dashboard"); }\n' +
        '        }).withFailureHandler(function(err) {\n' +
        '            if (status) status.textContent = "";\n' +
        '            mostrarErro("Falha ao filtrar: " + err.message);\n' +
        '        }).buscarDashboardAPI(params);\n' +
        '    }\n' +
        '    \n' +
        '    function limparFiltros() {\n' +
        '        document.getElementById("f_mes").value = "";\n' +
        '        document.getElementById("f_ano").value = "";\n' +
        '        document.getElementById("f_depto").value = "";\n' +
        '        var status = document.getElementById("filtro_status");\n' +
        '        if (status) status.textContent = "";\n' +
        '        aplicarFiltros();\n' +
        '    }\n' +
        '    \n' +
        '    function popularDepartamentos(graficos) {\n' +
        '        var sel = document.getElementById("f_depto");\n' +
        '        if (!sel || !graficos || !graficos.departamentos) return;\n' +
        '        graficos.departamentos.forEach(function(d) {\n' +
        '            var opt = document.createElement("option");\n' +
        '            opt.value = d[0]; opt.textContent = d[0];\n' +
        '            sel.appendChild(opt);\n' +
        '        });\n' +
        '    }\n' +
        '    \n' +
        '    function navegarPara(acao) {\n' +
        '        var mapaAcoes = { "colaboradores": "buscarColaboradorModal", "folha": "lancarFolha", "beneficios": "lancarBeneficios", "variavel": "lancarVariavel" };\n' +
        '        var funcao = mapaAcoes[acao];\n' +
        '        if (!funcao) return;\n' +
        '        google.script.host.close();\n' +
        '        google.script.run.withFailureHandler(function(err){alert("Erro: "+err.message);})[funcao]();\n' +
        '    }\n' +
        '    \n' +
        '    var icons = {\n' +
        '        users: \'<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>\',\n' +
        '        userOff: \'<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="18" y1="8" x2="23" y2="13"></line><line x1="23" y1="8" x2="18" y2="13"></line></svg>\',\n' +
        '        money: \'<svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>\',\n' +
        '        gift: \'<svg viewBox="0 0 24 24"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>\',\n' +
        '        chart: \'<svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>\',\n' +
        '        refresh: \'<svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>\',\n' +
        '        target: \'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>\',\n' +
        '        ticket: \'<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="7" y1="4" x2="7" y2="20"></line><line x1="17" y1="4" x2="17" y2="20"></line></svg>\'\n' +
        '    };\n' +
        '    window.onload = function() {\n' +
        '        var el = document.getElementById(\'srvdashboard\');\n' +
        '        if (el) {\n' +
        '            try {\n' +
        '                var data = JSON.parse(el.textContent);\n' +
        '                if (data && data.success) {\n' +
        '                    google.charts.load(\'current\', {\'packages\':[\'corechart\', \'line\', \'bar\']});\n' +
        '                    google.charts.setOnLoadCallback(function() { renderizarDashboard(data); });\n' +
        '                } else { mostrarErro(data ? data.error : \'Erro desconhecido na API\'); }\n' +
        '            } catch(e) { mostrarErro("Erro de parsing: " + e.message); }\n' +
        '        } else { mostrarErro("Falha: Payload JSON do servidor não encontrado."); }\n' +
        '    };\n' +
        '    function mostrarErro(msg) { document.getElementById(\'content_area\').innerHTML = \'<div class="error-state">❌ \' + msg + \'</div>\'; }\n' +
        '    function renderizarDashboard(payload) {\n' +
        '        var html = \'\';\n' +
        '        var k = payload.kpis;\n' +
        '        if (k) {\n' +
        '            document.getElementById(\'ticker-container\').style.display = \'block\';\n' +
        '            var itensTk = [\n' +
        '                { texto: \'Ativos: \' + formatNum.format(k.ativos.valor), acao: \'colaboradores\' },\n' +
        '                { texto: \'Folha: \' + formatBRL.format(k.folha.valor), acao: \'folha\' },\n' +
        '                { texto: \'Benefícios: \' + formatBRL.format(k.beneficios.valor), acao: \'beneficios\' },\n' +
        '                { texto: \'Variável: \' + formatBRL.format(k.variavel.valor), acao: \'variavel\' },\n' +
        '                { texto: \'Turnover: \' + (k.turnover.valor).toFixed(1) + \'%\', acao: \'turnover\' }\n' +
        '            ];\n' +
        '            var htmlTk = \'\';\n' +
        '            var itemsLoop = itensTk.concat(itensTk, itensTk);\n' +
        '            itemsLoop.forEach(function(item) { \n' +
        '                htmlTk += \'<span class="ticker-item" onclick="navegarPara(\\\'" + item.acao + \'\\\')" style="cursor:pointer;margin-right:40px;">📌 \' + item.texto + \'</span>\'; \n' +
        '            });\n' +
        '            document.getElementById(\'ticker-content\').innerHTML = htmlTk;\n' +
        '        }\n' +
        '        html += \'<div class="kpi-grid">\';\n' +
        '        html += buildKpiCard(\'Colab. Ativos\', k.ativos.valor, k.ativos.variacao, k.ativos.sparkline, icons.users, false);\n' +
        '        html += buildKpiCard(\'Colab. Inativos\', k.inativos.valor, k.inativos.variacao, k.inativos.sparkline, icons.userOff, true); \n' +
        '        html += buildKpiCard(\'Folha Bruta\', formatBRL.format(k.folha.valor), k.folha.variacao, k.folha.sparkline, icons.money, true);\n' +
        '        html += buildKpiCard(\'Benefícios Totais\', formatBRL.format(k.beneficios.valor), k.beneficios.variacao, k.beneficios.sparkline, icons.gift, true);\n' +
        '        html += buildKpiCard(\'Variável / Bônus\', formatBRL.format(k.variavel.valor), k.variavel.variacao, k.variavel.sparkline, icons.chart, false);\n' +
        '        html += buildKpiCard(\'Turnover Mês\', k.turnover.valor.toFixed(1) + \'%\', k.turnover.variacao, k.turnover.sparkline, icons.refresh, true);\n' +
        '        html += buildKpiCard(\'Vagas Abertas\', k.vagas.valor, k.vagas.variacao, k.vagas.sparkline, icons.target, false);\n' +
        '        html += buildKpiCard(\'Ticket Médio\', formatBRL.format(k.ticketMedio.valor), k.ticketMedio.variacao, k.ticketMedio.sparkline, icons.ticket, false);\n' +
        '        html += \'</div><div class="chart-grid">\';\n' +
        '        html += \'<div class="chart-card"><h3>Evolução da Folha (6 Meses)</h3><div id="cEvolucao" class="chart-container"></div></div>\';\n' +
        '        html += \'<div class="chart-card"><h3>Distribuição por Departamento</h3><div id="cDeptos" class="chart-container"></div></div>\';\n' +
        '        html += \'<div class="chart-card"><h3>Top Performers (Variável)</h3><div id="cPerformers" class="chart-container"></div></div>\';\n' +
        '        html += \'<div class="chart-card"><h3>Histórico de Admissões (12 Meses)</h3><div id="cAdmissoes" class="chart-container"></div></div>\';\n' +
        '        html += \'</div><div class="insights-panel">\';\n' +
        '        html += \'<div class="insights-title"><svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> Insights Inteligentes</div>\';\n' +
        '        html += \'<div class="insights-list" id="insights_content">Gerando insights...</div></div>\';\n' +
        '        document.getElementById(\'content_area\').innerHTML = html;\n' +
        '        if (payload.graficos) {\n' +
        '            popularDepartamentos(payload.graficos);\n' +
        '            desenharGraficoEvolucao(payload.graficos.evolucao);\n' +
        '            desenharGraficoDeptos(payload.graficos.departamentos);\n' +
        '            desenharGraficoPerformers(payload.graficos.performers);\n' +
        '            desenharGraficoAdmissoes(payload.graficos.contratacoes);\n' +
        '        }\n' +
        '        document.getElementById(\'insights_content\').innerHTML = compilarInsights(payload.kpis, payload.graficos);\n' +
        '    }\n' +
        '    function buildKpiCard(title, value, varMoM, sparkArray, iconSvg, inverseColors) {\n' +
        '        var bgClass = \'neutral\', arrow = \'→\', varFormatada = Math.abs(varMoM).toFixed(1) + \'%\';\n' +
        '        if (varMoM > 0.1) { bgClass = inverseColors ? \'down\' : \'up\'; arrow = \'↑\'; } \n' +
        '        else if (varMoM < -0.1) { bgClass = inverseColors ? \'up\' : \'down\'; arrow = \'↓\'; }\n' +
        '        var strokeColor = \'#475569\';\n' +
        '        if (bgClass === \'up\') strokeColor = \'var(--success)\';\n' +
        '        if (bgClass === \'down\') strokeColor = \'var(--danger)\';\n' +
        '        return \'<div class="kpi-card"><div class="kpi-header"><div class="kpi-title">\' + title + \'</div><div class="kpi-icon" style="background:var(--primary-light); color:var(--primary)">\' + iconSvg + \'</div></div><div class="kpi-value">\' + value + \'</div><div class="kpi-footer"><div class="pill \' + bgClass + \'">\' + arrow + \' \' + varFormatada + \'</div>\' + gerarSparkline(sparkArray, strokeColor) + \'</div></div>\';\n' +
        '    }\n' +
        '    function gerarSparkline(dataArr, color) {\n' +
        '        if (!dataArr || dataArr.length < 2) return \'\';\n' +
        '        var max = Math.max.apply(null, dataArr), min = Math.min.apply(null, dataArr), range = max - min || 1;\n' +
        '        var width = 60, height = 24, stepX = width / (dataArr.length - 1);\n' +
        '        var pts = dataArr.map(function(val, idx) { return (idx * stepX) + \',\' + (height - (((val - min) / range) * height)); }).join(\' \');\n' +
        '        return \'<svg class="sparkline" stroke="\' + color + \'"><polyline points="\' + pts + \'"></polyline></svg>\';\n' +
        '    }\n' +
        '    function desenharGraficoEvolucao(evolucaoData) {\n' +
        '        if(!evolucaoData || evolucaoData.length === 0) return;\n' +
        '        var data = new google.visualization.DataTable();\n' +
        '        data.addColumn(\'string\', \'Mês\'); data.addColumn(\'number\', \'Folha (R$)\'); data.addColumn(\'number\', \'Benefícios (R$)\');\n' +
        '        evolucaoData.slice().reverse().forEach(function(item) { data.addRow([item.mes, item.folha || 0, item.beneficios || 0]); });\n' +
        '        var options = { fontName: \'Inter\', colors: [\'#1a73e8\', \'#1e8e3e\'], chartArea: { width: \'85%\', height: \'70%\' }, legend: { position: \'top\' }, vAxis: { minValue: 0, textStyle: { color: \'#5f6368\'}, gridlines: { color: \'#e2e8f0\'} }, hAxis: { textStyle: { color: \'#5f6368\'} }, animation: { startup: true, duration: 800, easing: \'out\' }, lineWidth: 3, pointSize: 5 };\n' +
        '        new google.visualization.AreaChart(document.getElementById(\'cEvolucao\')).draw(data, options);\n' +
        '    }\n' +
        '    function desenharGraficoDeptos(depsData) {\n' +
        '        if(!depsData || depsData.length === 0) return;\n' +
        '        var data = new google.visualization.DataTable();\n' +
        '        data.addColumn(\'string\', \'Departamento\'); data.addColumn(\'number\', \'Ativos\');\n' +
        '        depsData.sort(function(a,b) { return b[1] - a[1]; }).forEach(function(row) { data.addRow([row[0], parseInt(row[1])||0]); });\n' +
        '        var options = { fontName: \'Inter\', colors: [\'#4285f4\', \'#34a853\', \'#fbbc04\', \'#ea4335\', \'#9c27b0\', \'#00bcd4\'], chartArea: { width: \'90%\', height: \'80%\' }, pieHole: 0.45, legend: { position: \'right\', textStyle: { fontSize: 13 } } };\n' +
        '        new google.visualization.PieChart(document.getElementById(\'cDeptos\')).draw(data, options);\n' +
        '    }\n' +
        '    function desenharGraficoPerformers(perfData) {\n' +
        '        if(!perfData || perfData.length === 0) return;\n' +
        '        var data = new google.visualization.DataTable();\n' +
        '        data.addColumn(\'string\', \'Colaborador\'); data.addColumn(\'number\', \'Comissão (R$)\');\n' +
        '        perfData.forEach(function(p) { data.addRow([p.nome, p.valor]); });\n' +
        '        var options = { fontName: \'Inter\', colors: [\'#f9ab00\'], chartArea: { width: \'70%\', height: \'80%\' }, legend: { position: \'none\' }, hAxis: { textStyle: { color: \'#5f6368\'} }, vAxis: { textStyle: { color: \'#202124\', fontSize: 12, bold: true } }, animation: { startup: true, duration: 800, easing: \'out\' } };\n' +
        '        new google.visualization.BarChart(document.getElementById(\'cPerformers\')).draw(data, options);\n' +
        '    }\n' +
        '    function desenharGraficoAdmissoes(admData) {\n' +
        '        if(!admData || admData.length === 0) return;\n' +
        '        var data = new google.visualization.DataTable();\n' +
        '        data.addColumn(\'string\', \'Mês\'); data.addColumn(\'number\', \'Admissões\');\n' +
        '        admData.slice().reverse().forEach(function(a) { data.addRow([a.mes, a.valor]); });\n' +
        '        var options = { fontName: \'Inter\', colors: [\'#9c27b0\'], chartArea: { width: \'85%\', height: \'70%\' }, legend: { position: \'none\' }, vAxis: { minValue: 0, format: \'#\', gridlines: { color: \'#e2e8f0\'} }, animation: { startup: true, duration: 800, easing: \'out\' }, lineWidth: 2 };\n' +
        '        new google.visualization.LineChart(document.getElementById(\'cAdmissoes\')).draw(data, options);\n' +
        '    }\n' +
        '    function compilarInsights(kpis, graficos) {\n' +
        '        var lines = [];\n' +
        '        var check = \'<svg width="16" height="16" stroke="var(--success)" fill="none" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>\';\n' +
        '        var warn  = \'<svg width="16" height="16" stroke="var(--danger)" fill="none" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>\';\n' +
        '        var info  = \'<svg width="16" height="16" stroke="var(--primary)" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>\';\n' +
        '        if (kpis.folha.variacao > 3) { lines.push({ ic: warn, t: \'Custo de folha aumentou <b>\' + kpis.folha.variacao.toFixed(1) + \'%</b> vs mês anterior. Recomenda-se analisar impacto das horas extras.\' }); } \n' +
        '        else if (kpis.folha.variacao < -1) { lines.push({ ic: check, t: \'Folha reduziu \' + Math.abs(kpis.folha.variacao).toFixed(1) + \'%. Movimento que favorece o ticket médio.\' }); }\n' +
        '        if (kpis.turnover.valor > 4) { lines.push({ ic: warn, t: \'Taxa de turnover alta (<b>\' + kpis.turnover.valor.toFixed(1) + \'%</b>). Isso indica risco de evasão e aumento de custos rescisórios.\' }); } \n' +
        '        else { lines.push({ ic: check, t: \'Turnover sob controle (\' + kpis.turnover.valor.toFixed(1) + \'%), sinalizando boa retenção de talentos no período.\' }); }\n' +
        '        if (kpis.folha.valor > 0) {\n' +
        '            var benRatio = ((kpis.beneficios.valor / kpis.folha.valor) * 100).toFixed(1);\n' +
        '            lines.push({ ic: info, t: \'Atualmente os benefícios equivalem a <b>\' + benRatio + \'%</b> da base salarial. Padrão saudável de mercado varia de 15% a 25%.\' });\n' +
        '        }\n' +
        '        if (graficos.departamentos && graficos.departamentos.length > 0) {\n' +
        '            var maxDep = graficos.departamentos.reduce(function(a,b) { return a[1]>b[1] ? a : b; });\n' +
        '            var pct = ((maxDep[1] / kpis.ativos.valor) * 100).toFixed(1);\n' +
        '            lines.push({ ic: info, t: \'O departamento <b>\' + maxDep[0] + \'</b> é a maior força motriz atual, agrupando \' + pct + \'% dos colaboradores ativos.\' });\n' +
        '        }\n' +
        '        var html = \'\';\n' +
        '        lines.forEach(function(l) { html += \'<div class="insight-item"><div>\' + l.ic + \'</div><div>\' + l.t + \'</div></div>\'; });\n' +
        '        return html;\n' +
        '    }\n' +
        '  </script>\n' +
        '</body>\n' +
        '</html>\n' +
        '<!-- HTML END -->\n';

    var htmlOutput = HtmlService.createHtmlOutput(htmlContent)
        .setWidth(1400)
        .setHeight(850);

    ui.showModalDialog(htmlOutput, 'Dashboard Gerencial RH');
}
