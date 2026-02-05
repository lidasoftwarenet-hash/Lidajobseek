import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProfilesService {
  private apiUrl = `${environment.apiUrl}/api/profiles`;

  constructor(private http: HttpClient) {}

  getMyProfile() {
    return this.http.get<any>(`${this.apiUrl}/me`);
  }

  getProfessionalCv(useAi: boolean) {
    const aiQuery = useAi ? 'true' : 'false';
    return this.http.get<any>(`${this.apiUrl}/me/professional-cv?ai=${aiQuery}`);
  }

  updateMyProfile(payload: any) {
    return this.http.patch<any>(`${this.apiUrl}/me`, payload);
  }

  shareProfile(email: string) {
    return this.http.post<any>(`${this.apiUrl}/share`, { email });
  }

  getAiSuggestion(field: string, currentValue?: string) {
    return this.http.post<{ suggestion: string; aiEnabled: boolean }>(
      `${this.apiUrl}/me/ai-suggestion`,
      { field, currentValue }
    );
  }

  sendCvByEmail(email: string, pdfBase64: string) {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/me/send-cv-email`,
      { email, pdfBase64 }
    );
  }
}
