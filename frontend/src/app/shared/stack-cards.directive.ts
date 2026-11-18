import { Directive, ElementRef, NgZone, OnDestroy, OnInit, inject } from '@angular/core';

import { MotionService } from '../core/motion.service';

/** Sticky "deck" of project cards: every card pins near the top of the
 *  viewport and recedes (scale + dim) as the next one slides over it.
 *  Also feeds the pointer position to each card for its follow-cursor badge.
 *  Children must carry the class `.deck-card`. */
@Directive({ selector: '[appStackCards]' })
export class StackCardsDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  private zone = inject(NgZone);
  private motion = inject(MotionService);
  private off?: () => void;
  private cleanup?: () => void;

  ngOnInit(): void {
    const host = this.el.nativeElement as HTMLElement;
    const desktop = window.matchMedia('(min-width: 900px)');
    // Last pointer position: cards slide under a still pointer while
    // scrolling, so the cursor badge is re-anchored on every scroll frame.
    const pointer = { x: -1, y: -1 };

    if (!this.motion.reduced) {
      this.off = this.motion.onScrollFrame(() => {
        const cards = Array.from(host.querySelectorAll<HTMLElement>('.deck-card'));
        if (!desktop.matches) {
          cards.forEach((c) => c.style.setProperty('--s', '0'));
          return;
        }
        cards.forEach((card, i) => {
          if (pointer.x >= 0) {
            const r = card.getBoundingClientRect();
            card.style.setProperty('--cx', `${pointer.x - r.left}px`);
            card.style.setProperty('--cy', `${pointer.y - r.top}px`);
          }
          const next = cards[i + 1];
          if (!next) {
            card.style.setProperty('--s', '0');
            return;
          }
          const a = card.getBoundingClientRect();
          const b = next.getBoundingClientRect();
          // 0 when the next card starts covering this one, 1 when fully stacked
          const progress = Math.min(1, Math.max(0, (a.bottom - b.top) / a.height));
          card.style.setProperty('--s', progress.toFixed(4));
        });
      });
    }

    if (this.motion.finePointer) {
      const move = (event: PointerEvent) => {
        pointer.x = event.clientX;
        pointer.y = event.clientY;
        const card = (event.target as HTMLElement).closest<HTMLElement>('.deck-card');
        if (!card) return;
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--cx', `${event.clientX - rect.left}px`);
        card.style.setProperty('--cy', `${event.clientY - rect.top}px`);
      };
      this.zone.runOutsideAngular(() => host.addEventListener('pointermove', move));
      this.cleanup = () => host.removeEventListener('pointermove', move);
    }
  }

  ngOnDestroy(): void {
    this.off?.();
    this.cleanup?.();
  }
}
