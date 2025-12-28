# 🔍 TESTE DE DEBUG - Comboboxes de Planos

## Problema Atual
- Tabela `planos` tem 2 registros ✅
- Modal mostra "Carregando..." ❌
- Comboboxes não populam ❌

## Teste Direto da API

Abra o navegador e teste:

```
https://sistema-rh-google-sheets.vercel.app/api/planos
```

**Resposta Esperada:**
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
    {
      "id": 11,
      "nome": "962892 – AMIL S750 R2 QP NAC PJ",
      "tipo": "SAUDE",
      "codigo_ref": "962892",
      "precos": [...]
    }
  ]
}
```

## Possíveis Causas

### 1. API não está retornando dados
- Verificar se o endpoint `/api/planos` está funcionando
- Testar no navegador diretamente

### 2. Erro de CORS
- A API pode estar bloqueando requisições do Google Sheets
- Verificar configuração CORS no Vercel

### 3. Erro no JavaScript do Modal
- O `withSuccessHandler` pode não estar sendo chamado
- Pode haver erro silencioso no console

### 4. Problema com `precos` vazio
- A query SQL pode não estar fazendo o JOIN corretamente
- Verificar se `planos_precos` tem dados

## Próximos Passos de Debug

### Teste 1: API Direta
Abra: `https://sistema-rh-google-sheets.vercel.app/api/planos`

Se retornar vazio ou erro → Problema na API
Se retornar dados → Problema no JavaScript

### Teste 2: Console do Modal
1. Abra o modal de edição
2. Pressione F12 (DevTools)
3. Vá na aba Console
4. Procure por erros em vermelho
5. Tire um print e me envie

### Teste 3: Adicionar Logs
Adicione `console.log` no JavaScript do modal para ver o que está acontecendo:

```javascript
function carregarListasPlanos() {
    console.log('🔵 Chamando listarPlanosAPI...');
    google.script.run.withSuccessHandler(function(res) {
        console.log('🟢 Resposta recebida:', res);
        if (res.success) {
            console.log('✅ Sucesso! Dados:', res.data);
            listaPlanosCache = res.data;
            popularSelects(res.data);
            carregarPlanosDoUsuario();
        } else {
            console.error('❌ Erro:', res.error);
            alert('Erro ao carregar planos: ' + res.error);
        }
    }).withFailureHandler(function(err) {
        console.error('🔴 Falha total:', err);
        alert('Falha ao chamar API: ' + err.message);
    }).listarPlanosAPI();
}
```

## Verificação da Tabela planos_precos

Execute no Supabase SQL Editor:

```sql
SELECT * FROM planos_precos WHERE plano_id IN (1, 11);
```

Se retornar vazio → O problema é que não há preços cadastrados
Se retornar dados → A API deve estar funcionando

---

**AÇÃO IMEDIATA:** Teste a URL da API no navegador e me envie o resultado!
