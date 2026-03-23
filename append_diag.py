"""Append diagnostic function to CODIGO_FINAL_CORRETO.js"""
diag = """
// =====================================================
// FUNCAO DE DIAGNOSTICO - Execute no Apps Script Editor
// =====================================================
function testarCompatibilidadeEdge() {
    Logger.log('=== DIAGNOSTICO DE COMPATIBILIDADE ===');
    try { var t1 = listarPlanosAPI(); Logger.log('listarPlanosAPI: ' + (t1.success ? 'OK ' + (t1.data||[]).length + ' planos' : 'FALHA ' + t1.error)); } catch(e) { Logger.log('listarPlanosAPI ERR: ' + e.message); }
    try { var t2 = listarHistoricoAPI(null); Logger.log('listarHistoricoAPI: ' + (t2.success ? 'OK ' + (t2.historico||[]).length + ' snapshots' : 'FALHA ' + t2.error)); } catch(e) { Logger.log('listarHistoricoAPI ERR: ' + e.message); }
    Logger.log('API URL: ' + CONFIG.API_URL);
    Logger.log('escapeHtml test: ' + escapeHtml('<script>alert(1)</script>'));
    SpreadsheetApp.getUi().alert('Diagnostico concluido! Veja Apps Script > Logs');
}
"""
with open('CODIGO_FINAL_CORRETO.js', 'a', encoding='utf-8', newline='') as f:
    f.write(diag)
print('Done - appended diagnostic function')
