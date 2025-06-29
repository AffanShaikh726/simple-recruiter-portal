import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { JobService } from '../../../services/job.service';
import { Job } from '../../../models/job.model';
import { LoaderComponent } from '../../shared/loader/loader.component';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [CommonModule, LoaderComponent],
  templateUrl: './job-detail.component.html',
  styleUrls: ['./job-detail.component.scss']
})
export class JobDetailComponent implements OnInit {
  job: Job | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private jobService: JobService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const jobId = params.get('id');
      if (!jobId) {
        this.error = 'Job ID not found';
        this.isLoading = false;
        return;
      }

      this.loadJobDetails(jobId);
    });
  }

  loadJobDetails(jobId: string): void {
    this.isLoading = true;
    this.jobService.getJob(jobId).subscribe({
      next: (job) => {
        this.job = job;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading job details', error);
        this.error = 'Failed to load job details. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/jobs']);
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

  getJobTypeBadgeClass(type: string | undefined): string {
    if (!type) return 'badge text-white font-bold';
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
