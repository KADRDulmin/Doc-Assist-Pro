import { Doctor } from './doctor';

export interface DoctorVerification {
  id: string;
  doctor: Doctor;
  submittedDate: Date;
  documents: {
    type: 'license' | 'degree' | 'certification' | 'identity';
    url: string;
    verificationStatus: 'pending' | 'verified' | 'rejected';
    description?: string;
  }[];
  notes?: string;
  reviewDate?: Date;
  reviewedBy?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  processedDate?: Date;
  processedBy?: string;
}
