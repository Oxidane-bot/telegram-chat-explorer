import { searchInput, resultsContainer } from './dom-elements.js';
import { showStatus } from './utils.js';
import * as state from './state.js';
import { displayResults } from './ui.js';
import { RESULTS_PER_PAGE } from './dom-elements.js';

// Perform search based on input
export function performSearch() {
  try {
    const query = searchInput.value.trim();
    
    if (!query) {
      showStatus('Please enter a search term', 'error');
      return;
    }
    
    const chatData = state.getChatData();
    if (!chatData) {
      showStatus('Please load a chat file first', 'error');
      return;
    }
    
    showStatus('Searching...', 'loading');
    state.setIsSearching(true);
    
    // Clear previous results
    resultsContainer.innerHTML = '';
    
    // Parse the query for quoted phrases and individual words
    const phrases = [];
    const words = [];
    
    // Extract quoted phrases
    const phraseRegex = /"([^"]+)"/g;
    let match;
    while ((match = phraseRegex.exec(query)) !== null) {
      phrases.push(match[1].toLowerCase());
    }
    
    // Get remaining words (not in quotes)
    const remainingText = query.replace(phraseRegex, '').trim();
    if (remainingText) {
      words.push(...remainingText.toLowerCase().split(/\s+/));
    }
    
    // Store current search terms for reuse
    const currentSearchTerms = { phrases, words };
    state.setCurrentSearchTerms(currentSearchTerms);
    
    // Safety check in case chatData structure is unexpected
    if (!Array.isArray(chatData.messages)) {
      throw new Error('Chat data is not properly formatted');
    }
    
    // Use setTimeout to prevent UI freezing for very large files
    setTimeout(() => {
      // Use more efficient search approach for large datasets
      const results = [];
      const messagesCount = chatData.messages.length;
      
      // Process messages in chunks to avoid blocking the UI
      const CHUNK_SIZE = 500;
      let processedCount = 0;
      
      function processChunk() {
        const startIndex = processedCount;
        const endIndex = Math.min(processedCount + CHUNK_SIZE, messagesCount);
        
        for (let i = startIndex; i < endIndex; i++) {
          try {
            const message = chatData.messages[i];
            if (!message.text) continue;
            
            const lowerText = String(message.text).toLowerCase();
            
            // Check if any phrase matches
            const phraseMatch = phrases.length === 0 || phrases.some(phrase => lowerText.includes(phrase));
            
            // Check if all words match
            const wordMatch = words.length === 0 || words.every(word => lowerText.includes(word));
            
            if (phraseMatch && wordMatch) {
              results.push(message);
            }
          } catch (messageError) {
            console.error('Error processing message:', messageError);
            // Continue with next message
          }
        }
        
        processedCount = endIndex;
        
        if (processedCount < messagesCount) {
          // Update the status to show progress
          showStatus(`Searching... (${Math.floor(processedCount / messagesCount * 100)}%)`, 'loading');
          // Schedule next chunk
          setTimeout(processChunk, 0);
        } else {
          // All chunks processed, display results
          displayResults(results, currentSearchTerms);
          
          // Update status
          state.setIsSearching(false);
          showStatus(`Found ${results.length} matching messages`, 'success');
        }
      }
      
      // Start processing the first chunk
      processChunk();
    }, 0);
    
  } catch (error) {
    // Catch any errors in the search process
    console.error('Search error:', error);
    state.setIsSearching(false);
    showStatus(`Error during search: ${error.message}`, 'error');
  }
}

// Memory cleanup function
export function cleanup() {
  // Remove any existing load more card/item
  const loadMoreCard = document.getElementById('loadMoreCard');
  if (loadMoreCard) {
    loadMoreCard.remove();
  }
  
  const loadMoreItem = document.getElementById('loadMoreItem');
  if (loadMoreItem) {
    loadMoreItem.remove();
  }
}