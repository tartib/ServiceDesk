import { CacheManager } from '../CacheManager';

describe('CacheManager', () => {
  let cacheManager: CacheManager;

  beforeEach(() => {
    jest.clearAllMocks();
    cacheManager = CacheManager.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = CacheManager.getInstance();
      const instance2 = CacheManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should accept optional redisUrl', () => {
      const instance = CacheManager.getInstance('redis://custom:6379');
      expect(instance).toBeDefined();
    });
  });

  describe('get', () => {
    it('should return null if redis is not available', async () => {
      const result = await cacheManager.get('test-key');
      expect(result).toBeNull();
    });

    it('should return null for non-existent key', async () => {
      const result = await cacheManager.get('non-existent-key');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should not throw when redis is unavailable', async () => {
      await expect(cacheManager.set('key', { data: 'value' })).resolves.toBeUndefined();
    });

    it('should accept custom TTL', async () => {
      await expect(cacheManager.set('key', { data: 'value' }, 7200)).resolves.toBeUndefined();
    });
  });

  describe('delete', () => {
    it('should not throw when redis is unavailable', async () => {
      await expect(cacheManager.delete('key')).resolves.toBeUndefined();
    });
  });

  describe('deletePattern', () => {
    it('should return 0 when redis is unavailable', async () => {
      const result = await cacheManager.deletePattern('pattern:*');
      expect(result).toBe(0);
    });
  });

  describe('clear', () => {
    it('should not throw when redis is unavailable', async () => {
      await expect(cacheManager.clear()).resolves.toBeUndefined();
    });
  });

  describe('exists', () => {
    it('should return false when redis is unavailable', async () => {
      const result = await cacheManager.exists('key');
      expect(result).toBe(false);
    });
  });

  describe('getTTL', () => {
    it('should return -1 when redis is unavailable', async () => {
      const result = await cacheManager.getTTL('key');
      expect(result).toBe(-1);
    });
  });

  describe('setTTL', () => {
    it('should return false when redis is unavailable', async () => {
      const result = await cacheManager.setTTL('key', 3600);
      expect(result).toBe(false);
    });
  });

  describe('increment', () => {
    it('should return 0 when redis is unavailable', async () => {
      const result = await cacheManager.increment('counter');
      expect(result).toBe(0);
    });

    it('should accept custom amount', async () => {
      const result = await cacheManager.increment('counter', 5);
      expect(result).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return empty object when redis is unavailable', async () => {
      const result = await cacheManager.getStats();
      expect(result).toEqual({});
    });
  });

  describe('close', () => {
    it('should not throw when redis is unavailable', async () => {
      await expect(cacheManager.close()).resolves.toBeUndefined();
    });
  });
});
