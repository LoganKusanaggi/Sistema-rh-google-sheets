-- Adicionar coluna de salário base na tabela de colaboradores
ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS salario_base DECIMAL(10,2) DEFAULT 0;

-- Tabela para histórico de alterações salariais
CREATE TABLE IF NOT EXISTS historico_salarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
    salario_anterior DECIMAL(10,2),
    salario_novo DECIMAL(10,2) NOT NULL,
    data_alteracao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    motivo TEXT,
    usuario_que_alterou VARCHAR(255) -- Pode ser EMAIL ou NOME
);

-- Índices e RLS
CREATE INDEX IF NOT EXISTS idx_historico_salarios_colab ON historico_salarios(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_historico_salarios_data ON historico_salarios(data_alteracao);

ALTER TABLE historico_salarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to historico_salarios" ON historico_salarios
  FOR ALL USING (auth.role() = 'service_role');
  
-- Política permissiva para API (Anon function access)
CREATE POLICY "Anon has full access to historico_salarios" ON historico_salarios
  FOR ALL USING (true) WITH CHECK (true);
