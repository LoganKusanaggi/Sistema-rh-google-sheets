const fs = require('fs');

let content = fs.readFileSync('google-apps-script.js', 'utf8');

content = content.replace(
`        var url = CONFIG.API_URL + '/dashboard/kpis';
        var response = UrlFetchApp.fetch(url, options);`,
`        var queryString = '';
        if (filtros) {
            var parts = [];
            if (filtros.mes) parts.push('mes=' + encodeURIComponent(filtros.mes));
            if (filtros.ano) parts.push('ano=' + encodeURIComponent(filtros.ano));
            if (filtros.departamento) parts.push('departamento=' + encodeURIComponent(filtros.departamento));
            if (parts.length > 0) queryString = '?' + parts.join('&');
        }
        var url = CONFIG.API_URL + '/dashboard/kpis' + queryString;
        var response = UrlFetchApp.fetch(url, options);`
);

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
`function obterDashboardSanitizadoParaClient(filtros) {
    var dashboardData = { success: false, error: "Inicializando" };
    try {
        dashboardData = buscarDashboardAPI(filtros);
    } catch(e) {
        return { success: false, error: e.message };
    }

    function sanitizarKPI(kpi) {
        return {
            valor: (kpi && !isNaN(kpi.valor)) ? Number(kpi.valor) : 0,
            variacao: (kpi && !isNaN(kpi.variacao)) ? Number(kpi.variacao) : 0,
            sparkline: (kpi && Array.isArray(kpi.sparkline) && kpi.sparkline.length > 0) ? kpi.sparkline : [0,0,0,0,0,0]
        };
    }

    if (dashboardData.success && dashboardData.kpis) {
        var k = dashboardData.kpis;
        k.folha      = sanitizarKPI(k.folha);
        k.beneficios = sanitizarKPI(k.beneficios);
        k.variavel   = sanitizarKPI(k.variavel);
        k.turnover   = sanitizarKPI(k.turnover);
        k.vagas      = sanitizarKPI(k.vagas);
        k.ticketMedio = sanitizarKPI(k.ticketMedio);
        k.ativos     = sanitizarKPI(k.ativos);
        k.inativos   = sanitizarKPI(k.inativos);
        
        if (!dashboardData.graficos) dashboardData.graficos = {};
        dashboardData.graficos.evolucao = dashboardData.graficos.evolucao || [];
        dashboardData.graficos.departamentos = dashboardData.graficos.departamentos || [];
        dashboardData.graficos.performers = dashboardData.graficos.performers || [];
        dashboardData.graficos.contratacoes = dashboardData.graficos.contratacoes || [];
    }
    
    return dashboardData;
}

function abrirDashboardModal() {
    var ui = SpreadsheetApp.getUi();
    
    // PRE-LOAD SERVER SIDE
    var dashboardData = obterDashboardSanitizadoParaClient(null);`
);

content = content.replace(
`    '  <div class="container" id="content_area">\\n' +
    '    <div class="loading-state">\\n' +
    '       <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>\\n' +
    '       <div style="margin-top: 16px;">Processando métricas no servidor...</div>\\n' +
    '    </div>\\n' +
    '  </div>\\n' +`,
`    '  <div id="filtros_bar" style="display:flex;gap:12px;align-items:center;padding:10px 24px;background:var(--bg-card);border-bottom:1px solid var(--border);flex-wrap:wrap;">\\n' +
    '    <div style="display:flex;align-items:center;gap:8px;">\\n' +
    '        <label style="font-size:13px;color:var(--text-muted);white-space:nowrap;">Período:</label>\\n' +
    '        <select id="f_mes" style="padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:13px;">\\n' +
    '            <option value="">Mês atual</option>\\n' +
    '            <option value="1">Janeiro</option><option value="2">Fevereiro</option>\\n' +
    '            <option value="3">Março</option><option value="4">Abril</option>\\n' +
    '            <option value="5">Maio</option><option value="6">Junho</option>\\n' +
    '            <option value="7">Julho</option><option value="8">Agosto</option>\\n' +
    '            <option value="9">Setembro</option><option value="10">Outubro</option>\\n' +
    '            <option value="11">Novembro</option><option value="12">Dezembro</option>\\n' +
    '        </select>\\n' +
    '        <input type="number" id="f_ano" value="2025" min="2020" max="2030" style="width:80px;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:13px;">\\n' +
    '    </div>\\n' +
    '    <div style="display:flex;align-items:center;gap:8px;">\\n' +
    '        <label style="font-size:13px;color:var(--text-muted);">Departamento:</label>\\n' +
    '        <select id="f_depto" style="padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:13px;">\\n' +
    '            <option value="">Todos</option>\\n' +
    '            <option value="Comercial">Comercial</option>\\n' +
    '            <option value="RH">RH</option>\\n' +
    '            <option value="Financeiro">Financeiro</option>\\n' +
    '            <option value="Operações">Operações</option>\\n' +
    '            <option value="TI">TI</option>\\n' +
    '        </select>\\n' +
    '    </div>\\n' +
    '    <button onclick="aplicarFiltros()" style="padding:6px 16px;background:var(--primary);color:white;border:none;border-radius:6px;font-size:13px;cursor:pointer;">\\n' +
    '        🔍 Aplicar\\n' +
    '    </button>\\n' +
    '    <button onclick="limparFiltros()" style="padding:6px 12px;background:transparent;color:var(--text-muted);border:1px solid var(--border);border-radius:6px;font-size:13px;cursor:pointer;">\\n' +
    '        ✕ Limpar\\n' +
    '    </button>\\n' +
    '  </div>\\n' +
    '  <div class="ticker-container" id="ticker-container" style="display:none;">\\n' +
    '    <div class="ticker-wrapper">\\n' +
    '      <div class="ticker" id="ticker-content"></div>\\n' +
    '    </div>\\n' +
    '  </div>\\n' +
    '  <div class="container" id="content_area">\\n' +
    '    <div class="loading-state">\\n' +
    '       <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>\\n' +
    '       <div style="margin-top: 16px;">Processando métricas no servidor...</div>\\n' +
    '    </div>\\n' +
    '  </div>\\n' +`
);

content = content.replace(
`        if (payload.alertas && payload.alertas.length > 0) {
            document.getElementById('ticker-container').style.display = 'block';
            var tkContainer = document.getElementById('ticker-content');
            var tkItems = '';
            var itemsLoop = payload.alertas.concat(payload.alertas, payload.alertas);
            itemsLoop.forEach(function(a) { tkItems += '<div class="ticker-item">' + a.mensagem + '</div>'; });
            tkContainer.innerHTML = tkItems;
        }`,
`        if (k) {
            document.getElementById('ticker-container').style.display = 'block';
            var itensTk = [
                { texto: 'Colaboradores Ativos: ' + formatNum.format(k.ativos.valor), acao: 'colaboradores' },
                { texto: 'Folha Bruta: ' + formatBRL.format(k.folha.valor), acao: 'folha' },
                { texto: 'Benefícios: ' + formatBRL.format(k.beneficios.valor), acao: 'beneficios' },
                { texto: 'Variável/Bônus: ' + formatBRL.format(k.variavel.valor), acao: 'variavel' },
                { texto: 'Turnover Mês: ' + k.turnover.valor.toFixed(1) + '%', acao: 'turnover' },
                { texto: 'Ticket Médio: ' + formatBRL.format(k.ticketMedio.valor), acao: 'ticketMedio' }
            ];
            var htmlTk = '';
            var itemsLoop = itensTk.concat(itensTk, itensTk);
            itemsLoop.forEach(function(item) { htmlTk += '<span class="ticker-item" onclick="navegarPara(\\'' + item.acao + '\\')" style="cursor:pointer;margin-right:40px;">📌 ' + item.texto + '</span>'; });
            document.getElementById('ticker-content').innerHTML = htmlTk;
        }`
);

content = content.replace(
`    function montarInsights(lines) {
        if (!lines || lines.length === 0) return '<div class="insight-item">Nenhum insight crítico identificado no momento.</div>';
        var html = '';
        lines.forEach(function(l) { html += '<div class="insight-item"><div>' + l.ic + '</div><div>' + l.t + '</div></div>'; });
        return html;
    }
  </script>
</body>
</html>';

    var htmlOutput = HtmlService.createHtmlOutput(htmlContent)`,
`    function montarInsights(lines) {
        if (!lines || lines.length === 0) return '<div class="insight-item">Nenhum insight crítico identificado no momento.</div>';
        var html = '';
        lines.forEach(function(l) { html += '<div class="insight-item"><div>' + l.ic + '</div><div>' + l.t + '</div></div>'; });
        return html;
    }
    function aplicarFiltros() {
        document.getElementById('content_area').innerHTML = '<div class="loading-state"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg><div style="margin-top: 16px;">Re-processando métricas com filtros...</div></div>';
        var mes   = document.getElementById('f_mes').value;
        var ano   = document.getElementById('f_ano').value;
        var depto = document.getElementById('f_depto').value;
        var params = {};
        if(mes) params.mes = mes;
        if(ano) params.ano = parseInt(ano);
        if(depto) params.departamento = depto;
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
        var mapaAcoes = {
            "colaboradores": "buscarColaboradorModal",
            "folha":         "lancarFolha",
            "beneficios":    "lancarBeneficios",
            "variavel":      "lancarVariavel",
            "turnover":      null,
            "ticketMedio":   null
        };
        var funcao = mapaAcoes[acao];
        if (!funcao) {
            alert("ℹ️ Detalhe disponível nos menus nativos de Lançamentos ou Relatórios.");
            return;
        }
        google.script.host.close();
        google.script.run.withFailureHandler(function(err){alert("Erro: "+err.message);})[funcao]();
    }
  </script>
</body>
</html>';

    var htmlOutput = HtmlService.createHtmlOutput(htmlContent)`
);

if (!content.includes('function atualizarDashboard()')) {
    content += `
function atualizarDashboard() {
    abrirDashboardModal();
}

function abrirConfiguracoes() {
    var ui = SpreadsheetApp.getUi();
    var html = HtmlService.createHtmlOutput(\`
    <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 20px; color: #333; font-size: 13px; }
        h2 { color: #1a73e8; margin-top: 0; }
        .secao { background: #f8f9fa; border-radius: 8px; padding: 14px; margin-bottom: 14px; border: 1px solid #e0e0e0; }
        .secao h3 { margin: 0 0 10px 0; font-size: 13px; color: #5f6368; text-transform: uppercase; letter-spacing: 0.5px; }
        .item { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #eee; }
        .item:last-child { border-bottom: none; }
        .label { font-weight: 600; }
        .val { color: #5f6368; font-family: monospace; font-size: 12px; }
        .badge { background: #e8f5e9; color: #2e7d32; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
        .btn { padding: 8px 14px; background: #1a73e8; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; }
        .btn-sec { padding: 8px 14px; background: #fff; color: #1a73e8; border: 1px solid #1a73e8; border-radius: 6px; cursor: pointer; font-size: 13px; margin-left: 8px; }
    </style>
    <h2>⚙️ Configurações do Sistema</h2>

    <div class="secao">
        <h3>🔗 Integração API</h3>
        <div class="item"><span class="label">URL da API</span><span class="val">\${CONFIG.API_URL}</span></div>
        <div class="item"><span class="label">Empresa</span><span class="val">\${CONFIG.EMPRESA.nome}</span></div>
        <div class="item"><span class="label">CNPJ</span><span class="val">\${CONFIG.EMPRESA.cnpj}</span></div>
    </div>

    <div class="secao">
        <h3>📋 Abas Mapeadas</h3>
        <div class="item"><span class="label">Dashboard</span><span class="badge">✓ Ativo</span></div>
        <div class="item"><span class="label">Colaboradores</span><span class="badge">✓ Ativo</span></div>
        <div class="item"><span class="label">Lançamentos</span><span class="badge">✓ Ativo</span></div>
    </div>

    <div class="secao">
        <h3>🛠️ Diagnóstico</h3>
        <button class="btn" onclick="testarConexao()">⚡ Testar Conexão API</button>
        <div id="status_api" style="margin-top:10px;font-size:12px;padding:8px;border-radius:6px;"></div>
    </div>

    <div style="text-align:right;margin-top:10px;">
        <small style="color:#aaa;">Para alterar configurações, edite CONST CONFIG no script.</small><br>
        <button class="btn-sec" onclick="google.script.host.close()">Fechar</button>
    </div>

    <script>
        function testarConexao() {
            var st = document.getElementById('status_api');
            st.innerHTML = '⏳ Testando...';
            st.style.background = '#f8f9fa';
            google.script.run
                .withSuccessHandler(function(res) {
                    if(res.success) {
                        st.innerHTML = '✅ OK — Conectado com sucesso. (' + res.ativos + ' Colaboradores)';
                        st.style.background = '#e6f4ea';
                        st.style.color = '#1e8e3e';
                    } else {
                        st.innerHTML = '❌ Erro API: ' + res.error;
                        st.style.background = '#fce8e6';
                        st.style.color = '#d93025';
                    }
                })
                .withFailureHandler(function(err) {
                    st.innerHTML = '❌ Falha crítica: ' + err.message;
                    st.style.background = '#fce8e6';
                    st.style.color = '#d93025';
                })
                .testarConexaoAPI_v2();
        }
    </script>
    \`).setWidth(480).setHeight(480);
    ui.showModalDialog(html, '⚙️ Configurações');
}

function testarConexaoAPI_v2() {
    try {
        var url = CONFIG.API_URL + '/dashboard/kpis';
        var options = {
            method: 'get',
            contentType: 'application/json',
            muteHttpExceptions: true
        };
        var res = UrlFetchApp.fetch(url, options);
        var statusCode = res.getResponseCode();
        if(statusCode !== 200) return { success: false, error: 'HTTP ' + statusCode };
        var data = JSON.parse(res.getContentText());
        return { success: data.success, ativos: data.kpis ? data.kpis.ativos.valor || 0 : 0 };
    } catch(e) {
        return { success: false, error: e.message };
    }
}
`;
}

content = content.replace("function buscarDashboardAPI() {", "function buscarDashboardAPI(filtros) {");

fs.writeFileSync('google-apps-script.js', content, 'utf8');
console.log('Script processed successfully.');
