import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  currentUser: any = null;
  isLoading = false;
  uploadForm: FormGroup;
  uploadMessage = '';
  uploadError = '';
  uploadSuccess = false;
  uploadedFiles: {name: string, url: string, date: Date}[] = [];

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private supabaseService: SupabaseService
  ) {
    this.uploadForm = this.fb.group({
      file: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.checkAuthentication();
    this.loadUploadedFiles();
  }

  private loadUploadedFiles(): void {
    if (!this.supabaseService.currentUser) return;
    
    this.isLoading = true;
    this.supabaseService.listFiles().subscribe({
      next: (files) => {
        this.uploadedFiles = files;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading files:', error);
        this.uploadError = 'Failed to load uploaded files';
        this.isLoading = false;
      }
    });
  }

  private checkAuthentication(): void {
    if (!this.supabaseService.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.currentUser = this.supabaseService.currentUser;
  }

  onFileChange(event: any): void {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      // Store the actual File object directly
      this.uploadForm.patchValue({
        file: file
      });
      // Log to verify file is captured correctly
      console.log('File selected:', file.name, file.type, file.size);
    }
  }

  onUpload(): void {
    if (this.uploadForm.invalid) {
      return;
    }
    
    // Check if user is authenticated
    if (!this.supabaseService.currentUser) {
      this.uploadError = 'You must be logged in to upload files';
      console.error('Upload error: User not authenticated');
      return;
    }
    
    // Log authentication status
    console.log('Auth status:', !!this.supabaseService.currentUser, 'User:', this.supabaseService.currentUser);

    this.isLoading = true;
    this.uploadMessage = 'Uploading file...';
    this.uploadError = '';
    this.uploadSuccess = false;

    // Get the file from the form
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput?.files?.[0];
  
    if (!file) {
      this.isLoading = false;
      this.uploadError = 'No file selected';
      return;
    }
  
    // Use the simplest possible path
    const filePath = file.name;
    
    // Log the path to verify
    console.log('Uploading to path:', filePath);

    this.supabaseService.uploadFile(file, filePath).subscribe({
      next: (result) => {
        this.supabaseService.getFileUrl(filePath).subscribe({
          next: (url) => {
            this.isLoading = false;
            this.uploadSuccess = true;
            this.uploadMessage = 'File uploaded successfully!';
            
            // Add to uploaded files list
            this.uploadedFiles.unshift({
              name: file.name,
              url: url,
              date: new Date()
            });
            
            // Reset form
            this.uploadForm.reset();
          },
          error: (error) => {
            this.isLoading = false;
            this.uploadError = 'Failed to get download URL';
            console.error('Error getting download URL:', error);
          }
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.uploadError = 'Failed to upload file';
        console.error('Error uploading file:', error);
      }
    });
  }

  logout() {
    this.supabaseService.logout().subscribe({
      next: () => {
        console.log('Logged out successfully');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
      }
    });
  }
}
