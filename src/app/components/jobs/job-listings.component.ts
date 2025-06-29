import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { JobService } from '../../services/job.service';
import { Router, RouterLink } from '@angular/router';
import { LoaderComponent } from '../shared/loader/loader.component';
import { Job } from '../../models/job.model';

interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'remote';
  salary: string;
  description: string;
  requirements: string;
  datePosted: Date;
  status: 'open' | 'filled' | 'closed';
}

@Component({
  selector: 'app-job-listings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './job-listings.component.html',
  styleUrls: ['./job-listings.component.scss']
})
export class JobListingsComponent implements OnInit {
  jobs: Job[] = [];
  currentUser: any = null;
  showJobForm = false;
  isEditing = false;
  currentJobId: string | null = null;
  isLoading = false;
  jobForm: FormGroup;
  formError = '';
  searchQuery = '';
  statusFilter = 'all';
  
  // Modal state
  showDeleteModal = false;
  jobToDelete: Job | null = null;
  
  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private jobService: JobService,
    private router: Router
  ) {
    this.jobForm = this.fb.group({
      title: ['', [Validators.required]],
      company: ['', [Validators.required]],
      location: ['', [Validators.required]],
      type: ['full-time', [Validators.required]],
      salary: [''],
      description: ['', [Validators.required]],
      requirements: ['', [Validators.required]],
      status: ['open', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.checkAuthentication();
    this.loadJobs();
  }

  private checkAuthentication(): void {
    if (!this.supabaseService.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.currentUser = this.supabaseService.currentUser;
  }

  private loadJobs(): void {
    this.isLoading = true;
    this.jobService.getJobs().subscribe({
      next: (jobs) => {
        this.jobs = jobs;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading jobs', error);
        this.isLoading = false;
      }
    });
  }

  onAddNewJob(): void {
    this.showJobForm = true;
    this.isEditing = false;
    this.currentJobId = null;
    this.jobForm.reset({
      type: 'full-time',
      status: 'open'
    });
  }

  onEditJob(job: Job): void {
    if (!job.id) {
      console.error('Cannot edit job without an ID');
      return;
    }
    
    this.showJobForm = true;
    this.isEditing = true;
    this.currentJobId = job.id;
    this.jobForm.patchValue({
      title: job.title,
      company: job.company,
      location: job.location,
      type: job.type,
      salary: job.salary || '',
      description: job.description,
      requirements: job.requirements || '',
      status: job.status || 'open'
    });
    // Scroll to the form
    setTimeout(() => {
      const element = document.querySelector('.job-form-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  onDeleteJob(job: Job): void {
    const jobId = job.id;
    if (!jobId) {
      console.error('Cannot delete job without an ID');
      this.formError = 'Cannot delete job: Missing job ID';
      return;
    }
    
    this.jobToDelete = job;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.jobToDelete?.id) {
      this.formError = 'No job selected for deletion';
      this.showDeleteModal = false;
      return;
    }

    const job = this.jobToDelete;
    const jobId = job.id as string; // Ensure jobId is treated as string
    this.isLoading = true;
    this.formError = '';
    
    this.jobService.deleteJob(jobId).subscribe({
      next: () => {
        console.log('Successfully deleted job:', job.id);
        this.jobs = this.jobs.filter(j => j.id !== job.id);
        this.isLoading = false;
        this.showDeleteModal = false;
        // Show success message
        this.formError = ''; // Clear any previous errors
        // You might want to use a toast service here instead
        setTimeout(() => {
          this.formError = `Successfully deleted job: ${job.title}`;
          setTimeout(() => this.formError = '', 3000);
        }, 100);
      },
      error: (error: any) => {
        console.error('Error deleting job', error);
        this.formError = 'Failed to delete job: ' + (error?.message || 'Unknown error');
        this.isLoading = false;
        this.showDeleteModal = false;
        console.error('Full error object:', error);
      }
    });
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.jobToDelete = null;
  }

  onCancelAdd(): void {
    this.showJobForm = false;
  }

  onSubmit(): void {
    if (this.jobForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.formError = '';

    const jobData = {
      title: this.jobForm.value.title || '',
      company: this.jobForm.value.company || '',
      location: this.jobForm.value.location || '',
      type: this.jobForm.value.type || 'full-time',
      salary: this.jobForm.value.salary || '',
      description: this.jobForm.value.description || '',
      requirements: this.jobForm.value.requirements || '',
      status: this.jobForm.value.status || 'open'
    };

    if (this.isEditing && this.currentJobId) {
      // Update existing job
      this.jobService.updateJob(this.currentJobId, jobData).subscribe({
        next: (updatedJob) => {
          const index = this.jobs.findIndex(j => j.id === this.currentJobId);
          if (index !== -1) {
            this.jobs[index] = updatedJob;
          }
          this.jobForm.reset();
          this.showJobForm = false;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error updating job', error);
          this.formError = 'Failed to update job: ' + (error?.message || 'Unknown error');
          this.isLoading = false;
        }
      });
    } else {
      // Create new job
      this.jobService.createJob(jobData).subscribe({
        next: (newJob) => {
          // Add the new job to the beginning of our jobs array
          this.jobs.unshift(newJob);
          this.jobForm.reset();
          this.showJobForm = false;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error creating job', error);
          this.formError = 'Failed to create job: ' + (error?.message || 'Unknown error');
          this.isLoading = false;
        }
      });
    }
  }

  getFilteredJobs(): Job[] {
    return this.jobs.filter(job => {
      const matchesSearch = this.searchQuery === '' || 
        job.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      const matchesStatus = this.statusFilter === 'all' || job.status === this.statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }

  updateSearch(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value;
  }

  updateStatusFilter(event: Event): void {
    this.statusFilter = (event.target as HTMLSelectElement).value;
  }

  viewJobDetails(jobId: string | undefined): void {
    console.log('viewJobDetails called with jobId:', jobId);
    
    if (!jobId) {
      console.error('Cannot view job details without an ID');
      alert('Error: Job ID is missing. Cannot view details.');
      return;
    }
    
    if (!this.currentUser) {
      if (confirm('You need to be logged in to view job details. Would you like to log in now?')) {
        // Store the intended URL in session storage
        sessionStorage.setItem('returnUrl', `/jobs/${jobId}`);
        this.router.navigate(['/login']);
      }
      return;
    }
    
    console.log('Navigating to job details:', jobId);
    this.router.navigate(['/jobs', jobId]);
  }

  getStatusBadgeClass(status: string | undefined): string {
    if (!status) return 'badge badge-ghost text-white font-bold';
    switch (status) {
      case 'open':
        return 'badge badge-success text-white font-bold';
      case 'filled':
        return 'badge badge-neutral text-white font-bold';
      case 'closed':
        return 'badge badge-error text-white font-bold';
      default:
        return 'badge badge-ghost text-white font-bold';
    }
  }

  getJobTypeBadgeClass(type: string): string {
    switch (type) {
      case 'full-time': 
        return 'badge badge-primary text-white font-bold';
      case 'part-time': 
        return 'badge badge-secondary text-white font-bold';
      case 'contract': 
        return 'badge badge-accent text-white font-bold';
      case 'remote': 
        return 'badge badge-info text-white font-bold';
      default: 
        return 'badge text-white font-bold';
    }
  }
}
