import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  @Input() isAuthenticated: boolean = false;
  @Input() showSettings: boolean = false;
  @Output() toggleSettings = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
}