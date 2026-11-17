export interface EmailRequest {
  to: string;
  subject: string;
  htmlBody: string;
}

export interface EmailResponse {
  success: boolean;
  messageId: string;
  recipient: string;
  subject: string;
  sanitizedBodyLength: number;
  dispatchedAt: string;
}
