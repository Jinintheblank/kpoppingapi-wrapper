document.addEventListener('DOMContentLoaded', function() {
  // Load saved settings
  chrome.storage.sync.get({
    showLyrics: true,
    showContext: true,
    showRecommendations: true
  }, function(items) {
    document.getElementById('showLyrics').checked = items.showLyrics;
    document.getElementById('showContext').checked = items.showContext;
    document.getElementById('showRecommendations').checked = items.showRecommendations;
  });

  // Save settings when changed
  document.getElementById('showLyrics').addEventListener('change', function(e) {
    chrome.storage.sync.set({ showLyrics: e.target.checked });
    updateContentScript();
  });

  document.getElementById('showContext').addEventListener('change', function(e) {
    chrome.storage.sync.set({ showContext: e.target.checked });
    updateContentScript();
  });

  document.getElementById('showRecommendations').addEventListener('change', function(e) {
    chrome.storage.sync.set({ showRecommendations: e.target.checked });
    updateContentScript();
  });

  document.getElementById('togglePanel').addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'togglePanel' });
    });
  });

  // Update current video information
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'getVideoInfo' }, function(response) {
      if (response && response.videoInfo) {
        document.getElementById('videoInfo').innerHTML = `
          <p><strong>Artist:</strong> ${response.videoInfo.artist}</p>
          <p><strong>Title:</strong> ${response.videoInfo.title}</p>
        `;
      }
    });
  });
});

function updateContentScript() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'updateSettings' });
  });
}