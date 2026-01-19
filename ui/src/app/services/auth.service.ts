import { Injectable } from '@nestjs/common'; // Wait, this is Angular
import { HttpClient } from '@angular/common/http';
import { Injectable as AngularInjectable } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

@AngularInjectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/auth';
  private tokenKey = 'app_token';

  constructor(private http: HttpClient, private router: Router) {}

  login(password: string) {
    return this.http.post(`${this.apiUrl}/login`, { password }).pipe(
      tap(() => {
        localStorage.setItem(this.tokenKey, password);
      })
    );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }
}
