
// =====================================================
// FUNCIONALIDADES DE HISTÓRICO (RESTAURADO)
// =====================================================

// 1. API WRAPPERS
function listarHistoricoAPI(tipo) {
    const endpoint = `${CONFIG.API_URL}/relatorios/historico`;
    const payload = { tipo: tipo || null, limit: 20 };

    const options = {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload)
    };

    try {
        const response = UrlFetchApp.fetch(endpoint, options);
        return JSON.parse(response.getContentText());
    } catch (e) {
        return { success: false, error: e.message };
    }
}

function obterHistoricoAPI(id) {
    const endpoint = `${CONFIG.API_URL}/relatorios/historico/${id}`;

    try {
        const response = UrlFetchApp.fetch(endpoint);
        return JSON.parse(response.getContentText());
    } catch (e) {
        return { success: false, error: e.message };
    }
}

// 2. MODAL UI
function listarHistoricoModal() {
    const html = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 20px; background-color: #f8f9fa; }
      h2 { color: #1a73e8; margin-top: 0; }
      .loading { text-align: center; color: #666; margin-top: 20px; }
      table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
      th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
      th { background-color: #f1f3f4; font-weight: 600; color: #5f6368; }
      tr:hover { background-color: #f8f9fa; }
      .badge { padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; }
      .badge-folha { background: #e8f0fe; color: #1967d2; }
      .badge-beneficios { background: #e6f4ea; color: #137333; }
      .btn-load { background: #1a73e8; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; }
      .btn-load:hover { background: #1557d0; }
      .btn-load:disabled { background: #ccc; cursor: not-allowed; }
    </style>

    <h2>📜 Histórico de Relatórios (Snapshots)</h2>
    <p>Visualize e recupere versões anteriores geradas.</p>
    
    <div id="content">
      <div class="loading">Carregando histórico...</div>
    </div>

    <script>
      function carregarHistorico() {
        google.script.run
          .withSuccessHandler(renderizarTabela)
          .withFailureHandler(mostrarErro)
          .listarHistoricoAPI();
      }

      function renderizarTabela(res) {
        if (!res.success) return mostrarErro(res.error);
        
        const lista = res.historico;
        if (!lista || lista.length === 0) {
          document.getElementById('content').innerHTML = '<p>Nenhum histórico encontrado.</p>';
          return;
        }

        let html = '<table><thead><tr><th>Data</th><th>Tipo</th><th>Ref</th><th>Ação</th></tr></thead><tbody>';
        
        lista.forEach(item => {
          const data = new Date(item.created_at).toLocaleString('pt-BR');
          const tipoClass = 'badge-' + item.tipo;
          
          html += '<tr>';
          html += '<td>' + data + '</td>';
          html += '<td><span class="badge ' + tipoClass + '">' + item.tipo.toUpperCase() + '</span></td>';
          html += '<td>' + (item.mes_referencia ? item.mes_referencia + '/' + item.ano_referencia : '-') + '</td>';
          html += '<td><button class="btn-load" onclick="carregarVersao(\\'' + item.id + '\\', \\'' + item.tipo + '\\')">📂 Abrir</button></td>';
          html += '</tr>';
        });
        
        html += '</tbody></table>';
        document.getElementById('content').innerHTML = html;
      }

      function carregarVersao(id, tipo) {
        if(!confirm('Deseja carregar esta versão em uma nova aba para visualização/edição?')) return;
        
        const btn = event.target;
        btn.textContent = 'Carregando...';
        btn.disabled = true;

        google.script.run
          .withSuccessHandler(() => { 
             alert('Versão carregada com sucesso em nova aba!');
             google.script.host.close();
          })
          .withFailureHandler((err) => {
             alert('Erro ao carregar versão: ' + err);
             btn.textContent = '📂 Abrir';
             btn.disabled = false;
          })
          .carregarSnapshotParaAba(id);
      }

      function mostrarErro(msg) {
        document.getElementById('content').innerHTML = '<p style="color:red">Erro: ' + msg + '</p>';
      }

      window.onload = carregarHistorico;
    </script>
  `).setWidth(600).setHeight(500);

    SpreadsheetApp.getUi().showModalDialog(html, 'Histórico de Versões');
}

// 3. LOGICA DE CARREGAR SNAPSHOT PARA ABA
function carregarSnapshotParaAba(id) {
    const res = obterHistoricoAPI(id);
    if (!res.success) throw new Error(res.error);

    const header = res.relatorio;
    const itens = res.itens;

    // Reconstrói o formato de dados esperado por criarAbaRelatorio
    // ITENS do DB: { dados_snapshot: { ...campos... } }
    // FORMATO ESPERADO: [ { ...campos... }, { ...campos... } ]

    const dados = itens.map(i => i.dados_snapshot);

    const nomeAba = `V. ${header.created_at.substring(0, 10)} - ${header.tipo}`;
    const periodo = { mes: header.mes_referencia, ano: header.ano_referencia };

    // Reutiliza a função de layout existente!
    criarAbaRelatorio(header.tipo, nomeAba, dados, periodo);

    return { success: true };
}
