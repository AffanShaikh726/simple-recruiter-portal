import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AccountSettingsComponent } from './components/account/account-settings.component';
import { CandidatesComponent } from './components/candidates/candidates.component';
import { CandidateDetailComponent } from './components/candidates/candidate-detail/candidate-detail.component';
import { JobListingsComponent } from './components/jobs/job-listings.component';
import { JobDetailComponent } from './components/jobs/job-detail/job-detail.component';
import { ProfileComponent } from './components/profile/profile.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'account/settings', component: AccountSettingsComponent, canActivate: [authGuard] },
  { path: 'candidates', component: CandidatesComponent, canActivate: [authGuard] },
  { path: 'candidates/:id', component: CandidateDetailComponent, canActivate: [authGuard] },
  { path: 'jobs', component: JobListingsComponent, canActivate: [authGuard] },
  { path: 'jobs/:id', component: JobDetailComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '/login' } // Redirect to login for unknown paths
];
