import re
import os

filepath = 'google-apps-script.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update buscarDashboardAPI
old_api = r'function buscarDashboardAPI\(filtros\) \{[\s\S]+?var url = CONFIG\.API_URL \+ \'/dashboard/kpis\';[\s\S]+?\}'
new_api = """function buscarDashboardAPI(filtros) {
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
}"""

content = re.sub(old_api, new_api, content, count=1)

# 2. Add obtaining sanitized logic and update modal
old_modal_start = r'function abrirDashboardModal\(\) \{[\s\S]+?dashboardData = buscarDashboardAPI\(\);[\s\S]+?\}'
new_modal_part = """function obterDashboardSanitizadoParaClient(filtros) {
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
}

function abrirDashboardModal() {
    var ui = SpreadsheetApp.getUi();
    var dashboardData = obterDashboardSanitizadoParaClient(null);"""

# Careful: we only want to replace the FIRST part of abrirDashboardModal
content = content.replace('function abrirDashboardModal() {\n    var ui = SpreadsheetApp.getUi();\n    \n    // PRE-LOAD SERVER SIDE\n    var dashboardData = { success: false, error: "Inicializando" };\n    try {\n        dashboardData = buscarDashboardAPI();\n    } catch(e) {\n        dashboardData = { success: false, error: e.message };\n    }', new_modal_part)

# 3. Fix atualizarDashboard mock
old_mock = r'function atualizarDashboard\(\) \{[\s\S]+?Funcionalidade em desenvolvimento[\s\S]+?\}'
new_real = 'function atualizarDashboard() {\n    abrirDashboardModal();\n}'
content = re.sub(old_mock, new_real, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Cleanup and upgrade complete!")
