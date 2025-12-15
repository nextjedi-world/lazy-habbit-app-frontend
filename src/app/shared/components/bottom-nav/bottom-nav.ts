import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  ariaLabel: string;
}

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './bottom-nav.html',
  styleUrl: './bottom-nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BottomNavComponent {
  navItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: 'home',
      route: '/dashboard',
      ariaLabel: 'Navigate to Dashboard'
    },
    {
      label: 'Planning',
      icon: 'calendar_month',
      route: '/planning',
      ariaLabel: 'Navigate to Planning'
    },
    {
      label: 'Review',
      icon: 'bar_chart',
      route: '/review',
      ariaLabel: 'Navigate to Review'
    },
    {
      label: 'Profile',
      icon: 'person',
      route: '/profile',
      ariaLabel: 'Navigate to Profile'
    }
  ];
}
