import { Component, ElementRef, OnDestroy, computed, effect, inject, input, signal, viewChildren } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { ApiService } from '../../core/api.service';
import { LanguageService } from '../../core/language.service';
import { Project } from '../../core/models';
import { MotionService } from '../../core/motion.service';
import { MagneticDirective } from '../../shared/magnetic.directive';
import { ProjectVisualComponent } from '../../shared/project-visual.component';
import { RevealDirective } from '../../shared/reveal.directive';
import { SplitComponent } from '../../shared/split.component';

type SectionId = 'context' | 'problem' | 'approach' | 'contributions' | 'learnings';

@Component({
  selector: 'app-case-study',
  imports: [RouterLink, TranslocoPipe, MagneticDirective, ProjectVisualComponent, RevealDirective, SplitComponent],
  template: `
    @if (project(); as p) {
      <header class="cs-hero">
        <div class="container">
          <a class="back-link hero-in" style="--d: 0" [routerLink]="['/', language.lang()]" fragment="work">
            <i aria-hidden="true">←</i> {{ 'caseStudy.back' | transloco }}</a>
          <p class="sec-label hero-in" style="--d: 1">{{ p.role }}</p>
          <h1 class="cs-title" [appSplit]="p.title" [splitImmediate]="true"></h1>
          <p class="cs-summary hero-in" style="--d: 4">{{ p.summary }}</p>
          <div class="chip-row cs-tags hero-in" style="--d: 5">
            @for (tag of p.tags; track tag) {
              <span class="chip">{{ tag }}</span>
            }
          </div>
        </div>
      </header>

      <section class="cs-showcase">
        <div class="container">
          <figure class="cs-frame hero-in" style="--d: 6">
            <div class="cs-frame-bar" aria-hidden="true">
              <i></i><i></i><i></i>
              <span>{{ mockUrl(p) }}</span>
            </div>
            <div class="cs-frame-body">
              <app-project-visual [kind]="p.visual" />
            </div>
          </figure>
        </div>
      </section>

      <section class="cs-content">
        <div class="container cs-layout">
          <aside class="cs-aside">
            <nav class="cs-toc" [attr.aria-label]="'caseStudy.onThisPage' | transloco">
              <p class="cs-aside-title">{{ 'caseStudy.onThisPage' | transloco }}</p>
              @for (s of sections; track s) {
                <button type="button" class="cs-toc-link" [class.is-active]="active() === s" (click)="goTo(s)">
                  {{ 'caseStudy.' + s | transloco }}
                </button>
              }
            </nav>
            <div class="cs-aside-card">
              <p class="cs-aside-title">{{ 'caseStudy.role' | transloco }}</p>
              <p class="cs-aside-role">{{ p.role }}</p>
              <a class="btn btn-primary cs-aside-cta" appMagnetic="0.2" [routerLink]="['/', language.lang(), 'contact']">
                <span>{{ 'caseStudy.discuss' | transloco }}</span><i class="btn-ico" aria-hidden="true">↗</i>
              </a>
            </div>
          </aside>

          <div class="cs-main">
            <section class="cs-section" id="cs-context" #sec data-id="context" appReveal>
              <h2>{{ 'caseStudy.context' | transloco }}</h2>
              <p>{{ p.context }}</p>
            </section>
            <section class="cs-section" id="cs-problem" #sec data-id="problem" appReveal>
              <h2>{{ 'caseStudy.problem' | transloco }}</h2>
              <p>{{ p.problem }}</p>
            </section>
            <section class="cs-section" id="cs-approach" #sec data-id="approach" appReveal>
              <h2>{{ 'caseStudy.approach' | transloco }}</h2>
              <p>{{ p.approach }}</p>
            </section>
            <section class="cs-section" id="cs-contributions" #sec data-id="contributions" appReveal>
              <h2>{{ 'caseStudy.contributions' | transloco }}</h2>
              <ul class="cs-checks">
                @for (contribution of p.contributions; track $index) {
                  <li appReveal [style.--d]="$index">{{ contribution }}</li>
                }
              </ul>
            </section>
            <section class="cs-section cs-learnings" id="cs-learnings" #sec data-id="learnings" appReveal>
              <span class="cs-learnings-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" /></svg>
              </span>
              <h2>{{ 'caseStudy.learnings' | transloco }}</h2>
              <p>{{ p.learnings }}</p>
            </section>
          </div>
        </div>
      </section>

      @if (next(); as n) {
        <a class="cs-next" [routerLink]="['/', language.lang(), 'projects', n.slug]">
          <div class="container cs-next-inner">
            <div>
              <span class="cs-next-label">{{ 'caseStudy.next' | transloco }}</span>
              <span class="cs-next-title">{{ n.title }}</span>
            </div>
            <span class="cs-next-arrow" aria-hidden="true">→</span>
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
export class CaseStudyComponent implements OnDestroy {
  /** Bound from the :slug route parameter (withComponentInputBinding). */
  slug = input.required<string>();

  language = inject(LanguageService);
  private api = inject(ApiService);
  private motion = inject(MotionService);
  private title = inject(Title);
  private meta = inject(Meta);

  readonly sections: SectionId[] = ['context', 'problem', 'approach', 'contributions', 'learnings'];
  project = signal<Project | null>(null);
  notFound = signal(false);
  active = signal<SectionId>('context');

  private content = toSignal(this.api.content$);
  private sectionEls = viewChildren<ElementRef<HTMLElement>>('sec');
  private spy?: IntersectionObserver;

  /** The next project (wrapping around), for the end-of-page teaser. */
  next = computed(() => {
    const list = this.content()?.projects ?? [];
    const i = list.findIndex((p) => p.slug === this.project()?.slug);
    return i < 0 || list.length < 2 ? null : list[(i + 1) % list.length];
  });

  /** Plausible, honest address bar per project (public URLs when they exist). */
  mockUrl(p: Project): string {
    const urls: Record<string, string> = {
      'gisabo-money-transfer': 'gisabogroup.ca',
      'hopefund-microfinance-platform': 'hopefund · core banking',
      'observability-monitoring-platform': 'observability · internal',
      'odoo-business-process-automation': 'api console · integration',
    };
    return urls[p.slug] ?? 'app.internal · production';
  }

  constructor() {
    // Reload when the slug or the language changes (no page refresh)
    effect(() => {
      const slug = this.slug();
      this.language.lang(); // track language changes
      this.load(slug);
    });

    // Scroll-spy: highlight the section crossing the upper third of the screen
    effect(() => {
      const els = this.sectionEls().map((ref) => ref.nativeElement);
      this.spy?.disconnect();
      if (!els.length) return;
      this.spy = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) this.active.set(entry.target.getAttribute('data-id') as SectionId);
          }
        },
        { rootMargin: '-30% 0px -60% 0px' }
      );
      els.forEach((el) => this.spy!.observe(el));
    });
  }

  goTo(id: SectionId): void {
    const el = document.getElementById('cs-' + id);
    if (el) this.motion.scrollTo(el);
  }

  ngOnDestroy(): void {
    this.spy?.disconnect();
  }

  private load(slug: string): void {
    this.notFound.set(false);
    this.api.getProject(slug).subscribe({
      next: (project) => {
        this.project.set(project);
        this.active.set('context');
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
