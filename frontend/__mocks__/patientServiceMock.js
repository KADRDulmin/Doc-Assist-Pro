// Mock for patient service
export const mockAppointmentData = [
  {
    id: 1,
    doctor_id: 101,
    doctor_name: "Dr. John Smith",
    doctor_specialty: "Cardiologist",
    appointment_date: "2025-06-01",
    appointment_time: "10:00 AM",
    appointment_type: "Regular Checkup",
    status: "upcoming",
    location: "Central Hospital, Room 203",
    notes: "Follow-up on previous visit"
  },
  {
    id: 2,
    doctor_id: 102,
    doctor_name: "Dr. Sarah Johnson",
    doctor_specialty: "Dermatologist",
    appointment_date: "2025-05-15",
    appointment_time: "2:30 PM",
    appointment_type: "Skin Consultation",
    status: "completed",
    location: "Medical Center, Wing B",
    notes: "Skin rash examination"
  },
  {
    id: 3,
    doctor_id: 103,
    doctor_name: "Dr. Robert Lee",
    doctor_specialty: "Neurologist",
    appointment_date: "2025-05-10",
    appointment_time: "9:15 AM",
    appointment_type: "Follow-up",
    status: "missed",
    location: "Neurology Clinic",
    notes: "Headache evaluation"
  }
];

export const mockPatientProfile = {
  id: 1,
  user_id: 5,
  user: {
    id: 5,
    first_name: "Jane",
    last_name: "Doe",
    email: "jane.doe@example.com",
    phone: "555-123-4567"
  },
  date_of_birth: "1990-05-15",
  gender: "female",
  blood_group: "O+",
  allergies: "Penicillin",
  medical_history: "Previous appendectomy in 2018",
  preferred_language: "English",
  emergency_contact_name: "John Doe",
  emergency_contact_phone: "555-987-6543",
  emergency_contact_relationship: "Spouse",
  address: "123 Main St, Anytown",
  location: {
    latitude: 6.9271,
    longitude: 79.8612
  },
  height: 165,
  weight: 60,
  bmi: 22.0,
  created_at: "2023-01-15",
  updated_at: "2023-04-20"
};

export const mockDashboardData = {
  profile: {
    name: "Jane Doe",
    age: 33,
    nextAppointment: "2025-06-01"
  },
  upcomingAppointments: [mockAppointmentData[0]],
  stats: {
    activePrescriptions: 2,
    lastCheckupDate: "2025-04-15"
  },
  recentDoctors: [
    {
      id: 101,
      name: "Dr. John Smith",
      specialty: "Cardiologist",
      image: null,
      rating: 4.8
    },
    {
      id: 102,
      name: "Dr. Sarah Johnson",
      specialty: "Dermatologist",
      image: null,
      rating: 4.9
    }
  ]
};

export default {
  getMyProfile: jest.fn().mockResolvedValue({
    success: true,
    data: mockPatientProfile
  }),
  getDashboardData: jest.fn().mockResolvedValue({
    success: true,
    data: mockDashboardData
  }),
  updateProfile: jest.fn().mockResolvedValue({
    success: true,
    data: mockPatientProfile
  }),
  updateLocation: jest.fn().mockResolvedValue({
    success: true
  })
};
