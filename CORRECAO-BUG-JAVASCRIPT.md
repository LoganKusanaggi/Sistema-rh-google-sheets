# 🐛 BUG CORRIGIDO - Erro JavaScript no Modal

## ❌ Erro Encontrado

```
Uncaught SyntaxError: Identifier 'finalizar' has already been declared
```

### 📍 Localização
Arquivo: `google-apps-script.js`  
Linhas: 1959-2016 (código duplicado)

---

## 🔍 Causa do Problema

O código JavaScript dentro do modal de edição de colaborador tinha **código duplicado** que declarava as mesmas variáveis duas vezes:

1. **Primeira declaração** (linhas 1959-1985):
   - `const finalizar = function() {...}`
   - `const salvarOdonto = function() {...}`
   - `const pSaude = ...`
   - `const matriculaSaude = ...`

2. **Segunda declaração** (linhas 1987-2016):
   - `const finalizar = function() {...}` ← **DUPLICADO!**
   - `const salvarOdonto = () => {...}` ← **DUPLICADO!**
   - `const pSaude = ...` ← **DUPLICADO!**
   - `const matriculaSaude = ...` ← **DUPLICADO!**

### 💥 Impacto

Quando o JavaScript encontra uma variável `const` sendo declarada duas vezes, ele **para completamente a execução do script**, causando:

- ❌ Modal não carrega os planos (fica em "Carregando...")
- ❌ Dependentes não são carregados
- ❌ Nenhuma funcionalidade do modal funciona corretamente
- ❌ Console mostra erro de sintaxe

---

## ✅ Solução Aplicada

**Removido o código duplicado** (linhas 1987-2016), mantendo apenas a primeira versão que estava correta.

### Código Removido (36 linhas):
```javascript
// DUPLICADO - REMOVIDO
const finalizar = function() {
    mostrarMensagem('✅ Dados salvos com sucesso!', 'success');
    setTimeout(function() { google.script.host.close(); }, 1500);
};

// 1. Salvar Plano de Saúde (com matrícula Titular)
const pSaude = document.getElementById('plano_saude').value;
const matriculaSaude = document.getElementById('matricula_saude').value;

const salvarOdonto = () => {
   const pOdonto = document.getElementById('plano_odonto').value;
   if (pOdonto) {
       google.script.run
       .salvarPlanoColaboradorAPI(cid, pOdonto, null); 
   }
   mostrarMensagem('✅ Dados salvos com sucesso!', 'success');
   setTimeout(() => google.script.host.close(), 1500);
};

if (pSaude) {
    google.script.run.withSuccessHandler(salvarOdonto)
    .salvarPlanoColaboradorAPI(cid, pSaude, matriculaSaude);
} else {
    salvarOdonto();
}
```

---

## 🧪 Como Testar a Correção

### 1. Atualizar o Google Apps Script

Você precisa **copiar o código corrigido** para o Google Apps Script:

1. Abra o arquivo local: `google-apps-script.js`
2. Copie **TODO o conteúdo** do arquivo
3. Acesse: https://docs.google.com/spreadsheets/d/1E2f50Lm_nEw9oVyn3TZAd5nu7CNWgZ2WI9fsRABizz0/edit
4. Vá em **Extensões** → **Apps Script**
5. **Cole o código atualizado** (substitua tudo)
6. Salve (Ctrl+S)

### 2. Testar o Modal

1. Volte para a planilha
2. Atualize a página (F5)
3. Vá em **Sistema RH** → **Colaboradores** → **Editar Colaborador**
4. Selecione um colaborador
5. O modal deve abrir **SEM erros no console**
6. As comboboxes de planos devem carregar corretamente

### 3. Verificar o Console

Abra o Console do navegador (F12) e verifique:
- ✅ **NÃO** deve aparecer: `Uncaught SyntaxError: Identifier 'finalizar' has already been declared`
- ✅ Pode ignorar os warnings sobre `ambient-light-sensor`, `speaker`, `vr`, `vibrate` (são avisos do Google Sheets, não afetam o funcionamento)

---

## 📊 Comparação: Antes vs Depois

### ❌ ANTES (Com Bug)
```
Modal Abre → JavaScript tenta executar → Erro de sintaxe (finalizar duplicado)
→ Script para de executar → Comboboxes ficam em "Carregando..."
→ Nenhuma funcionalidade funciona
```

### ✅ DEPOIS (Corrigido)
```
Modal Abre → JavaScript executa sem erros → carregarListasPlanos() é chamado
→ API retorna os planos → popularSelects() preenche as comboboxes
→ Usuário vê as opções de planos disponíveis
```

---

## 🎯 Checklist de Verificação

- [x] Código duplicado removido do arquivo local
- [ ] Código atualizado copiado para o Google Apps Script
- [ ] Apps Script salvo
- [ ] Planilha atualizada (F5)
- [ ] Modal testado
- [ ] Console verificado (sem erros)
- [ ] Comboboxes carregando planos corretamente

---

## 📝 Observação sobre RLS (Row Level Security)

Você mencionou que as tabelas estão como **UNRESTRICTED**. Isso **NÃO** está causando o problema atual (que era o JavaScript duplicado), mas é uma **questão de segurança** que deve ser tratada depois:

### O que é RLS?
Row Level Security (RLS) controla quem pode ver/editar cada linha da tabela.

### Status Atual: UNRESTRICTED
- ✅ **Vantagem:** Qualquer requisição pode acessar os dados (facilita desenvolvimento)
- ❌ **Desvantagem:** Não há controle de acesso (problema em produção)

### Recomendação:
Por enquanto, deixe como está para garantir que tudo funcione. Depois que confirmar que o sistema está funcionando 100%, podemos configurar as políticas RLS adequadas.

---

## 🚀 Próximos Passos

1. **URGENTE:** Atualizar o código no Google Apps Script
2. **Testar:** Verificar se o modal funciona corretamente
3. **Confirmar:** Comboboxes carregando planos
4. **Futuro:** Configurar RLS nas tabelas (segurança)

---

**Data da Correção:** 28/12/2025  
**Status:** ✅ BUG CORRIGIDO - Aguardando atualização no Google Apps Script
