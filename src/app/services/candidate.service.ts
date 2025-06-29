import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Observable, from, map } from 'rxjs';
import { Candidate, CandidateInsert } from '../models/candidate.model';

@Injectable({
  providedIn: 'root'
})
export class CandidateService {
  
  constructor(private supabaseService: SupabaseService) { }
  
  // Get all candidates for the current user
  getCandidates(): Observable<Candidate[]> {
    // Get current user ID from SupabaseService
    const userId = this.supabaseService.currentUser?.id;
    
    if (!userId) {
      throw new Error('User is not authenticated');
    }
    
    return from(
      this.supabaseService.supabase
        .from('candidates')
        .select('*')
        .eq('user_id', userId) // Only get candidates for the current user
        .order('date_added', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        
        // Transform the data to match our Candidate interface
        return response.data.map(candidate => ({
          id: candidate.id,
          name: candidate.name,
          email: candidate.email,
          phone: candidate.phone,
          position: candidate.position,
          status: candidate.status,
          notes: candidate.notes,
          resumeUrl: candidate.resume_url,
          dateAdded: new Date(candidate.date_added),
          userId: candidate.user_id
        }));
      })
    );
  }
  
  // Get a specific candidate by ID
  getCandidate(id: string): Observable<Candidate> {
    return from(
      this.supabaseService.supabase
        .from('candidates')
        .select('*')
        .eq('id', id)
        .single()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        const candidate = response.data;
        
        return {
          id: candidate.id,
          name: candidate.name,
          email: candidate.email,
          phone: candidate.phone,
          position: candidate.position,
          status: candidate.status,
          notes: candidate.notes,
          resumeUrl: candidate.resume_url,
          dateAdded: new Date(candidate.date_added),
          userId: candidate.user_id
        };
      })
    );
  }
  
  // Create a new candidate
  createCandidate(candidate: CandidateInsert): Observable<Candidate> {
    // Get current user ID from SupabaseService
    const userId = this.supabaseService.currentUser?.id;
    
    if (!userId) {
      throw new Error('User is not authenticated');
    }
    
    // Convert our CandidateInsert to the DB format with snake_case
    const candidateData = {
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      position: candidate.position,
      status: candidate.status || 'new',
      notes: candidate.notes,
      resume_url: candidate.resumeUrl,
      user_id: userId
    };
    
    return from(
      this.supabaseService.supabase
        .from('candidates')
        .insert(candidateData)
        .select()
        .single()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        const newCandidate = response.data;
        
        return {
          id: newCandidate.id,
          name: newCandidate.name,
          email: newCandidate.email,
          phone: newCandidate.phone,
          position: newCandidate.position,
          status: newCandidate.status,
          notes: newCandidate.notes,
          resumeUrl: newCandidate.resume_url,
          dateAdded: new Date(newCandidate.date_added),
          userId: newCandidate.user_id
        };
      })
    );
  }
  
  // Update an existing candidate
  updateCandidate(id: string, updates: Partial<Candidate>): Observable<Candidate> {
    // Convert our updates to the DB format with snake_case as needed
    const updateData: any = {
      ...(updates.name && { name: updates.name }),
      ...(updates.email && { email: updates.email }),
      ...(updates.phone && { phone: updates.phone }),
      ...(updates.position && { position: updates.position }),
      ...(updates.status && { status: updates.status }),
      ...(updates.notes && { notes: updates.notes }),
      ...(updates.resumeUrl && { resume_url: updates.resumeUrl }),
      updated_at: new Date().toISOString()
    };
    
    return from(
      this.supabaseService.supabase
        .from('candidates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        const candidate = response.data;
        
        return {
          id: candidate.id,
          name: candidate.name,
          email: candidate.email,
          phone: candidate.phone,
          position: candidate.position,
          status: candidate.status,
          notes: candidate.notes,
          resumeUrl: candidate.resume_url,
          dateAdded: new Date(candidate.date_added),
          userId: candidate.user_id
        };
      })
    );
  }
  
  // Delete a candidate
  deleteCandidate(id: string): Observable<void> {
    return from(
      this.supabaseService.supabase
        .from('candidates')
        .delete()
        .eq('id', id)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return;
      })
    );
  }
}
