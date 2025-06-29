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
    this.isLoading = true;
    
    // First, set the email from the auth user
    this.profileForm.patchValue({
      email: this.currentUser.email || ''
    });
    
    // Then fetch the user profile from the database
    this.supabaseService.getUserProfile(this.currentUser.id).subscribe({
      next: (profile) => {
        console.log('Fetched user profile:', profile);
        if (profile) {
          // Update form with profile data from database
          this.profileForm.patchValue({
            fullName: profile.full_name || '',
            phoneNumber: profile.phone || '',
            position: profile.position || ''
          });
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching profile:', error);
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.updateSuccess = false;
    this.updateError = '';

    // Get form values
    const formValues = this.profileForm.getRawValue();
    
    // Create profile object to update
    const profileData = {
      user_id: this.currentUser.id,
      full_name: formValues.fullName,
      phone: formValues.phoneNumber,
      position: formValues.position,
      updated_at: new Date().toISOString()
    };
    
    // Update the profile in Supabase
    this.supabaseService.updateUserProfile(profileData).subscribe({
      next: (data) => {
        console.log('Profile updated successfully:', data);
        this.isLoading = false;
        this.updateSuccess = true;
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.isLoading = false;
        this.updateError = 'Failed to update profile. Please try again.';
      }
    });
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
