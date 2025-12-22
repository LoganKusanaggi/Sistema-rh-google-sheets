-- =====================================================
-- MIGRATION: Tabelas para Histórico de Relatórios
-- =====================================================

-- Tabela para cabeçalho dos relatórios gerados
CREATE TABLE IF NOT EXISTS relatorios_gerados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL, -- Ex: "folha 01-231220205"
  tipo VARCHAR(50) NOT NULL, -- Ex: "folha", "beneficios"
  mes_referencia INTEGER,
  ano_referencia INTEGER,
  data_geracao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  filtros_usados JSONB, -- Filtros aplicados na geração
  status VARCHAR(20) DEFAULT 'gerado', -- gerado, cancelado, arquivado
  criado_por VARCHAR(255), -- Email ou ID do usuário
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para os itens (linhas) de cada relatório
-- Armazena o snapshot dos dados no momento da geração
CREATE TABLE IF NOT EXISTS relatorios_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relatorio_id UUID REFERENCES relatorios_gerados(id) ON DELETE CASCADE,
  colaborador_id UUID REFERENCES colaboradores(id), -- Opcional, caso o colaborador seja deletado
  cpf VARCHAR(11),
  nome_colaborador VARCHAR(255),
  
  -- Armazena todos os valores da linha em formato JSON
  -- Isso permite flexibilidade para diferentes tipos de relatórios (colunas variáveis)
  dados_snapshot JSONB NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_relatorios_tipo ON relatorios_gerados(tipo);
CREATE INDEX idx_relatorios_data ON relatorios_gerados(data_geracao);
CREATE INDEX idx_relatorios_itens_relatorio ON relatorios_itens(relatorio_id);
CREATE INDEX idx_relatorios_itens_cpf ON relatorios_itens(cpf);

-- Trigger para updated_at
CREATE TRIGGER update_relatorios_updated_at BEFORE UPDATE ON relatorios_gerados
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
