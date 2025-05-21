import { mockAppointmentData } from './patientServiceMock';

export default {
  getMyAppointments: jest.fn().mockResolvedValue({
    success: true,
    data: mockAppointmentData
  }),
  getAppointmentDetails: jest.fn().mockImplementation((id) => {
    const appointment = mockAppointmentData.find(a => a.id === id);
    return Promise.resolve({
      success: !!appointment,
      data: appointment || null,
      message: appointment ? null : 'Appointment not found'
    });
  }),
  scheduleAppointment: jest.fn().mockResolvedValue({
    success: true,
    data: {
      id: 4,
      doctor_id: 104,
      doctor_name: "Dr. New Doctor",
      doctor_specialty: "General Physician",
      appointment_date: "2025-06-10",
      appointment_time: "11:30 AM",
      appointment_type: "New Consultation",
      status: "upcoming",
      location: "Health Center",
      notes: "Initial consultation"
    }
  }),
  cancelAppointment: jest.fn().mockResolvedValue({
    success: true
  }),
  rescheduleAppointment: jest.fn().mockResolvedValue({
    success: true,
    data: {
      ...mockAppointmentData[0],
      appointment_date: "2025-06-15",
      appointment_time: "1:00 PM"
    }
  })
};
