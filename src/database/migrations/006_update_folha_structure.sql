-- Migration 006: Update folha_pagamento structure to match 2025 Template

-- 1. Adicionar campos informativos do Colaborador (Snapshot)
ALTER TABLE folha_pagamento ADD COLUMN IF NOT EXISTS local_trabalho TEXT;
ALTER TABLE folha_pagamento ADD COLUMN IF NOT EXISTS data_admissao DATE;
ALTER TABLE folha_pagamento ADD COLUMN IF NOT EXISTS socio DECIMAL(10,2) DEFAULT 0; -- Adiantamento de Lucro
ALTER TABLE folha_pagamento ADD COLUMN IF NOT EXISTS cargo TEXT;
ALTER TABLE folha_pagamento ADD COLUMN IF NOT EXISTS departamento TEXT;

-- 2. Adicionar campos de Plano de Saúde e Odonto (Cálculo Detalhado)
ALTER TABLE folha_pagamento ADD COLUMN IF NOT EXISTS convenio_escolhido TEXT; -- Nome do plano
ALTER TABLE folha_pagamento ADD COLUMN IF NOT EXISTS data_nascimento DATE;
ALTER TABLE folha_pagamento ADD COLUMN IF NOT EXISTS idade INTEGER;
ALTER TABLE folha_pagamento ADD COLUMN IF NOT EXISTS faixa_etaria TEXT;

-- 3. Valores Detalhados (Saúde)
ALTER TABLE folha_pagamento ADD COLUMN IF NOT EXISTS vl_100_amil DECIMAL(10,2) DEFAULT 0; -- Valor Cheio
ALTER TABLE folha_pagamento ADD COLUMN IF NOT EXISTS vl_empresa_amil DECIMAL(10,2) DEFAULT 0; -- Parte Empresa (80%)
ALTER TABLE folha_pagamento ADD COLUMN IF NOT EXISTS vl_func_amil DECIMAL(10,2) DEFAULT 0; -- Parte Func (20%)
ALTER TABLE folha_pagamento ADD COLUMN IF NOT EXISTS amil_saude_dep DECIMAL(10,2) DEFAULT 0; -- Dependentes (100% Func)

-- 4. Valores Detalhados (Odonto)
ALTER TABLE folha_pagamento ADD COLUMN IF NOT EXISTS odont_func DECIMAL(10,2) DEFAULT 0; -- Odonto Titular
ALTER TABLE folha_pagamento ADD COLUMN IF NOT EXISTS odont_dep DECIMAL(10,2) DEFAULT 0; -- Odonto Dependentes

-- 5. Comentário para documentação
COMMENT ON COLUMN folha_pagamento.socio IS 'Valor referente a adiantamento de lucros para sócios';
COMMENT ON COLUMN folha_pagamento.vl_empresa_amil IS 'Custo empresa (80% do titular)';
COMMENT ON COLUMN folha_pagamento.vl_func_amil IS 'Custo colaborador (20% do titular)';
