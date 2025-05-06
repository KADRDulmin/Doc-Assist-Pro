import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { DoctorVerification } from '../models/doctor-verification';
import { Doctor } from '../models/doctor';
import { DoctorService } from './doctor.service';

@Injectable({
  providedIn: 'root'
})
export class DoctorVerificationService {
  // Mock verification requests data
  private mockVerifications: DoctorVerification[] = [
    {
      id: 'VR001',
      doctor: {
        id: '9',
        doctorId: 'DOC005',
        email: 'doctor5@newapplicant.com',
        username: 'doctor5',
        fullName: 'Dr. David Perera',
        role: 'doctor',
        status: 'inactive',
        createdAt: new Date('2025-04-20'),
        phone: '+94712345678',
        specialization: 'Orthopedics',
        licenseNumber: 'SL-MED-7890',
        education: ['MBBS - University of Colombo', 'MS Orthopedics - All India Institute of Medical Sciences'],
        experience: 6,
        hospital: 'Lanka Hospitals',
        verificationStatus: 'pending',
        languages: ['English', 'Sinhala']
      },
      submittedDate: new Date('2025-04-22'),
      documents: [
        {
          type: 'license',
          url: 'assets/mock-documents/license-doc5.pdf',
          verificationStatus: 'pending'
        },
        {
          type: 'degree',
          url: 'assets/mock-documents/degree-doc5.pdf',
          verificationStatus: 'pending'
        },
        {
          type: 'certification',
          url: 'assets/mock-documents/cert-doc5.pdf',
          verificationStatus: 'pending'
        },
        {
          type: 'identity',
          url: 'assets/mock-documents/id-doc5.jpg',
          verificationStatus: 'pending'
        }
      ],
      status: 'pending'
    },
    {
      id: 'VR002',
      doctor: {
        id: '10',
        doctorId: 'DOC006',
        email: 'doctor6@newdoc.com',
        username: 'doctor6',
        fullName: 'Dr. Aisha Kumari',
        role: 'doctor',
        status: 'inactive',
        createdAt: new Date('2025-04-15'),
        phone: '+94778889999',
        specialization: 'Gynecology',
        licenseNumber: 'SL-MED-6543',
        education: ['MBBS - University of Sri Jayewardenepura', 'MD Gynecology - University of Colombo'],
        experience: 7,
        hospital: 'Durdans Hospital',
        verificationStatus: 'pending',
        languages: ['English', 'Sinhala', 'Tamil']
      },
      submittedDate: new Date('2025-04-18'),
      documents: [
        {
          type: 'license',
          url: 'assets/mock-documents/license-doc6.pdf',
          verificationStatus: 'pending'
        },
        {
          type: 'degree',
          url: 'assets/mock-documents/degree-doc6.pdf',
          verificationStatus: 'pending'
        },
        {
          type: 'identity',
          url: 'assets/mock-documents/id-doc6.jpg',
          verificationStatus: 'pending'
        }
      ],
      status: 'pending'
    },
    {
      id: 'VR003',
      doctor: {
        id: '7',
        doctorId: 'DOC003',
        email: 'doctor3@clinic.com',
        username: 'doctor3',
        fullName: 'Dr. Robert Chen',
        role: 'doctor',
        status: 'suspended',
        createdAt: new Date('2023-06-25'),
        lastLogin: new Date('2024-11-15'),
        specialization: 'Dermatology',
        licenseNumber: 'SL-MED-9012',
        education: ['MBBS - University of Kelaniya', 'MD Dermatology - Singapore National University'],
        experience: 5,
        hospital: 'Private Practice',
        clinicAddress: 'Chen Skin Clinic, Colombo 07',
        consultationFee: 3000,
        availableDays: ['Monday', 'Friday'],
        verificationStatus: 'rejected',
        ratings: 3.2,
        reviewCount: 28,
        languages: ['English', 'Mandarin', 'Sinhala']
      },
      submittedDate: new Date('2024-06-28'),
      documents: [
        {
          type: 'license',
          url: 'assets/mock-documents/license-doc3.pdf',
          verificationStatus: 'rejected'
        },
        {
          type: 'degree',
          url: 'assets/mock-documents/degree-doc3.pdf',
          verificationStatus: 'rejected'
        },
        {
          type: 'certification',
          url: 'assets/mock-documents/cert-doc3.pdf',
          verificationStatus: 'pending'
        }
      ],
      reviewDate: new Date('2024-07-10'),
      reviewedBy: 'Admin User',
      status: 'rejected',
      rejectionReason: 'License verification failed. Degree certificate appears to be altered.'
    }
  ];

  constructor(private doctorService: DoctorService) { }

  getVerificationRequests(): Observable<DoctorVerification[]> {
    return of(this.mockVerifications).pipe(delay(500));
  }

  getVerificationById(id: string): Observable<DoctorVerification | undefined> {
    const verification = this.mockVerifications.find(v => v.id === id);
    return of(verification).pipe(delay(300));
  }

  getPendingVerifications(): Observable<DoctorVerification[]> {
    const pendingVerifications = this.mockVerifications.filter(v => v.status === 'pending');
    return of(pendingVerifications).pipe(delay(500));
  }

  approveVerification(id: string, reviewedBy: string): Observable<DoctorVerification> {
    const index = this.mockVerifications.findIndex(v => v.id === id);
    if (index !== -1) {
      // Update verification status
      this.mockVerifications[index] = {
        ...this.mockVerifications[index],
        status: 'approved',
        reviewDate: new Date(),
        reviewedBy: reviewedBy,
        documents: this.mockVerifications[index].documents.map(doc => ({
          ...doc,
          verificationStatus: 'verified'
        }))
      };
      
      // Update the doctor's verification status
      const doctorId = this.mockVerifications[index].doctor.id;
      this.doctorService.getDoctorById(doctorId).subscribe(doctor => {
        if (doctor) {
          doctor.verificationStatus = 'verified';
          doctor.status = 'active';
          this.doctorService.updateDoctor(doctor).subscribe();
        }
      });
      
      return of(this.mockVerifications[index]).pipe(delay(500));
    }
    
    return of(this.mockVerifications[0]).pipe(delay(500)); // Return first item as fallback
  }

  rejectVerification(id: string, rejectionReason: string, reviewedBy: string): Observable<DoctorVerification> {
    const index = this.mockVerifications.findIndex(v => v.id === id);
    if (index !== -1) {
      // Update verification status
      this.mockVerifications[index] = {
        ...this.mockVerifications[index],
        status: 'rejected',
        reviewDate: new Date(),
        reviewedBy: reviewedBy,
        rejectionReason: rejectionReason
      };
      
      // Update the doctor's verification status
      const doctorId = this.mockVerifications[index].doctor.id;
      this.doctorService.getDoctorById(doctorId).subscribe(doctor => {
        if (doctor) {
          doctor.verificationStatus = 'rejected';
          this.doctorService.updateDoctor(doctor).subscribe();
        }
      });
      
      return of(this.mockVerifications[index]).pipe(delay(500));
    }
    
    return of(this.mockVerifications[0]).pipe(delay(500)); // Return first item as fallback
  }

  getVerificationStats(): Observable<{total: number, pending: number, approved: number, rejected: number}> {
    const pending = this.mockVerifications.filter(v => v.status === 'pending').length;
    const approved = this.mockVerifications.filter(v => v.status === 'approved').length;
    const rejected = this.mockVerifications.filter(v => v.status === 'rejected').length;
    
    return of({
      total: this.mockVerifications.length,
      pending: pending,
      approved: approved,
      rejected: rejected
    }).pipe(delay(500));
  }
}