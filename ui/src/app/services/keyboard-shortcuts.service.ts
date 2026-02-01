import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  description: string;
  action: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class KeyboardShortcutsService {
  private shortcuts: KeyboardShortcut[] = [];
  private shortcutTriggered = new Subject<string>();

  shortcutTriggered$ = this.shortcutTriggered.asObservable();

  constructor(private router: Router) {
    this.initializeDefaultShortcuts();
    this.setupEventListener();
  }

  private initializeDefaultShortcuts() {
    this.registerShortcut({
      key: 'n',
      ctrl: true,
      description: 'Create new process',
      action: () => this.router.navigate(['/new'])
    });

    this.registerShortcut({
      key: 'h',
      ctrl: true,
      description: 'Go to home',
      action: () => this.router.navigate(['/'])
    });

    this.registerShortcut({
      key: 'a',
      ctrl: true,
      description: 'Go to analytics',
      action: () => this.router.navigate(['/analytics'])
    });

    this.registerShortcut({
      key: 'c',
      ctrl: true,
      description: 'Go to calendar',
      action: () => this.router.navigate(['/calendar'])
    });

    this.registerShortcut({
      key: 'k',
      ctrl: true,
      description: 'Go to coach hub',
      action: () => this.router.navigate(['/coach-hub'])
    });

    this.registerShortcut({
      key: '/',
      ctrl: true,
      description: 'Focus search',
      action: () => {
        const searchInput = document.querySelector<HTMLInputElement>('.search-input');
        if (searchInput) {
          searchInput.focus();
        }
      }
    });
  }

  registerShortcut(shortcut: KeyboardShortcut) {
    this.shortcuts.push(shortcut);
  }

  private setupEventListener() {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow Ctrl+A for select all in inputs
        if (event.key.toLowerCase() === 'a' && event.ctrlKey) {
          return;
        }
        return;
      }

      const matchingShortcut = this.shortcuts.find(shortcut => {
        return (
          shortcut.key.toLowerCase() === event.key.toLowerCase() &&
          !!shortcut.ctrl === (event.ctrlKey || event.metaKey) &&
          !!shortcut.alt === event.altKey &&
          !!shortcut.shift === event.shiftKey
        );
      });

      if (matchingShortcut) {
        event.preventDefault();
        matchingShortcut.action();
        this.shortcutTriggered.next(matchingShortcut.description);
      }
    });
  }

  getShortcuts(): KeyboardShortcut[] {
    return this.shortcuts;
  }

  getShortcutDisplay(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.shift) parts.push('Shift');
    parts.push(shortcut.key.toUpperCase());
    return parts.join(' + ');
  }
}
