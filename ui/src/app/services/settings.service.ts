import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface Settings {
  theme: 'light' | 'dark' | 'auto';
  clockFormat: '12' | '24';
  dateFormat:
    | 'MM/DD/YYYY'
    | 'DD/MM/YYYY'
    | 'YYYY-MM-DD'
    | 'YYYY/MM/DD'
    | 'DD-MM-YYYY'
    | 'MM-DD-YYYY'
    | 'DD.MM.YYYY'
    | 'MM.DD.YYYY'
    | 'YYYY.MM.DD';
  country: string;
  salaryCurrency: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY' | 'AUD' | 'CAD' | 'CHF' | 'HKD' | 'SGD' | 'INR' | 'RUB' | 'ILS' | 'RON';
  fontSize: number;
  highContrast: boolean;
  reduceMotion: boolean;
  keyboardNavigation: boolean;
  notifications: {
    email: boolean;
    desktop: boolean;
    followUps: boolean;
    interviews: boolean;
  };
  soundNotifications: boolean;
  emailNotifications: boolean;
  dashboard: {
    showStats: boolean;
    showTasks: boolean;
    defaultView: 'grid' | 'list';
  };
  compactMode: boolean;
  showTooltips: boolean;
  autoSave: boolean;
  analytics: boolean;
  activeFilterPreset: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly STORAGE_KEY = 'settings';
  private readonly apiUrl = `${environment.apiUrl}/api/auth/preferences`;
  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  private mediaQueryHandler = (e: MediaQueryListEvent) => {
    if (this.getSettings().theme === 'auto') {
      this.setThemeClass(e.matches ? 'dark' : 'light');
    }
  };

  private defaultSettings: Settings = {
    theme: 'light',
    clockFormat: '24',
    dateFormat: 'DD/MM/YYYY',
    country: '',
    salaryCurrency: 'USD',
    fontSize: 14,
    highContrast: false,
    reduceMotion: false,
    keyboardNavigation: true,
    notifications: {
      email: true,
      desktop: true,
      followUps: true,
      interviews: true
    },
    soundNotifications: true,
    emailNotifications: true,
    dashboard: {
      showStats: true,
      showTasks: true,
      defaultView: 'grid'
    },
    compactMode: false,
    showTooltips: true,
    autoSave: true,
    analytics: true,
    activeFilterPreset: null
  };

  private settingsSubject = new BehaviorSubject<Settings>(this.loadSettings());
  public settings$ = this.settingsSubject.asObservable();

  private settingsPanelOpenSubject = new BehaviorSubject<boolean>(false);
  public isSettingsPanelOpen$ = this.settingsPanelOpenSubject.asObservable();

  private activeFilterPresetSubject = new BehaviorSubject<string | null>(null);
  public activeFilterPreset$ = this.activeFilterPresetSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {
    this.initializeSettings();
  }

  private initializeSettings() {
    const settings = this.loadSettings();
    this.applySettings(settings);
    this.syncSettingsFromBackend();
  }

  private loadSettings(): Settings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle new settings
        return { ...this.defaultSettings, ...parsed };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    return { ...this.defaultSettings };
  }

  private saveSettings(settings: Settings) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
      this.settingsSubject.next(settings);

      // Persist key user preferences in backend as well
      this.persistPreferencesToBackend(settings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  private syncSettingsFromBackend() {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    this.http.get<{
      theme?: 'light' | 'dark' | 'auto';
      fontSize?: number;
      country?: string;
      dateFormat?:
        | 'MM/DD/YYYY'
        | 'DD/MM/YYYY'
        | 'YYYY-MM-DD'
        | 'YYYY/MM/DD'
        | 'DD-MM-YYYY'
        | 'MM-DD-YYYY'
        | 'DD.MM.YYYY'
        | 'MM.DD.YYYY'
        | 'YYYY.MM.DD';
      timeFormat?: '12' | '24';
      salaryCurrency?: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY' | 'AUD' | 'CAD' | 'CHF' | 'HKD' | 'SGD' | 'INR' | 'RUB' | 'ILS' | 'RON';
    }>(this.apiUrl).subscribe({
      next: (prefs) => {
        const current = this.getSettings();
        const updated: Settings = {
          ...current,
          theme: prefs.theme ?? current.theme,
          fontSize: typeof prefs.fontSize === 'number' ? prefs.fontSize : current.fontSize,
          country: typeof prefs.country === 'string' ? prefs.country : current.country,
          dateFormat: prefs.dateFormat ?? current.dateFormat,
          clockFormat: prefs.timeFormat ? (prefs.timeFormat === '12' ? '12' : '24') : current.clockFormat,
          salaryCurrency: prefs.salaryCurrency ?? current.salaryCurrency,
        };

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
        this.settingsSubject.next(updated);
        this.applySettings(updated);
      },
      error: () => {
        // Keep local settings when backend is unavailable or user is not authenticated.
      }
    });
  }

  private persistPreferencesToBackend(settings: Settings) {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    this.http.post(this.apiUrl, {
      theme: settings.theme,
      fontSize: settings.fontSize,
      country: settings.country,
      dateFormat: settings.dateFormat,
      timeFormat: settings.clockFormat,
      salaryCurrency: settings.salaryCurrency,
    }).subscribe({
      next: () => {
        // no-op
      },
      error: () => {
        // Keep UX responsive; local settings still work.
      }
    });
  }

  private applySettings(settings: Settings) {
    // Apply theme
    this.applyTheme(settings.theme);

    // Apply font size
    document.documentElement.style.setProperty('--base-font-size', `${settings.fontSize}px`);

    // Apply high contrast
    document.body.classList.toggle('high-contrast', settings.highContrast);

    // Apply reduce motion
    document.body.classList.toggle('reduce-motion', settings.reduceMotion);

    // Apply compact mode
    document.body.classList.toggle('compact-mode', settings.compactMode);
  }

  private applyTheme(theme: 'light' | 'dark' | 'auto') {
    this.mediaQuery.removeEventListener('change', this.mediaQueryHandler);

    if (theme === 'auto') {
      this.setThemeClass(this.mediaQuery.matches ? 'dark' : 'light');
      this.mediaQuery.addEventListener('change', this.mediaQueryHandler);
      return;
    }

    this.setThemeClass(theme);
  }

  private setThemeClass(theme: 'light' | 'dark') {
    const body = document.body;
    body.classList.remove('theme-light', 'theme-dark', 'dark-theme', 'light-theme');

    // Keep both naming conventions for compatibility across existing styles.
    body.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');
    body.classList.add(theme === 'dark' ? 'dark-theme' : 'light-theme');
  }

  getSettings(): Settings {
    return this.settingsSubject.value;
  }

  updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    const current = this.getSettings();
    const updated = { ...current, [key]: value };
    this.saveSettings(updated);
    this.applySettings(updated);
  }

  updateSettings(partial: Partial<Settings>) {
    const current = this.getSettings();
    const updated = { ...current, ...partial };
    this.saveSettings(updated);
    this.applySettings(updated);
  }

  resetSettings() {
    this.saveSettings({ ...this.defaultSettings });
    this.applySettings(this.defaultSettings);
  }

  openSettingsPanel() {
    this.settingsPanelOpenSubject.next(true);
  }

  closeSettingsPanel() {
    this.settingsPanelOpenSubject.next(false);
  }

  toggleSettingsPanel() {
    this.settingsPanelOpenSubject.next(!this.settingsPanelOpenSubject.value);
  }

  setActiveFilterPreset(presetName: string | null) {
    const current = this.getSettings();
    const updated = { ...current, activeFilterPreset: presetName };
    this.saveSettings(updated);
    this.activeFilterPresetSubject.next(presetName);
  }

  getActiveFilterPreset(): string | null {
    return this.getSettings().activeFilterPreset;
  }
}
