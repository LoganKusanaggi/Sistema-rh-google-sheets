-- Migration: 009_system_users_and_invitations
-- Objetivo: Criar estrutura para usuários operacionais e sistema de convites.

-- 1. Tabela de Usuários do Sistema (Operational Users)
CREATE TABLE IF NOT EXISTS system_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL DEFAULT 'default',
    email TEXT NOT NULL,
    google_sub TEXT, -- Preenchido após o primeiro login/aceite
    role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('OWNER', 'ADMIN', 'RH_MANAGER', 'RH_OPERATOR', 'VIEWER')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

-- 2. Tabela de Convites de Usuários
CREATE TABLE IF NOT EXISTS user_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL DEFAULT 'default',
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('OWNER', 'ADMIN', 'RH_MANAGER', 'RH_OPERATOR', 'VIEWER')),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED')),
    token_hash TEXT NOT NULL, -- Armazenamos o hash do token, nunca o token puro
    invited_by_email TEXT NOT NULL,
    accepted_by_google_sub TEXT,
    accepted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Índices para performance e busca rápida
CREATE INDEX IF NOT EXISTS system_users_email_idx ON system_users (email);
CREATE INDEX IF NOT EXISTS system_users_tenant_email_idx ON system_users (tenant_id, email);
CREATE INDEX IF NOT EXISTS user_invitations_token_hash_idx ON user_invitations (token_hash);
CREATE INDEX IF NOT EXISTS user_invitations_email_status_idx ON user_invitations (email, status);

-- 4. Migração de Dados de admin_users para system_users
-- Assumimos que todos os admins atuais se tornam OWNER no novo sistema
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admin_users') THEN
        INSERT INTO system_users (email, role, status, created_at)
        SELECT email, 'OWNER', 'ACTIVE', criado_em
        FROM admin_users
        ON CONFLICT (tenant_id, email) DO NOTHING;
    END IF;
END $$;

-- 5. Row Level Security (RLS)
ALTER TABLE system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- Política para system_users: Usuários veem a si mesmos ou admins veem todos do mesmo tenant
CREATE POLICY system_users_isolation_policy ON system_users
    USING (
        (auth.jwt() ->> 'email' = email) OR 
        EXISTS (
            SELECT 1 FROM system_users 
            WHERE email = auth.jwt() ->> 'email' 
            AND role IN ('OWNER', 'ADMIN') 
            AND tenant_id = system_users.tenant_id
        )
    );

-- Política para user_invitations: Admins do tenant veem convites
CREATE POLICY user_invitations_admin_policy ON user_invitations
    USING (
        EXISTS (
            SELECT 1 FROM system_users 
            WHERE email = auth.jwt() ->> 'email' 
            AND role IN ('OWNER', 'ADMIN') 
            AND tenant_id = user_invitations.tenant_id
        )
    );

-- 6. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_system_users_updated_at
    BEFORE UPDATE ON system_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_invitations_updated_at
    BEFORE UPDATE ON user_invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
