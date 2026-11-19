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
import { IdBadgeComponent } from '../../shared/id-badge.component';
import { MagneticDirective } from '../../shared/magnetic.directive';
import { ProjectVisualComponent } from '../../shared/project-visual.component';
import { RevealDirective } from '../../shared/reveal.directive';
import { ScrubComponent } from '../../shared/scrub.component';
import { SplitComponent } from '../../shared/split.component';
import { StackCardsDirective } from '../../shared/stack-cards.directive';
import { TimelineDirective } from '../../shared/timeline.directive';
import { WhatsAppService } from '../../core/whatsapp.service';
import { WHATSAPP_ICON_PATH } from '../../shared/whatsapp';

@Component({
  selector: 'app-home',
  imports: [
    AsyncPipe,
    RouterLink,
    TranslocoPipe,
    CountUpDirective,
    DotFieldComponent,
    HeroVisualComponent,
    IdBadgeComponent,
    MagneticDirective,
    ProjectVisualComponent,
    RevealDirective,
    ScrubComponent,
    SplitComponent,
    StackCardsDirective,
    TimelineDirective,
  ],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  api = inject(ApiService);
  language = inject(LanguageService);
  clock = inject(ClockService);

  readonly waIcon = WHATSAPP_ICON_PATH;
  wa = inject(WhatsAppService);

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

  /** Line icons (24×24 path data) for the principle and value cards,
   *  cycled by position — decorative only. */
  readonly principleIcons = [
    'M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM21 21l-4.3-4.3', // understand: search
    'M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', // maintainable: layers
    'M12 22s8-3 8-10V5l-8-3-8 3v7c0 7 8 10 8 10zM9 12l2 2 4-4', // secure: shield
    'M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14l-3-3', // reliable: check
  ];
  readonly valueIcons = [
    'M3 7h18v13H3zM8 7V4h8v3M3 13h18', // business-oriented: briefcase
    'M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', // full stack: layers
    'M12 22s8-3 8-10V5l-8-3-8 3v7c0 7 8 10 8 10zM9 12l2 2 4-4', // secure APIs: shield
    'M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14l-3-3', // reliable delivery: check
    'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6', // enterprise: building
    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20', // international: globe
  ];

  icon(set: string[], index: number): string {
    return set[index % set.length];
  }

  /** Two marquee rows: even-indexed items on the first, odd on the second,
   *  so the rows read differently while drifting in opposite directions. */
  marqueeNames(stack: StackItem[], row: number): string[] {
    const names = stack.map((s) => s.name);
    const half = names.filter((_, i) => i % 2 === row);
    return half.length ? half : names;
  }
}
