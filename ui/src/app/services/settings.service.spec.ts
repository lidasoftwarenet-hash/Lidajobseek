import { TestBed } from '@angular/core/testing';
import { SettingsService, UserSettings } from './settings.service';
import { AuthService } from './auth.service';
import { of, EMPTY, first } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('SettingsService', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let store: { [key: string]: string } = {};

  beforeEach(() => {
    store = {};
    const authSpy = jasmine.createSpyObj('AuthService', [
      'isAuthenticated',
      'getPreferences',
      'updatePreferences',
      'getUser'
    ]);

    authSpy.isAuthenticated.and.returnValue(false);
    authSpy.getPreferences.and.returnValue(EMPTY);
    authSpy.getUser.and.returnValue(null);

    authServiceSpy = authSpy;

    // Use safe spies instead of Object.defineProperty
    spyOn(localStorage, 'getItem').and.callFake((key: string) => store[key] || null);
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => store[key] = value);
    spyOn(localStorage, 'clear').and.callFake(() => store = {});
    
    if (!window.matchMedia) {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: jasmine.createSpy('matchMedia').and.returnValue({
          matches: false,
          media: '',
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => true,
        }),
      });
    }

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        SettingsService,
        { provide: AuthService, useValue: authSpy }
      ]
    });
  });

  // Helper to get a fresh service after localStorage setup
  function getService(): SettingsService {
    return TestBed.inject(SettingsService);
  }

  it('should be created and load default settings if storage is empty', () => {
    const service = getService();
    expect(service).toBeTruthy();
    expect(service.getSettings().theme).toBe('light');
    expect(service.getSettings().hasSeenOnboarding).toBeTrue();
  });

  it('should load settings from localStorage', () => {
    localStorage.setItem('jobseek_user_settings', JSON.stringify({ theme: 'dark' }));
    const service = getService();
    expect(service.getSettings().theme).toBe('dark');
  });

  it('should handle corrupted local storage JSON', () => {
    spyOn(console, 'error');
    localStorage.setItem('jobseek_user_settings', '{ invalid }');
    const service = getService();
    expect(service.getSettings().theme).toBe('light'); 
    expect(console.error).toHaveBeenCalled();
  });

  it('should sync with server if authenticated', () => {
    const service = getService();
    authServiceSpy.isAuthenticated.and.returnValue(true);
    const mockPrefs = { theme: 'dark', country: 'US', dateFormat: 'YYYY-MM-DD', timeFormat: '12' };
    authServiceSpy.getPreferences.and.returnValue(of(mockPrefs as any));

    service.syncWithServer();
    const current = service.getSettings();

    expect(current.dateFormat).toBe('YYYY-MM-DD');
    expect(current.clockFormat).toBe('12');
    expect(current.hasSeenOnboarding).toBeTrue();
  });

  it('should sync hasSeenOnboarding from server', () => {
    const service = getService();
    authServiceSpy.isAuthenticated.and.returnValue(true);
    const mockPrefs = { theme: 'light', country: 'US', dateFormat: 'DD/MM/YYYY', timeFormat: '24', hasSeenOnboarding: false };
    authServiceSpy.getPreferences.and.returnValue(of(mockPrefs as any));

    service.syncWithServer();

    expect(service.getSettings().hasSeenOnboarding).toBeFalse();
  });

  it('should format date correctly according to preference', () => {
    const service = getService();
    const testDate = new Date(2026, 3, 23); 
    
    service.updateSettings({ dateFormat: 'MM/DD/YYYY' });
    expect(service.formatDate(testDate)).toBe('04/23/2026');

    service.updateSettings({ dateFormat: 'YYYY-MM-DD' });
    expect(service.formatDate(testDate)).toBe('2026-04-23');

    service.updateSettings({ dateFormat: 'DD/MM/YYYY' });
    expect(service.formatDate(testDate)).toBe('23/04/2026');
  });

  it('should toggle dark-theme class on body', () => {
    const service = getService();
    service.setTheme('dark');
    expect(document.body.classList.contains('dark-theme')).toBeTrue();

    service.setTheme('light');
    expect(document.body.classList.contains('dark-theme')).toBeFalse();
  });

  // ── openSettings$ / openSettingsPanel() ─────────────────────────────
  describe('openSettingsPanel()', () => {
    it('openSettings$ emits when openSettingsPanel() is called', (done) => {
      const service = getService();
      service.openSettings$.pipe(first()).subscribe(() => {
        expect(true).toBeTrue();
        done();
      });
      service.openSettingsPanel();
    });

    it('openSettings$ emits each time openSettingsPanel() is called', () => {
      const service = getService();
      let count = 0;
      service.openSettings$.subscribe(() => count++);

      service.openSettingsPanel();
      service.openSettingsPanel();
      service.openSettingsPanel();

      expect(count).toBe(3);
    });

    it('openSettings$ does NOT emit before openSettingsPanel() is called', () => {
      const service = getService();
      let emitted = false;
      service.openSettings$.subscribe(() => emitted = true);
      expect(emitted).toBeFalse();
    });
  });
});
