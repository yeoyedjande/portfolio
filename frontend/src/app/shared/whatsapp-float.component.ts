import { Component, OnDestroy, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { filter, map } from 'rxjs';

import { MotionService } from '../core/motion.service';
import { WhatsAppService } from '../core/whatsapp.service';
import { WHATSAPP_ICON_PATH } from './whatsapp';

/** Floating WhatsApp button (bottom-right) on every public page.
 *  Bounces in after the intro; its label unfolds on hover, and once per
 *  session it "speaks up" by itself a few seconds after arrival. */
@Component({
  selector: 'app-whatsapp-float',
  imports: [TranslocoPipe],
  template: `
    @if (wa.url() && !isAdmin()) {
      <a
        class="wa-float"
        [class.is-in]="motion.ready()"
        [class.is-talking]="talking()"
        [href]="wa.url()"
        target="_blank"
        rel="noopener"
        [attr.aria-label]="'contact.whatsappAria' | transloco"
      >
        <span class="wa-float-label">{{ 'contact.whatsappFloat' | transloco }}</span>
        <span class="wa-float-btn">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="icon" /></svg>
          <i class="wa-float-dot" aria-hidden="true"></i>
        </span>
      </a>
    }
  `,
})
export class WhatsAppFloatComponent implements OnDestroy {
  wa = inject(WhatsAppService);
  motion = inject(MotionService);
  readonly icon = WHATSAPP_ICON_PATH;
  talking = signal(false);
  private timers: ReturnType<typeof setTimeout>[] = [];

  isAdmin = toSignal(
    inject(Router).events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects.startsWith('/admin'))
    ),
    { initialValue: location.pathname.startsWith('/admin') }
  );

  constructor() {
    let greeted = false;
    effect(() => {
      if (!this.motion.ready() || greeted || this.isAdmin()) return;
      greeted = true;
      let seen = false;
      try {
        seen = sessionStorage.getItem('wa_greeted') === '1';
        sessionStorage.setItem('wa_greeted', '1');
      } catch {
        /* storage blocked: greet anyway */
      }
      if (seen || this.motion.reduced) return;
      this.timers.push(setTimeout(() => this.talking.set(true), 4500));
      this.timers.push(setTimeout(() => this.talking.set(false), 9500));
    });
  }

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
  }
}
