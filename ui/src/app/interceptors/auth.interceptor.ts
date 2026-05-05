import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getToken();
    const isPublicPath = request.url.includes('/login') || request.url.includes('/register') || request.url.includes('/verify-code');

    if (token && !isPublicPath) {
      request = request.clone({
        withCredentials: true,
        setHeaders: {
          'Authorization': `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Allow login requests to handle their own 401 errors
          if (request.url.includes('/login')) {
            return throwError(() => error);
          }
          // Token is invalid or expired, logout and redirect to login
          this.authService.logout();
          return EMPTY;
        }
        return throwError(() => error);
      })
    );
  }
}
