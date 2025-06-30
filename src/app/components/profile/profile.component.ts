import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { Router } from '@angular/router';
import { LoaderComponent } from '../shared/loader/loader.component';
import { PostgrestError } from '@supabase/supabase-js';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoaderComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  isLoading = false;
  updateSuccess = false;
  updateError = '';
  currentUser: any = null;

  constructor(
    private fb: FormBuilder,
    public supabaseService: SupabaseService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      fullName: ['', Validators.required],
      email: [{ value: '', disabled: true }],
      phoneNumber: ['', [Validators.pattern(/^[0-9]{10}$/)]],
      position: ['']
    });
  }

  ngOnInit(): void {
    this.checkAuthentication();
  }

  private async checkAuthentication(): Promise<void> {
    const user = this.supabaseService.currentUser;
    
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.currentUser = user;
    this.isLoading = true;
    
    // Set the email immediately from the current user
    this.profileForm.patchValue({
      email: user.email || ''
    });
    
    // First ensure a profile exists for this user
    this.supabaseService.ensureUserProfileExists().subscribe({
      next: (profile) => {
        // Now get the profile (which should definitely exist now)
        this.supabaseService.getUserProfile(user.id).subscribe({
          next: (profile) => {
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
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        this.isLoading = false;
      }
    });
  }

  async onSubmit(): Promise<void> {
    if (this.profileForm.invalid) {
      return;
    }

    const user = this.supabaseService.currentUser;
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;
    this.updateError = '';
    this.updateSuccess = false;

    try {
      const { fullName, phoneNumber, position } = this.profileForm.value;
      
      // Use the service method instead of direct Supabase call
      const profileData = {
        user_id: user.id,
        full_name: fullName,
        phone: phoneNumber || null,
        position: position || null,
        updated_at: new Date().toISOString()
      };
      
      // Use the service method that properly handles update vs insert
      this.supabaseService.updateUserProfile(profileData).subscribe({
        next: (data) => {
          console.log('Profile updated successfully:', data);
          this.updateSuccess = true;
          setTimeout(() => {
            this.updateSuccess = false;
          }, 3000);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          this.updateError = error.message || 'An error occurred while updating your profile';
          this.isLoading = false;
        }
      });
    } catch (error: any) {
      this.updateError = error.message || 'An error occurred while updating your profile';
      this.isLoading = false;
    }
  }
  
  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
