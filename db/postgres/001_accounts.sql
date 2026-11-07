CREATE TABLE accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username varchar(32) NOT NULL UNIQUE,
    display_name varchar(80) NOT NULL,
    password_hash text NOT NULL,
    role varchar(8) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active boolean NOT NULL DEFAULT true,
    must_change_password boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES accounts(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    last_login_at timestamptz,
    password_changed_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT accounts_username_format CHECK (username ~ '^[a-z0-9_]{3,32}$'),
    CONSTRAINT accounts_display_name_not_blank CHECK (length(trim(display_name)) > 0)
);

CREATE TABLE account_sessions (
    token_hash char(64) PRIMARY KEY,
    account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    CONSTRAINT account_sessions_valid_expiry CHECK (expires_at > created_at)
);
CREATE INDEX account_sessions_account_idx ON account_sessions(account_id);
CREATE INDEX account_sessions_expiry_idx ON account_sessions(expires_at);

CREATE TABLE auth_rate_limits (
    scope_key char(64) PRIMARY KEY,
    attempts integer NOT NULL DEFAULT 1 CHECK (attempts > 0),
    window_started_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auth_rate_limits_window_idx ON auth_rate_limits(window_started_at);

CREATE TABLE account_audit_logs (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
    target_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
    action varchar(40) NOT NULL CHECK (action IN ('account.created', 'password.changed')),
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX account_audit_logs_target_idx ON account_audit_logs(target_id, created_at DESC);
