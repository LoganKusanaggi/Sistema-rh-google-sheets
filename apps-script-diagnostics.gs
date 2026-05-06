/**
 * DIAGNÓSTICO RAIO-X DO BACKEND (SEM UI)
 * Este script deve ser executado diretamente do editor do Apps Script.
 * Não depende de SpreadsheetApp.getUi().
 */
function diagnosticarBackendRaioXSemUI() {
  const baseUrl = 'https://sistema-rh-google-sheets.vercel.app/api';
  const idToken = ScriptApp.getIdentityToken(); // Token OIDC para rotas protegidas
  
  const endpoints = [
    { name: 'Health Check', path: '/health', method: 'get' },
    { name: 'Boot Diagnostics', path: '/_debug/boot', method: 'get' },
    { name: 'DB Diagnostics', path: '/_debug/db', method: 'get' },
    { name: 'Dashboard KPIs', path: '/dashboard/kpis', method: 'get' },
    { name: 'Folha Pagamento', path: '/folha?ano=2026&mes=5', method: 'get' },
    { name: 'Benefícios', path: '/beneficios?ano=2026&mes=5', method: 'get' },
    { name: 'Variável', path: '/variavel?ano=2026&mes=5', method: 'get' },
    { name: 'Apontamentos', path: '/apontamentos?ano=2026&mes=5', method: 'get' },
    { name: 'Admin Auth Diag', path: '/admin/auth/diagnostico', method: 'get', auth: true },
    { name: 'My Profile', path: '/me/profile', method: 'get', auth: true },
    { name: 'My Folder', path: '/me/report-folder', method: 'get', auth: true }
  ];

  Logger.log('====================================================');
  Logger.log('SISTEMA RH - DIAGNÓSTICO RAIO-X (BACKEND)');
  Logger.log('Base URL: ' + baseUrl);
  Logger.log('Timestamp: ' + new Date().toISOString());
  Logger.log('====================================================');

  endpoints.forEach(ep => {
    const url = baseUrl + ep.path;
    const options = {
      method: ep.method,
      muteHttpExceptions: true,
      headers: {}
    };

    if (ep.auth) {
      options.headers['Authorization'] = 'Bearer ' + idToken;
    }

    try {
      const response = UrlFetchApp.fetch(url, options);
      const statusCode = response.getResponseCode();
      const contentType = response.getHeaders()['Content-Type'] || '';
      const body = response.getContentText();
      
      Logger.log('\n[' + ep.name + '] ' + ep.method.toUpperCase() + ' ' + ep.path);
      Logger.log('Status: ' + statusCode);
      Logger.log('Content-Type: ' + contentType);
      
      const isJson = contentType.includes('application/json');
      
      if (isJson) {
        const parsed = parseApiJsonSistemaRH(response, ep.name);
        if (parsed.success) {
          Logger.log('Resultado: SUCESSO (JSON)');
          Logger.log('Payload: ' + JSON.stringify(parsed.data).substring(0, 500));
        } else {
          Logger.log('Resultado: ERRO NO JSON');
          Logger.log('Mensagem: ' + parsed.error);
        }
      } else {
        Logger.log('Resultado: RESPOSTA NÃO-JSON (CRASH PROVÁVEL)');
        Logger.log('Corpo (Preview 500ch): ' + body.substring(0, 500));
      }

    } catch (e) {
      Logger.log('\n[' + ep.name + '] FALHA CRÍTICA NA CHAMADA: ' + e.message);
    }
  });

  Logger.log('\n====================================================');
  Logger.log('DIAGNÓSTICO CONCLUÍDO.');
  Logger.log('====================================================');
}

/**
 * HELPER PARA PARSE SEGURO DE JSON DO SISTEMA RH
 */
function parseApiJsonSistemaRH(response, context) {
  const statusCode = response.getResponseCode();
  const body = response.getContentText();
  const preview = body.substring(0, 200).replace(/\n/g, ' ');

  try {
    const data = JSON.parse(body);
    return {
      success: statusCode >= 200 && statusCode < 300,
      data: data,
      rawStatus: statusCode
    };
  } catch (e) {
    return {
      success: false,
      error: 'Resposta inválida da API em "' + context + '". HTTP ' + statusCode + '. Corpo inicial: ' + preview,
      rawStatus: statusCode,
      rawBodyPreview: preview
    };
  }
}
