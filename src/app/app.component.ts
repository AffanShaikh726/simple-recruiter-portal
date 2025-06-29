import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SupabaseService } from './services/supabase.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'simple-recruiter-portal';
  
  constructor(private supabaseService: SupabaseService) {}
  
  ngOnInit() {
    // Ensure authentication is initialized as soon as the app starts
    this.supabaseService.waitForAuthInit().then(isAuthenticated => {
      console.log('App component initialized auth state:', isAuthenticated ? 'Authenticated' : 'Not authenticated');
    });
  }
}
