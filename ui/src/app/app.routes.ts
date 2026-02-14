import { Routes } from '@angular/router';
import { ProcessListComponent } from './pages/process-list/process-list.component';
import { ProcessCreateComponent } from './pages/process-create/process-create.component';
import { ProcessDetailsComponent } from './pages/process-details/process-details.component';
import { InteractionCreateComponent } from './pages/interaction-create/interaction-create.component';
import { ReviewCreateComponent } from './pages/review-create/review-create.component';
import { ProcessEditComponent } from './pages/process-edit/process-edit.component';
import { InteractionEditComponent } from './pages/interaction-edit/interaction-edit.component';
import { ReviewEditComponent } from './pages/review-edit/review-edit.component';
import { AnalyticsComponent } from './pages/analytics/analytics.component';
import { CoachHubComponent } from './pages/coach-hub/coach-hub.component';
import { DecisionBoardComponent } from './pages/decision-board/decision-board.component';
import { CalendarComponent } from './pages/calendar/calendar.component';
import { ScheduleInterviewComponent } from './pages/schedule-interview/schedule-interview.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ActivateAccountComponent } from './pages/activate-account/activate-account.component';
import { PricingComponent } from './pages/pricing/pricing.component';
import { AuthGuard } from './guards/auth.guard';
import { unsavedChangesGuard } from './guards/unsaved-changes.guard';
import { ProfileComponent } from './pages/profile/profile.component';
import { ProfileCvComponent } from './pages/profile-cv/profile-cv.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'activate-account', component: ActivateAccountComponent },
    { path: 'pricing', component: PricingComponent },
    {
        path: '',
        canActivate: [AuthGuard],
        children: [
            { path: '', component: ProcessListComponent },
            { path: 'analytics', component: AnalyticsComponent },
            { path: 'decision-board', component: DecisionBoardComponent },
            { path: 'coach-hub', component: CoachHubComponent },
            { path: 'calendar', component: CalendarComponent },
            {
                path: 'schedule-interview',
                component: ScheduleInterviewComponent,
                canDeactivate: [unsavedChangesGuard]
            },
            { path: 'profile', component: ProfileComponent },
            { path: 'profile/cv', component: ProfileCvComponent },
            {
                path: 'new',
                component: ProcessCreateComponent,
                canDeactivate: [unsavedChangesGuard]
            },
            { path: 'process/:id', component: ProcessDetailsComponent },
            {
                path: 'process/:id/edit',
                component: ProcessEditComponent,
                canDeactivate: [unsavedChangesGuard]
            },
            {
                path: 'process/:id/interaction/new',
                component: InteractionCreateComponent,
                canDeactivate: [unsavedChangesGuard]
            },
            {
                path: 'process/:pid/interaction/:id/edit',
                component: InteractionEditComponent,
                canDeactivate: [unsavedChangesGuard]
            },
            {
                path: 'process/:id/review/new',
                component: ReviewCreateComponent,
                canDeactivate: [unsavedChangesGuard]
            },
            {
                path: 'process/:pid/review/:id/edit',
                component: ReviewEditComponent,
                canDeactivate: [unsavedChangesGuard]
            }
        ]
    }
];
