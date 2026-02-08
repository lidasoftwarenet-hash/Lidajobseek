import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export type SocialProvider = 'google' | 'linkedin' | 'facebook';

type SocialAuthStartResult = {
  provider: SocialProvider;
  status: 'redirected' | 'pending-config';
  redirectUrl: string;
  message: string;
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;
  private tokenKey = 'app_token';

  constructor(private http: HttpClient, private router: Router) { }

  startSocialAuth(provider: SocialProvider, intent: 'register' | 'login' = 'register'): SocialAuthStartResult {
    const state = this.generateOAuthState();
    const callbackPath = environment.socialAuth?.callbackPath || '/auth/social/callback';
    const redirectUri = `${window.location.origin}${callbackPath}`;
    const providerConfig = environment.socialAuth?.providers?.[provider];

    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('oauth_provider', provider);
    sessionStorage.setItem('oauth_intent', intent);

    const params = new URLSearchParams({
      state,
      intent,
      redirectUri,
    });

    if (providerConfig?.clientId) {
      params.set('clientId', providerConfig.clientId);
    }

    const redirectUrl = `${this.apiUrl}/oauth/${provider}/start?${params.toString()}`;
    const socialAuthEnabled = !!environment.socialAuth?.enabled && !!providerConfig?.enabled;

    if (socialAuthEnabled) {
      window.location.assign(redirectUrl);
      return {
        provider,
        status: 'redirected',
        redirectUrl,
        message: `Redirecting to ${provider} for secure ${intent}...`,
      };
    }

    return {
      provider,
      status: 'pending-config',
      redirectUrl,
      message: `${provider[0].toUpperCase() + provider.slice(1)} OAuth is scaffolded. Enable environment.socialAuth + provider keys to activate redirect.`,
    };
  }

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

  private generateOAuthState(): string {
    const random = new Uint8Array(16);
    crypto.getRandomValues(random);
    return Array.from(random, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
}
