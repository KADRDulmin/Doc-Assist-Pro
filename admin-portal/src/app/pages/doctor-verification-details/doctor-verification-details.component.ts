import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DoctorVerificationService } from '../../services/doctor-verification.service';
import { DoctorVerification } from '../../models/doctor-verification';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-doctor-verification-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatDividerModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './doctor-verification-details.component.html',
  styleUrl: './doctor-verification-details.component.css'
})
export class DoctorVerificationDetailsComponent implements OnInit {
  // Verification request ID
  verificationId: string = '';
  
  // Verification request data
  verification: DoctorVerification | null = null;
  
  // UI state
  isLoading = true;
  error: string | null = null;
  rejectionReason: string = '';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private verificationService: DoctorVerificationService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {}
  
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.verificationId = params['id'];
        this.loadVerificationDetails();
      } else {
        this.error = 'Verification ID not provided';
        this.isLoading = false;
      }
    });
  }
  
  loadVerificationDetails(): void {
    this.isLoading = true;
    this.error = null;
    
    this.verificationService.getVerificationById(this.verificationId).subscribe({
      next: (verification) => {
        this.verification = verification ?? null;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Error loading verification details';
        this.isLoading = false;
      }
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
  
  formatDate(date: Date | undefined | null): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  approveVerification(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !this.verification) return;
    
    this.verificationService.approveVerification(
      this.verificationId, 
      currentUser.fullName
    ).subscribe(() => {
      // Navigate back to the verification list after approval
      this.router.navigate(['/doctor-verification']);
    });
  }
  
  rejectVerification(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !this.verification) return;
    
    if (!this.rejectionReason.trim()) {
      this.error = 'Please provide a reason for rejection';
      return;
    }
    
    this.verificationService.rejectVerification(
      this.verificationId,
      this.rejectionReason,
      currentUser.fullName
    ).subscribe(() => {
      // Navigate back to the verification list after rejection
      this.router.navigate(['/doctor-verification']);
    });
  }
  
  goBack(): void {
    this.router.navigate(['/doctor-verification']);
  }
}