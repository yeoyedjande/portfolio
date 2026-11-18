import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, inject, viewChild } from '@angular/core';

import { MotionService } from '../core/motion.service';

/** Flowing "data wave": a fan of thin sine lines in the brand gradient that
 *  slowly drift — the footer's backdrop. Canvas 2D, DPR-aware, paused
 *  off-screen, drawn once (static) under reduced motion. */
@Component({
  selector: 'app-wave-lines',
  template: `<canvas #canvas class="wave-lines" aria-hidden="true"></canvas>`,
})
export class WaveLinesComponent implements AfterViewInit, OnDestroy {
  private canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private zone = inject(NgZone);
  private motion = inject(MotionService);
  private frame = 0;
  private visible = false;
  private offScroll?: () => void;
  private ro?: ResizeObserver;

  ngAfterViewInit(): void {
    const canvas = this.canvasRef().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let w = 0;
    let h = 0;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(0);
    };

    const LINES = 34;
    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const gradient = ctx.createLinearGradient(0, 0, w, 0);
      gradient.addColorStop(0, 'rgba(8, 126, 189, 0)');
      gradient.addColorStop(0.35, 'rgba(8, 126, 189, 0.9)');
      gradient.addColorStop(0.75, 'rgba(32, 197, 216, 1)');
      gradient.addColorStop(1, 'rgba(32, 197, 216, 0.2)');
      ctx.strokeStyle = gradient;
      for (let i = 0; i < LINES; i++) {
        const k = i / LINES;
        ctx.globalAlpha = 0.08 + k * 0.5;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 8) {
          const nx = x / w;
          const y =
            h * (0.62 - k * 0.22) +
            Math.sin(nx * 5.2 + t * 0.00035 + i * 0.16) * h * 0.12 * (0.4 + k) +
            Math.sin(nx * 11 - t * 0.0005 + i * 0.05) * h * 0.035;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    this.zone.runOutsideAngular(() => {
      this.ro = new ResizeObserver(resize);
      this.ro.observe(canvas);
      if (this.motion.reduced) return;
      const loop = (t: number) => {
        if (!this.visible) {
          this.frame = 0;
          return;
        }
        draw(t);
        this.frame = requestAnimationFrame(loop);
      };
      // The footer is pinned under the page, so it always "intersects": only
      // animate once the page has actually scrolled far enough to reveal it.
      this.offScroll = this.motion.onScrollFrame((y) => {
        const remaining = document.documentElement.scrollHeight - (y + window.innerHeight);
        this.visible = remaining < h + 80;
        if (this.visible && !this.frame) this.frame = requestAnimationFrame(loop);
      });
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frame);
    this.offScroll?.();
    this.ro?.disconnect();
  }
}
