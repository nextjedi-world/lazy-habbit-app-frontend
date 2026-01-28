import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { LandingComponent } from './landing';

describe('LandingComponent', () => {
  let component: LandingComponent;
  let fixture: ComponentFixture<LandingComponent>;
  let mockRouter: any;

  beforeEach(async () => {
    mockRouter = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [
        { provide: Router, useValue: mockRouter }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to /auth/register when navigateToRegister is called', () => {
    component.navigateToRegister();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/register']);
  });

  it('should navigate to /auth/login when navigateToLogin is called', () => {
    component.navigateToLogin();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('should render 3 stats items', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const statItems = compiled.querySelectorAll('.stat-item');

    expect(statItems.length).toBe(3);
  });

  it('should have 3 stats with correct values', () => {
    expect(component.stats.length).toBe(3);
    expect(component.stats[0].value).toBe('3-week');
    expect(component.stats[1].value).toBe('0-10');
    expect(component.stats[2].value).toBe('25-35hrs');
  });

  it('should have proper ARIA label on primary CTA', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const primaryButton = compiled.querySelector('.cta-primary');

    expect(primaryButton?.getAttribute('aria-label')).toBeTruthy();
    expect(primaryButton?.getAttribute('aria-label')).toContain('Get started');
  });

  it('should have proper ARIA label on secondary CTA', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const secondaryButton = compiled.querySelector('.cta-secondary');

    expect(secondaryButton?.getAttribute('aria-label')).toBeTruthy();
    expect(secondaryButton?.getAttribute('aria-label')).toContain('Sign in');
  });

  it('should render hero title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const heroTitle = compiled.querySelector('.hero-title');

    expect(heroTitle?.textContent).toContain('Weekly Quotas');
  });

  it('should render CSS mockup device', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const mockupDevice = compiled.querySelector('.mockup-device');

    expect(mockupDevice).toBeTruthy();
  });

  it('should navigate when Get Started button is clicked', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const primaryButton = compiled.querySelector('.cta-primary') as HTMLButtonElement;

    primaryButton.click();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/register']);
  });

  it('should navigate when Sign In button is clicked', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const secondaryButton = compiled.querySelector('.cta-secondary') as HTMLButtonElement;

    secondaryButton.click();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
  });
});
