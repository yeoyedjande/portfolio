import { Component, OnDestroy, inject, signal } from '@angular/core';

import { AdminApiService } from '../../core/admin-api.service';

/** Profile photo shown on the "access pass" card of the About section.
 *  The image is centre-cropped to a square and compressed in the browser
 *  (≈640 px WebP) before upload, so any phone photo works and the stored
 *  file stays small. */
@Component({
  selector: 'app-admin-photo',
  template: `
    <div class="admin-panel photo-panel">
      <h2>Photo de profil</h2>
      <p class="hint photo-hint">Affichée sur la carte d'accès de la section « À propos ». Elle est recadrée en carré et optimisée automatiquement.</p>

      <div class="photo-row">
        <div class="photo-preview">
          <img [src]="preview() || current() || defaultPhoto" alt="Aperçu de la photo de profil" />
        </div>

        <div class="photo-actions">
          <label class="btn btn-outline btn-sm photo-pick">
            Choisir une image…
            <input type="file" accept="image/jpeg,image/png,image/webp" (change)="pick($event)" hidden />
          </label>

          @if (pending()) {
            <button class="btn btn-primary btn-sm" type="button" [disabled]="busy()" (click)="upload()">
              {{ busy() ? 'Envoi…' : 'Enregistrer la photo' }}
            </button>
            <button class="btn btn-quiet btn-sm" type="button" [disabled]="busy()" (click)="cancel()">Annuler</button>
          } @else if (current()) {
            <button class="btn btn-danger btn-sm" type="button" [disabled]="busy()" (click)="reset()">
              Revenir à la photo par défaut
            </button>
          }

          <span class="hint">JPEG, PNG ou WebP. {{ current() ? 'Photo personnalisée en ligne.' : 'Photo par défaut en ligne.' }}</span>
          @if (message()) {
            <div class="alert" [class.alert-success]="!isError()" [class.alert-error]="isError()" role="status">{{ message() }}</div>
          }
        </div>
      </div>
    </div>
  `,
})
export class PhotoEditorComponent implements OnDestroy {
  private api = inject(AdminApiService);

  readonly defaultPhoto = 'assets/img/profile.webp';
  current = signal('');
  preview = signal('');
  pending = signal<Blob | null>(null);
  busy = signal(false);
  message = signal('');
  isError = signal(false);

  constructor() {
    this.api.getPhoto().subscribe((res) => this.current.set(res.url));
  }

  async pick(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.message.set('');
    try {
      const blob = await this.squareCrop(file, 640);
      this.setPreview(URL.createObjectURL(blob));
      this.pending.set(blob);
    } catch {
      this.fail("Impossible de lire cette image. Essayez un JPEG ou un PNG.");
    }
  }

  upload(): void {
    const blob = this.pending();
    if (!blob) return;
    this.busy.set(true);
    const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
    this.api.uploadPhoto(blob, `profile.${ext}`).subscribe({
      next: (res) => {
        this.current.set(res.url);
        this.pending.set(null);
        this.setPreview('');
        this.busy.set(false);
        this.ok('Photo mise à jour — elle est en ligne.');
      },
      error: (err) => {
        this.busy.set(false);
        this.fail(err.status === 413 ? 'Image trop lourde (3 Mo max).' : "Échec de l'envoi. Réessayez.");
      },
    });
  }

  cancel(): void {
    this.pending.set(null);
    this.setPreview('');
  }

  reset(): void {
    if (!confirm('Revenir à la photo par défaut ?')) return;
    this.busy.set(true);
    this.api.deletePhoto().subscribe({
      next: () => {
        this.current.set('');
        this.busy.set(false);
        this.ok('Photo par défaut rétablie.');
      },
      error: () => {
        this.busy.set(false);
        this.fail('Échec de la suppression.');
      },
    });
  }

  ngOnDestroy(): void {
    this.setPreview('');
  }

  private ok(text: string): void {
    this.isError.set(false);
    this.message.set(text);
  }

  private fail(text: string): void {
    this.isError.set(true);
    this.message.set(text);
  }

  private setPreview(url: string): void {
    const old = this.preview();
    if (old) URL.revokeObjectURL(old);
    this.preview.set(url);
  }

  /** Centre-crop to a square (biased upward on portraits, where faces are)
   *  and re-encode as WebP, falling back to JPEG. */
  private async squareCrop(file: File, size: number): Promise<Blob> {
    const bitmap = await createImageBitmap(file);
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = (bitmap.width - side) / 2;
    const sy = bitmap.height > bitmap.width ? (bitmap.height - side) * 0.2 : (bitmap.height - side) / 2;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = Math.min(size, side);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const encode = (type: string, quality: number) =>
      new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
    const webp = await encode('image/webp', 0.86);
    if (webp && webp.type === 'image/webp') return webp;
    const jpeg = await encode('image/jpeg', 0.88);
    if (!jpeg) throw new Error('encode');
    return jpeg;
  }
}
