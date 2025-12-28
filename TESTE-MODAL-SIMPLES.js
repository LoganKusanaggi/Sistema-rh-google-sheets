// =====================================================
// TESTE: MODAL SIMPLIFICADO SEM PLANOS
// =====================================================
// Cole este código NO GOOGLE APPS SCRIPT para testar

function testarModalSimples() {
    const html = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial; padding: 20px; }
      label { display: block; margin-top: 10px; font-weight: bold; }
      input { width: 100%; padding: 8px; margin: 5px 0; }
      button { background: #4285f4; color: white; padding: 10px 20px; 
               border: none; margin: 10px 5px 0 0; cursor: pointer; }
    </style>
    
    <h2>📝 Teste Modal Simples</h2>
    
    <label>Nome</label>
    <input type="text" id="nome" value="Teste">
    
    <label>Email</label>
    <input type="email" id="email" value="teste@teste.com">
    
    <button onclick="testar()">Testar</button>
    <button onclick="google.script.host.close()">Fechar</button>
    
    <div id="resultado"></div>
    
    <script>
      function testar() {
        document.getElementById('resultado').innerHTML = '✅ JavaScript funcionando!';
      }
    </script>
  `).setWidth(400).setHeight(300);

    SpreadsheetApp.getUi().showModalDialog(html, 'Teste Simples');
}
