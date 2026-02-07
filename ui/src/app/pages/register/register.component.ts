import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

type ValidationErrors = {
  email?: string;
  username?: string;
  phone?: string;
  password?: string;
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  form = {
    email: '',
    username: '',
    phone: '',
    password: '',
  };

  errors: ValidationErrors = {};
  isSubmitting = false;
  isRegistered = false;

  showPopup = false;
  popupTitle = '';
  popupMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  validate(): boolean {
    const nextErrors: ValidationErrors = {};

    const email = this.form.email.trim();
    const username = this.form.username.trim();
    const phone = this.form.phone.trim();
    const password = this.form.password;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9+\-()\s]{7,20}$/;

    if (!email) nextErrors.email = 'Email is required.';
    else if (!emailRegex.test(email)) nextErrors.email = 'Please enter a valid email address.';

    if (!username) nextErrors.username = 'User name is required.';
    else if (username.length < 2) nextErrors.username = 'User name must be at least 2 characters.';

    if (!phone) nextErrors.phone = 'Phone is required.';
    else if (!phoneRegex.test(phone)) nextErrors.phone = 'Please enter a valid phone number.';

    if (!password) nextErrors.password = 'Password is required.';
    else if (password.length < 8) nextErrors.password = 'Password must be at least 8 characters.';

    this.errors = nextErrors;
    return Object.keys(nextErrors).length === 0;
  }

  submit() {
    if (this.isSubmitting) return;
    if (!this.validate()) return;

    this.isSubmitting = true;
    this.authService
      .register({
        email: this.form.email.trim(),
        username: this.form.username.trim(),
        phone: this.form.phone.trim(),
        password: this.form.password,
      })
      .subscribe({
        next: () => {
          this.isRegistered = true;
          this.isSubmitting = false;
        },
        error: (err) => {
          this.isSubmitting = false;
          this.popupTitle = 'Registration could not be completed';
          this.popupMessage =
            err?.error?.message ||
            'We were unable to create your account right now. Please review your details and try again.';
          this.showPopup = true;
        },
      });
  }

  closePopup() {
    this.showPopup = false;
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
