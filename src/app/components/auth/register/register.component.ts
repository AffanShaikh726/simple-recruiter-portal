import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../../services/supabase.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showVerificationModal = false;

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.checkPasswords });
  }

  checkPasswords(group: FormGroup) { 
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { notSame: true };
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    
    const { fullName, email, password } = this.registerForm.value;
    
    this.supabaseService.register(email, password).subscribe({
      next: (response) => {
        // After successful registration, create a profile for the user
        if (response && response.data.user) {
          const userId = response.data.user.id;
          
          // Create profile data
          const profileData = {
            user_id: userId,
            full_name: fullName,
            updated_at: new Date().toISOString()
          };
          
          // Create the profile using the service method
          this.supabaseService.updateUserProfile(profileData).subscribe({
            next: (profileData) => {
              console.log('Profile created successfully:', profileData);
              this.isLoading = false;
              this.showVerificationModal = true;
            },
            error: (profileError) => {
              console.error('Error creating profile:', profileError);
              this.isLoading = false;
              this.showVerificationModal = true; // Still show verification modal even if profile creation fails
            }
          });
        } else {
          this.isLoading = false;
          this.showVerificationModal = true;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(error.code);
      }
    });
  }

  closeVerificationModal(): void {
    this.showVerificationModal = false;
    this.router.navigate(['/dashboard']);
  }

  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'This email is already in use';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/operation-not-allowed':
        return 'Email/password registration is not enabled';
      case 'auth/weak-password':
        return 'Password is too weak. Please choose a stronger password.';
      default:
        return 'An error occurred during registration. Please try again.';
    }
  }
}
