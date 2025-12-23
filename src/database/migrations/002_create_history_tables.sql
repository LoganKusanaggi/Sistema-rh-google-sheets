-- Tabela Cabeçalho de Relatórios
CREATE TABLE IF NOT EXISTS relatorios_gerados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'folha', 'beneficios', 'variavel', 'apontamentos'
    mes_referencia INT,
    ano_referencia INT,
    filtros_usados JSONB,
    status VARCHAR(50) DEFAULT 'gerado', -- 'gerado', 'enviado', 'cancelado'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela Itens do Relatório (Dados Snapshot)
CREATE TABLE IF NOT EXISTS relatorios_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relatorio_id UUID REFERENCES relatorios_gerados(id) ON DELETE CASCADE,
    cpf VARCHAR(14),
    nome_colaborador VARCHAR(255),
    dados_snapshot JSONB, -- O objeto completo da linha (salario, extras, descontos, etc)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_relatorios_tipo ON relatorios_gerados(tipo);
CREATE INDEX IF NOT EXISTS idx_relatorios_data ON relatorios_gerados(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_relatorios_itens_relatorio ON relatorios_itens(relatorio_id);
