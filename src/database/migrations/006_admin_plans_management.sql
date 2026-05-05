-- Migration 006: Admin Plans Management and Data Integrity
-- Adds status control and audit columns to plans and prices.
-- Enforces uniqueness on age ranges per plan to prevent duplicates.

-- 1. Update 'planos' table
ALTER TABLE public.planos 
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Update 'planos_precos' table
ALTER TABLE public.planos_precos 
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Data Cleanup: Remove duplicate age ranges before applying unique constraint
-- This keeps only the newest entry for each (plano_id, faixa_etaria)
DELETE FROM public.planos_precos p1
WHERE p1.id > (
    SELECT MIN(p2.id)
    FROM public.planos_precos p2
    WHERE p2.plano_id = p1.plano_id 
    AND p2.faixa_etaria = p1.faixa_etaria
);

-- 4. Add Unique Constraint to 'planos_precos'
-- This prevents future duplicates
ALTER TABLE public.planos_precos
ADD CONSTRAINT unique_plano_faixa UNIQUE (plano_id, faixa_etaria);

-- 5. Add Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_planos_updated_at ON public.planos;
CREATE TRIGGER update_planos_updated_at
BEFORE UPDATE ON public.planos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_planos_precos_updated_at ON public.planos_precos;
CREATE TRIGGER update_planos_precos_updated_at
BEFORE UPDATE ON public.planos_precos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Indices for performance
CREATE INDEX IF NOT EXISTS idx_planos_ativo ON public.planos(ativo);
CREATE INDEX IF NOT EXISTS idx_planos_precos_ativo ON public.planos_precos(ativo);
