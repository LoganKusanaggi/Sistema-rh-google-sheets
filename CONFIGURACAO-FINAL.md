# ✅ CONFIGURAÇÃO FINAL - Sistema RH

## 🎉 Deploy Realizado com Sucesso!

**URL da API:** https://sistema-rh-google-sheets.vercel.app

---

## 📝 PASSO 1: Atualizar Google Apps Script

### 1.1 Abrir o Editor
1. Acesse sua planilha: https://docs.google.com/spreadsheets/d/1E2f50Lm_nEw9oVyn3TZAd5nu7CNWgZ2WI9fsRABizz0/edit
2. Clique em **Extensões** → **Apps Script**

### 1.2 Alterar a URL da API
Encontre a **linha 10** e altere:

**DE:**
```javascript
API_URL: 'http://localhost:3000/api',
```

**PARA:**
```javascript
API_URL: 'https://sistema-rh-google-sheets.vercel.app/api',
```

### 1.3 Salvar
- Pressione **Ctrl+S** (ou Cmd+S no Mac)
- Ou clique no ícone de **disquete** 💾

---

## 🔒 PASSO 2: Configurar CORS no Supabase

### 2.1 Acessar Configurações
1. Acesse: https://supabase.com/dashboard/project/iqdjuxxqtktjhzmafjpx/settings/api
2. Role até a seção **"CORS Settings"**

### 2.2 Adicionar URLs Permitidas
Adicione estas duas URLs (uma por linha):

```
https://sistema-rh-google-sheets.vercel.app
https://docs.google.com
```

### 2.3 Salvar
- Clique em **"Save"** ou **"Update"**

---

## 🧪 PASSO 3: Testar a Integração

### 3.1 Testar API Diretamente
Abra no navegador:
```
https://sistema-rh-google-sheets.vercel.app/api/health
```

**Deve retornar:**
```json
{
  "status": "online",
  "version": "2.0.0",
  ...
}
```

### 3.2 Testar Colaboradores
```
https://sistema-rh-google-sheets.vercel.app/api/colaboradores
```

**Deve retornar:**
```json
{
  "success": true,
  "data": [{
    "cpf": "12345678900",
    "nome_completo": "João Silva Teste",
    ...
  }],
  "total": 1
}
```

### 3.3 Testar no Google Sheets
1. Atualize a planilha (F5)
2. Clique em **"Sistema RH"** no menu superior
3. Selecione **"Colaboradores"** → **"Buscar Colaborador"**
4. Clique em **"Buscar"**

**Deve aparecer:**
- Nome: João Silva Teste
- CPF: 123.456.789-00
- Cargo: Analista
- Status: ativo

---

## ✅ CHECKLIST FINAL

- [ ] Apps Script atualizado com nova URL
- [ ] CORS configurado no Supabase
- [ ] API testada no navegador (/api/health)
- [ ] Endpoint /api/colaboradores testado
- [ ] Menu "Sistema RH" aparece no Google Sheets
- [ ] Busca de colaboradores funciona
- [ ] Colaborador de teste aparece na planilha

---

## 🔗 LINKS IMPORTANTES

- **API:** https://sistema-rh-google-sheets.vercel.app
- **Health Check:** https://sistema-rh-google-sheets.vercel.app/api/health
- **Colaboradores:** https://sistema-rh-google-sheets.vercel.app/api/colaboradores
- **Planilha:** https://docs.google.com/spreadsheets/d/1E2f50Lm_nEw9oVyn3TZAd5nu7CNWgZ2WI9fsRABizz0/edit
- **Supabase Dashboard:** https://supabase.com/dashboard/project/iqdjuxxqtktjhzmafjpx
- **Vercel Dashboard:** https://vercel.com/dashboard

---

## 🆘 TROUBLESHOOTING

### Erro: "CORS blocked"
**Solução:** Verifique se adicionou as URLs no CORS do Supabase

### Erro: "API not responding"
**Solução:** Teste a URL diretamente no navegador

### Menu não aparece no Sheets
**Solução:** 
1. Atualize a página (F5)
2. Feche e abra a planilha novamente
3. Verifique se salvou o Apps Script

### Colaborador não aparece
**Solução:**
1. Verifique se a URL está correta no Apps Script
2. Teste a API diretamente: /api/colaboradores
3. Verifique os logs no Apps Script (View → Logs)

---

## 🎉 PRÓXIMOS PASSOS

Após confirmar que tudo funciona:

1. **Adicionar mais colaboradores** via API ou Google Sheets
2. **Criar lançamentos** (folha, benefícios, variável)
3. **Gerar relatórios** personalizados
4. **Explorar todos os endpoints** disponíveis

---

**Sistema RH v2.0 - Pronto para Uso! 🚀**
