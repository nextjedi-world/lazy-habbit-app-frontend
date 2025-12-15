import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth';

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
    MatProgressBarModule,
    MatIconModule,
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  loading = signal(false);
  errorMessage = signal<string | null>(null);
  hidePassword = signal(true);

  registerForm = new FormGroup({
    name: new FormControl('', [
      Validators.required,
      Validators.minLength(2),
    ]),
    email: new FormControl('', [
      Validators.required,
      Validators.email,
    ]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
    ]),
  });

  // Computed password strength
  passwordStrength = computed(() => {
    const password = this.registerForm.get('password')?.value || '';
    return this.calculateStrength(password);
  });

  // Computed strength color
  strengthColor = computed(() => {
    const strength = this.passwordStrength();
    if (strength < 40) return 'warn';
    if (strength < 70) return 'accent';
    return 'primary';
  });

  // Computed strength label
  strengthLabel = computed(() => {
    const strength = this.passwordStrength();
    if (strength === 0) return '';
    if (strength < 40) return 'Weak';
    if (strength < 70) return 'Good';
    return 'Strong';
  });

  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const { name, email, password } = this.registerForm.value;
      await this.authService.signUp(email!, password!, name!);
      this.router.navigate(['/planning']);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      this.loading.set(false);
    }
  }

  togglePasswordVisibility(): void {
    this.hidePassword.set(!this.hidePassword());
  }

  private calculateStrength(password: string): number {
    if (!password) return 0;

    let strength = 0;

    // Length check (0-40 points)
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    if (password.length >= 16) strength += 10;

    // Character variety (0-40 points)
    if (/[a-z]/.test(password)) strength += 10;
    if (/[A-Z]/.test(password)) strength += 10;
    if (/\d/.test(password)) strength += 10;
    if (/[^a-zA-Z\d]/.test(password)) strength += 10;

    // Complexity bonus (0-20 points)
    if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) strength += 10;
    if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d])/.test(password)) strength += 10;

    return Math.min(strength, 100);
  }
}
