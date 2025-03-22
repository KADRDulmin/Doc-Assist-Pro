-- Create database if it doesn't exist (with better error handling)
SELECT 'CREATE DATABASE doc_assist WITH OWNER postgres'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'doc_assist')\gexec

-- Connect to the database
\c doc_assist;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create test user (password: test123) - using bcryptjs format
INSERT INTO users (email, password_hash) 
VALUES ('test@example.com', '$2a$10$3euPcmQFCiblsZeEu5s7p.9MUZWj3bcJzuLFJBs9QVdYj.RRVCICK')
ON CONFLICT (email) DO NOTHING;