export const mockFeedbackData = [
  {
    id: 1,
    doctorId: 101,
    doctorName: "Dr. John Smith",
    specialty: "Cardiologist",
    appointmentDate: "2025-05-01",
    rating: 5,
    comment: "Excellent doctor, very thorough and explained everything clearly.",
    date: "2025-05-02",
    imageUrl: null
  },
  {
    id: 2,
    doctorId: 102,
    doctorName: "Dr. Sarah Johnson",
    specialty: "Dermatologist",
    appointmentDate: "2025-04-15",
    rating: 4,
    comment: "Professional and knowledgeable. Wait time was a bit long.",
    date: "2025-04-16",
    imageUrl: null
  }
];

export const mockPendingFeedback = [
  {
    id: 3,
    doctorId: 103,
    doctorName: "Dr. Robert Lee",
    specialty: "Neurologist",
    appointmentDate: "2025-05-10",
    appointmentType: "Follow-up",
    imageUrl: null
  }
];

export default {
  getMyFeedback: jest.fn().mockResolvedValue({
    success: true,
    data: mockFeedbackData
  }),
  getPendingFeedback: jest.fn().mockResolvedValue({
    success: true,
    data: mockPendingFeedback
  }),
  submitFeedback: jest.fn().mockImplementation((newFeedback) => {
    return Promise.resolve({
      success: true,
      data: {
        id: 4,
        ...newFeedback,
        date: new Date().toISOString().split('T')[0]
      }
    });
  }),
  updateFeedback: jest.fn().mockImplementation((id, updatedFeedback) => {
    return Promise.resolve({
      success: true,
      data: {
        id,
        ...updatedFeedback,
        date: new Date().toISOString().split('T')[0]
      }
    });
  }),
  deleteFeedback: jest.fn().mockResolvedValue({
    success: true
  })
};
