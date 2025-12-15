/**
 * Fade-In Animations
 *
 * Smooth opacity transitions for components entering/leaving the viewport
 * Optimized for subtle, elegant transitions
 */

import { trigger, state, style, transition, animate, AnimationTriggerMetadata } from '@angular/animations';

// Animation timing
const FADE_DURATION = '200ms';
const FADE_DURATION_SLOW = '300ms';
const FADE_EASING = 'ease-in-out';

/**
 * Simple fade in/out
 * Usage: [@fadeIn]="animationState"
 */
export const fadeIn: AnimationTriggerMetadata = trigger('fadeIn', [
  state('void', style({
    opacity: 0,
  })),
  state('*', style({
    opacity: 1,
  })),
  transition('void => *', [
    animate(`${FADE_DURATION} ${FADE_EASING}`)
  ]),
  transition('* => void', [
    animate(`${FADE_DURATION} ${FADE_EASING}`)
  ]),
]);

/**
 * Slow fade in/out (for larger elements)
 * Usage: [@fadeInSlow]="animationState"
 */
export const fadeInSlow: AnimationTriggerMetadata = trigger('fadeInSlow', [
  state('void', style({
    opacity: 0,
  })),
  state('*', style({
    opacity: 1,
  })),
  transition('void => *', [
    animate(`${FADE_DURATION_SLOW} ${FADE_EASING}`)
  ]),
  transition('* => void', [
    animate(`${FADE_DURATION_SLOW} ${FADE_EASING}`)
  ]),
]);

/**
 * Fade with scale (zoom in effect)
 * Usage: [@fadeScale]="animationState"
 */
export const fadeScale: AnimationTriggerMetadata = trigger('fadeScale', [
  state('void', style({
    opacity: 0,
    transform: 'scale(0.95)',
  })),
  state('*', style({
    opacity: 1,
    transform: 'scale(1)',
  })),
  transition('void => *', [
    animate(`${FADE_DURATION_SLOW} ${FADE_EASING}`)
  ]),
  transition('* => void', [
    animate(`${FADE_DURATION} ${FADE_EASING}`)
  ]),
]);

/**
 * Fade with vertical movement
 * Usage: [@fadeInDown]="animationState"
 */
export const fadeInDown: AnimationTriggerMetadata = trigger('fadeInDown', [
  state('void', style({
    opacity: 0,
    transform: 'translateY(-20px)',
  })),
  state('*', style({
    opacity: 1,
    transform: 'translateY(0)',
  })),
  transition('void => *', [
    animate(`${FADE_DURATION_SLOW} ${FADE_EASING}`)
  ]),
  transition('* => void', [
    animate(`${FADE_DURATION} ${FADE_EASING}`)
  ]),
]);

/**
 * Fade in from bottom
 * Usage: [@fadeInUp]="animationState"
 */
export const fadeInUp: AnimationTriggerMetadata = trigger('fadeInUp', [
  state('void', style({
    opacity: 0,
    transform: 'translateY(20px)',
  })),
  state('*', style({
    opacity: 1,
    transform: 'translateY(0)',
  })),
  transition('void => *', [
    animate(`${FADE_DURATION_SLOW} ${FADE_EASING}`)
  ]),
  transition('* => void', [
    animate(`${FADE_DURATION} ${FADE_EASING}`)
  ]),
]);

/**
 * Fade toggle (show/hide with named states)
 * Usage: [@fadeToggle]="isVisible ? 'visible' : 'hidden'"
 */
export const fadeToggle: AnimationTriggerMetadata = trigger('fadeToggle', [
  state('hidden', style({
    opacity: 0,
    visibility: 'hidden',
  })),
  state('visible', style({
    opacity: 1,
    visibility: 'visible',
  })),
  transition('hidden <=> visible', [
    animate(`${FADE_DURATION} ${FADE_EASING}`)
  ]),
]);

/**
 * Crossfade between states
 * Usage: [@crossfade]="currentState"
 */
export const crossfade: AnimationTriggerMetadata = trigger('crossfade', [
  transition('* => *', [
    style({ opacity: 1 }),
    animate(`${FADE_DURATION} ${FADE_EASING}`, style({ opacity: 0 })),
    animate(`${FADE_DURATION} ${FADE_EASING}`, style({ opacity: 1 })),
  ]),
]);

/**
 * Fade with blur (for modals, overlays)
 * Usage: [@fadeBlur]="animationState"
 */
export const fadeBlur: AnimationTriggerMetadata = trigger('fadeBlur', [
  state('void', style({
    opacity: 0,
    filter: 'blur(8px)',
  })),
  state('*', style({
    opacity: 1,
    filter: 'blur(0)',
  })),
  transition('void => *', [
    animate(`${FADE_DURATION_SLOW} ${FADE_EASING}`)
  ]),
  transition('* => void', [
    animate(`${FADE_DURATION} ${FADE_EASING}`)
  ]),
]);

/**
 * Fade backdrop (for overlays, modals)
 * Usage: [@fadeBackdrop]="isOpen ? 'open' : 'closed'"
 */
export const fadeBackdrop: AnimationTriggerMetadata = trigger('fadeBackdrop', [
  state('closed', style({
    opacity: 0,
    'pointer-events': 'none',
  })),
  state('open', style({
    opacity: 1,
    'pointer-events': 'auto',
  })),
  transition('closed <=> open', [
    animate(`${FADE_DURATION_SLOW} ${FADE_EASING}`)
  ]),
]);

/**
 * Pulse fade (for loading states, attention-seeking)
 * Usage: [@pulseFade]="animationState"
 */
export const pulseFade: AnimationTriggerMetadata = trigger('pulseFade', [
  state('*', style({
    opacity: 1,
  })),
  transition('* => *', [
    animate('1s ease-in-out', style({ opacity: 0.5 })),
    animate('1s ease-in-out', style({ opacity: 1 })),
  ]),
]);

/**
 * Stagger fade (for lists)
 * Use with ngFor and @staggerFadeIn on parent container
 * Usage: [@staggerFadeIn] on parent, children fade in sequentially
 */
export const staggerFadeIn: AnimationTriggerMetadata = trigger('staggerFadeIn', [
  transition('* => *', [
    // Animation handled by individual list items
  ]),
]);

/**
 * List item fade (for use with stagger)
 * Usage: [@listItemFade] on each list item
 */
export const listItemFade: AnimationTriggerMetadata = trigger('listItemFade', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(10px)' }),
    animate(`${FADE_DURATION_SLOW} ${FADE_EASING}`, style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
  transition(':leave', [
    animate(`${FADE_DURATION} ${FADE_EASING}`, style({ opacity: 0, transform: 'translateY(-10px)' })),
  ]),
]);

/**
 * Export all fade animations as a group
 */
export const fadeAnimations = [
  fadeIn,
  fadeInSlow,
  fadeScale,
  fadeInDown,
  fadeInUp,
  fadeToggle,
  crossfade,
  fadeBlur,
  fadeBackdrop,
  pulseFade,
  staggerFadeIn,
  listItemFade,
];
