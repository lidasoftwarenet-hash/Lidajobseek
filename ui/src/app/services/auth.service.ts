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

export type AuthErrorType =
  | 'expired_token'
  | 'invalid_token'
  | 'invalid_session'
  | 'unauthorized_scope'
  | 'invalid_credentials'
  | 'server_error'
  | 'unknown';

export interface AuthErrorPayload {
  type?: string;
  code?: string;
  message?: string;
}

const AUTH_LOGOUT_REASON_KEY = 'auth_logout_reason';
const AUTH_USER_KEY = 'app_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;

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
        if (res.user) {
          sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(res.user));
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

  logout(reason?: Exclude<AuthErrorType, 'unknown' | 'invalid_credentials' | 'unauthorized_scope' | 'server_error'>) {
    if (reason) {
      sessionStorage.setItem(AUTH_LOGOUT_REASON_KEY, reason);
    }
    sessionStorage.removeItem(AUTH_USER_KEY);
    this.router.navigate(['/login']);
  }

  consumeLogoutReasonMessage(): string | null {
    const reason = sessionStorage.getItem(AUTH_LOGOUT_REASON_KEY);
    if (!reason) {
      return null;
    }

    sessionStorage.removeItem(AUTH_LOGOUT_REASON_KEY);

    if (reason === 'expired_token') {
      return 'Your session expired. Please log in again.';
    }

    if (reason === 'invalid_token' || reason === 'invalid_session') {
      return 'Your session is no longer valid. Please log in again.';
    }

    return null;
  }

  classifyAuthError(payload: AuthErrorPayload | null | undefined): AuthErrorType {
    const type = String(payload?.type || '').toLowerCase();
    const code = String(payload?.code || '').toUpperCase();
    const message = String(payload?.message || '').toLowerCase();

    if (type === 'expired_token' || code === 'TOKEN_EXPIRED' || message.includes('session has expired')) {
      return 'expired_token';
    }

    if (type === 'invalid_token' || code === 'INVALID_TOKEN') {
      return 'invalid_token';
    }

    if (type === 'invalid_session' || code === 'INVALID_SESSION') {
      return 'invalid_session';
    }

    if (type === 'unauthorized_scope' || code === 'UNAUTHORIZED_SCOPE') {
      return 'unauthorized_scope';
    }

    if (type === 'invalid_credentials' || code === 'INVALID_CREDENTIALS') {
      return 'invalid_credentials';
    }

    if (type === 'server_error' || code === 'SERVER_ERROR') {
      return 'server_error';
    }

    return 'unknown';
  }

  isAuthenticated(): boolean {
    return !!sessionStorage.getItem(AUTH_USER_KEY);
  }

  getUser(): any {
    const userStr = sessionStorage.getItem(AUTH_USER_KEY);
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
