import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    sessionStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('login stores user in sessionStorage and does not touch localStorage token state', () => {
    const localStorageSetSpy = spyOn(localStorage, 'setItem').and.callThrough();

    service.login('test@example.com', 'password123').subscribe();

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({
      access_token: 'token-from-backend',
      user: { id: 1, email: 'test@example.com', pricingPlan: 'free' },
    });

    expect(sessionStorage.getItem('app_user')).toContain('test@example.com');
    expect(localStorageSetSpy).not.toHaveBeenCalled();
  });

  it('logout clears session auth user and navigates to login without localStorage token clearing', () => {
    const localStorageRemoveSpy = spyOn(localStorage, 'removeItem').and.callThrough();
    sessionStorage.setItem('app_user', JSON.stringify({ id: 2, email: 'u@example.com' }));

    service.logout();

    expect(sessionStorage.getItem('app_user')).toBeNull();
    expect(localStorageRemoveSpy).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
