// =====================================================
// FUNÇÃO CORRIGIDA - COPIE E COLE NO GOOGLE APPS SCRIPT
// SUBSTITUA A FUNÇÃO mostrarModalEdicao EXISTENTE
// =====================================================

function mostrarModalEdicao(colaborador) {
    const html = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial; padding: 20px; }
      label { display: block; margin-top: 10px; font-weight: bold; }
      input, select { width: 100%; padding: 8px; margin: 5px 0; box-sizing: border-box; }
      button { background: #4285f4; color: white; padding: 10px 20px; 
               border: none; margin: 10px 5px 0 0; cursor: pointer; }
      button:hover { background: #357ae8; }
      .info { background: #e3f2fd; padding: 10px; margin-bottom: 15px; border-left: 4px solid #2196f3; }
      .readonly { background: #f5f5f5; cursor: not-allowed; }
      .row { display: flex; gap: 10px; }
      .col { flex: 1; }
    </style>
    
    <h2>📝 Editar Colaborador</h2>
    
    <div class="info">
      <strong>CPF:</strong> ${formatarCPFParaExibicao(colaborador.cpf)}<br>
      <small>O CPF não pode ser alterado</small>
    </div>
    
    <form id="formEdicao">
      <input type="hidden" id="colaborador_id" value="${colaborador.id}">
      <input type="hidden" id="cpf" value="${colaborador.cpf}">
      
      <label>Nome Completo</label>
      <input type="text" id="nome_completo" value="${colaborador.nome_completo || ''}" required>
      
      <label>Email</label>
      <input type="email" id="email" value="${colaborador.email || ''}" placeholder="email@empresa.com">
      
      <label>Telefone</label>
      <input type="text" id="telefone" value="${colaborador.telefone || ''}" placeholder="(00) 00000-0000">
      
      <label>Cargo</label>
      <input type="text" id="cargo" value="${colaborador.cargo || ''}" placeholder="Ex: Analista, Gerente">
      
      <label>Departamento</label>
      <select id="departamento">
        <option value="">Selecione...</option>
        <option value="Comercial" ${colaborador.departamento === 'Comercial' ? 'selected' : ''}>Comercial</option>
        <option value="RH" ${colaborador.departamento === 'RH' ? 'selected' : ''}>RH</option>
        <option value="Financeiro" ${colaborador.departamento === 'Financeiro' ? 'selected' : ''}>Financeiro</option>
        <option value="Vendas" ${colaborador.departamento === 'Vendas' ? 'selected' : ''}>Vendas</option>
        <option value="TI" ${colaborador.departamento === 'TI' ? 'selected' : ''}>TI</option>
        <option value="Operações" ${colaborador.departamento === 'Operações' ? 'selected' : ''}>Operações</option>
      </select>
      
      <label>Local de Trabalho</label>
      <input type="text" id="local_trabalho" value="${colaborador.local_trabalho || ''}" placeholder="Ex: Matriz, Filial SP">
      
      <label>Cidade</label>
      <input type="text" id="cidade" value="${colaborador.cidade || ''}" placeholder="Ex: São Paulo">
      
      <label>Data de Admissão</label>
      <input type="date" id="data_admissao" value="${colaborador.data_admissao || ''}">
      
      <div class="row" style="background: #fff3e0; padding: 10px; border: 1px solid #ffe0b2; border-radius: 4px; margin: 10px 0;">
          <div class="col">
             <label style="margin-top:0">Salário Base (R$)</label>
             <input type="number" step="0.01" id="salario_base" value="${colaborador.salario_base || 0}">
          </div>
          <div class="col">
             <label style="margin-top:0">Motivo Alteração</label>
             <input type="text" id="motivo_alteracao" placeholder="Ex: Promoção, Dissídio" style="font-size: 11px;">
          </div>
      </div>

      <fieldset style="border: 1px solid #ccc; padding: 10px; border-radius: 4px; margin-top: 15px;">
        <legend style="font-weight:bold; color:#1a73e8;">🏥 Planos de Saúde e Odonto</legend>
        
        <div class="row">
          <div class="col" style="flex: 2;">
            <label>Plano de Saúde</label>
            <select id="plano_saude"><option value="">Carregando...</option></select>
          </div>
          <div class="col" style="flex: 1;">
            <label>Carteirinha (Matrícula Titular)</label>
            <input type="text" id="matricula_saude" placeholder="Ex: 95445982">
          </div>
        </div>
        
        <label>Plano Odontológico (Opcional)</label>
        <select id="plano_odonto"><option value="">Carregando...</option></select>
        
        <hr style="margin: 15px 0; border: 0; border-top: 1px solid #eee;">
        
        <label style="font-weight:bold;">👥 Dependentes</label>
        <div id="lista_dependentes" style="margin-bottom: 10px; font-size: 12px;">Carregando...</div>
        
        <div style="background: #f8f9fa; padding: 10px; border-radius: 4px; border: 1px solid #ddd;">
          <label style="margin-top:0">Adicionar Dependente:</label>
          <div class="row">
            <input type="text" id="dep_nome" placeholder="Nome Completo" style="flex: 2;">
            <input type="text" id="dep_cpf" placeholder="CPF" style="flex: 1;">
            <input type="date" id="dep_nasc" style="flex: 1;">
          </div>
          <div class="row">
            <select id="dep_parentesco" style="flex: 1;">
              <option value="">Parentesco...</option>
              <option value="Filho(a)">Filho(a)</option>
              <option value="Cônjuge">Cônjuge</option>
              <option value="Pai/Mãe">Pai/Mãe</option>
            </select>
            <input type="text" id="dep_matricula" placeholder="Matrícula Dep." style="flex: 1;">
            <button type="button" onclick="adicionarDependenteUI()" style="background:#28a745; padding: 5px 10px;">+</button>
          </div>
        </div>
      </fieldset>

      <label>Status</label>
      <select id="status">
        <option value="ativo" ${colaborador.status === 'ativo' ? 'selected' : ''}>Ativo</option>
        <option value="inativo" ${colaborador.status === 'inativo' ? 'selected' : ''}>Inativo</option>
        <option value="ferias" ${colaborador.status === 'ferias' ? 'selected' : ''}>Férias</option>
        <option value="afastado" ${colaborador.status === 'afastado' ? 'selected' : ''}>Afastado</option>
      </select>
      
      <div style="margin-top: 20px;">
        <button type="submit">✅ Salvar Alterações</button>
        <button type="button" onclick="google.script.host.close()">Cancelar</button>
      </div>
    </form>
    
    <div id="mensagem" style="margin-top: 20px; padding: 10px; display: none;"></div>
    
    <script>
      document.getElementById('telefone').addEventListener('input', function(e) {
        var value = e.target.value.replace(/[^0-9]/g, '');
        if (value.length <= 11) {
          if (value.length > 2) {
            value = '(' + value.substring(0, 2) + ') ' + value.substring(2);
          }
          if (value.length > 10) {
            value = value.substring(0, 10) + '-' + value.substring(10);
          }
          e.target.value = value;
        }
      });
      
      document.getElementById('formEdicao').addEventListener('submit', function(e) {
        e.preventDefault();
        
        var telefoneRaw = document.getElementById('telefone').value.replace(/[^0-9]/g, '');
        
        var dadosAtualizados = {
          nome_completo: document.getElementById('nome_completo').value,
          email: document.getElementById('email').value,
          telefone: telefoneRaw,
          cargo: document.getElementById('cargo').value,
          departamento: document.getElementById('departamento').value,
          local_trabalho: document.getElementById('local_trabalho').value,
          cidade: document.getElementById('cidade').value,
          data_admissao: document.getElementById('data_admissao').value,
          salario_base: document.getElementById('salario_base').value,
          motivo_alteracao: document.getElementById('motivo_alteracao').value,
          status: document.getElementById('status').value
        };
        
        var cpf = document.getElementById('cpf').value;
        
        mostrarMensagem('⏳ Salvando alterações...', 'info');
        
        google.script.run
          .withSuccessHandler(function(resultado) {
            if (resultado.success) {
              mostrarMensagem('⏳ Salvando planos...', 'info');
              
              var cid = document.getElementById('colaborador_id').value;
              var pSaude = document.getElementById('plano_saude').value;
              var pOdonto = document.getElementById('plano_odonto').value;
              var matriculaSaude = document.getElementById('matricula_saude').value;
              
              var finalizar = function() {
                 mostrarMensagem('✅ Dados salvos com sucesso!', 'success');
                 setTimeout(function() { google.script.host.close(); }, 1500);
              };

              var salvarOdonto = function() {
                  if (pOdonto) {
                      google.script.run.withSuccessHandler(finalizar)
                      .salvarPlanoColaboradorAPI(cid, pOdonto, null);
                  } else {
                      finalizar();
                  }
              };

              if (pSaude) {
                  google.script.run.withSuccessHandler(salvarOdonto)
                  .salvarPlanoColaboradorAPI(cid, pSaude, matriculaSaude);
              } else {
                  salvarOdonto();
              }
              
            } else {
              mostrarMensagem('❌ Erro: ' + resultado.error, 'error');
            }
          })
          .withFailureHandler(function(erro) {
            mostrarMensagem('❌ Erro ao salvar: ' + erro.message, 'error');
          })
          .atualizarColaboradorAPI(cpf, dadosAtualizados);
      });
      
      function mostrarMensagem(texto, tipo) {
        var div = document.getElementById('mensagem');
        div.style.display = 'block';
        div.innerHTML = texto;
        
        if (tipo === 'success') {
          div.style.background = '#d4edda';
          div.style.color = '#155724';
          div.style.border = '1px solid #c3e6cb';
        } else if (tipo === 'error') {
          div.style.background = '#f8d7da';
          div.style.color = '#721c24';
          div.style.border = '1px solid #f5c6cb';
        } else {
          div.style.background = '#d1ecf1';
          div.style.color = '#0c5460';
          div.style.border = '1px solid #bee5eb';
        }
      }
      
      window.onload = function() {
          carregarListasPlanos(); 
      };

      var listaPlanosCache = [];

      function carregarListasPlanos() {
          google.script.run.withSuccessHandler(function(res) {
              if (res.success) {
                  listaPlanosCache = res.data;
                  popularSelects(res.data);
                  carregarPlanosDoUsuario();
              } else {
                  console.error('Erro ao listar planos:', res.error);
                  alert('Erro ao carregar planos: ' + res.error);
                  var selSaude = document.getElementById('plano_saude');
                  var selOdonto = document.getElementById('plano_odonto');
                  if(selSaude) selSaude.innerHTML = '<option value="">Erro ao carregar</option>';
                  if(selOdonto) selOdonto.innerHTML = '<option value="">Erro ao carregar</option>';
              }
          }).listarPlanosAPI();
      }

      function popularSelects(planos) {
          var selSaude = document.getElementById('plano_saude');
          var selOdonto = document.getElementById('plano_odonto');
          
          selSaude.innerHTML = '<option value="">Sem Plano</option>';
          selOdonto.innerHTML = '<option value="">Sem Plano</option>';
          
          planos.forEach(function(p) {
              var opt = document.createElement('option');
              opt.value = p.id;
              var primeiroPreco = (p.precos && p.precos.length > 0 && p.precos[0].valor) ? p.precos[0].valor : '?';
              opt.textContent = p.nome + ' (R$ ' + primeiroPreco + ')';
              
              if (p.tipo === 'SAUDE') selSaude.appendChild(opt);
              else if (p.tipo === 'ODONTO') selOdonto.appendChild(opt);
          });
      }

      var dependentesCache = [];

      function carregarPlanosDoUsuario() {
          var id = document.getElementById('colaborador_id').value;
          if (!id) return;

          google.script.run.withSuccessHandler(function(res) {
              if (res.success && res.data) {
                  var planosUser = res.data;
                  document.getElementById('plano_saude').value = "";
                  document.getElementById('matricula_saude').value = "";
                  document.getElementById('plano_odonto').value = "";

                  planosUser.forEach(function(pu) {
                      if (pu.plano && pu.plano.tipo === 'SAUDE') {
                          document.getElementById('plano_saude').value = pu.plano_id;
                          if (pu.matricula) document.getElementById('matricula_saude').value = pu.matricula;
                      }
                      if (pu.plano && pu.plano.tipo === 'ODONTO') {
                          document.getElementById('plano_odonto').value = pu.plano_id;
                      }
                  });
              }
          }).buscarPlanosColaboradorAPI(id);

          carregarDependentesUI(id);
      }

      function carregarDependentesUI(colabId) {
          document.getElementById('lista_dependentes').innerHTML = 'Carregando...';
          
          google.script.run.withSuccessHandler(function(res) {
              if (res.success) {
                  dependentesCache = res.data;
                  renderizarDependentes();
              } else {
                  document.getElementById('lista_dependentes').innerHTML = 'Erro ao carregar.';
              }
          }).listarDependentesAPI(colabId);
      }

      function renderizarDependentes() {
          var div = document.getElementById('lista_dependentes');
          if (dependentesCache.length === 0) {
              div.innerHTML = '<span style="color:#666;">Nenhum dependente cadastrado.</span>';
              return;
          }

          var html = '<table style="width:100%; border-collapse: collapse;">';
          html += '<tr style="background:#eee; text-align:left;"><th>Nome</th><th>CPF</th><th>Nasc.</th><th>Idade</th><th>Parentesco</th><th>Matrícula</th><th></th></tr>';
          
          dependentesCache.forEach(function(d) {
              var idade = calcularIdade(d.data_nasc);
              var dataFmt = d.data_nasc ? new Date(d.data_nasc).toLocaleDateString() : '';
              html += '<tr>' +
                '<td style="border-bottom:1px solid #ddd; padding:4px;">' + d.nome + '</td>' +
                '<td style="border-bottom:1px solid #ddd; padding:4px;">' + (d.cpf || '-') + '</td>' +
                '<td style="border-bottom:1px solid #ddd; padding:4px;">' + dataFmt + '</td>' +
                '<td style="border-bottom:1px solid #ddd; padding:4px;">' + idade + ' anos</td>' +
                '<td style="border-bottom:1px solid #ddd; padding:4px;">' + d.parentesco + '</td>' +
                '<td style="border-bottom:1px solid #ddd; padding:4px;">' + (d.matricula || '-') + '</td>' +
                '<td style="border-bottom:1px solid #ddd; padding:4px; text-align:right;">' +
                  '<span onclick="removerDependenteUI(\'' + d.id + '\')" style="cursor:pointer; color:red;">🗑️</span>' +
                '</td>' +
              '</tr>';
          });
          html += '</table>';
          div.innerHTML = html;
      }

      function calcularIdade(dataNasc) {
          var hoje = new Date();
          var nasc = new Date(dataNasc);
          var idade = hoje.getFullYear() - nasc.getFullYear();
          var m = hoje.getMonth() - nasc.getMonth();
          if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
              idade--;
          }
          return idade;
      }

      function adicionarDependenteUI() {
          var id = document.getElementById('colaborador_id').value;
          var nome = document.getElementById('dep_nome').value;
          var cpf = document.getElementById('dep_cpf').value;
          var nasc = document.getElementById('dep_nasc').value;
          var parentesco = document.getElementById('dep_parentesco').value;
          var matricula = document.getElementById('dep_matricula').value;

          if (!nome || !nasc || !parentesco) {
              alert('Preencha Nome, Data Nasc. e Parentesco!');
              return;
          }

          var btn = event.target;
          btn.textContent = '⏳';
          btn.disabled = true;

          var novoDep = {
              nome: nome,
              cpf: cpf,
              data_nasc: nasc,
              parentesco: parentesco,
              matricula: matricula
          };

          google.script.run.withSuccessHandler(function(res) {
              btn.textContent = '+';
              btn.disabled = false;
              if (res.success) {
                  document.getElementById('dep_nome').value = '';
                  document.getElementById('dep_cpf').value = '';
                  document.getElementById('dep_nasc').value = '';
                  document.getElementById('dep_matricula').value = '';
                  
                  carregarDependentesUI(id);
              } else {
                  alert('Erro ao salvar: ' + res.error);
              }
          }).adicionarDependenteAPI(id, novoDep);
      }

      function removerDependenteUI(depId) {
          if(!confirm('Remover este dependente?')) return;
          var id = document.getElementById('colaborador_id').value;
          
          google.script.run.withSuccessHandler(function(res) {
              if (res.success) {
                  carregarDependentesUI(id);
              } else {
                  alert('Erro ao remover: ' + res.error);
              }
          }).removerDependenteAPI(depId);
      }
    </script>
  `).setWidth(500).setHeight(700);

    SpreadsheetApp.getUi().showModalDialog(html, 'Editar Colaborador');
}
