import { Injectable } from '@nestjs/common';

/**
 * Domain service protecting outbound transactional email streams against
 * Cross-Site Scripting (XSS) and malicious payload injection in rich HTML bodies.
 */
@Injectable()
export class HtmlSanitizerService {
  /**
   * Strips active script tags, iframes, embed/object nodes, and inline javascript handlers.
   */
  sanitize(html: string): string {
    if (!html) {
      return '';
    }

    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/\s*on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
      .replace(/javascript:[^"']*/gi, '');
  }
}
