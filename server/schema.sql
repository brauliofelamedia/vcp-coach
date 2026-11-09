CREATE TABLE IF NOT EXISTS vcp_logins (email text PRIMARY KEY, code_hash text NOT NULL, attempts integer NOT NULL DEFAULT 0, expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS vcp_sessions (id text PRIMARY KEY, email text NOT NULL, expires_at timestamptz NOT NULL);
CREATE INDEX IF NOT EXISTS vcp_session_expiry ON vcp_sessions(expires_at);
CREATE TABLE IF NOT EXISTS vcp_cases (
 id uuid PRIMARY KEY, owner_email text NOT NULL, issue text NOT NULL, market text NOT NULL,
 status text NOT NULL DEFAULT 'documents' CHECK(status IN ('documents','ready','waiting_amazon','human_review','resolved')),
 payload text NOT NULL, revision integer NOT NULL DEFAULT 0, file_count integer NOT NULL DEFAULT 0,
 file_bytes bigint NOT NULL DEFAULT 0, analyzing_until timestamptz, analyzing_token uuid, deadline date, followup boolean NOT NULL DEFAULT false,
 last_reminder timestamptz, created_at timestamptz NOT NULL DEFAULT NOW(), updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS vcp_case_owner ON vcp_cases(owner_email,updated_at DESC);
CREATE TABLE IF NOT EXISTS vcp_files (id uuid PRIMARY KEY, case_id uuid NOT NULL REFERENCES vcp_cases(id) ON DELETE CASCADE, payload text NOT NULL, size integer NOT NULL, created_at timestamptz NOT NULL DEFAULT NOW());
CREATE INDEX IF NOT EXISTS vcp_file_case ON vcp_files(case_id);
CREATE TABLE IF NOT EXISTS vcp_mail (
 id text PRIMARY KEY, case_id uuid REFERENCES vcp_cases(id) ON DELETE CASCADE, payload text NOT NULL,
 status text NOT NULL DEFAULT 'pending', attempts integer NOT NULL DEFAULT 0, lease_until timestamptz,
 created_at timestamptz NOT NULL DEFAULT NOW(), sent_at timestamptz, provider_id text
);
CREATE TABLE IF NOT EXISTS vcp_rate (key text NOT NULL,bucket bigint NOT NULL,count integer NOT NULL,expires_at timestamptz NOT NULL,PRIMARY KEY(key,bucket));
