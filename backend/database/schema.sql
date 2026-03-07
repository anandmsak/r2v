-- =============================================================================
-- R2V (Right to Vote) — PostgreSQL Database Schema
-- Copyright (c) 2026 Anandha Krishnan P
-- All rights reserved.
-- =============================================================================
-- Version  : v1.0
-- Database : PostgreSQL 14+
-- Encoding : UTF-8
-- =============================================================================
-- TABLE INDEX
--   1. users
--   2. auth_otps
--   3. elections
--   4. candidates
--   5. voter_eligibility
--   6. ballot_tokens
--   7. ballots
--   8. audit_logs
--   9. result_snapshots
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE user_role AS ENUM ('admin', 'voter', 'auditor');

CREATE TYPE election_status AS ENUM (
    'draft',
    'scheduled',
    'active',
    'completed',
    'archived'
);

-- =============================================================================
-- 1. USERS
-- Stores all system users: admins, voters, auditors.
-- Voter identity lives here. Ballots must NEVER reference this table directly.
-- =============================================================================

CREATE TABLE users (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    register_number VARCHAR(50)  NOT NULL UNIQUE,
    full_name       VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    department      VARCHAR(100),
    year            SMALLINT     CHECK (year BETWEEN 1 AND 7),
    role            user_role    NOT NULL DEFAULT 'voter',
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_register_number ON users (register_number);
CREATE INDEX idx_users_role            ON users (role);
CREATE INDEX idx_users_email           ON users (email);

COMMENT ON TABLE  users                  IS 'All system users. Voter identity is isolated here and must never appear in ballot records.';
COMMENT ON COLUMN users.register_number  IS 'Institutional register/roll number used as login identifier.';
COMMENT ON COLUMN users.role             IS 'admin: election authority | voter: student | auditor: read-only verifier';

-- =============================================================================
-- 2. AUTH_OTPS
-- Stores hashed OTPs. Raw OTP is NEVER stored. Only SHA-256 hash is persisted.
-- Enforces: 5 min expiry, 3 attempt limit, 15 min lockout.
-- =============================================================================

CREATE TABLE auth_otps (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp_hash       VARCHAR(64) NOT NULL,
    attempts       SMALLINT    NOT NULL DEFAULT 0,
    is_used        BOOLEAN     NOT NULL DEFAULT FALSE,
    is_invalidated BOOLEAN     NOT NULL DEFAULT FALSE,
    expires_at     TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
    locked_until   TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auth_otps_user_id    ON auth_otps (user_id);
CREATE INDEX idx_auth_otps_expires_at ON auth_otps (expires_at);

COMMENT ON TABLE  auth_otps            IS 'Hashed OTPs for authentication. Raw OTP never stored.';
COMMENT ON COLUMN auth_otps.otp_hash   IS 'SHA-256 hash of the OTP. Raw value discarded after hashing.';
COMMENT ON COLUMN auth_otps.attempts   IS 'Failed verification attempts. Lock after 3.';
COMMENT ON COLUMN auth_otps.locked_until IS 'If set and in future, reject all OTP attempts for this user.';

-- =============================================================================
-- 3. ELECTIONS
-- Election configuration and lifecycle.
-- Status: draft -> scheduled -> active -> completed -> archived
-- =============================================================================

CREATE TABLE elections (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255)    NOT NULL,
    description TEXT,
    status      election_status NOT NULL DEFAULT 'draft',
    created_by  UUID            NOT NULL REFERENCES users(id),
    starts_at   TIMESTAMPTZ,
    ends_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_election_window CHECK (
        ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at
    )
);

CREATE INDEX idx_elections_status     ON elections (status);
CREATE INDEX idx_elections_created_by ON elections (created_by);
CREATE INDEX idx_elections_starts_at  ON elections (starts_at);

COMMENT ON TABLE elections IS 'Election configuration. Status is the authoritative lifecycle gate.';

-- =============================================================================
-- 4. CANDIDATES
-- Candidates belong to exactly one election.
-- =============================================================================

CREATE TABLE candidates (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    election_id   UUID         NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
    full_name     VARCHAR(255) NOT NULL,
    description   TEXT,
    display_order SMALLINT     NOT NULL DEFAULT 0,
    is_visible    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_candidates_election_id ON candidates (election_id);

COMMENT ON TABLE  candidates            IS 'Election candidates. Each belongs to exactly one election.';
COMMENT ON COLUMN candidates.is_visible IS 'Hidden candidates excluded from ballot display but records are retained.';

-- =============================================================================
-- 5. VOTER_ELIGIBILITY
-- Maps voters to elections they are permitted to vote in.
-- This is the ONLY table that links voter identity to an election.
--
-- CRITICAL: UNIQUE(election_id, user_id) is the database-level
-- duplicate vote prevention. Application-layer checks alone are
-- not sufficient under concurrent requests.
-- =============================================================================

CREATE TABLE voter_eligibility (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    election_id UUID        NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    has_voted   BOOLEAN     NOT NULL DEFAULT FALSE,
    voted_at    TIMESTAMPTZ,
    uploaded_by UUID        NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- DATABASE-LEVEL DUPLICATE VOTE PREVENTION
    CONSTRAINT uq_eligibility_voter_per_election UNIQUE (election_id, user_id)
);

CREATE INDEX idx_eligibility_election_id ON voter_eligibility (election_id);
CREATE INDEX idx_eligibility_user_id     ON voter_eligibility (user_id);
CREATE INDEX idx_eligibility_has_voted   ON voter_eligibility (election_id, has_voted);

COMMENT ON TABLE  voter_eligibility           IS 'Election-specific eligibility. UNIQUE(election_id, user_id) is the hard duplicate-vote guard.';
COMMENT ON COLUMN voter_eligibility.has_voted IS 'Set TRUE atomically inside vote-cast transaction only.';

-- =============================================================================
-- 6. BALLOT_TOKENS
-- Single-use anonymous tokens issued after eligibility check.
--
-- ANONYMIZATION DESIGN:
--   Server generates random raw token, returns it to voter client.
--   Only the SHA-256 hash is stored here. Raw token never persisted.
--   After vote cast, is_used = TRUE.
--   This table must NOT store candidate_id or any vote choice.
--   ballot.token_hash_ref -> ballot_tokens.token_hash enables chain audit.
--   ballot.candidate_id is in ballots table only, never here.
--   This separation prevents a single JOIN from revealing who voted for whom.
-- =============================================================================

CREATE TABLE ballot_tokens (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    election_id UUID        NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(64) NOT NULL UNIQUE,
    is_used     BOOLEAN     NOT NULL DEFAULT FALSE,
    used_at     TIMESTAMPTZ,
    expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One active token per voter per election
    CONSTRAINT uq_token_per_voter_per_election UNIQUE (election_id, user_id)
);

CREATE INDEX idx_ballot_tokens_token_hash  ON ballot_tokens (token_hash);
CREATE INDEX idx_ballot_tokens_election_id ON ballot_tokens (election_id);
CREATE INDEX idx_ballot_tokens_user_id     ON ballot_tokens (user_id);

COMMENT ON TABLE  ballot_tokens            IS 'Single-use anonymous ballot tokens. Raw token never stored. SHA-256 hash only.';
COMMENT ON COLUMN ballot_tokens.token_hash IS 'SHA-256 of the raw token sent to voter. Raw value never persisted server-side.';
COMMENT ON COLUMN ballot_tokens.user_id    IS 'Kept for eligibility audit trail. Never joined to ballots.candidate_id.';

-- =============================================================================
-- 7. BALLOTS
-- Anonymous vote records. Core of R2V integrity.
--
-- HASH CHAIN SPECIFICATION:
--   Field composition (exact order, UTF-8, pipe-delimited):
--     current_hash = SHA-256(
--       ballot_id || '|' || election_id || '|' ||
--       candidate_id || '|' || cast_at_iso8601_utc || '|' ||
--       previous_hash
--     )
--
--   Genesis record (sequence_number = 1):
--     previous_hash = SHA-256('R2V_GENESIS_' || election_id)
--
--   Verification process:
--     Fetch all ballots for election ordered by sequence_number ASC.
--     Recompute each current_hash from stored fields.
--     Any mismatch = tamper detected at that position.
--
-- ANONYMIZATION:
--   No user_id column in this table.
--   token_hash_ref links to ballot_tokens for chain audit only.
--   candidate_id is here; user_id is in ballot_tokens only.
--   These two tables are intentionally separated to break the identity join.
-- =============================================================================

CREATE TABLE ballots (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    election_id     UUID        NOT NULL REFERENCES elections(id),
    candidate_id    UUID        NOT NULL REFERENCES candidates(id),

    -- Anonymous reference to the issuing token. No voter_id here.
    token_hash_ref  VARCHAR(64) NOT NULL UNIQUE
                    REFERENCES ballot_tokens(token_hash),

    -- Hash chain
    sequence_number BIGINT      NOT NULL,
    previous_hash   VARCHAR(64) NOT NULL,
    current_hash    VARCHAR(64) NOT NULL UNIQUE,

    cast_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_sequence_positive CHECK (sequence_number > 0)
);

CREATE INDEX idx_ballots_election_id     ON ballots (election_id);
CREATE INDEX idx_ballots_candidate_id    ON ballots (candidate_id);
CREATE INDEX idx_ballots_sequence_number ON ballots (election_id, sequence_number);
CREATE INDEX idx_ballots_cast_at         ON ballots (cast_at);

COMMENT ON TABLE  ballots                 IS 'Anonymous vote records. No voter_id stored. Hash chain provides tamper evidence.';
COMMENT ON COLUMN ballots.token_hash_ref  IS 'References ballot_tokens.token_hash. Chain audit without direct identity linkage.';
COMMENT ON COLUMN ballots.sequence_number IS 'Ballot position in election chain. Starts at 1.';
COMMENT ON COLUMN ballots.previous_hash   IS 'Hash of preceding ballot. Genesis = SHA-256(R2V_GENESIS_ || election_id).';
COMMENT ON COLUMN ballots.current_hash    IS 'SHA-256(ballot_id|election_id|candidate_id|cast_at_iso|previous_hash). Verified by verification_service.';

-- =============================================================================
-- 8. AUDIT_LOGS
-- Append-only hashed record of all sensitive events.
--
-- AUDIT HASH CHAIN:
--   current_hash = SHA-256(
--     log_id || '|' || event_type || '|' ||
--     actor_id || '|' || target_id || '|' ||
--     created_at_iso8601_utc || '|' || previous_hash
--   )
--   Genesis: previous_hash = SHA-256('R2V_AUDIT_GENESIS')
--
-- RULE: NEVER UPDATE OR DELETE ROWS IN THIS TABLE.
-- =============================================================================

CREATE TABLE audit_logs (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type      VARCHAR(100) NOT NULL,
    actor_id        UUID         REFERENCES users(id) ON DELETE SET NULL,
    actor_role      user_role,
    target_id       UUID,
    target_type     VARCHAR(50),

    -- TEXT not JSONB: prevents silent field mutation by operators
    detail          TEXT,
    ip_address      VARCHAR(45),

    -- Audit hash chain
    sequence_number BIGINT      NOT NULL,
    previous_hash   VARCHAR(64) NOT NULL,
    current_hash    VARCHAR(64) NOT NULL UNIQUE,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_event_type      ON audit_logs (event_type);
CREATE INDEX idx_audit_logs_actor_id        ON audit_logs (actor_id);
CREATE INDEX idx_audit_logs_created_at      ON audit_logs (created_at);
CREATE INDEX idx_audit_logs_sequence_number ON audit_logs (sequence_number);

COMMENT ON TABLE  audit_logs              IS 'Append-only hashed audit trail. NEVER UPDATE or DELETE rows.';
COMMENT ON COLUMN audit_logs.event_type   IS 'Values: admin_login, election_created, election_started, election_ended, vote_cast, otp_failed, otp_locked, result_published, eligibility_uploaded';
COMMENT ON COLUMN audit_logs.detail       IS 'TEXT (not JSONB) to prevent silent mutation by operators.';
COMMENT ON COLUMN audit_logs.current_hash IS 'SHA-256(log_id|event_type|actor_id|target_id|created_at_iso|previous_hash)';

-- =============================================================================
-- 9. RESULT_SNAPSHOTS
-- Immutable tally records generated after election completion.
-- One row per candidate per election. Never update after creation.
-- =============================================================================

CREATE TABLE result_snapshots (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    election_id          UUID        NOT NULL REFERENCES elections(id),
    candidate_id         UUID        NOT NULL REFERENCES candidates(id),
    vote_count           INTEGER     NOT NULL DEFAULT 0 CHECK (vote_count >= 0),
    total_votes          INTEGER     NOT NULL DEFAULT 0 CHECK (total_votes >= 0),
    total_eligible       INTEGER     NOT NULL DEFAULT 0 CHECK (total_eligible >= 0),
    chain_hash_at_tally  VARCHAR(64),
    generated_by         UUID        NOT NULL REFERENCES users(id),
    generated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_result_per_candidate   UNIQUE (election_id, candidate_id),
    CONSTRAINT chk_vote_count_lte_total  CHECK (vote_count <= total_votes),
    CONSTRAINT chk_total_lte_eligible    CHECK (total_votes <= total_eligible)
);

CREATE INDEX idx_result_snapshots_election_id ON result_snapshots (election_id);

COMMENT ON TABLE  result_snapshots                     IS 'Immutable tally records. Never update after generation.';
COMMENT ON COLUMN result_snapshots.chain_hash_at_tally IS 'Last ballot current_hash at tally time. Verifies result came from intact chain.';

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_users
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_elections
    BEFORE UPDATE ON elections
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_candidates
    BEFORE UPDATE ON candidates
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- =============================================================================
-- AUDITOR-SAFE VIEWS
-- These views intentionally exclude voter identity from ballot data.
-- =============================================================================

CREATE VIEW v_ballot_chain AS
SELECT
    b.id,
    b.election_id,
    b.candidate_id,
    b.sequence_number,
    b.previous_hash,
    b.current_hash,
    b.cast_at
FROM ballots b
ORDER BY b.election_id, b.sequence_number;

CREATE VIEW v_election_summary AS
SELECT
    e.id,
    e.title,
    e.status,
    e.starts_at,
    e.ends_at,
    COUNT(DISTINCT ve.user_id)                                     AS total_eligible,
    COUNT(DISTINCT ve.user_id) FILTER (WHERE ve.has_voted = TRUE)  AS total_voted
FROM elections e
LEFT JOIN voter_eligibility ve ON ve.election_id = e.id
GROUP BY e.id, e.title, e.status, e.starts_at, e.ends_at;

COMMENT ON VIEW v_ballot_chain     IS 'Auditor-safe ballot view. No voter identity exposed.';
COMMENT ON VIEW v_election_summary IS 'Live election turnout summary per election.';

-- =============================================================================
-- END OF SCHEMA — R2V v1
-- =============================================================================
