-- Migration: Gestão de Administradores e Auditoria
-- Data: 2026-05-05

-- 1. Tabela de Administradores
CREATE TABLE IF NOT EXISTS public.admin_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    nome text NULL,
    role text NOT NULL DEFAULT 'ADMIN' CHECK (role IN ('OWNER', 'ADMIN', 'VIEWER')),
    ativo boolean NOT NULL DEFAULT true,
    criado_por text NULL,
    criado_em timestamptz NOT NULL DEFAULT now(),
    atualizado_em timestamptz NOT NULL DEFAULT now(),
    ultimo_acesso_em timestamptz NULL
);

-- Garantir que e-mails sejam sempre tratados em minúsculo
CREATE INDEX IF NOT EXISTS idx_admin_users_email_lower ON public.admin_users (LOWER(email));

-- 2. Tabela de Logs de Auditoria
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_email text NOT NULL,
    action text NOT NULL,
    target_email text NULL,
    payload jsonb NULL,
    ip text NULL,
    user_agent text NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON public.admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários nas tabelas para documentação
COMMENT ON TABLE public.admin_users IS 'Tabela que armazena os usuários com acesso administrativo ao sistema.';
COMMENT ON TABLE public.admin_audit_logs IS 'Logs de auditoria para ações críticas realizadas por administradores.';
