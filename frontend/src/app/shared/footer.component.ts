import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { filter, map } from 'rxjs';

import { ApiService } from '../core/api.service';
import { LanguageService } from '../core/language.service';
import { MotionService } from '../core/motion.service';
import { ClockService } from './clock.service';
import { MagneticDirective } from './magnetic.directive';
import { WaveLinesComponent } from './wave-lines.component';
import { whatsappUrl } from './whatsapp';

/** "Curtain" footer: pinned beneath the page, revealed as the last section
 *  scrolls away. The giant wordmark is the signature of the site. */
@Component({
  selector: 'app-footer',
  imports: [AsyncPipe, RouterLink, TranslocoPipe, MagneticDirective, WaveLinesComponent],
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
                  <li><a [href]="waUrl()" target="_blank" rel="noopener">WhatsApp ↗</a></li>
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

          <a class="footer-wordmark" [routerLink]="['/', language.lang()]" aria-label="Yéo Yédjandé">
            <span>Yéo</span><span class="footer-wordmark-last">Yédjandé</span>
          </a>

          <div class="footer-bottom">
            <span>© {{ year }} Yéo Yédjandé</span>
            <span>{{ 'footer.poweredBy' | transloco }}</span>
          </div>
        </div>
      </footer>
    }
  `,
})
export class FooterComponent {
  api = inject(ApiService);
  language = inject(LanguageService);
  clock = inject(ClockService);
  private motion = inject(MotionService);
  private router = inject(Router);
  year = new Date().getFullYear();
  waUrl = toSignal(
    inject(TranslocoService).selectTranslate('contact.whatsappMessage').pipe(map((text: string) => whatsappUrl(text))),
    { initialValue: whatsappUrl('') }
  );

  isAdmin = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects.startsWith('/admin'))
    ),
    { initialValue: location.pathname.startsWith('/admin') }
  );

  toTop(): void {
    this.motion.scrollTo(0);
  }
}
