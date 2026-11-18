import { getSafeStorageItem, setSafeStorageItem } from './storage.util';

describe('storage.util', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should successfully get and set item in localStorage', () => {
    setSafeStorageItem('test_key', 'test_value');
    expect(getSafeStorageItem('test_key')).toBe('test_value');
  });

  it('should return null when item does not exist', () => {
    expect(getSafeStorageItem('non_existent_key')).toBeNull();
  });

  it('should gracefully return null if localStorage.getItem throws a SecurityError', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    });

    expect(getSafeStorageItem('blocked_key')).toBeNull();
  });

  it('should gracefully suppress error if localStorage.setItem throws a QuotaExceededError', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded.', 'QuotaExceededError');
    });

    expect(() => setSafeStorageItem('quota_key', 'value')).not.toThrow();
  });
});
