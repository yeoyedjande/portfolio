import { Component, effect, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { LanguageService } from '../core/language.service';
import { MotionService } from '../core/motion.service';
import { ClockService } from './clock.service';
import { MagneticDirective } from './magnetic.directive';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, TranslocoPipe, MagneticDirective],
  template: `
    <header
      class="site-header"
      [class.is-hidden]="motion.headerHidden() && !open()"
      [class.is-scrolled]="motion.scrolled()"
      [class.is-open]="open()"
    >
      <nav class="nav" aria-label="Main navigation">
        <a class="nav-brand" [routerLink]="['/', language.lang()]" (click)="close()" aria-label="Yéo Yédjandé — home">
          <span class="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32"><path d="M5 6l7 10v10M19 6l-7 10M19 6l4 6 4-6M23 12v14" /></svg>
          </span>
          <span class="brand-name">Yéo Yédjandé</span>
        </a>

        <ul class="nav-pill">
          <li>
            <a [routerLink]="['/', language.lang()]" fragment="work">{{ 'nav.work' | transloco }}</a>
          </li>
          <li>
            <a [routerLink]="['/', language.lang()]" fragment="experience">{{ 'nav.experience' | transloco }}</a>
          </li>
          <li>
            <a [routerLink]="['/', language.lang()]" fragment="stack">{{ 'nav.stack' | transloco }}</a>
          </li>
        </ul>

        <div class="nav-right">
          <div class="lang-switch" role="group" aria-label="Language">
            <button type="button" [class.is-active]="language.lang() === 'en'" (click)="language.switchTo('en')">EN</button>
            <button type="button" [class.is-active]="language.lang() === 'fr'" (click)="language.switchTo('fr')">FR</button>
          </div>

          <a class="nav-cta" appMagnetic="0.25" [routerLink]="['/', language.lang(), 'contact']" routerLinkActive="is-active">
            <span>{{ 'nav.contact' | transloco }}</span>
            <i aria-hidden="true">↗</i>
          </a>

          <button
            class="nav-toggle"
            type="button"
            [attr.aria-label]="'nav.menu' | transloco"
            [attr.aria-expanded]="open()"
            (click)="open.set(!open())"
          >
            <span></span><span></span>
          </button>
        </div>
      </nav>
    </header>

    <!-- Mobile full-screen menu -->
    <div class="menu-overlay" [class.is-open]="open()" [attr.aria-hidden]="!open()">
      <ul>
        <li [style.--i]="0"><a [routerLink]="['/', language.lang()]" (click)="close()" [attr.tabindex]="open() ? 0 : -1">{{ 'nav.home' | transloco }}</a></li>
        <li [style.--i]="1"><a [routerLink]="['/', language.lang()]" fragment="work" (click)="close()" [attr.tabindex]="open() ? 0 : -1">{{ 'nav.work' | transloco }}</a></li>
        <li [style.--i]="2"><a [routerLink]="['/', language.lang()]" fragment="experience" (click)="close()" [attr.tabindex]="open() ? 0 : -1">{{ 'nav.experience' | transloco }}</a></li>
        <li [style.--i]="3"><a [routerLink]="['/', language.lang(), 'contact']" (click)="close()" [attr.tabindex]="open() ? 0 : -1">{{ 'nav.contact' | transloco }}</a></li>
      </ul>
      <div class="menu-foot">
        <span>Abidjan · {{ clock.time() }} GMT</span>
        <span>{{ 'hero.available' | transloco }}</span>
      </div>
    </div>
  `,
})
export class HeaderComponent {
  language = inject(LanguageService);
  motion = inject(MotionService);
  clock = inject(ClockService);
  open = signal(false);

  constructor() {
    effect(() => {
      document.documentElement.classList.toggle('menu-open', this.open());
      this.motion.lock(this.open());
    });
  }

  close(): void {
    this.open.set(false);
  }
}
