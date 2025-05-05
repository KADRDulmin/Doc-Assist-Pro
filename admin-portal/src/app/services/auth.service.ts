import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { User } from '../models/user';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  // Store authentication state
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  
  // Flag to check if code is running in browser
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    // Check if user is already logged in (from local storage) - only in browser
    if (this.isBrowser) {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      }
    }
  }

  login(email: string, password: string): Observable<User> {
    // This is mock authentication - in a real app, this would call an API
    // For the mock, we'll accept any credentials where the password is 'admin123'
    // and return a mock admin user
    if (password === 'admin123') {
      const user: User = {
        id: '1',
        email: email,
        username: 'admin',
        fullName: 'Admin User',
        role: 'admin',
        status: 'active',
        profileImage: 'assets/images/admin.jpg',
        createdAt: new Date('2023-01-10'),
        lastLogin: new Date()
      };
      
      // Store user in local storage - only if in browser
      if (this.isBrowser) {
        localStorage.setItem('currentUser', JSON.stringify(user));
      }
      
      // Update subjects
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
      
      return of(user).pipe(delay(800)); // Simulate API delay
    } else {
      // Return error for invalid credentials
      return new Observable(observer => {
        setTimeout(() => {
          observer.error('Invalid credentials');
        }, 800);
      });
    }
  }

  logout(): Observable<boolean> {
    // Clear user from local storage - only if in browser
    if (this.isBrowser) {
      localStorage.removeItem('currentUser');
    }
    
    // Update subjects
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    
    return of(true).pipe(delay(300)); // Simulate API delay
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }
}
