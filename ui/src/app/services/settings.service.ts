import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Settings {
  theme: 'light' | 'dark' | 'auto';
  clockFormat: '12' | '24';
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  country: string;
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

  private defaultSettings: Settings = {
    theme: 'light',
    clockFormat: '24',
    dateFormat: 'DD/MM/YYYY',
    country: '',
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

  constructor() {
    this.initializeSettings();
  }

  private initializeSettings() {
    const settings = this.loadSettings();
    this.applySettings(settings);
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
    } catch (error) {
      console.error('Error saving settings:', error);
    }
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
    const body = document.body;
    body.classList.remove('theme-light', 'theme-dark', 'theme-auto');

    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');

      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (this.getSettings().theme === 'auto') {
          body.classList.remove('theme-light', 'theme-dark');
          body.classList.add(e.matches ? 'theme-dark' : 'theme-light');
        }
      });
    } else {
      body.classList.add(`theme-${theme}`);
    }
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
