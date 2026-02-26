/* ═══════════════════════════════════════════════
   NEXUS — Sidebar Navigation
   Lucide SVG icons, responsive, auto-inject
   ═══════════════════════════════════════════════ */

(function () {
  // Detect project root for relative navigation (works with file:// protocol)
  const loc = window.location.pathname;
  const segments = loc.split('/');
  // Find the project folder (cot-data) in the path
  let base = './';
  const projIdx = segments.findIndex(s => s === 'cot-data');
  if (projIdx >= 0) {
    // How deep are we from project root? e.g. /cot-data/journal/index.html → depth 2
    const depth = segments.length - projIdx - 2; // subtract project folder and filename
    base = depth > 0 ? '../'.repeat(depth) : './';
  }

  const NAV_ITEMS = [
    { id: 'hub', label: 'NEXUS Hub', href: base + 'index.html', icon: SVG_ICONS.hexagon },
    { id: 'cot', label: 'COT Dashboard', href: base + 'cot/index.html', icon: SVG_ICONS.barChart },
    { id: 'bias', label: 'Daily Bias', href: base + 'bias/index.html', icon: SVG_ICONS.compass },
    { id: 'killzone', label: 'Kill Zone', href: base + 'killzone/index.html', icon: SVG_ICONS.clock },
    { id: 'journal', label: 'Trade Journal', href: base + 'journal/index.html', icon: SVG_ICONS.bookOpen },
    { id: 'performance', label: 'Performance', href: base + 'performance/index.html', icon: SVG_ICONS.trendingUp },
  ];

  // Detect active page
  const path = window.location.pathname;
  function isActive(item) {
    if (item.id === 'hub') return path.endsWith('/index.html') && !path.includes('/cot/') && !path.includes('/journal/') && !path.includes('/bias/') && !path.includes('/killzone/') && !path.includes('/performance/') && !path.includes('/settings/');
    return path.includes('/' + item.id + '/');
  }

  function buildSidebar() {
    const sidebar = document.createElement('nav');
    sidebar.className = 'nx-sidebar';
    sidebar.setAttribute('aria-label', 'NEXUS Navigation');

    // Logo
    const logo = document.createElement('div');
    logo.className = 'nx-sidebar-logo';
    logo.innerHTML = SVG_ICONS.hexagon;
    sidebar.appendChild(logo);

    // Nav items
    const list = document.createElement('ul');
    list.className = 'nx-sidebar-list';

    NAV_ITEMS.forEach(item => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.className = 'nx-sidebar-item' + (isActive(item) ? ' active' : '') + (item.disabled ? ' disabled' : '');
      a.href = item.disabled ? '#' : item.href;
      a.title = item.label;
      if (item.disabled) {
        a.setAttribute('aria-disabled', 'true');
        a.addEventListener('click', e => e.preventDefault());
      }
      a.innerHTML = `
        <span class="nx-sidebar-icon">${item.icon}</span>
        <span class="nx-sidebar-label">${item.label}</span>
      `;
      li.appendChild(a);
      list.appendChild(li);
    });

    sidebar.appendChild(list);

    // Settings at bottom
    const bottom = document.createElement('div');
    bottom.className = 'nx-sidebar-bottom';
    const settingsActive = path.includes('/settings/');
    bottom.innerHTML = `<a class="nx-sidebar-item${settingsActive ? ' active' : ''}" href="${base}settings/index.html" title="Settings">
      <span class="nx-sidebar-icon" style="position:relative">${SVG_ICONS.settings}<span class="nx-sync-dot" id="nxSyncDot"></span></span>
      <span class="nx-sidebar-label">Settings</span>
    </a>`;
    sidebar.appendChild(bottom);

    return sidebar;
  }

  function buildMobileBar() {
    const bar = document.createElement('nav');
    bar.className = 'nx-mobile-bar';
    bar.setAttribute('aria-label', 'NEXUS Navigation');

    NAV_ITEMS.filter(i => !i.disabled).forEach(item => {
      const a = document.createElement('a');
      a.className = 'nx-mobile-item' + (isActive(item) ? ' active' : '');
      a.href = item.href;
      a.title = item.label;
      a.innerHTML = `<span class="nx-mobile-icon">${item.icon}</span><span class="nx-mobile-label">${item.label.split(' ')[0]}</span>`;
      bar.appendChild(a);
    });

    return bar;
  }

  function injectNav() {
    const style = document.createElement('style');
    style.textContent = `
      /* ── SIDEBAR ──────────────────────── */
      .nx-sidebar {
        position: fixed; top: 0; left: 0;
        width: var(--sidebar-w, 64px);
        height: 100vh;
        background: var(--bg-surface, #12151b);
        border-right: 1px solid var(--border, #2a2f3a);
        display: flex; flex-direction: column;
        align-items: center;
        padding: 16px 0;
        z-index: 800;
        transition: width 0.25s ease;
        overflow: hidden;
      }
      .nx-sidebar:hover { width: var(--sidebar-expanded, 220px); }
      .nx-sidebar-logo {
        padding: 8px;
        margin-bottom: 20px;
        color: var(--accent, #c8a96e);
        opacity: 0.9;
      }
      .nx-sidebar-logo svg { width: 28px; height: 28px; }
      .nx-sidebar-list {
        list-style: none; padding: 0; margin: 0;
        flex: 1; width: 100%;
      }
      .nx-sidebar-item {
        display: flex; align-items: center;
        gap: 14px;
        padding: 12px 20px;
        color: var(--text-secondary, #8b94a5);
        text-decoration: none;
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 13px;
        font-weight: 500;
        white-space: nowrap;
        transition: color 0.15s, background 0.15s;
        border-left: 3px solid transparent;
      }
      .nx-sidebar-item:hover:not(.disabled) {
        color: var(--text-primary, #e8eaf0);
        background: var(--bg-hover, #222838);
      }
      .nx-sidebar-item.active {
        color: var(--accent, #c8a96e);
        border-left-color: var(--accent, #c8a96e);
        background: var(--accent-dim, rgba(200,169,110,0.12));
      }
      .nx-sidebar-item.disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
      .nx-sidebar-icon { flex-shrink: 0; display: flex; }
      .nx-sidebar-icon svg { width: 20px; height: 20px; }
      .nx-sidebar-label {
        opacity: 0;
        transition: opacity 0.2s ease 0.05s;
      }
      .nx-sidebar:hover .nx-sidebar-label { opacity: 1; }
      .nx-sidebar-bottom {
        width: 100%;
        border-top: 1px solid var(--border, #2a2f3a);
        padding-top: 8px;
      }

      /* ── MOBILE BAR ──────────────────── */
      .nx-mobile-bar {
        display: none;
        position: fixed; bottom: 0; left: 0; right: 0;
        background: var(--bg-surface, #12151b);
        border-top: 1px solid var(--border, #2a2f3a);
        z-index: 800;
        justify-content: space-around;
        padding: 6px 0 env(safe-area-inset-bottom, 0);
      }
      .nx-mobile-item {
        display: flex; flex-direction: column;
        align-items: center; gap: 2px;
        padding: 6px 8px;
        color: var(--text-secondary, #8b94a5);
        text-decoration: none;
        font-size: 10px;
        font-weight: 500;
      }
      .nx-mobile-item.active { color: var(--accent, #c8a96e); }
      .nx-mobile-icon svg { width: 20px; height: 20px; }

      /* ── SYNC DOT ────────────────────── */
      .nx-sync-dot {
        position: absolute;
        top: -2px; right: -2px;
        width: 7px; height: 7px;
        border-radius: 50%;
        background: var(--text-muted, #555);
        border: 1.5px solid var(--bg-surface, #12151b);
      }
      .nx-sync-dot.synced   { background: var(--bull, #4caf50); }
      .nx-sync-dot.pending  { background: var(--warn, #f59e0b); }
      .nx-sync-dot.error    { background: var(--bear, #e05c5c); }
      .nx-sync-dot.offline  { background: var(--text-muted, #555); }

      @media (max-width: 768px) {
        .nx-sidebar { display: none; }
        .nx-mobile-bar { display: flex; }
      }
    `;
    document.head.appendChild(style);

    const app = document.querySelector('.nx-app');
    if (app) {
      app.prepend(buildSidebar());
      app.appendChild(buildMobileBar());
    } else {
      document.body.prepend(buildSidebar());
      document.body.appendChild(buildMobileBar());
    }
  }

  // Update sync dot status
  function updateSyncDot() {
    const dot = document.getElementById('nxSyncDot');
    if (!dot) return;
    let status = 'not-configured';
    if (typeof SyncEngine !== 'undefined' && SyncEngine.getStatus) {
      status = SyncEngine.getStatus();
    }
    dot.className = 'nx-sync-dot ' + status;
  }

  // Auto-inject when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { injectNav(); updateSyncDot(); });
  } else {
    injectNav();
    updateSyncDot();
  }

  // Re-check sync status periodically
  setInterval(updateSyncDot, 10000);
})();
