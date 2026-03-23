"""
Python script to precisely replace the google.script.run calls in the Edit modal
with a server-side JSON pre-load injection.
"""

import re

filename = 'CODIGO_FINAL_CORRETO.js'

with open(filename, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update the GAS-side preloading lines before the modal creation
pattern1 = re.compile(
r"    // FIX EDGE PERMISSION_DENIED: Pre-carrega planos no servidor antes de montar o modal\.\n"
r"    // Elimina google\.script\.run para o carregamento inicial dos dropdowns\.\n"
r"    var planosResult = null;\n"
r"    try \{ planosResult = listarPlanosAPI\(\); \} catch\(e\) \{ planosResult = \{ success: false, error: e\.message \}; \}\n"
r"    var planosTag = '<script type=\"application/json\" id=\"srvplanos\">' \+ JSON\.stringify\(planosResult\)\.replace\(/<\\\\//g, '\\\\u003c/'\) \+ '<\\\\/script>';"
)

replacement1 = """    // FIX EDGE PERMISSION_DENIED: Pre-carrega TODOS OS DADOS no servidor antes de montar o modal.
    // Elimina google.script.run para o carregamento inicial.
    var colabId = colaborador.id || colaborador.colaborador_id || colaborador.cpf;
    var planosList = null, pUsuario = null, depsRes = null;
    try { planosList = listarPlanosAPI(); } catch(e) { planosList = { success: false, error: e.message }; }
    try { pUsuario = buscarPlanosColaboradorAPI(colabId); } catch(e) { pUsuario = { success: false, error: e.message }; }
    try { depsRes = listarDependentesAPI(colabId); } catch(e) { depsRes = { success: false, error: e.message }; }

    var pTag = '<script type="application/json" id="srvplanos">' + JSON.stringify(planosList).replace(/<\\//g, '\\\\u003c/') + '<\\\\/script>';
    var puTag = '<script type="application/json" id="srvplanosuser">' + JSON.stringify(pUsuario).replace(/<\\//g, '\\\\u003c/') + '<\\\\/script>';
    var dTag = '<script type="application/json" id="srvdeps">' + JSON.stringify(depsRes).replace(/<\\//g, '\\\\u003c/') + '<\\\\/script>';
    var dataTags = pTag + puTag + dTag;"""

content = pattern1.sub(replacement1, content)
content = content.replace("HtmlService.createHtmlOutput(planosTag + `", "HtmlService.createHtmlOutput(dataTags + `")


# 2. Update carregarPlanosDoUsuario()
pattern2 = re.compile(
r"      function carregarPlanosDoUsuario\(\) \{\s*"
r"          var id = document\.getElementById\('colaborador_id'\)\.value;\s*"
r"          console\.log\('Carregando planos para colaborador ID:', id\);\s*"
r"          google\.script\.run\s*"
r"              \.withSuccessHandler\(function\(res\) \{[\s\S]*?"
r"              \.buscarPlanosColaboradorAPI\(id\);\s*"
r"          carregarDependentesUI\(id\);\s*"
r"      \}"
)

replacement2 = """      function carregarPlanosDoUsuario() {
          var id = document.getElementById('colaborador_id').value;
          console.log('Carregando planos para colaborador ID:', id);

          var el = document.getElementById('srvplanosuser');
          if (el) {
              var res = JSON.parse(el.textContent);
              console.log('✅ Planos do Usuario carregados pelo servidor:', res);
              _processarPlanosUsuario(res);
          } else {
              _carregarPlanosUsuarioFallback(id);
          }
          carregarDependentesUI(id);
      }

      function _processarPlanosUsuario(res) {
          if (res && res.success && res.data) {
              res.data.forEach(function(pu) {
                  if (!pu.plano) return;
                  var tipo = (pu.plano.tipo || '').toUpperCase();
                  if (tipo === 'SAUDE') {
                      var elSaude = document.getElementById('plano_saude');
                      elSaude.value = String(pu.plano_id);
                      var mat = pu.matricula || pu.carteirinha || pu.numero_carteirinha;
                      if (mat) document.getElementById('matricula_saude').value = mat;
                  }
                  if (tipo === 'ODONTO') {
                      var elOdonto = document.getElementById('plano_odonto');
                      elOdonto.value = pu.plano_id;
                      if (elOdonto.value != pu.plano_id) elOdonto.value = String(pu.plano_id);
                  }
              });
          } else {
              console.warn('Nenhum plano (usuario) retornado ou erro:', res);
          }
      }

      function _carregarPlanosUsuarioFallback(id) {
          var _t = setTimeout(function() { console.warn('⏰ Timeout usuario planos (12s).'); }, 12000);
          google.script.run
              .withSuccessHandler(function(res) { clearTimeout(_t); _processarPlanosUsuario(res); })
              .withFailureHandler(function(err) { clearTimeout(_t); console.error('🔴 Falha Edge API planosUsu:', err); })
              .buscarPlanosColaboradorAPI(id);
      }"""

content = pattern2.sub(replacement2, content)


# 3. Update carregarDependentesUI
pattern3 = re.compile(
r"      // FIX B1b: Adicionado withFailureHandler \+ timeout para prevenir loading infinito no Edge\s*"
r"      function carregarDependentesUI\(colabId\) \{[\s\S]*?"
r"              \.listarDependentesAPI\(colabId\);\s*"
r"      \}"
)

replacement3 = """      // FIX B1b: Alterado para carregar via server-script tag para Edge
      function carregarDependentesUI(colabId) {
          var div = document.getElementById('lista_dependentes');
          div.innerHTML = '🔄 Carregando...';

          var el = document.getElementById('srvdeps');
          if (el) {
              var res = JSON.parse(el.textContent);
              console.log('✅ Dependentes carregados pelo servidor:', res);
              if (res && res.success) renderizarDependentes(res.data);
              else div.innerHTML = '❌ Erro dependentes: ' + (res ? res.error : 'invalido');
              
              // OBRIGATORIO: Se for chamado novamente (ex: apos adicioar dep), bate na API
              el.parentNode.removeChild(el);
          } else {
              _carregarDependentesFallback(colabId);
          }
      }

      function _carregarDependentesFallback(colabId) {
          var div = document.getElementById('lista_dependentes');
          var _t = setTimeout(function() { div.innerHTML = '<i style="color:#d93025;">⚠️ Timeout (12s). Tente reabrir.</i>'; }, 12000);
          google.script.run
              .withSuccessHandler(function(res) {
                  clearTimeout(_t);
                  if (res && res.success) renderizarDependentes(res.data);
                  else div.innerHTML = '❌ Erro dependentes: ' + (res ? res.error : 'invalido');
              })
              .withFailureHandler(function(err) {
                  clearTimeout(_t);
                  console.error('🔴 Falha dependentes Edge:', err);
                  div.innerHTML = '❌ Falha comunicacao (F12).';
              })
              .listarDependentesAPI(colabId);
      }"""

content = pattern3.sub(replacement3, content)

with open(filename, 'w', encoding='utf-8') as f:
    f.write(content)

print('Replacement completed!')
