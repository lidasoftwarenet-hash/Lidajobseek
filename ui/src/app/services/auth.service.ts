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

  register(payload: { email: string; username: string; phone?: string; password: string }) {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/register`, payload);
  }

  verifyInvitationCode(code: string) {
    return this.http.post(`${this.apiUrl}/verify-code`, { code });
  }

  activateAccount(token: string) {
    return this.http.get<{ success: boolean; message: string }>(`${this.apiUrl}/activate`, {
      params: { token },
    });
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

  getUser(): any {
    const userStr = localStorage.getItem('app_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isPremiumUser(): boolean {
    const user = this.getUser();
    return user?.pricingPlan === 'premium' || user?.pricingPlan === 'enterprise';
  }

  getPricingPlan(): string {
    const user = this.getUser();
    return user?.pricingPlan || 'free';
  }
}
