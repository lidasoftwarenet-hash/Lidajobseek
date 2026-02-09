import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../services/settings.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-settings-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings-panel.component.html',
  styleUrl: './settings-panel.component.css'
})
export class SettingsPanelComponent implements OnInit {
  isOpen = false;
  settings: any = {};

  constructor(
    private settingsService: SettingsService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadSettings();

    // Subscribe to settings panel state
    this.settingsService.isSettingsPanelOpen$.subscribe(isOpen => {
      this.isOpen = isOpen;
    });
  }

  loadSettings() {
    this.settings = this.settingsService.getSettings();
  }

  updateSetting(key: string, value: any) {
    // Convert string values to appropriate types
    if (key === 'fontSize') {
      value = parseInt(value, 10);
    }

    // Handle nested properties
    if (key.includes('.')) {
      const [parent, child] = key.split('.');
      const current = this.settingsService.getSettings();
      const updated: any = { ...current };
      updated[parent] = { ...updated[parent], [child]: value };
      this.settingsService.updateSettings(updated);
    } else {
      this.settingsService.updateSetting(key as any, value);
    }

    this.loadSettings();

    // Apply settings immediately
    this.applySettings(key, value);
  }

  applySettings(key: string, value: any) {
    switch(key) {
      case 'theme':
        this.applyTheme(value);
        break;
      case 'fontSize':
        this.applyFontSize(value);
        break;
      case 'highContrast':
        this.applyHighContrast(value);
        break;
      case 'reduceMotion':
        this.applyReduceMotion(value);
        break;
      case 'compactMode':
        this.applyCompactMode(value);
        break;
    }
  }

  applyTheme(theme: string) {
    const body = document.body;
    body.classList.remove('theme-light', 'theme-dark', 'theme-auto');

    if (theme === 'auto') {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
    } else {
      body.classList.add(`theme-${theme}`);
    }
  }

  applyFontSize(size: number) {
    document.documentElement.style.setProperty('--base-font-size', `${size}px`);
  }

  applyHighContrast(enabled: boolean) {
    document.body.classList.toggle('high-contrast', enabled);
  }

  applyReduceMotion(enabled: boolean) {
    document.body.classList.toggle('reduce-motion', enabled);
  }

  applyCompactMode(enabled: boolean) {
    document.body.classList.toggle('compact-mode', enabled);
  }

  closePanel() {
    this.settingsService.closeSettingsPanel();
  }

  exportData() {
    try {
      const data = {
        settings: this.settingsService.getSettings(),
        exportDate: new Date().toISOString(),
        version: '2.0.0'
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `settings-export-${Date.now()}.json`;
      link.click();
      window.URL.revokeObjectURL(url);

      this.toastService.showSuccess('Settings exported successfully');
    } catch (error) {
      this.toastService.showError('Failed to export settings');
      console.error('Export error:', error);
    }
  }

  clearData() {
    if (confirm('Are you sure you want to clear the cache? This will not delete your settings.')) {
      try {
        // Clear any cached data (localStorage items that are not settings)
        const keysToKeep = ['settings', 'auth_token'];
        const allKeys = Object.keys(localStorage);

        allKeys.forEach(key => {
          if (!keysToKeep.includes(key)) {
            localStorage.removeItem(key);
          }
        });

        // Clear session storage
        sessionStorage.clear();

        this.toastService.showSuccess('Cache cleared successfully');
      } catch (error) {
        this.toastService.showError('Failed to clear cache');
        console.error('Clear cache error:', error);
      }
    }
  }

  resetToDefaults() {
    if (confirm('Are you sure you want to reset all settings to their default values?')) {
      try {
        this.settingsService.resetSettings();
        this.loadSettings();

        // Apply all default settings
        Object.keys(this.settings).forEach(key => {
          this.applySettings(key, this.settings[key]);
        });

        this.toastService.showSuccess('Settings reset to defaults');
      } catch (error) {
        this.toastService.showError('Failed to reset settings');
        console.error('Reset error:', error);
      }
    }
  }
}
