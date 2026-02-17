import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (this.isApiRequest(request.url)) {
      request = request.clone({ withCredentials: true });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          const authErrorType = this.authService.classifyAuthError(error.error);
          if (
            authErrorType === 'expired_token' ||
            authErrorType === 'invalid_token' ||
            authErrorType === 'invalid_session'
          ) {
            this.authService.logout(authErrorType);
          }
        }
        return throwError(() => error);
      })
    );
  }

  private isApiRequest(url: string): boolean {
    const normalizedApiUrl = (environment.apiUrl || '').replace(/\/+$/, '');

    if (normalizedApiUrl && (url === normalizedApiUrl || url.startsWith(`${normalizedApiUrl}/`))) {
      return true;
    }

    return url.startsWith('/api') || url.startsWith('api/');
  }
}
