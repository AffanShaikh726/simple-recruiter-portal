import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CandidateService } from '../../../services/candidate.service';
import { Candidate } from '../../../models/candidate.model';
import { LoaderComponent } from '../../shared/loader/loader.component';

@Component({
  selector: 'app-candidate-detail',
  standalone: true,
  imports: [CommonModule, LoaderComponent],
  templateUrl: './candidate-detail.component.html',
  styleUrls: ['./candidate-detail.component.scss']
})
export class CandidateDetailComponent implements OnInit {
  candidateId: string | null = null;
  candidate: Candidate | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private candidateService: CandidateService
  ) {}

  ngOnInit(): void {
    this.candidateId = this.route.snapshot.paramMap.get('id');
    if (this.candidateId) {
      this.loadCandidateDetails(this.candidateId);
    } else {
      this.error = 'Candidate ID not found';
      this.isLoading = false;
    }
  }

  loadCandidateDetails(id: string): void {
    this.isLoading = true;
    this.candidateService.getCandidate(id).subscribe({
      next: (candidate) => {
        this.candidate = candidate;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading candidate details:', error);
        this.error = 'Failed to load candidate details. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  getStatusBadgeClass(status: string | undefined): string {
    if (!status) return 'badge badge-ghost text-white font-bold';
    switch (status.toLowerCase()) {
      case 'new':
        return 'badge badge-neutral text-white font-bold';
      case 'contacted':
        return 'badge badge-primary text-white font-bold';
      case 'interviewing':
        return 'badge badge-secondary text-white font-bold';
      case 'offered':
        return 'badge badge-warning text-white font-bold';
      case 'hired':
        return 'badge badge-success text-white font-bold';
      case 'rejected':
        return 'badge badge-error text-white font-bold';
      default:
        return 'badge badge-ghost text-white font-bold';
    }
  }

  goBack(): void {
    this.router.navigate(['/candidates']);
  }
}
