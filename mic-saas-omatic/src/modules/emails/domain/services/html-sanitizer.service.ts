import { Injectable } from '@nestjs/common';

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
      .replace(/\bon[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/javascript:[^"']*/gi, '');
  }
}
