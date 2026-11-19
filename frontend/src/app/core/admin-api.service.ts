import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AdminExperience,
  AdminProject,
  AdminSiteSettings,
  AdminStackItem,
  AdminValueProp,
  ContactMessage,
} from './models';

/** Authenticated API used by the admin dashboard (raw i18n payloads). */
@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private http = inject(HttpClient);
  private base = '/api/admin';

  // Site settings
  getSettings(): Observable<AdminSiteSettings> {
    return this.http.get<AdminSiteSettings>(`${this.base}/settings`);
  }
  updateSettings(payload: Partial<AdminSiteSettings>): Observable<AdminSiteSettings> {
    return this.http.put<AdminSiteSettings>(`${this.base}/settings`, payload);
  }

  // Profile photo (stored server-side in the database)
  getPhoto(): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${this.base}/photo`);
  }
  uploadPhoto(image: Blob, filename: string): Observable<{ url: string }> {
    const body = new FormData();
    body.append('file', image, filename);
    return this.http.post<{ url: string }>(`${this.base}/photo`, body);
  }
  deletePhoto(): Observable<void> {
    return this.http.delete<void>(`${this.base}/photo`);
  }

  // WhatsApp number ("" hides the WhatsApp buttons)
  getWhatsApp(): Observable<{ number: string }> {
    return this.http.get<{ number: string }>(`${this.base}/whatsapp`);
  }
  updateWhatsApp(number: string): Observable<{ number: string }> {
    return this.http.put<{ number: string }>(`${this.base}/whatsapp`, { number });
  }

  // Generic CRUD (entity name maps to the API path)
  list<T>(entity: string): Observable<T[]> {
    return this.http.get<T[]>(`${this.base}/${entity}`);
  }
  create<T>(entity: string, payload: unknown): Observable<T> {
    return this.http.post<T>(`${this.base}/${entity}`, payload);
  }
  update<T>(entity: string, id: number, payload: unknown): Observable<T> {
    return this.http.put<T>(`${this.base}/${entity}/${id}`, payload);
  }
  delete(entity: string, id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${entity}/${id}`);
  }

  // Typed conveniences
  listProjects() { return this.list<AdminProject>('projects'); }
  listStack() { return this.list<AdminStackItem>('stack'); }
  listExperiences() { return this.list<AdminExperience>('experiences'); }
  listValues() { return this.list<AdminValueProp>('values'); }

  // Messages inbox
  listMessages(): Observable<ContactMessage[]> {
    return this.http.get<ContactMessage[]>(`${this.base}/messages`);
  }
  markRead(id: number): Observable<ContactMessage> {
    return this.http.patch<ContactMessage>(`${this.base}/messages/${id}/read`, {});
  }
  deleteMessage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/messages/${id}`);
  }
}
