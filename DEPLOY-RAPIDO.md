# 🚀 DEPLOY RÁPIDO - Correções Rodada 2

**Atenção:** O Git não está disponível no seu terminal. Use uma das opções abaixo:

---

## ✅ OPÇÃO 1: Usar GitHub Desktop (Recomendado)

1. **Baixar e instalar:** https://desktop.github.com/
2. **Abrir GitHub Desktop** → `File` → `Add Local Repository`
3. **Selecionar pasta:** `c:\Users\paulo.rodrigues\Documents\Rodrigues\11. Automação Google Sheets`
4. **Na aba "Changes"** → Marcar todos os arquivos modificados
5. **Commit Summary:** `corr: dashboard kpis com queries reais e filtros (Rodada 2)`
6. **Clique em "Commit to main"**
7. **Clique em "Push origin"**

---

## ✅ OPÇÃO 2: Usar VS Code

1. **Abrir VS Code** → Abrir pasta do projeto
2. **Ctrl+Shift+G** (Source Control)
3. **Clique no "+"** para cada arquivo (ou "Stage All")
4. **Message:** `corr: dashboard kpis com queries reais e filtros (Rodada 2)`
5. **Ctrl+Enter** (Commit)
6. **Clique em "Sync Changes"** ou ícone de nuvem

---

## ✅ OPÇÃO 3: Usar Scripts Criados

### PowerShell:
```powershell
# Abrir PowerShell como Administrador
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\deploy.ps1
```

### Batch:
```cmd
#双击 ou executar no cmd
deploy.bat
```

---

## ✅ OPÇÃO 4: Git Bash (Se tiver instalado)

```bash
cd "/c/Users/paulo.rodrigues/Documents/Rodrigues/11. Automação Google Sheets"
git add src/controllers/dashboardController.js google-apps-script.js CORRECOES-RODADA2.md
git commit -m "corr: dashboard kpis com queries reais e filtros (Rodada 2)"
git push origin main
```

---

## 📝 Arquivos Modificados

| Arquivo | Alterações |
|---------|------------|
| `src/controllers/dashboardController.js` | Reescrito (~380 linhas) - queries reais |
| `google-apps-script.js` | Funções de filtro + UI (~3929 linhas) |
| `CORRECOES-RODADA2.md` | Novo - documentação técnica |
| `DEPLOY-INSTRUCOES.md` | Novo - instruções detalhadas |
| `deploy.ps1` | Novo - script PowerShell |
| `deploy.bat` | Novo - script Batch |

---

## 🔗 Links

- **GitHub:** https://github.com/LoganKusanaggi/Sistema-rh-google-sheets
- **Vercel:** https://vercel.com/dashboard
- **API:** https://sistema-rh-google-sheets.vercel.app/api/dashboard/kpis

---

## ✅ Validação Pós-Deploy

1. **GitHub:** Verificar commit em https://github.com/LoganKusanaggi/Sistema-rh-google-sheets/commits
2. **Vercel:** Aguardar deploy (2-3 min) em https://vercel.com/dashboard
3. **API:** Testar endpoint
   ```bash
   curl https://sistema-rh-google-sheets.vercel.app/api/dashboard/kpis
   ```
4. **Google Sheets:** Abrir dashboard e validar KPIs

---

**Dúvidas?** Consulte `DEPLOY-INSTRUCOES.md` para detalhes completos.
