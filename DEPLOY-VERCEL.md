# 🚀 GUIA RÁPIDO: Deploy na Vercel

## ✅ **Opção 1: Deploy via Interface Web (RECOMENDADO - Mais Rápido)**

### Passo 1: Acessar Vercel
1. Acesse: https://vercel.com
2. Faça login com sua conta GitHub

### Passo 2: Importar Projeto
1. Clique em **"Add New..."** → **"Project"**
2. Procure por: **"Sistema-rh-google-sheets"**
3. Clique em **"Import"**

### Passo 3: Configurar Variáveis de Ambiente
Na tela de configuração, adicione as seguintes variáveis:

**Environment Variables:**
```
SUPABASE_URL=https://iqdjuxxqtktjhzmafjpx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxZGp1eHhxdGt0amh6bWFmanB4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE1MTI5NCwiZXhwIjoyMDgxNzI3Mjk0fQ.BYUsH7pUQAM_cP9_MpIapToedgLG8ocW3G0JEzSQ5M0
NODE_ENV=production
```

**IMPORTANTE:** 
- Clique em **"Add"** para cada variável
- Certifique-se de que todas as 3 variáveis foram adicionadas

### Passo 4: Deploy
1. Clique em **"Deploy"**
2. Aguarde 1-2 minutos
3. ✅ Deploy concluído!

### Passo 5: Copiar URL
Após o deploy, você verá uma URL como:
```
https://sistema-rh-google-sheets-xxx.vercel.app
```

**COPIE ESTA URL!** Você vai precisar dela para o Google Sheets.

---

## ✅ **Opção 2: Deploy via CLI (Se preferir)**

### Passo 1: Login
```bash
vercel login
```

### Passo 2: Deploy
```bash
vercel --prod
```

### Passo 3: Configurar Variáveis
Durante o deploy, será perguntado sobre variáveis de ambiente.
Ou configure depois em: https://vercel.com/dashboard

---

## 📊 **Após o Deploy - Atualizar Google Sheets**

### Passo 1: Copiar URL da Vercel
Exemplo: `https://sistema-rh-google-sheets-abc123.vercel.app`

### Passo 2: Editar Apps Script
1. Abra sua planilha: https://docs.google.com/spreadsheets/d/1E2f50Lm_nEw9oVyn3TZAd5nu7CNWgZ2WI9fsRABizz0/edit
2. **Extensões** → **Apps Script**
3. Na **linha 10**, altere:

**DE:**
```javascript
API_URL: 'http://localhost:3000/api',
```

**PARA:**
```javascript
API_URL: 'https://SUA-URL-DA-VERCEL.vercel.app/api',
```

### Passo 3: Salvar
1. Salve o script (Ctrl+S)
2. Atualize a planilha

---

## ✅ **Testar a Integração**

1. Na planilha, clique em **"Sistema RH"** → **"Colaboradores"** → **"Buscar Colaborador"**
2. Deve aparecer o colaborador de teste: **João Silva Teste**

---

## 🔧 **Troubleshooting**

### Erro: "CORS blocked"
**Solução:**
1. Acesse: https://supabase.com/dashboard/project/iqdjuxxqtktjhzmafjpx
2. **Settings** → **API** → **CORS Settings**
3. Adicione:
   - `https://sua-url.vercel.app`
   - `https://docs.google.com`

### Erro: "API not responding"
**Solução:**
1. Teste a URL diretamente no navegador: `https://sua-url.vercel.app/api/health`
2. Deve retornar: `{"status":"online"}`

### Erro: "Invalid API key"
**Solução:**
1. Verifique as variáveis de ambiente na Vercel
2. **Settings** → **Environment Variables**
3. Confirme que `SUPABASE_SERVICE_KEY` está correta

---

## 📝 **Checklist Final**

- [ ] Deploy feito na Vercel
- [ ] URL da Vercel copiada
- [ ] Apps Script atualizado com nova URL
- [ ] CORS configurado no Supabase
- [ ] Teste realizado no Google Sheets
- [ ] Colaborador de teste apareceu

---

**Boa sorte com o deploy! 🚀**
