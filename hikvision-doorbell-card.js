/**
 * Hikvision Doorbell WebRTC Card
 *
 * A custom Lovelace card for two-way audio communication with Hikvision doorbells
 * using WebRTC for real-time, bidirectional audio streaming.
 */

class HikvisionDoorbellCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.peerConnection = null;
    this.isPeerConnected = false;
    this.localStream = null;
    this._streamInitialized = false;
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('You need to define an entity');
    }
    this.config = config;
  }

  set hass(hass) {
    this._hass = hass;

    // Render on first hass set if not rendered yet
    if (!this.shadowRoot.querySelector('.camera-container')) {
      this.render();
    } else {
      // Just update the camera card's hass without re-rendering
      const cameraCard = this.shadowRoot.getElementById('camera-card');
      if (cameraCard) {
        cameraCard.hass = hass;
      }
    }

    // Update button state based on connection status
    if (this.shadowRoot) {
      const button = this.shadowRoot.querySelector('.talk-button');
      const icon = button?.querySelector('ha-icon');
      const status = this.shadowRoot.querySelector('.status');

      if (button && icon && status) {
        if (this.isPeerConnected) {
          icon.setAttribute('icon', 'mdi:phone-hangup');
          button.classList.add('connected');
          status.textContent = 'Speaking';
          status.classList.add('connected');
        } else {
          icon.setAttribute('icon', 'mdi:microphone');
          button.classList.remove('connected');
          status.textContent = 'Ready';
          status.classList.remove('connected');
        }
      }
    }
  }

  render() {
    if (!this._hass || !this.config) return;

    const entityState = this._hass.states[this.config.entity];
    const name = this.config.name || entityState?.attributes?.friendly_name || 'Doorbell';
    const serverUrl = entityState?.attributes?.server_url || 'http://localhost:8080';
    const cameraEntity = this.config.entity;

    this.shadowRoot.innerHTML = `
      <style>
        ha-card {
          padding: 0;
          overflow: hidden;
        }
        .camera-container {
          position: relative;
          width: 100%;
          background: #000;
        }
        #camera-card {
          width: 100%;
          display: block;
        }
        #camera-placeholder {
          width: 100%;
          min-height: 200px;
        }
        .camera-image {
          width: 100%;
          display: block;
          min-height: 200px;
        }
        .controls-overlay {
          position: absolute;
          bottom: 4px;
          left: 0;
          right: 0;
          display: flex;
          flex-direction: column-reverse;
          align-items: center;
          gap: 4px;
          pointer-events: none;
        }
        .talk-button {
          background-color: var(--primary-color);
          color: var(--text-primary-color);
          border: none;
          border-radius: 50%;
          width: 48px;
          height: 48px;
          font-size: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          pointer-events: auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .talk-button:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0,0,0,0.6);
        }
        .talk-button:active {
          transform: scale(0.95);
        }
        .talk-button.connected {
          background-color: var(--error-color);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .status {
          font-size: 12px;
          color: white;
          font-weight: 500;
          text-shadow: 0 1px 3px rgba(0,0,0,0.8);
        }
        .status.connected {
          color: var(--error-color);
        }
        .error {
          color: var(--error-color);
          font-size: 11px;
          text-align: center;
          background: rgba(0,0,0,0.9);
          padding: 4px 8px;
          border-radius: 4px;
        }
      </style>
      <ha-card>
        <div class="camera-container">
          <advanced-camera-card id="camera-card"></advanced-camera-card>
          <div class="controls-overlay">
            <button class="talk-button">
              <ha-icon icon="mdi:microphone"></ha-icon>
            </button>
            <div class="status">Ready</div>
            <div class="error"></div>
          </div>
        </div>
      </ha-card>
    `;

    // Configure the advanced camera card after it's ready
    if (cameraEntity) {
      const frigateUrl = entityState?.attributes?.frigate_url;
      const cameraName = entityState?.attributes?.camera_name;

      if (frigateUrl && cameraName) {
        // Wait for the element to be defined and then configure it
        customElements.whenDefined('advanced-camera-card').then(() => {
          const cameraCard = this.shadowRoot.getElementById('camera-card');

          // Wait for the element to be fully upgraded and ready
          if (cameraCard) {
            const configureCard = () => {
              if (typeof cameraCard.setConfig === 'function') {
                // Use the Frigate camera entity (camera.citofono, camera.giardino, etc)
                const frigateCameraEntity = `camera.${cameraName}`;

                // Configure camera card with the Frigate camera entity
                const cardConfig = {
              type: 'custom:advanced-camera-card',
              cameras: [
                {
                  camera_entity: frigateCameraEntity,
                  live_provider: 'go2rtc',
                  image: {
                    refresh_seconds: 1
                  },
                  dimensions: {
                    aspect_ratio: '16:9',
                    layout: {
                      fit: 'fill'
                    }
                  }
                }
              ],
              status_bar: {
                style: 'none'
              },
              profiles: ['low-performance'],
              live: {
                controls: {
                  builtin: false
                },
                show_image_during_load: true
              },
              menu: {
                style: 'overlay',
                position: 'bottom',
                buttons: {
                  microphone: {
                    enabled: false
                  },
                  frigate: {
                    enabled: false
                  },
                  cameras: {
                    enabled: false
                  },
                  substreams: {
                    enabled: false
                  },
                  live: {
                    enabled: false
                  },
                  clips: {
                    enabled: false
                  },
                  snapshots: {
                    enabled: false
                  },
                  download: {
                    enabled: false
                  },
                  camera_ui: {
                    enabled: false
                  },
                  fullscreen: {
                    enabled: false
                  },
                  timeline: {
                    enabled: false
                  },
                  media_player: {
                    enabled: false
                  },
                  mute: {
                    enabled: false
                  }
                }
              }
            };

            // Pass through elements configuration if provided
            if (this.config.elements) {
              cardConfig.elements = this.config.elements;
            }

                cameraCard.setConfig(cardConfig);
                cameraCard.hass = this._hass;
              } else {
                // Element not ready yet, wait for it
                requestAnimationFrame(configureCard);
              }
            };

            // Start configuring
            configureCard();
          }
        });
      }
    }

    const button = this.shadowRoot.querySelector('.talk-button');
    button.addEventListener('click', () => this.toggleAudio(serverUrl));
  }

  disconnectedCallback() {
    // Cleanup if needed
    this._streamInitialized = false;
  }

  async toggleAudio(serverUrl) {
    if (this.isPeerConnected) {
      this.stopAudio();
    } else {
      await this.startAudio(serverUrl);
    }
  }

  async startAudio(serverUrl) {
    const errorDiv = this.shadowRoot.querySelector('.error');
    const statusDiv = this.shadowRoot.querySelector('.status');

    try {
      errorDiv.textContent = '';
      statusDiv.textContent = 'Requesting microphone access...';

      // Get microphone access
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 8000,
          channelCount: 1
        }
      });

      statusDiv.textContent = 'Setting up WebRTC connection...';

      // Create peer connection
      this.peerConnection = new RTCPeerConnection({
        iceServers: [] // Local network only
      });

      // Add local audio track
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      // Handle incoming audio (from doorbell)
      this.peerConnection.ontrack = (event) => {
        console.log('[WebRTC] Received audio track from doorbell');
        const remoteAudio = new Audio();
        remoteAudio.srcObject = event.streams[0];
        remoteAudio.play();
      };

      // Handle ICE connection state
      this.peerConnection.oniceconnectionstatechange = () => {
        console.log('[WebRTC] ICE connection state:', this.peerConnection.iceConnectionState);

        if (this.peerConnection.iceConnectionState === 'connected') {
          statusDiv.textContent = 'Connected - Speaking';
          statusDiv.classList.add('connected');
        } else if (this.peerConnection.iceConnectionState === 'failed' ||
                   this.peerConnection.iceConnectionState === 'disconnected' ||
                   this.peerConnection.iceConnectionState === 'closed') {
          this.stopAudio();
          errorDiv.textContent = 'Connection lost';
        }
      };

      // Wait for ICE gathering
      statusDiv.textContent = 'Gathering connection candidates...';

      await new Promise((resolve) => {
        this.peerConnection.onicegatheringstatechange = () => {
          console.log('[WebRTC] ICE gathering state:', this.peerConnection.iceGatheringState);
          if (this.peerConnection.iceGatheringState === 'complete') {
            resolve();
          }
        };

        // Create and set offer
        this.peerConnection.createOffer().then(offer => {
          return this.peerConnection.setLocalDescription(offer);
        });
      });

      // Send offer to server
      statusDiv.textContent = 'Connecting to server...';

      const response = await fetch(`${serverUrl}/api/webrtc/offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.peerConnection.localDescription)
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${await response.text()}`);
      }

      const answer = await response.json();

      // Set remote description
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));

      this.isPeerConnected = true;
      statusDiv.textContent = 'Connecting...';

      // Update UI
      const button = this.shadowRoot.querySelector('.talk-button');
      const icon = button?.querySelector('ha-icon');
      if (icon) {
        icon.setAttribute('icon', 'mdi:phone-hangup');
      }
      button.classList.add('connected');

    } catch (error) {
      console.error('[WebRTC] Error starting audio:', error);
      errorDiv.textContent = `Error: ${error.message}`;
      statusDiv.textContent = 'Failed to connect';
      this.stopAudio();
    }
  }

  stopAudio() {
    const statusDiv = this.shadowRoot.querySelector('.status');

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    this.isPeerConnected = false;

    // Update UI
    const button = this.shadowRoot.querySelector('.talk-button');
    const icon = button?.querySelector('ha-icon');
    if (icon) {
      icon.setAttribute('icon', 'mdi:microphone');
    }
    button.classList.remove('connected');
    statusDiv.textContent = 'Ready';
    statusDiv.classList.remove('connected');
  }

  getCardSize() {
    return 3;
  }

  static getConfigElement() {
    return document.createElement('hikvision-doorbell-card-editor');
  }

  static getStubConfig() {
    return {
      entity: 'camera.doorbell',
      name: 'Doorbell'
    };
  }
}

// Card editor
class HikvisionDoorbellCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this.render();
  }

  render() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }

    this.shadowRoot.innerHTML = `
      <style>
        .card-config {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        ha-entity-picker {
          width: 100%;
        }
        paper-input {
          width: 100%;
        }
      </style>
      <div class="card-config">
        <ha-entity-picker
          label="Entity"
          .hass=${this._hass}
          .value=${this._config?.entity}
          .includeDomains=${['camera']}
          @value-changed=${this._valueChanged}
          .configValue=${'entity'}
        ></ha-entity-picker>
        <paper-input
          label="Name (optional)"
          .value=${this._config?.name || ''}
          .configValue=${'name'}
          @value-changed=${this._valueChanged}
        ></paper-input>
      </div>
    `;
  }

  _valueChanged(ev) {
    if (!this._config || !this._hass) {
      return;
    }
    const target = ev.target;
    const value = ev.detail?.value || target.value;

    if (this[`_${target.configValue}`] === value) {
      return;
    }

    this._config = {
      ...this._config,
      [target.configValue]: value
    };

    const event = new Event('config-changed', {
      bubbles: true,
      composed: true
    });
    event.detail = { config: this._config };
    this.dispatchEvent(event);
  }

  set hass(hass) {
    this._hass = hass;
  }
}

customElements.define('hikvision-doorbell-card', HikvisionDoorbellCard);
customElements.define('hikvision-doorbell-card-editor', HikvisionDoorbellCardEditor);

// Register the card
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'hikvision-doorbell-card',
  name: 'Hikvision Doorbell Card',
  description: 'Two-way audio communication with Hikvision doorbells via WebRTC',
  preview: false,
  documentationURL: 'https://github.com/acardace/hikvision-doorbell-integration'
});

console.info(
  `%c HIKVISION-DOORBELL-CARD %c v1.0.0 `,
  'color: white; background: #00a8e1; font-weight: bold;',
  'color: #00a8e1; background: white; font-weight: bold;'
);
