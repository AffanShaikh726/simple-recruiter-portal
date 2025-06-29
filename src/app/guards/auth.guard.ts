import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { map, take, switchMap } from 'rxjs/operators';
import { from, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const supabaseService = inject(SupabaseService);

  // Store the attempted URL for redirecting after login
  sessionStorage.setItem('returnUrl', state.url);
  
  console.log('Auth guard checking route:', state.url);
  
  // First, ensure auth initialization is complete
  return from(supabaseService.waitForAuthInit()).pipe(
    switchMap(initialized => {
      console.log('Auth initialization complete, checking authentication status');
      
      // Check if user is already authenticated in memory after initialization
      if (supabaseService.currentUser) {
        console.log('Auth guard: User already authenticated in memory');
        return of(true);
      }
      
      // If not authenticated after initialization, check session from Supabase
      return from(supabaseService.supabase.auth.getSession()).pipe(
        map(({ data }) => {
          const isAuthenticated = !!data.session;
          
          if (isAuthenticated) {
            console.log('Auth guard: Valid session found');
            // Update auth state with the session
            if (data.session) {
              supabaseService['updateAuthState'](data.session);
            }
            return true;
          }
          
          // No valid session found, redirect to login
          console.log('Auth guard: No valid session - Redirecting to login');
          router.navigate(['/login']);
          return false;
        })
      );
    })
  );
};
