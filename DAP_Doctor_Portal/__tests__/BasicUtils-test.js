// This is a very basic test file for utility functions
const sum = (a, b) => a + b;

test('Direct test function to ensure file is recognized by Jest', () => {
  expect(sum(1, 2)).toBe(3);
});

describe('Basic Utility Tests', () => {
  // Test a simple string utility
  describe('String operations', () => {
    it('should concatenate strings correctly', () => {
      const result = 'Hello ' + 'Doctor';
      expect(result).toBe('Hello Doctor');
    });

    it('should handle string length correctly', () => {
      expect('Doc Assist Pro'.length).toBe(14);
    });
  });

  // Test array operations
  describe('Array operations', () => {
    it('should properly filter an array', () => {
      const numbers = [1, 2, 3, 4, 5];
      const filtered = numbers.filter(n => n > 3);
      expect(filtered).toEqual([4, 5]);
    });

    it('should map array values correctly', () => {
      const numbers = [1, 2, 3];
      const doubled = numbers.map(n => n * 2);
      expect(doubled).toEqual([2, 4, 6]);
    });
  });
});
