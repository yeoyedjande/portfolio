import { Directive, ElementRef, NgZone, OnDestroy, OnInit, inject } from '@angular/core';

import { MotionService } from '../core/motion.service';

/** Subtle 3D tilt that follows the pointer, plus a moving glare position
 *  (--gx / --gy) the stylesheet can use for a light reflection. */
@Directive({ selector: '[appTilt]' })
export class TiltDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  private zone = inject(NgZone);
  private motion = inject(MotionService);
  private cleanup?: () => void;

  ngOnInit(): void {
    if (!this.motion.finePointer || this.motion.reduced) return;
    const el = this.el.nativeElement as HTMLElement;

    const move = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      el.style.setProperty('--rx', `${(0.5 - py) * 9}deg`);
      el.style.setProperty('--ry', `${(px - 0.5) * 11}deg`);
      el.style.setProperty('--gx', `${px * 100}%`);
      el.style.setProperty('--gy', `${py * 100}%`);
    };
    const leave = () => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    };

    this.zone.runOutsideAngular(() => {
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerleave', leave);
    });
    this.cleanup = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }

  ngOnDestroy(): void {
    this.cleanup?.();
  }
}
