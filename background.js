import KpoppingApi from './kpoppingapi.js';

const api = new KpoppingApi();

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('youtube.com/watch')) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getArtistInfo') {
    api.getProfileData(request.artist)
      .then(data => {
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Required for async response
  }

  if (request.action === 'getArtistImages') {
    api.getIdolpics(request.artist)
      .then(data => {
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});