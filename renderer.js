// Completely replace the renderer.js file

// Import modules
import * as domElements from './dom-elements.js';
import { setupDragAndDrop, loadFile } from './fileHandler.js';
import { performSearch, cleanup } from './search.js';
import { loadMoreResults } from './ui.js';
import { showStatus } from './utils.js';
import * as state from './state.js';
import { initializeHistory } from './history.js';
import { initTheme, initThemeControls } from './theme.js';

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
    // Check if file is loaded
    if (!state.getChatData()) {
      showStatus('Please load a chat file first', 'error');
      // Show the file import area if it's hidden
      if (domElements.fileImportArea.style.display === 'none') {
        domElements.fileImportArea.style.display = 'block';
        domElements.fileInfoBar.style.display = 'none';
        domElements.emptyState.style.display = 'flex';
      }
      return;
    }
    
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
      // Check if file is loaded
      if (!state.getChatData()) {
        showStatus('Please load a chat file first', 'error');
        // Show the file import area if it's hidden
        if (domElements.fileImportArea.style.display === 'none') {
          domElements.fileImportArea.style.display = 'block';
          domElements.fileInfoBar.style.display = 'none';
          domElements.emptyState.style.display = 'flex';
        }
        return;
      }
      
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

// Helper function for safely adding event listeners
function addSafeEventListener(element, event, handler) {
  if (!element) return null;
  const newElement = element.cloneNode(true);
  element.parentNode.replaceChild(newElement, element);
  newElement.addEventListener(event, handler);
  return newElement;
}

function setupThemeControls() {
  // 初始化主题设置
  initTheme();
  
  // 初始化主题控件事件监听器(只会执行一次)
  initThemeControls();
}

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
  showStatus(`An error occurred: ${event.error.message}`, 'error');
});

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
  console.time('appInit');
  console.log('App initializing');
  
  try {
    // 1. 先加载关键模块
    const utils = await import('./utils.js');
    const { initTheme } = await import('./theme.js');
    const dom = await import('./dom-elements.js');
    const stateModule = await import('./state.js');
    
    // 2. 立即初始化主题(这是视觉上很重要的)
    initTheme();
    
    // 3. 并行加载其它非关键模块
    const [
      { setupDragAndDrop }, 
      { initThemeControls }
    ] = await Promise.all([
      import('./fileHandler.js'),
      import('./theme.js')
    ]);
    
    // 4. 设置关键事件监听器
    initThemeControls();
    setupDragAndDrop();
    setupMinimalEventListeners(dom, utils);
    
    // 5. 加载完成，移除初始加载器
    document.getElementById('initialLoading').style.opacity = '0';
    setTimeout(() => {
      document.getElementById('initialLoading').style.display = 'none';
    }, 300);
    
    // 6. 延迟加载其余功能
    setTimeout(async () => {
      const { initializeHistory } = await import('./history.js');
      initializeHistory();
      setupRemainingListeners(dom, utils, stateModule);
      console.log('All features initialized');
    }, 500);
    
    console.timeEnd('appInit');
  } catch (error) {
    console.error('Error during app initialization:', error);
    document.getElementById('initialLoading').innerHTML = 
      `<div class="error-message">Error during initialization: ${error.message}</div>`;
  }
});

// 只设置最小必要的事件监听器
function setupMinimalEventListeners(dom, utils) {
  // 只添加必要的用户交互事件
  dom.browseBtn.addEventListener('click', async () => {
    // 延迟加载文件处理模块
    const { loadFile } = await import('./fileHandler.js');
    const fileInfo = await window.api.openFileDialog();
    if (fileInfo) {
      loadFile(fileInfo.path);
    }
  });
}

// 设置其余事件监听器
function setupRemainingListeners(dom, utils, state) {
  // 搜索功能
  dom.searchBtn.addEventListener('click', async () => {
    const { performSearch } = await import('./search.js');
    performSearch();
  });
  
  dom.searchInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
      const { performSearch } = await import('./search.js');
      performSearch();
    }
  });
  
  // 清除按钮
  dom.clearBtn.addEventListener('click', async () => {
    const { cleanup } = await import('./search.js');
    cleanup();
    dom.searchInput.value = '';
    dom.resultsContainer.innerHTML = '';
    dom.emptyState.style.display = 'flex';
    dom.resultsStats.textContent = '';
    state.setAllResults([]);
    state.setDisplayedResultsCount(0);
  });
  
  // 视图切换按钮 - 使用更健壮的实现
  domElements.cardViewBtn.addEventListener('click', () => {
    switchView('card');
  });
  
  domElements.listViewBtn.addEventListener('click', () => {
    switchView('list');
  });
  
  // 添加全局错误处理
  window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    showStatus('An error occurred: ' + event.reason, 'error');
  });
}

// 定义一个更健壮的视图切换函数
function switchView(viewType) {
  console.log(`Switching to ${viewType} view`);
  
  // 更新状态
  state.setCurrentView(viewType);
  
  // 更新UI按钮状态
  if (viewType === 'card') {
    domElements.cardViewBtn.classList.add('active');
    domElements.listViewBtn.classList.remove('active');
  } else {
    domElements.listViewBtn.classList.add('active');
    domElements.cardViewBtn.classList.remove('active');
  }
  
  // 重新渲染当前结果
  rerenderResults(viewType);
}

// 抽取重新渲染逻辑到单独函数
function rerenderResults(viewType) {
  const allResults = state.getAllResults();
  console.log(`Rerendering ${allResults.length} results in ${viewType} view`);
  
  if (!allResults || allResults.length === 0) {
    domElements.resultsContainer.className = `results-container ${viewType}-view`;
    return;
  }
  
  // 保存当前显示数量
  const currentCount = state.getDisplayedResultsCount();
  
  // 重置显示计数并清空容器
  state.setDisplayedResultsCount(0);
  domElements.resultsContainer.innerHTML = '';
  
  // 设置正确的视图类
  domElements.resultsContainer.className = `results-container ${viewType}-view`;
  
  // 加载与之前相同数量的结果
  const endIndex = Math.min(currentCount, allResults.length);
  const resultsToRender = allResults.slice(0, endIndex);
  
  console.log(`Rendering ${resultsToRender.length} items`);
  
  // 创建文档片段以提高性能
  const fragment = document.createDocumentFragment();
  
  // 使用常规导入而非动态导入以避免问题
  if (viewType === 'card') {
    import('./ui.js').then(ui => {
      ui.renderCardViewBatch(resultsToRender, fragment);
      finishRendering(ui, fragment, endIndex, allResults.length);
    }).catch(err => {
      console.error('Error importing ui module:', err);
      showStatus('Error switching view: ' + err.message, 'error');
    });
  } else {
    import('./ui.js').then(ui => {
      ui.renderListViewBatch(resultsToRender, fragment);
      finishRendering(ui, fragment, endIndex, allResults.length);
    }).catch(err => {
      console.error('Error importing ui module:', err);
      showStatus('Error switching view: ' + err.message, 'error');
    });
  }
}

// 完成渲染的辅助函数
function finishRendering(ui, fragment, endIndex, totalResults) {
  // 追加片段到容器
  domElements.resultsContainer.appendChild(fragment);
  
  // 更新显示计数
  state.setDisplayedResultsCount(endIndex);
  
  // 如果需要，添加"加载更多"按钮
  if (endIndex < totalResults) {
    if (state.getCurrentView() === 'card') {
      ui.addLoadMoreCard();
    } else {
      ui.addLoadMoreListItem();
    }
  }
  
  // 触发渲染完成事件
  document.dispatchEvent(new CustomEvent('resultsRendered', {
    detail: { resultsCount: totalResults }
  }));
}