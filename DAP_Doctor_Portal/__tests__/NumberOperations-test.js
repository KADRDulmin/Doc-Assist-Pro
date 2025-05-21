// Simple test file for number operations
test('Direct test function to ensure file is recognized by Jest', () => {
  expect(1 + 1).toBe(2);
});

describe('Number Operations', () => {
  it('should add numbers correctly', () => {
    expect(1 + 2).toBe(3);
  });

  it('should subtract numbers correctly', () => {
    expect(5 - 3).toBe(2);
  });

  it('should multiply numbers correctly', () => {
    expect(4 * 2).toBe(8);
  });

  it('should divide numbers correctly', () => {
    expect(10 / 2).toBe(5);
  });

  it('should handle modulus operations', () => {
    expect(10 % 3).toBe(1);
  });

  it('should handle complex calculations', () => {
    const result = (10 + 5) * 2 / 5;
    expect(result).toBe(6);
  });
});
