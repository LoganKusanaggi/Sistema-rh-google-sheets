-- Add matricula to colaboradores_planos
ALTER TABLE colaboradores_planos 
ADD COLUMN IF NOT EXISTS matricula VARCHAR(255);

-- Create dependentes table
CREATE TABLE IF NOT EXISTS dependentes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(11),
    data_nasc DATE NOT NULL,
    parentesco VARCHAR(50), -- Filho, Conjuge, Pai/Mãe
    matricula VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_dependentes_colab ON dependentes(colaborador_id);
