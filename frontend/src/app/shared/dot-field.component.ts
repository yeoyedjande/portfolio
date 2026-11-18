import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, inject, viewChild } from '@angular/core';

import { MotionService } from '../core/motion.service';

/** Hero background: a quiet dot matrix that breathes with a slow wave and
 *  bends away from the pointer like a magnetic field. Canvas 2D, DPR-aware,
 *  paused when off-screen. A static grid is drawn under reduced motion. */
@Component({
  selector: 'app-dot-field',
  template: `<canvas #canvas class="dot-field" aria-hidden="true"></canvas>`,
})
export class DotFieldComponent implements AfterViewInit, OnDestroy {
  private canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private zone = inject(NgZone);
  private motion = inject(MotionService);

  private frame = 0;
  private visible = true;
  private observer?: IntersectionObserver;
  private resizeObserver?: ResizeObserver;
  private cleanup: (() => void)[] = [];

  ngAfterViewInit(): void {
    const canvas = this.canvasRef().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const GAP = 26;
    let width = 0;
    let height = 0;
    let dpr = 1;
    const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999 };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (this.motion.reduced) draw(0);
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height);
      pointer.x += (pointer.tx - pointer.x) * 0.12;
      pointer.y += (pointer.ty - pointer.y) * 0.12;
      const cols = Math.ceil(width / GAP) + 1;
      const rows = Math.ceil(height / GAP) + 1;
      const radius = 150;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let x = c * GAP + (r % 2 ? GAP / 2 : 0);
          let y = r * GAP;
          const wave = Math.sin(c * 0.22 + t * 0.0009) * Math.cos(r * 0.18 + t * 0.0007);
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          let size = 1 + wave * 0.45;
          let alpha = 0.16 + wave * 0.08;
          let accent = 0;
          if (dist < radius) {
            const force = 1 - dist / radius;
            x += (dx / (dist || 1)) * force * 16;
            y += (dy / (dist || 1)) * force * 16;
            size += force * 1.9;
            alpha += force * 0.6;
            accent = force;
          }
          // fade the field toward the bottom so the content reads cleanly
          alpha *= Math.min(1, 1.25 - y / height);
          if (alpha <= 0.01) continue;
          ctx.fillStyle = accent > 0.05
            ? `rgba(43, 59, 255, ${Math.min(alpha, 0.95)})`
            : `rgba(14, 14, 16, ${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, Math.max(0.4, size), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    this.zone.runOutsideAngular(() => {
      resize();
      this.resizeObserver = new ResizeObserver(resize);
      this.resizeObserver.observe(canvas);
      if (this.motion.reduced) return;

      const host = canvas.parentElement ?? canvas;
      const move = (e: PointerEvent) => {
        const rect = canvas.getBoundingClientRect();
        pointer.tx = e.clientX - rect.left;
        pointer.ty = e.clientY - rect.top;
      };
      const leave = () => {
        pointer.tx = -9999;
        pointer.ty = -9999;
      };
      host.addEventListener('pointermove', move);
      host.addEventListener('pointerleave', leave);
      this.cleanup.push(() => {
        host.removeEventListener('pointermove', move);
        host.removeEventListener('pointerleave', leave);
      });

      this.observer = new IntersectionObserver(([entry]) => {
        this.visible = entry.isIntersecting;
        if (this.visible && !this.frame) this.frame = requestAnimationFrame(loop);
      });
      this.observer.observe(canvas);

      const loop = (t: number) => {
        if (!this.visible) {
          this.frame = 0;
          return;
        }
        draw(t);
        this.frame = requestAnimationFrame(loop);
      };
      this.frame = requestAnimationFrame(loop);
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frame);
    this.observer?.disconnect();
    this.resizeObserver?.disconnect();
    this.cleanup.forEach((fn) => fn());
  }
}
