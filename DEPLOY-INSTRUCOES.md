# 🚀 INSTRUÇÕES PARA DEPLOY - Correções Rodada 2

**Data:** 23 de março de 2026  
**Repositório:** https://github.com/LoganKusanaggi/Sistema-rh-google-sheets.git

---

## 📋 Resumo das Alterações

### Arquivos Modificados
1. **`src/controllers/dashboardController.js`** - Reescrito completamente (~380 linhas)
   - Queries reais para todos os KPIs
   - Suporte a filtros por query params (mes, ano, departamento)
   - Top performers com dados da tabela `variavel`
   - Alertas com aniversariantes e resumos
   - Vagas abertas: count real ou 0 (sem hardcode)

2. **`google-apps-script.js`** - Adições (~3929 linhas totais)
   - Função `popularDepartamentos(graficos)`
   - Função `limparFiltros()`
   - Função `aplicarFiltros()` atualizada
   - Botão "✕ Limpar" e span `filtro_status` na UI

3. **`CORRECOES-RODADA2.md`** - Novo arquivo de documentação

---

## 🔧 PASSO A PASSO - Deploy Manual

### Opção A: Git Bash / Terminal com Git

```bash
# 1. Navegar até o diretório do projeto
cd "c:\Users\paulo.rodrigues\Documents\Rodrigues\11. Automação Google Sheets"

# 2. Verificar alterações
git status

# 3. Adicionar arquivos modificados
git add src/controllers/dashboardController.js
git add google-apps-script.js
git add CORRECOES-RODADA2.md

# 4. Verificar staging
git status

# 5. Fazer commit
git commit -m "corr: dashboard kpis com queries reais e filtros (Rodada 2)

- dashboardController.js: queries reais para folha, benefícios, variável, turnover
- dashboardController.js: suporte a filtros mes/ano/depto via query params
- dashboardController.js: top performers com dados da tabela variavel
- dashboardController.js: alertas com aniversariantes do mês
- dashboardController.js: vagas abertas retorna count real ou 0
- google-apps-script.js: função popularDepartamentos()
- google-apps-script.js: função limparFiltros()
- google-apps-script.js: aplicarFiltros() com status visual
- google-apps-script.js: botão Limpar na barra de filtros

Resolução:
- PROBLEMA 1: Filtros do dashboard
- PROBLEMA 2: KPIs zerados
- PROBLEMA 3: Top Performers em branco
- PROBLEMA 4: Letreiro com conteúdo útil
- PROBLEMA 5: Vagas Abertas hardcoded (7)
- PROBLEMA 6: Submenu Relatórios (orientação)"

# 6. Push para o GitHub
git push origin main

# Ou se estiver em outra branch
git push origin <nome-da-branch>
```

---

### Opção B: GitHub Desktop (Windows)

1. **Abrir GitHub Desktop**
2. **File > Add Local Repository** → Selecionar pasta do projeto
3. **Na aba "Changes":**
   - Marcar arquivos modificados:
     - ✅ `src/controllers/dashboardController.js`
     - ✅ `google-apps-script.js`
     - ✅ `CORRECOES-RODADA2.md`
4. **Commit Summary:**
   ```
   corr: dashboard kpis com queries reais e filtros (Rodada 2)
   ```
5. **Description (opcional):**
   ```
   - Queries reais para todos os KPIs
   - Filtros mes/ano/depto funcionais
   - Top performers populado
   - Alertas com aniversariantes
   - Vagas abertas: count real ou 0
   - UI: popularDepartamentos, limparFiltros
   ```
6. **Clique em "Commit to main"**
7. **Clique em "Push origin"**

---

### Opção C: VS Code (Source Control)

1. **Abrir VS Code** → Abrir pasta do projeto
2. **Ctrl+Shift+G** (Source Control)
3. **Stage Changes:**
   - Clique no `+` de cada arquivo ou "Stage All Changes"
4. **Commit Message:**
   ```
   corr: dashboard kpis com queries reais e filtros (Rodada 2)
   ```
5. **Clique em "Commit"** (Ctrl+Enter)
6. **Clique em "Sync Changes"** ou "Push" (ícone de nuvem)

---

## ✅ Pós-Deploy

### 1. Verificar Deploy na Vercel

Acesse: https://vercel.com/dashboard

Ou diretamente no projeto:
- https://vercel.com/

**O que verificar:**
- ✅ Build completou com sucesso
- ✅ Deploy está "Ready"
- ✅ URL: https://sistema-rh-google-sheets.vercel.app

### 2. Testar Endpoint

```bash
# Testar sem filtros
curl https://sistema-rh-google-sheets.vercel.app/api/dashboard/kpis

# Testar com filtros
curl "https://sistema-rh-google-sheets.vercel.app/api/dashboard/kpis?mes=3&ano=2025&departamento=Comercial"
```

### 3. Testar no Google Sheets

1. **Abrir planilha no Google Sheets**
2. **Menu `🔄 Sistema RH` → `📈 Dashboard Gerencial RH`**
3. **Validar:**
   - ✅ KPIs com valores reais (não zero)
   - ✅ Filtros visíveis e funcionais
   - ✅ Select de departamentos populado
   - ✅ Botão "✕ Limpar" funciona
   - ✅ Letreiro com informações úteis
   - ✅ Gráfico Top Performers renderizado

---

## 🐛 Troubleshooting

### Build Falhou na Vercel

**Verificar logs em:** https://vercel.com/dashboard → Projeto → "Deployments" → Clique no deploy falho

**Erros comuns:**
```
Error: Cannot find module '@supabase/supabase-js'
→ Rodar: npm install

Error: Configuração do Supabase incompleta
→ Adicionar variáveis de ambiente no Vercel:
  - SUPABASE_URL
  - SUPABASE_SERVICE_KEY
```

### Variáveis de Ambiente no Vercel

1. Acessar https://vercel.com/dashboard
2. Selecionar projeto "sistema-rh-google-sheets"
3. **Settings > Environment Variables**
4. Adicionar:
   - `SUPABASE_URL` = `https://xxxxx.supabase.co`
   - `SUPABASE_SERVICE_KEY` = `eyJhbG...` (chave service_role)
5. **Redeploy** (se necessário)

### Google Sheets - Menu Não Atualiza

1. **Editor do Apps Script** → Executar > Executar função > `onOpen`
2. **Autorizar** permissões se solicitado
3. **Recarregar** planilha (F5)

---

## 📊 Checklist de Validação

- [ ] Git push realizado com sucesso
- [ ] GitHub Actions/Vercel iniciou build
- [ ] Deploy Vercel completou (status "Ready")
- [ ] Endpoint `/api/dashboard/kpis` retorna dados
- [ ] KPIs com valores reais (não zero)
- [ ] Filtros mes/ano/depto funcionam
- [ ] Top Performers exibe colaboradores
- [ ] Letreiro com informações úteis
- [ ] Vagas Abertas com count real ou 0
- [ ] Google Sheets menu atualizado
- [ ] Dashboard modal abre e carrega

---

## 🔗 Links Úteis

- **Repositório:** https://github.com/LoganKusanaggi/Sistema-rh-google-sheets
- **Vercel Dashboard:** https://vercel.com/dashboard
- **API Endpoint:** https://sistema-rh-google-sheets.vercel.app/api
- **Supabase Dashboard:** https://supabase.com/dashboard

---

**Dúvidas?** Consulte `CORRECOES-RODADA2.md` para detalhes técnicos das alterações.
