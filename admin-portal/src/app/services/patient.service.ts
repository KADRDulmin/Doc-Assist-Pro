import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Patient } from '../models/patient';
import { delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PatientService {  // Patient data based on CSV files
  private mockPatients: Patient[] = [
    {
      id: '3', // user_id from users.csv
      patientId: 'PAT001',
      email: 'patient@example.com', // from users.csv
      username: 'patient',
      fullName: 'Patient User', // first_name + last_name from users.csv
      role: 'patient',
      status: 'active',
      createdAt: new Date('2025-05-03'),
      lastLogin: new Date('2025-05-03'),
      phone: '',
      address: '',
      dateOfBirth: new Date(), // No date in CSV
      gender: 'male' as 'male', // from patient_profiles.csv
      bloodType: 'O+', // from patient_profiles.csv
      allergies: [],
      medicalHistory: '',
      emergencyContact: {
        name: '',
        relationship: 'Family',
        phone: ''
      }
    },    {
      id: '4', // user_id from users.csv
      patientId: 'PAT002',
      email: 'raminda5575@gmail.com', // from users.csv
      username: 'raminda',
      fullName: 'Raminda Dulmin', // first_name + last_name from users.csv
      role: 'patient',
      status: 'active',
      createdAt: new Date('2025-05-03'),
      lastLogin: new Date('2025-05-03'),
      phone: '758702922', // from users.csv
      address: 'Piliyandala, Western Province, Sri Lanka', // from patient_profiles.csv
      dateOfBirth: new Date('2003-12-19'), // from patient_profiles.csv
      gender: 'male' as 'male', // from patient_profiles.csv
      bloodType: 'B+', // from patient_profiles.csv
      allergies: ['None'],
      medicalHistory: 'None',
      emergencyContact: {
        name: '',
        relationship: 'Family',
        phone: ''
      }
    },    {
      id: '6', // user_id from users.csv
      patientId: 'PAT003',
      email: 'senuri@gmail.com', // from users.csv
      username: 'senuri',
      fullName: 'Senuri Perera', // first_name + last_name from users.csv
      role: 'patient',
      status: 'active',
      createdAt: new Date('2025-05-05'),
      lastLogin: new Date('2025-05-05'),
      phone: '0712449151', // from users.csv
      address: '',
      dateOfBirth: new Date('2025-05-05'), // from patient_profiles.csv
      gender: 'female' as 'female', // from patient_profiles.csv
      bloodType: 'B+', // from patient_profiles.csv
      allergies: ['none'],
      medicalHistory: 'none',
      emergencyContact: {
        name: 'Raminda Dulmin',
        relationship: 'Family',
        phone: '0758438897'
      }
    },
    {
      id: '8', // user_id from users.csv
      patientId: 'PAT004',
      email: 'srimantha@gmail.com', // from users.csv
      username: 'srimantha',
      fullName: 'Srimantha Kariyawasam', // first_name + last_name from users.csv
      role: 'patient',
      status: 'active',
      createdAt: new Date('2025-05-20'),
      lastLogin: new Date('2025-05-20'),
      phone: '0778702925', // from users.csv
      address: 'QWMQ+6H7, Kesbewa, Piliyandala, Western Province, Sri Lanka', // from patient_profiles.csv
      dateOfBirth: new Date('1970-06-04'), // from patient_profiles.csv
      gender: 'male' as 'male', // from patient_profiles.csv
      bloodType: 'AB+', // from patient_profiles.csv
      allergies: ['Noneee'],
      medicalHistory: 'Not at the moment\n\nBut I\'m hoping to have\n\nMedical reports from the app',
      emergencyContact: {
        name: 'Geethanjali',
        relationship: 'Family',
        phone: '0758702925'
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
      id: (this.mockPatients.length + 9).toString(), // Starting from id 9 since our CSV data ends at id 8
      patientId: `PAT00${this.mockPatients.length + 1}`, // Maintain consistent patientId format
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
