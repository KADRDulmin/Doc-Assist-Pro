import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Patient } from '../models/patient';
import { delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  // Mock patients data
  private mockPatients: Patient[] = [
    {
      id: '2',
      patientId: 'PAT001',
      email: 'patient1@example.com',
      username: 'patient1',
      fullName: 'John Smith',
      role: 'patient',
      status: 'active',
      profileImage: 'assets/images/patient1.jpg',
      createdAt: new Date('2023-05-15'),
      lastLogin: new Date('2025-04-30'),
      phone: '+94777123456',
      address: 'Kandy, Sri Lanka',
      dateOfBirth: new Date('1985-06-12'),
      gender: 'male',
      bloodType: 'O+',
      allergies: ['Penicillin', 'Peanuts'],
      medicalHistory: 'Hypertension, Asthma',
      emergencyContact: {
        name: 'Mary Smith',
        relationship: 'Wife',
        phone: '+94777123457'
      },
      insurance: {
        provider: 'Sri Lanka Insurance',
        policyNumber: 'SLI45678',
        expiryDate: new Date('2026-05-15')
      }
    },
    {
      id: '3',
      patientId: 'PAT002',
      email: 'patient2@example.com',
      username: 'patient2',
      fullName: 'Sarah Johnson',
      role: 'patient',
      status: 'active',
      createdAt: new Date('2023-07-22'),
      lastLogin: new Date('2025-05-01'),
      phone: '+94770987654',
      address: 'Galle, Sri Lanka',
      dateOfBirth: new Date('1992-09-24'),
      gender: 'female',
      bloodType: 'A-',
      medicalHistory: 'None',
      emergencyContact: {
        name: 'Robert Johnson',
        relationship: 'Father',
        phone: '+94770987655'
      }
    },
    {
      id: '4',
      patientId: 'PAT003',
      email: 'patient3@example.com',
      username: 'patient3',
      fullName: 'Michael Brown',
      role: 'patient',
      status: 'inactive',
      createdAt: new Date('2023-09-05'),
      lastLogin: new Date('2024-12-10'),
      phone: '+94712222333',
      address: 'Negombo, Sri Lanka',
      dateOfBirth: new Date('1978-03-30'),
      gender: 'male',
      allergies: ['Sulfa drugs'],
      medicalHistory: 'Diabetes Type 2',
      insurance: {
        provider: 'Ceylinco Health',
        policyNumber: 'CH98765',
        expiryDate: new Date('2025-12-31')
      }
    }
  ];

  constructor() { }

  getPatients(): Observable<Patient[]> {
    return of(this.mockPatients).pipe(delay(500));
  }

  getPatientById(id: string): Observable<Patient | undefined> {
    const patient = this.mockPatients.find(p => p.id === id);
    return of(patient).pipe(delay(300));
  }

  createPatient(patient: Patient): Observable<Patient> {
    const newPatient = {
      ...patient,
      id: (this.mockPatients.length + 4).toString(), // Starting from 4 since our mock data starts with id 2
      patientId: `PAT00${this.mockPatients.length + 2}`, // Maintain consistent patientId format
      createdAt: new Date()
    };
    this.mockPatients.push(newPatient);
    return of(newPatient).pipe(delay(500));
  }

  updatePatient(patient: Patient): Observable<Patient> {
    const index = this.mockPatients.findIndex(p => p.id === patient.id);
    if (index !== -1) {
      this.mockPatients[index] = { ...this.mockPatients[index], ...patient };
      return of(this.mockPatients[index]).pipe(delay(500));
    }
    return of(patient).pipe(delay(500));
  }

  deletePatient(id: string): Observable<boolean> {
    const index = this.mockPatients.findIndex(p => p.id === id);
    if (index !== -1) {
      this.mockPatients.splice(index, 1);
      return of(true).pipe(delay(500));
    }
    return of(false).pipe(delay(500));
  }

  getPatientStats(): Observable<{total: number, active: number, inactive: number}> {
    const active = this.mockPatients.filter(p => p.status === 'active').length;
    const inactive = this.mockPatients.filter(p => p.status === 'inactive').length;
    
    return of({
      total: this.mockPatients.length,
      active: active,
      inactive: inactive
    }).pipe(delay(500));
  }
}
