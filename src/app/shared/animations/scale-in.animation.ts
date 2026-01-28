/**
 * Scale-In Animations
 *
 * Bounce, zoom, and scale effects for celebratory and attention-seeking elements
 * Perfect for task completions, achievements, and gamification
 */

import { trigger, state, style, transition, animate, keyframes, AnimationTriggerMetadata } from '@angular/animations';

// Animation timing
const SCALE_DURATION = '300ms';
const BOUNCE_DURATION = '600ms';
const SCALE_EASING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'; // Spring easing

/**
 * Simple scale in/out
 * Usage: [@scaleIn]="animationState"
 */
export const scaleIn: AnimationTriggerMetadata = trigger('scaleIn', [
  state('void', style({
    transform: 'scale(0)',
    opacity: 0,
  })),
  state('*', style({
    transform: 'scale(1)',
    opacity: 1,
  })),
  transition('void => *', [
    animate(`${SCALE_DURATION} ${SCALE_EASING}`)
  ]),
  transition('* => void', [
    animate('200ms ease-out', style({ transform: 'scale(0)', opacity: 0 }))
  ]),
]);

/**
 * Scale from center with bounce
 * Usage: [@scaleBounce]="animationState"
 */
export const scaleBounce: AnimationTriggerMetadata = trigger('scaleBounce', [
  transition('void => *', [
    animate(`${BOUNCE_DURATION} ${SCALE_EASING}`, keyframes([
      style({ transform: 'scale(0)', opacity: 0, offset: 0 }),
      style({ transform: 'scale(1.1)', opacity: 1, offset: 0.6 }),
      style({ transform: 'scale(0.95)', offset: 0.8 }),
      style({ transform: 'scale(1)', offset: 1 }),
    ]))
  ]),
  transition('* => void', [
    animate('200ms ease-out', style({ transform: 'scale(0)', opacity: 0 }))
  ]),
]);

/**
 * Pop effect (quick bounce in)
 * Usage: [@pop]="animationState"
 */
export const pop: AnimationTriggerMetadata = trigger('pop', [
  transition('void => *', [
    animate('400ms cubic-bezier(0.68, -0.55, 0.27, 1.55)', keyframes([
      style({ transform: 'scale(0.8)', opacity: 0, offset: 0 }),
      style({ transform: 'scale(1.15)', opacity: 1, offset: 0.5 }),
      style({ transform: 'scale(1)', offset: 1 }),
    ]))
  ]),
  transition('* => void', [
    animate('200ms ease-out', style({ transform: 'scale(0.8)', opacity: 0 }))
  ]),
]);

/**
 * Zoom in (from larger size)
 * Usage: [@zoomIn]="animationState"
 */
export const zoomIn: AnimationTriggerMetadata = trigger('zoomIn', [
  state('void', style({
    transform: 'scale(1.5)',
    opacity: 0,
  })),
  state('*', style({
    transform: 'scale(1)',
    opacity: 1,
  })),
  transition('void => *', [
    animate(`${SCALE_DURATION} ease-out`)
  ]),
  transition('* => void', [
    animate('200ms ease-in', style({ transform: 'scale(1.5)', opacity: 0 }))
  ]),
]);

/**
 * Zoom out (to larger size when leaving)
 * Usage: [@zoomOut]="animationState"
 */
export const zoomOut: AnimationTriggerMetadata = trigger('zoomOut', [
  state('void', style({
    transform: 'scale(0.5)',
    opacity: 0,
  })),
  state('*', style({
    transform: 'scale(1)',
    opacity: 1,
  })),
  transition('void => *', [
    animate(`${SCALE_DURATION} ${SCALE_EASING}`)
  ]),
  transition('* => void', [
    animate('200ms ease-in', style({ transform: 'scale(1.2)', opacity: 0 }))
  ]),
]);

/**
 * Task completion animation (checkmark pop)
 * Usage: [@taskComplete]="isCompleted ? 'completed' : 'incomplete'"
 */
export const taskComplete: AnimationTriggerMetadata = trigger('taskComplete', [
  state('incomplete', style({
    transform: 'scale(1)',
    opacity: 0.6,
  })),
  state('completed', style({
    transform: 'scale(1)',
    opacity: 1,
  })),
  transition('incomplete => completed', [
    animate('500ms cubic-bezier(0.68, -0.55, 0.27, 1.55)', keyframes([
      style({ transform: 'scale(0.8)', opacity: 0.6, offset: 0 }),
      style({ transform: 'scale(1.3)', opacity: 1, offset: 0.5 }),
      style({ transform: 'scale(0.95)', offset: 0.75 }),
      style({ transform: 'scale(1.05)', offset: 0.9 }),
      style({ transform: 'scale(1)', opacity: 1, offset: 1 }),
    ]))
  ]),
  transition('completed => incomplete', [
    animate('200ms ease-out', style({ transform: 'scale(0.9)', opacity: 0.6 }))
  ]),
]);

/**
 * Heartbeat pulse (for notifications, badges)
 * Usage: [@heartbeat]="animationState"
 */
export const heartbeat: AnimationTriggerMetadata = trigger('heartbeat', [
  transition('* => *', [
    animate('1000ms ease-in-out', keyframes([
      style({ transform: 'scale(1)', offset: 0 }),
      style({ transform: 'scale(1.05)', offset: 0.1 }),
      style({ transform: 'scale(1)', offset: 0.2 }),
      style({ transform: 'scale(1.05)', offset: 0.3 }),
      style({ transform: 'scale(1)', offset: 0.4 }),
      style({ transform: 'scale(1)', offset: 1 }),
    ]))
  ]),
]);

/**
 * Rubber band effect (for errors, alerts)
 * Usage: [@rubberBand]="animationState"
 */
export const rubberBand: AnimationTriggerMetadata = trigger('rubberBand', [
  transition('* => *', [
    animate('700ms ease-in-out', keyframes([
      style({ transform: 'scale(1)', offset: 0 }),
      style({ transform: 'scale(1.25) scaleY(0.75)', offset: 0.3 }),
      style({ transform: 'scale(0.75) scaleY(1.25)', offset: 0.4 }),
      style({ transform: 'scale(1.15) scaleY(0.85)', offset: 0.5 }),
      style({ transform: 'scale(1)', offset: 1 }),
    ]))
  ]),
]);

/**
 * Jello effect (wobble)
 * Usage: [@jello]="animationState"
 */
export const jello: AnimationTriggerMetadata = trigger('jello', [
  transition('* => *', [
    animate('800ms ease-in-out', keyframes([
      style({ transform: 'skewX(0deg) skewY(0deg)', offset: 0 }),
      style({ transform: 'skewX(-12.5deg) skewY(-12.5deg)', offset: 0.222 }),
      style({ transform: 'skewX(6.25deg) skewY(6.25deg)', offset: 0.333 }),
      style({ transform: 'skewX(-3.125deg) skewY(-3.125deg)', offset: 0.444 }),
      style({ transform: 'skewX(1.5625deg) skewY(1.5625deg)', offset: 0.555 }),
      style({ transform: 'skewX(-0.78125deg) skewY(-0.78125deg)', offset: 0.666 }),
      style({ transform: 'skewX(0deg) skewY(0deg)', offset: 1 }),
    ]))
  ]),
]);

/**
 * Shake animation (for errors)
 * Usage: [@shake]="animationState"
 */
export const shake: AnimationTriggerMetadata = trigger('shake', [
  transition('* => *', [
    animate('500ms ease-in-out', keyframes([
      style({ transform: 'translateX(0)', offset: 0 }),
      style({ transform: 'translateX(-10px)', offset: 0.1 }),
      style({ transform: 'translateX(10px)', offset: 0.2 }),
      style({ transform: 'translateX(-10px)', offset: 0.3 }),
      style({ transform: 'translateX(10px)', offset: 0.4 }),
      style({ transform: 'translateX(-10px)', offset: 0.5 }),
      style({ transform: 'translateX(10px)', offset: 0.6 }),
      style({ transform: 'translateX(-10px)', offset: 0.7 }),
      style({ transform: 'translateX(10px)', offset: 0.8 }),
      style({ transform: 'translateX(0)', offset: 1 }),
    ]))
  ]),
]);

/**
 * Swing animation (for attention)
 * Usage: [@swing]="animationState"
 */
export const swing: AnimationTriggerMetadata = trigger('swing', [
  transition('* => *', [
    animate('600ms ease-in-out', keyframes([
      style({ transform: 'rotate(0deg)', offset: 0 }),
      style({ transform: 'rotate(15deg)', offset: 0.2 }),
      style({ transform: 'rotate(-10deg)', offset: 0.4 }),
      style({ transform: 'rotate(5deg)', offset: 0.6 }),
      style({ transform: 'rotate(-5deg)', offset: 0.8 }),
      style({ transform: 'rotate(0deg)', offset: 1 }),
    ]))
  ]),
]);

/**
 * Badge pulse (for notifications)
 * Usage: [@badgePulse]="hasNotification"
 */
export const badgePulse: AnimationTriggerMetadata = trigger('badgePulse', [
  state('true', style({
    transform: 'scale(1)',
  })),
  state('false', style({
    transform: 'scale(1)',
  })),
  transition('false => true', [
    animate('600ms ease-in-out', keyframes([
      style({ transform: 'scale(1)', offset: 0 }),
      style({ transform: 'scale(1.1)', offset: 0.25 }),
      style({ transform: 'scale(1)', offset: 0.5 }),
      style({ transform: 'scale(1.1)', offset: 0.75 }),
      style({ transform: 'scale(1)', offset: 1 }),
    ]))
  ]),
]);

/**
 * Export all scale animations as a group
 */
export const scaleAnimations = [
  scaleIn,
  scaleBounce,
  pop,
  zoomIn,
  zoomOut,
  taskComplete,
  heartbeat,
  rubberBand,
  jello,
  shake,
  swing,
  badgePulse,
];
