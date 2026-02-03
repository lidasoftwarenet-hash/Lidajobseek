import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProfilesService } from '../../services/profiles.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-profile-cv',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile-cv.component.html',
  styleUrls: ['./profile-cv.component.css']
})
export class ProfileCvComponent implements OnInit {
  loading = false;
  profile: any = null;
  aiProfile: any = null;
  useAi = true;

  constructor(
    private profilesService: ProfilesService,
    private toastService: ToastService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      this.useAi = params.get('ai') !== 'false';
      this.fetchProfile();
    });
  }

  fetchProfile() {
    this.loading = true;
    this.profilesService.getMyProfile().subscribe({
      next: (data) => {
        this.profile = data;
        this.fetchProfessionalCv();
      },
      error: () => {
        this.toastService.show('Failed to load CV preview', 'error');
        this.loading = false;
      }
    });
  }

  fetchProfessionalCv() {
    this.profilesService.getProfessionalCv(this.useAi).subscribe({
      next: (data) => {
        this.aiProfile = data;
        this.loading = false;
      },
      error: () => {
        this.toastService.show('DeepSeek AI preview is unavailable', 'error');
        this.loading = false;
      }
    });
  }

  loadCv(useAi: boolean) {
    this.useAi = useAi;
    this.fetchProfessionalCv();
  }
}