# 🔍 DIAGNÓSTICO: Problema com Comboboxes de Planos

## 📋 Problema Relatado
As comboboxes de **Plano de Saúde** e **Plano Odontológico** no modal de cadastro/edição de colaborador ficam travadas em "Carregando..." e não exibem as opções disponíveis.

---

## 🕵️ Investigação Realizada

### ✅ O que está FUNCIONANDO:

1. **Google Apps Script** - Função `listarPlanosAPI()` existe e está correta (linha 2326-2334)
2. **Rota da API** - Endpoint `/api/planos` está configurado (src/routes/index.js:79)
3. **Controller** - `planosController.listar()` está implementado corretamente
4. **Tabelas do Banco** - Schema das tabelas `planos`, `planos_precos` e `colaboradores_planos` está correto
5. **Templates Excel** - Arquivos necessários existem:
   - `07. Template_Plano_Odonto.xlsx`
   - `08. Template_Plano_Saude.xlsx`
   - `09. Template_Tabela_Planos.xlsx`

### ❌ O que está FALTANDO:

**A tabela `planos` no Supabase está VAZIA!**

O sistema tem um script de seed (`src/scripts/seed_plans.js`) que lê os templates Excel e popula as tabelas de planos, mas **esse script nunca foi executado**.

---

## 🔧 SOLUÇÃO

### Opção 1: Executar o Script de Seed Localmente

```bash
# 1. Certifique-se de que as variáveis de ambiente estão configuradas
# SUPABASE_URL e SUPABASE_SERVICE_KEY devem estar no arquivo .env

# 2. Execute o script de seed
node src/scripts/seed_plans.js
```

### Opção 2: Popular Manualmente via Supabase Dashboard

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard/project/iqdjuxxqtktjhzmafjpx
2. Vá em **SQL Editor**
3. Execute queries INSERT para adicionar os planos manualmente

### Opção 3: Criar um Endpoint de Seed na API

Adicionar uma rota administrativa para executar o seed remotamente (mais seguro para produção).

---

## 📊 Fluxo Atual vs Esperado

### Fluxo ATUAL (Com Problema):
```
Modal Abre → JS chama listarPlanosAPI() → API retorna { success: true, data: [] } 
→ popularSelects() recebe array vazio → Combobox fica com "Carregando..."
```

### Fluxo ESPERADO (Após Seed):
```
Modal Abre → JS chama listarPlanosAPI() → API retorna { success: true, data: [planos...] } 
→ popularSelects() preenche as opções → Usuário vê os planos disponíveis
```

---

## 🎯 Próximos Passos Recomendados

1. **Executar o seed** para popular a tabela de planos
2. **Testar a API** diretamente: `GET /api/planos` deve retornar os planos
3. **Testar o modal** novamente - as comboboxes devem carregar corretamente
4. **Adicionar script no package.json** para facilitar execução futura:
   ```json
   "scripts": {
     "seed:plans": "node src/scripts/seed_plans.js"
   }
   ```

---

## 🔍 Como Verificar se o Problema Foi Resolvido

1. Abra o navegador e acesse: `https://sistema-rh-google-sheets.vercel.app/api/planos`
2. Deve retornar algo como:
   ```json
   {
     "success": true,
     "data": [
       {
         "id": 1,
         "nome": "962680 – AMIL S580 QP NAC R PJ",
         "tipo": "SAUDE",
         "codigo_ref": "962680",
         "precos": [...]
       },
       ...
     ]
   }
   ```
3. Se retornar `"data": []`, a tabela ainda está vazia

---

## 📝 Notas Técnicas

- O script `seed_plans.js` lê os arquivos Excel e:
  1. Popula a tabela `planos` com os produtos (SAUDE e ODONTO)
  2. Popula `planos_precos` com as faixas etárias e valores
  3. Vincula colaboradores existentes aos planos (se houver dados nos templates 07 e 08)

- O modal JavaScript (linha 2054-2070) tem tratamento de erro, mas como a API retorna `success: true` com array vazio, não dispara o erro - apenas não preenche as opções.

---

**Data do Diagnóstico:** 28/12/2025  
**Status:** Problema identificado - Aguardando execução do seed
