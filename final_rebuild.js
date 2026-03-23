const fs = require('fs');

// 1. Start with the Gold version
const base = fs.readFileSync('Versão funcional do AppScript RH.txt', 'utf8');

// 2. Define the new/updated parts as complete functions to avoid replace issues
const newBuscarAPI = `function buscarDashboardAPI(filtros) {
    try {
        var options = {
            'method': 'get',
            'contentType': 'application/json',
            'muteHttpExceptions': true
        };
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
}`;

const newObterSanitizado = `function obterDashboardSanitizadoParaClient(filtros) {
    try {
        var data = buscarDashboardAPI(filtros);
        
        function sanitizarKPI(kpi) {
            return {
                valor: (kpi && !isNaN(kpi.valor)) ? Number(kpi.valor) : 0,
                variacao: (kpi && !isNaN(kpi.variacao)) ? Number(kpi.variacao) : 0,
                sparkline: (kpi && Array.isArray(kpi.sparkline) && kpi.sparkline.length > 0) ? kpi.sparkline : [0,0,0,0,0,0]
            };
        }

        if (data.success && data.kpis) {
            var k = data.kpis;
            k.folha      = sanitizarKPI(k.folha);
            k.beneficios = sanitizarKPI(k.beneficios);
            k.variavel   = sanitizarKPI(k.variavel);
            k.turnover   = sanitizarKPI(k.turnover);
            k.vagas      = sanitizarKPI(k.vagas);
            k.ticketMedio = sanitizarKPI(k.ticketMedio);
            k.ativos     = sanitizarKPI(k.ativos);
            k.inativos   = sanitizarKPI(k.inativos);
            
            if (!data.graficos) data.graficos = {};
            data.graficos.evolucao = data.graficos.evolucao || [];
            data.graficos.departamentos = data.graficos.departamentos || [];
            data.graficos.performers = data.graficos.performers || [];
            data.graficos.contratacoes = data.graficos.contratacoes || [];
        }
        return data;
    } catch(e) {
        return { success: false, error: e.message };
    }
}`;

const newAbrirModal = `function abrirDashboardModal() {
    var ui = SpreadsheetApp.getUi();
    var dashboardData = obterDashboardSanitizadoParaClient(null);`;

// Filter UI HTML injection
const filterHTML = `  <div id="filtros_bar" style="display:flex;gap:12px;align-items:center;padding:10px 24px;background:var(--bg-card);border-bottom:1px solid var(--border);flex-wrap:wrap;">
    <div style="display:flex;align-items:center;gap:8px;">
        <label style="font-size:13px;color:var(--text-muted);white-space:nowrap;">Período:</label>
        <select id="f_mes" style="padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:13px;">
            <option value="">Mês atual</option>
            <option value="1">Janeiro</option><option value="2">Fevereiro</option>
            <option value="3">Março</option><option value="4">Abril</option>
            <option value="5">Maio</option><option value="6">Junho</option>
            <option value="7">Julho</option><option value="8">Agosto</option>
            <option value="9">Setembro</option><option value="10">Outubro</option>
            <option value="11">Novembro</option><option value="12">Dezembro</option>
        </select>
        <input type="number" id="f_ano" value="2025" min="2020" max="2030" style="width:80px;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:13px;">
    </div>
    <div style="display:flex;align-items:center;gap:8px;">
        <label style="font-size:13px;color:var(--text-muted);">Departamento:</label>
        <select id="f_depto" style="padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:13px;">
            <option value="">Todos</option>
            <option value="Comercial">Comercial</option>
            <option value="RH">RH</option>
            <option value="Financeiro">Financeiro</option>
            <option value="Operações">Operações</option>
            <option value="TI">TI</option>
        </select>
    </div>
    <button onclick="aplicarFiltros()" style="padding:6px 16px;background:var(--primary);color:white;border:none;border-radius:6px;font-size:13px;cursor:pointer;">🔍 Aplicar</button>
    <button onclick="limparFiltros()" style="padding:6px 12px;background:transparent;color:var(--text-muted);border:1px solid var(--border);border-radius:6px;font-size:13px;cursor:pointer;">✕ Limpar</button>
  </div>
  <div class="ticker-container" id="ticker-container" style="display:none;"><div class="ticker-wrapper" id="ticker-content"></div></div>`;

const extraJSFunctions = `    function aplicarFiltros() {
        document.getElementById('content_area').innerHTML = '<div class="loading-state"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg><div style="margin-top: 16px;">Aplicando filtros...</div></div>';
        var params = {
            mes: document.getElementById('f_mes').value,
            ano: parseInt(document.getElementById('f_ano').value),
            departamento: document.getElementById('f_depto').value
        };
        google.script.run.withSuccessHandler(function(data) {
            if (data && data.success) { renderizarDashboard(data); }
            else { mostrarErro(data ? data.error : "Erro filtrando dashboard"); }
        }).withFailureHandler(function(err) { mostrarErro(err.message); }).obterDashboardSanitizadoParaClient(params);
    }
    function limparFiltros() {
        document.getElementById('f_mes').value = '';
        document.getElementById('f_ano').value = new Date().getFullYear();
        document.getElementById('f_depto').value = '';
        aplicarFiltros();
    }
    function navegarPara(acao) {
        var mapaAcoes = { "colaboradores": "buscarColaboradorModal", "folha": "lancarFolha", "beneficios": "lancarBeneficios", "variavel": "lancarVariavel" };
        var funcao = mapaAcoes[acao];
        if (!funcao) return;
        google.script.host.close();
        google.script.run.withFailureHandler(function(err){alert("Erro: "+err.message);})[funcao]();
    }`;

// 3. APPLY CHANGES
let result = base;

// Replace buscarDashboardAPI
result = result.replace(/function buscarDashboardAPI\(\) \{[\s\S]+?return JSON\.parse\(response\.getContentText\(\)\);[\s\S]+?catch[\s\S]+?\}[\s\S]+?\}/, newBuscarAPI);

// Replace abrirDashboardModal start and inject obterSanitizado
result = result.replace(/function abrirDashboardModal\(\) \{[\s\S]+?dashboardData = buscarDashboardAPI\(\);[\s\S]+?\}/, 
                         newObterSanitizado + "\\n\\n" + newAbrirModal);

// Inject Filter HTML
result = result.replace('  <div class="container" id="content_area">', filterHTML + "\\n  <div class=\"container\" id=\"content_area\">");

// Inject JS functions
result = result.replace('    function montarInsights(lines) {', extraJSFunctions + "\\n\\n    function montarInsights(lines) {");

// Inject Ticker Logic in renderizarDashboard
result = result.replace(/if \(payload\.alertas \&\& payload\.alertas\.length > 0\) \{[\s\S]+?\}/, 
    \`if (k) {
            document.getElementById('ticker-container').style.display = 'block';
            var itensTk = [
                { texto: 'Ativos: ' + formatNum.format(k.ativos.valor), acao: 'colaboradores' },
                { texto: 'Folha: ' + formatBRL.format(k.folha.valor), acao: 'folha' },
                { texto: 'Benefícios: ' + formatBRL.format(k.beneficios.valor), acao: 'beneficios' },
                { texto: 'Variável: ' + formatBRL.format(k.variavel.valor), acao: 'variavel' },
                { texto: 'Turnover: ' + (k.turnover.valor).toFixed(1) + '%', acao: 'turnover' }
            ];
            var htmlTk = '';
            var itemsLoop = itensTk.concat(itensTk, itensTk);
            itemsLoop.forEach(function(item) { 
                htmlTk += '<span class="ticker-item" onclick="navegarPara(\\''+item.acao+'\\')" style="cursor:pointer;margin-right:40px;">📌 ' + item.texto + '</span>'; 
            });
            document.getElementById('ticker-content').innerHTML = htmlTk;
        }\`);

// Final overrides
result += "\\nfunction atualizarDashboard() { abrirDashboardModal(); }\\n";

fs.writeFileSync('google-apps-script.js', result, 'utf8');
console.log('REBUILD SUCCESSFUL');
