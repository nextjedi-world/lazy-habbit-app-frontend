/**
 * Slide-In Animations
 *
 * Smooth slide transitions for components entering/leaving the viewport
 * Mobile-optimized with 60fps performance target
 */

import { trigger, state, style, transition, animate, AnimationTriggerMetadata } from '@angular/animations';

// Animation timing
const SLIDE_DURATION = '300ms';
const SLIDE_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'; // Material Design easing

/**
 * Slide in from top
 * Usage: [@slideInDown]="animationState"
 */
export const slideInDown: AnimationTriggerMetadata = trigger('slideInDown', [
  state('void', style({
    transform: 'translateY(-100%)',
    opacity: 0,
  })),
  state('*', style({
    transform: 'translateY(0)',
    opacity: 1,
  })),
  transition('void => *', [
    animate(`${SLIDE_DURATION} ${SLIDE_EASING}`)
  ]),
  transition('* => void', [
    animate(`${SLIDE_DURATION} ${SLIDE_EASING}`)
  ]),
]);

/**
 * Slide in from bottom
 * Usage: [@slideInUp]="animationState"
 */
export const slideInUp: AnimationTriggerMetadata = trigger('slideInUp', [
  state('void', style({
    transform: 'translateY(100%)',
    opacity: 0,
  })),
  state('*', style({
    transform: 'translateY(0)',
    opacity: 1,
  })),
  transition('void => *', [
    animate(`${SLIDE_DURATION} ${SLIDE_EASING}`)
  ]),
  transition('* => void', [
    animate(`${SLIDE_DURATION} ${SLIDE_EASING}`)
  ]),
]);

/**
 * Slide in from left
 * Usage: [@slideInLeft]="animationState"
 */
export const slideInLeft: AnimationTriggerMetadata = trigger('slideInLeft', [
  state('void', style({
    transform: 'translateX(-100%)',
    opacity: 0,
  })),
  state('*', style({
    transform: 'translateX(0)',
    opacity: 1,
  })),
  transition('void => *', [
    animate(`${SLIDE_DURATION} ${SLIDE_EASING}`)
  ]),
  transition('* => void', [
    animate(`${SLIDE_DURATION} ${SLIDE_EASING}`)
  ]),
]);

/**
 * Slide in from right
 * Usage: [@slideInRight]="animationState"
 */
export const slideInRight: AnimationTriggerMetadata = trigger('slideInRight', [
  state('void', style({
    transform: 'translateX(100%)',
    opacity: 0,
  })),
  state('*', style({
    transform: 'translateX(0)',
    opacity: 1,
  })),
  transition('void => *', [
    animate(`${SLIDE_DURATION} ${SLIDE_EASING}`)
  ]),
  transition('* => void', [
    animate(`${SLIDE_DURATION} ${SLIDE_EASING}`)
  ]),
]);

/**
 * Staggered slide-in for lists
 * Animates children with progressive delay
 * Usage: [@slideInStagger]
 */
export const slideInStagger: AnimationTriggerMetadata = trigger('slideInStagger', [
  transition('* => *', [
    // No animation on parent
  ]),
]);

/**
 * Slide toggle (expand/collapse)
 * Usage: [@slideToggle]="isExpanded ? 'expanded' : 'collapsed'"
 */
export const slideToggle: AnimationTriggerMetadata = trigger('slideToggle', [
  state('collapsed', style({
    height: '0',
    overflow: 'hidden',
    opacity: 0,
  })),
  state('expanded', style({
    height: '*',
    overflow: 'visible',
    opacity: 1,
  })),
  transition('collapsed <=> expanded', [
    animate(`${SLIDE_DURATION} ${SLIDE_EASING}`)
  ]),
]);

/**
 * Slide swap (swap between two states with slide)
 * Usage: [@slideSwap]="'state1' | 'state2'"
 */
export const slideSwap: AnimationTriggerMetadata = trigger('slideSwap', [
  state('void', style({
    transform: 'translateX(100%)',
    opacity: 0,
  })),
  state('*', style({
    transform: 'translateX(0)',
    opacity: 1,
  })),
  transition(':enter', [
    style({ transform: 'translateX(100%)', opacity: 0 }),
    animate(`${SLIDE_DURATION} ${SLIDE_EASING}`, style({ transform: 'translateX(0)', opacity: 1 }))
  ]),
  transition(':leave', [
    animate(`${SLIDE_DURATION} ${SLIDE_EASING}`, style({ transform: 'translateX(-100%)', opacity: 0 }))
  ]),
]);

/**
 * Slide from bottom with spring (for bottom sheets, modals)
 * Usage: [@slideUpSpring]="animationState"
 */
export const slideUpSpring: AnimationTriggerMetadata = trigger('slideUpSpring', [
  state('void', style({
    transform: 'translateY(100vh)',
    opacity: 0,
  })),
  state('*', style({
    transform: 'translateY(0)',
    opacity: 1,
  })),
  transition('void => *', [
    animate('400ms cubic-bezier(0.34, 1.56, 0.64, 1)') // Spring easing
  ]),
  transition('* => void', [
    animate(`${SLIDE_DURATION} ${SLIDE_EASING}`)
  ]),
]);

/**
 * Slide menu (hamburger menu animation)
 * Usage: [@slideMenu]="isMenuOpen ? 'open' : 'closed'"
 */
export const slideMenu: AnimationTriggerMetadata = trigger('slideMenu', [
  state('closed', style({
    transform: 'translateX(-100%)',
    opacity: 0,
    visibility: 'hidden',
  })),
  state('open', style({
    transform: 'translateX(0)',
    opacity: 1,
    visibility: 'visible',
  })),
  transition('closed <=> open', [
    animate(`${SLIDE_DURATION} ${SLIDE_EASING}`)
  ]),
]);

/**
 * Export all slide animations as a group
 */
export const slideAnimations = [
  slideInDown,
  slideInUp,
  slideInLeft,
  slideInRight,
  slideInStagger,
  slideToggle,
  slideSwap,
  slideUpSpring,
  slideMenu,
];
