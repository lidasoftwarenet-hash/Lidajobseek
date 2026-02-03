import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProfilesService } from '../../services/profiles.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  loading = false;
  shareEmail = '';
  shareResult: { exists: boolean } | null = null;

  profile: any = {
    about: '',
    topSkills: '',
    activity: '',
    oldCompanies: '',
    experience: '',
    privateProjects: '',
    education: '',
    certifications: '',
    links: '',
    lastCvUrl: '',
    lastCvGeneratedAt: '',
    lastCvAi: null
  };

  constructor(
    private profilesService: ProfilesService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.loading = true;
    this.profilesService.getMyProfile().subscribe({
      next: (data) => {
        this.profile = { ...this.profile, ...data };
        this.loading = false;
      },
      error: () => {
        this.toastService.show('Failed to load profile', 'error');
        this.loading = false;
      }
    });
  }

  saveProfile() {
    this.loading = true;
    this.profilesService.updateMyProfile(this.profile).subscribe({
      next: () => {
        this.toastService.show('Profile saved successfully', 'success');
        this.loading = false;
      },
      error: () => {
        this.toastService.show('Failed to save profile', 'error');
        this.loading = false;
      }
    });
  }

  shareProfile() {
    const email = this.shareEmail.trim();
    if (!email) {
      this.toastService.show('Please enter an email address', 'warning');
      return;
    }

    this.loading = true;
    this.profilesService.shareProfile(email).subscribe({
      next: (response) => {
        this.shareResult = { exists: response.exists };
        if (response.exists) {
          this.toastService.show('Profile shared successfully', 'success');
        } else {
          this.toastService.show('User not found', 'warning');
        }
        this.loading = false;
      },
      error: () => {
        this.toastService.show('Failed to share profile', 'error');
        this.loading = false;
      }
    });
  }
}