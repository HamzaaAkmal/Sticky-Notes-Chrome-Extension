// background/background.js
console.log('Service Worker is running!');

// Import sync helper
importScripts('sync-helper.js');

// Initialize sync helper
const syncHelper = new SyncHelper();
syncHelper.init();

chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("pages/installed.html") });

  // Handle context menu creation
  let shortcutLabel = "Ctrl + Q"; // Default for Windows/Linux

  if (navigator.userAgentData) {
    const platform = navigator.userAgentData.platform;
    if (platform && platform.toLowerCase().includes("mac")) {
      shortcutLabel = "⌘ + Q";
    }
  } else {
    if (navigator.userAgent.toLowerCase().includes("mac")) {
      shortcutLabel = "⌘ + Q";
    }
  }

  chrome.contextMenus.create({
    id: "addStickyNote",
    title: `Create Sticky Note (${shortcutLabel})`,
    contexts: ["all"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "addStickyNote") {
    chrome.tabs.sendMessage(tab.id, { action: "createStickyNote" });
  }
});

// Listen for storage changes and trigger auto-sync
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    // Check if any URL-based notes were changed
    for (const [key, change] of Object.entries(changes)) {
      if (key.startsWith('http://') || key.startsWith('https://')) {
        // A note was added, updated, or deleted
        console.log('Note changed for URL:', key);
        
        // Schedule sync for this URL
        if (change.newValue !== undefined) {
          syncHelper.scheduleSync(key, change.newValue);
        } else {
          // Note was deleted, sync with empty array
          syncHelper.scheduleSync(key, []);
        }
      }
    }
  }
});

// Listen for messages from extension pages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'manualSync') {
    syncHelper.manualSync()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
});
