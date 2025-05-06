import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { UserService } from '../../services/user.service';
import { DoctorService } from '../../services/doctor.service';
import { PatientService } from '../../services/patient.service';
import { DoctorVerificationService } from '../../services/doctor-verification.service';
import { Doctor } from '../../models/doctor';
import { Patient } from '../../models/patient';
import { DoctorVerification } from '../../models/doctor-verification';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  // Stats
  userStats = { totalUsers: 0, activeUsers: 0, pendingVerification: 0 };
  doctorStats = { total: 0, verified: 0, pending: 0, rejected: 0 };
  patientStats = { total: 0, active: 0, inactive: 0 };
  
  // Recent users
  recentDoctors: Doctor[] = [];
  recentPatients: Patient[] = [];
  
  // Pending verifications
  pendingVerifications: DoctorVerification[] = [];
  
  // Table columns
  doctorColumns: string[] = ['fullName', 'specialization', 'status', 'actions'];
  patientColumns: string[] = ['fullName', 'gender', 'status', 'actions'];
  verificationColumns: string[] = ['doctor', 'submittedDate', 'status', 'actions'];
  
  // Loading states
  isLoading = {
    stats: true,
    doctors: true,
    patients: true,
    verifications: true
  };

  constructor(
    private userService: UserService,
    private doctorService: DoctorService,
    private patientService: PatientService,
    private verificationService: DoctorVerificationService
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadRecentDoctors();
    this.loadRecentPatients();
    this.loadPendingVerifications();
  }

  loadStats(): void {
    this.userService.getUserStats().subscribe(stats => {
      this.userStats = stats;
      this.isLoading.stats = false;
    });
    
    this.doctorService.getDoctorStats().subscribe(stats => {
      this.doctorStats = stats;
    });
    
    this.patientService.getPatientStats().subscribe(stats => {
      this.patientStats = stats;
    });
  }

  loadRecentDoctors(): void {
    this.doctorService.getDoctors().subscribe(doctors => {
      // Get the 5 most recent doctors sorted by creation date
      this.recentDoctors = doctors
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5);
      this.isLoading.doctors = false;
    });
  }

  loadRecentPatients(): void {
    this.patientService.getPatients().subscribe(patients => {
      // Get the 5 most recent patients sorted by creation date
      this.recentPatients = patients
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5);
      this.isLoading.patients = false;
    });
  }

  loadPendingVerifications(): void {
    this.verificationService.getPendingVerifications().subscribe(verifications => {
      this.pendingVerifications = verifications;
      this.isLoading.verifications = false;
    });
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'suspended': return 'status-suspended';
      case 'verified': return 'status-verified';
      case 'pending': return 'status-pending';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
  }
}
