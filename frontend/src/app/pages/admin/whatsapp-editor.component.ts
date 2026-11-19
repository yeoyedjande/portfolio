import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminApiService } from '../../core/admin-api.service';

/** WhatsApp number used by every WhatsApp button of the site (contact page,
 *  home contact section, footer, floating button). Empty = buttons hidden. */
@Component({
  selector: 'app-admin-whatsapp',
  imports: [FormsModule],
  template: `
    <div class="admin-panel">
      <h2>WhatsApp</h2>
      <p class="hint photo-hint">Numéro utilisé par tous les boutons WhatsApp du site (page Contact, accueil, footer et bouton flottant). Laissez vide pour masquer ces boutons.</p>
      <form class="wa-admin" (ngSubmit)="save()">
        <div class="form-field">
          <label for="wa-number">Numéro WhatsApp <span class="hint">(format international)</span></label>
          <input id="wa-number" name="number" type="tel" inputmode="tel" placeholder="+225 05 46 58 03 17"
                 [ngModel]="number()" (ngModelChange)="number.set($event); message.set('')" autocomplete="off" />
        </div>
        <button class="btn btn-primary btn-sm" type="submit" [disabled]="busy()">{{ busy() ? 'Enregistrement…' : 'Enregistrer' }}</button>
        @if (testUrl()) {
          <a class="btn btn-quiet btn-sm" [href]="testUrl()" target="_blank" rel="noopener">Tester le lien ↗</a>
        }
      </form>
      @if (message()) {
        <div class="alert" [class.alert-success]="!isError()" [class.alert-error]="isError()" role="status" style="margin-top: 14px;">{{ message() }}</div>
      }
    </div>
  `,
})
export class WhatsAppEditorComponent {
  private api = inject(AdminApiService);

  number = signal('');
  busy = signal(false);
  message = signal('');
  isError = signal(false);
  testUrl = computed(() => {
    const digits = this.number().replace(/\D/g, '');
    return digits.length >= 8 ? `https://wa.me/${digits}` : '';
  });

  constructor() {
    this.api.getWhatsApp().subscribe((res) => this.number.set(res.number));
  }

  save(): void {
    this.busy.set(true);
    this.api.updateWhatsApp(this.number()).subscribe({
      next: (res) => {
        this.number.set(res.number);
        this.busy.set(false);
        this.isError.set(false);
        this.message.set(res.number ? 'Numéro enregistré — les boutons WhatsApp sont à jour.' : 'Numéro retiré — les boutons WhatsApp sont masqués.');
      },
      error: (err) => {
        this.busy.set(false);
        this.isError.set(true);
        this.message.set(
          err.status === 422
            ? 'Numéro invalide : utilisez le format international, ex. +225 05 46 58 03 17.'
            : "Échec de l'enregistrement. Réessayez."
        );
      },
    });
  }
}
