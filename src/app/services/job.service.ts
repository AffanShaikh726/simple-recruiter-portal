import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Observable, from, map, catchError } from 'rxjs';
import { Job, JobInsert } from '../models/job.model';

@Injectable({
  providedIn: 'root'
})
export class JobService {
  
  constructor(private supabaseService: SupabaseService) { }
  
  // Get all jobs for the current user
  getJobs(): Observable<Job[]> {
    return from(
      this.supabaseService.supabase
        .from('jobs')
        .select('*')
        .order('date_posted', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        
        // Transform the data to match our Job interface
        return response.data.map(job => ({
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          type: job.type,
          salary: job.salary,
          description: job.description,
          requirements: job.requirements,
          datePosted: new Date(job.date_posted),
          status: job.status,
          userId: job.user_id
        }));
      })
    );
  }
  
  // Get a specific job by ID
  getJob(id: string): Observable<Job> {
    return from(
      this.supabaseService.supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        const job = response.data;
        
        return {
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          type: job.type,
          salary: job.salary,
          description: job.description,
          requirements: job.requirements,
          datePosted: new Date(job.date_posted),
          status: job.status,
          userId: job.user_id
        };
      })
    );
  }
  
  // Create a new job
  createJob(job: JobInsert): Observable<Job> {
    // Get current user ID from SupabaseService
    const userId = this.supabaseService.currentUser?.id;
    
    if (!userId) {
      throw new Error('User is not authenticated');
    }
    
    // Convert our JobInsert to the DB format with snake_case
    const jobData = {
      title: job.title,
      company: job.company,
      location: job.location,
      type: job.type,
      salary: job.salary,
      description: job.description,
      requirements: job.requirements,
      status: job.status || 'open',
      user_id: userId
    };
    
    return from(
      this.supabaseService.supabase
        .from('jobs')
        .insert(jobData)
        .select()
        .single()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        const newJob = response.data;
        
        return {
          id: newJob.id,
          title: newJob.title,
          company: newJob.company,
          location: newJob.location,
          type: newJob.type,
          salary: newJob.salary,
          description: newJob.description,
          requirements: newJob.requirements,
          datePosted: new Date(newJob.date_posted),
          status: newJob.status,
          userId: newJob.user_id
        };
      })
    );
  }
  
  // Update an existing job
  updateJob(id: string, updates: Partial<Job>): Observable<Job> {
    // Convert our updates to the DB format with snake_case as needed
    const updateData: any = {
      ...(updates.title && { title: updates.title }),
      ...(updates.company && { company: updates.company }),
      ...(updates.location && { location: updates.location }),
      ...(updates.type && { type: updates.type }),
      ...(updates.salary && { salary: updates.salary }),
      ...(updates.description && { description: updates.description }),
      ...(updates.requirements && { requirements: updates.requirements }),
      ...(updates.status && { status: updates.status }),
      updated_at: new Date().toISOString()
    };
    
    return from(
      this.supabaseService.supabase
        .from('jobs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        const job = response.data;
        
        return {
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          type: job.type,
          salary: job.salary,
          description: job.description,
          requirements: job.requirements,
          datePosted: new Date(job.date_posted),
          status: job.status,
          userId: job.user_id
        };
      })
    );
  }
  
  // Delete a job
  deleteJob(id: string): Observable<void> {
    console.log('Deleting job with ID:', id);
    return from(
      this.supabaseService.supabase
        .from('jobs')
        .delete()
        .eq('id', id)
        .select()
    ).pipe(
      map(response => {
        console.log('Delete response:', response);
        if (response.error) {
          console.error('Error deleting job:', response.error);
          throw response.error;
        }
        return;
      }),
      catchError(error => {
        console.error('Error in deleteJob:', error);
        throw error;
      })
    );
  }
}
