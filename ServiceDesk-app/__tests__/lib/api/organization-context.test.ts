import {
  getOrganizationId,
  requireOrganizationId,
  validatePMOperation,
  hasOrganizationContext,
  setOrganizationId,
} from '@/lib/api/organization-context';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Organization Context Utility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getOrganizationId', () => {
    it('should return organization ID from localStorage', () => {
      localStorage.setItem('organizationId', 'org-123');
      expect(getOrganizationId()).toBe('org-123');
    });

    it('should return null if organization ID not set', () => {
      expect(getOrganizationId()).toBeNull();
    });

    it('should return null on server-side (window undefined)', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Testing server-side behavior
      delete global.window;

      const result = getOrganizationId();
      expect(result).toBeNull();

      global.window = originalWindow;
    });

    it('should handle empty string in localStorage', () => {
      localStorage.setItem('organizationId', '');
      expect(getOrganizationId()).toBe('');
    });
  });

  describe('requireOrganizationId', () => {
    it('should return organization ID if set', () => {
      localStorage.setItem('organizationId', 'org-456');
      expect(requireOrganizationId()).toBe('org-456');
    });

    it('should throw error if organization ID not set', () => {
      expect(() => {
        requireOrganizationId();
      }).toThrow();
    });

    it('should throw error with specific message', () => {
      expect(() => {
        requireOrganizationId();
      }).toThrow(/Organization context/);
    });

    it('should throw error if organization ID is empty string', () => {
      localStorage.setItem('organizationId', '');
      expect(() => {
        requireOrganizationId();
      }).toThrow();
    });
  });

  describe('validatePMOperation', () => {
    it('should return organization ID for valid operation', () => {
      localStorage.setItem('organizationId', 'org-789');
      const result = validatePMOperation('getProjects');
      expect(result).toBe('org-789');
    });

    it('should throw error if organization context missing', () => {
      expect(() => {
        validatePMOperation('getProjects');
      }).toThrow(/Organization context/);
    });

    it('should throw error for missing context', () => {
      expect(() => {
        validatePMOperation('deleteProject');
      }).toThrow(/Organization context/);
    });

    it('should handle various operation names', () => {
      localStorage.setItem('organizationId', 'org-test');

      expect(validatePMOperation('getProjects')).toBe('org-test');
      expect(validatePMOperation('createTask')).toBe('org-test');
      expect(validatePMOperation('updateSprint')).toBe('org-test');
      expect(validatePMOperation('deleteBoard')).toBe('org-test');
    });
  });

  describe('hasOrganizationContext', () => {
    it('should return true if organization ID is set', () => {
      localStorage.setItem('organizationId', 'org-111');
      expect(hasOrganizationContext()).toBe(true);
    });

    it('should return false if organization ID not set', () => {
      expect(hasOrganizationContext()).toBe(false);
    });

    it('should return false for empty string', () => {
      localStorage.setItem('organizationId', '');
      expect(hasOrganizationContext()).toBe(false);
    });

    it('should return false on server-side', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Testing server-side behavior
      delete global.window;

      const result = hasOrganizationContext();
      expect(result).toBe(false);

      global.window = originalWindow;
    });
  });

  describe('setOrganizationId', () => {
    it('should set organization ID in localStorage', () => {
      setOrganizationId('org-new');
      expect(localStorage.getItem('organizationId')).toBe('org-new');
    });

    it('should overwrite existing organization ID', () => {
      localStorage.setItem('organizationId', 'org-old');
      setOrganizationId('org-new');
      expect(localStorage.getItem('organizationId')).toBe('org-new');
    });

    it('should handle empty string', () => {
      setOrganizationId('');
      const value = localStorage.getItem('organizationId');
      expect(value === '' || value === null).toBe(true);
    });

    it('should handle special characters in ID', () => {
      const specialId = 'org-123-abc_def.xyz';
      setOrganizationId(specialId);
      expect(localStorage.getItem('organizationId')).toBe(specialId);
    });

    it('should handle very long IDs', () => {
      const longId = 'org-' + 'x'.repeat(1000);
      setOrganizationId(longId);
      expect(localStorage.getItem('organizationId')).toBe(longId);
    });
  });

  describe('Integration scenarios', () => {
    it('should work with full PM operation flow', () => {
      // Start: no context
      expect(hasOrganizationContext()).toBe(false);

      // Set context
      setOrganizationId('org-flow-test');
      expect(hasOrganizationContext()).toBe(true);

      // Use context
      expect(validatePMOperation('testOperation')).toBe('org-flow-test');
      expect(requireOrganizationId()).toBe('org-flow-test');
      expect(getOrganizationId()).toBe('org-flow-test');

      // Clear context
      localStorage.removeItem('organizationId');
      expect(hasOrganizationContext()).toBe(false);

      // Should fail without context
      expect(() => {
        requireOrganizationId();
      }).toThrow();
    });

    it('should handle context switching', () => {
      setOrganizationId('org-1');
      expect(getOrganizationId()).toBe('org-1');

      setOrganizationId('org-2');
      expect(getOrganizationId()).toBe('org-2');

      setOrganizationId('org-3');
      expect(getOrganizationId()).toBe('org-3');
    });

    it('should maintain context across multiple operations', () => {
      setOrganizationId('org-persistent');

      // Multiple operations should all see same context
      for (let i = 0; i < 5; i++) {
        expect(validatePMOperation(`operation-${i}`)).toBe('org-persistent');
      }

      expect(getOrganizationId()).toBe('org-persistent');
    });
  });

  describe('Error handling', () => {
    it('should provide helpful error message', () => {
      expect(() => {
        validatePMOperation('getProjects');
      }).toThrow(/Organization context/);
    });

    it('should handle concurrent validation calls', () => {
      setOrganizationId('org-concurrent');

      const results = [
        validatePMOperation('op1'),
        validatePMOperation('op2'),
        validatePMOperation('op3'),
      ];

      expect(results).toEqual(['org-concurrent', 'org-concurrent', 'org-concurrent']);
    });

    it('should not throw on hasOrganizationContext check', () => {
      expect(() => {
        hasOrganizationContext();
        hasOrganizationContext();
        hasOrganizationContext();
      }).not.toThrow();
    });
  });
});
