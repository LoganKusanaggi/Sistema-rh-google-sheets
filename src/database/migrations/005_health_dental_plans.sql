-- Migration 005: Create Health and Dental Plans tables
-- Creates a normalized structure: 
-- 1. 'planos' for the unique plans (products).
-- 2. 'planos_precos' for the price tables (age ranges).
-- 3. 'colaboradores_planos' for linking users to plans.

-- 1. Tabela de Planos (Produtos)
CREATE TABLE IF NOT EXISTS planos (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL UNIQUE, -- Ex: "962680 – AMIL S580 QP NAC R PJ"
    tipo TEXT NOT NULL CHECK (tipo IN ('SAUDE', 'ODONTO')),
    codigo_ref TEXT, -- Ex: "962680"
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Preços (Faixas Etárias)
CREATE TABLE IF NOT EXISTS planos_precos (
    id SERIAL PRIMARY KEY,
    plano_id INTEGER REFERENCES planos(id) ON DELETE CASCADE,
    faixa_etaria TEXT NOT NULL, -- Ex: "De 0 a 18 anos"
    faixa_min INTEGER, -- Parsed min age (optional helper)
    faixa_max INTEGER, -- Parsed max age (optional helper)
    valor DECIMAL(10,2) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Vínculo Colaborador x Plano
CREATE TABLE IF NOT EXISTS colaboradores_planos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
    plano_id INTEGER NOT NULL REFERENCES planos(id) ON DELETE RESTRICT,
    
    -- Se quisermos registrar dependentes:
    dependentes INTEGER DEFAULT 0,
    
    -- Auditoria
    data_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Um colaborador pode ter no máximo 1 plano de Saúde e 1 de Odonto ativos?
    -- Por enquanto vamos deixar flexível, mas idealmente seria unique(colaborador_id, plano_id)
    UNIQUE(colaborador_id, plano_id)
);

-- Indexes
CREATE INDEX idx_planos_tipo ON planos(tipo);
CREATE INDEX idx_planos_precos_plano_id ON planos_precos(plano_id);
CREATE INDEX idx_colaboradores_planos_colaborador_id ON colaboradores_planos(colaborador_id);
