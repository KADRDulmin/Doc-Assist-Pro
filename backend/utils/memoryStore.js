/**
 * In-memory data store for fallback when database is unavailable
 * This is not persistent and resets when the server restarts
 */

const memoryStore = {
    // Last ID used for any entity
    lastId: 3,
    
    // Users collection
    users: [
        {
            id: 1,
            email: 'admin@example.com',
            password_hash: '$2a$10$3euPcmQFCiblsZeEu5s7p.9MUZWj3bcJzuLFJBs9QVdYj.RRVCICK',  // test123
            first_name: 'Admin',
            last_name: 'User',
            role: 'admin',
            phone: '',
            is_active: true,
            is_verified: true,
            created_at: new Date(),
            updated_at: new Date()
        },
        {
            id: 2,
            email: 'doctor@example.com',
            password_hash: '$2a$10$3euPcmQFCiblsZeEu5s7p.9MUZWj3bcJzuLFJBs9QVdYj.RRVCICK',  // test123
            first_name: 'Doctor',
            last_name: 'User',
            role: 'doctor',
            phone: '',
            is_active: true,
            is_verified: true,
            created_at: new Date(),
            updated_at: new Date()
        },
        {
            id: 3,
            email: 'patient@example.com',
            password_hash: '$2a$10$3euPcmQFCiblsZeEu5s7p.9MUZWj3bcJzuLFJBs9QVdYj.RRVCICK',  // test123
            first_name: 'Patient',
            last_name: 'User',
            role: 'patient',
            phone: '',
            is_active: true,
            is_verified: true,
            created_at: new Date(),
            updated_at: new Date()
        }
    ],
    
    // Doctor profiles collection
    doctorProfiles: [
        {
            id: 1,
            user_id: 2,
            specialization: 'Cardiology',
            license_number: 'DOC-12345',
            years_of_experience: 5,
            education: 'MD from Medical University',
            bio: 'Experienced cardiologist',
            consultation_fee: 100.00,
            created_at: new Date(),
            updated_at: new Date()
        }
    ],
    
    // Patient profiles collection
    patientProfiles: [
        {
            id: 1,
            user_id: 3,
            date_of_birth: new Date('1990-01-01'),
            gender: 'Male',
            blood_group: 'O+',
            allergies: '',
            medical_history: '',
            emergency_contact_name: '',
            emergency_contact_phone: '',
            created_at: new Date(),
            updated_at: new Date()
        }
    ]
};

module.exports = memoryStore;
