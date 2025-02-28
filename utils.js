import { statusText, statusIndicator } from './dom-elements.js';
import * as state from './state.js';

// Show status message
export function showStatus(message, type = 'idle') {
  statusText.textContent = message;
  
  // Reset all status classes
  statusIndicator.classList.remove('loading', 'success', 'error');
  
  if (type === 'loading') {
    statusIndicator.classList.add('loading');
  } else if (type === 'success') {
    statusIndicator.classList.add('success');
  } else if (type === 'error') {
    statusIndicator.classList.add('error');
  }
}

// Copy text to clipboard
export function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
    .then(() => {
      showStatus('Copied to clipboard!', 'success');
      setTimeout(() => {
        showStatus('Ready', 'idle');
      }, 2000);
    })
    .catch(err => {
      showStatus('Failed to copy text', 'error');
    });
}

// Show context view (messages before and after the selected message)
export function showContextView(selectedMessage) {
  const chatData = state.getChatData();
  const currentSearchTerms = state.getCurrentSearchTerms();
  
  if (!chatData || !chatData.messages) return;
  
  // Find the index of the selected message
  const messageIndex = chatData.messages.findIndex(msg => msg.id === selectedMessage.id);
  if (messageIndex === -1) return;
  
  // Get messages before and after (3 in each direction)
  const startIndex = Math.max(0, messageIndex - 3);
  const endIndex = Math.min(chatData.messages.length - 1, messageIndex + 3);
  const contextMessages = chatData.messages.slice(startIndex, endIndex + 1);
  
  // Create the context view
  const contextViewElement = document.createElement('div');
  contextViewElement.className = 'context-view';
  
  const contextContainerElement = document.createElement('div');
  contextContainerElement.className = 'context-container';
  
  const contextHeaderElement = document.createElement('div');
  contextHeaderElement.className = 'context-header';
  contextHeaderElement.innerHTML = `
    <span class="context-title">Message Context</span>
    <button class="context-close-btn">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  const contextContentElement = document.createElement('div');
  contextContentElement.className = 'context-content';
  
  // Add messages to the context content
  contextMessages.forEach(message => {
    const messageElement = document.createElement('div');
    messageElement.className = 'context-message';
    if (message.id === selectedMessage.id) {
      messageElement.classList.add('highlight');
    }
    
    // For context view, we need to safely process the text content
    // and apply highlighting if search terms are active
    const messageText = message.text || '';
    let formattedContent = '';
    
    // If we have active search terms, apply highlighting
    if (currentSearchTerms) {
      formattedContent = highlightText(messageText, currentSearchTerms);
    } else {
      // Just escape HTML if no search terms
      formattedContent = messageText.replace(/&/g, '&amp;')
                                    .replace(/</g, '&lt;')
                                    .replace(/>/g, '&gt;')
                                    .replace(/"/g, '&quot;')
                                    .replace(/'/g, '&#039;');
    }
    
    messageElement.innerHTML = `
      <div class="sender-info">
        <span class="sender-name">${message.from || 'Unknown'}</span>
        <span class="message-date">${window.api.formatDate(message.date)}</span>
      </div>
      <div class="message-content">${formattedContent}</div>
    `;
    
    contextContentElement.appendChild(messageElement);
  });
  
  contextContainerElement.appendChild(contextHeaderElement);
  contextContainerElement.appendChild(contextContentElement);
  contextViewElement.appendChild(contextContainerElement);
  
  // Add to the DOM
  document.body.appendChild(contextViewElement);
  
  // Add event listeners
  const closeBtn = contextViewElement.querySelector('.context-close-btn');
  closeBtn.addEventListener('click', () => {
    contextViewElement.classList.remove('open');
    setTimeout(() => {
      document.body.removeChild(contextViewElement);
    }, 300);
  });
  
  // Click outside to close
  contextViewElement.addEventListener('click', (e) => {
    if (e.target === contextViewElement) {
      contextViewElement.classList.remove('open');
      setTimeout(() => {
        document.body.removeChild(contextViewElement);
      }, 300);
    }
  });
  
  // Show the context view
  setTimeout(() => {
    contextViewElement.classList.add('open');
  }, 10);
}

// Improved highlighting function
export function highlightText(text, searchTerms) {
  try {
    // Ensure text is a string
    if (!text) return '';
    
    // Convert to string in case text is not a string
    let highlightedText = String(text);
    
    // Escape special HTML characters to prevent XSS
    highlightedText = highlightedText.replace(/&/g, '&amp;')
                                     .replace(/</g, '&lt;')
                                     .replace(/>/g, '&gt;')
                                     .replace(/"/g, '&quot;')
                                     .replace(/'/g, '&#039;');
    
    // If no search terms, return escaped text
    if (!searchTerms || (!searchTerms.phrases && !searchTerms.words)) {
      return highlightedText;
    }
    
    // Create a map to track already highlighted positions
    const highlightPositions = new Map();
    
    // First, highlight phrases (longer matches should be highlighted first)
    if (searchTerms.phrases && searchTerms.phrases.length > 0) {
      // Sort phrases by length (longest first) to prevent shorter phrases from breaking longer ones
      const sortedPhrases = [...searchTerms.phrases].sort((a, b) => b.length - a.length);
      
      for (const phrase of sortedPhrases) {
        try {
          // Escape the phrase for use in regex
          const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(escapedPhrase, 'gi');
          
          let match;
          while ((match = regex.exec(highlightedText)) !== null) {
            const start = match.index;
            const end = start + match[0].length;
            
            // Check if this region overlaps with any existing highlights
            let canHighlight = true;
            for (const [hStart, hEnd] of highlightPositions.entries()) {
              if ((start >= hStart && start < hEnd) || 
                  (end > hStart && end <= hEnd) ||
                  (start <= hStart && end >= hEnd)) {
                canHighlight = false;
                break;
              }
            }
            
            if (canHighlight) {
              // Add this region to highlighted positions
              highlightPositions.set(start, end);
              
              // Store original match for replacement
              const originalMatch = match[0];
              
              // Create replacement with highlight
              const replacement = `<span class="highlight">${originalMatch}</span>`;
              
              // Calculate the position adjustment for future matches
              const lengthDifference = replacement.length - originalMatch.length;
              
              // Replace this instance in the string
              highlightedText = 
                highlightedText.substring(0, start) + 
                replacement + 
                highlightedText.substring(end);
              
              // Adjust regex lastIndex to account for the HTML we just inserted
              regex.lastIndex += lengthDifference;
              
              // Adjust all stored positions that come after this replacement
              const newHighlightPositions = new Map();
              for (const [hStart, hEnd] of highlightPositions.entries()) {
                if (hStart > start) {
                  newHighlightPositions.set(hStart + lengthDifference, hEnd + lengthDifference);
                } else {
                  newHighlightPositions.set(hStart, hEnd);
                }
              }
              highlightPositions.clear();
              for (const [hStart, hEnd] of newHighlightPositions.entries()) {
                highlightPositions.set(hStart, hEnd);
              }
            }
          }
        } catch (regexError) {
          console.error('Error creating phrase regex:', regexError);
          // Continue with next phrase
        }
      }
    }
    
    // Then highlight individual words
    if (searchTerms.words && searchTerms.words.length > 0) {
      for (const word of searchTerms.words) {
        try {
          // Escape the word for use in regex
          const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          // Use looser boundaries for better matching
          const regex = new RegExp(`(${escapedWord})`, 'gi');
          
          let match;
          while ((match = regex.exec(highlightedText)) !== null) {
            const start = match.index;
            const end = start + match[0].length;
            
            // Check if this region overlaps with any existing highlights
            let canHighlight = true;
            for (const [hStart, hEnd] of highlightPositions.entries()) {
              if ((start >= hStart && start < hEnd) || 
                  (end > hStart && end <= hEnd) ||
                  (start <= hStart && end >= hEnd)) {
                canHighlight = false;
                break;
              }
            }
            
            if (canHighlight) {
              // Add this region to highlighted positions
              highlightPositions.set(start, end);
              
              // Store original match for replacement
              const originalMatch = match[0];
              
              // Create replacement with highlight
              const replacement = `<span class="highlight">${originalMatch}</span>`;
              
              // Calculate the position adjustment for future matches
              const lengthDifference = replacement.length - originalMatch.length;
              
              // Replace this instance in the string
              highlightedText = 
                highlightedText.substring(0, start) + 
                replacement + 
                highlightedText.substring(end);
              
              // Adjust regex lastIndex to account for the HTML we just inserted
              regex.lastIndex += lengthDifference;
              
              // Adjust all stored positions that come after this replacement
              const newHighlightPositions = new Map();
              for (const [hStart, hEnd] of highlightPositions.entries()) {
                if (hStart > start) {
                  newHighlightPositions.set(hStart + lengthDifference, hEnd + lengthDifference);
                } else {
                  newHighlightPositions.set(hStart, hEnd);
                }
              }
              highlightPositions.clear();
              for (const [hStart, hEnd] of newHighlightPositions.entries()) {
                highlightPositions.set(hStart, hEnd);
              }
            }
          }
        } catch (regexError) {
          console.error('Error creating word regex:', regexError);
          // Continue with next word
        }
      }
    }
    
    return highlightedText;
  } catch (error) {
    console.error('Error in highlightText:', error);
    // Return the original text if there's an error
    return String(text || '');
  }
}