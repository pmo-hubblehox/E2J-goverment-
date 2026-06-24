-- Run this once to create the database and user
-- Connect as postgres superuser and run:

CREATE DATABASE e2j_db;
CREATE USER e2j_user WITH PASSWORD 'e2j_pass_2025';
GRANT ALL PRIVILEGES ON DATABASE e2j_db TO e2j_user;
\c e2j_db
GRANT ALL ON SCHEMA public TO e2j_user;

-- The tables will be auto-created by Spring Boot (ddl-auto: update)
-- No manual table creation needed
