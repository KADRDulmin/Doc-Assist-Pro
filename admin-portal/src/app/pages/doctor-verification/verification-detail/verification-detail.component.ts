import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DoctorVerificationService } from '../../../services/doctor-verification.service';
import { DoctorService } from '../../../services/doctor.service';
import { AuthService } from '../../../services/auth.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-verification-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatDividerModule,
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule
  ],
  templateUrl: './verification-detail.component.html',
  styleUrls: ['./verification-detail.component.css']
})
export class VerificationDetailComponent implements OnInit {
  verificationId: string;
  verification: any;
  doctor: any;
  isLoading = true;
  activeDocumentUrl: string | null = null;
  rejectForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private verificationService: DoctorVerificationService,
    private doctorService: DoctorService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer
  ) {
    this.verificationId = '';
    this.rejectForm = this.fb.group({
      rejectionReason: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.verificationId = id;
        this.loadVerificationDetails();
      } else {
        this.isLoading = false;
        this.showError('Verification ID is missing');
      }
    });
  }

  private loadVerificationDetails(): void {
    this.isLoading = true;
    this.verificationService.getVerificationById(this.verificationId).subscribe({
      next: (verification) => {
        this.verification = verification;
        if (verification && verification.doctor) {
          this.loadDoctorDetails(verification.doctor);
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.showError('Failed to load verification details');
        console.error('Error loading verification details:', error);
      }
    });
  }

  loadDoctorDetails(doctorId: string): void {
    this.doctorService.getDoctorById(doctorId)
      .subscribe({
        next: (doctor) => {
          this.doctor = doctor;
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.showError('Failed to load doctor details: ' + error.message);
        }
      });
  }

  getStatusClass(status: string): string {
    if (typeof status !== 'string') {
      return '';
    }
    
    // Normalize status by trimming and converting to lowercase
    const normalizedStatus = status.trim().toLowerCase();
    
    switch (normalizedStatus) {
      case 'pending':
        return 'status-pending';
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      default:
        console.warn(`Unknown status value: "${status}"`);
        return '';
    }
  }

  viewDocument(url: string): void {
    this.activeDocumentUrl = url;
  }

  closeDocumentViewer(): void {
    this.activeDocumentUrl = null;
  }

  sanitizeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  approveVerification(): void {
    if (confirm('Are you sure you want to approve this verification request?')) {
      this.isLoading = true;
      this.verificationService.approveVerification(this.verificationId)
        .subscribe({
          next: () => {
            this.showSuccess('Verification approved successfully');
            this.loadVerificationDetails();
          },
          error: (error) => {
            this.isLoading = false;
            this.showError('Failed to approve verification: ' + error.message);
          }
        });
    }
  }

  rejectVerification(): void {
    if (this.rejectForm.invalid) {
      this.rejectForm.markAllAsTouched();
      return;
    }

    if (confirm('Are you sure you want to reject this verification request?')) {
      const reason = this.rejectForm.get('rejectionReason')?.value;
      this.isLoading = true;
      
      this.verificationService.rejectVerification(this.verificationId, reason)
        .subscribe({
          next: () => {
            this.showSuccess('Verification rejected successfully');
            this.loadVerificationDetails();
          },
          error: (error) => {
            this.isLoading = false;
            this.showError('Failed to reject verification: ' + error.message);
          }
        });
    }
  }

  showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}