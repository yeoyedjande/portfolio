import { Component, NgZone, OnInit, inject, signal } from '@angular/core';

import { MotionService } from '../core/motion.service';

/** First-visit intro: the name assembles letter by letter while a counter
 *  runs to 100, then the curtain lifts and the hero animates in underneath.
 *  Plays once per browser session, never on the admin, never with reduced
 *  motion — and is short (~1.5 s) so it never stands between a recruiter and
 *  the content. */
@Component({
  selector: 'app-intro',
  template: `
    @if (visible()) {
      <div class="intro" [class.is-leaving]="leaving()" aria-hidden="true">
        <div class="intro-name">
          @for (ch of letters; track $index) {
            <span class="intro-ch" [style.--i]="$index">{{ ch === ' ' ? ' ' : ch }}</span>
          }
        </div>
        <div class="intro-foot">
          <span>Full Stack · Data · Security</span>
          <span class="intro-count">{{ count() }}</span>
        </div>
        <div class="intro-bar"><i [style.transform]="'scaleX(' + count() / 100 + ')'"></i></div>
      </div>
    }
  `,
})
export class IntroComponent implements OnInit {
  private motion = inject(MotionService);
  private zone = inject(NgZone);

  readonly letters = Array.from('Yéo Yédjandé');
  visible = signal(false);
  leaving = signal(false);
  count = signal(0);

  ngOnInit(): void {
    // index.html paints the boot screen ink on first visits; hand over to us.
    document.documentElement.classList.remove('boot-dark');
    const isAdmin = location.pathname.startsWith('/admin');
    let seen = false;
    try {
      seen = sessionStorage.getItem('intro_seen') === '1';
    } catch {
      /* storage blocked: just play it */
    }
    if (isAdmin || seen || this.motion.reduced) {
      this.motion.markReady();
      return;
    }
    try {
      sessionStorage.setItem('intro_seen', '1');
    } catch {
      /* ignore */
    }

    this.visible.set(true);
    document.documentElement.classList.add('is-intro');
    this.motion.lock(true);
    const duration = 1250;
    const start = performance.now();
    this.zone.runOutsideAngular(() => {
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        this.zone.run(() => this.count.set(Math.round(eased * 100)));
        if (p < 1) {
          requestAnimationFrame(tick);
        } else {
          setTimeout(() => this.zone.run(() => this.finish()), 180);
        }
      };
      requestAnimationFrame(tick);
    });
  }

  private finish(): void {
    this.leaving.set(true);
    document.documentElement.classList.remove('is-intro');
    this.motion.lock(false);
    this.motion.markReady();
    setTimeout(() => this.visible.set(false), 1000);
  }
}
