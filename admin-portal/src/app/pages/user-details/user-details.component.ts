import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { UserService } from '../../services/user.service';
import { DoctorService } from '../../services/doctor.service';
import { PatientService } from '../../services/patient.service';
import { Doctor } from '../../models/doctor';
import { Patient } from '../../models/patient';
import { User } from '../../models/user';

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatDividerModule,
    MatChipsModule
  ],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.css'
})
export class UserDetailsComponent implements OnInit {
  userId: string = '';
  userType: 'doctor' | 'patient' | 'admin' = 'admin';
  
  user: User | null = null;
  doctor: Doctor | null = null;
  patient: Patient | null = null;
  
  isLoading = true;
  error: string | null = null;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private doctorService: DoctorService,
    private patientService: PatientService
  ) {}
  
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.userId = params['id'];
        this.loadUserDetails();
      } else {
        this.error = 'User ID not provided';
        this.isLoading = false;
      }
    });
  }
  
  loadUserDetails(): void {
    this.isLoading = true;
    this.error = null;
    
    // First get basic user info
    this.userService.getUserById(this.userId).subscribe({
      next: (user) => {
        if (user) {
          this.user = user;
          
          // Based on user role, load more detailed information
          if (user.role === 'doctor') {
            this.userType = 'doctor';
            this.loadDoctorDetails(this.userId);
          } else if (user.role === 'patient') {
            this.userType = 'patient';
            this.loadPatientDetails(this.userId);
          } else {
            this.userType = 'admin';
            this.isLoading = false;
          }
        } else {
          this.error = 'User not found';
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.error = 'Error loading user details';
        this.isLoading = false;
      }
    });
  }
  
  loadDoctorDetails(id: string): void {
    this.doctorService.getDoctorById(id).subscribe({
      next: (doctor) => {
        this.doctor = doctor || null;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Error loading doctor details';
        this.isLoading = false;
      }
    });
  }
  
  loadPatientDetails(id: string): void {
    this.patientService.getPatientById(id).subscribe({
      next: (patient) => {
        this.patient = patient || null;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Error loading patient details';
        this.isLoading = false;
      }
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
  
  formatDate(date: Date | undefined | null): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  suspendUser(): void {
    if (!this.user) return;
    
    this.user.status = 'suspended';
    this.userService.updateUser(this.user).subscribe(() => {
      // Reload the user details
      this.loadUserDetails();
    });
  }
  
  activateUser(): void {
    if (!this.user) return;
    
    this.user.status = 'active';
    this.userService.updateUser(this.user).subscribe(() => {
      // Reload the user details
      this.loadUserDetails();
    });
  }
  
  goBack(): void {
    this.router.navigate(['/user-management']);
  }
}
