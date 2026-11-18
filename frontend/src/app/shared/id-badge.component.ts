import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, computed, inject, input, viewChild } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { MotionService } from '../core/motion.service';
import { ClockService } from './clock.service';

/** "Access pass" identity card for the About section — a nod to the
 *  identity & access work (Keycloak, OAuth2) the portfolio is about.
 *
 *  Hangs from a lanyard and swings with the scroll velocity (damped spring),
 *  tilts toward the pointer with a holographic sheen, and drops in when it
 *  first enters the viewport. Static under reduced motion. */
@Component({
  selector: 'app-id-badge',
  imports: [TranslocoPipe],
  template: `
    <div class="pass-rig" #rig>
      <div class="pass-swing" #swing>
        <div class="pass-strap" aria-hidden="true"><span></span></div>
        <div class="pass-clip" aria-hidden="true"></div>
        <article class="pass-card" #card [attr.aria-label]="name()">
          <div class="pass-holo" aria-hidden="true"></div>
          <header class="pass-head">
            <span class="pass-pass"><i></i>{{ 'about.badge.pass' | transloco }}</span>
            <span class="pass-id">YY-2015</span>
          </header>

          <div class="pass-avatar">
            <picture>
              <source srcset="assets/img/profile.webp" type="image/webp" />
              <img src="assets/img/profile.jpg" [alt]="name()" width="240" height="240" loading="lazy" decoding="async" />
            </picture>
            <span class="pass-ring" aria-hidden="true"></span>
            <span class="pass-verified" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M6 12.5l4 4L18 8" /></svg>
            </span>
          </div>

          <h3 class="pass-name">{{ name() }}</h3>
          <p class="pass-role">{{ role() }}</p>

          <dl class="pass-meta">
            <div><dt>{{ 'about.badge.base' | transloco }}</dt><dd>Abidjan, CI</dd></div>
            <div><dt>{{ 'about.badge.time' | transloco }}</dt><dd>{{ clock.time() }} GMT</dd></div>
            <div><dt>{{ 'about.badge.languages' | transloco }}</dt><dd>{{ 'about.badge.languagesValue' | transloco }}</dd></div>
            <div><dt>{{ 'about.badge.status' | transloco }}</dt><dd class="pass-ok"><i></i>{{ 'about.badge.available' | transloco }}</dd></div>
          </dl>

          <footer class="pass-foot">
            <svg class="pass-code" [attr.viewBox]="'0 0 ' + barcode().width + ' 40'" preserveAspectRatio="none" aria-hidden="true">
              @for (bar of barcode().bars; track $index) {
                <rect [attr.x]="bar.x" y="0" [attr.width]="bar.w" height="40" />
              }
            </svg>
            <span>OAUTH2 · OIDC · JWT</span>
          </footer>
        </article>
      </div>
    </div>
  `,
})
export class IdBadgeComponent implements AfterViewInit, OnDestroy {
  name = input.required<string>();
  role = input.required<string>();

  clock = inject(ClockService);
  private motion = inject(MotionService);
  private zone = inject(NgZone);
  private rig = viewChild.required<ElementRef<HTMLElement>>('rig');
  private swing = viewChild.required<ElementRef<HTMLElement>>('swing');
  private card = viewChild.required<ElementRef<HTMLElement>>('card');

  private frame = 0;
  private cleanup: (() => void)[] = [];

  /** Deterministic barcode derived from the name — decorative, stable. */
  barcode = computed(() => {
    const seed = Array.from(this.name() + 'yy-pass').map((c) => c.charCodeAt(0));
    const bars: { x: number; w: number }[] = [];
    let x = 0;
    for (let i = 0; i < 46; i++) {
      const v = seed[i % seed.length] * (i + 7);
      const w = 1 + (v % 3);
      if (v % 5 !== 0) bars.push({ x, w });
      x += w + 1 + ((v >> 3) % 2);
    }
    return { bars, width: x };
  });

  ngAfterViewInit(): void {
    const rig = this.rig().nativeElement;
    const swing = this.swing().nativeElement;
    const card = this.card().nativeElement;

    // Drop-in on first view
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          rig.classList.add('is-in');
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(rig);
    this.cleanup.push(() => io.disconnect());

    if (this.motion.reduced) {
      rig.classList.add('is-in');
      return;
    }

    this.zone.runOutsideAngular(() => {
      // Damped spring driven by scroll velocity → the badge swings on its strap
      let angle = 0;
      let velocity = 0;
      let lastY = window.scrollY;
      let visible = false;
      let resting = 0;

      const step = () => {
        const y = window.scrollY;
        const dy = Math.max(-60, Math.min(60, y - lastY));
        lastY = y;
        velocity += -0.045 * angle - 0.11 * velocity + dy * 0.018;
        angle += velocity;
        swing.style.transform = `rotate(${angle.toFixed(3)}deg)`;
        resting = Math.abs(angle) < 0.01 && Math.abs(velocity) < 0.01 && dy === 0 ? resting + 1 : 0;
        this.frame = visible && resting < 30 ? requestAnimationFrame(step) : 0;
      };
      const wake = () => {
        if (visible && !this.frame) {
          lastY = window.scrollY;
          resting = 0;
          this.frame = requestAnimationFrame(step);
        }
      };

      const vis = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        wake();
      });
      vis.observe(rig);
      const off = this.motion.onScrollFrame(wake);
      this.cleanup.push(() => vis.disconnect(), off);

      if (!this.motion.finePointer) return;
      const move = (e: PointerEvent) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--rx', `${(0.5 - py) * 14}deg`);
        card.style.setProperty('--ry', `${(px - 0.5) * 18}deg`);
        card.style.setProperty('--gx', `${px * 100}%`);
        card.style.setProperty('--gy', `${py * 100}%`);
        card.classList.add('is-hover');
      };
      const leave = () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
        card.classList.remove('is-hover');
      };
      card.addEventListener('pointermove', move);
      card.addEventListener('pointerleave', leave);
      this.cleanup.push(() => {
        card.removeEventListener('pointermove', move);
        card.removeEventListener('pointerleave', leave);
      });
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frame);
    this.cleanup.forEach((fn) => fn());
  }
}
