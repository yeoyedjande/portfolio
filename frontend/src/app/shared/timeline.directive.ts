import { Directive, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';

import { MotionService } from '../core/motion.service';

/** Scroll-driven timeline: writes the list's progress (0–1) to `--p` so a
 *  rail can fill as the reader moves through it, and marks each `.xp-row`
 *  `is-passed` once it crosses the reading line (60% of the viewport). */
@Directive({ selector: '[appTimeline]' })
export class TimelineDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  private motion = inject(MotionService);
  private off?: () => void;

  ngOnInit(): void {
    const host = this.el.nativeElement as HTMLElement;
    if (this.motion.reduced) {
      host.style.setProperty('--p', '1');
      host.querySelectorAll('.xp-row').forEach((row) => row.classList.add('is-passed'));
      return;
    }
    this.off = this.motion.onScrollFrame(() => {
      const line = window.innerHeight * 0.6;
      const rect = host.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (line - rect.top) / rect.height));
      host.style.setProperty('--p', p.toFixed(4));
      host.querySelectorAll<HTMLElement>('.xp-row').forEach((row) => {
        row.classList.toggle('is-passed', row.getBoundingClientRect().top < line);
      });
    });
  }

  ngOnDestroy(): void {
    this.off?.();
  }
}
