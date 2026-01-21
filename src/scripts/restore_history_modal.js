
// =====================================================
// HISTÓRICO DE VERSÕES (RESTAURADO)
// =====================================================

function listarHistoricoModal() {
    const html = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: 'Segoe UI', Roboto, Arial; padding: 20px; background: #f8f9fa; color: #333; }
      .header { border-bottom: 2px solid #4285f4; padding-bottom: 10px; margin-bottom: 20px; }
      h2 { margin: 0; color: #1a73e8; }
      .version-card { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 15px; border-left: 4px solid #34a853; }
      .version-title { font-weight: bold; font-size: 16px; display: flex; justify-content: space-between; }
      .version-date { color: #666; font-size: 12px; }
      ul { padding-left: 20px; margin: 10px 0 0 0; }
      li { margin-bottom: 5px; font-size: 14px; }
      .btn { display: block; width: 100%; padding: 10px; border: none; background: #4285f4; color: white; border-radius: 4px; cursor: pointer; font-weight: bold; margin-top: 20px; }
      .btn:hover { background: #357ae8; }
    </style>
    
    <div class="header">
      <h2>📜 Histórico de Versões</h2>
      <p>Sistema RH Integrado</p>
    </div>
    
    <div class="version-card">
      <div class="version-title">
        <span>v2.1.0 - Correção de Bugs</span>
        <span class="version-date">Atual</span>
      </div>
      <ul>
        <li>✅ Fix: Persistência de Salário (Moeda)</li>
        <li>✅ Fix: Tela branca ao salvar</li>
        <li>✅ Fix: Checkbox "Selecionar Todos" restaurado</li>
        <li>✅ Fix: Modal de Histórico restaurado</li>
      </ul>
    </div>

    <div class="version-card" style="border-left-color: #4285f4; opacity: 0.8;">
      <div class="version-title">
        <span>v2.0.0 - Arquitetura Segura</span>
        <span class="version-date">Dez 2024</span>
      </div>
      <ul>
        <li>🚀 Integração Supabase Completa</li>
        <li>🚀 Nova API de Backend</li>
        <li>🚀 Gestão de Planos de Saúde/Odonto</li>
        <li>🚀 Performance Otimizada</li>
      </ul>
    </div>
    
    <button class="btn" onclick="google.script.host.close()">Fechar</button>
  `).setWidth(450).setHeight(500);

    SpreadsheetApp.getUi().showModalDialog(html, 'Histórico de Versões');
}
