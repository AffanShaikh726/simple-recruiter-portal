import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { CandidateService } from '../../services/candidate.service';
import { Router, RouterLink } from '@angular/router';
import { LoaderComponent } from '../shared/loader/loader.component';
import { Candidate } from '../../models/candidate.model';

@Component({
  selector: 'app-candidates',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoaderComponent],
  templateUrl: './candidates.component.html',
  styleUrls: ['./candidates.component.scss']
})
export class CandidatesComponent implements OnInit {
  candidates: Candidate[] = [];
  currentUser: any = null;
  candidateForm: FormGroup;
  isLoading = false;
  isAddingCandidate = false;
  isEditing = false;
  currentCandidateId: string | null = null;
  formError = '';
  searchQuery = '';
  statusFilter = 'all';
  showDeleteModal = false;
  candidateToDelete: Candidate | null = null;
  
  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private candidateService: CandidateService,
    private router: Router
  ) {
    this.candidateForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^[0-9]{10}$/)]],
      position: ['', [Validators.required]],
      status: ['new', [Validators.required]],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.checkAuthentication();
    this.loadCandidates();
  }

  private checkAuthentication(): void {
    if (!this.supabaseService.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.currentUser = this.supabaseService.currentUser;
  }

  private loadCandidates(): void {
    this.isLoading = true;
    this.candidateService.getCandidates().subscribe({
      next: (candidates) => {
        this.candidates = candidates;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading candidates', error);
        this.isLoading = false;
      }
    });
  }

  onAddNewCandidate(): void {
    this.isAddingCandidate = true;
    this.isEditing = false;
    this.currentCandidateId = null;
    this.candidateForm.reset({
      status: 'new'
    });
  }

  onCancelAdd(): void {
    this.isAddingCandidate = false;
  }

  onEditCandidate(candidate: Candidate): void {
    if (!candidate.id) {
      console.error('Cannot edit candidate without an ID');
      return;
    }
    
    this.isAddingCandidate = true;
    this.isEditing = true;
    this.currentCandidateId = candidate.id;
    this.candidateForm.patchValue({
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone || '',
      position: candidate.position,
      status: candidate.status || 'new',
      notes: candidate.notes || ''
    });
    
    // Scroll to the form
    setTimeout(() => {
      const element = document.querySelector('form');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  onDeleteCandidate(candidate: Candidate): void {
    this.candidateToDelete = candidate;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.candidateToDelete?.id) {
      this.formError = 'No candidate selected for deletion';
      this.showDeleteModal = false;
      return;
    }

    const candidate = this.candidateToDelete;
    const candidateId = candidate.id as string;
    this.isLoading = true;
    this.formError = '';
    
    this.candidateService.deleteCandidate(candidateId).subscribe({
      next: () => {
        console.log('Successfully deleted candidate:', candidate.id);
        this.candidates = this.candidates.filter(c => c.id !== candidate.id);
        this.isLoading = false;
        this.showDeleteModal = false;
        this.formError = '';
        setTimeout(() => {
          this.formError = `Successfully deleted candidate: ${candidate.name}`;
          setTimeout(() => this.formError = '', 3000);
        }, 100);
      },
      error: (error: any) => {
        console.error('Error deleting candidate', error);
        this.formError = 'Failed to delete candidate: ' + (error?.message || 'Unknown error');
        this.isLoading = false;
        this.showDeleteModal = false;
      }
    });
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.candidateToDelete = null;
  }

  viewCandidateDetails(candidateId: string | undefined): void {
    console.log('viewCandidateDetails called with candidateId:', candidateId);
    
    if (!candidateId) {
      console.error('Cannot view candidate details without an ID');
      alert('Error: Candidate ID is missing. Cannot view details.');
      return;
    }
    
    if (!this.currentUser) {
      if (confirm('You need to be logged in to view candidate details. Would you like to log in now?')) {
        // Store the intended URL in session storage
        sessionStorage.setItem('returnUrl', `/candidates/${candidateId}`);
        this.router.navigate(['/login']);
      }
      return;
    }
    
    console.log('Navigating to candidate details:', candidateId);
    this.router.navigate(['/candidates', candidateId]);
  }

  onSubmit(): void {
    if (this.candidateForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.formError = '';

    const candidateData = {
      name: this.candidateForm.value.name,
      email: this.candidateForm.value.email,
      phone: this.candidateForm.value.phone,
      position: this.candidateForm.value.position,
      status: this.candidateForm.value.status || 'new',
      notes: this.candidateForm.value.notes,
      resumeUrl: undefined
    };

    if (this.isEditing && this.currentCandidateId) {
      // Update existing candidate
      this.candidateService.updateCandidate(this.currentCandidateId, candidateData).subscribe({
        next: (updatedCandidate) => {
          const index = this.candidates.findIndex(c => c.id === updatedCandidate.id);
          if (index !== -1) {
            this.candidates[index] = updatedCandidate;
          }
          this.candidateForm.reset();
          this.isAddingCandidate = false;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error updating candidate', error);
          this.formError = 'Failed to update candidate: ' + (error.message || 'Unknown error');
          this.isLoading = false;
        }
      });
    } else {
      // Create new candidate
      this.candidateService.createCandidate(candidateData).subscribe({
        next: (newCandidate) => {
          this.candidates.unshift(newCandidate);
          this.candidateForm.reset();
          this.isAddingCandidate = false;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error creating candidate', error);
          this.formError = 'Failed to create candidate: ' + (error.message || 'Unknown error');
          this.isLoading = false;
        }
      });
    }
  }

  getFilteredCandidates(): Candidate[] {
    return this.candidates.filter(candidate => {
      const matchesSearch = this.searchQuery === '' || 
        candidate.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        candidate.email.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        candidate.position.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      const matchesStatus = this.statusFilter === 'all' || candidate.status === this.statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }

  updateSearch(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value;
  }

  updateStatusFilter(event: Event): void {
    this.statusFilter = (event.target as HTMLSelectElement).value;
  }

  getStatusBadgeClass(status: string | undefined): string {
    if (!status) return 'badge badge-ghost text-white font-bold';
    switch (status) {
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
        return 'badge text-white font-bold';
    }
  }
}
