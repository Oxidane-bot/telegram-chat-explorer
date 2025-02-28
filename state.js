// Application state management module

// State variables
let chatData = null;
let currentView = 'card';
let isSearching = false;
let isDarkTheme = false;
let allResults = [];
let currentSearchTerms = null;
let displayedResultsCount = 0;
let searchTimeout = null;
let isLoadingMore = false;
let fileHistory = [];

// Maximum number of files to keep in history
const MAX_HISTORY_ITEMS = 10;

// Debug logger
export function debugLog(...args) {
  const isDebugMode = localStorage.getItem('debugMode') === 'true';
  if (isDebugMode) {
    console.log('[DEBUG]', ...args);
  }
}

// Chat data getters and setters
export function setChatData(data) {
  chatData = data;
  debugLog('Chat data updated', data ? `${data.messages.length} messages` : 'null');
}

export function getChatData() {
  return chatData;
}

// View mode getters and setters
export function setCurrentView(view) {
  currentView = view;
  debugLog('View mode changed to', view);
}

export function getCurrentView() {
  return currentView;
}

// Search state getters and setters
export function setIsSearching(value) {
  isSearching = value;
  debugLog('Search state changed to', value);
}

export function getIsSearching() {
  return isSearching;
}

// Theme getters and setters
export function setIsDarkTheme(value) {
  isDarkTheme = value;
  debugLog('Theme changed to', value ? 'dark' : 'light');
}

export function getIsDarkTheme() {
  return isDarkTheme;
}

// Search results getters and setters
export function setAllResults(results) {
  if (!Array.isArray(results)) {
    console.error('setAllResults received non-array:', results);
    results = [];
  }
  allResults = results;
  debugLog('All results updated', `${results.length} items`);
}

export function getAllResults() {
  return allResults;
}

// Search terms getters and setters
export function setCurrentSearchTerms(terms) {
  currentSearchTerms = terms;
  debugLog('Search terms updated', terms);
}

export function getCurrentSearchTerms() {
  return currentSearchTerms;
}

// Results display count getters and setters
export function setDisplayedResultsCount(count) {
  displayedResultsCount = count;
  debugLog('Displayed results count updated to', count);
}

export function getDisplayedResultsCount() {
  return displayedResultsCount;
}

// Search timeout getters and setters
export function setSearchTimeout(timeout) {
  searchTimeout = timeout;
}

export function getSearchTimeout() {
  return searchTimeout;
}

// Loading state getters and setters
export function setIsLoadingMore(value) {
  isLoadingMore = value;
  debugLog('Loading more state changed to', value);
}

export function getIsLoadingMore() {
  return isLoadingMore;
}

// File history management
export function initFileHistory() {
  try {
    const savedHistory = localStorage.getItem('fileHistory');
    if (savedHistory) {
      fileHistory = JSON.parse(savedHistory);
      debugLog('Loaded file history from storage', fileHistory.length + ' items');
    }
  } catch (error) {
    console.error('Error loading file history:', error);
    fileHistory = [];
  }
}

export function getFileHistory() {
  return fileHistory;
}

export function addToFileHistory(fileInfo) {
  // Remove existing entry with the same path if it exists
  fileHistory = fileHistory.filter(item => item.path !== fileInfo.path);
  
  // Add the new file at the beginning of the array
  fileHistory.unshift({
    path: fileInfo.path,
    name: fileInfo.name,
    size: fileInfo.size,
    lastOpened: new Date().toISOString()
  });
  
  // Limit the history to MAX_HISTORY_ITEMS
  if (fileHistory.length > MAX_HISTORY_ITEMS) {
    fileHistory = fileHistory.slice(0, MAX_HISTORY_ITEMS);
  }
  
  // Save to localStorage
  try {
    localStorage.setItem('fileHistory', JSON.stringify(fileHistory));
    debugLog('File history updated and saved', fileHistory);
  } catch (error) {
    console.error('Error saving file history:', error);
  }
}

export function removeFromFileHistory(path) {
  fileHistory = fileHistory.filter(item => item.path !== path);
  
  // Save to localStorage
  try {
    localStorage.setItem('fileHistory', JSON.stringify(fileHistory));
    debugLog('Item removed from file history', path);
  } catch (error) {
    console.error('Error saving file history:', error);
  }
}

export function clearFileHistory() {
  fileHistory = [];
  localStorage.removeItem('fileHistory');
  debugLog('File history cleared');
}