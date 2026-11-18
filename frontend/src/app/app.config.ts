import { ApplicationConfig, LOCALE_ID, isDevMode, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ViewportScroller, registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withNavigationErrorHandler,
  withViewTransitions,
} from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth.interceptor';
import { detectInitialLang } from './core/language.service';
import { SmoothViewportScroller } from './core/smooth-viewport-scroller';
import { TranslocoHttpLoader } from './core/transloco.loader';

// French dates in the admin (DatePipe) — the public site renders no dates.
registerLocaleData(localeFr);

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'fr' },
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
      // Native cross-document-style page transitions (View Transitions API);
      // browsers without support simply swap pages instantly.
      withViewTransitions({
        skipInitialTransition: true,
        onViewTransitionCreated: ({ transition, from, to }) => {
          // Same page, different #fragment: scroll, no page transition.
          const path = (snapshot: typeof to) =>
            snapshot.pathFromRoot.map((s) => s.url.map((u) => u.path).join('/')).join('/');
          if (path(from) === path(to) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            // skipping rejects `ready`; swallow it so it is not reported as an error
            transition.ready.catch(() => undefined);
            transition.skipTransition();
          }
        },
      }),
      // After a redeploy, lazy chunks referenced by an open tab no longer
      // exist — reload once to pick up the fresh index.html and bundles.
      withNavigationErrorHandler((error) => {
        const message = String((error as { error?: unknown }).error ?? error);
        const isStaleChunk =
          message.includes('Failed to fetch dynamically imported module') ||
          message.includes('ChunkLoadError') ||
          message.includes('error loading dynamically imported module');
        if (isStaleChunk && !sessionStorage.getItem('chunk_reload')) {
          sessionStorage.setItem('chunk_reload', '1');
          window.location.reload();
        } else if (!isStaleChunk) {
          sessionStorage.removeItem('chunk_reload');
        }
      })
    ),
    { provide: ViewportScroller, useClass: SmoothViewportScroller },
    provideHttpClient(withInterceptors([authInterceptor])),
    provideTransloco({
      config: {
        availableLangs: ['en', 'fr'],
        defaultLang: detectInitialLang(),
        fallbackLang: 'en',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
  ],
};
