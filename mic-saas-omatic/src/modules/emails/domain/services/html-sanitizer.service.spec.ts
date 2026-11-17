import { HtmlSanitizerService } from './html-sanitizer.service';

describe('HtmlSanitizerService', () => {
  let service: HtmlSanitizerService;

  beforeEach(() => {
    service = new HtmlSanitizerService();
  });

  it('should strip script tags and javascript handlers', () => {
    const malicious = '<p>Hello</p><script>alert("xss")</script><img src="x" onerror="alert(1)">';
    const clean = service.sanitize(malicious);

    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('onerror');
    expect(clean).toContain('<p>Hello</p>');
  });

  it('should return empty string on null or empty input', () => {
    expect(service.sanitize('')).toBe('');
    expect(service.sanitize(null as any)).toBe('');
  });
});
