import { searchInput, resultsContainer } from './dom-elements.js';
import { showStatus } from './utils.js';
import * as state from './state.js';
import { displayResults } from './ui.js';
import { RESULTS_PER_PAGE } from './dom-elements.js';

/**
 * Extract search terms from a query string
 * @param {string} query - Search query string
 * @returns {Object} - Object with phrases and words arrays
 */
const extractSearchTerms = (query) => {
  const phrases = [];
  const words = [];
  
  // Extract quoted phrases
  const phraseRegex = /"([^"]+)"/g;
  [...query.matchAll(phraseRegex)].forEach(match => {
    phrases.push(match[1].toLowerCase());
  });
  
  // Get remaining words (not in quotes)
  const remainingText = query.replace(phraseRegex, '').trim();
  if (remainingText) {
    words.push(...remainingText.toLowerCase().split(/\s+/));
  }
  
  return { phrases, words };
};

/**
 * Check if a message matches the search terms
 * @param {Object} message - Message object to check
 * @param {Object} searchTerms - Search terms object with phrases and words
 * @returns {boolean} - True if the message matches
 */
const messageMatchesSearch = (message, { phrases, words }) => {
  if (!message?.text) return false;
  
  const lowerText = String(message.text).toLowerCase();
  
  // Check if any phrase matches (OR)
  const phraseMatch = phrases.length === 0 || phrases.some(phrase => lowerText.includes(phrase));
  
  // Check if all words match (AND)
  const wordMatch = words.length === 0 || words.every(word => lowerText.includes(word));
  
  return phraseMatch && wordMatch;
};

/**
 * Process messages in chunks to avoid blocking the UI
 * @param {Array} messages - Array of messages to process
 * @param {Object} searchTerms - Search terms object
 * @param {function} onComplete - Callback when processing is complete
 */
const processMessagesInChunks = async (messages, searchTerms, onComplete) => {
  const CHUNK_SIZE = 500;
  const messagesCount = messages.length;
  const results = [];
  let processedCount = 0;
  
  const processNextChunk = async () => {
    const startIndex = processedCount;
    const endIndex = Math.min(processedCount + CHUNK_SIZE, messagesCount);
    
    // Process current chunk
    for (let i = startIndex; i < endIndex; i++) {
      try {
        const message = messages[i];
        if (messageMatchesSearch(message, searchTerms)) {
          results.push(message);
        }
      } catch (messageError) {
        console.error('Error processing message:', messageError);
        // Continue with next message
      }
    }
    
    processedCount = endIndex;
    
    // Update progress indicator
    const progressPercent = Math.floor(processedCount / messagesCount * 100);
    showStatus(`Searching... (${progressPercent}%)`, 'loading');
    
    if (processedCount < messagesCount) {
      // Use setTimeout and await to give UI time to update
      await new Promise(resolve => setTimeout(resolve, 0));
      await processNextChunk();
    } else {
      // All chunks processed
      onComplete(results);
    }
  };
  
  // Start processing
  await processNextChunk();
};

// Perform search based on input
export async function performSearch() {
  try {
    const query = searchInput.value.trim();
    
    if (!query) {
      showStatus('Please enter a search term', 'error');
      return;
    }
    
    const chatData = state.getChatData();
    if (!chatData?.messages) {
      showStatus('Please load a chat file first', 'error');
      
      // 如果文件导入区域隐藏，则显示它
      if (fileImportArea.style.display === 'none') {
        fileImportArea.style.display = 'block';
        fileImportArea.style.opacity = '1';
        fileInfoBar.style.display = 'none';
        emptyState.style.display = 'flex';
        emptyState.innerHTML = `
          <i class="fas fa-exclamation-circle empty-state-icon"></i>
          <p>No chat file loaded. Please load a file first.</p>
        `;
      }
      return;
    }
    
    showStatus('Searching...', 'loading');
    state.setIsSearching(true);
    
    // Clear previous results
    resultsContainer.innerHTML = '';
    
    // Parse the query for quoted phrases and individual words
    const currentSearchTerms = extractSearchTerms(query);
    state.setCurrentSearchTerms(currentSearchTerms);
    
    try {
      // Process messages in chunks
      await processMessagesInChunks(
        chatData.messages,
        currentSearchTerms, 
        (results) => {
          displayResults(results, currentSearchTerms);
          state.setIsSearching(false);
          showStatus(`Found ${results.length} matching messages`, 'success');
        }
      );
    } catch (searchError) {
      console.error('Error during search processing:', searchError);
      state.setIsSearching(false);
      showStatus(`Search processing error: ${searchError.message}`, 'error');
      
      // 显示错误状态
      resultsContainer.innerHTML = '';
      emptyState.style.display = 'flex';
      emptyState.innerHTML = `
        <i class="fas fa-exclamation-triangle empty-state-icon"></i>
        <p>Error during search: ${searchError.message}</p>
      `;
    }
    
  } catch (error) {
    // Catch any errors in the search process
    console.error('Search error:', error);
    state.setIsSearching(false);
    showStatus(`Error during search: ${error.message}`, 'error');
    
    // 清除结果容器
    resultsContainer.innerHTML = '';
    emptyState.style.display = 'flex';
    emptyState.innerHTML = `
      <i class="fas fa-exclamation-triangle empty-state-icon"></i>
      <p>Error during search: ${error.message}</p>
    `;
  }
}

// Memory cleanup function
export function cleanup() {
  // Remove any existing load more card/item
  document.getElementById('loadMoreCard')?.remove();
  document.getElementById('loadMoreItem')?.remove();
}