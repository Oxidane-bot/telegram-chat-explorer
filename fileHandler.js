import { fileImportArea, fileImportContent, fileInfoBar, fileName, messageCount, fileSize } from './dom-elements.js';
import { showStatus } from './utils.js';
import * as state from './state.js';
import { updateHistoryList } from './history.js';

// Set up drag and drop functionality
export function setupDragAndDrop() {
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    fileImportArea.addEventListener(eventName, preventDefaults, false);
  });
  
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  ['dragenter', 'dragover'].forEach(eventName => {
    fileImportArea.addEventListener(eventName, highlight, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    fileImportArea.addEventListener(eventName, unhighlight, false);
  });
  
  function highlight() {
    fileImportArea.classList.add('drag-over');
  }
  
  function unhighlight() {
    fileImportArea.classList.remove('drag-over');
  }
  
  fileImportArea.addEventListener('drop', handleDrop, false);
}

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  
  if (files.length > 0) {
    // Check if the file is a JSON file
    const file = files[0];
    if (file.type === 'application/json' || file.name.endsWith('.json')) {
      processDroppedFile(file);
    } else {
      showStatus('Error: Please select a JSON file', 'error');
    }
  }
}

// Process a dropped file
export async function processDroppedFile(file) {
  showStatus('Loading file...', 'loading');
  
  try {
    // Create a reader
    const reader = new FileReader();
    
    // Setup error handling for reader
    reader.onerror = () => {
      showStatus(`Error reading file: ${reader.error ? reader.error.message : 'Unknown error'}`, 'error');
    };
    
    // Setup the reader onload event
    reader.onload = async (event) => {
      try {
        const fileContent = event.target.result;
        
        // Try to parse JSON
        let data;
        try {
          data = JSON.parse(fileContent);
        } catch (parseError) {
          throw new Error(`Invalid JSON format: ${parseError.message}`);
        }
        
        // Validate if the file has the expected structure
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid file: content is not a JSON object');
        }
        
        if (!data.messages) {
          throw new Error('Invalid chat file format: missing "messages" property');
        }
        
        if (!Array.isArray(data.messages)) {
          throw new Error('Invalid chat file format: "messages" is not an array');
        }
        
        // Store the chat data
        state.setChatData(data);
        
        console.log('Successfully loaded chat data:', {
          messageCount: data.messages.length,
          firstMessage: data.messages[0]
        });
        
        // Create file info object
        const fileInfo = {
          name: file.name,
          path: file.name, // For dropped files, we don't have a real path
          size: file.size,
          messageCount: data.messages.length
        };
        
        // Add to file history if it's a valid chat file
        state.addToFileHistory(fileInfo);
        updateHistoryList();
        
        // Update UI
        updateFileInfo(fileInfo);
        
        showStatus('File loaded successfully', 'success');
        setTimeout(() => {
          showStatus('Ready', 'idle');
        }, 2000);
      } catch (error) {
        console.error('Error processing file:', error);
        showStatus(`Error processing file: ${error.message}`, 'error');
      }
    };
    
    // Read the file as text
    reader.readAsText(file);
  } catch (error) {
    console.error('Error in file processing:', error);
    showStatus(`Error reading file: ${error.message}`, 'error');
  }
}

// Load file from path
export async function loadFile(filePath) {
  showStatus('Loading file...', 'loading');
  
  try {
    const fileData = await window.api.readFile(filePath);
    state.setChatData(fileData.content);
    
    // Create a file info object
    const fileInfo = {
      path: filePath,
      name: fileData.stats.name,
      size: fileData.stats.size,
      messageCount: fileData.stats.messageCount
    };
    
    // Add to file history
    state.addToFileHistory(fileInfo);
    updateHistoryList();
    
    // Update UI
    updateFileInfo(fileInfo);
    
    showStatus('File loaded successfully', 'success');
    setTimeout(() => {
      showStatus('Ready', 'idle');
    }, 2000);
    
    return fileData;
  } catch (error) {
    showStatus(`Error loading file: ${error.message}`, 'error');
    throw error; // Re-throw to allow the caller to handle it
  }
}

// Initialize the file history in the UI
export function initFileHistory() {
    console.log("Initializing file history...");
    
    // Initialize the file history from localStorage
    state.initFileHistory();
    
    // Create the history panel directly (no Promise)
    const historyPanel = document.createElement('div');
    historyPanel.className = 'history-panel';
    historyPanel.id = 'historyPanel';
    historyPanel.style.display = 'block'; // Ensure it's visible
    
    historyPanel.innerHTML = `
      <div class="history-header">
        <h3>Recent Files</h3>
        <button id="clearHistoryBtn" class="clear-history-btn" title="Clear History">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
      <div class="history-list" id="historyList"></div>
    `;
    
    // Add to DOM directly
    console.log("Appending history panel to:", fileImportArea);
    fileImportArea.appendChild(historyPanel);
    
    // Add event listener for clearing history
    const clearHistoryBtn = historyPanel.querySelector('#clearHistoryBtn');
    clearHistoryBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Are you sure you want to clear your file history?')) {
        state.clearFileHistory();
        updateHistoryList();
      }
    });
    
    // Update the history list
    updateHistoryList();
    
    console.log("History panel initialized:", historyPanel);
  }

  export function createHistoryPanel() {
    const historyPanel = document.createElement('div');
    historyPanel.className = 'history-panel';
    
    const historyHeader = document.createElement('div');
    historyHeader.className = 'history-header';
    historyHeader.innerHTML = `
      <h3>Recent Files</h3>
      <button id="clearHistoryBtn" class="clear-history-btn" title="Clear History">
        <i class="fas fa-trash-alt"></i>
      </button>
    `;
    
    const historyList = document.createElement('div');
    historyList.className = 'history-list';
    historyList.id = 'historyList';
    
    historyPanel.appendChild(historyHeader);
    historyPanel.appendChild(historyList);
    
    // Add event listener for clearing history
    const clearHistoryBtn = historyHeader.querySelector('#clearHistoryBtn');
    clearHistoryBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent event from bubbling up
      
      if (confirm('Are you sure you want to clear your file history?')) {
        state.clearFileHistory();
        updateHistoryList();
      }
    });
    
    return historyPanel;
  }

// Update file information in the UI
export function updateFileInfo(stats) {
  fileName.textContent = stats.name;
  messageCount.textContent = stats.messageCount;
  fileSize.textContent = window.api.formatFileSize(stats.size);
  
  // Hide the file import area
  fileImportArea.style.display = 'none';
  
  // Show the file info bar
  fileInfoBar.style.display = 'flex';
}