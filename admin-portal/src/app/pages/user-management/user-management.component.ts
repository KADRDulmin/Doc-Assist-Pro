import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { DoctorService } from '../../services/doctor.service';
import { PatientService } from '../../services/patient.service';
import { Doctor } from '../../models/doctor';
import { Patient } from '../../models/patient';
import { User } from '../../models/user';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTabsModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})
export class UserManagementComponent implements OnInit {
  // Active tab
  activeTab: 'doctors' | 'patients' | 'admins' = 'doctors';
  
  // Data for tables
  doctors: Doctor[] = [];
  patients: Patient[] = [];
  admins: User[] = [];
  
  // Filtered data for display (with pagination)
  displayDoctors: Doctor[] = [];
  displayPatients: Patient[] = [];
  displayAdmins: User[] = [];
  
  // Table columns
  doctorColumns: string[] = ['fullName', 'specialization', 'verificationStatus', 'status', 'actions'];
  patientColumns: string[] = ['fullName', 'gender', 'status', 'actions'];
  adminColumns: string[] = ['fullName', 'email', 'lastLogin', 'actions'];
  
  // Pagination
  doctorPageIndex = 0;
  doctorPageSize = 10;
  doctorTotalItems = 0;
  
  patientPageIndex = 0;
  patientPageSize = 10;
  patientTotalItems = 0;
  
  adminPageIndex = 0;
  adminPageSize = 10;
  adminTotalItems = 0;
  
  // Loading states
  isLoading = {
    doctors: true,
    patients: true,
    admins: true
  };
  
  constructor(
    private userService: UserService,
    private doctorService: DoctorService,
    private patientService: PatientService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog
  ) {}
  
  ngOnInit(): void {
    // Check route params for active tab
    this.route.params.subscribe(params => {
      if (params['type']) {
        if (['doctors', 'patients', 'admins'].includes(params['type'])) {
          this.activeTab = params['type'] as 'doctors' | 'patients' | 'admins';
        }
      }
      
      // Load data based on active tab
      this.loadData();
    });
  }
  
  loadData(): void {
    if (this.activeTab === 'doctors') {
      this.loadDoctors();
    }
    
    if (this.activeTab === 'patients') {
      this.loadPatients();
    }
    
    if (this.activeTab === 'admins') {
      this.loadAdmins();
    }
  }
  
  loadDoctors(): void {
    this.isLoading.doctors = true;
    this.doctorService.getDoctors().subscribe(doctors => {
      this.doctors = doctors;
      this.doctorTotalItems = doctors.length;
      this.updateDoctorPage();
      this.isLoading.doctors = false;
    });
  }
  
  loadPatients(): void {
    this.isLoading.patients = true;
    this.patientService.getPatients().subscribe(patients => {
      this.patients = patients;
      this.patientTotalItems = patients.length;
      this.updatePatientPage();
      this.isLoading.patients = false;
    });
  }
  
  loadAdmins(): void {
    this.isLoading.admins = true;
    this.userService.getUsersByRole('admin').subscribe(admins => {
      this.admins = admins;
      this.adminTotalItems = admins.length;
      this.updateAdminPage();
      this.isLoading.admins = false;
    });
  }
  
  updateDoctorPage(): void {
    const startIndex = this.doctorPageIndex * this.doctorPageSize;
    const endIndex = startIndex + this.doctorPageSize;
    this.displayDoctors = this.doctors.slice(startIndex, endIndex);
  }
  
  updatePatientPage(): void {
    const startIndex = this.patientPageIndex * this.patientPageSize;
    const endIndex = startIndex + this.patientPageSize;
    this.displayPatients = this.patients.slice(startIndex, endIndex);
  }
  
  updateAdminPage(): void {
    const startIndex = this.adminPageIndex * this.adminPageSize;
    const endIndex = startIndex + this.adminPageSize;
    this.displayAdmins = this.admins.slice(startIndex, endIndex);
  }
  
  onDoctorPageChange(event: PageEvent): void {
    this.doctorPageIndex = event.pageIndex;
    this.doctorPageSize = event.pageSize;
    this.updateDoctorPage();
  }
  
  onPatientPageChange(event: PageEvent): void {
    this.patientPageIndex = event.pageIndex;
    this.patientPageSize = event.pageSize;
    this.updatePatientPage();
  }
  
  onAdminPageChange(event: PageEvent): void {
    this.adminPageIndex = event.pageIndex;
    this.adminPageSize = event.pageSize;
    this.updateAdminPage();
  }
  
  onTabChange(tabIndex: number): void {
    // Map tab index to tab name
    const tabs = ['doctors', 'patients', 'admins'];
    const newTab = tabs[tabIndex] as 'doctors' | 'patients' | 'admins';
    
    // Update URL to reflect the active tab
    this.router.navigate(['/user-management', newTab]);
    
    this.activeTab = newTab;
    this.loadData();
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
  
  suspendUser(user: User): void {
    user.status = 'suspended';
    this.userService.updateUser(user).subscribe(() => {
      // Reload the appropriate data
      if (user.role === 'doctor') {
        this.loadDoctors();
      } else if (user.role === 'patient') {
        this.loadPatients();
      } else if (user.role === 'admin') {
        this.loadAdmins();
      }
    });
  }
  
  activateUser(user: User): void {
    user.status = 'active';
    this.userService.updateUser(user).subscribe(() => {
      // Reload the appropriate data
      if (user.role === 'doctor') {
        this.loadDoctors();
      } else if (user.role === 'patient') {
        this.loadPatients();
      } else if (user.role === 'admin') {
        this.loadAdmins();
      }
    });
  }
}
