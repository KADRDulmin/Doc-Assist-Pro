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
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address TEXT,
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
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patient_profiles(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES doctor_profiles(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'upcoming',
    appointment_type VARCHAR(50),
    notes TEXT,
    location VARCHAR(255),
    symptoms TEXT,
    possible_illness_1 VARCHAR(100),
    possible_illness_2 VARCHAR(100),
    recommended_doctor_speciality_1 VARCHAR(100),
    recommended_doctor_speciality_2 VARCHAR(100),
    criticality VARCHAR(20), -- Low, Medium, High, Emergency
    parent_appointment_id INTEGER REFERENCES appointments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add comments to explain the new columns
COMMENT ON COLUMN appointments.symptoms IS 'Patient-reported symptoms';
COMMENT ON COLUMN appointments.possible_illness_1 IS 'First possible illness suggested by the system';
COMMENT ON COLUMN appointments.possible_illness_2 IS 'Second possible illness suggested by the system';
COMMENT ON COLUMN appointments.recommended_doctor_speciality_1 IS 'First recommended doctor speciality';
COMMENT ON COLUMN appointments.recommended_doctor_speciality_2 IS 'Second recommended doctor speciality';
COMMENT ON COLUMN appointments.criticality IS 'Severity level of the condition: Low, Medium, High, or Emergency';

-- Add indexes for appointments
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Create consultations table for doctor consultations
CREATE TABLE IF NOT EXISTS consultations (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES doctor_profiles(id),
    patient_id INTEGER NOT NULL REFERENCES patient_profiles(id),
    status VARCHAR(20) DEFAULT 'in_progress', -- in_progress, completed, missed
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for consultations
CREATE INDEX IF NOT EXISTS idx_consultations_appointment_id ON consultations(appointment_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor_id ON consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);

-- Create medical_records table for patient medical records
CREATE TABLE IF NOT EXISTS medical_records (
    id SERIAL PRIMARY KEY,
    consultation_id INTEGER NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    patient_id INTEGER NOT NULL REFERENCES patient_profiles(id),
    doctor_id INTEGER NOT NULL REFERENCES doctor_profiles(id),
    record_date DATE NOT NULL,
    diagnosis TEXT NOT NULL,
    diagnosis_image_url TEXT,
    treatment_plan TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for medical_records
CREATE INDEX IF NOT EXISTS idx_medical_records_consultation_id ON medical_records(consultation_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_id ON medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_record_date ON medical_records(record_date);

-- Create prescriptions table for patient prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
    id SERIAL PRIMARY KEY,
    consultation_id INTEGER NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    patient_id INTEGER NOT NULL REFERENCES patient_profiles(id),
    doctor_id INTEGER NOT NULL REFERENCES doctor_profiles(id),
    prescription_date DATE NOT NULL,
    prescription_text TEXT,
    prescription_image_url TEXT,
    status VARCHAR(20) DEFAULT 'active', -- active, completed, cancelled
    duration_days INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for prescriptions
CREATE INDEX IF NOT EXISTS idx_prescriptions_consultation_id ON prescriptions(consultation_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_prescription_date ON prescriptions(prescription_date);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for feedback
CREATE INDEX IF NOT EXISTS idx_feedback_patient ON feedback(patient_id);
CREATE INDEX IF NOT EXISTS idx_feedback_doctor ON feedback(doctor_id);
CREATE INDEX IF NOT EXISTS idx_feedback_appointment ON feedback(appointment_id);

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

-- Add test appointment
INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, status, appointment_type, notes, location)
SELECT pp.id, dp.id, (CURRENT_DATE + INTERVAL '1 day')::date, '10:00:00', 'upcoming', 'general', 'Initial consultation', 'Central Hospital, Room 305'
FROM patient_profiles pp
JOIN doctor_profiles dp ON true
JOIN users u1 ON pp.user_id = u1.id AND u1.email = 'patient@example.com'
JOIN users u2 ON dp.user_id = u2.id AND u2.email = 'doctor@example.com'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Add test completed appointment for feedback
INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, status, appointment_type, notes, location)
SELECT pp.id, dp.id, (CURRENT_DATE - INTERVAL '5 day')::date, '14:30:00', 'completed', 'check-up', 'Follow-up checkup', 'Medical Center'
FROM patient_profiles pp
JOIN doctor_profiles dp ON true
JOIN users u1 ON pp.user_id = u1.id AND u1.email = 'patient@example.com'
JOIN users u2 ON dp.user_id = u2.id AND u2.email = 'doctor@example.com'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Add test feedback
INSERT INTO feedback (patient_id, doctor_id, appointment_id, rating, comment)
SELECT pp.id, dp.id, a.id, 5, 'Dr. User was very professional and thorough. Excellent care!'
FROM patient_profiles pp
JOIN doctor_profiles dp ON true
JOIN appointments a ON a.patient_id = pp.id AND a.doctor_id = dp.id AND a.status = 'completed'
JOIN users u1 ON pp.user_id = u1.id AND u1.email = 'patient@example.com'
JOIN users u2 ON dp.user_id = u2.id AND u2.email = 'doctor@example.com'
LIMIT 1
ON CONFLICT DO NOTHING;