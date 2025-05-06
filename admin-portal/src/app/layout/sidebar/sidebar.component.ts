import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  children?: NavItem[];
  expanded?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatListModule,
    MatIconModule,
    MatExpansionModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  navItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard'
    },
    {
      label: 'User Management',
      icon: 'people',
      expanded: false,
      children: [
        {
          label: 'Doctors',
          icon: 'medical_services',
          route: '/user-management/doctors'
        },
        {
          label: 'Patients',
          icon: 'personal_injury',
          route: '/user-management/patients'
        },
        {
          label: 'Admins',
          icon: 'admin_panel_settings',
          route: '/user-management/admins'
        }
      ]
    },
    {
      label: 'Doctor Verification',
      icon: 'verified_user',
      route: '/doctor-verification'
    },
    {
      label: 'Reports',
      icon: 'analytics',
      expanded: false,
      children: [
        {
          label: 'User Statistics',
          icon: 'bar_chart',
          route: '/reports/user-stats'
        },
        {
          label: 'Doctor Performance',
          icon: 'leaderboard',
          route: '/reports/doctor-performance'
        }
      ]
    },
    {
      label: 'Settings',
      icon: 'settings',
      route: '/settings'
    }
  ];

  constructor(private router: Router) {}

  isActive(route: string): boolean {
    return this.router.isActive(route, {
      paths: 'exact',
      queryParams: 'exact',
      fragment: 'ignored',
      matrixParams: 'ignored'
    });
  }
}
