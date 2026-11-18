import { Component, NgZone, OnDestroy, effect, inject, signal } from '@angular/core';

import { MotionService } from '../core/motion.service';
import { TiltDirective } from './tilt.directive';

type Tone = 'prompt' | 'cmd' | 'dim' | 'ok' | 'key' | 'str' | 'plain';
interface Segment {
  text: string;
  tone: Tone;
}
type Line = Segment[];

/** Hero terminal: a deploy session that types itself out once the intro is
 *  done — commands are typed character by character, outputs land line by
 *  line, then it loops. Tilts in 3D with the pointer. Pure HTML/CSS. */
@Component({
  selector: 'app-hero-visual',
  imports: [TiltDirective],
  template: `
    <div class="hero-visual" aria-hidden="true">
      <div class="term" appTilt>
        <div class="term-bar">
          <i></i><i></i><i></i>
          <span>~/yeo — deploy · production</span>
          <b class="term-live"><em></em>live</b>
        </div>
        <div class="term-body">
          @for (line of rendered(); track $index) {
            <div class="term-line">
              @for (seg of line; track $index) {
                <span [class]="'t-' + seg.tone">{{ seg.text }}</span>
              }
              @if ($last && !done()) {
                <span class="term-caret"></span>
              }
            </div>
          }
        </div>
        <div class="term-glare"></div>
      </div>

      <div class="hero-chip chip-a">
        <svg viewBox="0 0 24 24"><path d="M12 22s8-3 8-10V5l-8-3-8 3v7c0 7 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
        OAuth2 · Keycloak · JWT
      </div>
      <div class="hero-chip chip-b">
        <svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5"/><path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3"/></svg>
        PostgreSQL · FastAPI
      </div>
    </div>
  `,
})
export class HeroVisualComponent implements OnDestroy {
  private zone = inject(NgZone);
  private motion = inject(MotionService);

  private readonly script: { line: Line; typed: boolean }[] = [
    { typed: true, line: [{ text: '$ ', tone: 'prompt' }, { text: 'docker compose up -d --build', tone: 'cmd' }] },
    { typed: false, line: [{ text: '[+] Building api, web … done in 14.2s', tone: 'dim' }] },
    { typed: false, line: [{ text: '✔ ', tone: 'ok' }, { text: 'postgres    ', tone: 'dim' }, { text: 'healthy', tone: 'ok' }] },
    { typed: false, line: [{ text: '✔ ', tone: 'ok' }, { text: 'fastapi     ', tone: 'dim' }, { text: 'running ', tone: 'ok' }, { text: ':8000', tone: 'dim' }] },
    { typed: false, line: [{ text: '✔ ', tone: 'ok' }, { text: 'angular     ', tone: 'dim' }, { text: 'running ', tone: 'ok' }, { text: ':443', tone: 'dim' }] },
    { typed: false, line: [] },
    { typed: true, line: [{ text: '$ ', tone: 'prompt' }, { text: 'curl -s /api/health', tone: 'cmd' }] },
    {
      typed: false,
      line: [
        { text: '{ ', tone: 'plain' },
        { text: '"status"', tone: 'key' },
        { text: ': ', tone: 'plain' },
        { text: '"ok"', tone: 'str' },
        { text: ', ', tone: 'plain' },
        { text: '"auth"', tone: 'key' },
        { text: ': ', tone: 'plain' },
        { text: '"keycloak"', tone: 'str' },
        { text: ' }', tone: 'plain' },
      ],
    },
    { typed: false, line: [] },
    { typed: true, line: [{ text: '$ ', tone: 'prompt' }, { text: 'pytest -q', tone: 'cmd' }] },
    { typed: false, line: [{ text: '17 passed ', tone: 'ok' }, { text: 'in 3.41s', tone: 'dim' }] },
  ];

  rendered = signal<Line[]>([[]]);
  done = signal(false);
  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor() {
    if (this.motion.reduced) {
      this.rendered.set(this.script.map((s) => s.line));
      this.done.set(true);
      return;
    }
    let started = false;
    effect(() => {
      if (this.motion.ready() && !started) {
        started = true;
        this.zone.runOutsideAngular(() => this.later(() => this.play(), 700));
      }
    });
  }

  private later(fn: () => void, ms: number): void {
    this.timers.push(setTimeout(fn, ms));
  }

  private set(lines: Line[]): void {
    this.zone.run(() => this.rendered.set(lines));
  }

  private play(): void {
    const lines: Line[] = [];
    this.zone.run(() => this.done.set(false));
    let index = 0;

    const nextLine = () => {
      if (index >= this.script.length) {
        this.zone.run(() => this.done.set(true));
        this.later(() => this.play(), 6500);
        return;
      }
      const { line, typed } = this.script[index++];
      if (!typed) {
        lines.push(line);
        this.set([...lines]);
        this.later(nextLine, line.length ? 230 : 120);
        return;
      }
      // Typed command: prompt first, then the command one character at a time
      const [prompt, cmd] = line;
      let chars = 0;
      lines.push([prompt, { text: '', tone: cmd.tone }]);
      const typeChar = () => {
        chars++;
        lines[lines.length - 1] = [prompt, { text: cmd.text.slice(0, chars), tone: cmd.tone }];
        this.set([...lines]);
        if (chars < cmd.text.length) this.later(typeChar, 28 + Math.random() * 55);
        else this.later(nextLine, 420);
      };
      this.later(typeChar, 260);
    };
    nextLine();
  }

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
  }
}
