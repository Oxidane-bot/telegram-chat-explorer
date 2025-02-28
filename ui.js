import { emptyState, resultsContainer, resultsStats, RESULTS_PER_PAGE } from './dom-elements.js';
import { copyToClipboard, highlightText, showContextView, showStatus } from './utils.js';
import * as state from './state.js';

// Function to display results with integrated load more button
export function displayResults(results, searchTerms) {
  try {
    if (!Array.isArray(results)) {
      console.error('displayResults received non-array:', results);
      results = [];
    }
    
    if (results.length === 0) {
      emptyState.style.display = 'flex';
      emptyState.innerHTML = `
        <i class="fas fa-search-minus empty-state-icon"></i>
        <p>No messages matching your search criteria</p>
      `;
      resultsStats.textContent = 'No results found';
      return;
    }
    
    emptyState.style.display = 'none';
    
    // Sort results by date (newest first) with error handling
    try {
      results.sort((a, b) => {
        try {
          return new Date(b.date || 0) - new Date(a.date || 0);
        } catch (dateError) {
          console.error('Error comparing dates:', dateError);
          return 0; // Keep original order if there's an error
        }
      });
    } catch (sortError) {
      console.error('Error sorting results:', sortError);
      // Continue with unsorted results
    }
    
    // Store all results for pagination
    state.setAllResults(results);
    state.setDisplayedResultsCount(0);
    
    // Clear previous results and remove any pagination buttons
    resultsContainer.innerHTML = '';
    cleanup();
    
    // Set the correct view class
    resultsContainer.className = `results-container ${state.getCurrentView()}-view`;
    
    // Update stats
    resultsStats.textContent = `Found ${results.length} matching messages`;
    
    // Load initial batch of results (without the load more card/item)
    loadMoreResults(false);
    
    // Add load more card/item if there are more results
    if (state.getDisplayedResultsCount() < results.length) {
      addLoadMoreItem();
    }
    
  } catch (error) {
    console.error('Error in displayResults:', error);
    emptyState.style.display = 'flex';
    emptyState.innerHTML = `
      <i class="fas fa-exclamation-triangle empty-state-icon"></i>
      <p>Error displaying results: ${error.message}</p>
    `;
    resultsStats.textContent = 'Error displaying results';
  }
}

// Function to add a Load More card/item
export function addLoadMoreItem() {
  const allResults = state.getAllResults();
  const displayedResultsCount = state.getDisplayedResultsCount();
  
  // Check if there are any more results to load
  if (displayedResultsCount >= allResults.length) {
    return;
  }
  
  // Add a load more card or list item based on the current view
  if (state.getCurrentView() === 'card') {
    addLoadMoreCard();
  } else {
    addLoadMoreListItem();
  }
}

// Add a Load More card for card view
export function addLoadMoreCard() {
  const allResults = state.getAllResults();
  const displayedResultsCount = state.getDisplayedResultsCount();
  const remainingCount = allResults.length - displayedResultsCount;
  
  const cardElement = document.createElement('div');
  cardElement.className = 'message-card load-more-card';
  cardElement.id = 'loadMoreCard';
  
  cardElement.innerHTML = `
    <div class="load-more-content">
      <i class="fas fa-plus-circle load-more-icon"></i>
      <div class="load-more-text">Load More</div>
      <div class="load-more-count">${displayedResultsCount} of ${allResults.length} messages</div>
      <div class="load-more-remaining">${remainingCount} more available</div>
    </div>
  `;
  
  // Add click event to load more results
  cardElement.addEventListener('click', function() {
    // Show loading state
    cardElement.classList.add('loading');
    cardElement.innerHTML = `
      <div class="load-more-content">
        <i class="fas fa-spinner fa-spin load-more-icon"></i>
        <div class="load-more-text">Loading...</div>
      </div>
    `;
    
    // Use setTimeout to avoid blocking UI
    setTimeout(() => {
      // First remove this card
      cardElement.remove();
      
      // Then load more results
      loadMoreResults(false);
      
      // Check if there are more results to load
      if (state.getDisplayedResultsCount() < state.getAllResults().length) {
        // Add a new load more card
        addLoadMoreCard();
      }
    }, 10);
  });
  
  // Append to the container
  resultsContainer.appendChild(cardElement);
}

// Add a Load More list item for list view
export function addLoadMoreListItem() {
  const allResults = state.getAllResults();
  const displayedResultsCount = state.getDisplayedResultsCount();
  const remainingCount = allResults.length - displayedResultsCount;
  
  const itemElement = document.createElement('div');
  itemElement.className = 'message-item load-more-item';
  itemElement.id = 'loadMoreItem';
  
  itemElement.innerHTML = `
    <div class="load-more-item-content">
      <i class="fas fa-plus-circle load-more-icon"></i>
      <div class="load-more-text">Load More</div>
      <div class="load-more-count">${displayedResultsCount} of ${allResults.length} messages</div>
      <div class="load-more-remaining">${remainingCount} more available</div>
    </div>
  `;
  
  // Add click event to load more results
  itemElement.addEventListener('click', function() {
    // Show loading state
    itemElement.classList.add('loading');
    itemElement.innerHTML = `
      <div class="load-more-item-content">
        <i class="fas fa-spinner fa-spin load-more-icon"></i>
        <div class="load-more-text">Loading...</div>
      </div>
    `;
    
    // Use setTimeout to avoid blocking UI
    setTimeout(() => {
      // First remove this item
      itemElement.remove();
      
      // Then load more results
      loadMoreResults(false);
      
      // Check if there are more results to load
      if (state.getDisplayedResultsCount() < state.getAllResults().length) {
        // Add a new load more item
        addLoadMoreListItem();
      }
    }, 10);
  });
  
  // Append to the container
  resultsContainer.appendChild(itemElement);
}

// Function to load more results (batch)
export function loadMoreResults(includeLoadMoreItem = true) {
  const allResults = state.getAllResults();
  const displayedResultsCount = state.getDisplayedResultsCount();
  
  if (displayedResultsCount >= allResults.length) {
    return; // All results already displayed
  }
  
  // Calculate end index for this batch
  const endIndex = Math.min(displayedResultsCount + RESULTS_PER_PAGE, allResults.length);
  
  // Create document fragment for better performance
  const fragment = document.createDocumentFragment();
  
  // Get the batch of results to render
  const resultsToRender = allResults.slice(displayedResultsCount, endIndex);
  
  // Render the results
  if (state.getCurrentView() === 'card') {
    renderCardViewBatch(resultsToRender, fragment);
  } else {
    renderListViewBatch(resultsToRender, fragment);
  }
  
  // Append the fragment to the container
  resultsContainer.appendChild(fragment);
  
  // Update displayed count
  state.setDisplayedResultsCount(endIndex);
  
  // Update stats
  resultsStats.textContent = `Showing ${endIndex} of ${allResults.length} messages`;
  
  // Add load more card/item if requested and there are more results
  if (includeLoadMoreItem && endIndex < allResults.length) {
    addLoadMoreItem();
  }
}

// Render results in card view
export function renderCardViewBatch(results, fragment) {
  const currentSearchTerms = state.getCurrentSearchTerms();
  
  results.forEach(message => {
    const cardElement = document.createElement('div');
    cardElement.className = 'message-card';
    
    const headerElement = document.createElement('div');
    headerElement.className = 'card-header';
    
    const senderInfoElement = document.createElement('div');
    senderInfoElement.className = 'sender-info';
    senderInfoElement.innerHTML = `
      <span class="sender-name">${message.from || 'Unknown'}</span>
    `;
    
    const messageDateElement = document.createElement('span');
    messageDateElement.className = 'message-date';
    messageDateElement.textContent = window.api.formatDate(message.date);
    
    const cardActionsElement = document.createElement('div');
    cardActionsElement.className = 'card-actions';
    
    const copyBtnElement = document.createElement('button');
    copyBtnElement.className = 'card-action-btn';
    copyBtnElement.title = 'Copy message';
    copyBtnElement.innerHTML = '<i class="fas fa-copy"></i>';
    copyBtnElement.addEventListener('click', () => {
      copyToClipboard(message.text);
    });
    
    const contextBtnElement = document.createElement('button');
    contextBtnElement.className = 'card-action-btn';
    contextBtnElement.title = 'View context';
    contextBtnElement.innerHTML = '<i class="fas fa-expand-alt"></i>';
    contextBtnElement.addEventListener('click', () => {
      showContextView(message);
    });
    
    cardActionsElement.appendChild(copyBtnElement);
    cardActionsElement.appendChild(contextBtnElement);
    
    headerElement.appendChild(senderInfoElement);
    headerElement.appendChild(messageDateElement);
    headerElement.appendChild(cardActionsElement);
    
    // Highlight the message text
    const highlightedText = highlightText(message.text, currentSearchTerms);
    
    // Find the position of the first highlight to ensure it's visible
    let firstHighlightPos = -1;
    if (highlightedText.indexOf('<span class="highlight">') !== -1) {
      firstHighlightPos = highlightedText.indexOf('<span class="highlight">');
    }
    
    const contentElement = document.createElement('div');
    contentElement.className = 'card-content';
    
    // If there's a highlight, make sure it's visible by positioning the text appropriately
    if (firstHighlightPos > 150 && highlightedText.length > 300) {
      // Create a "..." at the beginning to indicate text was truncated
      const truncatedStart = '...';
      
      // Start the display from 100 characters before the first highlight
      const startPos = Math.max(0, firstHighlightPos - 100);
      contentElement.innerHTML = truncatedStart + highlightedText.substring(startPos);
    } else {
      contentElement.innerHTML = highlightedText;
    }
    
    cardElement.appendChild(headerElement);
    cardElement.appendChild(contentElement);
    
    fragment.appendChild(cardElement);
  });
}

// Render results in list view
export function renderListViewBatch(results, fragment) {
  const currentSearchTerms = state.getCurrentSearchTerms();
  
  results.forEach(message => {
    const itemElement = document.createElement('div');
    itemElement.className = 'message-item';
    
    const headerElement = document.createElement('div');
    headerElement.className = 'list-header';
    
    const senderInfoElement = document.createElement('div');
    senderInfoElement.className = 'sender-info';
    senderInfoElement.innerHTML = `
      <span class="sender-name">${message.from || 'Unknown'}</span>
      <span class="message-date">${window.api.formatDate(message.date)}</span>
    `;
    
    const actionsElement = document.createElement('div');
    actionsElement.className = 'card-actions';
    
    const copyBtnElement = document.createElement('button');
    copyBtnElement.className = 'card-action-btn';
    copyBtnElement.title = 'Copy message';
    copyBtnElement.innerHTML = '<i class="fas fa-copy"></i>';
    copyBtnElement.addEventListener('click', () => {
      copyToClipboard(message.text);
    });
    
    const contextBtnElement = document.createElement('button');
    contextBtnElement.className = 'card-action-btn';
    contextBtnElement.title = 'View context';
    contextBtnElement.innerHTML = '<i class="fas fa-expand-alt"></i>';
    contextBtnElement.addEventListener('click', () => {
      showContextView(message);
    });
    
    actionsElement.appendChild(copyBtnElement);
    actionsElement.appendChild(contextBtnElement);
    
    headerElement.appendChild(senderInfoElement);
    headerElement.appendChild(actionsElement);
    
    const contentElement = document.createElement('div');
    contentElement.className = 'list-content';
    contentElement.innerHTML = highlightText(message.text, currentSearchTerms);
    
    itemElement.appendChild(headerElement);
    itemElement.appendChild(contentElement);
    
    fragment.appendChild(itemElement);
  });
}

// Helper function for cleanup
function cleanup() {
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