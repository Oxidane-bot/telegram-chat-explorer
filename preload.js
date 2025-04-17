const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // File operations
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  getFileStats: (filePath) => ipcRenderer.invoke('get-file-stats', filePath),
  
  // Window controls
  windowControl: (command) => ipcRenderer.send('window-control', command),
  
  // Developer tools
  toggleDevTools: () => ipcRenderer.invoke('toggle-dev-tools'),
  
  // Utility methods for renderer
  formatFileSize: (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
  },
  
  formatDate: (dateValue) => {
    try {
      // Handle empty or null values
      if (!dateValue) {
        return "Unknown date";
      }
      
      // Handle Unix timestamps (numbers) or ISO strings
      const date = typeof dateValue === 'number' 
        ? new Date(dateValue * 1000)  // Unix timestamp (seconds)
        : new Date(dateValue);        // Date string
      
      // Check if date is valid before formatting
      if (isNaN(date.getTime())) {
        return "Unknown date";
      }
      
      return date.toLocaleString();
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Unknown date";
    }
  },
  
  // 测试辅助工具
  isTestMode: process.env.NODE_ENV === 'test',
  
  // 开发工具信息
  devToolsInfo: {
    shortcuts: [
      { key: 'F12', description: '打开/关闭开发者工具' },
      { key: 'Ctrl+Shift+I', description: '打开/关闭开发者工具 (备用快捷键)' }
    ]
  }
});

// 监听测试模式下的文件加载事件
if (process.env.NODE_ENV === 'test') {
  ipcRenderer.on('load-test-file', (event, fileInfo) => {
    console.log('Received test file loading command:', fileInfo);
    
    // 当DOMContentLoaded事件触发后再执行加载
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => loadTestFile(fileInfo), 500);
      });
    } else {
      setTimeout(() => loadTestFile(fileInfo), 500);
    }
  });
}

function loadTestFile(fileInfo) {
  // 将文件信息通知给渲染进程
  if (fileInfo && fileInfo.path) {
    console.log('Dispatching test file load event for:', fileInfo.path);
    
    // 创建一个自定义事件，将文件信息传递给渲染进程
    const event = new CustomEvent('test-file-load', { 
      detail: fileInfo 
    });
    window.dispatchEvent(event);
    
    // 直接调用readFile方法加载文件
    ipcRenderer.invoke('read-file', fileInfo.path)
      .then(result => {
        console.log('Test file loaded successfully');
        // 触发文件加载成功事件
        const successEvent = new CustomEvent('test-file-loaded', { 
          detail: { 
            fileInfo, 
            result 
          } 
        });
        window.dispatchEvent(successEvent);
      })
      .catch(err => {
        console.error('Error loading test file:', err);
      });
  }
}
