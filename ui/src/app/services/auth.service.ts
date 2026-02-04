import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;
  private tokenKey = 'app_token';

  constructor(private http: HttpClient, private router: Router) { }

  login(email: string, password: string) {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(res => {
        localStorage.setItem(this.tokenKey, res.access_token);
        if (res.user) {
          localStorage.setItem('app_user', JSON.stringify(res.user));
        }
      })
    );
  }

  register(email: string, password: string, name: string, code: string) {
    return this.http.post(`${this.apiUrl}/register`, { email, password, name, code });
  }

  verifyInvitationCode(code: string) {
    return this.http.post(`${this.apiUrl}/verify-code`, { code });
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('app_user');
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }
}
