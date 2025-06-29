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
    
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('profiles')
        .select('full_name, phone, position')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      
      this.profileForm.patchValue({
        fullName: data?.full_name || '',
        phoneNumber: data?.phone || '',
        position: data?.position || ''
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      this.isLoading = false;
    }
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
      
      const { error } = await this.supabaseService.supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: fullName,
          phone: phoneNumber || null,
          position: position || null,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      this.updateSuccess = true;
      setTimeout(() => {
        this.updateSuccess = false;
      }, 3000);
    } catch (error: any) {
      this.updateError = error.message || 'An error occurred while updating your profile';
    } finally {
      this.isLoading = false;
    }
  }
  
  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
