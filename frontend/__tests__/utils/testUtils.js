/**
 * This is a utility file for testing that provides various helper functions
 * to make tests more robust.
 */

/**
 * Wait for a condition to be true with exponential backoff
 * Helps with flaky tests where timing is an issue
 * 
 * @param {Function} condition - Function that returns a boolean or Promise<boolean>
 * @param {Object} options - Configuration options
 * @param {number} options.maxWait - Maximum time to wait in ms
 * @param {number} options.initialDelay - Initial delay in ms
 * @param {number} options.factor - Exponential backoff factor
 * @returns {Promise<void>} - Promise that resolves when condition is true
 */
export async function waitForCondition(
  condition,
  {
    maxWait = 5000,  // 5 seconds
    initialDelay = 50,  // 50ms
    factor = 1.5  // Exponential backoff factor
  } = {}
) {
  const startTime = Date.now();
  let currentDelay = initialDelay;
  
  while (Date.now() - startTime < maxWait) {
    try {
      const result = await Promise.resolve(condition());
      if (result) return;
    } catch (error) {
      // Condition threw an error, we'll try again
    }
    
    // Wait for the current delay
    await new Promise(resolve => setTimeout(resolve, currentDelay));
    
    // Increase the delay for the next iteration
    currentDelay = Math.min(currentDelay * factor, maxWait);
  }
  
  throw new Error(`Condition not met within ${maxWait}ms`);
}

/**
 * Helper function to mock timers and advance them
 * Useful for testing intervals/timeouts
 * 
 * @param {number} ms - Milliseconds to advance the timer
 */
export function advanceTimersByTime(ms) {
  jest.advanceTimersByTime(ms);
  // Flush microtasks when available
  return Promise.resolve();
}
