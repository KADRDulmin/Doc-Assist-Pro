export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: 'admin' | 'doctor' | 'patient';
  status: 'active' | 'inactive' | 'suspended';
  profileImage?: string;
  createdAt: Date;
  lastLogin?: Date;
  phone?: string;
  address?: string;
}
