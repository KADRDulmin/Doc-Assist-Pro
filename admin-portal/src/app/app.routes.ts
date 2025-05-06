import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(c => c.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./layout/admin-layout/admin-layout.component').then(c => c.AdminLayoutComponent),
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(c => c.DashboardComponent)
      },
      {
        path: 'user-management',
        children: [
          {
            path: '',
            redirectTo: 'doctors',
            pathMatch: 'full'
          },
          {
            path: ':type',
            loadComponent: () => import('./pages/user-management/user-management.component').then(c => c.UserManagementComponent)
          }
        ]
      },
      {
        path: 'user-details/:id',
        loadComponent: () => import('./pages/user-details/user-details.component').then(c => c.UserDetailsComponent)
      },
      {
        path: 'doctor-verification',
        loadComponent: () => import('./pages/doctor-verification/doctor-verification.component').then(c => c.DoctorVerificationComponent)
      },
      {
        path: 'doctor-verification/:id',
        loadComponent: () => import('./pages/doctor-verification-details/doctor-verification-details.component').then(c => c.DoctorVerificationDetailsComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.component').then(c => c.SettingsComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
