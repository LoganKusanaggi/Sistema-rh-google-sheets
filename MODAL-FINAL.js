// =====================================================
// VERSÃO SEGURA - SEM EMOJIS, SEM REGEX LITERAL
// =====================================================

function mostrarModalEdicao(colaborador) {
  // Tratamento seguro de valores
  var nome = colaborador.nome_completo || '';
  var email = colaborador.email || '';
  var telefone = colaborador.telefone || '';
  var cargo = colaborador.cargo || '';
  var dep = colaborador.departamento || '';
  var local = colaborador.local_trabalho || '';
  var cidade = colaborador.cidade || '';
  var admissao = colaborador.data_admissao || '';
  var salario = colaborador.salario_base || '0';
  var motivo = colaborador.motivo_alteracao || '';
  var status = colaborador.status || 'ativo';

  // Formatar salario
  if (typeof salario === 'number') salario = salario.toFixed(2);
  salario = salario.toString().replace('.', ',');

  const html = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial; padding: 20px; }
      label { display: block; margin-top: 10px; font-weight: bold; }
      input, select { width: 100%; padding: 8px; margin: 5px 0; box-sizing: border-box; }
      button { background: #4285f4; color: white; padding: 10px 20px; 
               border: none; margin: 10px 5px 0 0; cursor: pointer; }
      button:hover { background: #357ae8; }
      .info { background: #e3f2fd; padding: 10px; margin-bottom: 15px; border-left: 4px solid #2196f3; }
      .row { display: flex; gap: 10px; }
      .col { flex: 1; }
    </style>
    
    <h2>Editar Colaborador</h2>
    
    <div class="info">
      <strong>CPF:</strong> ${formatarCPFParaExibicao(colaborador.cpf)}<br>
      <small>O CPF nao pode ser alterado</small>
    </div>
    
    <form id="formEdicao">
      <input type="hidden" id="colaborador_id" value="${colaborador.id}">
      <input type="hidden" id="cpf" value="${colaborador.cpf}">
      
      <label>Nome Completo</label>
      <input type="text" id="nome_completo" value="${nome}" required>
      
      <label>Email</label>
      <input type="email" id="email" value="${email}">
      
      <label>Telefone</label>
      <input type="text" id="telefone" value="${telefone}">
      
      <label>Cargo</label>
      <input type="text" id="cargo" value="${cargo}">
      
      <label>Departamento</label>
      <select id="departamento">
        <option value="">Selecione...</option>
        <option value="Comercial" ${dep === 'Comercial' ? 'selected' : ''}>Comercial</option>
        <option value="RH" ${dep === 'RH' ? 'selected' : ''}>RH</option>
        <option value="Financeiro" ${dep === 'Financeiro' ? 'selected' : ''}>Financeiro</option>
        <option value="Vendas" ${dep === 'Vendas' ? 'selected' : ''}>Vendas</option>
        <option value="TI" ${dep === 'TI' ? 'selected' : ''}>TI</option>
        <option value="Operações" ${dep === 'Operações' ? 'selected' : ''}>Operacoes</option>
      </select>
      
      <label>Local de Trabalho</label>
      <input type="text" id="local_trabalho" value="${local}">
      
      <label>Cidade</label>
      <input type="text" id="cidade" value="${cidade}">
      
      <label>Data de Admissão</label>
      <input type="date" id="data_admissao" value="${admissao}">
      
      <div class="row" style="background: #fff3e0; padding: 10px; border: 1px solid #ffe0b2; border-radius: 4px; margin: 10px 0;">
          <div class="col">
             <label style="margin-top:0">Salario Base (R$)</label>
             <input type="text" id="salario_base" value="${salario}" oninput="formatarMoeda(this)">
          </div>
          <div class="col">
             <label style="margin-top:0">Motivo Alteracao</label>
             <input type="text" id="motivo_alteracao" value="${motivo}">
          </div>
      </div>

      <fieldset style="border: 1px solid #ccc; padding: 10px; border-radius: 4px; margin-top: 15px;">
        <legend style="font-weight:bold; color:#1a73e8;">Planos de Saude e Odonto</legend>
        
        <div class="row">
          <div class="col" style="flex: 2;">
            <label>Plano de Saude</label>
            <select id="plano_saude"><option value="">Carregando...</option></select>
          </div>
          <div class="col" style="flex: 1;">
            <label>Carteirinha</label>
            <input type="text" id="matricula_saude" placeholder="Ex: 95445982">
          </div>
        </div>
        
        <label>Plano Odontologico (Opcional)</label>
        <select id="plano_odonto"><option value="">Carregando...</option></select>
        
        <hr style="margin: 15px 0; border: 0; border-top: 1px solid #eee;">
        
        <label style="font-weight:bold;">Dependentes</label>
        <div id="lista_dependentes" style="margin-bottom: 10px; font-size: 12px;">Carregando...</div>
        
        <div style="background: #f8f9fa; padding: 10px; border-radius: 4px; border: 1px solid #ddd;">
          <label style="margin-top:0">Adicionar Dependente:</label>
          <div class="row">
            <input type="text" id="dep_nome" placeholder="Nome" style="flex: 2;">
            <input type="text" id="dep_cpf" placeholder="CPF" style="flex: 1;">
            <input type="date" id="dep_nasc" style="flex: 1;">
          </div>
          <div class="row">
            <select id="dep_parentesco" style="flex: 1;">
              <option value="">Parentesco...</option>
              <option value="Filho(a)">Filho(a)</option>
              <option value="Cônjuge">Conjuge</option>
              <option value="Pai/Mãe">Pai/Mae</option>
            </select>
            <input type="text" id="dep_matricula" placeholder="Matricula" style="flex: 1;">
            <button type="button" onclick="adicionarDependenteUI(this)" style="background:#28a745; padding: 5px 10px;">+</button>
          </div>
        </div>
      </fieldset>

      <label>Status</label>
      <select id="status">
        <option value="ativo" ${status === 'ativo' ? 'selected' : ''}>Ativo</option>
        <option value="inativo" ${status === 'inativo' ? 'selected' : ''}>Inativo</option>
        <option value="ferias" ${status === 'ferias' ? 'selected' : ''}>Ferias</option>
        <option value="afastado" ${status === 'afastado' ? 'selected' : ''}>Afastado</option>
      </select>
      
      <div style="margin-top: 20px;">
        <button type="submit">Salvar Alteracoes</button>
        <button type="button" onclick="google.script.host.close()">Cancelar</button>
      </div>
    </form>
    
    <div id="mensagem" style="margin-top: 20px; padding: 10px; display: none;"></div>
    
    <script>
      // Formata moeda sem Regex Literal para evitar erros
      function formatarMoeda(el) {
        var v = el.value;
        v = v.replace(new RegExp('[^0-9]', 'g'), ''); // Remove nao numeros
        v = (v/100).toFixed(2) + '';
        v = v.replace('.', ',');
        // Adiciona pontos de milhar
        v = v.replace(new RegExp('(\\d)(\\d{3})(\\,)', 'g'), '$1.$2$3');
        el.value = v;
      }

      document.getElementById('telefone').addEventListener('input', function(e) {
        var v = e.target.value;
        v = v.replace(new RegExp('[^0-9]', 'g'), '');
        if (v.length > 11) v = v.substring(0, 11);
        e.target.value = v;
      });
      
      document.getElementById('formEdicao').addEventListener('submit', function(e) {
        e.preventDefault();
        
        var salarioStr = document.getElementById('salario_base').value;
        var salarioLimpo = salarioStr.replace(new RegExp('\\.', 'g'), '').replace(',', '.');
        var salarioNum = parseFloat(salarioLimpo);
        
        var dados = {
          nome_completo: document.getElementById('nome_completo').value,
          email: document.getElementById('email').value,
          telefone: document.getElementById('telefone').value,
          cargo: document.getElementById('cargo').value,
          departamento: document.getElementById('departamento').value,
          local_trabalho: document.getElementById('local_trabalho').value,
          cidade: document.getElementById('cidade').value,
          data_admissao: document.getElementById('data_admissao').value,
          salario_base: salarioNum || 0,
          motivo_alteracao: document.getElementById('motivo_alteracao').value,
          status: document.getElementById('status').value
        };
        
        var cpf = document.getElementById('cpf').value;
        
        mostrarMensagem('Salvando...', 'info');
        
        google.script.run
          .withSuccessHandler(handleSalvarSucesso)
          .withFailureHandler(handleSalvarErro)
          .atualizarColaboradorAPI(cpf, dados);
      });
      
      function handleSalvarSucesso(res) {
        if (res.success) {
           salvarPlanos();
        } else {
           mostrarMensagem('Erro: ' + res.error, 'error');
        }
      }
      
      function handleSalvarErro(e) {
        mostrarMensagem('Erro ao salvar: ' + e.message, 'error');
      }
      
      function salvarPlanos() {
         mostrarMensagem('Salvando planos...', 'info');
         var cid = document.getElementById('colaborador_id').value;
         var pSaude = document.getElementById('plano_saude').value;
         var pOdonto = document.getElementById('plano_odonto').value;
         var matSaude = document.getElementById('matricula_saude').value;
         
         if (pSaude) {
             google.script.run.withSuccessHandler(function() {
                 salvarOdonto(cid, pOdonto);
             }).salvarPlanoColaboradorAPI(cid, pSaude, matSaude);
         } else {
             salvarOdonto(cid, pOdonto);
         }
      }
      
      function salvarOdonto(cid, pOdonto) {
          if (pOdonto) {
              google.script.run.withSuccessHandler(finalizarSalvar)
              .salvarPlanoColaboradorAPI(cid, pOdonto, null);
          } else {
              finalizarSalvar();
          }
      }
      
      function finalizarSalvar() {
          mostrarMensagem('Sucesso! Fechando...', 'success');
          setTimeout(function() { google.script.host.close(); }, 1500);
      }
      
      function mostrarMensagem(texto, tipo) {
        var div = document.getElementById('mensagem');
        div.style.display = 'block';
        div.innerHTML = texto;
        div.style.background = (tipo === 'success') ? '#d4edda' : (tipo === 'error' ? '#f8d7da' : '#d1ecf1');
        div.style.color = (tipo === 'success') ? '#155724' : (tipo === 'error' ? '#721c24' : '#0c5460');
      }
      
      window.onload = function() {
          carregarListasPlanos(); 
      };

      function carregarListasPlanos() {
          google.script.run.withSuccessHandler(function(res) {
              if (res.success) {
                  popularSelects(res.data);
                  carregarPlanosDoUsuario();
              } else {
                  alert('Erro ao carregar planos: ' + res.error);
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
              var preco = (p.precos && p.precos.length > 0) ? p.precos[0].valor : '?';
              opt.textContent = p.nome + ' (R$ ' + preco + ')';
              
              if (p.tipo === 'SAUDE') selSaude.appendChild(opt);
              else if (p.tipo === 'ODONTO') selOdonto.appendChild(opt);
          });
      }

      function carregarPlanosDoUsuario() {
          var id = document.getElementById('colaborador_id').value;
          google.script.run.withSuccessHandler(function(res) {
              if (res.success && res.data) {
                  res.data.forEach(function(pu) {
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
          var div = document.getElementById('lista_dependentes');
          div.innerHTML = 'Carregando...';
          google.script.run.withSuccessHandler(function(res) {
              if (res.success) {
                  renderizarDependentes(res.data);
              } else {
                  div.innerHTML = 'Erro.';
              }
          }).listarDependentesAPI(colabId);
      }

      function renderizarDependentes(lista) {
          var div = document.getElementById('lista_dependentes');
          if (!lista || lista.length === 0) {
              div.innerHTML = 'Nenhum dependente.';
              return;
          }
          var html = '<table style="width:100%">';
          lista.forEach(function(d) {
              html += '<tr><td>' + d.nome + '</td><td>' + d.parentesco + '</td>' +
                      '<td style="text-align:right"><span style="cursor:pointer;color:red" onclick="removerDependenteUI(\\'' + d.id + '\\')">Excluir</span></td></tr>';
          });
          html += '</table>';
          div.innerHTML = html;
      }

      function adicionarDependenteUI(btn) {
          var id = document.getElementById('colaborador_id').value;
          var nome = document.getElementById('dep_nome').value;
          var cpf = document.getElementById('dep_cpf').value;
          var nasc = document.getElementById('dep_nasc').value;
          var parentesco = document.getElementById('dep_parentesco').value;
          var matricula = document.getElementById('dep_matricula').value;

          if (!nome || !nasc || !parentesco) {
              alert('Preencha os campos obrigatorios');
              return;
          }

          btn.disabled = true;
          btn.textContent = '...';

          var novoDep = { nome: nome, cpf: cpf, data_nasc: nasc, parentesco: parentesco, matricula: matricula };

          google.script.run.withSuccessHandler(function(res) {
              btn.disabled = false;
              btn.textContent = '+';
              if (res.success) {
                  document.getElementById('dep_nome').value = '';
                  document.getElementById('dep_cpf').value = '';
                  document.getElementById('dep_nasc').value = '';
                  document.getElementById('dep_matricula').value = '';
                  carregarDependentesUI(id);
              } else {
                  alert('Erro: ' + res.error);
              }
          }).adicionarDependenteAPI(id, novoDep);
      }

      function removerDependenteUI(depId) {
          if(!confirm('Excluir?')) return;
          var id = document.getElementById('colaborador_id').value;
          google.script.run.withSuccessHandler(function() {
              carregarDependentesUI(id);
          }).removerDependenteAPI(depId);
      }
    </script>
  `).setWidth(500).setHeight(700);

  SpreadsheetApp.getUi().showModalDialog(html, 'Editar Colaborador');
}
