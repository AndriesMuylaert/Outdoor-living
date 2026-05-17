/**
 * Renson Camarque Pergola Card
 * A custom Home Assistant Lovelace card for the Renson Camarque pergola
 * via the OverKiz integration.
 *
 * GitHub: https://github.com/AndriesMuylaert/Outdoor-living
 * Version: 1.0.1
 */

const CARD_VERSION = '1.0.1';

// Tilt % → visual open angle (0 = closed/flat, 100 = fully open/vertical)
function tiltToAngle(pct) {
  // 0% = louvres horizontal (closed), 100% = louvres near-vertical (open)
  return (pct / 100) * 75; // max 75deg rotation
}

// Map raw HA cover position to display %
// HA: 0=closed, 100=open  →  we show as-is
function coverPct(stateObj) {
  if (!stateObj) return 0;
  const pos = stateObj.attributes.current_position;
  if (pos !== undefined) return Math.round(pos);
  if (stateObj.state === 'open') return 100;
  if (stateObj.state === 'closed') return 0;
  return 0;
}

function tiltPct(stateObj) {
  if (!stateObj) return 0;
  const pos = stateObj.attributes.current_tilt_position;
  if (pos !== undefined) return Math.round(pos);
  if (stateObj.state === 'open') return 100;
  if (stateObj.state === 'closed') return 0;
  return 0;
}

function snapPct(val) {
  const snaps = [0, 25, 50, 75, 100];
  return snaps.reduce((prev, curr) =>
    Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev
  );
}

class RensonPergolaCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass = null;
    this._config = null;
  }

  setConfig(config) {
    if (!config) throw new Error('Invalid configuration');
    this._config = {
      roof_cover: config.roof_cover || 'cover.camargue_roof',
      screen_left: config.screen_left || 'cover.camargue_screen_left',
      screen_right: config.screen_right || 'cover.camargue_screen_right',
      led_left: config.led_left || 'light.camargue_led_left',
      led_right: config.led_right || 'light.camargue_led_right',
      name: config.name || 'Renson Camargue',
      ...config,
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _callService(domain, service, entityId, extraData = {}) {
    if (!this._hass) return;
    this._hass.callService(domain, service, {
      entity_id: entityId,
      ...extraData,
    });
  }

  _render() {
    if (!this._config) return;

    const hass = this._hass;
    const cfg = this._config;

    // Gather states
    const roofObj = hass?.states[cfg.roof_cover];
    const screenLObj = hass?.states[cfg.screen_left];
    const screenRObj = hass?.states[cfg.screen_right];
    const ledLObj = hass?.states[cfg.led_left];
    const ledRObj = hass?.states[cfg.led_right];

    const roofPct = tiltPct(roofObj);
    const screenLPct = coverPct(screenLObj);
    const screenRPct = coverPct(screenRObj);
    const ledLOn = ledLObj?.state === 'on';
    const ledROn = ledRObj?.state === 'on';

    const roofSnap = snapPct(roofPct);
    const screenLSnap = snapPct(screenLPct);
    const screenRSnap = snapPct(screenRPct);

    // Louvre angle for SVG
    const louvreAngle = tiltToAngle(roofPct);

    // Reusable Somfy-style "my" button SVG icon
    const myButtonIcon = `
      <svg viewBox="0 0 24 24" class="somfy-my-icon">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" />
        <text x="12" y="15.5" font-family="'DM Sans', sans-serif" font-weight="800" font-size="10.5" text-anchor="middle" fill="currentColor">my</text>
      </svg>
    `;

    this.shadowRoot.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;800&family=DM+Mono:wght@400;500&display=swap');

        :host {
          display: block;
          --bg: #1a1d21;
          --surface: #22262c;
          --surface2: #2a2f38;
          --border: #353b45;
          --accent: #4fc3f7;
          --accent2: #ffd54f;
          --text: #e8eaed;
          --text-muted: #7a8694;
          --green: #69f0ae;
          --red: #ef5350;
          --louvre-color: #b0bec5;
          --frame-color: #78909c;
          --screen-color: #263238;
          font-family: 'DM Sans', sans-serif;
        }

        .card {
          background: var(--bg);
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid var(--border);
          color: var(--text);
          user-select: none;
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px 12px;
          border-bottom: 1px solid var(--border);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .header-icon {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, var(--accent), #0288d1);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header-icon svg {
          width: 18px;
          height: 18px;
          fill: white;
        }

        .card-title {
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.2px;
        }

        .card-subtitle {
          font-size: 11px;
          color: var(--text-muted);
          font-family: 'DM Mono', monospace;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--green);
          box-shadow: 0 0 6px var(--green);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        /* SVG Pergola Viewport */
        .pergola-viewport {
          padding: 16px 20px 8px;
          display: flex;
          justify-content: center;
        }

        .pergola-svg {
          width: 100%;
          max-width: 420px;
          height: auto;
        }

        /* Controls grid */
        .controls {
          padding: 8px 16px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .control-row {
          background: var(--surface);
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid var(--border);
          transition: border-color 0.2s;
        }

        /* Responsive / Compact row configuration */
        .control-row.compact {
          flex-direction: column;
          align-items: stretch;
          gap: 8px;
          padding: 10px 12px;
        }

        .control-row.compact .ctrl-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .control-row:hover {
          border-color: var(--accent);
        }

        .ctrl-icon {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: var(--surface2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .ctrl-icon svg {
          width: 18px;
          height: 18px;
        }

        .ctrl-info {
          flex: 1;
          min-width: 0;
        }

        .ctrl-label {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 4px;
        }

        .ctrl-pct {
          font-size: 20px;
          font-weight: 600;
          font-family: 'DM Mono', monospace;
          line-height: 1;
        }

        .pct-bar-wrap {
          width: 100%;
          height: 4px;
          background: var(--surface2);
          border-radius: 2px;
          margin-top: 5px;
        }

        .pct-bar {
          height: 100%;
          border-radius: 2px;
          background: linear-gradient(90deg, var(--accent), #0288d1);
          transition: width 0.5s ease;
        }

        .ctrl-btns {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }

        .control-row.compact .ctrl-btns {
          justify-content: space-between;
          margin-top: 2px;
        }

        .control-row.compact .ctrl-btns button {
          flex: 1;
          height: 30px;
        }

        button {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--surface2);
          color: var(--text);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, border-color 0.15s, transform 0.1s;
          padding: 0;
        }

        button:hover {
          background: var(--accent);
          border-color: var(--accent);
          color: #000;
          transform: scale(1.08);
        }

        button:active {
          transform: scale(0.95);
        }

        button svg {
          width: 14px;
          height: 14px;
          fill: currentColor;
        }
        
        button svg.somfy-my-icon {
          width: 18px;
          height: 18px;
        }

        /* Light toggle rows */
        .light-row {
          background: var(--surface);
          border-radius: 12px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid var(--border);
          transition: border-color 0.2s;
        }

        .light-row.on {
          border-color: var(--accent2);
        }

        .light-icon {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.3s;
        }

        .light-icon.on {
          background: rgba(255,213,79,0.15);
        }

        .light-icon.off {
          background: var(--surface2);
        }

        .light-icon svg {
          width: 18px;
          height: 18px;
        }

        .light-label {
          flex: 1;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        .light-state {
          font-size: 12px;
          font-weight: 600;
          font-family: 'DM Mono', monospace;
        }

        .light-state.on { color: var(--accent2); }
        .light-state.off { color: var(--text-muted); }

        .toggle {
          width: 44px;
          height: 24px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          position: relative;
          transition: background 0.3s;
          flex-shrink: 0;
        }

        .toggle.on { background: var(--accent2); }
        .toggle.off { background: var(--surface2); border: 1px solid var(--border); }

        .toggle::after {
          content: '';
          position: absolute;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          top: 3px;
          transition: left 0.3s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.4);
        }

        .toggle.on::after { left: 23px; }
        .toggle.off::after { left: 3px; }

        .toggle:hover { transform: scale(1.05); }
        .toggle:active { transform: scale(0.97); }

        .two-column-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .section-label {
          font-size: 10px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 0 4px 4px;
        }
      </style>

      <div class="card">
        <div class="header">
          <div class="header-left">
            <div class="header-icon">
              <svg viewBox="0 0 24 24"><path d="M3 13h1v7c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-4h4v4c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-7h1c.55 0 1-.45 1-1 0-.28-.11-.53-.29-.71L12 3 3.29 11.29C3.11 11.47 3 11.72 3 12c0 .55.45 1 1 1z"/></svg>
            </div>
            <div>
              <div class="card-title">${cfg.name}</div>
              <div class="card-subtitle">Renson Camarque · OverKiz</div>
            </div>
          </div>
          <div class="status-dot" title="Connected"></div>
        </div>

        <div class="pergola-viewport">
          ${this._renderPergolaSVG(roofPct, screenLPct, screenRPct, ledLOn, ledROn)}
        </div>

        <div class="controls">
          <div class="section-label">Roof</div>

          <div class="control-row compact">
            <div class="ctrl-header">
              <div class="ctrl-icon">
                <svg viewBox="0 0 24 24" fill="${roofPct > 0 ? 'var(--accent)' : 'var(--text-muted)'}">
                  <path d="M3 13h1v7c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-4h4v4c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-7h1c.55 0 1-.45 1-1 0-.28-.11-.53-.29-.71L12 3 3.29 11.29C3.11 11.47 3 11.72 3 12c0 .55.45 1 1 1z"/>
                </svg>
              </div>
              <div class="ctrl-info">
                <div class="ctrl-label">Roof</div>
                <div class="ctrl-pct" style="color:var(--accent)">${roofPct}<span style="font-size:12px;color:var(--text-muted)">%</span></div>
              </div>
            </div>
            <div class="pct-bar-wrap"><div class="pct-bar" style="width:${roofPct}%"></div></div>
            <div class="ctrl-btns">
              <button title="Open (tilt)" id="roof-open">
                <svg viewBox="0 0 24 24"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>
              </button>
              <button title="Stop (My)" id="roof-stop">
                ${myButtonIcon}
              </button>
              <button title="Close (tilt)" id="roof-close">
                <svg viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>
              </button>
            </div>
          </div>

          <div class="section-label" style="margin-top:4px">Screens</div>

          <div class="two-column-grid">
            <div class="control-row compact">
              <div class="ctrl-header">
                <div class="ctrl-icon">
                  <svg viewBox="0 0 24 24" fill="${screenLPct > 0 ? 'var(--accent)' : 'var(--text-muted)'}">
                    <path d="M20 3H4c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1h16c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1zM4 21h4l1.5-1.5L8 18H4v-5H2v8c0 .55.45 1 1 1zm16 0c.55 0 1-.45 1-1v-8h-2v5h-4l-1.5 1.5L14 21h6z"/>
                  </svg>
                </div>
                <div class="ctrl-info">
                  <div class="ctrl-label">Screen Left</div>
                  <div class="ctrl-pct" style="color:var(--accent)">${screenLPct}<span style="font-size:12px;color:var(--text-muted)">%</span></div>
                </div>
              </div>
              <div class="pct-bar-wrap"><div class="pct-bar" style="width:${screenLPct}%"></div></div>
              <div class="ctrl-btns">
                <button title="Close screen" id="scr-l-close">
                  <svg viewBox="0 0 24 24"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>
                </button>
                <button title="Stop (My)" id="scr-l-stop">
                  ${myButtonIcon}
                </button>
                <button title="Open screen" id="scr-l-open">
                  <svg viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>
                </button>
              </div>
            </div>

            <div class="control-row compact">
              <div class="ctrl-header">
                <div class="ctrl-icon">
                  <svg viewBox="0 0 24 24" fill="${screenRPct > 0 ? 'var(--accent)' : 'var(--text-muted)'}">
                    <path d="M20 3H4c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1h16c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1zM4 21h4l1.5-1.5L8 18H4v-5H2v8c0 .55.45 1 1 1zm16 0c.55 0 1-.45 1-1v-8h-2v5h-4l-1.5 1.5L14 21h6z"/>
                  </svg>
                </div>
                <div class="ctrl-info">
                  <div class="ctrl-label">Screen Right</div>
                  <div class="ctrl-pct" style="color:var(--accent)">${screenRPct}<span style="font-size:12px;color:var(--text-muted)">%</span></div>
                </div>
              </div>
              <div class="pct-bar-wrap"><div class="pct-bar" style="width:${screenRPct}%"></div></div>
              <div class="ctrl-btns">
                <button title="Close screen" id="scr-r-close">
                  <svg viewBox="0 0 24 24"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>
                </button>
                <button title="Stop (My)" id="scr-r-stop">
                  ${myButtonIcon}
                </button>
                <button title="Open screen" id="scr-r-open">
                  <svg viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>
                </button>
              </div>
            </div>
          </div>

          <div class="section-label" style="margin-top:4px">Lighting</div>

          <div class="two-column-grid">
            <div class="light-row ${ledLOn ? 'on' : 'off'}">
              <div class="light-icon ${ledLOn ? 'on' : 'off'}">
                <svg viewBox="0 0 24 24" fill="${ledLOn ? 'var(--accent2)' : 'var(--text-muted)'}">
                  <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/>
                </svg>
              </div>
              <div class="ctrl-info">
                <div class="ctrl-label">LED Left</div>
                <div class="light-state ${ledLOn ? 'on' : 'off'}">${ledLOn ? 'ON' : 'OFF'}</div>
              </div>
              <button class="toggle ${ledLOn ? 'on' : 'off'}" id="led-l-toggle" title="Toggle LED Left"></button>
            </div>

            <div class="light-row ${ledROn ? 'on' : 'off'}">
              <div class="light-icon ${ledROn ? 'on' : 'off'}">
                <svg viewBox="0 0 24 24" fill="${ledROn ? 'var(--accent2)' : 'var(--text-muted)'}">
                  <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/>
                </svg>
              </div>
              <div class="ctrl-info">
                <div class="ctrl-label">LED Right</div>
                <div class="light-state ${ledROn ? 'on' : 'off'}">${ledROn ? 'ON' : 'OFF'}</div>
              </div>
              <button class="toggle ${ledROn ? 'on' : 'off'}" id="led-r-toggle" title="Toggle LED Right"></button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Wire up buttons
    this._bindButtons();
  }

  _renderPergolaSVG(roofPct, screenLPct, screenRPct, ledLOn, ledROn) {
    const louvreAngle = tiltToAngle(roofPct);
    const numLouvres = 14;
    const louvreSpacing = 22;

    // Screen drop calculation
    const screenH = 90; 
    const screenLH = (screenLPct / 100) * screenH;
    const screenRH = (screenRPct / 100) * screenH;

    // Total width spanning between the outer columns is 290px (from X=54 to X=344)
    // Left Screen (2/3 width) = 193px. Right Screen (1/3 width) = 97px.
    const leftScreenWidth = 193;
    const rightScreenWidth = 97;
    const middleColumnX = 54 + leftScreenWidth; // X = 247

    // Build louvres
    let louvres = '';
    for (let i = 0; i < numLouvres; i++) {
      const x = 52 + i * louvreSpacing;
      const cy = 62;
      const w = 20;
      const h = 6;
      louvres += `
        <rect
          x="${x - w / 2}" y="${cy - h / 2}"
          width="${w}" height="${h}"
          rx="1"
          fill="#c8d0d8"
          stroke="#a0aab4"
          stroke-width="0.5"
          transform="rotate(${-louvreAngle}, ${x}, ${cy})"
        />`;
    }

    // LED panel glow
    const ledLGlow = ledLOn
      ? `<rect x="115" y="48" width="65" height="6" rx="3" fill="rgba(255,213,79,0.7)" filter="url(#glow)"/>`
      : `<rect x="115" y="48" width="65" height="6" rx="3" fill="#263238" opacity="0.6"/>`;
    const ledRGlow = ledROn
      ? `<rect x="215" y="48" width="65" height="6" rx="3" fill="rgba(255,213,79,0.7)" filter="url(#glow)"/>`
      : `<rect x="215" y="48" width="65" height="6" rx="3" fill="#263238" opacity="0.6"/>`;

    return `
    <svg class="pergola-svg" viewBox="0 0 420 260" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="shadow" x="-10%" y="-10%" width="130%" height="160%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity="0.4"/>
        </filter>
        <linearGradient id="frameGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#9db0be"/>
          <stop offset="100%" stop-color="#6b8091"/>
        </linearGradient>
        <linearGradient id="roofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#d0d8e0"/>
          <stop offset="100%" stop-color="#a8b8c4"/>
        </linearGradient>
        <clipPath id="louvreClip">
          <rect x="42" y="42" width="336" height="42"/>
        </clipPath>
      </defs>

      <ellipse cx="210" cy="252" rx="170" ry="8" fill="rgba(0,0,0,0.25)"/>

      <rect x="42" y="98" width="12" height="148" rx="2" fill="url(#frameGrad)" filter="url(#shadow)"/>
      <rect x="366" y="98" width="12" height="148" rx="2" fill="url(#frameGrad)" filter="url(#shadow)"/>
      
      <rect x="${middleColumnX}" y="98" width="12" height="148" rx="2" fill="url(#frameGrad)"/>

      <rect x="42" y="236" width="336" height="10" rx="2" fill="url(#frameGrad)"/>
      <rect x="42" y="95" width="336" height="10" rx="2" fill="url(#frameGrad)"/>

      <rect x="54" y="100" width="${leftScreenWidth}" height="90" fill="#1a2025" rx="0"/>
      <rect x="54" y="100" width="${leftScreenWidth}" height="${screenLH}" fill="#263238" rx="0"/>
      <rect x="54" y="${100 + screenLH - 3}" width="${leftScreenWidth}" height="3" fill="#37474f"/>

      <rect x="${middleColumnX + 12}" y="100" width="${rightScreenWidth}" height="90" fill="#1a2025" rx="0"/>
      <rect x="${middleColumnX + 12}" y="100" width="${rightScreenWidth}" height="${screenRH}" fill="#263238" rx="0"/>
      <rect x="${middleColumnX + 12}" y="${100 + screenRH - 3}" width="${rightScreenWidth}" height="3" fill="#37474f"/>

      <rect x="36" y="38" width="348" height="12" rx="3" fill="url(#frameGrad)" filter="url(#shadow)"/>
      <rect x="36" y="88" width="348" height="10" rx="3" fill="url(#frameGrad)"/>
      <rect x="36" y="38" width="10" height="60" rx="2" fill="#7a90a0"/>
      <rect x="374" y="38" width="10" height="60" rx="2" fill="#7a90a0"/>

      <g clip-path="url(#louvreClip)">
        ${louvres}
      </g>

      ${ledLGlow}
      ${ledRGlow}

      <circle cx="148" cy="43" r="3.5" fill="${ledLOn ? '#ffd54f' : '#263238'}" ${ledLOn ? 'filter="url(#glow)"' : ''}/>
      <circle cx="272" cy="43" r="3.5" fill="${ledROn ? '#ffd54f' : '#263238'}" ${ledROn ? 'filter="url(#glow)"' : ''}/>

      ${screenLPct > 0 ? `<text x="${54 + (leftScreenWidth / 2)}" y="${100 + screenLH - 8}" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="10" font-family="DM Mono, monospace">${screenLPct}%</text>` : ''}
      ${screenRPct > 0 ? `<text x="${(middleColumnX + 12) + (rightScreenWidth / 2)}" y="${100 + screenRH - 8}" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="10" font-family="DM Mono, monospace">${screenRPct}%</text>` : ''}

      <text x="210" y="82" text-anchor="middle" fill="rgba(255,255,255,0.35)" font-size="9" font-family="DM Mono, monospace">${roofPct}% tilt</text>
    </svg>`;
  }

  _bindButtons() {
    const sr = this.shadowRoot;
    const cfg = this._config;

    // Roof controls
    sr.getElementById('roof-open')?.addEventListener('click', () => {
      this._callService('cover', 'open_cover_tilt', cfg.roof_cover);
    });
    sr.getElementById('roof-stop')?.addEventListener('click', () => {
      this._callService('cover', 'stop_cover_tilt', cfg.roof_cover);
    });
    sr.getElementById('roof-close')?.addEventListener('click', () => {
      this._callService('cover', 'close_cover_tilt', cfg.roof_cover);
    });

    // Screen Left
    sr.getElementById('scr-l-open')?.addEventListener('click', () => {
      this._callService('cover', 'open_cover', cfg.screen_left);
    });
    sr.getElementById('scr-l-stop')?.addEventListener('click', () => {
      this._callService('cover', 'stop_cover', cfg.screen_left);
    });
    sr.getElementById('scr-l-close')?.addEventListener('click', () => {
      this._callService('cover', 'close_cover', cfg.screen_left);
    });

    // Screen Right
    sr.getElementById('scr-r-open')?.addEventListener('click', () => {
      this._callService('cover', 'open_cover', cfg.screen_right);
    });
    sr.getElementById('scr-r-stop')?.addEventListener('click', () => {
      this._callService('cover', 'stop_cover', cfg.screen_right);
    });
    sr.getElementById('scr-r-close')?.addEventListener('click', () => {
      this._callService('cover', 'close_cover', cfg.screen_right);
    });

    // LEDs
    sr.getElementById('led-l-toggle')?.addEventListener('click', () => {
      const on = this._hass?.states[cfg.led_left]?.state === 'on';
      this._callService('light', on ? 'turn_off' : 'turn_on', cfg.led_left);
    });
    sr.getElementById('led-r-toggle')?.addEventListener('click', () => {
      const on = this._hass?.states[cfg.led_right]?.state === 'on';
      this._callService('light', on ? 'turn_off' : 'turn_on', cfg.led_right);
    });
  }

  static getConfigElement() {
    return document.createElement('renson-pergola-card-editor');
  }

  static getStubConfig() {
    return {
      name: 'Pergola',
      roof_cover: 'cover.pergola_roof',
      screen_left: 'cover.pergola_screen_left',
      screen_right: 'cover.pergola_screen_right',
      led_left: 'light.pergola_led_left',
      led_right: 'light.pergola_led_right',
    };
  }

  getCardSize() { return 6; }
}

customElements.define('renson-pergola-card', RensonPergolaCard);

// Register with Home Assistant custom cards registry
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'renson-pergola-card',
  name: 'Renson Pergola Card',
  description: 'Control card for the Renson Camarque pergola via OverKiz.',
  preview: true,
  documentationURL: 'https://github.com/AndriesMuylaert/Outdoor-living',
});

console.info(
  `%c RENSON-PERGOLA-CARD %c v${CARD_VERSION} `,
  'background:#4fc3f7;color:#000;font-weight:bold;padding:2px 6px;border-radius:4px 0 0 4px',
  'background:#1a1d21;color:#4fc3f7;font-weight:bold;padding:2px 6px;border-radius:0 4px 4px 0'
);