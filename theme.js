import { themeToggle, minimizeBtn, maximizeBtn, closeBtn } from './dom-elements.js';
import * as state from './state.js';

// Theme initialization
export function initTheme() {
  // Check if user has a theme preference saved
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    state.setIsDarkTheme(true);
  }
}

// Toggle between light and dark themes
export function toggleTheme() {
  if (state.getIsDarkTheme()) {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
  } else {
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  }
  
  state.setIsDarkTheme(!state.getIsDarkTheme());
  localStorage.setItem('theme', state.getIsDarkTheme() ? 'dark' : 'light');
}

// Window controls initialization
export function initWindowControls() {
  minimizeBtn.addEventListener('click', () => {
    window.api.windowControl('minimize');
  });
  
  maximizeBtn.addEventListener('click', () => {
    window.api.windowControl('maximize');
  });
  
  closeBtn.addEventListener('click', () => {
    window.api.windowControl('close');
  });
  
  themeToggle.addEventListener('click', toggleTheme);
}