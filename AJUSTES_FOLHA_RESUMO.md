# AJUSTES NA FOLHA DE PAGAMENTO - RESUMO

## 📋 O QUE FOI FEITO

### 1. Banco de Dados (Supabase)
- ✅ Criada migration para simplificar a tabela `folha_pagamento`
- ✅ Atualizado `schema.sql` para refletir o template real
- ❌ **PENDENTE**: Executar a migration no Supabase (requer permissões de admin)

### 2. Estrutura Antiga vs Nova

#### ANTES (Campos Removidos):
- ❌ Horas Extras
- ❌ Adicional Noturno
- ❌ Insalubridade
- ❌ Periculosidade
- ❌ Comissões
- ❌ Gratificações
- ❌ Outros Proventos
- ❌ INSS, IRRF, Vale Transporte, Vale Refeição
- ❌ Outros Descontos
- ❌ Total Proventos, Total Descontos, Salário Líquido

#### AGORA (Campos do Template):
- ✅ NOME
- ✅ LOCAL
- ✅ ADMISSÃO
- ✅ SÓCIO
- ✅ SALÁRIO
- ✅ NOVO SALÁRIO
- ✅ CARGO
- ✅ DEPARTAMENTO
- ✅ CONVENIO ESCOLHIDO
- ✅ DN (Data Nascimento)
- ✅ IDADE
- ✅ FAIXA ETÁRIA
- ✅ VL 100% AMIL
- ✅ VL EMPRESA AMIL
- ✅ VL FUNC. AMIL
- ✅ AMIL SAÚDE DEP
- ✅ ODONT. FUNC.
- ✅ ODONT. DEP.

### 3. Scripts do Google Apps Script

Foram criadas duas novas funções:

1. **`criarPlanilhaLancamentoFolha`** (arquivo: `funcao_folha_atualizada.js`)
   - Gera planilha com 18 colunas conforme template
   - Calcula idade e faixa etária automaticamente
   - Formata datas no padrão Excel
   - Busca dados completos dos colaboradores da API

2. **`enviarFolhaParaAPI`** (arquivo: `funcao_enviar_folha_atualizada.js`)
   - Envia dados no novo formato
   - Converte datas do Excel para ISO
   - Mapeia todas as 18 colunas

## 📁 ARQUIVOS CRIADOS

1. `migration_folha_simplificada.sql` - Migration para o Supabase
2. `funcao_folha_atualizada.js` - Nova função de criação da planilha
3. `funcao_enviar_folha_atualizada.js` - Nova função de envio
4. `schema.sql` - Atualizado com nova estrutura
5. `ESTRUTURA_FOLHA.txt` - Análise do template
6. `AJUSTES_FOLHA_RESUMO.md` - Este arquivo

## 🚀 PRÓXIMOS PASSOS

### Passo 1: Atualizar Banco de Dados (IMPORTANTE!)
Como não tenho permissões para executar a migration via MCP, você precisa:

1. Acessar o Supabase Dashboard
2. Ir em **SQL Editor**
3. Copiar e colar o conteúdo de `migration_folha_simplificada.sql`
4. Executar o SQL

⚠️ **ATENÇÃO**: Esta migration vai:
- Criar uma nova tabela `folha_pagamento_nova`
- Migrar dados existentes (apenas campos compatíveis)
- Dropar a tabela antiga
- Renomear a nova para `folha_pagamento`

### Passo 2: Atualizar Google Apps Script

Substituir as funções no arquivo principal:

1. Abrir o Google Apps Script do projeto
2. Localizar a função `criarPlanilhaLancamentoFolha` (linha ~627)
3. Substituir pelo conteúdo de `funcao_folha_atualizada.js`
4. Localizar a função `enviarFolhaParaAPI` (linha ~693)
5. Substituir pelo conteúdo de `funcao_enviar_folha_atualizada.js`
6. Salvar

### Passo 3: Atualizar API (Backend)

O endpoint `/folha/batch` precisa ser atualizado para aceitar os novos campos:

```javascript
// Campos que a API deve esperar:
{
  nome_colaborador, local_trabalho, data_admissao, socio,
  salario_base, novo_salario, cargo, departamento,
  convenio_escolhido, data_nascimento, idade, faixa_etaria,
  vl_100_amil, vl_empresa_amil, vl_func_amil, amil_saude_dep,
  odont_func, odont_dep, mes_referencia, ano_referencia
}
```

## ✅ CHECKLIST DE VALIDAÇÃO

Após implementar:

- [ ] Migration executada no Supabase
- [ ] Funções atualizadas no Apps Script
- [ ] API atualizada para aceitar novos campos
- [ ] Teste: Criar planilha de lançamento
- [ ] Verificar se planilha tem 18 colunas
- [ ] Verificar se dados dos colaboradores são carregados
- [ ] Teste: Enviar dados para API
- [ ] Verificar se dados foram salvos no banco

## 📞 SUPORTE

Se houver erros:
1. Verificar logs do Apps Script (View > Logs)
2. Verificar resposta da API no Network do navegador
3. Verificar estrutura da tabela no Supabase
