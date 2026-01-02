import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  // Login fields - Pre-filled for testing
  username: string = '';
  password: string = '';
  
  // UI state
  rememberMe: boolean = false;
  showPassword: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    // If already logged in, redirect to arrival page instead of logging out
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/arrival']);
    }
  }

  ngOnInit() {
    // Pre-filled for testing, remove this in production
    // this.email = 'bandhu@example.com';
    // this.password = 'Pwd1';
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  login() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Please enter username and password';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Bypass login for development - no API call
    if (this.username.toLowerCase() === 'sanskar' && this.password === 'pwd1') {
      console.log('Bypass login successful - skipping API');
      this.successMessage = 'Login successful! Redirecting...';
      
      // Store mock tokens for bypass login
      const mockResponse = {
        accessToken: 'bypass-mock-access-token',
        refreshToken: 'bypass-mock-refresh-token',
        tokenType: 'Bearer',
        accessTokenExpiresInSeconds: 3600
      };
      
      // Manually store tokens
      localStorage.setItem('accessToken', mockResponse.accessToken);
      localStorage.setItem('refreshToken', mockResponse.refreshToken);
      localStorage.setItem('tokenType', mockResponse.tokenType);
      localStorage.setItem('tokenExpiry', (Date.now() + 3600000).toString());
      localStorage.setItem('userData', JSON.stringify({ username: 'sanskar' }));
      
      setTimeout(() => {
        this.isLoading = false;
        this.router.navigate(['/arrival']);
      }, 1000);
      return;
    }

    // API login for all other credentials
    this.authService.login(this.username, this.password).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        this.successMessage = 'Login successful! Redirecting...';
        
        setTimeout(() => {
          this.isLoading = false;
          this.router.navigate(['/arrival']);
        }, 1000);
      },
      error: (error) => {
        console.error('Login error:', error);
        this.isLoading = false;
        
        if (error.status === 401) {
          this.errorMessage = 'Invalid username or password';
        } else if (error.status === 0) {
          this.errorMessage = 'Cannot connect to server. Please check if the backend is running.';
        } else {
          this.errorMessage = error.error?.message || 'Login failed. Please check your username and password.';
        }
      }
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();
    this.login();
  }
}
