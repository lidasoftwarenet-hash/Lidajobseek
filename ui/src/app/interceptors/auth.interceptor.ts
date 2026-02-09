import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getToken();
    if (token) {
      request = request.clone({
        setHeaders: {
          'Authorization': `Bearer ${token}`
        }
      });
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
}
