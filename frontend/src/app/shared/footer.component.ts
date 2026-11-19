import { AsyncPipe } from '@angular/common';
import { Component, OnDestroy, inject, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe } from '@jsverse/transloco';
import { filter, map } from 'rxjs';

import { ApiService } from '../core/api.service';
import { LanguageService } from '../core/language.service';
import { MotionService } from '../core/motion.service';
import { ClockService } from './clock.service';
import { MagneticDirective } from './magnetic.directive';
import { LetterWaveDirective } from './letter-wave.directive';
import { WaveLinesComponent } from './wave-lines.component';
import { WhatsAppService } from '../core/whatsapp.service';

/** "Curtain" footer: pinned beneath the page, revealed as the last section
 *  scrolls away. The giant wordmark is the signature of the site. */
@Component({
  selector: 'app-footer',
  imports: [AsyncPipe, RouterLink, TranslocoPipe, MagneticDirective, WaveLinesComponent, LetterWaveDirective],
  template: `
    @if (!isAdmin()) {
      <footer class="site-footer">
        <app-wave-lines />
        <div class="footer-inner">
          <div class="footer-top">
            <div class="footer-col">
              <p class="footer-label">{{ 'footer.reach' | transloco }}</p>
              @if (api.content$ | async; as content) {
                <a class="footer-mail" [href]="'mailto:' + content.settings.email">{{ content.settings.email }}</a>
                <ul class="footer-links">
                  @if (wa.url()) {
                    <li><a [href]="wa.url()" target="_blank" rel="noopener">WhatsApp ↗</a></li>
                  }
                  <li><a [href]="content.settings.linkedin_url" target="_blank" rel="noopener">LinkedIn ↗</a></li>
                  <li><a [href]="content.settings.github_url" target="_blank" rel="noopener">GitHub ↗</a></li>
                  @if (content.settings.cv_url) {
                    <li><a [href]="content.settings.cv_url" download>{{ 'hero.downloadCv' | transloco }} ↓</a></li>
                  }
                </ul>
              }
            </div>
            <div class="footer-col">
              <p class="footer-label">{{ 'footer.local' | transloco }}</p>
              <p class="footer-clock">Abidjan <b>{{ clock.time() }}</b> GMT</p>
              <p class="footer-note">{{ 'footer.timezone' | transloco }}</p>
            </div>
            <button class="footer-top-btn" type="button" appMagnetic="0.3" (click)="toTop()">
              <span aria-hidden="true">↑</span>{{ 'footer.backToTop' | transloco }}
            </button>
          </div>

          <a class="footer-wordmark" appLetterWave #wave="letterWave" [routerLink]="['/', language.lang()]" aria-label="Yéo Yédjandé">
            <span class="wm-word wm-first" aria-hidden="true">
              @for (c of first; track $index) {
                <span class="wm-l">{{ c }}</span>
              }
            </span>
            <span class="wm-word wm-last" aria-hidden="true">
              @for (c of last; track $index) {
                <span class="wm-l" [style.--t]="$index / (last.length - 1)">{{ c }}</span>
              }
            </span>
          </a>

          <div class="footer-bottom">
            <span>© {{ year }} Yéo Yédjandé</span>
            <span>{{ 'footer.rights' | transloco }}</span>
          </div>
        </div>
      </footer>
    }
  `,
})
export class FooterComponent implements OnDestroy {
  api = inject(ApiService);
  language = inject(LanguageService);
  clock = inject(ClockService);
  private motion = inject(MotionService);
  private router = inject(Router);
  year = new Date().getFullYear();
  readonly first = Array.from('Yéo');
  readonly last = Array.from('Yédjandé');

  private wave = viewChild<LetterWaveDirective>('wave');
  private revealed = false;
  private offScroll = this.motion.onScrollFrame((y) => {
    // Sweep a wave across the name each time the footer is fully revealed
    const remaining = document.documentElement.scrollHeight - (y + window.innerHeight);
    if (remaining < 40 && !this.revealed) {
      this.revealed = true;
      setTimeout(() => this.wave()?.sweep(), 250);
    } else if (remaining > 400) {
      this.revealed = false;
    }
  });
  wa = inject(WhatsAppService);

  isAdmin = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects.startsWith('/admin'))
    ),
    { initialValue: location.pathname.startsWith('/admin') }
  );

  ngOnDestroy(): void {
    this.offScroll();
  }

  toTop(): void {
    this.motion.scrollTo(0);
  }
}
