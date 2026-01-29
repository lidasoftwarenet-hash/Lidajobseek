import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  clockFormat: '12' | '24';
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  notifications: {
    email: boolean;
    desktop: boolean;
    followUps: boolean;
    interviews: boolean;
  };
  dashboard: {
    showStats: boolean;
    showTasks: boolean;
    defaultView: 'grid' | 'list';
  };
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'light',
  clockFormat: '24',
  dateFormat: 'DD/MM/YYYY',
  notifications: {
    email: true,
    desktop: true,
    followUps: true,
    interviews: true
  },
  dashboard: {
    showStats: true,
    showTasks: true,
    defaultView: 'grid'
  }
};

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly STORAGE_KEY = 'jobseek_user_settings';
  private settingsSubject = new BehaviorSubject<UserSettings>(this.loadSettings());

  settings$ = this.settingsSubject.asObservable();

  constructor() {
    // Apply theme on initialization
    this.applyTheme(this.settingsSubject.value.theme);
  }

  getSettings(): UserSettings {
    return this.settingsSubject.value;
  }

  updateSettings(settings: Partial<UserSettings>) {
    const currentSettings = this.settingsSubject.value;
    const newSettings = { ...currentSettings, ...settings };

    // If theme changed, apply it
    if (settings.theme && settings.theme !== currentSettings.theme) {
      this.applyTheme(settings.theme);
    }

    this.settingsSubject.next(newSettings);
    this.saveSettings(newSettings);
  }

  updateNotificationSetting(key: keyof UserSettings['notifications'], value: boolean) {
    const currentSettings = this.getSettings();
    this.updateSettings({
      notifications: {
        ...currentSettings.notifications,
        [key]: value
      }
    });
  }

  updateDashboardSetting(key: keyof UserSettings['dashboard'], value: any) {
    const currentSettings = this.getSettings();
    this.updateSettings({
      dashboard: {
        ...currentSettings.dashboard,
        [key]: value
      }
    });
  }

  setTheme(theme: 'light' | 'dark' | 'auto') {
    this.updateSettings({ theme });
  }

  setClockFormat(format: '12' | '24') {
    this.updateSettings({ clockFormat: format });
  }

  setDateFormat(format: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD') {
    this.updateSettings({ dateFormat: format });
  }

  resetSettings() {
    this.settingsSubject.next(DEFAULT_SETTINGS);
    this.saveSettings(DEFAULT_SETTINGS);
    this.applyTheme(DEFAULT_SETTINGS.theme);
  }

  private loadSettings(): UserSettings {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      } catch (e) {
        console.error('Failed to parse settings', e);
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  }

  private saveSettings(settings: UserSettings) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
  }

  private applyTheme(theme: 'light' | 'dark' | 'auto') {
    const body = document.body;

    if (theme === 'auto') {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      body.classList.toggle('dark-theme', prefersDark);
    } else {
      body.classList.toggle('dark-theme', theme === 'dark');
    }
  }

  // Format time based on user preference
  formatTime(date: Date): string {
    const settings = this.getSettings();
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: settings.clockFormat === '12'
    });
  }

  // Format date based on user preference
  formatDate(date: Date): string {
    const settings = this.getSettings();
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    switch (settings.dateFormat) {
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      default:
        return `${day}/${month}/${year}`;
    }
  }
}
