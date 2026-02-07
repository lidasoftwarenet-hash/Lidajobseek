import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-activate-account',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './activate-account.component.html',
  styleUrl: './activate-account.component.css',
})
export class ActivateAccountComponent implements OnInit {
  state: 'loading' | 'success' | 'error' = 'loading';
  message = 'Verifying your activation link...';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!token.trim()) {
      this.state = 'error';
      this.message = 'Activation token is missing. Please use the link sent to your email.';
      return;
    }

    this.authService.activateAccount(token).subscribe({
      next: (res) => {
        this.state = 'success';
        this.message = res.message || 'Your account has been activated. You can now log in.';
      },
      error: (err) => {
        this.state = 'error';
        this.message =
          err?.error?.message ||
          'We could not activate your account. The link may be invalid or expired.';
      },
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}
