import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { ToastComponent } from './components/toast/toast.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { SettingsPanelComponent } from './components/settings-panel/settings-panel.component';
import { ScrollToTopComponent } from './components/scroll-to-top/scroll-to-top.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, ToastComponent, ConfirmDialogComponent, SettingsPanelComponent, ScrollToTopComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'ui';
  showSettings = false;

  constructor(
    private authService: AuthService
  ) { }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  ngOnInit() {
    // Settings service will handle theme initialization
  }

  toggleSettings() {
    this.showSettings = !this.showSettings;
  }

  closeSettings() {
    this.showSettings = false;
  }

  logout() {
    this.authService.logout();
  }
}
