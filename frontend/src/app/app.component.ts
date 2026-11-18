import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { MotionService } from './core/motion.service';
import { TrackingService } from './core/tracking.service';
import { FooterComponent } from './shared/footer.component';
import { HeaderComponent } from './shared/header.component';
import { IntroComponent } from './shared/intro.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TranslocoPipe, HeaderComponent, FooterComponent, IntroComponent],
  template: `
    <app-intro />
    <div class="scroll-progress" aria-hidden="true"></div>
    <button class="skip-link" type="button" (click)="skipToContent()">{{ 'nav.skip' | transloco }}</button>
    <app-header />
    <main id="main" class="site-main" tabindex="-1">
      <router-outlet />
    </main>
    <app-footer />
    <div class="grain" aria-hidden="true"></div>
  `,
})
export class AppComponent {
  constructor() {
    inject(TrackingService).start();
    inject(MotionService).start();
  }

  /** A button, not href="#main": with <base href="/"> a hash link would
   *  resolve to "/#main" and reload the app. */
  skipToContent(): void {
    document.getElementById('main')?.focus();
  }
}
