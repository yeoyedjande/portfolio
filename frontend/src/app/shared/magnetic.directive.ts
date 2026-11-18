import { Directive, ElementRef, NgZone, OnDestroy, OnInit, inject, input } from '@angular/core';

import { MotionService } from '../core/motion.service';

/** Pulls the element toward the pointer while hovered, then springs back.
 *  Fine pointers only; no-op for touch and reduced motion. */
@Directive({ selector: '[appMagnetic]' })
export class MagneticDirective implements OnInit, OnDestroy {
  /** Strength of the pull, 0–1. */
  appMagnetic = input<number | string>(0.35);

  private el = inject(ElementRef<HTMLElement>);
  private zone = inject(NgZone);
  private motion = inject(MotionService);
  private cleanup: (() => void)[] = [];

  ngOnInit(): void {
    if (!this.motion.finePointer || this.motion.reduced) return;
    const el = this.el.nativeElement as HTMLElement;
    const strength = Number(this.appMagnetic() || 0.35);
    el.classList.add('magnetic');

    const move = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = event.clientX - (rect.left + rect.width / 2);
      const y = event.clientY - (rect.top + rect.height / 2);
      el.style.transform = `translate3d(${x * strength}px, ${y * strength}px, 0)`;
      el.style.setProperty('--mx', `${x * strength * 0.5}px`);
      el.style.setProperty('--my', `${y * strength * 0.5}px`);
    };
    const leave = () => {
      el.style.transform = '';
      el.style.setProperty('--mx', '0px');
      el.style.setProperty('--my', '0px');
    };

    this.zone.runOutsideAngular(() => {
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerleave', leave);
    });
    this.cleanup.push(() => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    });
  }

  ngOnDestroy(): void {
    this.cleanup.forEach((fn) => fn());
  }
}
