-- =====================================================
-- MIGRATION: Simplificar Folha de Pagamento
-- =====================================================
-- Esta migration ajusta a tabela folha_pagamento para refletir
-- o template real usado pela empresa
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
  socio VARCHAR(10), -- S ou vazio
  salario_base DECIMAL(10,2) DEFAULT 0,
  novo_salario DECIMAL(10,2), -- Para reajustes
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
  salario_base, cargo, departamento, status_pagamento, data_pagamento, observacoes,
  created_at, updated_at
)
SELECT 
  colaborador_id, cpf, nome_colaborador, mes_referencia, ano_referencia,
  salario_base, '', '', status_pagamento, data_pagamento, observacoes,
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

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
