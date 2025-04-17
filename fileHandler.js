import { fileImportArea, fileImportContent, fileInfoBar, fileName, messageCount, fileSize } from './dom-elements.js';
import { showStatus } from './utils.js';
import * as state from './state.js';
import { updateHistoryList, initializeHistory } from './history.js';

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
    // Check file size before processing
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB limit
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
    }
    
    // Read the file as text using a Promise
    const fileContent = await readFileAsText(file);
    
    // Try to parse JSON
    let data;
    try {
      data = JSON.parse(fileContent);
      // Clear the fileContent variable to free memory
      fileContent = null;
    } catch (parseError) {
      throw new Error(`Invalid JSON format: ${parseError.message}`);
    }
    
    // Validate the file structure
    validateChatFile(data);
    
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
}

/**
 * Read a file as text using a Promise
 * @param {File} file - The file to read
 * @returns {Promise<string>} - Promise resolving to file content
 */
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onerror = () => {
      reject(new Error(reader.error?.message || 'Unknown error reading file'));
    };
    
    reader.onload = event => {
      resolve(event.target.result);
    };
    
    reader.readAsText(file);
  });
}

/**
 * Validate chat file structure
 * @param {Object} data - The parsed JSON data
 * @throws {Error} If validation fails
 */
function validateChatFile(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid file: content is not a JSON object');
  }
  
  if (!data.messages) {
    throw new Error('Invalid chat file format: missing "messages" property');
  }
  
  if (!Array.isArray(data.messages)) {
    throw new Error('Invalid chat file format: "messages" is not an array');
  }
}

// Load file from path
export async function loadFile(filePath) {
  console.log('fileHandler.js: loadFile called with path:', filePath);
  showStatus('Loading file...', 'loading');
  
  try {
    // First check file size
    console.log('fileHandler.js: Checking file stats...');
    const fileStats = await window.api.getFileStats(filePath);
    console.log('fileHandler.js: File stats:', fileStats);
    
    // Check for error in fileStats
    if (!fileStats) {
      throw new Error('Could not get file information');
    }
    
    if (fileStats.error) {
      throw new Error(`Error getting file information: ${fileStats.error}`);
    }
    
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB limit
    
    if (fileStats && fileStats.size > MAX_FILE_SIZE) {
      throw new Error(`File too large (${(fileStats.size / (1024 * 1024)).toFixed(2)}MB). Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
    }
    
    console.log('fileHandler.js: Reading file content...');
    const fileData = await window.api.readFile(filePath);
    console.log('fileHandler.js: File data received, message count:', fileData?.content?.messages?.length);
    
    // 验证数据格式正确后再设置chatData
    if (!fileData || !fileData.content || !fileData.content.messages) {
      throw new Error('Invalid file format: missing messages data');
    }
    
    // Clear previous data to free memory
    console.log('fileHandler.js: Clearing previous chat data');
    state.setChatData(null);
    
    // Force garbage collection if available (may not work in all environments)
    if (window.gc) {
      try {
        window.gc();
      } catch (e) {
        console.log('Manual GC not available');
      }
    }
    
    // Set new data after clearing old data
    console.log('fileHandler.js: Setting new chat data');
    state.setChatData(fileData.content);
    
    // Create a file info object
    const { name, size, messageCount } = fileData.stats;
    const fileInfo = { path: filePath, name, size, messageCount };
    
    // Add to file history
    console.log('fileHandler.js: Updating file history');
    state.addToFileHistory(fileInfo);
    updateHistoryList();
    
    // Update UI
    console.log('fileHandler.js: Updating UI');
    updateFileInfo(fileInfo);
    
    showStatus('File loaded successfully', 'success');
    setTimeout(() => {
      showStatus('Ready', 'idle');
    }, 2000);
    
    return fileData;
  } catch (error) {
    // 确保在错误发生时正确重置状态
    console.error('File loading error:', error);
    showStatus(`Error loading file: ${error.message}`, 'error');
    
    // 显示文件导入区域，隐藏文件信息栏
    fileImportArea.style.display = 'block';
    fileImportArea.style.opacity = '1';
    fileInfoBar.style.display = 'none';
    
    // 清除可能已经加载的聊天数据
    state.setChatData(null);
    
    throw error; // Re-throw to allow the caller to handle it
  }
}

// Initialize the file history in the UI
export function initFileHistory() {
  console.log("Initializing file history...");
  
  // Use the centralized history initialization
  initializeHistory();
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