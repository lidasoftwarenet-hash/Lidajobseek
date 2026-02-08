import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, SocialProvider } from '../../services/auth.service';
import getAllCountries from 'country-list-with-dial-code-and-flag';

type ValidationErrors = {
  email?: string;
  username?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
};

type CountryOption = {
  name: string;
  dialCode: string;
  isoCode: string;
  flagUrl: string;
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
    countryCode: '',
    phone: '',
    password: '',
    confirmPassword: '',
  };

  errors: ValidationErrors = {};
  isSubmitting = false;
  isRegistered = false;
  countries: CountryOption[] = getAllCountries
    .getAll()
    .map((country) => ({
      name: country.name,
      dialCode: country.dialCode,
      isoCode: country.code,
      flagUrl: this.buildFlagUrl(country.code),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  isCountryMenuOpen = false;

  showPopup = false;
  popupTitle = '';
  popupMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private elementRef: ElementRef,
  ) {
    this.form.countryCode = this.countries.find((country) => country.dialCode === '+1')?.dialCode ?? this.countries[0]?.dialCode ?? '+1';
  }

  get selectedCountry(): CountryOption | undefined {
    return this.countries.find((country) => country.dialCode === this.form.countryCode) ?? this.countries[0];
  }

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

    if (phone && !phoneRegex.test(phone)) {
      nextErrors.phone = 'Please enter a valid phone number.';
    }

    if (!password) nextErrors.password = 'Password is required.';
    else if (password.length < 8) nextErrors.password = 'Password must be at least 8 characters.';

    if (!this.form.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (this.form.confirmPassword !== password) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

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
        phone: this.form.phone.trim() ? `${this.form.countryCode} ${this.form.phone.trim()}` : '',
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

  continueWith(provider: SocialProvider) {
    const result = this.authService.startSocialAuth(provider, 'register');
    if (result.status === 'redirected') return;

    const providerLabel = provider.charAt(0).toUpperCase() + provider.slice(1);
    this.popupTitle = `${providerLabel} sign up in development mode`;
    this.popupMessage = `${result.message}\n\nPrepared backend route:\n${result.redirectUrl}`;
    this.showPopup = true;
  }

  toggleCountryMenu() {
    this.isCountryMenuOpen = !this.isCountryMenuOpen;
  }

  selectCountry(country: CountryOption) {
    this.form.countryCode = country.dialCode;
    this.isCountryMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const hostElement = this.elementRef.nativeElement as HTMLElement;
    if (!hostElement.contains(event.target as Node)) {
      this.isCountryMenuOpen = false;
    }
  }

  private buildFlagUrl(isoCode: string): string {
    const code = (isoCode || '').toLowerCase();
    return /^[a-z]{2}$/.test(code) ? `https://flagcdn.com/24x18/${code}.png` : 'https://flagcdn.com/24x18/un.png';
  }
}
