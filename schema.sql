-- =====================================================
-- SCHEMA SQL - Sistema RH Supabase v2.0
-- =====================================================
-- Execute este SQL no SQL Editor do Supabase

-- ===== TABELA: colaboradores =====
CREATE TABLE IF NOT EXISTS colaboradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf VARCHAR(11) UNIQUE NOT NULL,
  codigo_folha VARCHAR(50),
  matricula VARCHAR(50),
  nome_completo VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(20),
  cargo VARCHAR(100),
  departamento VARCHAR(100),
  local_trabalho VARCHAR(100),
  cidade VARCHAR(100),
  data_nascimento DATE,
  data_admissao DATE,
  data_demissao DATE,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'ferias', 'afastado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para colaboradores
CREATE INDEX idx_colaboradores_cpf ON colaboradores(cpf);
CREATE INDEX idx_colaboradores_status ON colaboradores(status);
CREATE INDEX idx_colaboradores_departamento ON colaboradores(departamento);

-- ===== TABELA: folha_pagamento =====
-- Estrutura baseada no Template Real da Empresa
CREATE TABLE IF NOT EXISTS folha_pagamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
  cpf VARCHAR(11) NOT NULL,
  nome_colaborador VARCHAR(255),
  mes_referencia INTEGER NOT NULL CHECK (mes_referencia BETWEEN 1 AND 12),
  ano_referencia INTEGER NOT NULL CHECK (ano_referencia >= 2020),
  
  -- Dados Básicos (Colunas A-H do Template)
  local_trabalho VARCHAR(100),
  data_admissao DATE,
  socio VARCHAR(10), -- 'S' ou vazio
  salario_base DECIMAL(10,2) DEFAULT 0,
  novo_salario DECIMAL(10,2), -- Para reajustes
  cargo VARCHAR(100),
  departamento VARCHAR(100),
  
  -- Plano de Saúde (Colunas I-P do Template)
  convenio_escolhido VARCHAR(100),
  data_nascimento DATE,
  idade INTEGER,
  faixa_etaria VARCHAR(20), -- Ex: "24-28"
  vl_100_amil DECIMAL(10,2) DEFAULT 0,
  vl_empresa_amil DECIMAL(10,2) DEFAULT 0,
  vl_func_amil DECIMAL(10,2) DEFAULT 0,
  amil_saude_dep DECIMAL(10,2) DEFAULT 0,
  
  -- Plano Odontológico (Colunas Q-R do Template)
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

-- Índices para folha_pagamento
CREATE INDEX idx_folha_cpf ON folha_pagamento(cpf);
CREATE INDEX idx_folha_periodo ON folha_pagamento(ano_referencia, mes_referencia);
CREATE INDEX idx_folha_status ON folha_pagamento(status_pagamento);

-- ===== TABELA: beneficios =====
CREATE TABLE IF NOT EXISTS beneficios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
  cpf VARCHAR(11) NOT NULL,
  nome_colaborador VARCHAR(255),
  mes_referencia INTEGER NOT NULL CHECK (mes_referencia BETWEEN 1 AND 12),
  ano_referencia INTEGER NOT NULL CHECK (ano_referencia >= 2020),
  
  tipo_beneficio VARCHAR(50) NOT NULL CHECK (tipo_beneficio IN (
    'vale_refeicao', 'vale_alimentacao', 'vale_transporte',
    'plano_saude', 'plano_odontologico', 'seguro_vida',
    'auxilio_creche', 'auxilio_educacao', 'gympass',
    'cesta_basica', 'outros'
  )),
  descricao TEXT,
  valor DECIMAL(10,2) DEFAULT 0,
  quantidade INTEGER DEFAULT 1,
  valor_total DECIMAL(10,2) DEFAULT 0,
  fornecedor VARCHAR(255),
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'suspenso')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(cpf, mes_referencia, ano_referencia, tipo_beneficio)
);

-- Índices para beneficios
CREATE INDEX idx_beneficios_cpf ON beneficios(cpf);
CREATE INDEX idx_beneficios_periodo ON beneficios(ano_referencia, mes_referencia);
CREATE INDEX idx_beneficios_tipo ON beneficios(tipo_beneficio);

-- ===== TABELA: apuracao_variavel =====
CREATE TABLE IF NOT EXISTS apuracao_variavel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
  cpf VARCHAR(11) NOT NULL,
  nome_vendedor VARCHAR(255),
  mes_referencia INTEGER NOT NULL CHECK (mes_referencia BETWEEN 1 AND 12),
  ano_referencia INTEGER NOT NULL CHECK (ano_referencia >= 2020),
  
  -- Caffeine
  caffeine_fat_meta DECIMAL(10,2) DEFAULT 0,
  caffeine_fat_realizado DECIMAL(10,2) DEFAULT 0,
  caffeine_pos_meta INTEGER DEFAULT 0,
  caffeine_pos_realizado INTEGER DEFAULT 0,
  
  -- Sublyme
  sublyme_fat_meta DECIMAL(10,2) DEFAULT 0,
  sublyme_fat_realizado DECIMAL(10,2) DEFAULT 0,
  sublyme_pos_meta INTEGER DEFAULT 0,
  sublyme_pos_realizado INTEGER DEFAULT 0,
  
  -- Koala
  koala_fat_meta DECIMAL(10,2) DEFAULT 0,
  koala_fat_realizado DECIMAL(10,2) DEFAULT 0,
  koala_pos_meta INTEGER DEFAULT 0,
  koala_pos_realizado INTEGER DEFAULT 0,
  
  -- Variável
  salario_base DECIMAL(10,2) DEFAULT 0,
  multiplicador DECIMAL(5,2) DEFAULT 0,
  valor_variavel DECIMAL(10,2) DEFAULT 0,
  
  status_aprovacao VARCHAR(20) DEFAULT 'pendente' CHECK (status_aprovacao IN ('pendente', 'aprovado', 'rejeitado')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(cpf, mes_referencia, ano_referencia)
);

-- Índices para apuracao_variavel
CREATE INDEX idx_variavel_cpf ON apuracao_variavel(cpf);
CREATE INDEX idx_variavel_periodo ON apuracao_variavel(ano_referencia, mes_referencia);
CREATE INDEX idx_variavel_status ON apuracao_variavel(status_aprovacao);

-- ===== TABELA: apontamentos =====
CREATE TABLE IF NOT EXISTS apontamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
  cpf VARCHAR(11) NOT NULL,
  nome_colaborador VARCHAR(255),
  data_apontamento DATE NOT NULL,
  mes_referencia INTEGER NOT NULL CHECK (mes_referencia BETWEEN 1 AND 12),
  ano_referencia INTEGER NOT NULL CHECK (ano_referencia >= 2020),
  
  tipo_apontamento VARCHAR(30) NOT NULL CHECK (tipo_apontamento IN (
    'presenca', 'falta', 'falta_justificada', 'atestado',
    'ferias', 'folga', 'licenca', 'home_office',
    'hora_extra', 'banco_horas', 'atraso', 'saida_antecipada'
  )),
  
  -- Horários
  hora_entrada TIME,
  hora_saida TIME,
  hora_inicio_intervalo TIME,
  hora_fim_intervalo TIME,
  
  -- Horas
  horas_trabalhadas DECIMAL(5,2) DEFAULT 0,
  horas_extras DECIMAL(5,2) DEFAULT 0,
  horas_noturnas DECIMAL(5,2) DEFAULT 0,
  
  -- Ocorrências
  falta BOOLEAN DEFAULT FALSE,
  atraso_minutos INTEGER DEFAULT 0,
  saida_antecipada_minutos INTEGER DEFAULT 0,
  
  -- Justificativas
  justificativa TEXT,
  atestado BOOLEAN DEFAULT FALSE,
  
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'em_analise')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(cpf, data_apontamento)
);

-- Índices para apontamentos
CREATE INDEX idx_apontamentos_cpf ON apontamentos(cpf);
CREATE INDEX idx_apontamentos_data ON apontamentos(data_apontamento);
CREATE INDEX idx_apontamentos_periodo ON apontamentos(ano_referencia, mes_referencia);
CREATE INDEX idx_apontamentos_tipo ON apontamentos(tipo_apontamento);

-- ===== TABELA: seguros =====
CREATE TABLE IF NOT EXISTS seguros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
  
  -- Dados do Seguro
  seguradora VARCHAR(255) NOT NULL,
  apolice VARCHAR(100) NOT NULL,
  tipo_seguro VARCHAR(30) DEFAULT 'vida' CHECK (tipo_seguro IN (
    'vida', 'acidentes_pessoais', 'invalidez', 'funeral', 'outros'
  )),
  
  -- Valores
  valor_cobertura DECIMAL(10,2) NOT NULL,
  premio_mensal DECIMAL(10,2) NOT NULL,
  
  -- Vigência
  data_inicio DATE NOT NULL,
  data_vencimento DATE NOT NULL,
  
  -- Beneficiário
  beneficiario_nome VARCHAR(255),
  beneficiario_cpf VARCHAR(11),
  beneficiario_parentesco VARCHAR(50),
  
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'suspenso', 'cancelado', 'vencido', 'sinistro')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(apolice, seguradora)
);

-- Índices para seguros
CREATE INDEX idx_seguros_colaborador ON seguros(colaborador_id);
CREATE INDEX idx_seguros_status ON seguros(status);
CREATE INDEX idx_seguros_vencimento ON seguros(data_vencimento);

-- ===== TRIGGERS PARA UPDATED_AT =====
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_colaboradores_updated_at BEFORE UPDATE ON colaboradores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_folha_updated_at BEFORE UPDATE ON folha_pagamento
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beneficios_updated_at BEFORE UPDATE ON beneficios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_variavel_updated_at BEFORE UPDATE ON apuracao_variavel
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_apontamentos_updated_at BEFORE UPDATE ON apontamentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seguros_updated_at BEFORE UPDATE ON seguros
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== POLÍTICAS RLS (Row Level Security) =====
-- Ativar RLS em todas as tabelas
ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE folha_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficios ENABLE ROW LEVEL SECURITY;
ALTER TABLE apuracao_variavel ENABLE ROW LEVEL SECURITY;
ALTER TABLE apontamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE seguros ENABLE ROW LEVEL SECURITY;

-- Políticas para service_role (acesso total)
CREATE POLICY "Service role has full access to colaboradores" ON colaboradores
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to folha_pagamento" ON folha_pagamento
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to beneficios" ON beneficios
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to apuracao_variavel" ON apuracao_variavel
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to apontamentos" ON apontamentos
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to seguros" ON seguros
  FOR ALL USING (auth.role() = 'service_role');

-- ===== DADOS DE EXEMPLO (OPCIONAL) =====
-- Inserir colaborador de teste
INSERT INTO colaboradores (cpf, nome_completo, email, cargo, departamento, status)
VALUES ('12345678900', 'João Silva Teste', 'joao@teste.com', 'Analista', 'TI', 'ativo')
ON CONFLICT (cpf) DO NOTHING;

-- ===== FIM DO SCHEMA =====
-- Execute este SQL no SQL Editor do Supabase
-- Todas as tabelas, índices, triggers e políticas serão criadas
