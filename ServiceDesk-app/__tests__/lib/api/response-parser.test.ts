import { parseApiResponse, parseListResponse, parsePaginatedResponse, getErrorMessage } from '@/lib/api/response-parser';

describe('Response Parser Utility', () => {
  describe('parseApiResponse', () => {
    it('should extract data from { data: T } format', () => {
      const response = { data: { id: '1', name: 'Test' } };
      const result = parseApiResponse(response);
      expect(result).toEqual({ id: '1', name: 'Test' });
    });

    it('should return direct value if not wrapped', () => {
      const response = { id: '1', name: 'Test' };
      const result = parseApiResponse(response);
      expect(result).toEqual({ id: '1', name: 'Test' });
    });

    it('should handle array responses', () => {
      const response = [{ id: '1' }, { id: '2' }];
      const result = parseApiResponse(response);
      expect(result).toEqual([{ id: '1' }, { id: '2' }]);
    });

    it('should return undefined for null/undefined input', () => {
      expect(parseApiResponse(null)).toBeUndefined();
      expect(parseApiResponse(undefined)).toBeUndefined();
    });

    it('should handle primitive types', () => {
      expect(parseApiResponse('string')).toBe('string');
      expect(parseApiResponse(123)).toBe(123);
      expect(parseApiResponse(true)).toBe(true);
    });

    it('should prioritize data property over other properties', () => {
      const response = { data: { extracted: true }, other: { extracted: false } };
      const result = parseApiResponse(response);
      expect(result).toEqual({ extracted: true });
    });
  });

  describe('parseListResponse', () => {
    it('should extract array from { items: T[] } format', () => {
      const response = { items: [{ id: '1' }, { id: '2' }] };
      const result = parseListResponse(response);
      expect(result).toEqual([{ id: '1' }, { id: '2' }]);
    });

    it('should extract array from { data: T[] } format', () => {
      const response = { data: [{ id: '1' }, { id: '2' }] };
      const result = parseListResponse(response);
      expect(result).toEqual([{ id: '1' }, { id: '2' }]);
    });

    it('should extract array from { tasks: T[] } format', () => {
      const response = { tasks: [{ id: '1' }, { id: '2' }] };
      const result = parseListResponse(response);
      expect(result).toEqual([{ id: '1' }, { id: '2' }]);
    });

    it('should extract array from { results: T[] } format', () => {
      const response = { results: [{ id: '1' }, { id: '2' }] };
      const result = parseListResponse(response);
      expect(result).toEqual([{ id: '1' }, { id: '2' }]);
    });

    it('should return direct array if input is array', () => {
      const response = [{ id: '1' }, { id: '2' }];
      const result = parseListResponse(response);
      expect(result).toEqual([{ id: '1' }, { id: '2' }]);
    });

    it('should return empty array for null/undefined', () => {
      expect(parseListResponse(null)).toEqual([]);
      expect(parseListResponse(undefined)).toEqual([]);
    });

    it('should return empty array for non-object types', () => {
      expect(parseListResponse('string')).toEqual([]);
      expect(parseListResponse(123)).toEqual([]);
    });

    it('should handle nested data structure', () => {
      const response = { data: { items: [{ id: '1' }] } };
      const result = parseListResponse(response);
      expect(result).toEqual([{ id: '1' }]);
    });

    it('should return empty array if no array property found', () => {
      const response = { other: 'value' };
      const result = parseListResponse(response);
      expect(result).toEqual([]);
    });
  });

  describe('parsePaginatedResponse', () => {
    it('should extract items and pagination info', () => {
      const response = {
        items: [{ id: '1' }, { id: '2' }],
        total: 100,
        page: 1,
        limit: 10,
      };
      const result = parsePaginatedResponse(response);
      expect(result).toEqual({
        items: [{ id: '1' }, { id: '2' }],
        total: 100,
        page: 1,
        limit: 10,
      });
    });

    it('should handle missing pagination fields', () => {
      const response = { items: [{ id: '1' }] };
      const result = parsePaginatedResponse(response);
      expect(result).toEqual({
        items: [{ id: '1' }],
        total: undefined,
        page: undefined,
        limit: undefined,
      });
    });

    it('should extract from data array format', () => {
      const response = {
        data: [{ id: '1' }],
        total: 50,
      };
      const result = parsePaginatedResponse(response);
      expect(result.items).toEqual([{ id: '1' }]);
      expect(result.total).toBe(50);
    });

    it('should return empty items for null input', () => {
      const result = parsePaginatedResponse(null);
      expect(result.items).toEqual([]);
      expect(result.total).toBeUndefined();
    });

    it('should ignore non-numeric pagination values', () => {
      const response = {
        items: [{ id: '1' }],
        total: 'not-a-number',
        page: 'invalid',
      };
      const result = parsePaginatedResponse(response);
      expect(result.total).toBeUndefined();
      expect(result.page).toBeUndefined();
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from Error object', () => {
      const error = new Error('Test error message');
      expect(getErrorMessage(error)).toBe('Test error message');
    });

    it('should extract message from string', () => {
      expect(getErrorMessage('String error')).toBe('String error');
    });

    it('should extract message from object with message property', () => {
      const error = { message: 'Object error' };
      expect(getErrorMessage(error)).toBe('Object error');
    });

    it('should extract error from object with error property', () => {
      const error = { error: 'Error property' };
      expect(getErrorMessage(error)).toBe('Error property');
    });

    it('should extract message from nested data.message', () => {
      const error = { data: { message: 'Nested message' } };
      expect(getErrorMessage(error)).toBe('Nested message');
    });

    it('should return default message for null/undefined', () => {
      expect(getErrorMessage(null)).toBe('Unknown error occurred');
      expect(getErrorMessage(undefined)).toBe('Unknown error occurred');
    });

    it('should return default message for empty object', () => {
      expect(getErrorMessage({})).toBe('Unknown error occurred');
    });

    it('should handle axios error response format', () => {
      const error = {
        response: {
          data: {
            message: 'API error message',
          },
        },
      };
      expect(getErrorMessage(error)).toBe('API error message');
    });

    it('should prioritize message over error property', () => {
      const error = { message: 'Message priority', error: 'Error fallback' };
      expect(getErrorMessage(error)).toBe('Message priority');
    });

    it('should handle non-string message values', () => {
      const error = { message: 123 };
      expect(getErrorMessage(error)).toBe('Unknown error occurred');
    });
  });
});
