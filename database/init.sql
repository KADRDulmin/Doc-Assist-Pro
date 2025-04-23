-- Create database if it doesn't exist (with better error handling)
SELECT 'CREATE DATABASE doc_assist WITH OWNER postgres'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'doc_assist')\gexec

-- Connect to the database
\c doc_assist;

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create users table with additional fields - using snake_case naming convention
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),       -- snake_case naming convention
    last_name VARCHAR(100),        -- snake_case naming convention
    role VARCHAR(50) NOT NULL DEFAULT 'patient',
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Check for camelCase column names and migrate if needed (firstname -> first_name)
DO $$
BEGIN
    -- Check if 'firstname' column exists but 'first_name' doesn't
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'firstname'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'first_name'
    ) THEN
        -- Add snake_case columns
        ALTER TABLE users ADD COLUMN first_name VARCHAR(100);
        ALTER TABLE users ADD COLUMN last_name VARCHAR(100);
        
        -- Copy data from camelCase to snake_case columns
        UPDATE users SET first_name = firstname, last_name = lastname;
        
        RAISE NOTICE 'Migrated from camelCase to snake_case column names';
    END IF;

    -- Check if both 'first_name' and 'lastname' don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name IN ('first_name', 'firstname')
    ) THEN
        -- Add the columns if they don't exist at all
        ALTER TABLE users ADD COLUMN first_name VARCHAR(100);
        ALTER TABLE users ADD COLUMN last_name VARCHAR(100);
        
        RAISE NOTICE 'Added missing name columns to users table';
    END IF;
END $$;

-- Create doctor profiles table
CREATE TABLE IF NOT EXISTS doctor_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    specialization VARCHAR(100) NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    years_of_experience INTEGER DEFAULT 0,
    education TEXT,
    bio TEXT,
    consultation_fee DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create patient profiles table
CREATE TABLE IF NOT EXISTS patient_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    date_of_birth DATE,
    gender VARCHAR(20),
    blood_group VARCHAR(10),
    allergies TEXT,
    medical_history TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (name, description) 
VALUES 
    ('admin', 'System Administrator'),
    ('doctor', 'Medical Doctor'),
    ('patient', 'Patient User')
ON CONFLICT (name) DO NOTHING;

-- Create test user (password: test123) - using bcryptjs format
INSERT INTO users (email, password_hash, first_name, last_name, role) 
VALUES 
    ('admin@example.com', '$2a$10$3euPcmQFCiblsZeEu5s7p.9MUZWj3bcJzuLFJBs9QVdYj.RRVCICK', 'Admin', 'User', 'admin'),
    ('doctor@example.com', '$2a$10$3euPcmQFCiblsZeEu5s7p.9MUZWj3bcJzuLFJBs9QVdYj.RRVCICK', 'Doctor', 'User', 'doctor'),
    ('patient@example.com', '$2a$10$3euPcmQFCiblsZeEu5s7p.9MUZWj3bcJzuLFJBs9QVdYj.RRVCICK', 'Patient', 'User', 'patient')
ON CONFLICT (email) DO NOTHING;

-- Add test doctor profile
INSERT INTO doctor_profiles (user_id, specialization, license_number)
SELECT u.id, 'Cardiology', 'DOC-12345'
FROM users u
WHERE u.email = 'doctor@example.com'
AND NOT EXISTS (SELECT 1 FROM doctor_profiles dp WHERE dp.user_id = u.id);

-- Add test patient profile
INSERT INTO patient_profiles (user_id, gender, blood_group)
SELECT u.id, 'Male', 'O+'
FROM users u
WHERE u.email = 'patient@example.com'
AND NOT EXISTS (SELECT 1 FROM patient_profiles pp WHERE pp.user_id = u.id);