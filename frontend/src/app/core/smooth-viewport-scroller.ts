import { ViewportScroller } from '@angular/common';
import { Injectable, inject } from '@angular/core';

import { MotionService } from './motion.service';

/** Router scrolling routed through the smooth-scroll engine: in-page anchors
 *  glide instead of jumping, route changes reset instantly. Anchors rendered
 *  after async content loads are awaited for a short while. */
@Injectable()
export class SmoothViewportScroller extends ViewportScroller {
  private motion = inject(MotionService);
  private offset: () => [number, number] = () => [0, 0];

  override setOffset(offset: [number, number] | (() => [number, number])): void {
    this.offset = Array.isArray(offset) ? () => offset : offset;
  }

  override getScrollPosition(): [number, number] {
    return [window.scrollX, window.scrollY];
  }

  override scrollToPosition(position: [number, number]): void {
    this.motion.scrollTo(position[1], true);
  }

  override scrollToAnchor(anchor: string): void {
    const started = performance.now();
    const attempt = () => {
      const el = document.getElementById(anchor) ?? document.getElementsByName(anchor)[0];
      if (el instanceof HTMLElement) {
        // let the freshly rendered page lay out before measuring it
        requestAnimationFrame(() => requestAnimationFrame(() => this.motion.scrollTo(el)));
      } else if (performance.now() - started < 2000) {
        requestAnimationFrame(attempt);
      }
    };
    attempt();
  }

  override setHistoryScrollRestoration(scrollRestoration: 'auto' | 'manual'): void {
    history.scrollRestoration = scrollRestoration;
  }
}
