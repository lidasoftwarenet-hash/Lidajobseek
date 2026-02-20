import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../services/settings.service';
import { ToastService } from '../../services/toast.service';
import { StageOptionsService } from '../../services/stage-options.service';
import countriesData from '../../../assets/countries.json';

@Component({
  selector: 'app-settings-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-panel.component.html',
  styleUrl: './settings-panel.component.css'
})
export class SettingsPanelComponent implements OnInit {
  isOpen = false;
  settings: any = {};
  countryOptions: string[] = [];
  processStages: string[] = [];
  newProcessStage = '';
  stagesLoading = false;

  constructor(
    private settingsService: SettingsService,
    private toastService: ToastService,
    public stageOptionsService: StageOptionsService,
  ) {}

  ngOnInit() {
    this.countryOptions = Object.keys(countriesData as Record<string, string[]>).sort((a, b) => a.localeCompare(b));
    this.loadSettings();

    // Subscribe to settings panel state
    this.settingsService.isSettingsPanelOpen$.subscribe(isOpen => {
      this.isOpen = isOpen;
      if (isOpen) {
        this.loadProcessStages();
      }
    });

    this.stageOptionsService.stages$.subscribe(stages => {
      this.processStages = stages?.length ? stages : [...this.stageOptionsService.defaultStages];
    });
  }

  loadProcessStages() {
    this.stagesLoading = true;
    this.stageOptionsService.refreshStages().subscribe({
      next: (res) => {
        this.processStages = res.stages || [...this.stageOptionsService.defaultStages];
        this.stagesLoading = false;
      },
      error: () => {
        this.processStages = [...this.stageOptionsService.defaultStages];
        this.stagesLoading = false;
        this.toastService.showError('Could not load process stages');
      }
    });
  }

  addProcessStage() {
    const value = this.newProcessStage.trim();
    if (!value) return;
    if (this.processStages.includes(value)) {
      this.toastService.showWarning('Stage already exists');
      return;
    }

    const next = [...this.processStages, value];
    this.stageOptionsService.updateStages(next).subscribe({
      next: (res) => {
        this.processStages = res.stages;
        this.newProcessStage = '';
        this.toastService.showSuccess('Stage added');
      },
      error: () => this.toastService.showError('Failed to add stage')
    });
  }

  removeProcessStage(stage: string) {
    if (this.stageOptionsService.isLockedStage(stage)) {
      this.toastService.showWarning(`'${this.stageOptionsService.lockedStage}' cannot be removed`);
      return;
    }

    const next = this.processStages.filter(s => s !== stage);
    this.stageOptionsService.updateStages(next).subscribe({
      next: (res) => {
        this.processStages = res.stages;
        if (res.movedToUnknown > 0) {
          this.toastService.showInfo(`${res.movedToUnknown} process(es) moved to ${res.lockedStage}`);
        } else {
          this.toastService.showSuccess('Stage removed');
        }
      },
      error: () => this.toastService.showError('Failed to remove stage')
    });
  }

  resetProcessStages() {
    this.stageOptionsService.updateStages(this.stageOptionsService.defaultStages).subscribe({
      next: (res) => {
        this.processStages = res.stages;
        if (res.movedToUnknown > 0) {
          this.toastService.showInfo(`Reset done. ${res.movedToUnknown} process(es) moved to ${res.lockedStage}`);
        } else {
          this.toastService.showSuccess('Process stages reset to defaults');
        }
      },
      error: () => this.toastService.showError('Failed to reset stages')
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
    body.classList.remove('theme-light', 'theme-dark', 'theme-auto', 'dark-theme', 'light-theme');

    if (theme === 'auto') {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
      body.classList.add(prefersDark ? 'dark-theme' : 'light-theme');
    } else {
      body.classList.add(`theme-${theme}`);
      body.classList.add(theme === 'dark' ? 'dark-theme' : 'light-theme');
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
        const keysToKeep = ['settings'];
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

  saveSettings() {
    try {
      // Ensure all current settings are persisted
      this.settingsService.updateSettings(this.settings);

      // Apply all settings to the UI
      Object.keys(this.settings).forEach(key => {
        if (key === 'notifications') {
          // Handle nested notification settings
          Object.keys(this.settings.notifications || {}).forEach(notifKey => {
            this.applySettings(`notifications.${notifKey}`, this.settings.notifications[notifKey]);
          });
        } else {
          this.applySettings(key, this.settings[key]);
        }
      });

      this.toastService.showSuccess('Settings saved successfully');
      this.closePanel();
    } catch (error) {
      this.toastService.showError('Failed to save settings');
      console.error('Save settings error:', error);
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
