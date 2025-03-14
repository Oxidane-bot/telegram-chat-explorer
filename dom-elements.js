// DOM Elements - This module should only contain DOM element references
export const fileImportArea = document.getElementById('fileImportArea');
export const fileImportContent = document.querySelector('.file-import-content');
export const fileInfoBar = document.getElementById('fileInfoBar');
export const fileName = document.getElementById('fileName');
export const messageCount = document.getElementById('messageCount');
export const fileSize = document.getElementById('fileSize');
export const browseBtn = document.getElementById('browseBtn');
export const switchFileBtn = document.getElementById('switchFileBtn');
export const searchInput = document.getElementById('searchInput');
export const searchBtn = document.getElementById('searchBtn');
export const clearBtn = document.getElementById('clearBtn');
export const searchSuggestions = document.getElementById('searchSuggestions');
export const cardViewBtn = document.getElementById('cardViewBtn');
export const listViewBtn = document.getElementById('listViewBtn');
export const resultsStats = document.getElementById('resultsStats');
export const resultsArea = document.getElementById('resultsArea');
export const emptyState = document.getElementById('emptyState');
export const resultsContainer = document.getElementById('resultsContainer');
export const statusIndicator = document.getElementById('statusIndicator');
export const statusText = document.getElementById('statusText');
export const themeToggle = document.getElementById('theme-toggle');
export const minimizeBtn = document.getElementById('minimize-btn');
export const maximizeBtn = document.getElementById('maximize-btn');
export const closeBtn = document.getElementById('close-btn');

// Theme Selector Elements
export const themeSelectorBtn = document.getElementById('theme-selector-btn');
export const themeSelector = document.getElementById('theme-selector');
export const themeSelectorClose = document.getElementById('theme-selector-close');
export const lightModeOption = document.getElementById('light-mode');
export const darkModeOption = document.getElementById('dark-mode');
export const colorOptions = document.querySelectorAll('.color-option');
export const designOptions = document.querySelectorAll('.design-option');

// Constants
export const RESULTS_PER_PAGE = 50;

// Function to add history styles to the document
export function addHistoryStyles() {
  // Check if styles are already added
  if (!document.getElementById('historyStyles')) {
    const historyStyles = document.createElement('style');
    historyStyles.id = 'historyStyles';
    historyStyles.textContent = `
      /* Compact Modern History Panel */
      .history-panel {
        background-color: transparent;
        border-radius: 8px;
        margin-top: 12px;
        overflow: hidden;
        max-height: 250px; /* Reduced height */
        display: flex;
        flex-direction: column;
        transition: all 0.3s ease;
        border: 1px solid var(--light-border);
      }
      
      .dark-theme .history-panel {
        border-color: var(--dark-border);
      }
      
      .history-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 14px; /* Reduced padding */
        background-color: var(--light-bg-secondary);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        position: relative;
        z-index: 1;
      }
      
      .dark-theme .history-header {
        background-color: var(--dark-bg-secondary);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
      }
      
      .history-header h3 {
        margin: 0;
        font-size: 14px; /* Smaller font */
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .history-header h3::before {
        content: '';
        display: inline-block;
        width: 14px; /* Smaller icon */
        height: 14px;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24'%3E%3Cpath fill='none' d='M0 0h24v24H0z'/%3E%3Cpath d='M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm0 18c4.42 0 8-3.58 8-8s-3.58-8-8-8-8 3.58-8 8 3.58 8 8 8zm1-8h4v2h-6V7h2v5z' fill='rgba(49,130,206,1)'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: center;
        background-size: contain;
      }
      
      .dark-theme .history-header h3::before {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24'%3E%3Cpath fill='none' d='M0 0h24v24H0z'/%3E%3Cpath d='M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm0 18c4.42 0 8-3.58 8-8s-3.58-8-8-8-8 3.58-8 8 3.58 8 8 8zm1-8h4v2h-6V7h2v5z' fill='rgba(145,190,255,1)'/%3E%3C/svg%3E");
      }
      
      .clear-history-btn {
        background: none;
        border: none;
        width: 24px; /* Smaller button */
        height: 24px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: var(--light-text-secondary);
        transition: all 0.2s ease;
      }
      
      .dark-theme .clear-history-btn {
        color: var(--dark-text-secondary);
      }
      
      .clear-history-btn:hover {
        background-color: rgba(229, 62, 62, 0.1);
        color: #e53e3e;
      }
      
      .history-list {
        overflow-y: auto;
        background-color: var(--light-bg-secondary);
        max-height: 200px; /* Reduced max height */
        padding: 2px 0;
      }
      
      .dark-theme .history-list {
        background-color: var(--dark-bg-secondary);
      }
      
      .history-item {
        display: flex;
        align-items: center;
        padding: 8px 12px; /* Reduced padding */
        margin: 2px 6px; /* Reduced margin */
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        border-left: 2px solid transparent;
      }
      
      .history-item:hover {
        background-color: var(--light-hover);
        border-left-color: var(--light-accent);
      }
      
      .dark-theme .history-item:hover {
        background-color: var(--dark-hover);
        border-left-color: var(--dark-accent);
      }
      
      /* Loading state for history items */
      .history-item.loading {
        border-left-color: var(--light-accent);
        background-color: var(--light-hover);
        pointer-events: none;
      }
      
      .dark-theme .history-item.loading {
        border-left-color: var(--dark-accent);
        background-color: var(--dark-hover);
      }
      
      .history-item.loading .history-item-icon i {
        animation: spin 1.2s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .history-item-icon {
        width: 30px; /* Smaller icon */
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(49, 130, 206, 0.1);
        border-radius: 6px;
        margin-right: 10px;
        flex-shrink: 0;
        transition: all 0.2s ease;
      }
      
      .dark-theme .history-item-icon {
        background-color: rgba(49, 130, 206, 0.2);
      }
      
      .history-item-icon i {
        font-size: 14px; /* Smaller icon */
        color: var(--light-accent);
      }
      
      .dark-theme .history-item-icon i {
        color: var(--dark-accent);
      }
      
      .history-item-details {
        flex: 1;
        overflow: hidden;
      }
      
      .history-item-name {
        font-weight: 500;
        font-size: 13px; /* Smaller font */
        margin-bottom: 2px; /* Less spacing */
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .history-item-info {
        font-size: 11px; /* Smaller font */
        color: var(--light-text-secondary);
        display: flex;
        gap: 10px;
      }
      
      .dark-theme .history-item-info {
        color: var(--dark-text-secondary);
      }
      
      .history-item-info span {
        display: flex;
        align-items: center;
        gap: 3px;
      }
      
      .history-item-info span i {
        font-size: 10px;
        opacity: 0.7;
      }
      
      .history-item-remove {
        background: none;
        border: none;
        width: 22px; /* Smaller button */
        height: 22px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: var(--light-text-secondary);
        opacity: 0;
        transition: all 0.2s ease;
      }
      
      .history-item:hover .history-item-remove {
        opacity: 0.8;
      }
      
      .history-item-remove:hover {
        opacity: 1 !important;
        background-color: rgba(229, 62, 62, 0.1);
        color: #e53e3e;
      }
      
      .dark-theme .history-item-remove:hover {
        background-color: rgba(245, 101, 101, 0.2);
        color: #f56565;
      }
      
      .history-empty {
        padding: 20px 10px; /* Less padding */
        text-align: center;
        color: var(--light-text-secondary);
        font-style: italic;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        font-size: 12px; /* Smaller font */
      }
      
      .dark-theme .history-empty {
        color: var(--dark-text-secondary);
      }
      
      .history-empty i {
        font-size: 16px; /* Smaller icon */
        opacity: 0.5;
        margin-bottom: 4px;
      }
    `;
    document.head.appendChild(historyStyles);
  }
}