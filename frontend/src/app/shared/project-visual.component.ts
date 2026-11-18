import { Component, computed, inject, input } from '@angular/core';

import { LanguageService } from '../core/language.service';

const LABELS = {
  en: {
    overview: 'Overview', services: 'Services', data: 'Data', alerts: 'Alerts', reports: 'Reports',
    uptime: 'Uptime', latency: 'Response time', rpm: 'Requests/min',
    accounts: 'Accounts', loans: 'Loans', cards: 'Cards', transfers: 'Transfers', agencies: 'Agencies', audit: 'Audit',
    payment: 'Prepaid payment', approved: 'Approved', sent: 'Sent', received: 'Received',
    rules: 'business rules · workflows',
  },
  fr: {
    overview: "Vue d'ensemble", services: 'Services', data: 'Données', alerts: 'Alertes', reports: 'Rapports',
    uptime: 'Disponibilité', latency: 'Temps de réponse', rpm: 'Requêtes/min',
    accounts: 'Comptes', loans: 'Prêts', cards: 'Cartes', transfers: 'Transferts', agencies: 'Agences', audit: 'Audit',
    payment: 'Paiement prépayé', approved: 'Approuvé', sent: 'Envoyé', received: 'Reçu',
    rules: 'règles métier · workflows',
  },
};

/** Per-project product vignette: a small, believable piece of UI for each
 *  kind of project (dashboards, modules, flows) — HTML/SVG only, no images.
 *  Sized in container units so it scales with whatever box it sits in.
 *  Kinds: payments · monitoring · bank · transfer · integration (+ fallback). */
@Component({
  selector: 'app-project-visual',
  template: `
    <div class="project-visual" aria-hidden="true">
      <div class="pv-glow"></div>
      @switch (kind()) {
        @case ('monitoring') {
          <div class="pv-app">
            <aside class="pv-side">
              <span class="pv-logo">YY</span>
              <span class="pv-nav on"><i></i>{{ t().overview }}</span>
              <span class="pv-nav"><i></i>{{ t().services }}</span>
              <span class="pv-nav"><i></i>{{ t().data }}</span>
              <span class="pv-nav"><i></i>{{ t().alerts }}</span>
              <span class="pv-nav"><i></i>{{ t().reports }}</span>
            </aside>
            <div class="pv-main">
              <div class="pv-title">Monitoring <span class="pv-dots">···</span></div>
              <div class="pv-kpis">
                <div class="pv-kpi"><b class="ok">99,9 %</b><span>{{ t().uptime }}</span></div>
                <div class="pv-kpi"><b class="ok">42 ms</b><span>{{ t().latency }}</span></div>
                <div class="pv-kpi"><b>1 248</b><span>{{ t().rpm }}</span></div>
              </div>
              <svg class="pv-chart" viewBox="0 0 300 90" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="pvc-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color="#20c5d8" stop-opacity="0.45" /><stop offset="1" stop-color="#20c5d8" stop-opacity="0" />
                  </linearGradient>
                </defs>
                <g stroke="rgba(255,255,255,0.06)"><line x1="0" y1="22" x2="300" y2="22" /><line x1="0" y1="50" x2="300" y2="50" /><line x1="0" y1="78" x2="300" y2="78" /></g>
                <path d="M0 70 C25 62 40 48 62 52 S100 70 124 54 S160 22 186 30 S226 58 250 40 S286 14 300 18 V90 H0 Z" fill="url(#pvc-fill)" />
                <path class="pv-line" d="M0 70 C25 62 40 48 62 52 S100 70 124 54 S160 22 186 30 S226 58 250 40 S286 14 300 18" />
              </svg>
            </div>
          </div>
        }
        @case ('bank') {
          <div class="pv-bank">
            <div class="pv-bank-icon">
              <svg viewBox="0 0 120 110">
                <defs>
                  <linearGradient id="pvb-g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color="#5fe3f0" /><stop offset="1" stop-color="#087ebd" />
                  </linearGradient>
                </defs>
                <path d="M60 6 L112 34 H8 Z" fill="url(#pvb-g)" />
                <rect x="14" y="40" width="92" height="7" rx="2" fill="url(#pvb-g)" />
                @for (x of [20, 41, 62, 83]; track x) {
                  <rect [attr.x]="x" y="52" width="15" height="38" rx="3" fill="url(#pvb-g)" />
                }
                <rect x="8" y="94" width="104" height="10" rx="3" fill="url(#pvb-g)" />
              </svg>
            </div>
            <ul class="pv-modules">
              <li><svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5h8v2" /></svg>{{ t().accounts }}</li>
              <li><svg viewBox="0 0 24 24"><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" /></svg>{{ t().loans }}</li>
              <li><svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>{{ t().cards }}</li>
              <li><svg viewBox="0 0 24 24"><path d="M7 7h13l-4-4M17 17H4l4 4" /></svg>{{ t().transfers }}</li>
              <li><svg viewBox="0 0 24 24"><path d="M12 21s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></svg>{{ t().agencies }}</li>
              <li><svg viewBox="0 0 24 24"><path d="M12 22s8-3 8-10V5l-8-3-8 3v7c0 7 8 10 8 10z" /></svg>{{ t().audit }}</li>
            </ul>
          </div>
        }
        @case ('transfer') {
          <div class="pv-transfer">
            <svg class="pv-globe" viewBox="0 0 320 180">
              <defs>
                <linearGradient id="pvt-g" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stop-color="#087ebd" /><stop offset="1" stop-color="#20c5d8" />
                </linearGradient>
              </defs>
              <g stroke="rgba(255,255,255,0.14)" fill="none" stroke-width="1.4">
                <circle cx="160" cy="98" r="62" /><ellipse cx="160" cy="98" rx="28" ry="62" /><line x1="98" y1="98" x2="222" y2="98" />
                <path d="M106 70 Q160 56 214 70 M106 126 Q160 140 214 126" />
              </g>
              <path class="pv-arc" d="M52 132 Q160 -22 270 118" stroke="url(#pvt-g)" />
              <circle cx="52" cy="132" r="7" fill="#087ebd" /><circle cx="52" cy="132" r="14" fill="none" stroke="#087ebd" opacity="0.4" />
              <circle cx="270" cy="118" r="7" fill="#20c5d8" /><circle cx="270" cy="118" r="14" fill="none" stroke="#20c5d8" opacity="0.4" />
            </svg>
            <span class="pv-tag a"><b>CAD · EUR</b>{{ t().sent }}</span>
            <span class="pv-tag b"><b>BIF · momo</b>{{ t().received }}</span>
          </div>
        }
        @case ('integration') {
          <div class="pv-flow">
            <div class="pv-nodes">
              <span class="pv-node">Frontend</span>
              <i class="pv-pipe"></i>
              <span class="pv-node hot">FastAPI</span>
              <i class="pv-pipe"></i>
              <span class="pv-node">Odoo ERP</span>
            </div>
            <p class="pv-caption">REST · {{ t().rules }}</p>
            <pre class="pv-json">{{ '{' }} <b>"invoice"</b>: "INV-2041", <b>"status"</b>: <em>"posted"</em> {{ '}' }}</pre>
          </div>
        }
        @case ('security') {
          <div class="pv-security">
            <svg viewBox="0 0 120 130">
              <defs>
                <linearGradient id="pvs-g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stop-color="#5fe3f0" /><stop offset="1" stop-color="#087ebd" />
                </linearGradient>
              </defs>
              <path d="M60 6 L108 24 V64 C108 96 86 114 60 124 C34 114 12 96 12 64 V24 Z" fill="rgba(32,197,216,0.08)" stroke="url(#pvs-g)" stroke-width="4" />
              <rect x="40" y="58" width="40" height="32" rx="7" fill="url(#pvs-g)" />
              <path d="M47 58 V48 a13 13 0 0 1 26 0 V58" fill="none" stroke="url(#pvs-g)" stroke-width="5" />
            </svg>
            <ul class="pv-modules">
              <li>OAuth2</li><li>OpenID Connect</li><li>JWT · RS256</li><li>RBAC</li>
            </ul>
          </div>
        }
        @case ('drone') {
          <div class="pv-transfer">
            <svg class="pv-globe" viewBox="0 0 320 180">
              <g stroke="rgba(255,255,255,0.08)">
                @for (x of [40, 100, 160, 220, 280]; track x) {
                  <line [attr.x1]="x" y1="10" [attr.x2]="x" y2="170" />
                }
                @for (y of [40, 90, 140]; track y) {
                  <line x1="10" [attr.y1]="y" x2="310" [attr.y2]="y" />
                }
              </g>
              <path class="pv-arc" d="M40 140 L110 80 L190 118 L270 44" stroke="#20c5d8" />
              <g fill="#087ebd"><circle cx="40" cy="140" r="6" /><circle cx="110" cy="80" r="6" /><circle cx="190" cy="118" r="6" /></g>
              <circle cx="270" cy="44" r="8" fill="#20c5d8" /><circle cx="270" cy="44" r="16" fill="none" stroke="#20c5d8" opacity="0.4" />
            </svg>
            <span class="pv-tag a"><b>inspection #142</b>GPS · 4K</span>
          </div>
        }
        @default {
          <div class="pv-pay">
            <div class="pv-card">
              <span class="pv-chip"></span>
              <span class="pv-card-num">•••• 4021</span>
              <span class="pv-card-label">{{ t().payment }}</span>
            </div>
            <i class="pv-pipe"></i>
            <div class="pv-api">
              <b>API 200</b>
              <span>✔ signed · JWT</span>
              <em>{{ t().approved }}</em>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class ProjectVisualComponent {
  kind = input<string>('payments');
  private language = inject(LanguageService);
  t = computed(() => LABELS[this.language.lang()] ?? LABELS.en);
}
