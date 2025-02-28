// Import modules
import * as domElements from './dom-elements.js';
import { initTheme, initWindowControls, toggleTheme } from './theme.js';
import { setupDragAndDrop, loadFile } from './fileHandler.js';
import { performSearch, cleanup } from './search.js';
import { loadMoreResults } from './ui.js';
import { showStatus } from './utils.js';
import * as state from './state.js';
import { createHistoryPanel, updateHistoryList } from './history.js';

// Helper function to hide file import area
function hideFileImportArea() {
  // Make sure the file import area is hidden when searching
  domElements.fileImportArea.style.display = 'none';
}

// Set up event listeners
function setupEventListeners() {
  // Browse button click
  domElements.browseBtn.addEventListener('click', async () => {
    const fileInfo = await window.api.openFileDialog();
    if (fileInfo) {
      loadFile(fileInfo.path);
    }
  });
  
  // Switch file button click
  domElements.switchFileBtn.addEventListener('click', () => {
    // Show the file import area
    domElements.fileImportArea.style.display = 'block';
    // Clear previous results
    domElements.resultsContainer.innerHTML = '';
    domElements.emptyState.style.display = 'flex';
  });
  
  // Search button click with debouncing
  domElements.searchBtn.addEventListener('click', () => {
    hideFileImportArea();
    
    // Clear previous timeout if any
    const searchTimeout = state.getSearchTimeout();
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout
    const newTimeout = setTimeout(() => {
      performSearch();
    }, 300); // 300ms delay
    
    state.setSearchTimeout(newTimeout);
  });
  
  // Search input enter key with debouncing
  domElements.searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      hideFileImportArea();
      
      // Clear previous timeout if any
      const searchTimeout = state.getSearchTimeout();
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      
      // Set new timeout
      const newTimeout = setTimeout(() => {
        performSearch();
      }, 300); // 300ms delay
      
      state.setSearchTimeout(newTimeout);
    }
  });
  
  // Clear button click
  domElements.clearBtn.addEventListener('click', () => {
    cleanup(); // Clean up previous elements
    domElements.searchInput.value = '';
    domElements.resultsContainer.innerHTML = '';
    domElements.emptyState.style.display = 'flex';
    domElements.resultsStats.textContent = '';
    
    // Clear stored results
    state.setAllResults([]);
    state.setDisplayedResultsCount(0);
  });
  
  // View mode buttons
  domElements.cardViewBtn.addEventListener('click', () => {
    state.setCurrentView('card');
    domElements.cardViewBtn.classList.add('active');
    domElements.listViewBtn.classList.remove('active');
    
    // Re-render the current results in the new view
    const allResults = state.getAllResults();
    if (allResults.length > 0) {
      // First, remember how many results are currently displayed
      const currentCount = state.getDisplayedResultsCount();
      
      // Reset the display count and clear the container
      state.setDisplayedResultsCount(0);
      domElements.resultsContainer.innerHTML = '';
      
      // Set the correct view class
      domElements.resultsContainer.className = 'results-container card-view';
      
      // Load the same number of results as before but in the new view
      const endIndex = Math.min(currentCount, allResults.length);
      const resultsToRender = allResults.slice(0, endIndex);
      
      // Create document fragment for better performance
      const fragment = document.createDocumentFragment();
      import('./ui.js').then(ui => {
        ui.renderCardViewBatch(resultsToRender, fragment);
        
        // Append the fragment to the container
        domElements.resultsContainer.appendChild(fragment);
        
        // Update displayed count
        state.setDisplayedResultsCount(endIndex);
        
        // Add load more card if needed
        if (endIndex < allResults.length) {
          ui.addLoadMoreCard();
        }
      });
    } else {
      domElements.resultsContainer.className = 'results-container card-view';
    }
  });
  
  domElements.listViewBtn.addEventListener('click', () => {
    state.setCurrentView('list');
    domElements.listViewBtn.classList.add('active');
    domElements.cardViewBtn.classList.remove('active');
    
    // Re-render the current results in the new view
    const allResults = state.getAllResults();
    if (allResults.length > 0) {
      // First, remember how many results are currently displayed
      const currentCount = state.getDisplayedResultsCount();
      
      // Reset the display count and clear the container
      state.setDisplayedResultsCount(0);
      domElements.resultsContainer.innerHTML = '';
      
      // Set the correct view class
      domElements.resultsContainer.className = 'results-container list-view';
      
      // Load the same number of results as before but in the new view
      const endIndex = Math.min(currentCount, allResults.length);
      const resultsToRender = allResults.slice(0, endIndex);
      
      // Create document fragment for better performance
      const fragment = document.createDocumentFragment();
      import('./ui.js').then(ui => {
        ui.renderListViewBatch(resultsToRender, fragment);
        
        // Append the fragment to the container
        domElements.resultsContainer.appendChild(fragment);
        
        // Update displayed count
        state.setDisplayedResultsCount(endIndex);
        
        // Add load more item if needed
        if (endIndex < allResults.length) {
          ui.addLoadMoreListItem();
        }
      });
    } else {
      domElements.resultsContainer.className = 'results-container list-view';
    }
  });
}

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
  showStatus(`An error occurred: ${event.error.message}`, 'error');
});

// Initialize file history
function initFileHistory() {
  console.log("Initializing file history from renderer");
  
  // Initialize history in the state module
  state.initFileHistory();
  
  // Add history styles to the document
  domElements.addHistoryStyles();
  
  // Directly call the file handler's initFileHistory function
  import('./fileHandler.js').then(fileHandler => {
    console.log("FileHandler module loaded, initializing history");
    fileHandler.initFileHistory();
  }).catch(err => {
    console.error("Error loading fileHandler module:", err);
  });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  console.log('App initializing');
  try {
    initTheme();
    initWindowControls();
    setupDragAndDrop();
    setupEventListeners();
    initFileHistory();
    console.log('App initialized successfully');
  } catch (error) {
    console.error('Error during initialization:', error);
    showStatus(`Initialization error: ${error.message}`, 'error');
  }
});