import { Component, NgZone, OnInit, inject, signal } from '@angular/core';

import { MotionService } from '../core/motion.service';

interface Letter {
  ch: string;
  space: boolean;
  serif: boolean;
  /** scattered start position / spin / scale, deterministic per index */
  dx: string;
  dy: string;
  r: string;
  s: string;
}

/** Home-page intro: "Yéo Yédjandé" assembles itself one letter at a time —
 *  each letter flies in from a scattered point, spinning and blurred, and
 *  lands sharp in place — while a counter runs to 100. An underline draws,
 *  then the curtain lifts onto the hero.
 *
 *  Plays on every full load of the home page (not on in-app navigation,
 *  deep links or the admin), never with reduced motion. */
@Component({
  selector: 'app-intro',
  template: `
    @if (visible()) {
      <div class="intro" [class.is-leaving]="leaving()" aria-hidden="true">
        <div class="intro-stage">
          <div class="intro-name">
            @for (l of letters; track $index) {
              @if (l.space) {
                <span class="intro-space"></span>
              } @else {
                <span
                  class="intro-ch"
                  [class.serif]="l.serif"
                  [style.--i]="$index"
                  [style.--dx]="l.dx"
                  [style.--dy]="l.dy"
                  [style.--r]="l.r"
                  [style.--s]="l.s"
                >{{ l.ch }}</span>
              }
            }
          </div>
          <span class="intro-line"></span>
          <p class="intro-role">Senior Full Stack Developer</p>
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

  readonly letters: Letter[] = Array.from('Yéo Yédjandé').map((ch, i) => {
    const rnd = (seed: number) => {
      const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
      return x - Math.floor(x);
    };
    return {
      ch,
      space: ch === ' ',
      serif: i < 3,
      dx: `${((rnd(1) - 0.5) * 70).toFixed(1)}vw`,
      dy: `${((rnd(2) - 0.5) * 70).toFixed(1)}vh`,
      r: `${((rnd(3) - 0.5) * 220).toFixed(0)}deg`,
      s: (0.4 + rnd(4) * 1.6).toFixed(2),
    };
  });

  visible = signal(false);
  leaving = signal(false);
  count = signal(0);

  ngOnInit(): void {
    // index.html paints the boot screen ink when the intro will play.
    document.documentElement.classList.remove('boot-dark');
    const isHome = /^\/(en|fr)?\/?$/.test(location.pathname);
    if (!isHome || this.motion.reduced) {
      this.motion.markReady();
      return;
    }

    this.visible.set(true);
    document.documentElement.classList.add('is-intro');
    this.motion.lock(true);

    // letters: 200 ms lead-in + 95 ms per letter + 900 ms flight ≈ 2.2 s
    const duration = 2400;
    const start = performance.now();
    this.zone.runOutsideAngular(() => {
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 2);
        this.zone.run(() => this.count.set(Math.round(eased * 100)));
        if (p < 1) {
          requestAnimationFrame(tick);
        } else {
          setTimeout(() => this.zone.run(() => this.finish()), 350);
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
    setTimeout(() => this.visible.set(false), 1100);
  }
}
