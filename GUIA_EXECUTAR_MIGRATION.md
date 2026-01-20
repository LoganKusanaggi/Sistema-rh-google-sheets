# 🔧 GUIA: Como Executar a Migration no Supabase

## ⚠️ IMPORTANTE
Infelizmente não tenho permissões para executar migrations via MCP Server. Você precisará executar manualmente seguindo os passos abaixo.

## 📋 PASSO A PASSO

### 1. Acessar o Supabase Dashboard
1. Acesse: https://supabase.com/dashboard
2. Faça login
3. Selecione o projeto: **vqpqxjqpqjmwbqgcpxlr**

### 2. Abrir o SQL Editor
1. No menu lateral, clique em **SQL Editor**
2. Clique em **New Query** (ou use Ctrl+Enter)

### 3. Copiar e Colar a Migration
Copie TODO o conteúdo do arquivo `migration_folha_simplificada.sql` e cole no editor SQL.

Ou copie diretamente daqui:

```sql
-- =====================================================
-- MIGRATION: Simplificar Folha de Pagamento
-- =====================================================

-- 1. Criar nova tabela com estrutura simplificada
CREATE TABLE IF NOT EXISTS folha_pagamento_nova (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
  cpf VARCHAR(11) NOT NULL,
  nome_colaborador VARCHAR(255),
  mes_referencia INTEGER NOT NULL CHECK (mes_referencia BETWEEN 1 AND 12),
  ano_referencia INTEGER NOT NULL CHECK (ano_referencia >= 2020),
  
  -- Dados Básicos (do template)
  local_trabalho VARCHAR(100),
  data_admissao DATE,
  socio VARCHAR(10),
  salario_base DECIMAL(10,2) DEFAULT 0,
  novo_salario DECIMAL(10,2),
  cargo VARCHAR(100),
  departamento VARCHAR(100),
  
  -- Plano de Saúde
  convenio_escolhido VARCHAR(100),
  data_nascimento DATE,
  idade INTEGER,
  faixa_etaria VARCHAR(20),
  vl_100_amil DECIMAL(10,2) DEFAULT 0,
  vl_empresa_amil DECIMAL(10,2) DEFAULT 0,
  vl_func_amil DECIMAL(10,2) DEFAULT 0,
  amil_saude_dep DECIMAL(10,2) DEFAULT 0,
  
  -- Plano Odontológico
  odont_func DECIMAL(10,2) DEFAULT 0,
  odont_dep DECIMAL(10,2) DEFAULT 0,
  
  -- Controle
  status_pagamento VARCHAR(20) DEFAULT 'pendente' CHECK (status_pagamento IN ('pendente', 'pago', 'cancelado')),
  data_pagamento DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(cpf, mes_referencia, ano_referencia)
);

-- 2. Migrar dados existentes (se houver)
INSERT INTO folha_pagamento_nova (
  colaborador_id, cpf, nome_colaborador, mes_referencia, ano_referencia,
  salario_base, status_pagamento, data_pagamento, observacoes,
  created_at, updated_at
)
SELECT 
  colaborador_id, cpf, nome_colaborador, mes_referencia, ano_referencia,
  salario_base, status_pagamento, data_pagamento, observacoes,
  created_at, updated_at
FROM folha_pagamento
ON CONFLICT (cpf, mes_referencia, ano_referencia) DO NOTHING;

-- 3. Dropar tabela antiga e renomear
DROP TABLE IF EXISTS folha_pagamento CASCADE;
ALTER TABLE folha_pagamento_nova RENAME TO folha_pagamento;

-- 4. Recriar índices
CREATE INDEX idx_folha_cpf ON folha_pagamento(cpf);
CREATE INDEX idx_folha_periodo ON folha_pagamento(ano_referencia, mes_referencia);
CREATE INDEX idx_folha_status ON folha_pagamento(status_pagamento);

-- 5. Recriar trigger
CREATE TRIGGER update_folha_updated_at BEFORE UPDATE ON folha_pagamento
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Recriar política RLS
ALTER TABLE folha_pagamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to folha_pagamento" ON folha_pagamento
  FOR ALL USING (auth.role() = 'service_role');
```

### 4. Executar a Migration
1. Clique no botão **Run** (ou pressione Ctrl+Enter)
2. Aguarde a execução
3. Verifique se apareceu "Success" na parte inferior

### 5. Verificar se Funcionou
Execute esta query para verificar a nova estrutura:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'folha_pagamento' 
ORDER BY ordinal_position;
```

Você deve ver as 18 novas colunas:
- nome_colaborador
- local_trabalho
- data_admissao
- socio
- salario_base
- novo_salario
- cargo
- departamento
- convenio_escolhido
- data_nascimento
- idade
- faixa_etaria
- vl_100_amil
- vl_empresa_amil
- vl_func_amil
- amil_saude_dep
- odont_func
- odont_dep

## ✅ Próximo Passo
Após executar a migration com sucesso, você pode:
1. Atualizar as funções no Google Apps Script
2. Testar criando uma nova planilha de lançamento
3. Verificar se os dados aparecem corretamente

## 🆘 Em Caso de Erro
Se der erro na execução:
1. Copie a mensagem de erro
2. Me envie para eu ajudar a resolver
3. Não se preocupe - a migration tem proteções (IF NOT EXISTS, ON CONFLICT)
