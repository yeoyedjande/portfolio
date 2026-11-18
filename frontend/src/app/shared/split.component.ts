import { Component, ElementRef, OnDestroy, OnInit, computed, inject, input } from '@angular/core';

interface Word {
  text: string;
  em: boolean;
}

/** Splits a title into masked words that slide up in sequence when the title
 *  enters the viewport. Words wrapped in *asterisks* render as the italic
 *  serif accent, e.g. "Let's build something *reliable*." — so content
 *  editors control the accent from the admin or the i18n files.
 *
 *  Usage: <h2 appSplit="Some *title*"></h2>
 *         <h1 appSplit="..." [splitImmediate]="true"></h1>  (no scroll trigger) */
@Component({
  selector: '[appSplit]',
  host: { class: 'split' },
  template: `@for (w of words(); track $index) {<span class="w"><span class="wi" [class.em]="w.em" [style.--i]="$index">{{ w.text }}</span></span>{{ ' ' }}}`,
})
export class SplitComponent implements OnInit, OnDestroy {
  appSplit = input.required<string>();
  /** Animate on the global "ready" signal instead of on scroll (hero titles). */
  splitImmediate = input(false);
  /** Italicise the last word when the text carries no *markers*. */
  accentLast = input(false);

  private el = inject(ElementRef<HTMLElement>);
  private observer?: IntersectionObserver;

  words = computed<Word[]>(() => {
    const raw = (this.appSplit() ?? '').trim();
    const hasMarkers = /\*[^*]+\*/.test(raw);
    const words: Word[] = [];
    let em = false;
    for (const token of raw.split(/\s+/).filter(Boolean)) {
      let t = token;
      const opens = t.startsWith('*');
      if (opens) {
        em = true;
        t = t.slice(1);
      }
      const closes = t.includes('*');
      t = t.replace(/\*/g, '');
      words.push({ text: t, em });
      if (closes) em = false;
    }
    if (!hasMarkers && this.accentLast() && words.length > 1) {
      words[words.length - 1].em = true;
    }
    return words;
  });

  ngOnInit(): void {
    const host = this.el.nativeElement as HTMLElement;
    if (this.splitImmediate()) {
      host.classList.add('split-hero');
      return;
    }
    if (!('IntersectionObserver' in window)) {
      host.classList.add('is-in');
      return;
    }
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          host.classList.add('is-in');
          this.observer?.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -8% 0px' }
    );
    this.observer.observe(host);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
