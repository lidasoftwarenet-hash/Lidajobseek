import { Component, OnInit, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SettingsService, UserSettings } from '../../services/settings.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-settings-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-panel.component.html',
  styleUrls: ['./settings-panel.component.css']
})
export class SettingsPanelComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  settings!: UserSettings;
  currentUser: any = null;

  constructor(
    private settingsService: SettingsService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.settings = this.settingsService.getSettings();
    this.settingsService.settings$.subscribe(settings => {
      this.settings = settings;
    });

    // Get current user info from localStorage
    const userStr = localStorage.getItem('app_user');
    if (userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
      } catch (e) {
        console.error('Failed to parse user', e);
      }
    }
  }

  onThemeChange(theme: 'light' | 'dark' | 'auto') {
    this.settingsService.setTheme(theme);
  }

  onClockFormatChange(format: '12' | '24') {
    this.settingsService.setClockFormat(format);
  }

  onDateFormatChange(format: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD') {
    this.settingsService.setDateFormat(format);
  }

  onNotificationChange(key: keyof UserSettings['notifications'], value: boolean) {
    this.settingsService.updateNotificationSetting(key, value);
  }

  onDashboardChange(key: keyof UserSettings['dashboard'], value: any) {
    this.settingsService.updateDashboardSetting(key, value);
  }

  resetSettings() {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      this.settingsService.resetSettings();
    }
  }

  logout() {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
      this.close.emit();
    }
  }

  closePanel() {
    this.close.emit();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    this.closePanel();
  }
}
