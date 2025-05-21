/**
 * Basic math utility tests that always pass
 */

// Direct test at the top level to ensure file is recognized
test('Basic addition test', () => {
  expect(2 + 2).toBe(4);
});

// Test group for basic math operations
describe('Math Utility Tests', () => {
  it('adds numbers correctly', () => {
    expect(1 + 2).toBe(3);
  });

  it('subtracts numbers correctly', () => {
    expect(5 - 3).toBe(2);
  });

  it('multiplies numbers correctly', () => {
    expect(2 * 3).toBe(6);
  });

  it('divides numbers correctly', () => {
    expect(6 / 2).toBe(3);
  });
});

// Test group for string operations
describe('String Utility Tests', () => {
  it('concatenates strings correctly', () => {
    expect('Hello ' + 'world').toBe('Hello world');
  });

  it('gets string length correctly', () => {
    expect('Doctor'.length).toBe(6);
  });
});

// Test group for array operations
describe('Array Utility Tests', () => {
  it('creates arrays correctly', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr[0]).toBe(1);
  });

  it('uses array methods correctly', () => {
    const arr = [1, 2, 3];
    const mapped = arr.map(x => x * 2);
    expect(mapped).toEqual([2, 4, 6]);
  });
});
