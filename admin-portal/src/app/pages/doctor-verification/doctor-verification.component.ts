import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DoctorVerificationService } from '../../services/doctor-verification.service';
import { DoctorVerification } from '../../models/doctor-verification';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-doctor-verification',
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
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './doctor-verification.component.html',
  styleUrl: './doctor-verification.component.css'
})
export class DoctorVerificationComponent implements OnInit {
  // All verifications
  verifications: DoctorVerification[] = [];
  
  // Filtered verifications
  pendingVerifications: DoctorVerification[] = [];
  approvedVerifications: DoctorVerification[] = [];
  rejectedVerifications: DoctorVerification[] = [];
  
  // Table columns
  displayedColumns: string[] = ['doctor', 'specialization', 'licenseNumber', 'submittedDate', 'status', 'actions'];
  
  // Loading state
  isLoading = true;

  constructor(
    private verificationService: DoctorVerificationService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadVerifications();
  }

  loadVerifications(): void {
    this.isLoading = true;
    this.verificationService.getVerificationRequests().subscribe(data => {
      this.verifications = data;
      
      // Filter verifications by status
      this.pendingVerifications = data.filter(v => v.status === 'pending');
      this.approvedVerifications = data.filter(v => v.status === 'approved');
      this.rejectedVerifications = data.filter(v => v.status === 'rejected');
      
      this.isLoading = false;
    });
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'pending': return 'status-pending';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
  }

  approveVerification(verification: DoctorVerification): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;
    
    this.verificationService.approveVerification(
      verification.id, 
      currentUser.fullName
    ).subscribe(() => {
      this.loadVerifications();
    });
  }

  openRejectDialog(verification: DoctorVerification): void {
    // This would normally open a dialog to enter rejection reason
    // For simplicity in the mockup, we'll just reject with a sample reason
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;
    
    const rejectionReason = "Documents provided do not meet our verification requirements.";
    
    this.verificationService.rejectVerification(
      verification.id,
      rejectionReason,
      currentUser.fullName
    ).subscribe(() => {
      this.loadVerifications();
    });
  }
}
