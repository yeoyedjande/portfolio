import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { map } from 'rxjs';

import { ApiService } from '../../core/api.service';
import { LanguageService } from '../../core/language.service';
import { StackItem } from '../../core/models';
import { ClockService } from '../../shared/clock.service';
import { CountUpDirective } from '../../shared/count-up.directive';
import { DotFieldComponent } from '../../shared/dot-field.component';
import { HeroVisualComponent } from '../../shared/hero-visual.component';
import { MagneticDirective } from '../../shared/magnetic.directive';
import { ProjectVisualComponent } from '../../shared/project-visual.component';
import { RevealDirective } from '../../shared/reveal.directive';
import { ScrubComponent } from '../../shared/scrub.component';
import { SplitComponent } from '../../shared/split.component';
import { StackCardsDirective } from '../../shared/stack-cards.directive';

@Component({
  selector: 'app-home',
  imports: [
    AsyncPipe,
    RouterLink,
    TranslocoPipe,
    CountUpDirective,
    DotFieldComponent,
    HeroVisualComponent,
    MagneticDirective,
    ProjectVisualComponent,
    RevealDirective,
    ScrubComponent,
    SplitComponent,
    StackCardsDirective,
  ],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  api = inject(ApiService);
  language = inject(LanguageService);
  clock = inject(ClockService);

  /** Stack items grouped by category, preserving order of first appearance. */
  stackGroups$ = this.api.content$.pipe(
    map((content) => {
      const groups: { category: string; items: StackItem[] }[] = [];
      for (const item of content.stack) {
        let group = groups.find((g) => g.category === item.category);
        if (!group) {
          group = { category: item.category, items: [] };
          groups.push(group);
        }
        group.items.push(item);
      }
      return groups;
    })
  );

  constructor() {
    this.language.setPageMeta('meta.homeTitle', 'meta.homeDescription');
  }

  /** Split "8+ years of experience" into a big number ("8+") and a label. */
  impactParts(impact: string): { number: string | null; label: string } {
    const match = impact.match(/^(\d+[+%]?)\s+(.*)$/);
    return match ? { number: match[1], label: match[2] } : { number: null, label: impact };
  }

  pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  /** Two marquee rows: even-indexed items on the first, odd on the second,
   *  so the rows read differently while drifting in opposite directions. */
  marqueeNames(stack: StackItem[], row: number): string[] {
    const names = stack.map((s) => s.name);
    const half = names.filter((_, i) => i % 2 === row);
    return half.length ? half : names;
  }
}
