-- Drop the old check constraint that doesn't include COUNSELLOR
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Recreate it with all four roles including COUNSELLOR
ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('STUDENT', 'INSTITUTE', 'VERIFIER', 'COUNSELLOR'));

