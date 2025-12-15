/**
 * Animation Barrel Export
 *
 * Central export point for all animations in the Lazy Habbit App
 * Import animations using: import { fadeIn, slideInUp } from '@shared/animations';
 */

// Slide animations
export * from './slide-in.animation';

// Fade animations
export * from './fade-in.animation';

// Scale animations
export * from './scale-in.animation';

// Confetti animations
export * from './confetti.animation';

// Combined export for convenience
import { slideAnimations } from './slide-in.animation';
import { fadeAnimations } from './fade-in.animation';
import { scaleAnimations } from './scale-in.animation';
import { confettiAnimations } from './confetti.animation';

/**
 * All animations combined
 * Usage in component:
 *
 * @Component({
 *   animations: [allAnimations]
 * })
 */
export const allAnimations = [
  ...slideAnimations,
  ...fadeAnimations,
  ...scaleAnimations,
  ...confettiAnimations,
];

/**
 * Common animations for typical use cases
 */
export const commonAnimations = [
  ...slideAnimations.slice(0, 4), // slideInDown, slideInUp, slideInLeft, slideInRight
  ...fadeAnimations.slice(0, 2),  // fadeIn, fadeInSlow
  ...scaleAnimations.slice(0, 3), // scaleIn, scaleBounce, pop
];
