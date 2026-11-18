import { Injectable, NgZone, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import Lenis from 'lenis';
import { filter } from 'rxjs';

/** Site-wide motion layer: inertial smooth scrolling (Lenis), the
 *  "ready" flag that gates hero animations behind the intro, and a single
 *  rAF-driven scroll signal shared by every scroll-linked effect.
 *
 *  Everything degrades to native behaviour under prefers-reduced-motion and
 *  on the admin, where smooth scrolling would only get in the way. */
@Injectable({ providedIn: 'root' })
export class MotionService {
  private zone = inject(NgZone);
  private router = inject(Router);

  readonly reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  readonly finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /** Flips to true once the intro has finished (or immediately when skipped). */
  readonly ready = signal(false);
  /** Hidden while scrolling down, shown when scrolling up or near the top. */
  readonly headerHidden = signal(false);
  readonly scrolled = signal(false);

  private lenis?: Lenis;
  private listeners = new Set<(y: number) => void>();
  private lastY = 0;

  start(): void {
    this.zone.runOutsideAngular(() => {
      this.setSmooth(!location.pathname.startsWith('/admin'));
      const raf = (time: number) => {
        this.lenis?.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
      window.addEventListener('scroll', () => this.onScroll(), { passive: true });
      window.addEventListener('resize', () => this.emit(), { passive: true });
    });

    // No inertia in the admin: forms, tables and long editors scroll natively.
    // (Lenis.stop() would lock the page, so the instance is destroyed instead.)
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
      this.setSmooth(!(e as NavigationEnd).urlAfterRedirects.startsWith('/admin'));
      this.headerHidden.set(false);
      requestAnimationFrame(() => this.emit());
    });
  }

  /** Lock / unlock page scrolling (mobile menu). */
  lock(locked: boolean): void {
    if (locked) this.lenis?.stop();
    else this.lenis?.start();
  }

  private setSmooth(enabled: boolean): void {
    if (enabled && !this.lenis && !this.reduced) {
      this.zone.runOutsideAngular(() => {
        this.lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
      });
    } else if (!enabled && this.lenis) {
      this.lenis.destroy();
      this.lenis = undefined;
    }
  }

  markReady(): void {
    this.ready.set(true);
    document.documentElement.classList.add('is-ready');
  }

  /** Subscribe to scroll position updates (called inside rAF, outside Angular). */
  onScrollFrame(fn: (y: number) => void): () => void {
    this.listeners.add(fn);
    requestAnimationFrame(() => fn(window.scrollY));
    return () => this.listeners.delete(fn);
  }

  scrollTo(target: HTMLElement | number, immediate = false): void {
    if (this.lenis && !this.reduced) {
      // Lenis caches the page height (debounced ResizeObserver); after a route
      // change it would still clamp to the previous page's height.
      this.lenis.resize();
      this.lenis.scrollTo(target, { offset: typeof target === 'number' ? 0 : -24, immediate, duration: 1.3 });
      return;
    }
    const top = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY - 24;
    window.scrollTo({ top, behavior: immediate || this.reduced ? 'auto' : 'smooth' });
  }

  private ticking = false;
  private onScroll(): void {
    if (this.ticking) return;
    this.ticking = true;
    requestAnimationFrame(() => {
      this.ticking = false;
      this.emit();
    });
  }

  private emit(): void {
    const y = window.scrollY;
    const delta = y - this.lastY;
    if (Math.abs(delta) > 4) {
      const hide = delta > 0 && y > 160;
      if (hide !== this.headerHidden()) this.zone.run(() => this.headerHidden.set(hide));
      this.lastY = y;
    }
    const scrolled = y > 20;
    if (scrolled !== this.scrolled()) this.zone.run(() => this.scrolled.set(scrolled));
    this.listeners.forEach((fn) => fn(y));
  }
}
