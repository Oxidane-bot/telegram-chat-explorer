const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // File operations
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  
  // Window controls
  windowControl: (command) => ipcRenderer.send('window-control', command),
  
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
  }
});
