const fs = require('fs');

// Load the BASE version from the user
let content = fs.readFileSync('Versão funcional do AppScript RH.txt', 'utf8');

// 1. Update buscarDashboardAPI to handle filters
content = content.replace(
/function buscarDashboardAPI\(\) \{([\s\S]+?)var options = \{([\s\S]+?)var url = CONFIG\.API_URL \+ '\/dashboard\/kpis';/ ,
'function buscarDashboardAPI(filtros) {\n' +
'    try {\n' +
'        var options = {\n' +
'            \'method\': \'get\',\n' +
'            \'contentType\': \'application/json\',\n' +
'            \'muteHttpExceptions\': true\n' +
'        };\n' +
'        var queryString = \'\';\n' +
'        if (filtros) {\n' +
'            var parts = [];\n' +
'            if (filtros.mes) parts.push(\'mes=\' + encodeURIComponent(filtros.mes));\n' +
'            if (filtros.ano) parts.push(\'ano=\' + encodeURIComponent(filtros.ano));\n' +
'            if (filtros.departamento) parts.push(\'departamento=\' + encodeURIComponent(filtros.departamento));\n' +
'            if (parts.length > 0) queryString = \'?\' + parts.join(\'&\');\n' +
'        }\n' +
'        var url = CONFIG.API_URL + \'/dashboard/kpis\' + queryString;'
);

// 2. Add obtaining sanitized data logic
content = content.replace(
`function abrirDashboardModal() {
    var ui = SpreadsheetApp.getUi();
    
    // PRE-LOAD SERVER SIDE
    var dashboardData = { success: false, error: "Inicializando" };
    try {
        dashboardData = buscarDashboardAPI();
    } catch(e) {
        dashboardData = { success: false, error: e.message };
    }`,
'function obterDashboardSanitizadoParaClient(filtros) {\n' +
'    try {\n' +
'        var data = buscarDashboardAPI(filtros);\n' +
'        function sanitizarKPI(kpi) {\n' +
'            return {\n' +
'                valor: (kpi && !isNaN(kpi.valor)) ? Number(kpi.valor) : 0,\n' +
'                variacao: (kpi && !isNaN(kpi.variacao)) ? Number(kpi.variacao) : 0,\n' +
'                sparkline: (kpi && Array.isArray(kpi.sparkline) && kpi.sparkline.length > 0) ? kpi.sparkline : [0,0,0,0,0,0]\n' +
'            };\n' +
'        }\n' +
'        if (data.success && data.kpis) {\n' +
'            var k = data.kpis;\n' +
'            k.folha      = sanitizarKPI(k.folha);\n' +
'            k.beneficios = sanitizarKPI(k.beneficios);\n' +
'            k.variavel   = sanitizarKPI(k.variavel);\n' +
'            k.turnover   = sanitizarKPI(k.turnover);\n' +
'            k.vagas      = sanitizarKPI(k.vagas);\n' +
'            k.ticketMedio = sanitizarKPI(k.ticketMedio);\n' +
'            k.ativos     = sanitizarKPI(k.ativos);\n' +
'            k.inativos   = sanitizarKPI(k.inativos);\n' +
'            if (!data.graficos) data.graficos = {};\n' +
'            data.graficos.evolucao = data.graficos.evolucao || [];\n' +
'            data.graficos.departamentos = data.graficos.departamentos || [];\n' +
'            data.graficos.performers = data.graficos.performers || [];\n' +
'            data.graficos.contratacoes = data.graficos.contratacoes || [];\n' +
'        }\n' +
'        return data;\n' +
'    } catch(e) {\n' +
'        return { success: false, error: e.message };\n' +
'    }\n' +
'}\n\n' +
'function abrirDashboardModal() {\n' +
'    var ui = SpreadsheetApp.getUi();\n' +
'    var dashboardData = obterDashboardSanitizadoParaClient(null);'
);

// 3. Inject HTML
const filterHTML = \'  <div id="filtros_bar" style="display:flex;gap:12px;align-items:center;padding:10px 24px;background:var(--bg-card);border-bottom:1px solid var(--border);flex-wrap:wrap;">\' +
\'    <div style="display:flex;align-items:center;gap:8px;">\' +
\'        <label style="font-size:13px;color:var(--text-muted);white-space:nowrap;">Período:</label>\' +
\'        <select id="f_mes" style="padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:13px;">\' +
\'            <option value="">Mês atual</option>\' +
\'            <option value="1">Janeiro</option><option value="2">Fevereiro</option>\' +
\'            <option value="3">Março</option><option value="4">Abril</option>\' +
\'            <option value="5">Maio</option><option value="6">Junho</option>\' +
\'            <option value="7">Julho</option><option value="8">Agosto</option>\' +
\'            <option value="9">Setembro</option><option value="10">Outubro</option>\' +
\'            <option value="11">Novembro</option><option value="12">Dezembro</option>\' +
\'        </select>\' +
\'        <input type="number" id="f_ano" value="2025" min="2020" max="2030" style="width:80px;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:13px;">\' +
\'    </div>\' +
\'    <button onclick="aplicarFiltros()" style="padding:6px 16px;background:var(--primary);color:white;border:none;border-radius:6px;font-size:13px;cursor:pointer;">🔍 Aplicar</button>\' +
\'  </div>\' +
\'  <div class="ticker-container" id="ticker-container" style="display:none;"><div class="ticker-wrapper" id="ticker-content"></div></div>\';

content = content.replace(
\'  <div class="container" id="content_area">\',
filterHTML + \'\\n  <div class="container" id="content_area">\'
);

// 4. Overrides
content += \'\\nfunction atualizarDashboard() { abrirDashboardModal(); }\\n\';

fs.writeFileSync('google-apps-script.js', content, 'utf8');
console.log('Final rebuild of google-apps-script.js complete!');
