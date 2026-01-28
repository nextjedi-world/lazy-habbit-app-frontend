/**
 * Confetti Animation
 *
 * Celebratory particle effects for achievements, clean weeks, tier promotions
 * Lightweight implementation using CSS animations and TypeScript helpers
 */

import { trigger, transition, style, animate, AnimationTriggerMetadata } from '@angular/animations';

/**
 * Confetti particle interface
 */
export interface ConfettiParticle {
  id: string;
  x: number;          // Starting X position (%)
  y: number;          // Starting Y position (%)
  rotation: number;   // Initial rotation (deg)
  color: string;      // Hex color
  size: number;       // Size in px
  duration: number;   // Animation duration (ms)
  delay: number;      // Animation delay (ms)
}

/**
 * Confetti configuration
 */
export interface ConfettiConfig {
  particleCount?: number;    // Number of particles (default: 50)
  duration?: number;         // Animation duration in ms (default: 3000)
  colors?: string[];         // Particle colors (default: theme colors)
  spread?: number;           // Spread angle in degrees (default: 360)
  origin?: { x: number; y: number }; // Origin point (default: { x: 50, y: 50 })
}

/**
 * Default confetti colors (matches theme)
 */
const DEFAULT_COLORS = [
  '#2563EB', // Primary blue
  '#F97316', // Accent orange
  '#10B981', // Success green
  '#FBBF24', // Warning yellow
  '#EF4444', // Danger red
  '#c084fc', // Purple
  '#e879f9', // Fuchsia
  '#60a5fa', // Light blue
  '#34d399', // Light green
  '#fbbf24', // Gold
];

/**
 * Generate random confetti particles
 */
export function generateConfetti(config: ConfettiConfig = {}): ConfettiParticle[] {
  const {
    particleCount = 50,
    duration = 3000,
    colors = DEFAULT_COLORS,
    spread = 360,
    origin = { x: 50, y: 50 },
  } = config;

  const particles: ConfettiParticle[] = [];

  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.random() * spread - spread / 2) * (Math.PI / 180);
    const velocity = Math.random() * 50 + 25; // Random velocity
    const x = origin.x + Math.cos(angle) * velocity;
    const y = origin.y + Math.sin(angle) * velocity;

    particles.push({
      id: `confetti-${i}-${Date.now()}`,
      x: x,
      y: y,
      rotation: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4, // 4-12px
      duration: duration + Math.random() * 500 - 250, // Vary duration slightly
      delay: Math.random() * 200, // Stagger start times
    });
  }

  return particles;
}

/**
 * Confetti container animation
 * Usage: [@confettiContainer]="showConfetti ? 'active' : 'inactive'"
 */
export const confettiContainer: AnimationTriggerMetadata = trigger('confettiContainer', [
  transition('inactive => active', [
    style({ opacity: 0 }),
    animate('100ms ease-out', style({ opacity: 1 })),
  ]),
  transition('active => inactive', [
    animate('300ms 2700ms ease-out', style({ opacity: 0 })),
  ]),
]);

/**
 * Individual confetti particle animation
 * Usage: [@confettiParticle]="'active'"
 */
export const confettiParticle: AnimationTriggerMetadata = trigger('confettiParticle', [
  transition('void => *', [
    style({
      transform: 'translate(0, 0) rotate(0deg)',
      opacity: 1,
    }),
    animate('{{ duration }}ms {{ delay }}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)', style({
      transform: 'translate({{ x }}vw, {{ y }}vh) rotate({{ rotation }}deg)',
      opacity: 0,
    })),
  ], { params: { duration: 3000, delay: 0, x: 0, y: 100, rotation: 360 } }),
]);

/**
 * Celebration burst animation (for tier promotions, clean weeks)
 * Usage: [@celebrationBurst]="showCelebration ? 'burst' : 'idle'"
 */
export const celebrationBurst: AnimationTriggerMetadata = trigger('celebrationBurst', [
  transition('idle => burst', [
    style({ transform: 'scale(1)', opacity: 1 }),
    animate('600ms cubic-bezier(0.68, -0.55, 0.27, 1.55)', style({
      transform: 'scale(1.2)',
      opacity: 1,
    })),
    animate('200ms ease-out', style({
      transform: 'scale(1)',
      opacity: 1,
    })),
  ]),
]);

/**
 * Success ripple animation (for task completions)
 * Usage: [@successRipple]="animationState"
 */
export const successRipple: AnimationTriggerMetadata = trigger('successRipple', [
  transition('void => *', [
    style({
      transform: 'scale(0)',
      opacity: 0.8,
    }),
    animate('600ms ease-out', style({
      transform: 'scale(3)',
      opacity: 0,
    })),
  ]),
]);

/**
 * Star burst animation (for achievements)
 * Usage: [@starBurst]="showStars ? 'active' : 'inactive'"
 */
export const starBurst: AnimationTriggerMetadata = trigger('starBurst', [
  transition('inactive => active', [
    style({
      transform: 'scale(0) rotate(0deg)',
      opacity: 0,
    }),
    animate('500ms cubic-bezier(0.68, -0.55, 0.27, 1.55)', style({
      transform: 'scale(1.5) rotate(180deg)',
      opacity: 1,
    })),
    animate('200ms ease-out', style({
      transform: 'scale(1) rotate(360deg)',
      opacity: 1,
    })),
  ]),
  transition('active => inactive', [
    animate('300ms ease-out', style({
      transform: 'scale(0) rotate(0deg)',
      opacity: 0,
    })),
  ]),
]);

/**
 * Export all confetti animations as a group
 */
export const confettiAnimations = [
  confettiContainer,
  confettiParticle,
  celebrationBurst,
  successRipple,
  starBurst,
];

/**
 * Helper service for programmatic confetti triggering
 * Usage in component:
 *
 * import { ConfettiService } from './confetti.service';
 *
 * constructor(private confetti: ConfettiService) {}
 *
 * celebrate() {
 *   this.confetti.burst({ particleCount: 100, colors: [...] });
 * }
 */
export class ConfettiService {
  private activeConfetti: ConfettiParticle[] = [];

  /**
   * Trigger confetti burst
   */
  burst(config?: ConfettiConfig): ConfettiParticle[] {
    this.activeConfetti = generateConfetti(config);
    return this.activeConfetti;
  }

  /**
   * Clear active confetti
   */
  clear(): void {
    this.activeConfetti = [];
  }

  /**
   * Get active confetti particles
   */
  getParticles(): ConfettiParticle[] {
    return this.activeConfetti;
  }
}

/**
 * Preset confetti configurations
 */
export const ConfettiPresets = {
  /**
   * Clean week celebration (green theme)
   */
  cleanWeek: {
    particleCount: 60,
    duration: 3000,
    colors: ['#10B981', '#3dd598', '#5ce0ad', '#81f0c5', '#a7ffdb'],
    spread: 120,
    origin: { x: 50, y: 40 },
  } as ConfettiConfig,

  /**
   * Tier promotion (gold/purple theme)
   */
  tierPromotion: {
    particleCount: 80,
    duration: 3500,
    colors: ['#fbbf24', '#ffd54f', '#c084fc', '#e879f9', '#a78bfa'],
    spread: 180,
    origin: { x: 50, y: 30 },
  } as ConfettiConfig,

  /**
   * Task completion (subtle, quick)
   */
  taskComplete: {
    particleCount: 20,
    duration: 1500,
    colors: ['#2563EB', '#4f7ef7', '#7199ff'],
    spread: 60,
    origin: { x: 50, y: 50 },
  } as ConfettiConfig,

  /**
   * Weekly goal achieved (colorful)
   */
  goalAchieved: {
    particleCount: 100,
    duration: 4000,
    colors: DEFAULT_COLORS,
    spread: 360,
    origin: { x: 50, y: 50 },
  } as ConfettiConfig,

  /**
   * Milestone reached (grand celebration)
   */
  milestone: {
    particleCount: 150,
    duration: 5000,
    colors: [...DEFAULT_COLORS, '#ffffff', '#ffd700'],
    spread: 360,
    origin: { x: 50, y: 20 },
  } as ConfettiConfig,
};
