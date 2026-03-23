import sys

dashboard_code = """
// =====================================================
// DASHBOARD ANALÍTICO (SPRINT 1)
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
    
    // PRE-LOAD SERVER SIDE (Fix Edge PERMISSION_DENIED)
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
    <html>
    <head>
      <base target="_top">
      <!-- Módulos Google Charts -->
      <script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
      <style>
        :root {
          --primary: #4F46E5;
          --primary-light: #EEF2FF;
          --text-main: #0F172A;
          --text-muted: #475569;
          --border: #E2E8F0;
          --bg-main: #F8FAFC;
          --bg-card: #FFFFFF;
          --success: #10B981;
          --warning: #F59E0B;
        }
        body { 
          font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
          background-color: var(--bg-main); 
          color: var(--text-main);
          margin: 0;
          padding: 24px;
        }
        h2 { 
          margin-top: 0; 
          font-size: 24px; 
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 24px;
        }
        
        /* Grid KPIs */
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
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
          border: 1px solid var(--border);
          display: flex;
          flex-direction: column;
        }
        .kpi-card .title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }
        .kpi-card .value {
          font-size: 28px;
          font-weight: 800;
          color: var(--primary);
        }
        .kpi-card .icon-wrapper {
          align-self: flex-start;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: var(--primary-light);
          color: var(--primary);
          margin-bottom: 12px;
        }

        /* Graficos Grid */
        .chart-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }
        .chart-card {
          background: var(--bg-card);
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
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
          height: 300px;
        }
        
        /* Alertas List */
        .alert-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .alert-item {
          padding: 12px 16px;
          background: #FFFBEB;
          border-left: 4px solid var(--warning);
          border-radius: 0 8px 8px 0;
          font-size: 14px;
          color: #92400E;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .loading-state, .error-state {
            padding: 40px;
            text-align: center;
            font-size: 16px;
            color: var(--text-muted);
        }
        .error-state {
            color: #DC2626;
            background: #FEF2F2;
            border-radius: 8px;
            border: 1px solid #F87171;
        }
        
        /* SVG Icons */
        svg { width: 20px; height: 20px; stroke-width: 2; stroke: currentColor; fill: none; stroke-linecap: round; stroke-linejoin: round; }
      </style>
    </head>
    <body>
      
      <h2>Dashboard Gerencial</h2>
      
      <div id="content_area">
        <div class="loading-state">⚙️ Processando métricas no servidor...</div>
      </div>

      <script>
        // Formatter de Moeda
        const formatBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

        // Icones SVG pro-max style
        const icons = {
            users: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
            money: '<svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
            gift: '<svg viewBox="0 0 24 24"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>',
            chart: '<svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>',
            alert: '<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
        };

        window.onload = function() {
            var el = document.getElementById('srvdashboard');
            if (el) {
                try {
                    var data = JSON.parse(el.textContent);
                    if (data && data.success) {
                        // Carrega Google Charts
                        google.charts.load('current', {'packages':['corechart', 'line']});
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
            document.getElementById('content_area').innerHTML = '<div class="error-state">❌ Erro ao processar dashboard: ' + msg + '</div>';
        }

        function renderizarDashboard(payload) {
            var html = '';
            
            // 1. Renderizar KPIs
            var k = payload.kpis || { colaboradoresAtivos: 0, totalFolhaMes: 0, totalBeneficiosMes: 0, totalVariaveisMes: 0 };
            html += '<div class="kpi-grid">';
            html += htmlKpiCard('Colaboradores Ativos', k.colaboradoresAtivos, icons.users);
            html += htmlKpiCard('Folha do Mês', formatBRL.format(k.totalFolhaMes), icons.money);
            html += htmlKpiCard('Benefícios', formatBRL.format(k.totalBeneficiosMes), icons.gift);
            html += htmlKpiCard('Variáveis', formatBRL.format(k.totalVariaveisMes), icons.chart);
            html += '</div>';

            // 2. Renderizar Gráficos e Alertas
            html += '<div class="chart-grid">';
            
            // Grafico 1: Evolução
            html += '<div class="chart-card">';
            html += '<h3>Evolução da Folha (6 Meses)</h3>';
            html += '<div id="chart_div_evolucao" class="chart-container"></div>';
            html += '</div>';

            // Lado direito: Departamentos + Alertas
            html += '<div style="display:flex; flex-direction:column; gap:24px;">';
            
            html += '<div class="chart-card">';
            html += '<h3>Por Departamento</h3>';
            html += '<div id="chart_div_deps" class="chart-container" style="height:220px;"></div>';
            html += '</div>';

            html += '<div class="chart-card">';
            html += '<h3>Notificações</h3>';
            html += '<div class="alert-list">';
            if (payload.alertas && payload.alertas.length > 0) {
                payload.alertas.forEach(function(a) {
                    html += '<div class="alert-item"><div style="flex-shrink:0;">' + icons.alert + '</div><div>' + a.texto + '</div></div>';
                });
            } else {
                html += '<div style="color:var(--text-muted); font-size:14px;">Sem alertas pendentes.</div>';
            }
            html += '</div>';
            html += '</div>'; // end right column chart-card
            html += '</div>'; // end right column display:flex

            html += '</div>'; // end chart-grid

            document.getElementById('content_area').innerHTML = html;

            // 3. Desenhar Gráficos com Google Charts API
            if (payload.graficos) {
                desenharGraficoEvolucao(payload.graficos.evolucao);
                desenharGraficoDepartamentos(payload.graficos.departamentos);
            }
        }

        function htmlKpiCard(title, value, iconTemplate) {
            return '<div class="kpi-card"><div class="icon-wrapper">' + iconTemplate + '</div><div class="title">' + title + '</div><div class="value">' + value + '</div></div>';
        }

        function desenharGraficoEvolucao(evolucaoData) {
            if(!evolucaoData || evolucaoData.length === 0) return;
            
            // Reverter para cronológico
            var crono = evolucaoData.slice().reverse();
            
            var data = new google.visualization.DataTable();
            data.addColumn('string', 'Mês');
            data.addColumn('number', 'Folha (R$)');
            data.addColumn('number', 'Benefícios (R$)');

            crono.forEach(function(item) {
                data.addRow([item.mes, parseFloat(item.folha)||0, parseFloat(item.beneficios)||0]);
            });

            var options = {
                fontName: 'Inter',
                colors: ['#4F46E5', '#10B981'],
                chartArea: { width: '85%', height: '75%' },
                legend: { position: 'top' },
                vAxis: { minValue: 0, textStyle: { color: '#475569'}, gridlines: { color: '#E2E8F0'} },
                hAxis: { textStyle: { color: '#475569'} },
                animation: { startup: true, duration: 1000, easing: 'out' },
                lineWidth: 3,
                pointSize: 5
            };

            var chart = new google.visualization.AreaChart(document.getElementById('chart_div_evolucao'));
            chart.draw(data, options);
        }

        function desenharGraficoDepartamentos(depsData) {
            if(!depsData || depsData.length === 0) return;
            
            var data = new google.visualization.DataTable();
            data.addColumn('string', 'Departamento');
            data.addColumn('number', 'Ativos');

            depsData.forEach(function(row) {
                data.addRow([row[0], parseInt(row[1])||0]);
            });

            var options = {
                fontName: 'Inter',
                colors: ['#4F46E5', '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6'],
                chartArea: { width: '90%', height: '80%' },
                pieHole: 0.4,
                legend: { position: 'labeled', textStyle: { fontSize: 12 } },
                pieSliceText: 'none',
                pieSliceBorderColor: 'transparent'
            };

            var chart = new google.visualization.PieChart(document.getElementById('chart_div_deps'));
            chart.draw(data, options);
        }
      </script>
    </body>
    </html>
    <!-- HTML END -->
    `;
    
    var htmlOutput = HtmlService.createHtmlOutput(htmlContent)
        .setWidth(1080)
        .setHeight(700);
        
    ui.showModalDialog(htmlOutput, 'Dashboard Analítico');
}
"""

with open("e:\\Projetos_GitHub\\rh-google-sheets\\Sistema-rh-google-sheets\\CODIGO_FINAL_CORRETO.js", "a", encoding="utf-8") as f:
    f.write(dashboard_code)

print("Dashboard code appended successfully!")
