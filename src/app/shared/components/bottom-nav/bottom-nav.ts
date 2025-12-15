import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './bottom-nav.html',
  styleUrl: './bottom-nav.scss',
})
export class BottomNav {
  navItems = [
    { path: '/dashboard', icon: 'home', label: 'Dashboard' },
    { path: '/planning', icon: 'calendar_today', label: 'Planning' },
    { path: '/review', icon: 'assessment', label: 'Review' },
    { path: '/profile', icon: 'person', label: 'Profile' }
  ];
}
