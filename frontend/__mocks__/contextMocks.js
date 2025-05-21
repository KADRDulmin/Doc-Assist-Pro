// Mock for Auth Context
export const mockUser = {
  id: 1,
  first_name: 'Jane',
  last_name: 'Doe',
  email: 'jane.doe@example.com',
  role: 'patient'
};

export const mockAuthContext = {
  user: mockUser,
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  verifyEmail: jest.fn(),
  loading: false,
  error: null
};
