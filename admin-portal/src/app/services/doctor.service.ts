import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Doctor } from '../models/doctor';
import { delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  // Updated doctors data from CSV files based on the provided CSVs
  private mockDoctors: Doctor[] = [
    {
      id: '2', // Based on user_id from CSV
      doctorId: 'DOC001',
      email: 'doctor@example.com',
      username: 'doctor',
      fullName: 'Dr. Doctor User',
      role: 'doctor',
      status: 'active',
      createdAt: new Date('2025-05-03'),
      lastLogin: new Date('2025-05-20'),
      phone: '',
      address: '',
      specialization: 'Cardiology',
      licenseNumber: 'DOC-12345',
      education: ['Unknown'],
      experience: 0,
      hospital: '',
      consultationFee: 0,
      availableDays: ['Monday', 'Wednesday', 'Friday'],
      verificationStatus: 'verified',
      ratings: 4.0,
      reviewCount: 0,
      languages: ['English']
    },
    {
      id: '5',
      doctorId: 'DOC002',
      email: 'danushka@gmail.com',
      username: 'danushka',
      fullName: 'Dr. Danushka Kannangara',
      role: 'doctor',
      status: 'active',
      createdAt: new Date('2025-05-04'),
      lastLogin: new Date('2025-05-20'),
      phone: '0758702922',
      address: '',
      specialization: 'Dental',
      licenseNumber: 'SL-MED-5678',
      education: ['MBBS - University of Peradeniya', 'DCH - Royal College of Physicians'],
      experience: 8,
      hospital: 'Nawaloka Hospital',
      consultationFee: 2000,
      availableDays: ['Tuesday', 'Thursday', 'Saturday'],
      verificationStatus: 'verified',
      ratings: 4.9,
      reviewCount: 120,
      languages: ['English', 'Sinhala']
    },
    {
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
    {
      id: '8',
      doctorId: 'DOC004',
      email: 'doctor4@hospital.org',
      username: 'doctor4',
      fullName: 'Dr. Sarah Ahmed',
      role: 'doctor',
      status: 'active',
      createdAt: new Date('2024-01-15'),
      lastLogin: new Date('2025-05-01'),
      phone: '+94765432109',
      address: 'Asiri Hospital, Colombo, Sri Lanka',
      specialization: 'Neurology',
      licenseNumber: 'SL-MED-3456',
      education: ['MBBS - University of Jaffna', 'MD Neurology - University of Edinburgh'],
      experience: 10,
      hospital: 'Asiri Hospital',
      consultationFee: 3500,
      availableDays: ['Monday', 'Wednesday', 'Thursday'],
      verificationStatus: 'verified',
      ratings: 4.7,
      reviewCount: 95,
      languages: ['English', 'Sinhala', 'Tamil', 'Arabic']
    },
    {
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
    }
  ];

  constructor() { }

  getDoctors(): Observable<Doctor[]> {
    return of(this.mockDoctors).pipe(delay(500));
  }

  getDoctorById(id: string): Observable<Doctor | undefined> {
    const doctor = this.mockDoctors.find(d => d.id === id);
    return of(doctor).pipe(delay(300));
  }

  createDoctor(doctor: Doctor): Observable<Doctor> {
    const newDoctor = {
      ...doctor,
      id: (this.mockDoctors.length + 5).toString(), // Starting from id 10 since our mock data starts with id 5
      doctorId: `DOC00${this.mockDoctors.length + 1}`, // Maintain consistent doctorId format
      createdAt: new Date()
    };
    this.mockDoctors.push(newDoctor);
    return of(newDoctor).pipe(delay(500));
  }

  updateDoctor(doctor: Doctor): Observable<Doctor> {
    const index = this.mockDoctors.findIndex(d => d.id === doctor.id);
    if (index !== -1) {
      this.mockDoctors[index] = { ...this.mockDoctors[index], ...doctor };
      return of(this.mockDoctors[index]).pipe(delay(500));
    }
    return of(doctor).pipe(delay(500));
  }

  deleteDoctor(id: string): Observable<boolean> {
    const index = this.mockDoctors.findIndex(d => d.id === id);
    if (index !== -1) {
      this.mockDoctors.splice(index, 1);
      return of(true).pipe(delay(500));
    }
    return of(false).pipe(delay(500));
  }

  getDoctorStats(): Observable<{total: number, verified: number, pending: number, rejected: number}> {
    const verified = this.mockDoctors.filter(d => d.verificationStatus === 'verified').length;
    const pending = this.mockDoctors.filter(d => d.verificationStatus === 'pending').length;
    const rejected = this.mockDoctors.filter(d => d.verificationStatus === 'rejected').length;
    
    return of({
      total: this.mockDoctors.length,
      verified: verified,
      pending: pending,
      rejected: rejected
    }).pipe(delay(500));
  }

  getDoctorsByVerificationStatus(status: 'pending' | 'verified' | 'rejected'): Observable<Doctor[]> {
    const filteredDoctors = this.mockDoctors.filter(d => d.verificationStatus === status);
    return of(filteredDoctors).pipe(delay(500));
  }
}
