import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { ToastComponent } from './components/toast/toast.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { SettingsPanelComponent } from './components/settings-panel/settings-panel.component';
import { ShortcutsModalComponent } from './components/shortcuts-modal/shortcuts-modal.component';
import { ScrollToTopComponent } from './components/scroll-to-top/scroll-to-top.component';
import { AuthService } from './services/auth.service';
import { SettingsService } from './services/settings.service';
import { KeyboardShortcutsService } from './services/keyboard-shortcuts.service';
import { ToastService } from './services/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, ToastComponent, ConfirmDialogComponent, SettingsPanelComponent, ShortcutsModalComponent, ScrollToTopComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'ui';
  showSettings = false;
  showShortcuts = false;

  constructor(
    private authService: AuthService,
    private settingsService: SettingsService,
    private keyboardShortcuts: KeyboardShortcutsService,
    private toastService: ToastService
  ) { }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  ngOnInit() {
    // Settings service will handle theme initialization
    this.setupShortcutNotifications();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Press ? to show shortcuts modal
    if (event.key === '?' && !this.isTypingInInput(event)) {
      event.preventDefault();
      this.showShortcuts = true;
    }

    // Press Escape to close modals
    if (event.key === 'Escape') {
      if (this.showShortcuts) {
        this.showShortcuts = false;
      } else if (this.showSettings) {
        this.showSettings = false;
      }
    }
  }

  private isTypingInInput(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement;
    return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
  }

  private setupShortcutNotifications() {
    this.keyboardShortcuts.shortcutTriggered$.subscribe(description => {
      this.toastService.show(description, 'info');
    });
  }

  toggleShortcuts() {
    this.showShortcuts = !this.showShortcuts;
  }

  closeShortcuts() {
    this.showShortcuts = false;
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
