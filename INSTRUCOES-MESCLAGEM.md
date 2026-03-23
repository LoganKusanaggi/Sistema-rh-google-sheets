# 🔀 INSTRUÇÕES PARA MESCLAR CÓDIGO - Correção Dashboard

**Data:** 23 de março de 2026

---

## 📋 Resumo

Você forneceu o código completo do `google-apps-script.js` (3900+ linhas) que já tem:
- ✅ Todas as funções de Colaboradores, Lançamentos, Relatórios
- ✅ Função `buscarDashboardAPI()` (versão simples sem filtros)
- ✅ Função `abrirDashboardModal()` (versão simples sem barra de filtros)

O que **FALTA** no seu código:
- ❌ Barra de filtros UI (mes/ano/depto)
- ❌ Funções `popularDepartamentos()`, `limparFiltros()`, `aplicarFiltros()`
- ❌ Suporte a query params na API

---

## ✅ OPÇÃO 1: Mesclar Manualmente (Recomendado)

### Passo 1: Abrir o arquivo original
Abra seu arquivo atual: `google-apps-script.js`

### Passo 2: Localizar função `buscarDashboardAPI()`
Procure por esta função (está perto do final, linha ~3500):

```javascript
function buscarDashboardAPI() {
    try {
        var options = {
            method: 'get',
            headers: { 'Content-Type': 'application/json' },
            muteHttpExceptions: true
        };
        var url = CONFIG.API_URL + '/dashboard/kpis';
        var response = UrlFetchApp.fetch(url, options);
        // ...
    }
}
```

### Passo 3: Substituir por esta versão (COM FILTROS)
```javascript
function buscarDashboardAPI(filtros) {
    try {
        var options = {
            method: 'get',
            headers: { 'Content-Type': 'application/json' },
            muteHttpExceptions: true
        };
        
        // Construir query string com filtros
        var queryString = '';
        if (filtros) {
            var parts = [];
            if (filtros.mes) parts.push('mes=' + encodeURIComponent(filtros.mes));
            if (filtros.ano) parts.push('ano=' + encodeURIComponent(filtros.ano));
            if (filtros.departamento) parts.push('departamento=' + encodeURIComponent(filtros.departamento));
            if (parts.length > 0) queryString = '?' + parts.join('&');
        }
        
        var url = CONFIG.API_URL + '/dashboard/kpis' + queryString;
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
```

### Passo 4: Localizar função `abrirDashboardModal()`
Procure por esta função (linha ~3540)

### Passo 5: Substituir HTML dentro da função
Dentro da função, localize a parte que gera o HTML e:

**Adicionar após a linha do `.dashboard-header`:**
```javascript
'  <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>\n' +
'  <div id="filtros_bar" style="display:flex;gap:12px;align-items:center;padding:10px 24px;background:var(--bg-card);border-bottom:1px solid var(--border);flex-wrap:wrap;">\n' +
'    <div style="display:flex;align-items:center;gap:8px;">\n' +
'        <label style="font-size:13px;color:var(--text-muted);white-space:nowrap;">Período:</label>\n' +
'        <select id="f_mes" style="padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:13px;">\n' +
'            <option value="">Mês atual</option>\n' +
'            <option value="1">Janeiro</option><option value="2">Fevereiro</option>\n' +
'            <option value="3">Março</option><option value="4">Abril</option>\n' +
'            <option value="5">Maio</option><option value="6">Junho</option>\n' +
'            <option value="7">Julho</option><option value="8">Agosto</option>\n' +
'            <option value="9">Setembro</option><option value="10">Outubro</option>\n' +
'            <option value="11">Novembro</option><option value="12">Dezembro</option>\n' +
'        </select>\n' +
'        <input type="number" id="f_ano" value="2025" min="2020" max="2030" style="width:80px;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:13px;">\n' +
'    </div>\n' +
'    <div style="display:flex;align-items:center;gap:8px;">\n' +
'        <label style="font-size:13px;color:var(--text-muted);">Depto:</label>\n' +
'        <select id="f_depto" style="padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:13px;">\n' +
'            <option value="">Todos</option>\n' +
'        </select>\n' +
'    </div>\n' +
'    <button onclick="aplicarFiltros()" style="padding:6px 16px;background:var(--primary);color:white;border:none;border-radius:6px;font-size:13px;cursor:pointer;font-weight:600;">🔍 Aplicar</button>\n' +
'    <button onclick="limparFiltros()" style="padding:6px 12px;background:transparent;color:var(--text-muted);border:1px solid var(--border);border-radius:6px;font-size:13px;cursor:pointer;">✕ Limpar</button>\n' +
'    <span id="filtro_status" style="font-size:12px;color:var(--text-muted);margin-left:8px;"></span>\n' +
'  </div>\n' +
```

**Adicionar no bloco `<script>`, após `var formatNum`:**
```javascript
'    function aplicarFiltros() {\n' +
'        var mes = document.getElementById("f_mes").value;\n' +
'        var ano = document.getElementById("f_ano").value;\n' +
'        var depto = document.getElementById("f_depto").value;\n' +
'        var status = document.getElementById("filtro_status");\n' +
'        if (status) status.textContent = "⏳ Buscando...";\n' +
'        document.getElementById("content_area").innerHTML = \'<div class="loading-state"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg><div style="margin-top: 16px;">Aplicando filtros...</div></div>\';\n' +
'        var params = { mes: mes, ano: ano ? parseInt(ano) : "", departamento: depto };\n' +
'        google.script.run.withSuccessHandler(function(data) {\n' +
'            if (status) status.textContent = depto ? "Filtrado: " + depto : (mes ? "Filtrado: " + mes + "/" + (ano || "") : "");\n' +
'            if (data && data.success) { google.charts.load("current", {"packages":["corechart","line","bar"]}); google.charts.setOnLoadCallback(function() { renderizarDashboard(data); }); }\n' +
'            else { mostrarErro(data ? data.error : "Erro filtrando dashboard"); }\n' +
'        }).withFailureHandler(function(err) { if (status) status.textContent = ""; mostrarErro("Falha ao filtrar: " + err.message); }).buscarDashboardAPI(params);\n' +
'    }\n' +
'    function limparFiltros() {\n' +
'        document.getElementById("f_mes").value = "";\n' +
'        document.getElementById("f_ano").value = "";\n' +
'        document.getElementById("f_depto").value = "";\n' +
'        var status = document.getElementById("filtro_status");\n' +
'        if (status) status.textContent = "";\n' +
'        aplicarFiltros();\n' +
'    }\n' +
'    function popularDepartamentos(graficos) {\n' +
'        var sel = document.getElementById("f_depto");\n' +
'        if (!sel || !graficos || !graficos.departamentos) return;\n' +
'        graficos.departamentos.forEach(function(d) {\n' +
'            var opt = document.createElement("option");\n' +
'            opt.value = d[0]; opt.textContent = d[0];\n' +
'            sel.appendChild(opt);\n' +
'        });\n' +
'    }\n' +
```

**Adicionar chamada a `popularDepartamentos()` dentro de `renderizarDashboard`:**
Localize dentro da função `renderizarDashboard(payload)` a linha:
```javascript
'        if (payload.graficos) {\n' +
```

Adicione logo após:
```javascript
'            popularDepartamentos(payload.graficos);\n' +
```

---

## ✅ OPÇÃO 2: Usar Arquivo Pronto

1. Abra o arquivo `CORRECOES-DASHBOARD-PARA-MESCLAR.js`
2. Copie as funções completas `buscarDashboardAPI()` e `abrirDashboardModal()`
3. No seu `google-apps-script.js`, substitua as funções existentes pelas novas

---

## ✅ OPÇÃO 3: Copiar Arquivo Completo (Mais Fácil)

Se preferir, posso gerar um arquivo `google-apps-script.js` completo já com todas as correções mescladas.

---

## 🧪 Validação

Após mesclar:

1. **Salvar** no Apps Script Editor (Ctrl+S)
2. **Recarregar** planilha (F5)
3. **Menu** `🔄 Sistema RH` → `📈 Dashboard Gerencial RH`
4. **Validar:**
   - ✅ Barra de filtros visível (Período/Depto)
   - ✅ Botões "🔍 Aplicar" e "✕ Limpar"
   - ✅ Select de departamentos populado
   - ✅ Filtros funcionam

---

## 🔗 Arquivos de Suporte

- `CORRECOES-DASHBOARD-PARA-MESCLAR.js` - Funções completas para copiar/colar
- `CORRECAO-TABELA-VARIAVEL.md` - Detalhes da correção da tabela
- `DEPLOY-CORRECAO-URGENTE.md` - Guia de deploy

---

**Dúvidas?** Me avise que gero o arquivo completo mesclado!
