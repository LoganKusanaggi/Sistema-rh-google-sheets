-- Migração 008: Gestão de Pasta de Relatórios por Usuário
-- Objetivo: Armazenar a configuração de pasta do Drive para cada usuário/tenant.

CREATE TABLE IF NOT EXISTS public.user_report_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL DEFAULT 'default',
    user_email TEXT NOT NULL,
    google_sub TEXT,
    folder_id TEXT NOT NULL,
    folder_url TEXT NOT NULL,
    folder_name TEXT,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT true,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_validation_error TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by_email TEXT,
    updated_by_email TEXT
);

-- Índice parcial: Garante apenas uma pasta default ativa por usuário/tenant
CREATE UNIQUE INDEX IF NOT EXISTS user_report_folders_one_active_default_idx 
ON public.user_report_folders (tenant_id, lower(user_email)) 
WHERE is_active = true AND is_default = true;

-- Habilitar RLS
ALTER TABLE public.user_report_folders ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Usuários podem ver suas próprias configurações" 
ON public.user_report_folders FOR SELECT 
USING (lower(user_email) = lower(auth.jwt() ->> 'email'));

CREATE POLICY "Usuários podem gerenciar suas próprias configurações" 
ON public.user_report_folders FOR ALL 
USING (lower(user_email) = lower(auth.jwt() ->> 'email'));

-- Comentários para documentação
COMMENT ON TABLE public.user_report_folders IS 'Armazena as pastas do Google Drive configuradas para exportação de relatórios por usuário.';
