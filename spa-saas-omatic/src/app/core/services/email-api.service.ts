import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EmailRequest, EmailResponse } from '../models/email.model';

@Injectable({
  providedIn: 'root',
})
export class EmailApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/emails`;

  sendEmail(payload: EmailRequest): Observable<EmailResponse> {
    return this.http.post<EmailResponse>(this.apiUrl, payload);
  }
}
