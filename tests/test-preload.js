/**
 * Testing helper functions that are injected into the renderer process
 * This allows us to write tests that interact with the app more effectively
 */

// Export function to be called in the main process
module.exports = {
  setupTestHelpers: () => {
    // These functions will be available in the renderer process
    return `
      // 标记当前是测试环境
      window.isTestMode = true;
      
      // 存储测试状态
      window.testState = {
        currentLoadedFile: null,
        mockFilePath: null,
        fileLoadStatus: 'idle', // 'idle', 'loading', 'loaded', 'error'
        processingFile: false
      };
      
      // 监听测试文件加载事件
      window.addEventListener('test-file-load', (event) => {
        console.log('Test file load event received:', event.detail);
        window.testState.mockFilePath = event.detail.path;
        window.testState.fileLoadStatus = 'loading';
      });
      
      // 监听测试文件加载完成事件
      window.addEventListener('test-file-loaded', (event) => {
        console.log('Test file loaded event received:', event.detail);
        window.testState.currentLoadedFile = event.detail.fileInfo.path;
        window.testState.fileLoadStatus = 'loaded';
        
        // 如果已经存在state模块，尝试将文件添加到历史记录
        if (window.state && typeof window.state.addToFileHistory === 'function') {
          window.state.addToFileHistory({
            path: event.detail.fileInfo.path,
            name: event.detail.fileInfo.name,
            size: event.detail.result?.stats?.size || 1024,
            lastOpened: new Date().toISOString()
          });
          
          // 如果存在updateHistoryList函数，更新历史记录列表
          if (typeof window.updateHistoryList === 'function') {
            window.updateHistoryList();
          }
        }
      });
      
      // File loading test helpers
      window.loadFileForTesting = (filePath) => {
        // Store the path for verification 
        window.testState.currentLoadedFile = filePath;
        window.testState.fileLoadStatus = 'loading';
        
        console.log('Mock loading file:', filePath);
        
        // 创建一个Promise来表示加载过程
        return new Promise((resolve, reject) => {
          try {
            // 如果有实际的API可用，使用实际API
            if (window.api && typeof window.api.readFile === 'function') {
              window.api.readFile(filePath)
                .then(result => {
                  window.testState.fileLoadStatus = 'loaded';
                  
                  // 如果state模块可用，尝试更新状态
                  if (window.state && typeof window.state.addToFileHistory === 'function') {
                    const fileName = filePath.split(/[/\\]/).pop();
                    window.state.addToFileHistory({
                      path: filePath,
                      name: fileName,
                      size: result?.stats?.size || 1024,
                      lastOpened: new Date().toISOString()
                    });
                  }
                  
                  // 尝试更新历史记录列表
                  if (typeof window.updateHistoryList === 'function') {
                    window.updateHistoryList();
                  }
                  
                  resolve(result);
                })
                .catch(err => {
                  window.testState.fileLoadStatus = 'error';
                  console.error('Error in loadFileForTesting:', err);
                  reject(err);
                });
            } else {
              // 否则模拟加载成功
              setTimeout(() => {
                window.testState.fileLoadStatus = 'loaded';
                
                // 触发事件以模拟加载完成
                const fileLoadedEvent = new CustomEvent('file-loaded', { 
                  detail: { 
                    path: filePath, 
                    name: filePath.split(/[/\\]/).pop(),
                    size: 1024,
                    lastOpened: new Date().toISOString()
                  } 
                });
                window.dispatchEvent(fileLoadedEvent);
                
                resolve({ success: true });
              }, 300);
            }
          } catch (error) {
            window.testState.fileLoadStatus = 'error';
            console.error('Exception in loadFileForTesting:', error);
            reject(error);
          }
        });
      };
      
      // 处理拖放文件的测试辅助函数
      window.processDroppedFile = (file) => {
        console.log('Processing dropped file in test mode:', file.name);
        window.testState.processingFile = true;
        
        // 如果应用有实际的方法处理文件，使用它
        if (typeof window.handleDroppedFileContent === 'function') {
          return window.handleDroppedFileContent(file)
            .finally(() => {
              window.testState.processingFile = false;
            });
        }
        
        // 否则模拟处理成功
        setTimeout(() => {
          // 触发事件以模拟加载完成
          const fileLoadedEvent = new CustomEvent('file-loaded', { 
            detail: { 
              path: file.name, 
              name: file.name,
              size: file.size || 1024,
              lastOpened: new Date().toISOString()
            } 
          });
          window.dispatchEvent(fileLoadedEvent);
          
          window.testState.currentLoadedFile = file.name;
          window.testState.processingFile = false;
        }, 500);
      };
      
      window.clearLoadedFileForTesting = () => {
        window.testState.currentLoadedFile = null;
        window.testState.fileLoadStatus = 'idle';
      };
      
      window.getCurrentLoadedFileForTesting = () => {
        return window.testState.currentLoadedFile;
      };
      
      window.getFileLoadStatus = () => {
        return window.testState.fileLoadStatus;
      };
      
      // History testing helpers
      window.getHistoryItems = () => {
        return document.querySelectorAll('.history-item');
      };
      
      window.getHistoryItemByPath = (path) => {
        const items = document.querySelectorAll('.history-item');
        for (const item of items) {
          if (item.dataset.path === path) {
            return item;
          }
        }
        return null;
      };
      
      // 在测试模式下覆盖本地存储，以避免污染真实的本地存储
      if (window.localStorage) {
        const originalLocalStorage = window.localStorage;
        const testStorage = {};
        
        window.localStorage = {
          getItem: (key) => {
            console.log('Test localStorage.getItem:', key);
            return testStorage[key] || originalLocalStorage.getItem(key);
          },
          setItem: (key, value) => {
            console.log('Test localStorage.setItem:', key, value);
            testStorage[key] = value;
          },
          removeItem: (key) => {
            console.log('Test localStorage.removeItem:', key);
            delete testStorage[key];
          },
          clear: () => {
            console.log('Test localStorage.clear');
            Object.keys(testStorage).forEach(key => delete testStorage[key]);
          }
        };
      }
      
      // Log that test helpers were loaded
      console.log('Test helper functions have been initialized in version 2.0');
    `;
  }
}; 

// 测试环境的预加载脚本
const fs = require('fs');
const path = require('path');

// CI环境检测
const isCI = process.env.CI === 'true';
console.log('测试预加载 - CI环境:', isCI);

// 为测试环境设置模拟数据和工具函数
class TestEnvironment {
  constructor() {
    this.mockDataPath = path.join(__dirname, 'mock-data');
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    console.log('初始化测试环境...');
    
    // 确保mock目录存在
    this.ensureDirectory(this.mockDataPath);
    
    // 创建测试用的聊天数据文件
    await this.createMockChatFile();
    
    this.initialized = true;
    console.log('测试环境初始化完成');
  }
  
  ensureDirectory(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`创建目录: ${dir}`);
    }
  }
  
  async createMockChatFile() {
    const mockChatPath = path.join(this.mockDataPath, 'simple-chat.json');
    
    // 简单的mock数据
    const mockData = {
      name: "Test Chat",
      type: "personal_chat",
      messages: [
        { 
          id: 1, 
          type: "message", 
          date: "2023-01-01T10:00:00Z",
          from: "Test User",
          text: "Hello world" 
        },
        { 
          id: 2, 
          type: "message", 
          date: "2023-01-01T10:01:00Z",
          from: "Another User",
          text: "Test message" 
        }
      ]
    };
    
    try {
      fs.writeFileSync(mockChatPath, JSON.stringify(mockData, null, 2));
      console.log(`创建测试聊天数据: ${mockChatPath}`);
    } catch (err) {
      console.error('创建测试聊天数据失败:', err);
    }
  }
  
  // CI环境特殊处理
  setupCIEnvironment() {
    if (!isCI) return;
    
    console.log('为CI环境设置特殊配置...');
    
    // 覆盖Electron设置，优化CI运行
    global.ciElectronSettings = {
      accelerator: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    };
    
    // 设置特定环境变量
    process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
    
    console.log('CI环境特殊配置完成');
  }
}

const testEnv = new TestEnvironment();
testEnv.init();

// 对CI环境进行特殊设置
if (isCI) {
  testEnv.setupCIEnvironment();
  
  // 在CI环境中模拟一些浏览器功能
  global.window = global.window || {};
  global.document = global.document || {
    createElement: () => ({
      style: {},
      addEventListener: () => {},
      removeEventListener: () => {},
      appendChild: () => {}
    })
  };
}

module.exports = testEnv; 