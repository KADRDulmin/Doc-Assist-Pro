/**
 * Database initialization script
 * Checks if required tables exist and creates them if needed
 */
const { pool } = require('../config/database');

/**
 * Initialize database schema and test data
 */
const initializeDatabase = async () => {
    let client;
    try {
        client = await pool.connect();
        console.log('Connected to database for initialization...');
        
        // Check if the repair-schema utility exists and run it first
        try {
            const { repairSchema } = require('../scripts/repair-schema');
            await repairSchema();
        } catch (repairError) {
            console.warn('Could not run schema repair:', repairError.message);
        }
        
        // Check if roles table exists
        const rolesTableExists = await client.query(
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'roles')"
        );
        
        if (!rolesTableExists.rows[0].exists) {
            console.log('Roles table does not exist, creating it...');
            
            // Create roles table
            await client.query(`
                CREATE TABLE roles (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(50) UNIQUE NOT NULL,
                    description VARCHAR(255),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Insert default roles
            await client.query(`
                INSERT INTO roles (name, description) 
                VALUES 
                    ('admin', 'System Administrator'),
                    ('doctor', 'Medical Doctor'),
                    ('patient', 'Patient User')
            `);
            
            console.log('✅ Roles table created and populated successfully!');
        }
        
        // Check if users table exists
        const usersTableExists = await client.query(
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')"
        );
        
        if (!usersTableExists.rows[0].exists) {
            console.log('Users table does not exist, creating it...');
            
            // Create users table with role column
            await client.query(`
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    first_name VARCHAR(100),
                    last_name VARCHAR(100),
                    role VARCHAR(50) NOT NULL DEFAULT 'patient',
                    phone VARCHAR(50),
                    is_active BOOLEAN DEFAULT TRUE,
                    is_verified BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Create index for email lookups
            await client.query(`
                CREATE INDEX idx_users_email ON users(email)
            `);
            
            // Create index for role lookups
            await client.query(`
                CREATE INDEX idx_users_role ON users(role)
            `);
            
            console.log('✅ Users table created successfully!');
            
            // Add test users
            try {
                await client.query(`
                    INSERT INTO users (email, password_hash, first_name, last_name, role) 
                    VALUES 
                        ('admin@example.com', '$2a$10$3euPcmQFCiblsZeEu5s7p.9MUZWj3bcJzuLFJBs9QVdYj.RRVCICK', 'Admin', 'User', 'admin'),
                        ('doctor@example.com', '$2a$10$3euPcmQFCiblsZeEu5s7p.9MUZWj3bcJzuLFJBs9QVdYj.RRVCICK', 'Doctor', 'User', 'doctor'),
                        ('patient@example.com', '$2a$10$3euPcmQFCiblsZeEu5s7p.9MUZWj3bcJzuLFJBs9QVdYj.RRVCICK', 'Patient', 'User', 'patient')
                `);
                console.log('✅ Test users created. Password for all users: test123');
            } catch (userErr) {
                console.error('Error creating test users:', userErr.message);
            }
        } else {
            console.log('✅ Users table already exists');
        }
        
        // Check if doctor_profiles table exists
        const doctorProfilesTableExists = await client.query(
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'doctor_profiles')"
        );
        
        if (!doctorProfilesTableExists.rows[0].exists) {
            console.log('Doctor profiles table does not exist, creating it...');
            
            // Create doctor_profiles table
            await client.query(`
                CREATE TABLE doctor_profiles (
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
                )
            `);
            
            console.log('✅ Doctor profiles table created successfully!');
            
            // Add test doctor profile
            try {
                await client.query(`
                    INSERT INTO doctor_profiles (user_id, specialization, license_number)
                    SELECT id, 'Cardiology', 'DOC-12345'
                    FROM users
                    WHERE email = 'doctor@example.com'
                `);
                console.log('✅ Test doctor profile created');
            } catch (docErr) {
                console.error('Error creating test doctor profile:', docErr.message);
            }
        }
        
        // Check if patient_profiles table exists
        const patientProfilesTableExists = await client.query(
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'patient_profiles')"
        );
        
        if (!patientProfilesTableExists.rows[0].exists) {
            console.log('Patient profiles table does not exist, creating it...');
            
            // Create patient_profiles table
            await client.query(`
                CREATE TABLE patient_profiles (
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
                )
            `);
            
            console.log('✅ Patient profiles table created successfully!');
            
            // Add test patient profile
            try {
                await client.query(`
                    INSERT INTO patient_profiles (user_id, gender, blood_group)
                    SELECT id, 'Male', 'O+'
                    FROM users
                    WHERE email = 'patient@example.com'
                `);
                console.log('✅ Test patient profile created');
            } catch (patientErr) {
                console.error('Error creating test patient profile:', patientErr.message);
            }
        }
        
        // Check if appointments table exists
        const appointmentsTableExists = await client.query(
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'appointments')"
        );
        
        if (!appointmentsTableExists.rows[0].exists) {
            console.log('Appointments table does not exist, creating it...');
            
            // Create appointments table with symptom analysis fields
            await client.query(`
                CREATE TABLE appointments (
                    id SERIAL PRIMARY KEY,
                    patient_id INTEGER NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
                    doctor_id INTEGER NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
                    appointment_date DATE NOT NULL,
                    appointment_time VARCHAR(10) NOT NULL,
                    status VARCHAR(20) NOT NULL DEFAULT 'upcoming',
                    appointment_type VARCHAR(50) NOT NULL DEFAULT 'general',
                    notes TEXT,
                    location VARCHAR(255),
                    parent_appointment_id INTEGER REFERENCES appointments(id),
                    symptoms TEXT,
                    possible_illness_1 VARCHAR(255),
                    possible_illness_2 VARCHAR(255),
                    recommended_doctor_1 VARCHAR(255),
                    recommended_doctor_2 VARCHAR(255),
                    criticality_level VARCHAR(20),
                    symptom_analysis_json JSONB,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Create indexes
            await client.query(`
                CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
                CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
                CREATE INDEX idx_appointments_date ON appointments(appointment_date);
                CREATE INDEX idx_appointments_status ON appointments(status);
            `);
            
            console.log('✅ Appointments table created successfully!');
        } else {
            // Check if the symptom analysis columns exist, and add them if they don't
            try {
                const columnCheck = await client.query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'appointments' AND column_name = 'symptoms'
                `);
                
                if (columnCheck.rows.length === 0) {
                    console.log('Adding symptom analysis columns to appointments table...');
                    await client.query(`
                        ALTER TABLE appointments
                        ADD COLUMN symptoms TEXT,
                        ADD COLUMN possible_illness_1 VARCHAR(255),
                        ADD COLUMN possible_illness_2 VARCHAR(255),
                        ADD COLUMN recommended_doctor_1 VARCHAR(255),
                        ADD COLUMN recommended_doctor_2 VARCHAR(255),
                        ADD COLUMN criticality_level VARCHAR(20),
                        ADD COLUMN symptom_analysis_json JSONB
                    `);
                    console.log('✅ Symptom analysis columns added successfully!');
                } else {
                    console.log('✅ Symptom analysis columns already exist');
                }
            } catch (alterErr) {
                console.error('Error updating appointments table:', alterErr.message);
            }
        }
        
        console.log('✅ Database initialization complete');
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
    } finally {
        if (client) client.release();
    }
};

// Export for use in app.js
module.exports = { initializeDatabase };

// Run directly if this script is executed on its own
if (require.main === module) {
    initializeDatabase()
        .then(() => {
            console.log('Initialization script finished');
            process.exit(0);
        })
        .catch(err => {
            console.error('Initialization script failed:', err);
            process.exit(1);
        });
}
