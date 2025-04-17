const { app, BrowserWindow, ipcMain, dialog, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

// Keep a global reference of the window object to prevent it from being garbage collected
let mainWindow;

// Determine if the app is running in test mode
const isTestMode = process.env.NODE_ENV === 'test';
const mockFilePath = process.env.MOCK_FILE_PATH;

// Create the main application window
function createWindow() {
  // Determine which preload script to use
  const preloadScript = isTestMode 
    ? path.join(__dirname, 'preload.js') // Use regular preload for now
    : path.join(__dirname, 'preload.js');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      preload: preloadScript,
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true // 确保开发者工具已启用
    },
    // Use frameless window for custom titlebar
    frame: false,
    transparent: false,
    backgroundColor: '#2d2d33'
  });

  // Load the index.html file
  mainWindow.loadFile('index.html');

  // If in test mode, inject test helper scripts
  if (isTestMode) {
    mainWindow.webContents.on('did-finish-load', () => {
      try {
        // 1. 加载测试辅助函数
        const testPreload = require('./tests/test-preload');
        const helperScript = testPreload.setupTestHelpers();
        mainWindow.webContents.executeJavaScript(helperScript)
          .then(() => console.log('Test helper functions injected'))
          .catch(err => console.error('Failed to inject test helpers:', err));
        
        // 2. 如果提供了mockFilePath，自动加载模拟数据文件
        if (mockFilePath && fs.existsSync(mockFilePath)) {
          console.log('Auto-loading mock file in test mode:', mockFilePath);
          setTimeout(() => {
            // 通过IPC通知渲染进程加载文件
            mainWindow.webContents.send('load-test-file', {
              path: mockFilePath,
              name: path.basename(mockFilePath)
            });
          }, 1000); // 延迟一秒确保应用已完全加载
        }
      } catch (error) {
        console.error('Error in test mode setup:', error);
      }
    });
  }

  // 设置F12快捷键打开开发者工具
  globalShortcut.register('F12', () => {
    if (mainWindow) {
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
      } else {
        mainWindow.webContents.openDevTools();
      }
    }
  });

  // 设置Ctrl+Shift+I快捷键作为备用方式打开开发者工具
  globalShortcut.register('Control+Shift+I', () => {
    if (mainWindow) {
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
      } else {
        mainWindow.webContents.openDevTools();
      }
    }
  });

  // Handle window closing
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create window when app is ready
app.whenReady().then(() => {
  createWindow();

  // macOS-specific behavior: re-create window when the dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for file operations
ipcMain.handle('open-file-dialog', async () => {
  console.log('Main process: open-file-dialog handler called');
  try {
    console.log('Main process: showing open dialog');
    const dialogResult = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'JSON Files', extensions: ['json'] }
      ]
    });
    
    console.log('Main process: dialog result:', dialogResult);
    
    const { canceled, filePaths } = dialogResult;
    
    if (canceled || filePaths.length === 0) {
      console.log('Main process: dialog canceled or no file selected');
      return null;
    }
    
    const filePath = filePaths[0];
    console.log('Main process: selected file path:', filePath);
    
    const result = { 
      path: filePath, 
      name: path.basename(filePath) 
    };
    
    console.log('Main process: returning result:', result);
    return result;
  } catch (error) {
    console.error('Main process: error in open-file-dialog handler:', error);
    return null;
  }
});

// Add handler to get file stats before reading
ipcMain.handle('get-file-stats', async (event, filePath) => {
  console.log('Main process: get-file-stats handler called with path:', filePath);
  
  if (!filePath) {
    console.error('Main process: No filepath provided to get-file-stats');
    return null;
  }
  
  try {
    // Check if file exists first
    console.log('Main process: Checking if file exists');
    if (!fs.existsSync(filePath)) {
      console.log('Main process: File not found:', filePath);
      return { error: 'File not found' };
    }
    
    console.log('Main process: Getting file stats');
    const stats = fs.statSync(filePath);
    console.log('Main process: File stats retrieved:', {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    });
    
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };
  } catch (error) {
    console.error('Main process: Error getting file stats:', error);
    return { error: error.message };
  }
});

// Handle reading the selected file
ipcMain.handle('read-file', async (event, filePath) => {
  console.log('Main process: read-file handler called with path:', filePath);
  
  try {
    // Check if file exists first
    console.log('Main process: Checking if file exists');
    if (!fs.existsSync(filePath)) {
      console.log('Main process: File not found:', filePath);
      throw new Error(`File not found: ${filePath}`);
    }

    // Get file stats
    console.log('Main process: Getting file stats');
    const fileStats = fs.statSync(filePath);
    console.log('Main process: File size:', fileStats.size);
    
    // For very large files, warn the user
    if (fileStats.size > 50000000) { // 50MB
      console.log('Main process: Large file warning');
      mainWindow.webContents.send('file-warning', 'Large file detected. Processing may take some time.');
    }
    
    // Read file content
    console.log('Main process: Reading file content');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    console.log('Main process: File content length:', fileContent.length);
    
    let data;
    try {
      // Try to parse the JSON
      console.log('Main process: Parsing JSON');
      data = JSON.parse(fileContent);
      console.log('Main process: JSON parsed successfully');
    } catch (parseError) {
      // Get more context for the parse error
      console.error('Main process: JSON parse error:', parseError);
      const errorPosition = parseError.message.match(/position (\d+)/);
      let contextInfo = '';
      
      if (errorPosition && errorPosition[1]) {
        const pos = parseInt(errorPosition[1]);
        const start = Math.max(0, pos - 40);
        const end = Math.min(fileContent.length, pos + 40);
        const context = fileContent.substring(start, end);
        contextInfo = `\nError near: "...${context}..."`;
      }
      
      throw new Error(`Invalid JSON format: ${parseError.message}${contextInfo}\n\nPlease ensure the file is valid JSON.`);
    }
    
    // Validate if the file has the expected structure
    console.log('Main process: Validating file structure');
    if (!data || typeof data !== 'object') {
      console.log('Main process: Invalid file - not an object');
      throw new Error('Invalid file: content is not a JSON object');
    }
    
    if (!data.messages) {
      console.log('Main process: Invalid file - missing messages property');
      throw new Error('Invalid chat file format: missing "messages" property');
    }
    
    if (!Array.isArray(data.messages)) {
      console.log('Main process: Invalid file - messages not an array');
      throw new Error('Invalid chat file format: "messages" is not an array');
    }
    
    console.log('Main process: File validation passed, message count:', data.messages.length);
    
    const result = {
      content: data,
      stats: {
        size: fileStats.size,
        messageCount: data.messages.length,
        name: path.basename(filePath)
      }
    };
    
    console.log('Main process: Returning file data');
    return result;
  } catch (error) {
    console.error('Main process: Error reading file:', error);
    throw new Error(`Error reading file: ${error.message}`);
  }
});

// Handle window controls
ipcMain.on('window-control', (event, command) => {
  switch (command) {
    case 'minimize':
      mainWindow.minimize();
      break;
    case 'maximize':
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
      break;
    case 'close':
      mainWindow.close();
      break;
  }
});