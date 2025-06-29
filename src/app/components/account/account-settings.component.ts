import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { Router } from '@angular/router';
import { LoaderComponent } from '../shared/loader/loader.component';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoaderComponent],
  templateUrl: './account-settings.component.html',
  styleUrl: './account-settings.component.scss'
})
export class AccountSettingsComponent implements OnInit {
  profileForm: FormGroup;
  currentUser: any = null;
  isLoading = false;
  updateSuccess = false;
  updateError = '';

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: [{ value: '', disabled: true }],
      phoneNumber: ['', [Validators.pattern(/^[0-9]{10}$/)]],
      position: ['']
    });
  }

  ngOnInit(): void {
    this.checkAuthentication();
  }

  private checkAuthentication(): void {
    if (!this.supabaseService.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.currentUser = this.supabaseService.currentUser;
    
    // Populate form with current user data if available
    this.profileForm.patchValue({
      email: this.currentUser.email || '',
      fullName: this.currentUser.displayName || '',
      phoneNumber: this.currentUser.phoneNumber || ''
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.updateSuccess = false;
    this.updateError = '';

    // In a real application, you would update the user profile in Supabase
    // For now, we'll just simulate a successful update
    setTimeout(() => {
      this.isLoading = false;
      this.updateSuccess = true;
    }, 1000);
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
