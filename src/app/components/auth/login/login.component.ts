import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../../services/supabase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Check if user is already logged in, but wait for auth initialization first
    this.supabaseService.waitForAuthInit().then(isInitialized => {
      console.log('Login component - Auth initialized, checking if already logged in');
      if (this.supabaseService.currentUser) {
        console.log('User already logged in, redirecting');
        this.redirectAfterLogin();
      } else {
        // Double-check with Supabase directly
        this.supabaseService.supabase.auth.getSession().then(({ data }) => {
          if (data.session) {
            console.log('Valid session found during login component init');
            this.redirectAfterLogin();
          }
        });
      }
    });
  }

  private redirectAfterLogin(): void {
    // Check for return URL in session storage
    const returnUrl = sessionStorage.getItem('returnUrl');
    if (returnUrl) {
      sessionStorage.removeItem('returnUrl');
      this.router.navigateByUrl(returnUrl);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    
    const { email, password } = this.loginForm.value;
    console.log('Attempting login for user:', email);
    
    this.supabaseService.login(email, password).subscribe({
      next: (response) => {
        console.log('Login successful in component');
        this.isLoading = false;
        
        // Check if we actually have a session
        if (response.data.session) {
          console.log('Session established, redirecting');
          // Small timeout to ensure auth state is fully updated
          setTimeout(() => this.redirectAfterLogin(), 100);
        } else {
          console.error('Login succeeded but no session was created');
          this.errorMessage = 'Authentication error. Please try again.';
        }
      },
      error: (error) => {
        console.error('Login error in component:', error);
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(error.error?.message || error.code || 'unknown');
      }
    });
  }

  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/invalid-credential':
        return 'Invalid email or password';
      case 'auth/user-disabled':
        return 'This account has been disabled';
      case 'auth/user-not-found':
        return 'No account found with this email';
      case 'auth/wrong-password':
        return 'Invalid email or password';
      default:
        return 'An error occurred during login. Please try again.';
    }
  }
}
