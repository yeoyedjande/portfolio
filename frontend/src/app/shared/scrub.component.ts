import { Component, ElementRef, OnDestroy, OnInit, computed, inject, input } from '@angular/core';

import { MotionService } from '../core/motion.service';

/** A paragraph that "lights up" word by word as it scrolls through the
 *  viewport. Progress is written to one CSS variable; every word derives its
 *  own opacity from it in CSS, so a scroll frame costs a single style write. */
@Component({
  selector: '[appScrub]',
  host: { class: 'scrub', '[style.--n]': 'words().length' },
  template: `@for (w of words(); track $index) {<span class="sw" [style.--i]="$index">{{ w }}</span>{{ ' ' }}}`,
})
export class ScrubComponent implements OnInit, OnDestroy {
  appScrub = input.required<string>();

  private el = inject(ElementRef<HTMLElement>);
  private motion = inject(MotionService);
  private off?: () => void;

  words = computed(() => (this.appScrub() ?? '').split(/\s+/).filter(Boolean));

  ngOnInit(): void {
    const host = this.el.nativeElement as HTMLElement;
    if (this.motion.reduced) {
      host.style.setProperty('--p', '1');
      return;
    }
    this.off = this.motion.onScrollFrame(() => {
      const rect = host.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the top enters at 85% of the viewport, 1 when the bottom reaches 45%
      const start = vh * 0.85;
      const end = vh * 0.45;
      const total = rect.height + (start - end);
      const p = Math.min(1, Math.max(0, (start - rect.top) / total));
      host.style.setProperty('--p', p.toFixed(4));
    });
  }

  ngOnDestroy(): void {
    this.off?.();
  }
}
