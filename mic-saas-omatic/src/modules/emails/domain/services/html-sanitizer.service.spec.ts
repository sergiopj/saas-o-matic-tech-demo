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

  it('should strip single-quoted, unquoted, spaced, and uppercase event handlers without corrupting text', () => {
    const payload =
      '<a href="#" onclick=\'evil()\'>Link</a>' +
      '<div onmouseover=alert(1)>Hover</div>' +
      '<body onload  =  "init()">' +
      '<img ONERROR="bad()">' +
      '<p>Contains common button actions online.</p>';

    const clean = service.sanitize(payload);

    expect(clean).not.toContain('onclick');
    expect(clean).not.toContain('onmouseover');
    expect(clean).not.toContain('onload');
    expect(clean).not.toContain('ONERROR');
    expect(clean).toContain('<a href="#" >Link</a>');
    expect(clean).toContain('<div >Hover</div>');
    expect(clean).toContain('Contains common button actions online.');
  });

  it('should return empty string on null or empty input', () => {
    expect(service.sanitize('')).toBe('');
    expect(service.sanitize(null as any)).toBe('');
  });
});
