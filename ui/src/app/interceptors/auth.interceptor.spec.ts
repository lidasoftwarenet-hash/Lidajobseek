import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('AuthInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Router, useValue: jasmine.createSpyObj<Router>('Router', ['navigate']) },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    document.cookie = 'csrf_token=; Max-Age=0; path=/';
    httpMock.verify();
  });

  it('adds withCredentials for API requests and does not inject Authorization header', () => {
    http.get('/api/protected').subscribe();

    const req = httpMock.expectOne('/api/protected');
    expect(req.request.withCredentials).toBeTrue();
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({ ok: true });
  });

  it('adds X-CSRF-Token for mutating internal API requests when csrf cookie is present', () => {
    document.cookie = 'csrf_token=test-csrf-token; path=/';

    http.post('/api/protected', { hello: 'world' }).subscribe();

    const req = httpMock.expectOne('/api/protected');
    expect(req.request.withCredentials).toBeTrue();
    expect(req.request.headers.get('X-CSRF-Token')).toBe('test-csrf-token');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({ ok: true });
  });

  it('does not modify external requests', () => {
    http.get('https://example.com/ping').subscribe();

    const req = httpMock.expectOne('https://example.com/ping');
    expect(req.request.withCredentials).toBeFalse();
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({ ok: true });
  });
});
