/**
 * Debug logging and utilities module
 * Centralizes all debug-related functionality
 */

/**
 * Log debug messages when debug mode is enabled
 * Enable debug mode by setting localStorage.debugMode = 'true'
 * 
 * @param {...any} args - Arguments to log
 */
export function debugLog(...args) {
  const isDebugMode = localStorage.getItem('debugMode') === 'true';
  if (isDebugMode) {
    console.log('[DEBUG]', ...args);
  }
}

/**
 * Enable debug mode
 */
export function enableDebugMode() {
  localStorage.setItem('debugMode', 'true');
  console.log('Debug mode enabled. Refresh the page to see debug logs.');
}

/**
 * Disable debug mode
 */
export function disableDebugMode() {
  localStorage.setItem('debugMode', 'false');
  console.log('Debug mode disabled.');
}

/**
 * Check if debug mode is enabled
 * 
 * @returns {boolean} - True if debug mode is enabled
 */
export function isDebugModeEnabled() {
  return localStorage.getItem('debugMode') === 'true';
}

/**
 * Log performance timing
 * 
 * @param {string} label - Label for the timing
 * @param {function} callback - Function to time
 * @returns {any} - Return value from callback
 */
export function timeOperation(label, callback) {
  if (!isDebugModeEnabled()) {
    return callback();
  }
  
  console.time(`[DEBUG] ${label}`);
  const result = callback();
  console.timeEnd(`[DEBUG] ${label}`);
  return result;
}

/**
 * Count operations
 * 
 * @param {string} label - Counter label
 */
export function countOperation(label) {
  if (isDebugModeEnabled()) {
    console.count(`[DEBUG] ${label}`);
  }
} 