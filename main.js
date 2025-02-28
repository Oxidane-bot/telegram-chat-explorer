const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Keep a global reference of the window object to prevent it from being garbage collected
let mainWindow;

// Create the main application window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    // Use frameless window for custom titlebar
    frame: false,
    transparent: false,
    backgroundColor: '#2d2d33'
  });

  // Load the index.html file
  mainWindow.loadFile('index.html');


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
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'JSON Files', extensions: ['json'] }
    ]
  });

  if (canceled || filePaths.length === 0) {
    return null;
  }

  const filePath = filePaths[0];
  return { 
    path: filePath, 
    name: path.basename(filePath) 
  };
});

// Handle reading the selected file
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    // Check if file exists first
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Get file stats
    const fileStats = fs.statSync(filePath);
    
    // For very large files, warn the user
    if (fileStats.size > 50000000) { // 50MB
      mainWindow.webContents.send('file-warning', 'Large file detected. Processing may take some time.');
    }
    
    // Read file content
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    let data;
    try {
      // Try to parse the JSON
      data = JSON.parse(fileContent);
    } catch (parseError) {
      // Get more context for the parse error
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
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid file: content is not a JSON object');
    }
    
    if (!data.messages) {
      throw new Error('Invalid chat file format: missing "messages" property');
    }
    
    if (!Array.isArray(data.messages)) {
      throw new Error('Invalid chat file format: "messages" is not an array');
    }
    
    return {
      content: data,
      stats: {
        size: fileStats.size,
        messageCount: data.messages.length,
        name: path.basename(filePath)
      }
    };
  } catch (error) {
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