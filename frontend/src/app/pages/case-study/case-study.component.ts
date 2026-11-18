import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { ApiService } from '../../core/api.service';
import { LanguageService } from '../../core/language.service';
import { Project } from '../../core/models';
import { CaseMockComponent } from '../../shared/case-mock.component';
import { MagneticDirective } from '../../shared/magnetic.directive';
import { ScrubComponent } from '../../shared/scrub.component';
import { SplitComponent } from '../../shared/split.component';
import { RevealDirective } from '../../shared/reveal.directive';

@Component({
  selector: 'app-case-study',
  imports: [RouterLink, TranslocoPipe, CaseMockComponent, MagneticDirective, RevealDirective, ScrubComponent, SplitComponent],
  template: `
    @if (project(); as p) {
      <section class="cs-hero">
        <div class="container">
          <a class="back-link" [routerLink]="['/', language.lang()]" fragment="work">
            <i aria-hidden="true">←</i> {{ 'caseStudy.back' | transloco }}</a>
          <p class="sec-label cs-label"><span>{{ indexLabel() }}</span>{{ p.role }}</p>
          <h1 class="cs-title" [appSplit]="p.title" [splitImmediate]="true"></h1>
          <p class="cs-summary hero-in" style="--d: 4">{{ p.summary }}</p>
          <dl class="cs-facts hero-in" style="--d: 5">
            <div><dt>{{ 'caseStudy.role' | transloco }}</dt><dd>{{ p.role }}</dd></div>
            <div><dt>{{ 'caseStudy.technologies' | transloco }}</dt><dd>{{ p.tags.join(' · ') }}</dd></div>
          </dl>
        </div>
      </section>

      <section class="cs-mock-wrap">
        <div class="container hero-in" style="--d: 6">
          <app-case-mock [kind]="p.visual" [url]="mockUrl(p)" [caption]="p.title" />
        </div>
      </section>

      <section class="cs-body">
        <div class="container">
          <div class="cs-row" appReveal>
            <h2><span>01</span>{{ 'caseStudy.context' | transloco }}</h2>
            <p>{{ p.context }}</p>
          </div>
          <div class="cs-row" appReveal>
            <h2><span>02</span>{{ 'caseStudy.problem' | transloco }}</h2>
            <p>{{ p.problem }}</p>
          </div>
          <div class="cs-row" appReveal>
            <h2><span>03</span>{{ 'caseStudy.approach' | transloco }}</h2>
            <p>{{ p.approach }}</p>
          </div>
          <div class="cs-row" appReveal>
            <h2><span>04</span>{{ 'caseStudy.contributions' | transloco }}</h2>
            <ul class="cs-list">
              @for (contribution of p.contributions; track $index) {
                <li>{{ contribution }}</li>
              }
            </ul>
          </div>
          <div class="cs-row" appReveal>
            <h2><span>05</span>{{ 'caseStudy.technologies' | transloco }}</h2>
            <div class="chip-row">
              @for (tag of p.tags; track tag) {
                <span class="chip">{{ tag }}</span>
              }
            </div>
          </div>

          <blockquote class="cs-learnings" appReveal>
            <p class="sec-label"><span>06</span>{{ 'caseStudy.learnings' | transloco }}</p>
            <p class="cs-learnings-text" [appScrub]="p.learnings"></p>
          </blockquote>

          <div class="cs-cta" appReveal>
            <a class="btn btn-primary" appMagnetic [routerLink]="['/', language.lang(), 'contact']">
              <span>{{ 'caseStudy.discuss' | transloco }}</span><i class="btn-ico" aria-hidden="true">↗</i></a>
          </div>
        </div>
      </section>

      @if (next(); as n) {
        <a class="cs-next" [routerLink]="['/', language.lang(), 'projects', n.slug]">
          <div class="container">
            <span class="cs-next-label">{{ 'caseStudy.next' | transloco }}</span>
            <span class="cs-next-title">{{ n.title }} <i aria-hidden="true">→</i></span>
          </div>
        </a>
      }
    } @else if (notFound()) {
      <div class="empty-state">
        <h1 class="sec-title" style="margin-bottom: 28px;">{{ 'caseStudy.notFound' | transloco }}</h1>
        <a class="btn btn-ghost" [routerLink]="['/', language.lang()]" fragment="work">
          <span>{{ 'caseStudy.backToWork' | transloco }}</span></a>
      </div>
    } @else {
      <div class="loading-state">
        <div class="spinner" aria-hidden="true"></div>
      </div>
    }
  `,
})
export class CaseStudyComponent {
  /** Bound from the :slug route parameter (withComponentInputBinding). */
  slug = input.required<string>();

  language = inject(LanguageService);
  private api = inject(ApiService);
  private title = inject(Title);
  private meta = inject(Meta);

  project = signal<Project | null>(null);
  notFound = signal(false);

  private content = toSignal(this.api.content$);

  /** Position of this project in the published list ("02 / 05"). */
  indexLabel = computed(() => {
    const list = this.content()?.projects ?? [];
    const i = list.findIndex((p) => p.slug === this.project()?.slug);
    const pad = (n: number) => String(n).padStart(2, '0');
    return i < 0 ? '—' : `${pad(i + 1)} / ${pad(list.length)}`;
  });

  /** The next project (wrapping around), for the end-of-page teaser. */
  next = computed(() => {
    const list = this.content()?.projects ?? [];
    const i = list.findIndex((p) => p.slug === this.project()?.slug);
    return i < 0 || list.length < 2 ? null : list[(i + 1) % list.length];
  });

  /** Plausible, honest address bar per project (public URLs when they exist). */
  mockUrl(p: Project): string {
    const urls: Record<string, string> = {
      'gisabo-money-transfer': 'gisabogroup.ca — production',
      'hopefund-microfinance-platform': 'hopefund — core banking',
      'observability-monitoring-platform': 'observability — internal',
      'odoo-business-process-automation': 'api console — integration',
    };
    return urls[p.slug] ?? 'app.internal — production';
  }

  constructor() {
    // Reload when the slug or the language changes (no page refresh)
    effect(() => {
      const slug = this.slug();
      this.language.lang(); // track language changes
      this.load(slug);
    });
  }

  private load(slug: string): void {
    this.notFound.set(false);
    this.api.getProject(slug).subscribe({
      next: (project) => {
        this.project.set(project);
        const pageTitle = `${project.title} — Yeo Yedjande`;
        this.title.setTitle(pageTitle);
        this.meta.updateTag({ property: 'og:title', content: pageTitle });
        this.meta.updateTag({ name: 'description', content: project.summary });
        this.meta.updateTag({ property: 'og:description', content: project.summary });
      },
      error: () => {
        this.project.set(null);
        this.notFound.set(true);
      },
    });
  }
}
