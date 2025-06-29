import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, AuthResponse, Session } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Environment } from '../../environments/environment.interface';
import { BehaviorSubject, Observable, from, of, firstValueFrom } from 'rxjs';
import { map, catchError, tap, finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  // Make the supabase client accessible to other services
  public supabase: SupabaseClient;
  private isAuthenticatedSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private currentUserSubject: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  private sessionSubject: BehaviorSubject<Session | null> = new BehaviorSubject<Session | null>(null);
  private initializationComplete = false;
  
  constructor() {
    // Check if Supabase config exists using type assertion to handle potential missing properties
    const env = environment as Environment;
    
    if (!env.supabase || !env.supabase.url || !env.supabase.key) {
      console.error('Supabase configuration is missing in environment file');
      throw new Error('Supabase configuration is missing');
    }
    
    // Create the Supabase client with explicit persistence settings
    this.supabase = createClient(
      env.supabase.url, 
      env.supabase.key,
      {
        auth: {
          persistSession: true,
          storageKey: 'supabase-auth-token',
          storage: localStorage,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );
    
    // Initialize the authentication state immediately
    this.initializeAuthState();
    
    // Listen for auth state changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, !!session);
      this.updateAuthState(session);
    });
  }
  
  /**
   * Initialize the authentication state by checking for an existing session
   * This is called once during service initialization
   */
  private async initializeAuthState(): Promise<void> {
    try {
      console.log('Initializing auth state...');
      const { data: { session } } = await this.supabase.auth.getSession();
      this.updateAuthState(session);
      this.initializationComplete = true;
      console.log('Auth initialization complete:', !!session ? 'User is authenticated' : 'No active session');
    } catch (error) {
      console.error('Error initializing auth state:', error);
      this.updateAuthState(null);
      this.initializationComplete = true;
    }
  }
  
  /**
   * Update the authentication state based on the current session
   */
  private updateAuthState(session: Session | null): void {
    const isAuthenticated = !!session;
    this.sessionSubject.next(session);
    this.isAuthenticatedSubject.next(isAuthenticated);
    this.currentUserSubject.next(session?.user || null);
    
    // For debugging
    if (session) {
      console.log('Auth state updated - User authenticated:', session.user.email);
      // Log token expiry time to help debug session issues
      if (session.expires_at) {
        const expiresAt = new Date(session.expires_at * 1000);
        console.log('Token expires at:', expiresAt.toLocaleString());
      } else {
        console.log('Token expiry time not available');
      }
    } else {
      console.log('Auth state updated - No authenticated user');
    }
  }
  
  /**
   * Wait for authentication initialization to complete
   * This ensures we don't make decisions before the auth state is properly loaded
   */
  async waitForAuthInit(): Promise<boolean> {
    // If initialization is already complete, return immediately
    if (this.initializationComplete) {
      return this.isAuthenticatedSubject.value;
    }
    
    // Otherwise wait for up to 2 seconds for initialization to complete
    return new Promise<boolean>((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.initializationComplete) {
          clearInterval(checkInterval);
          clearTimeout(timeout);
          resolve(this.isAuthenticatedSubject.value);
        }
      }, 100);
      
      // Set a timeout to avoid waiting indefinitely
      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
        console.warn('Auth initialization timed out');
        resolve(false);
      }, 2000);
    });
  }
  
  // Authentication methods
  register(email: string, password: string): Observable<AuthResponse> {
    return from(this.supabase.auth.signUp({
      email,
      password
    })).pipe(
      tap(response => {
        if (response.data.user) {
          this.currentUserSubject.next(response.data.user);
          // We don't update isAuthenticatedSubject here because signUp doesn't automatically log in the user
        }
      }),
      catchError(error => {
        console.error('Registration error:', error);
        throw error;
      })
    );
  }
  
  login(email: string, password: string): Observable<AuthResponse> {
    console.log('Attempting login for:', email);
    return from(this.supabase.auth.signInWithPassword({
      email,
      password
    })).pipe(
      tap(response => {
        console.log('Login successful, updating auth state');
        this.updateAuthState(response.data.session);
      }),
      catchError(error => {
        console.error('Login error:', error);
        throw error;
      })
    );
  }
  
  logout(): Observable<any> {
    console.log('Logging out user');
    return from(this.supabase.auth.signOut()).pipe(
      tap(() => {
        console.log('Logout successful, clearing auth state');
        this.updateAuthState(null);
      }),
      catchError(error => {
        console.error('Logout error:', error);
        throw error;
      }),
      finalize(() => {
        // Ensure auth state is cleared even if there's an error
        this.updateAuthState(null);
      })
    );
  }
  
  /**
   * Observable that emits the current authentication state
   */
  get isAuthenticated(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }
  
  /**
   * Get the current user synchronously
   */
  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }
  
  /**
   * Get the current session synchronously
   */
  get currentSession(): Session | null {
    return this.sessionSubject.value;
  }
  
  /**
   * Refresh the current session
   * This can be called periodically to ensure the token doesn't expire
   */
  refreshSession(): Observable<Session | null> {
    return from(this.supabase.auth.refreshSession()).pipe(
      map(({ data }) => {
        if (data.session) {
          this.updateAuthState(data.session);
          return data.session;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error refreshing session:', error);
        return of(null);
      })
    );
  }
  
  // Storage methods
  uploadFile(file: File, path: string): Observable<any> {
    console.log('Uploading file:', file.name, 'to path:', path);
    
    if (!file || !(file instanceof File)) {
      console.error('Invalid file object:', file);
      return of({ error: 'Invalid file object' });
    }
    
    // Try with a different approach to bypass RLS issues
    return from(this.supabase.storage
      .from('uploads') // Make sure this matches your bucket name exactly
      .upload(path, file, {
        upsert: true,
        cacheControl: '3600',
        contentType: file.type // Explicitly set content type
      })
    ).pipe(
      tap(result => {
        if (result.error) {
          console.error('Upload error:', result.error);
        } else {
          console.log('Upload successful:', result.data);
        }
      }),
      catchError(error => {
        console.error('Upload error caught:', error);
        return of({ error });
      })
    );
  }
  
  getFileUrl(path: string): Observable<string> {
    const { data } = this.supabase.storage
      .from('uploads')
      .getPublicUrl(path);
    
    return of(data.publicUrl);
  }

  listFiles(): Observable<{name: string, url: string, date: Date}[]> {
    return from(this.supabase.storage
      .from('uploads')
      .list()
    ).pipe(
      map(({ data: files, error }) => {
        if (error) throw error;
        
        // For each file, get its public URL
        return files.map(file => ({
          name: file.name,
          url: this.supabase.storage
            .from('uploads')
            .getPublicUrl(file.name).data.publicUrl,
          date: new Date(file.created_at || new Date().toISOString())
        }));
      }),
      catchError(error => {
        console.error('Error listing files:', error);
        return of([]);
      })
    );
  }

  // User profile methods
  getUserProfile(userId: string): Observable<any> {
    return from(this.supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
      catchError(error => {
        console.error('Error fetching user profile:', error);
        return of(null);
      })
    );
  }

  updateUserProfile(profile: {
    user_id: string,
    full_name?: string,
    phone?: string,
    position?: string,
    updated_at?: string
  }): Observable<any> {
    return from(this.supabase
      .from('profiles')
      .upsert(profile)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
      catchError(error => {
        console.error('Error updating user profile:', error);
        throw error;
      })
    );
  }
}
