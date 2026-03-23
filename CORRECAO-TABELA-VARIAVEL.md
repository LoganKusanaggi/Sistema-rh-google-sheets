# 🐛 CORREÇÃO URGENTE - Nome da Tabela Variável

**Data:** 23 de março de 2026  
**Erro:** `HTTP 500: {"success":false,"error":"Variável: Could not find the table 'public.variavel' in the schema cache"}`

---

## 📋 Problema

O código foi implementado usando o nome da tabela **`variavel`**, mas no schema do Supabase a tabela correta se chama **`apuracao_variavel`**.

Além disso, as tabelas `beneficios` e `apuracao_variavel` **não possuem campo `departamento`**, então o filtro não pode ser aplicado nelas.

---

## ✅ Correções Aplicadas

### 1. Nome da Tabela

| Onde | Antes | Depois |
|------|-------|--------|
| Query Variável | `from('variavel')` | `from('apuracao_variavel')` |
| Campo Valor | `.select('valor')` | `.select('valor_variavel')` |
| Top Performers | `.select('cpf, valor, nome_colaborador')` | `.select('cpf, valor_variavel, nome_vendedor')` |

### 2. Filtro de Departamento Removido

**Tabelas sem campo `departamento`:**
- ✅ `beneficios` - Filtro removido
- ✅ `apuracao_variavel` - Filtro removido

**Tabelas com campo `departamento`:**
- ✅ `colaboradores` - Filtro mantido
- ✅ `folha_pagamento` - Filtro mantido

---

## 📝 Arquivo Modificado

### `src/controllers/dashboardController.js`

**Mudanças:**
1. Linha ~105: Query de benefícios sem filtro de departamento
2. Linha ~135: Query de variável usando `apuracao_variavel` e `valor_variavel`
3. Linha ~245: Top performers usando `nome_vendedor` instead of `nome_colaborador`
4. Linha ~232: Gráfico evolução sem filtro de departamento em benefícios

---

## 🚀 Deploy

### Opção 1: GitHub Desktop
1. Abrir GitHub Desktop
2. Marcar arquivo modificado: `src/controllers/dashboardController.js`
3. Commit: `fix: corrigir nome tabela variavel para apuracao_variavel`
4. Push origin

### Opção 2: Git Bash
```bash
cd "c:\Users\paulo.rodrigues\Documents\Rodrigues\11. Automação Google Sheets"
git add src/controllers/dashboardController.js
git commit -m "fix: corrigir nome tabela variavel para apuracao_variavel

- Tabela variavel não existe, nome correto é apuracao_variavel
- Campo valor não existe, nome correto é valor_variavel
- Campo nome_colaborador não existe, nome correto é nome_vendedor
- Removido filtro departamento de beneficios (não tem campo)
- Removido filtro departamento de apuracao_variavel (não tem campo)
- Mantido filtro departamento apenas em colaboradores e folha_pagamento"
git push origin main
```

### Opção 3: VS Code
1. Ctrl+Shift+G
2. Stage `src/controllers/dashboardController.js`
3. Message: `fix: corrigir nome tabela variavel para apuracao_variavel`
4. Commit → Sync

---

## ✅ Validação

Após o deploy na Vercel:

```bash
# Testar endpoint
curl https://sistema-rh-google-sheets.vercel.app/api/dashboard/kpis

# Testar com filtros
curl "https://sistema-rh-google-sheets.vercel.app/api/dashboard/kpis?mes=3&ano=2025"
```

**Resultado esperado:**
```json
{
  "success": true,
  "kpis": {
    "ativos": {"valor": 150, ...},
    "folha": {"valor": 450000, ...},
    "beneficios": {"valor": 50000, ...},
    "variavel": {"valor": 25000, ...},
    ...
  },
  "graficos": {
    "performers": [{"nome": "João Silva", "valor": 5000}, ...]
  }
}
```

---

## 📌 Lições Aprendidas

1. **Sempre verificar o schema antes de implementar**
2. **Confirmar nomes de tabelas e campos no Supabase Dashboard**
3. **Verificar quais tabelas têm campo `departamento` antes de aplicar filtros**

---

## 🔗 Links Úteis

- **Schema SQL:** `schema.sql` (linha 114: criação da tabela `apuracao_variavel`)
- **Supabase Dashboard:** https://supabase.com/dashboard → Table Editor

---

**Status:** ✅ Corrigido  
**Próximo:** Fazer deploy e validar
