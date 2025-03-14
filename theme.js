import { 
  themeToggle, 
  minimizeBtn, 
  maximizeBtn, 
  closeBtn, 
  themeSelectorBtn,
  themeSelector,
  themeSelectorClose,
  lightModeOption,
  darkModeOption,
  colorOptions,
  designOptions
} from './dom-elements.js';
import * as state from './state.js';

// 用于跟踪事件监听器是否已添加
let eventListenersInitialized = false;

// Theme initialization
export function initTheme() {
  // Check if user has a theme preference saved
  const savedMode = localStorage.getItem('themeMode') || 'dark';
  const savedColorTheme = localStorage.getItem('colorTheme') || 'default';
  const savedDesignTheme = localStorage.getItem('designTheme') || 'modern';
  
  // Apply the saved theme mode
  applyThemeMode(savedMode === 'dark');
  
  // Apply the saved color theme
  setColorTheme(savedColorTheme, false);
  
  // Apply the saved design theme
  applyDesignTheme(savedDesignTheme);
  
  // Update the active design option
  updateDesignOptionUI(savedDesignTheme);
}

// 应用主题模式（亮色/深色）并更新UI
function applyThemeMode(isDark) {
  // Apply theme changes to body
  if (isDark) {
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    darkModeOption.classList.add('active');
    lightModeOption.classList.remove('active');
  } else {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    lightModeOption.classList.add('active');
    darkModeOption.classList.remove('active');
  }
  
  // Update state
  state.setIsDarkTheme(isDark);
}

// Toggle between light and dark themes
export function toggleTheme() {
  const newThemeIsDark = !state.getIsDarkTheme();
  
  // 应用主题变更
  applyThemeMode(newThemeIsDark);
  
  // 保存到localStorage
  localStorage.setItem('themeMode', newThemeIsDark ? 'dark' : 'light');
  
  // Force a repaint to ensure the theme is applied
  void document.body.offsetHeight;
}

// Set color theme
export function setColorTheme(theme, saveToStorage = true) {
  // Remove all theme classes first
  document.body.classList.remove(
    'theme-purple', 
    'theme-green', 
    'theme-amber', 
    'theme-pink', 
    'theme-teal'
  );
  
  // Add new theme class if not default
  if (theme !== 'default') {
    document.body.classList.add(`theme-${theme}`);
  }
  
  // Update active state of color options
  updateColorOptionUI(theme);
  
  // Save to localStorage if requested
  if (saveToStorage) {
    localStorage.setItem('colorTheme', theme);
  }
}

// 更新颜色选项UI状态
function updateColorOptionUI(theme) {
  colorOptions.forEach(option => {
    if (option.dataset.theme === theme) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });
}

// Set design theme
export function setDesignTheme(design) {
  applyDesignTheme(design);
  updateDesignOptionUI(design);
  
  // Save to localStorage
  localStorage.setItem('designTheme', design);
}

// 更新设计选项UI状态
function updateDesignOptionUI(design) {
  // 检查是否被映射到新主题
  let finalDesign = design;
  if (['compact', 'neumorphic', 'glassmorphism'].includes(design)) {
    // Map old themes to new ones
    const themeMap = {
      'compact': 'minimal',
      'neumorphic': 'elegant',
      'glassmorphism': 'tech'
    };
    finalDesign = themeMap[design];
  }
  
  designOptions.forEach(option => {
    if (option.dataset.design === finalDesign) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });
}

// Apply design theme
function applyDesignTheme(design) {
  // Remove all design theme classes first
  document.body.classList.remove(
    'theme-modern',
    'theme-retro',
    'theme-elegant',
    'theme-minimal',
    'theme-tech',
    'theme-futuristic',
    'theme-compact',
    'theme-neumorphic',
    'theme-glassmorphism',
    'theme-synthwave',
    'theme-cyberpunk',
    'theme-space'
  );
  
  // Add the new design theme class
  document.body.classList.add(`theme-${design}`);
  
  // For backwards compatibility, if an old theme is detected, map it to a new one
  if (['compact', 'neumorphic', 'glassmorphism'].includes(design)) {
    // Map old themes to new ones
    const themeMap = {
      'compact': 'minimal',
      'neumorphic': 'elegant',
      'glassmorphism': 'tech'
    };
    
    const newTheme = themeMap[design];
    
    // Remove the old theme class and add the new one
    document.body.classList.remove(`theme-${design}`);
    document.body.classList.add(`theme-${newTheme}`);
    
    // Save the new theme to localStorage
    localStorage.setItem('designTheme', newTheme);
  }
}

// 初始化主题控件事件监听器 - 仅执行一次
export function initThemeControls() {
  if (eventListenersInitialized) {
    return; // 防止多次初始化
  }
  
  // 窗口控制按钮事件
  if (minimizeBtn) {
    minimizeBtn.addEventListener('click', () => {
      window.api.windowControl('minimize');
    });
  }
  
  if (maximizeBtn) {
    maximizeBtn.addEventListener('click', () => {
      window.api.windowControl('maximize');
    });
  }
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      window.api.windowControl('close');
    });
  }
  
  // 主题切换按钮事件
  themeToggle.addEventListener('click', toggleTheme);
  
  // 主题选择器按钮事件
  themeSelectorBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    themeSelector.classList.toggle('open');
  });
  
  // 关闭主题选择器
  themeSelectorClose.addEventListener('click', () => {
    themeSelector.classList.remove('open');
  });
  
  // 点击外部关闭选择器
  document.addEventListener('click', (e) => {
    if (themeSelector.classList.contains('open') && 
        !themeSelector.contains(e.target) && 
        e.target !== themeSelectorBtn) {
      themeSelector.classList.remove('open');
    }
  });
  
  // 处理亮色模式点击
  lightModeOption.addEventListener('click', () => {
    if (state.getIsDarkTheme()) {
      toggleTheme();
    }
  });
  
  // 处理深色模式点击
  darkModeOption.addEventListener('click', () => {
    if (!state.getIsDarkTheme()) {
      toggleTheme();
    }
  });
  
  // 设置设计主题
  designOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      const design = e.currentTarget.dataset.design;
      setDesignTheme(design);
    });
  });
  
  // 设置颜色主题
  colorOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      const theme = e.currentTarget.dataset.theme;
      setColorTheme(theme);
    });
  });
  
  // 标记为已初始化
  eventListenersInitialized = true;
}

// 这些函数已不再使用，为保持兼容性保留
export function initWindowControls() {
  console.warn('initWindowControls is deprecated, use initThemeControls instead');
  initThemeControls();
}