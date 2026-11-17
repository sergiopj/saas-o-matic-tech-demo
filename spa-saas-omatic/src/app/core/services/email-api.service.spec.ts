import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EmailApiService } from './email-api.service';
import { environment } from '../../../environments/environment';
import { EmailRequest, EmailResponse } from '../models/email.model';

describe('EmailApiService', () => {
  let service: EmailApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EmailApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(EmailApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should send email payload via POST /emails', () => {
    const payload: EmailRequest = {
      to: 'corporate@acme.com',
      subject: 'Special Offer',
      htmlBody: '<p>Content</p>',
    };

    const mockResponse: EmailResponse = {
      success: true,
      messageId: 'msg-123',
      recipient: 'corporate@acme.com',
      subject: 'Special Offer',
      sanitizedBodyLength: 16,
      dispatchedAt: new Date().toISOString(),
    };

    service.sendEmail(payload).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.messageId).toBe('msg-123');
    });

    const req = httpTesting.expectOne(`${environment.apiBaseUrl}/emails`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });
});
