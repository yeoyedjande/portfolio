import { Injectable, signal } from '@angular/core';

/** Live local time in Abidjan (GMT, no DST) — a small human detail shown in
 *  the hero and the footer so recruiters abroad see the time-zone overlap. */
@Injectable({ providedIn: 'root' })
export class ClockService {
  private format = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Abidjan',
  });

  readonly time = signal(this.format.format(new Date()));

  constructor() {
    setInterval(() => this.time.set(this.format.format(new Date())), 15_000);
  }
}
