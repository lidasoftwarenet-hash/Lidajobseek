import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  styles: [`
    .hint-text {
      font-size: 13px;
      color: var(--text-secondary);
      margin-top: 8px;
    }
    .link-text {
      color: var(--accent-color);
      text-decoration: underline;
      cursor: pointer;
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  name = '';
  isRegister = false;
  verificationCode = '';
  error = '';

  constructor(private authService: AuthService, private router: Router) { }

  toggleMode() {
    this.isRegister = !this.isRegister;
    this.error = '';
    this.name = '';
    this.password = '';
    this.verificationCode = '';
  }

  submit() {
    this.error = '';
    if (this.isRegister) {
      if (!this.email || !this.password || !this.name || !this.verificationCode) {
        this.error = 'Please fill all fields including verification code';
        return;
      }
      this.authService.register(this.email, this.password, this.name, this.verificationCode).subscribe({
        next: () => {
          this.isRegister = false;
          this.error = 'Registration successful! Please login.';
        },
        error: (err) => {
          this.error = err.error?.message || 'Registration failed. Try again.';
        }
      });
    } else {
      if (!this.email || !this.password) {
        this.error = 'Please enter email and password';
        return;
      }
      this.authService.login(this.email, this.password).subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: () => {
          this.error = 'Invalid credentials';
        }
      });
    }
  }
}
