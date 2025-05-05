import { User } from './user';

export interface Doctor extends User {
  doctorId: string;
  specialization: string;
  licenseNumber: string;
  education: string[];
  experience: number; // years of experience
  hospital?: string;
  clinicAddress?: string;
  consultationFee?: number;
  availableDays?: string[];
  verificationStatus: 'pending' | 'verified' | 'rejected';
  ratings?: number;
  reviewCount?: number;
  languages?: string[];
}
