ALTER TABLE relatorios_itens ADD COLUMN IF NOT EXISTS colaborador_id UUID REFERENCES colaboradores(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_relatorios_itens_colab ON relatorios_itens(colaborador_id);
