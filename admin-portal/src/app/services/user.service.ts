import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { User } from '../models/user';
import { delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  // Mock users data
  private mockUsers: User[] = [
    {
      id: '1',
      email: 'admin@docassist.com',
      username: 'admin',
      fullName: 'Admin User',
      role: 'admin',
      status: 'active',
      profileImage: 'assets/images/admin.jpg',
      createdAt: new Date('2023-01-10'),
      lastLogin: new Date('2025-05-04'),
      phone: '+94712345678',
      address: 'Colombo, Sri Lanka'
    },
    {
      id: '2',
      email: 'patient1@example.com',
      username: 'patient1',
      fullName: 'John Smith',
      role: 'patient',
      status: 'active',
      profileImage: 'assets/images/patient1.jpg',
      createdAt: new Date('2023-05-15'),
      lastLogin: new Date('2025-04-30'),
      phone: '+94777123456',
      address: 'Kandy, Sri Lanka'
    },
    {
      id: '3',
      email: 'patient2@example.com',
      username: 'patient2',
      fullName: 'Sarah Johnson',
      role: 'patient',
      status: 'active',
      createdAt: new Date('2023-07-22'),
      lastLogin: new Date('2025-05-01'),
      phone: '+94770987654',
      address: 'Galle, Sri Lanka'
    },
    {
      id: '4',
      email: 'patient3@example.com',
      username: 'patient3',
      fullName: 'Michael Brown',
      role: 'patient',
      status: 'inactive',
      createdAt: new Date('2023-09-05'),
      lastLogin: new Date('2024-12-10'),
      phone: '+94712222333',
      address: 'Negombo, Sri Lanka'
    },
    {
      id: '5',
      email: 'doctor1@hospital.org',
      username: 'doctor1',
      fullName: 'Dr. Emma Williams',
      role: 'doctor',
      status: 'active',
      profileImage: 'assets/images/doctor1.jpg',
      createdAt: new Date('2023-03-20'),
      lastLogin: new Date('2025-05-03'),
      phone: '+94712345222',
      address: 'Colombo Central Hospital, Sri Lanka'
    },
    {
      id: '6',
      email: 'doctor2@hospital.org',
      username: 'doctor2',
      fullName: 'Dr. James Thompson',
      role: 'doctor',
      status: 'active',
      profileImage: 'assets/images/doctor2.jpg',
      createdAt: new Date('2023-04-10'),
      lastLogin: new Date('2025-05-02'),
      phone: '+94723456789',
      address: 'Nawaloka Hospital, Colombo, Sri Lanka'
    },
    {
      id: '7',
      email: 'doctor3@clinic.com',
      username: 'doctor3',
      fullName: 'Dr. Robert Chen',
      role: 'doctor',
      status: 'suspended',
      createdAt: new Date('2023-06-25'),
      lastLogin: new Date('2024-11-15')
    }
  ];

  private usersSubject = new BehaviorSubject<User[]>(this.mockUsers);
  
  constructor() { }

  getUsers(): Observable<User[]> {
    // Simulate API delay
    return of(this.mockUsers).pipe(delay(500));
  }

  getUserById(id: string): Observable<User | undefined> {
    const user = this.mockUsers.find(u => u.id === id);
    return of(user).pipe(delay(300));
  }

  createUser(user: User): Observable<User> {
    const newUser = {
      ...user,
      id: (this.mockUsers.length + 1).toString(),
      createdAt: new Date()
    };
    this.mockUsers.push(newUser);
    this.usersSubject.next(this.mockUsers);
    return of(newUser).pipe(delay(500));
  }

  updateUser(user: User): Observable<User> {
    const index = this.mockUsers.findIndex(u => u.id === user.id);
    if (index !== -1) {
      this.mockUsers[index] = { ...this.mockUsers[index], ...user };
      this.usersSubject.next(this.mockUsers);
      return of(this.mockUsers[index]).pipe(delay(500));
    }
    return of(user).pipe(delay(500));
  }

  deleteUser(id: string): Observable<boolean> {
    const index = this.mockUsers.findIndex(u => u.id === id);
    if (index !== -1) {
      this.mockUsers.splice(index, 1);
      this.usersSubject.next(this.mockUsers);
      return of(true).pipe(delay(500));
    }
    return of(false).pipe(delay(500));
  }

  getUsersByRole(role: 'admin' | 'doctor' | 'patient'): Observable<User[]> {
    const filteredUsers = this.mockUsers.filter(u => u.role === role);
    return of(filteredUsers).pipe(delay(500));
  }

  getUserStats(): Observable<{totalUsers: number, activeUsers: number, pendingVerification: number}> {
    const activeUsers = this.mockUsers.filter(u => u.status === 'active').length;
    const pendingDoctors = this.mockUsers.filter(u => 
      u.role === 'doctor' && (u as any).verificationStatus === 'pending'
    ).length;
    
    return of({
      totalUsers: this.mockUsers.length,
      activeUsers: activeUsers,
      pendingVerification: pendingDoctors
    }).pipe(delay(500));
  }
}
