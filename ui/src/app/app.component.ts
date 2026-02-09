import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { ToastComponent } from './components/toast/toast.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { SettingsPanelComponent } from './components/settings-panel/settings-panel.component';
import { ScrollToTopComponent } from './components/scroll-to-top/scroll-to-top.component';
import { AuthService } from './services/auth.service';
import { SettingsService } from './services/settings.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, ToastComponent, ConfirmDialogComponent, SettingsPanelComponent, ScrollToTopComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'ui';

  constructor(
    private authService: AuthService,
    private settingsService: SettingsService
  ) { }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  ngOnInit() {
    // Settings service will handle theme initialization
  }

  toggleSettings() {
    this.settingsService.toggleSettingsPanel();
  }

  logout() {
    this.authService.logout();
  }
}
