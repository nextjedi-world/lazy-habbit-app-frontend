# PowerShell script to implement all remaining components

# Register Component
$registerTs = @'
import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  registerForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });

  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const { name, email, password } = this.registerForm.value;
      const user = await this.authService.signUp(email!, password!, name!);

      if (user) {
        await this.userService.createDefaultCategories(user.id);
        this.router.navigate(['/planning']);
      }
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      this.loading.set(false);
    }
  }
}
'@

$registerHtml = @'
<div class="register-container">
  <mat-card class="register-card">
    <mat-card-header>
      <mat-card-title>Create Account</mat-card-title>
      <mat-card-subtitle>Start tracking your habits today</mat-card-subtitle>
    </mat-card-header>

    <mat-card-content>
      <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="Your name" aria-label="Name" autocomplete="name" />
          @if (registerForm.get('name')?.hasError('required')) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" placeholder="you@example.com" aria-label="Email address" autocomplete="email" />
          @if (registerForm.get('email')?.hasError('required')) {
            <mat-error>Email is required</mat-error>
          }
          @if (registerForm.get('email')?.hasError('email')) {
            <mat-error>Please enter a valid email</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Password</mat-label>
          <input matInput type="password" formControlName="password" placeholder="At least 6 characters" aria-label="Password" autocomplete="new-password" />
          @if (registerForm.get('password')?.hasError('required')) {
            <mat-error>Password is required</mat-error>
          }
          @if (registerForm.get('password')?.hasError('minlength')) {
            <mat-error>Password must be at least 6 characters</mat-error>
          }
        </mat-form-field>

        @if (errorMessage()) {
          <div class="error-message" role="alert">{{ errorMessage() }}</div>
        }

        <button mat-raised-button color="primary" type="submit" class="full-width" [disabled]="loading() || registerForm.invalid" aria-label="Create account">
          @if (loading()) {
            <mat-spinner diameter="20"></mat-spinner>
          } @else {
            Create Account
          }
        </button>

        <div class="login-link">
          Already have an account? <a routerLink="/login">Sign in</a>
        </div>
      </form>
    </mat-card-content>
  </mat-card>
</div>
'@

$registerScss = @'
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.register-card {
  width: 100%;
  max-width: 400px;
}

.full-width {
  width: 100%;
  margin-bottom: 1rem;
}

.error-message {
  padding: 0.75rem;
  margin-bottom: 1rem;
  background-color: #fee;
  color: #c33;
  border-radius: 4px;
  font-size: 0.875rem;
}

.login-link {
  margin-top: 1rem;
  text-align: center;
  font-size: 0.875rem;

  a {
    color: #667eea;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
}

button[type="submit"] {
  margin-top: 0.5rem;
  min-height: 48px;
}
'@

# Write Register component files
Set-Content -Path "src\app\features\auth\register\register.ts" -Value $registerTs -Force
Set-Content -Path "src\app\features\auth\register\register.html" -Value $registerHtml -Force
Set-Content -Path "src\app\features\auth\register\register.scss" -Value $registerScss -Force

Write-Host "Register component implemented successfully!"
