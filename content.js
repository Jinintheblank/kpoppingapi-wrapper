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

function createLyricsContainer() {
  const container = document.createElement('div');
  container.id = 'kpop-lyrics-container';
  container.style.display = 'none';
  document.body.appendChild(container);
  return container;
}

// Main functionality
class KpopEnhancer {
  constructor() {
    this.overlay = createOverlay();
    this.panel = createInfoPanel();
    this.lyricsContainer = createLyricsContainer();
    this.currentVideo = null;
    this.settings = {
      showLyrics: true,
      showContext: true,
      showRecommendations: true
    };
    this.artistImages = [];

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

    // Get artist information and images
    const [artistInfo, artistImages] = await Promise.all([
      this.getArtistInfo(videoInfo.artist),
      this.getArtistImages(videoInfo.artist)
    ]);

    if (artistInfo) {
      this.artistImages = artistImages?.data?.images || [];
      this.updateOverlay(artistInfo);
      this.updateInfoPanel(artistInfo);
      this.updateLyricsContainer(videoInfo);
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

  async getArtistImages(artist) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: 'getArtistImages', artist: artist },
        response => {
          resolve(response.success ? response : null);
        }
      );
    });
  }

  updateOverlay(artistInfo) {
    if (!this.settings.showContext) {
      this.overlay.style.display = 'none';
      return;
    }

    const imageHtml = this.artistImages.length > 0 
      ? `<div class="artist-images">
          <img src="${this.artistImages[0]}" alt="${artistInfo.IdolName || artistInfo.GroupName}" class="artist-image">
         </div>`
      : '';

    this.overlay.innerHTML = `
      <div class="kpop-context">
        <h3>${artistInfo.IdolName || artistInfo.GroupName}</h3>
        ${imageHtml}
        <div class="artist-info">
          <p>${artistInfo.Description || ''}</p>
          ${artistInfo.Group ? `<p class="group-info">Group: ${artistInfo.Group.Current}</p>` : ''}
          ${artistInfo.DebutDate ? `<p class="debut-info">Debut: ${artistInfo.DebutDate}</p>` : ''}
        </div>
      </div>
    `;
    this.overlay.style.display = 'block';
  }

  updateInfoPanel(artistInfo) {
    if (!this.settings.showRecommendations) {
      this.panel.style.display = 'none';
      return;
    }

    const membersList = artistInfo.Members 
      ? Object.values(artistInfo.Members).map(member => `
          <div class="member-info">
            <h4>${member.Name}</h4>
            <p>Position: ${member.Position}</p>
            <p>Birthday: ${member.Birthday}</p>
          </div>
        `).join('')
      : '';

    this.panel.innerHTML = `
      <div class="kpop-info-panel">
        <h2>${artistInfo.IdolName || artistInfo.GroupName}</h2>
        <div class="info-section">
          <h3>Profile</h3>
          <p>Debut: ${artistInfo.DebutDate || artistInfo.Debut || 'N/A'}</p>
          <p>Agency: ${artistInfo.Agencies?.Current || 'N/A'}</p>
          ${artistInfo.MBTI ? `<p>MBTI: ${artistInfo.MBTI}</p>` : ''}
          ${artistInfo.Birthday ? `<p>Birthday: ${artistInfo.Birthday}</p>` : ''}
          ${artistInfo.Height ? `<p>Height: ${artistInfo.Height}</p>` : ''}
        </div>
        ${membersList ? `
          <div class="info-section members-section">
            <h3>Members</h3>
            ${membersList}
          </div>
        ` : ''}
      </div>
    `;
  }

  updateLyricsContainer(videoInfo) {
    if (!this.settings.showLyrics) {
      this.lyricsContainer.style.display = 'none';
      return;
    }

    // Placeholder for future lyrics implementation
    this.lyricsContainer.innerHTML = `
      <div class="lyrics-wrapper">
        <div class="lyrics-line korean">
          <span class="placeholder">Korean lyrics will appear here</span>
        </div>
        <div class="lyrics-line english">
          <span class="placeholder">English translation will appear here</span>
        </div>
      </div>
    `;
    this.lyricsContainer.style.display = 'block';
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