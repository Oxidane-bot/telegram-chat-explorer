import * as state from './state.js';
import { loadFile } from './fileHandler.js';
import { showStatus } from './utils.js';
import { fileImportArea, addHistoryStyles } from './dom-elements.js';

/**
 * Updates the history list UI with current file history
 */
export function updateHistoryList() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    
    const history = state.getFileHistory();
    historyList.innerHTML = '';
    
    if (history.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'history-empty';
      emptyMessage.innerHTML = `
        <i class="fas fa-history"></i>
        <p>No recent files</p>
      `;
      historyList.appendChild(emptyMessage);
      return;
    }
    
    history.forEach(file => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      historyItem.dataset.path = file.path;
      
      // Format the file size
      let formattedSize = '';
      if (file.size) {
        formattedSize = formatFileSize(file.size);
      }
      
      // Format the date
      let formattedDate = '';
      if (file.lastOpened) {
        formattedDate = formatLastOpened(file.lastOpened);
      }
      
      historyItem.innerHTML = `
        <div class="history-item-icon">
          <i class="fas fa-file-alt"></i>
        </div>
        <div class="history-item-details">
          <div class="history-item-name">${file.name || 'Unknown File'}</div>
          <div class="history-item-info">
            ${formattedSize ? `<span><i class="fas fa-hdd"></i> ${formattedSize}</span>` : ''}
            ${formattedDate ? `<span><i class="fas fa-clock"></i> ${formattedDate}</span>` : ''}
          </div>
        </div>
        <button class="history-item-remove" data-path="${file.path}" title="Remove from history">
          <i class="fas fa-times"></i>
        </button>
      `;
      
      // Add event listener for loading this file
      historyItem.addEventListener('click', () => {
        loadFileFromHistory(file.path);
      });
      
      // Add event listener for the remove button
      const removeBtn = historyItem.querySelector('.history-item-remove');
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent clicking the parent element
        state.removeFromFileHistory(file.path);
        updateHistoryList();
      });
      
      historyList.appendChild(historyItem);
    });
  }
  
/**
 * Creates a history panel DOM element
 * @returns {HTMLElement} The history panel element
 */
export function createHistoryPanel() {
  const historyPanel = document.createElement('div');
  historyPanel.className = 'history-panel';
  historyPanel.id = 'historyPanel';
  
  historyPanel.innerHTML = `
    <div class="history-header">
      <h3>Recent Files</h3>
      <button id="clearHistoryBtn" class="clear-history-btn" title="Clear History">
        <i class="fas fa-trash-alt"></i>
      </button>
    </div>
    <div class="history-list" id="historyList"></div>
  `;
  
  // Add event listener for clearing history
  const clearHistoryBtn = historyPanel.querySelector('#clearHistoryBtn');
  clearHistoryBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to clear your file history?')) {
      state.clearFileHistory();
      updateHistoryList();
    }
  });
  
  return historyPanel;
}

/**
 * Initializes the file history components
 * This is the main entry point for setting up history functionality
 */
export function initializeHistory() {
  // Initialize history in the state module
  state.initFileHistory();
  
  // Add history styles to the document
  addHistoryStyles();
  
  // Create and add the history panel to the fileImportArea
  const historyPanel = createHistoryPanel();
  fileImportArea.appendChild(historyPanel);
  
  // Update the history list
  updateHistoryList();
}

/**
 * Loads a file from the history
 * @param {string} filePath - Path to the file to load
 */
function loadFileFromHistory(filePath) {
    // Find the history item element
    const historyItem = document.querySelector(`.history-item[data-path="${filePath}"]`);
    if (historyItem) {
      // Add loading class for visual feedback
      historyItem.classList.add('loading');
      
      // Change the icon to a spinner
      const iconElement = historyItem.querySelector('.history-item-icon i');
      if (iconElement) {
        // Store the original icon class
        const originalIconClass = iconElement.className;
        iconElement.className = 'fas fa-spinner';
      }
    }
    
    showStatus('Loading file from history...', 'loading');
    
    // Hide the file import area with a subtle fade
    if (fileImportArea.style.display !== 'none') {
      fileImportArea.style.opacity = '0';
      setTimeout(() => {
        fileImportArea.style.display = 'none';
        fileImportArea.style.opacity = '1';
      }, 300);
    }
    
    // Call the loadFile function from fileHandler.js
    loadFile(filePath)
      .catch(error => {
        // Reset the loading state
        if (historyItem) {
          historyItem.classList.remove('loading');
          const iconElement = historyItem.querySelector('.history-item-icon i');
          if (iconElement) {
            iconElement.className = 'fas fa-file-alt';
          }
        }
        
        showStatus(`Error loading file: ${error.message}`, 'error');
        
        // If the file can't be loaded (e.g., file no longer exists),
        // ask if the user wants to remove it from history
        if (confirm(`The file "${filePath}" could not be loaded. Would you like to remove it from history?`)) {
          state.removeFromFileHistory(filePath);
          updateHistoryList();
        }
      });
  }

/**
 * Format a timestamp to a user-friendly date
 * @param {string} isoString - ISO date string to format
 * @returns {string} Formatted date string
 */
function formatLastOpened(isoString) {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Today
    if (diffDays === 0) {
      return 'Today';
    }
    // Yesterday
    else if (diffDays === 1) {
      return 'Yesterday';
    }
    // Within the last week
    else if (diffDays < 7) {
      return `${diffDays} days ago`;
    }
    // Longer ago
    else {
      return date.toLocaleDateString();
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
  if (typeof bytes !== 'number' || isNaN(bytes)) return '';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}