import { AfterViewInit, Directive, ElementRef, NgZone, OnDestroy, inject } from '@angular/core';

import { MotionService } from '../core/motion.service';

/** Pointer-driven wave over a wordmark: every `.wm-l` letter rises and
 *  stretches from its baseline according to its distance from the pointer
 *  (gaussian falloff), with spring-like easing so the wave flows and
 *  settles. `sweep()` runs a left-to-right wave on its own — used when the
 *  footer is revealed, so touch devices see it too. */
@Directive({ selector: '[appLetterWave]', exportAs: 'letterWave' })
export class LetterWaveDirective implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  private zone = inject(NgZone);
  private motion = inject(MotionService);

  private letters: HTMLElement[] = [];
  private centers: number[] = [];
  private current: number[] = [];
  private target: number[] = [];
  private frame = 0;
  private sweepFrame = 0;
  private cleanup: (() => void)[] = [];

  ngAfterViewInit(): void {
    if (this.motion.reduced) return;
    const host = this.el.nativeElement as HTMLElement;
    this.zone.runOutsideAngular(() => {
      const move = (e: PointerEvent) => this.aim(e.clientX - host.getBoundingClientRect().left);
      const leave = () => this.release();
      host.addEventListener('pointerenter', () => this.measure());
      host.addEventListener('pointermove', move);
      host.addEventListener('pointerleave', leave);
      window.addEventListener('resize', () => this.measure(), { passive: true });
      this.cleanup.push(() => {
        host.removeEventListener('pointermove', move);
        host.removeEventListener('pointerleave', leave);
      });
    });
    this.measure();
  }

  /** Run one wave across the word, left to right. */
  sweep(duration = 1700): void {
    if (this.motion.reduced) return;
    this.measure();
    const host = this.el.nativeElement as HTMLElement;
    const width = host.offsetWidth;
    cancelAnimationFrame(this.sweepFrame);
    this.zone.runOutsideAngular(() => {
      const start = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        this.aim(-0.15 * width + eased * 1.3 * width);
        if (p < 1) this.sweepFrame = requestAnimationFrame(step);
        else this.release();
      };
      this.sweepFrame = requestAnimationFrame(step);
    });
  }

  private measure(): void {
    const host = this.el.nativeElement as HTMLElement;
    this.letters = Array.from(host.querySelectorAll<HTMLElement>('.wm-l'));
    const hostLeft = host.getBoundingClientRect().left;
    // offset* ignore transforms, so lifted letters do not skew the centres
    this.centers = this.letters.map((l) => {
      const r = l.offsetParent === host ? l.offsetLeft : l.getBoundingClientRect().left - hostLeft;
      return r + l.offsetWidth / 2;
    });
    if (this.current.length !== this.letters.length) {
      this.current = this.letters.map(() => 0);
      this.target = this.letters.map(() => 0);
    }
  }

  private aim(x: number): void {
    const width = (this.el.nativeElement as HTMLElement).offsetWidth || 1;
    const sigma = 0.075;
    this.centers.forEach((c, i) => {
      const d = (x - c) / width;
      this.target[i] = Math.exp(-(d * d) / (2 * sigma * sigma));
    });
    this.run();
  }

  private release(): void {
    this.target = this.target.map(() => 0);
    this.run();
  }

  private run(): void {
    if (this.frame) return;
    const tick = () => {
      let moving = false;
      this.letters.forEach((letter, i) => {
        const next = this.current[i] + (this.target[i] - this.current[i]) * 0.16;
        this.current[i] = Math.abs(next - this.target[i]) < 0.001 ? this.target[i] : next;
        if (this.current[i] !== this.target[i]) moving = true;
        const v = this.current[i];
        letter.style.transform = v
          ? `translate3d(0, ${(-v * 14).toFixed(2)}%, 0) scale(${(1 - v * 0.04).toFixed(3)}, ${(1 + v * 0.3).toFixed(3)})`
          : '';
        letter.style.setProperty('--lift', v.toFixed(3));
      });
      this.frame = moving ? requestAnimationFrame(tick) : 0;
    };
    this.frame = requestAnimationFrame(tick);
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frame);
    cancelAnimationFrame(this.sweepFrame);
    this.cleanup.forEach((fn) => fn());
  }
}
