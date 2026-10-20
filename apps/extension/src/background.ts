// Background service worker for PILL extension
// Listens for external capture requests or keyboard shortcuts

chrome.runtime.onInstalled.addListener(() => {
  console.log('[PILL Extension] Installed successfully.');
});

// Message listener for popup or content scripts
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ status: 'PONG', version: '0.1.0' });
  }
  return true;
});
