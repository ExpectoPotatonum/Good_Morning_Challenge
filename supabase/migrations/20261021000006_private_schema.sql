-- Internal helper schema.
-- NOTE: `private` is now also created in 20261021000000_init_schema.sql because
-- 20261021000003_rpc_check_in.sql and 20261021000005_grants.sql depend on it.
-- This file stays as an idempotent safety net for databases that applied the
-- older ordering (where the schema was created after its first use).
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO postgres;
