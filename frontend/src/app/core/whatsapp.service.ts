import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';

import { ApiService } from './api.service';

/** Single source for every WhatsApp entry point (contact page, home CTA,
 *  footer, floating button): the number is edited in the admin, the
 *  pre-filled greeting follows the visitor's language. An empty number in
 *  the admin hides every WhatsApp button. */
@Injectable({ providedIn: 'root' })
export class WhatsAppService {
  private content = toSignal(inject(ApiService).content$);
  private message = toSignal(inject(TranslocoService).selectTranslate('contact.whatsappMessage'), {
    initialValue: '',
  });

  /** As entered in the admin, e.g. "+225 05 46 58 03 17". */
  readonly display = computed(() => this.content()?.settings.whatsapp ?? '');

  /** wa.me deep link (app on mobile, WhatsApp Web on desktop); "" if unset. */
  readonly url = computed(() => {
    const digits = this.display().replace(/\D/g, '');
    if (!digits) return '';
    return `https://wa.me/${digits}?text=${encodeURIComponent(this.message() || '')}`;
  });
}
