import sys

file_path = "e:\\Projetos_GitHub\\rh-google-sheets\\Sistema-rh-google-sheets\\CODIGO_FINAL_CORRETO.js"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Find where the Sprint 1 dashboard started
marker = "// DASHBOARD ANALÍTICO (SPRINT 1)"
idx = content.find(marker)
if idx != -1:
    content = content[:idx]

new_dashboard = """// =====================================================
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
    
    var srvTag = '<script type="application/json" id="srvdashboard">' + JSON.stringify(dashboardData).replace(/<\\//g, '\\\\u003c/') + '<\\/script>';
    
    var htmlContent = srvTag + `
    <!-- HTML START -->
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <base target="_top">
      <script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
      <style>
        :root {
          /* Paleta Premium Pro Max */
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
          --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }

        * { box-sizing: border-box; }
        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
          background-color: var(--bg-main); 
          color: var(--text-main);
          margin: 0;
          padding: 0;
        }

        /* HEADER & TICKER */
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

        /* TICKER ANIMADO */
        .ticker-container {
          width: 100%;
          background: linear-gradient(135deg, #1a73e8 0%, #1557b0 100%);
          color: white;
          overflow: hidden;
          padding: 10px 0;
          box-shadow: inset 0 -2px 4px rgba(0,0,0,0.1);
        }
        .ticker-wrapper {
          width: 100%;
          overflow: hidden;
        }
        .ticker {
          display: flex;
          white-space: nowrap;
          animation: scroll 30s linear infinite;
        }
        .ticker:hover {
          animation-play-state: paused;
        }
        .ticker-item {
          display: inline-flex;
          align-items: center;
          margin-right: 40px;
          cursor: default;
          padding: 6px 16px;
          border-radius: 20px;
          background: rgba(255,255,255,0.1);
          transition: background 0.3s;
          font-size: 13px;
          font-weight: 500;
        }
        .ticker-item:hover {
          background: rgba(255,255,255,0.2);
        }
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        /* MAIN CONTENT */
        .container {
          padding: 24px;
          max-width: 1600px;
          margin: 0 auto;
        }

        /* 8 KPIs GRID */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .kpi-card {
          background: var(--bg-card);
          padding: 20px;
          border-radius: 12px;
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .kpi-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .kpi-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .kpi-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .kpi-icon svg { width: 20px; height: 20px; stroke-width: 2; stroke: currentColor; fill: none; }
        .kpi-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .kpi-value {
          font-size: 28px;
          font-weight: 800;
          color: var(--text-main);
          margin-bottom: 8px;
        }
        .kpi-footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: auto;
        }
        .pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
        .pill.up { color: var(--success); background: var(--success-light); }
        .pill.down { color: var(--danger); background: var(--danger-light); }
        .pill.neutral { color: var(--text-muted); background: var(--bg-main); }
        
        .sparkline {
          width: 60px;
          height: 24px;
          stroke-width: 2;
          fill: none;
        }

        /* GRÁFICOS GRID */
        .chart-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }
        .chart-card {
          background: var(--bg-card);
          padding: 24px;
          border-radius: 12px;
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--border);
        }
        .chart-card h3 {
          font-size: 16px;
          font-weight: 600;
          margin-top: 0;
          margin-bottom: 16px;
          color: var(--text-main);
        }
        .chart-container {
          width: 100%;
          height: 320px;
        }

        /* INSIGHTS AI */
        .insights-panel {
          background: linear-gradient(to right, #f8fafc, #ffffff);
          border-left: 4px solid var(--primary);
          padding: 20px 24px;
          border-radius: 8px;
          box-shadow: var(--shadow-sm);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          border-right: 1px solid var(--border);
        }
        .insights-title {
          font-size: 16px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--primary-dark);
          margin-bottom: 16px;
        }
        .insights-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .insight-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-size: 14px;
          line-height: 1.5;
        }

        /* STATE MESSAGES */
        .loading-state, .error-state {
          padding: 60px;
          text-align: center;
          font-size: 16px;
          color: var(--text-muted);
        }
        .error-state {
          color: var(--danger);
          background: var(--danger-light);
          border-radius: 8px;
          border: 1px solid #f87171;
        }
        
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

      <!-- TICKER ANIMADO -->
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
        const formatBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
        const formatNum = new Intl.NumberFormat('pt-BR');

        const icons = {
            users: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
            userOff: '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="18" y1="8" x2="23" y2="13"></line><line x1="23" y1="8" x2="18" y2="13"></line></svg>',
            money: '<svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
            gift: '<svg viewBox="0 0 24 24"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>',
            chart: '<svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>',
            refresh: '<svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>',
            target: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>',
            ticket: '<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="7" y1="4" x2="7" y2="20"></line><line x1="17" y1="4" x2="17" y2="20"></line></svg>'
        };

        window.onload = function() {
            var el = document.getElementById('srvdashboard');
            if (el) {
                try {
                    var data = JSON.parse(el.textContent);
                    if (data && data.success) {
                        google.charts.load('current', {'packages':['corechart', 'line', 'bar']});
                        google.charts.setOnLoadCallback(function() {
                            renderizarDashboard(data);
                        });
                    } else {
                        mostrarErro(data ? data.error : 'Erro desconhecido na API');
                    }
                } catch(e) {
                    mostrarErro("Erro de parsing: " + e.message);
                }
            } else {
                mostrarErro("Falha: Payload JSON do servidor não encontrado.");
            }
        };

        function mostrarErro(msg) {
            document.getElementById('content_area').innerHTML = '<div class="error-state">❌ ' + msg + '</div>';
        }

        // ============================================
        // 1. RENDERIZADOR PRINCIPAL
        // ============================================
        function renderizarDashboard(payload) {
            var html = '';
            var k = payload.kpis;
            
            // 1. TICKER
            if (payload.alertas && payload.alertas.length > 0) {
                document.getElementById('ticker-container').style.display = 'block';
                var tkContainer = document.getElementById('ticker-content');
                var tkItems = '';
                var itemsLoop = payload.alertas.concat(payload.alertas, payload.alertas); // Triplicar preencher tela
                itemsLoop.forEach(function(a) {
                    tkItems += '<div class="ticker-item">' + a.mensagem + '</div>';
                });
                tkContainer.innerHTML = tkItems;
            }

            // 2. GRID KPIs (8 Cards)
            html += '<div class="kpi-grid">';
            html += buildKpiCard('Colab. Ativos', k.ativos.valor, k.ativos.variacao, k.ativos.sparkline, icons.users, false);
            html += buildKpiCard('Colab. Inativos', k.inativos.valor, k.inativos.variacao, k.inativos.sparkline, icons.userOff, true); // Inativos subindo é ruim (inverse)
            html += buildKpiCard('Folha Bruta', formatBRL.format(k.folha.valor), k.folha.variacao, k.folha.sparkline, icons.money, true);
            html += buildKpiCard('Benefícios Totais', formatBRL.format(k.beneficios.valor), k.beneficios.variacao, k.beneficios.sparkline, icons.gift, true);
            
            html += buildKpiCard('Variável / Bônus', formatBRL.format(k.variavel.valor), k.variavel.variacao, k.variavel.sparkline, icons.chart, false);
            html += buildKpiCard('Turnover Mês', k.turnover.valor.toFixed(1) + '%', k.turnover.variacao, k.turnover.sparkline, icons.refresh, true);
            html += buildKpiCard('Vagas Abertas', k.vagas.valor, k.vagas.variacao, k.vagas.sparkline, icons.target, false);
            html += buildKpiCard('Ticket Médio', formatBRL.format(k.ticketMedio.valor), k.ticketMedio.variacao, k.ticketMedio.sparkline, icons.ticket, false);
            html += '</div>';

            // 3. GRÁFICOS
            html += '<div class="chart-grid">';
            
            html += '<div class="chart-card"><h3>Evolução da Folha (6 Meses)</h3><div id="cEvolucao" class="chart-container"></div></div>';
            html += '<div class="chart-card"><h3>Distribuição por Departamento</h3><div id="cDeptos" class="chart-container"></div></div>';
            html += '<div class="chart-card"><h3>Top Performers (Variável)</h3><div id="cPerformers" class="chart-container"></div></div>';
            html += '<div class="chart-card"><h3>Histórico de Admissões (12 Meses)</h3><div id="cAdmissoes" class="chart-container"></div></div>';
            
            html += '</div>';

            // 4. INSIGHTS IA
            html += '<div class="insights-panel">';
            html += '<div class="insights-title"><svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> Insights Inteligentes</div>';
            html += '<div class="insights-list" id="insights_content">Gerando insights...</div>';
            html += '</div>';

            document.getElementById('content_area').innerHTML = html;

            // DRAW CHARTS
            if (payload.graficos) {
                desenharGraficoEvolucao(payload.graficos.evolucao);
                desenharGraficoDeptos(payload.graficos.departamentos);
                desenharGraficoPerformers(payload.graficos.performers);
                desenharGraficoAdmissoes(payload.graficos.contratacoes);
            }

            // AUTO INSIGHTS
            document.getElementById('insights_content').innerHTML = compilarInsights(payload.kpis, payload.graficos);
        }

        // ============================================
        // 2. HELPERS HTML & SPARKLINE
        // ============================================
        function buildKpiCard(title, value, varMoM, sparkArray, iconSvg, inverseColors = false) {
            var bgClass = 'neutral';
            var arrow = '→';
            var varFormatada = Math.abs(varMoM).toFixed(1) + '%';
            
            if (varMoM > 0.1) {
                bgClass = inverseColors ? 'down' : 'up';
                arrow = '↑';
            } else if (varMoM < -0.1) {
                bgClass = inverseColors ? 'up' : 'down';
                arrow = '↓';
            }

            // Converter background class para stroke color da linha SVG
            var strokeColor = '#475569';
            if (bgClass === 'up') strokeColor = 'var(--success)';
            if (bgClass === 'down') strokeColor = 'var(--danger)';

            var sparklineSvg = gerarSparkline(sparkArray, strokeColor);

            return `
              <div class="kpi-card">
                <div class="kpi-header">
                  <div class="kpi-title">${title}</div>
                  <div class="kpi-icon" style="background:var(--primary-light); color:var(--primary)">${iconSvg}</div>
                </div>
                <div class="kpi-value">${value}</div>
                <div class="kpi-footer">
                  <div class="pill ${bgClass}">${arrow} ${varFormatada}</div>
                  ${sparklineSvg}
                </div>
              </div>
            `;
        }

        // Gera line SVG chart estático (math approximation)
        function gerarSparkline(dataArr, color) {
            if (!dataArr || dataArr.length < 2) return '';
            var max = Math.max(...dataArr);
            var min = Math.min(...dataArr);
            var range = max - min || 1;
            
            var width = 60;
            var height = 24;
            var stepX = width / (dataArr.length - 1);
            
            var pts = dataArr.map(function(val, idx) {
                var x = idx * stepX;
                var y = height - (((val - min) / range) * height);
                return x + ',' + y;
            }).join(' ');

            return '<svg class="sparkline" stroke="' + color + '"><polyline points="' + pts + '"></polyline></svg>';
        }

        // ============================================
        // 3. DRAW CHARTS (Google API)
        // ============================================
        function desenharGraficoEvolucao(evolucaoData) {
            if(!evolucaoData || evolucaoData.length === 0) return;
            var data = new google.visualization.DataTable();
            data.addColumn('string', 'Mês');
            data.addColumn('number', 'Folha (R$)');
            data.addColumn('number', 'Benefícios (R$)');

            evolucaoData.slice().reverse().forEach(item => {
                data.addRow([item.mes, item.folha||0, item.beneficios||0]);
            });

            var options = {
                fontName: 'Inter',
                colors: ['#1a73e8', '#1e8e3e'],
                chartArea: { width: '85%', height: '70%' },
                legend: { position: 'top' },
                vAxis: { minValue: 0, textStyle: { color: '#5f6368'}, gridlines: { color: '#e2e8f0'} },
                hAxis: { textStyle: { color: '#5f6368'} },
                animation: { startup: true, duration: 800, easing: 'out' },
                lineWidth: 3, pointSize: 5
            };
            new google.visualization.AreaChart(document.getElementById('cEvolucao')).draw(data, options);
        }

        function desenharGraficoDeptos(depsData) {
            if(!depsData || depsData.length === 0) return;
            var data = new google.visualization.DataTable();
            data.addColumn('string', 'Departamento');
            data.addColumn('number', 'Ativos');
            
            depsData.sort((a,b) => b[1]-a[1]).forEach(row => data.addRow([row[0], parseInt(row[1])||0]));

            var options = {
                fontName: 'Inter',
                colors: ['#4285f4', '#34a853', '#fbbc04', '#ea4335', '#9c27b0', '#00bcd4'],
                chartArea: { width: '90%', height: '80%' },
                pieHole: 0.45,
                legend: { position: 'right', textStyle: { fontSize: 13 } }
            };
            new google.visualization.PieChart(document.getElementById('cDeptos')).draw(data, options);
        }

        function desenharGraficoPerformers(perfData) {
            if(!perfData || perfData.length === 0) return;
            var data = new google.visualization.DataTable();
            data.addColumn('string', 'Colaborador');
            data.addColumn('number', 'Comissão (R$)');

            perfData.forEach(p => data.addRow([p.nome, p.valor]));

            var options = {
                fontName: 'Inter',
                colors: ['#f9ab00'],
                chartArea: { width: '70%', height: '80%' },
                legend: { position: 'none' },
                hAxis: { textStyle: { color: '#5f6368'} },
                vAxis: { textStyle: { color: '#202124', fontSize: 12, bold: true } },
                animation: { startup: true, duration: 800, easing: 'out' }
            };
            new google.visualization.BarChart(document.getElementById('cPerformers')).draw(data, options);
        }

        function desenharGraficoAdmissoes(admData) {
            if(!admData || admData.length === 0) return;
            var data = new google.visualization.DataTable();
            data.addColumn('string', 'Mês');
            data.addColumn('number', 'Admissões');

            admData.slice().reverse().forEach(a => data.addRow([a.mes, a.valor]));

            var options = {
                fontName: 'Inter',
                colors: ['#9c27b0'],
                chartArea: { width: '85%', height: '70%' },
                legend: { position: 'none' },
                vAxis: { minValue: 0, format: '#', gridlines: { color: '#e2e8f0'} },
                animation: { startup: true, duration: 800, easing: 'out' },
                lineWidth: 2
            };
            new google.visualization.LineChart(document.getElementById('cAdmissoes')).draw(data, options);
        }

        // ============================================
        // 4. INSIGHTS ALGORITHM
        // ============================================
        function compilarInsights(kpis, graficos) {
            var lines = [];
            const check = '<svg width="16" height="16" stroke="var(--success)" fill="none" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            const warn  = '<svg width="16" height="16" stroke="var(--danger)" fill="none" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
            const info  = '<svg width="16" height="16" stroke="var(--primary)" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';

            // Regra 1: Folha
            if (kpis.folha.variacao > 3) {
                lines.push({ ic: warn, t: `Custo de folha aumentou <b>${kpis.folha.variacao.toFixed(1)}%</b> vs mês anterior. Recomenda-se analisar impacto das horas extras/comissões.`});
            } else if (kpis.folha.variacao < -1) {
                lines.push({ ic: check, t: `Folha reduziu ${Math.abs(kpis.folha.variacao).toFixed(1)}%. Movimento que favorece o ticket médio.`});
            }

            // Regra 2: Turnover
            if (kpis.turnover.valor > 4) {
                lines.push({ ic: warn, t: `Taxa de turnover alta (<b>${kpis.turnover.valor.toFixed(1)}%</b>). Isso indica risco de evasão e aumento de custos rescisórios.`});
            } else {
                lines.push({ ic: check, t: `Turnover sob controle (${kpis.turnover.valor.toFixed(1)}%), sinalizando boa retenção de talentos no período.`});
            }

            // Regra 3: Benefícios vs Folha
            if (kpis.folha.valor > 0) {
                const benRatio = ((kpis.beneficios.valor / kpis.folha.valor) * 100).toFixed(1);
                lines.push({ ic: info, t: `Atualmente os benefícios equivalem a <b>${benRatio}%</b> da base salarial. Padrão saudável de mercado varia de 15% a 25%.`});
            }

            // Regra 4: Departamento mais caro formatado
            if (graficos.departamentos && graficos.departamentos.length > 0) {
                let maxDep = graficos.departamentos.reduce((a,b) => a[1]>b[1] ? a : b);
                let pct = ((maxDep[1] / kpis.ativos.valor) * 100).toFixed(1);
                lines.push({ ic: info, t: `O departamento <b>${maxDep[0]}</b> é a maior força motriz atual, agrupando ${pct}% dos colaboradores ativos.`});
            }

            var html = '';
            lines.forEach(l => {
                html += `<div class="insight-item"><div>${l.ic}</div><div>${l.t}</div></div>`;
            });
            return html;
        }
      </script>
    </body>
    </html>
    <!-- HTML END -->
    `;
    
    var htmlOutput = HtmlService.createHtmlOutput(htmlContent)
        .setWidth(1400)
        .setHeight(850);
        
    ui.showModalDialog(htmlOutput, 'Dashboard Gerencial RH');
}
"""

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content + "\\n" + new_dashboard)

print("Pro Max Dashboard successfully injected!")
