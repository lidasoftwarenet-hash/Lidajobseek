import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StageOptionsService {
  private readonly apiUrl = `${environment.apiUrl}/api/processes`;
  private readonly stagesSubject = new BehaviorSubject<string[]>([]);
  readonly stages$ = this.stagesSubject.asObservable();

  readonly defaultStages: string[] = [
    'Unknown',
    'Initial Call Scheduled',
    'Awaiting Next Interview (after Initial Call)',
    'Interview Scheduled',
    'Waiting for Interview Feedback',
    'Home Task Assigned',
    'References Requested',
    'Final HR Interview Scheduled',
    'Offer Received',
    'Withdrawn',
    'Rejected',
    'No Response (14+ Days)'
  ];

  readonly lockedStage = 'Unknown';

  constructor(private http: HttpClient) {}

  getCurrentStages(): string[] {
    return this.stagesSubject.value.length ? this.stagesSubject.value : [...this.defaultStages];
  }

  refreshStages(): Observable<{ stages: string[]; lockedStage: string }> {
    return this.http
      .get<{ stages: string[]; lockedStage: string }>(`${this.apiUrl}/stages`)
      .pipe(tap((res) => this.stagesSubject.next(res.stages || [...this.defaultStages])));
  }

  updateStages(stages: string[]): Observable<{ stages: string[]; movedToUnknown: number; lockedStage: string }> {
    return this.http
      .patch<{ stages: string[]; movedToUnknown: number; lockedStage: string }>(`${this.apiUrl}/stages`, { stages })
      .pipe(tap((res) => this.stagesSubject.next(res.stages || [...this.defaultStages])));
  }

  isDefaultStage(stage: string): boolean {
    return this.defaultStages.includes(stage);
  }

  isLockedStage(stage: string): boolean {
    return stage === this.lockedStage;
  }
}
