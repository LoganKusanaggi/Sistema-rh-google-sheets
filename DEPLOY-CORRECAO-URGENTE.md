# 🚨 CORREÇÃO URGENTE - Deploy Imediato

**Erro:** `HTTP 500: Could not find the table 'public.variavel'`

**Causa:** Nome da tabela errado no código

**Solução:** Arquivo `src/controllers/dashboardController.js` foi corrigido

---

## ✅ O Que Foi Corrigido

| Tabela Errada | Tabela Correta | Campo Errado | Campo Correto |
|---------------|----------------|--------------|---------------|
| `variavel` | `apuracao_variavel` | `valor` | `valor_variavel` |
| - | - | `nome_colaborador` | `nome_vendedor` |

---

## 📦 Deploy Rápido

### GitHub Desktop (Recomendado)
1. Abrir GitHub Desktop
2. File → Add Local Repository → Selecionar pasta
3. Na aba "Changes" → Marcar `src/controllers/dashboardController.js`
4. Commit Summary: `fix: corrigir tabela variavel para apuracao_variavel`
5. Commit to main → Push origin

### VS Code
1. Ctrl+Shift+G (Source Control)
2. Stage Changes (clicar no +)
3. Message: `fix: corrigir tabela variavel para apuracao_variavel`
4. Commit (Ctrl+Enter)
5. Sync Changes (ícone de nuvem)

### Git Bash
```bash
cd "c:\Users\paulo.rodrigues\Documents\Rodrigues\11. Automação Google Sheets"
git add src/controllers/dashboardController.js
git commit -m "fix: corrigir tabela variavel para apuracao_variavel"
git push origin main
```

---

## ✅ Validação Pós-Deploy

1. **Aguardar 2-3 minutos** (deploy automático na Vercel)
2. **Testar API:**
   ```bash
   curl https://sistema-rh-google-sheets.vercel.app/api/dashboard/kpis
   ```
3. **Google Sheets:** Abrir Dashboard e validar KPIs

---

## 📄 Arquivo Modificado

- `src/controllers/dashboardController.js`
  - Query de benefícios (sem filtro departamento)
  - Query de variável (tabela e campo corretos)
  - Top performers (campo nome_vendedor)
  - Gráfico evolução (sem filtro departamento em benefícios)

---

**Status:** ✅ Pronto para deploy
