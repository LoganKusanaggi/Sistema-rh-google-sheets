// =====================================================
// GOOGLE APPS SCRIPT - SISTEMA RH v2.1 (COMPLETO E CORRIGIDO)
// =====================================================
// FLUXO: Buscar → Selecionar → Gerar Relatório
// SUPABASE = Única fonte da verdade
// SHEETS = Interface + Gerador de relatórios
// =====================================================
// CORREÇÕES APLICADAS:
// - Tabela variavel → apuracao_variavel (campo valor_variavel, nome_vendedor)
// - Filtros dashboard (mes/ano/depto) com barra de filtros UI
// - Funções popularDepartamentos(), limparFiltros(), aplicarFiltros()
// =====================================================

const CONFIG = {
    API_URL: 'https://sistema-rh-google-sheets.vercel.app/api',

    ABAS: {
        DASHBOARD: 'Dashboard',
        COLABORADORES: 'Colaboradores',
        LANCAMENTOS: 'Lançamentos',
        RELATORIOS: 'Relatórios',
        CONFIGURACOES: 'Configurações'
    },

    EMPRESA: {
        codigo: '0000312',
        razao_social: 'SUPER INDUSTRIA DE ALIMENTOS LTDA',
        cnpj: '43707279000150'
    }
};

// =====================================================
// CRIAR MENU PERSONALIZADO
// =====================================================

function onOpen() {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu('🔄 Sistema RH')
        .addItem('📈 Dashboard Gerencial RH', 'abrirDashboardModal')
        .addSeparator()
        .addSubMenu(ui.createMenu('👥 Colaboradores')
            .addItem('🔍 Buscar Colaborador', 'buscarColaboradorModal')
            .addItem('➕ Novo Colaborador', 'novoColaboradorModal')
            .addItem('📝 Editar Selecionados', 'editarSelecionados')
            .addItem('🗑️ Excluir Selecionados', 'excluirSelecionados'))
        .addSeparator()
        .addSubMenu(ui.createMenu('📝 Lançamentos')
            .addItem('💰 Lançar Folha', 'lancarFolha')
            .addItem('🚀 Enviar Folha para Sistema', 'enviarFolhaParaAPI')
            .addSeparator()
            .addItem('🎁 Lançar Benefícios', 'lancarBeneficios')
            .addItem('🚀 Enviar Benefícios', 'enviarBeneficiosParaAPI')
            .addSeparator()
            .addItem('📊 Lançar Variável', 'lancarVariavel')
            .addItem('🚀 Enviar Variável', 'enviarVariavelParaAPI')
            .addSeparator()
            .addItem('⏰ Lançar Apontamentos', 'lancarApontamentos')
            .addItem('🚀 Enviar Apontamentos', 'enviarApontamentosParaAPI'))
        .addSeparator()
        .addSubMenu(ui.createMenu('📄 Relatórios')
            .addItem('💰 Folha de Pagamento', 'gerarRelatorioFolha')
            .addItem('🎁 Benefícios Caju', 'gerarRelatorioBeneficios')
            .addItem('📊 Apuração de Variável', 'gerarRelatorioVariavel')
            .addItem('⏰ Apontamentos', 'gerarRelatorioApontamentos')
            .addItem('🛡️ Seguros de Vida', 'gerarRelatorioSeguros')
            .addSeparator()
            .addItem('📑 Central de Relatórios (Avançado)', 'mostrarModalRelatoriosAvancados'))
        .addSeparator()
        .addItem('📜 Histórico de Versões', 'listarHistoricoModal')
        .addItem('🔄 Atualizar Dashboard', 'atualizarDashboard')
        .addItem('⚙️ Configurações', 'abrirConfiguracoes')
        .addToUi();
}

// =====================================================
// ABA COLABORADORES - BUSCA E GESTÃO
// =====================================================

function buscarColaboradorModal() {
    const html = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial; padding: 20px; }
      input, select { width: 100%; padding: 8px; margin: 5px 0; }
      button { background: #4285f4; color: white; padding: 10px 20px; 
               border: none; margin: 5px; cursor: pointer; }
      button:hover { background: #357ae8; }
      .filtros { background: #f5f5f5; padding: 15px; margin: 10px 0; }
    </style>
    
    <h2>🔍 Buscar Colaboradores</h2>
    
    <div class="filtros">
      <label>Busca Rápida:</label>
      <input type="text" id="termo_busca" placeholder="Nome ou CPF">
      
      <label>Status:</label>
      <select id="status">
        <option value="">Todos</option>
        <option value="ativo" selected>Ativo</option>
        <option value="inativo">Inativo</option>
        <option value="ferias">Férias</option>
      </select>
      
      <label>Departamento:</label>
      <select id="departamento">
        <option value="">Todos</option>
        <option value="Comercial">Comercial</option>
        <option value="RH">RH</option>
        <option value="Financeiro">Financeiro</option>
        <option value="Vendas">Vendas</option>
      </select>
      
      <label>Cargo:</label>
      <input type="text" id="cargo" placeholder="Ex: Analista, Gerente">
    </div>
    
    <button onclick="buscar()">🔍 Buscar</button>
    <button onclick="google.script.host.close()">Cancelar</button>
    
    <div id="resultado"></div>
    
    <script>
      function buscar() {
        const termo = document.getElementById('termo_busca').value;
        const status = document.getElementById('status').value;
        const departamento = document.getElementById('departamento').value;
        const cargo = document.getElementById('cargo').value;

        const filtros = {
          status: status,
          departamento: departamento,
          cargo: cargo
        };

        if (termo) {
          const soDigitos = termo.replace(/\D/g, '');
          if (soDigitos.length === 11) {
             filtros.cpf = soDigitos; 
          } else {
             filtros.nome = termo;
          }
        }
        
        google.script.run
          .withSuccessHandler(exibirResultados)
          .withFailureHandler(err => alert('Erro: ' + err))
          .buscarColaboradoresAPI(filtros);
      }
      
      function exibirResultados(colaboradores) {
        const div = document.getElementById('resultado');
        if (colaboradores.length === 0) {
          div.innerHTML = '<p>Nenhum colaborador encontrado.</p>';
          return;
        }
        
        let html = '<h3>Encontrados: ' + colaboradores.length + '</h3>';
        html += '<table border="1" style="width:100%; border-collapse:collapse;">';
        html += '<tr><th>CPF</th><th>Nome</th><th>Cargo</th><th>Status</th></tr>';
        
        colaboradores.forEach(c => {
          html += '<tr>';
          html += '<td>' + formatarCPF(c.cpf) + '</td>';
          html += '<td>' + c.nome_completo + '</td>';
          html += '<td>' + (c.cargo || '-') + '</td>';
          html += '<td>' + c.status + '</td>';
          html += '</tr>';
        });
        
        html += '</table>';
        div.innerHTML = html;
      }
      
      function formatarCPF(cpf) {
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      }
    </script>
  `).setWidth(600).setHeight(500);

    SpreadsheetApp.getUi().showModalDialog(html, 'Buscar Colaboradores');
}
