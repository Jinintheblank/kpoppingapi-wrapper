// Utility functions
function createOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'kpop-enhancer-overlay';
  overlay.style.display = 'none';
  document.body.appendChild(overlay);
  return overlay;
}

function createInfoPanel() {
  const panel = document.createElement('div');
  panel.id = 'kpop-enhancer-panel';
  panel.style.display = 'none';
  document.body.appendChild(panel);
  return panel;
}

// Main functionality
class KpopEnhancer {
  constructor() {
    this.overlay = createOverlay();
    this.panel = createInfoPanel();
    this.currentVideo = null;
    this.settings = {
      showLyrics: true,
      showContext: true,
      showRecommendations: true
    };

    this.initialize();
  }

  async initialize() {
    // Load settings
    const settings = await chrome.storage.sync.get({
      showLyrics: true,
      showContext: true,
      showRecommendations: true
    });
    this.settings = settings;

    // Set up observers
    this.setupVideoObserver();
    this.setupMessageListener();
  }

  setupVideoObserver() {
    const observer = new MutationObserver(() => {
      const video = document.querySelector('video');
      if (video && (!this.currentVideo || this.currentVideo !== video)) {
        this.currentVideo = video;
        this.onVideoChange();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case 'togglePanel':
          this.toggleInfoPanel();
          break;
        case 'updateSettings':
          this.updateSettings();
          break;
        case 'getVideoInfo':
          sendResponse({ videoInfo: this.getVideoInfo() });
          break;
      }
    });
  }

  async onVideoChange() {
    const videoInfo = this.getVideoInfo();
    if (!videoInfo) return;

    // Get artist information
    const artistInfo = await this.getArtistInfo(videoInfo.artist);
    if (artistInfo) {
      this.updateOverlay(artistInfo);
      this.updateInfoPanel(artistInfo);
    }
  }

  getVideoInfo() {
    const title = document.querySelector('h1.ytd-video-primary-info-renderer')?.textContent;
    if (!title) return null;

    // Simple pattern matching for K-pop video titles
    const match = title.match(/^(.+?)\s*[-–]\s*(.+)$/);
    if (match) {
      return {
        artist: match[1].trim(),
        title: match[2].trim()
      };
    }

    return null;
  }

  async getArtistInfo(artist) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: 'getArtistInfo', artist: artist },
        response => {
          resolve(response.success ? response.data : null);
        }
      );
    });
  }

  updateOverlay(artistInfo) {
    if (!this.settings.showContext) {
      this.overlay.style.display = 'none';
      return;
    }

    this.overlay.innerHTML = `
      <div class="kpop-context">
        <h3>${artistInfo.IdolName || artistInfo.GroupName}</h3>
        <p>${artistInfo.Description || ''}</p>
      </div>
    `;
    this.overlay.style.display = 'block';
  }

  updateInfoPanel(artistInfo) {
    if (!this.settings.showRecommendations) {
      this.panel.style.display = 'none';
      return;
    }

    this.panel.innerHTML = `
      <div class="kpop-info-panel">
        <h2>${artistInfo.IdolName || artistInfo.GroupName}</h2>
        <div class="info-section">
          <h3>Profile</h3>
          <p>Debut: ${artistInfo.DebutDate || 'N/A'}</p>
          <p>Agency: ${artistInfo.Agencies?.Current || 'N/A'}</p>
        </div>
      </div>
    `;
  }

  toggleInfoPanel() {
    const isVisible = this.panel.style.display === 'block';
    this.panel.style.display = isVisible ? 'none' : 'block';
  }

  async updateSettings() {
    const settings = await chrome.storage.sync.get({
      showLyrics: true,
      showContext: true,
      showRecommendations: true
    });
    this.settings = settings;
    this.onVideoChange();
  }
}

// Initialize the enhancer
new KpopEnhancer();