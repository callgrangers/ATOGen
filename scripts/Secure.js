// ==========================================
// SECURE VAULT — Private Links
// ==========================================
// Authenticated via Apps Script backend.
// Session state cached in sessionStorage so credentials aren't
// re-entered while the app session is active.
//
// ADD YOUR SECURE LINKS BELOW.
// Each entry: { icon, title, description, url }
// ==========================================

const SECURE_VAULT_LINKS = [
    {
        icon: '✉️',
        title: 'Prayer Response',
        description: 'Review and respond to prayer requests.',
        url: '#',
        app: 'prayer-response'
    },
    {
        icon: '🐑',
        title: 'Pastoral Care',
        description: 'Open The Flock pastoral workspace.',
        url: '#',
        app: 'pastoral'
    },
    {
        icon: '🔬',
        title: 'Pastoral Mirror',
        description: 'Open the mirror workspace.',
        url: '#',
        app: 'mirror'
    },
    {
        icon: '✅',
        title: 'To Do List',
        description: 'Manage tasks and reminders.',
        url: '#',
        app: 'todo'
    },
    {
        icon: '🔐',
        title: 'Admin Only',
        description: 'Open admin provisioning tools.',
        url: '#',
        app: 'admin-provision'
    },
    {
        icon: '📁',
        title: 'Drive Vault',
        description: 'Private Google Drive folder.',
        url: 'https://drive.google.com/drive/folders/1A-g8KEWAKCMGdgn3WgfSjKpHEA0wgKuc?usp=drive_link'
    }
    // Add more links here:
    // { icon: '📄', title: 'Link Title', description: 'Short description.', url: 'https://...' },
];

const SECURE_SESSION_KEY = 'atogen_secure_vault_v1';
const SECURE_SESSION_IDLE_TIMEOUT_MS = 365 * 24 * 60 * 60 * 1000; // 1 year — persistent login
const SECURE_SESSION_TOUCH_THROTTLE_MS = 5000;
const SECURE_PRAYER_RESPONSES_SHEET_ID = '1fLN1bjwEb5ZJp0VZXpxQSyVaaqRpGKQacvLPZs5gXHQ';
const SECURE_PRAYER_RESPONSES_TAB = 'Responses';
const SECURE_PRAYER_NOTES_TAB_CANDIDATES = Object.freeze([
    'PrayerNotes',
    'Prayer_Notes',
    'Prayer Notes',
    'Notes'
]);
const SECURE_PRAYER_REQUEST_TAB_CANDIDATES = Object.freeze([
    'Responses',
    'responses',
    'PrayerRequests',
    'Prayer_Requests',
    'Prayer Requests',
    'Prayer',
    'Form responses 1',
    'Form Responses 1',
    'Form_Responses_1',
    'Prayer Request Responses',
    'Prayer_Request_Responses'
]);

window.__SECURE_PRAYER_PRELOAD_CACHE__ = window.__SECURE_PRAYER_PRELOAD_CACHE__ || null;
let secureExternalTouchAt = 0;

window.touchSecureSessionKeepAlive = function(force) {
    const now = Date.now();
    if (!force && (now - secureExternalTouchAt) < SECURE_SESSION_TOUCH_THROTTLE_MS) {
        return false;
    }

    try {
        const raw = localStorage.getItem(SECURE_SESSION_KEY);
        if (!raw || raw === '1') return false;

        const payload = JSON.parse(raw);
        if (!payload || typeof payload !== 'object') return false;

        const expiresAt = Number(payload.expiresAt || 0);
        if (!expiresAt || expiresAt <= now) {
            localStorage.removeItem(SECURE_SESSION_KEY);
            return false;
        }

        payload.touchedAt = now;
        localStorage.setItem(SECURE_SESSION_KEY, JSON.stringify(payload));
        secureExternalTouchAt = now;
        return true;
    } catch (err) {
        return false;
    }
};

function secureMapPrayerResultRowsForPreload(result) {
    function pickRowIndex(item) {
        if (!item || typeof item !== 'object') return 0;
        const raw = item.index ?? item.rowIndex ?? item.row_index ?? item.RowIndex ?? item['Row Index'];
        const parsed = Number(raw || 0);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    }

    return Array.isArray(result && result.rows)
        ? result.rows
            .map(function(item, idx) {
                const fallbackRowIndex = idx + 2;
                if (item && typeof item === 'object' && Object.prototype.hasOwnProperty.call(item, 'data')) {
                    return {
                        rowIndex: pickRowIndex(item) || fallbackRowIndex,
                        row: item.data
                    };
                }

                if (item && typeof item === 'object' && (Array.isArray(item.row) || (item.row && typeof item.row === 'object'))) {
                    return {
                        rowIndex: pickRowIndex(item) || fallbackRowIndex,
                        row: item.row
                    };
                }

                return {
                    rowIndex: pickRowIndex(item) || fallbackRowIndex,
                    row: item
                };
            })
            .filter(function(item) { return item && (Array.isArray(item.row) || (item.row && typeof item.row === 'object')); })
        : [];
}

window.preloadSecurePrayerResponses = async function preloadSecurePrayerResponses() {
    const endpoint = String(window.PASTORAL_DB_V2_ENDPOINT || '').trim();
    if (!endpoint) return null;

    // V2 requires auth — read session from localStorage
    var session = null;
    try {
        var raw = localStorage.getItem(SECURE_SESSION_KEY);
        if (raw && raw !== '1') session = JSON.parse(raw);
    } catch (e) { /* ignore */ }
    if (!session || !session.token || !session.email) return null;

    var url = endpoint + '?action=prayer.list&token=' + encodeURIComponent(session.token)
        + '&authEmail=' + encodeURIComponent(session.email);

    try {
        var resp = await fetch(url, { method: 'GET', cache: 'no-store' });
        if (!resp.ok) return null;
        var result = await resp.json();
        var rows = (result && result.ok && Array.isArray(result.rows))
            ? secureMapPrayerResultRowsForPreload(result)
            : [];

        window.__SECURE_PRAYER_PRELOAD_CACHE__ = {
            endpoint: endpoint,
            rows: rows,
            at: Date.now()
        };
        return window.__SECURE_PRAYER_PRELOAD_CACHE__;
    } catch (err) {
        return null;
    }
};

// ==========================================
// ENDPOINT WARM-UP (wake cold Google Apps Script containers)
// ==========================================

let _secureEndpointWarmInFlight = null;

function warmSecureEndpoints() {
    if (_secureEndpointWarmInFlight) return _secureEndpointWarmInFlight;

    const endpoints = [
        window.AUTH_PRIMARY_ENDPOINT || (window.AUTH_ENDPOINTS && window.AUTH_ENDPOINTS.login) || '',
        window.PASTORAL_DB_V2_ENDPOINT || '',
        window.TODO_ENDPOINT || ''
    ].map(function(e) { return String(e || '').trim(); }).filter(Boolean);

    const seen = new Set();
    const unique = endpoints.filter(function(e) {
        if (seen.has(e)) return false;
        seen.add(e);
        return true;
    });

    if (!unique.length) return Promise.resolve();

    _secureEndpointWarmInFlight = Promise.allSettled(
        unique.map(function(ep) {
            var sep = ep.includes('?') ? '&' : '?';
            var url = ep + sep + 'action=health&_=' + Date.now();
            return fetch(url, { method: 'GET', cache: 'no-store' }).catch(function() {});
        })
    ).then(function() {
        _secureEndpointWarmInFlight = null;
    });

    return _secureEndpointWarmInFlight;
}

// ==========================================
// STYLES
// ==========================================

function secureVaultEnsureStyles() {
    if (document.getElementById('secure-vault-app-style')) return;
    const style = document.createElement('style');
    style.id = 'secure-vault-app-style';
    style.textContent = `
        .sv-shell {
            --sv-accent: #0ea5e9; /* Serene Sky Blue */
            --sv-accent-soft: rgba(14, 165, 233, 0.15);
            --sv-text: #f8fafc;
            --sv-muted: #94a3b8;
            --sv-surface: rgba(15, 23, 42, 0.65);
            --sv-surface-hover: rgba(30, 41, 59, 0.75);
            --sv-border: rgba(255, 255, 255, 0.08);
            width: 100%;
            max-width: 1080px;
            margin: 0 auto;
            display: grid;
            gap: 20px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .sv-card {
            border: 1px solid var(--sv-border);
            border-radius: 16px;
            background: 
                radial-gradient(120% 120% at 50% -20%, rgba(14, 165, 233, 0.08), transparent 50%),
                linear-gradient(160deg, rgba(15, 23, 42, 0.85), rgba(2, 6, 23, 0.95));
            -webkit-backdrop-filter: blur(20px) saturate(1.8);
            backdrop-filter: blur(20px) saturate(1.8);
            padding: 20px 16px;
            display: grid;
            gap: 16px;
            box-shadow: 
                0 20px 40px -10px rgba(0, 0, 0, 0.5), 
                inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }
        .sv-kicker {
            font-size: 0.65rem;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: var(--sv-accent);
            font-weight: 700;
            margin-bottom: 4px;
        }
        .sv-title {
            margin: 0;
            color: #ffffff;
            font-size: 1.25rem;
            font-weight: 800;
            letter-spacing: 0.02em;
        }
        .sv-sub {
            margin: 0;
            color: var(--sv-muted);
            font-size: 0.88rem;
            line-height: 1.5;
        }
        .sv-field {
            display: grid;
            gap: 8px;
        }
        .sv-field label {
            font-size: 0.75rem;
            font-weight: 600;
            color: #cbd5e1;
        }
        .sv-field input {
            width: 100%;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            background: rgba(2, 6, 23, 0.5);
            color: #f8fafc;
            padding: 12px 14px;
            font: inherit;
            font-size: 0.95rem;
            box-sizing: border-box;
            transition: all 0.2s ease;
        }
        .sv-field input:focus {
            outline: none;
            border-color: var(--sv-accent);
            background: rgba(15, 23, 42, 0.8);
            box-shadow: 0 0 0 3px var(--sv-accent-soft);
        }
        .sv-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            align-items: center;
        }
        .sv-status {
            min-height: 20px;
            font-size: 0.85rem;
            color: var(--sv-muted);
        }
        .sv-status.ok  { color: #34d399; }
        .sv-status.err { color: #f87171; }
        .sv-vault-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .sv-vault-action-btn {
            display: inline-flex; align-items: center; gap: 6px;
            font-size: 0.75rem; font-weight: 600;
            padding: 8px 14px; border-radius: 8px;
            cursor: pointer; transition: all 0.2s ease;
            border: 1px solid transparent; 
            -webkit-backdrop-filter: blur(10px);
            backdrop-filter: blur(10px);
        }
        .sv-vault-action-btn:active { transform: scale(0.97); }
        .sv-vault-home-btn {
            background: rgba(14, 165, 233, 0.1);
            color: #bae6fd;
            border-color: rgba(14, 165, 233, 0.2);
        }
        .sv-vault-home-btn:hover { 
            background: rgba(14, 165, 233, 0.2); 
            border-color: rgba(14, 165, 233, 0.4); 
            color: #ffffff;
        }
        .sv-vault-lock-btn {
            background: rgba(239, 68, 68, 0.1);
            color: #fecaca;
            border-color: rgba(239, 68, 68, 0.2);
        }
        .sv-vault-lock-btn:hover { 
            background: rgba(239, 68, 68, 0.2); 
            border-color: rgba(239, 68, 68, 0.4); 
            color: #ffffff;
        }
        .sv-vault-identity {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .sv-vault-icon {
            font-size: 2rem;
            line-height: 1;
            filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)) !important;
        }
        .sv-links-grid {
            display: flex;
            flex-direction: column;
            gap: 24px;
        }
        .sv-home-section {
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 18px;
            padding: 18px 14px 14px;
            box-shadow: 0 10px 24px rgba(0,0,0,0.28);
        }
        .sv-home-section-head {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 0 0 14px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.78rem;
            letter-spacing: 1.4px;
            text-transform: uppercase;
            color: var(--sv-accent);
            font-weight: 900;
        }
        .sv-home-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--sv-accent);
            box-shadow: 0 0 8px var(--sv-accent);
            flex-shrink: 0;
        }
        .sv-home-section-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: 14px 10px;
            justify-items: center;
        }
        .sv-app-item {
            width: 100px;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 22px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 12px 8px 9px;
            cursor: pointer;
            transition: all 0.2s ease;
            color: #f8fafc;
            font-size: 0.82rem;
            font-weight: 700;
            gap: 6px;
            text-decoration: none;
        }
        .sv-app-item:hover {
            background: rgba(255,255,255,0.1);
            transform: scale(1.05);
            border-color: rgba(255,255,255,0.25);
        }
        .sv-app-item:active { transform: scale(0.97); }
        .sv-app-item.sv-app-active {
            border-color: var(--sv-accent);
            background: rgba(14,165,233,0.12);
            box-shadow: 0 0 0 2px rgba(14,165,233,0.25);
        }
        .sv-app-icon {
            width: 80px;
            height: 80px;
            border-radius: 20px;
            background: linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03));
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            border: 1px solid rgba(255,255,255,0.1);
            filter: none !important;
            text-shadow: none !important;
        }
        .sv-app-label {
            font-size: calc(0.9rem - 1px);
            font-weight: 700;
            color: #f8fafc;
            text-align: center;
            line-height: 1.08;
            min-height: 2.16em;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: clip;
            white-space: normal;
            max-width: 96px;
        }
        .sv-empty {
            grid-column: 1 / -1;
            text-align: center;
            padding: 40px 20px;
            color: var(--sv-muted);
            font-size: 0.9rem;
            background: rgba(0,0,0,0.2);
            border-radius: 12px;
            border: 1px dashed rgba(255,255,255,0.1);
        }
        .sv-tab-workspace {
            border: 1px solid var(--sv-border);
            border-radius: 12px;
            background: rgba(2, 6, 23, 0.4);
            min-height: 300px;
            padding: 16px;
        }
        .sv-welcome-message {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 250px;
            text-align: center;
        }
        .sv-welcome-message h4 {
            font-size: 1.4rem;
            font-weight: 600;
            color: #f8fafc;
            margin: 0 0 10px 0;
        }
        .sv-welcome-message p {
            font-size: 0.95rem;
            color: #94a3b8;
            margin: 0;
        }
        .sv-prayer-wrap, .sv-sheep-wrap {
            display: grid;
            gap: 16px;
        }
        .sv-sheep-title, .sv-prayer-title {
            margin: 0 0 4px 0;
            color: #f8fafc;
            font-size: 1.1rem;
            font-weight: 700;
            letter-spacing: 0.02em;
        }
        .sv-sheep-note, .sv-prayer-note {
            margin: 0;
            color: var(--sv-muted);
            font-size: 0.85rem;
            line-height: 1.5;
        }
        .sv-prayer-header {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .sv-session-chip {
            margin-top: 8px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 6px;
            background: rgba(255,255,255,0.05);
            color: #cbd5e1;
            font-size: 0.7rem;
            padding: 4px 10px;
            font-weight: 600;
        }
        .sv-session-chip .sv-session-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #cbd5e1;
        }
        .sv-session-chip.is-reused {
            border-color: rgba(245, 158, 11, 0.3);
            background: rgba(245, 158, 11, 0.1);
            color: #fcd34d;
        }
        .sv-session-chip.is-reused .sv-session-dot {
            background: #fbbf24;
            box-shadow: 0 0 8px rgba(251, 191, 36, 0.6);
        }
        .sv-prayer-toolbar {
            display: grid;
            gap: 12px;
            border: 1px solid var(--sv-border);
            border-radius: 10px;
            background: var(--sv-surface);
            padding: 16px;
        }
        .sv-prayer-toolbar-grid {
            display: grid;
            grid-template-columns: 2fr repeat(3, 1fr) auto auto;
            gap: 12px;
            align-items: end;
        }
        .sv-prayer-toolbar-field {
            display: grid;
            gap: 6px;
        }
        .sv-prayer-toolbar-field label {
            font-size: 0.7rem;
            font-weight: 600;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .sv-prayer-toolbar-field input,
        .sv-prayer-toolbar-field select {
            width: 100%;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 6px;
            background: rgba(2, 6, 23, 0.6);
            color: #f8fafc;
            padding: 8px 10px;
            font-size: 0.85rem;
            transition: all 0.2s;
        }
        .sv-prayer-toolbar-field input:focus,
        .sv-prayer-toolbar-field select:focus {
            outline: none;
            border-color: var(--sv-accent);
            box-shadow: 0 0 0 2px var(--sv-accent-soft);
        }
        .sv-prayer-filter-reset, .sv-prayer-toggle-view {
            padding: 9px 14px;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 6px;
            background: rgba(255,255,255,0.05);
            color: #e2e8f0;
            cursor: pointer;
            font-size: 0.8rem;
            font-weight: 600;
            transition: all 0.2s;
        }
        .sv-prayer-filter-reset:hover, .sv-prayer-toggle-view:hover {
            background: rgba(255,255,255,0.1);
            color: #ffffff;
        }
        .sv-prayer-quick-row {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            align-items: center;
            padding-top: 8px;
            border-top: 1px solid rgba(255,255,255,0.05);
        }
        .sv-prayer-quick-label {
            font-size: 0.7rem;
            font-weight: 600;
            color: #94a3b8;
            text-transform: uppercase;
            margin-right: 4px;
        }
        .sv-prayer-quick-btn {
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 6px;
            background: transparent;
            color: #cbd5e1;
            font-size: 0.75rem;
            padding: 6px 12px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .sv-prayer-quick-btn:hover {
            background: rgba(255,255,255,0.05);
        }
        .sv-prayer-quick-btn.is-active {
            border-color: var(--sv-accent);
            background: var(--sv-accent-soft);
            color: #ffffff;
        }
        .sv-prayer-list-footer {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            padding-top: 12px;
            border-top: 1px solid rgba(255,255,255,0.05);
        }
        .sv-prayer-rows-wrap {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #94a3b8;
            font-size: 0.8rem;
        }
        .sv-prayer-rows-wrap select {
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 4px;
            background: rgba(2, 6, 23, 0.6);
            color: #f8fafc;
            padding: 4px 8px;
            font-size: 0.8rem;
        }
        .sv-prayer-pagination {
            display: flex;
            gap: 4px;
        }
        .sv-prayer-page-btn {
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 6px;
            background: transparent;
            color: #cbd5e1;
            font-size: 0.8rem;
            padding: 6px 10px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .sv-prayer-page-btn:hover:not([disabled]) {
            background: rgba(255,255,255,0.05);
        }
        .sv-prayer-page-btn[disabled] {
            opacity: 0.3;
            cursor: not-allowed;
        }
        .sv-prayer-page-btn.is-active {
            border-color: var(--sv-accent);
            background: var(--sv-accent-soft);
            color: #ffffff;
        }
        .sv-prayer-list-summary {
            color: #94a3b8;
            font-size: 0.8rem;
        }
        .sv-prayer-list, .sv-prayer-cards-wrap {
            display: grid;
            gap: 16px;
            max-height: 500px;
            overflow-y: auto;
            padding-right: 4px;
        }
        .sv-prayer-list::-webkit-scrollbar, .sv-prayer-cards-wrap::-webkit-scrollbar, .sv-prayer-table-wrap::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        .sv-prayer-list::-webkit-scrollbar-thumb, .sv-prayer-cards-wrap::-webkit-scrollbar-thumb, .sv-prayer-table-wrap::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.2);
            border-radius: 4px;
        }
        .sv-prayer-table-wrap {
            overflow: auto;
            max-height: 500px;
            border-radius: 10px;
            border: 1px solid var(--sv-border);
            background: rgba(2, 6, 23, 0.4);
        }
        .sv-prayer-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.85rem;
            min-width: 900px;
        }
        .sv-prayer-table th {
            padding: 14px 16px;
            text-align: left;
            font-size: 0.75rem;
            font-weight: 600;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            position: sticky;
            top: 0;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(4px);
            border-bottom: 1px solid rgba(255,255,255,0.1);
            z-index: 2;
        }
        .sv-prayer-table td {
            padding: 16px;
            vertical-align: top;
            color: #e2e8f0;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .sv-prayer-table tbody tr:hover {
            background: rgba(255,255,255,0.02);
        }
        .sv-prayer-td-prayer {
            max-width: 400px;
            line-height: 1.6;
        }
        .sv-prayer-td-meta {
            margin-top: 8px;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        .sv-prayer-mini-pill {
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 4px;
            background: rgba(255,255,255,0.03);
            color: #94a3b8;
            font-size: 0.7rem;
            padding: 2px 6px;
        }
        .sv-prayer-td-actions {
            display: flex;
            gap: 8px;
        }
        .sv-prayer-card {
            border: 1px solid var(--sv-border);
            background: var(--sv-surface);
            border-radius: 12px;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        .sv-prayer-card:hover {
            border-color: rgba(255,255,255,0.15);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .sv-prayer-card.is-open .sv-prayer-card-chevron {
            transform: rotate(180deg);
        }
        .sv-prayer-card-head {
            width: 100%;
            border: none;
            background: transparent;
            color: #f8fafc;
            text-align: left;
            padding: 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .sv-prayer-card-head-info {
            display: grid;
            gap: 4px;
        }
        .sv-prayer-card-head-name {
            font-size: 1rem;
            font-weight: 600;
        }
        .sv-prayer-card-head-date {
            font-size: 0.75rem;
            color: #94a3b8;
        }
        .sv-prayer-card-chevron {
            color: #94a3b8;
            transition: transform 0.2s;
        }
        .sv-prayer-card-body {
            display: none;
            border-top: 1px solid rgba(255,255,255,0.05);
            padding: 16px;
            background: rgba(0,0,0,0.1);
            gap: 16px;
        }
        .sv-prayer-card.is-open .sv-prayer-card-body {
            display: grid;
        }
        .sv-prayer-card-meta {
            display: grid;
            gap: 10px;
        }
        .sv-prayer-shield-row {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .sv-prayer-shield-label {
            min-width: 60px;
            font-size: 0.75rem;
            font-weight: 600;
            color: #94a3b8;
            text-transform: uppercase;
        }
        .sv-prayer-shield-pill {
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 6px;
            background: rgba(255,255,255,0.05);
            color: #e2e8f0;
            font-size: 0.8rem;
            padding: 4px 10px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .sv-prayer-shield-pill:hover:not(.is-revealed) {
            background: rgba(255,255,255,0.1);
        }
        .sv-prayer-shield-pill.is-revealed {
            border-color: var(--sv-accent);
            background: var(--sv-accent-soft);
            color: #ffffff;
            cursor: default;
        }
        .sv-prayer-card-prayer {
            margin: 0;
            color: #f1f5f9;
            font-size: 0.95rem;
            line-height: 1.6;
            white-space: pre-wrap;
            padding: 12px;
            background: rgba(255,255,255,0.02);
            border-radius: 8px;
            border-left: 3px solid var(--sv-accent);
        }
        .sv-prayer-followup-chip {
            display: inline-flex;
            align-items: center;
            border-radius: 4px;
            font-size: 0.75rem;
            padding: 4px 8px;
            font-weight: 600;
            width: fit-content;
        }
        .sv-prayer-followup-chip.is-yes {
            background: rgba(16, 185, 129, 0.15);
            color: #34d399;
            border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .sv-prayer-followup-chip.is-no {
            background: rgba(245, 158, 11, 0.15);
            color: #fbbf24;
            border: 1px solid rgba(245, 158, 11, 0.3);
        }
        .sv-prayer-card-notes {
            padding: 12px;
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 8px;
            background: rgba(255,255,255,0.03);
            display: grid;
            gap: 8px;
        }
        .sv-prayer-card-notes-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .sv-prayer-card-notes strong {
            color: #bae6fd;
            font-size: 0.8rem;
        }
        .sv-prayer-note-reveal-btn {
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 4px;
            background: transparent;
            color: #94a3b8;
            font-size: 0.75rem;
            padding: 2px 8px;
            cursor: pointer;
        }
        .sv-prayer-card-note-text {
            font-size: 0.85rem;
            color: #cbd5e1;
            line-height: 1.5;
        }
        .sv-prayer-card-note-text.is-shielded {
            filter: blur(4px);
            user-select: none;
        }
        .sv-prayer-card-actions {
            display: flex;
            gap: 12px;
            padding-top: 8px;
        }
        .sv-prayer-btn {
            padding: 8px 14px;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 6px;
            background: rgba(255,255,255,0.05);
            color: #f8fafc;
            cursor: pointer;
            font-size: 0.8rem;
            font-weight: 500;
            transition: all 0.2s;
        }
        .sv-prayer-btn:hover {
            background: rgba(255,255,255,0.1);
            border-color: rgba(255,255,255,0.2);
        }
        .sv-prayer-delete-btn:hover {
            background: rgba(239,68,68,0.15);
            border-color: rgba(239,68,68,0.4);
            color: #fca5a5;
        }
        .sv-notes-modal, .sv-reply-modal {
            position: fixed;
            inset: 0;
            display: none;
            align-items: center;
            justify-content: center;
            background: rgba(2, 6, 23, 0.8);
            backdrop-filter: blur(8px);
            z-index: 10010;
            padding: 20px;
        }
        .sv-notes-modal.active, .sv-reply-modal.active {
            display: flex;
        }
        .sv-notes-panel, .sv-reply-panel {
            width: 100%;
            max-width: 600px;
            border-radius: 16px;
            border: 1px solid var(--sv-border);
            background: var(--sv-surface);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            padding: 24px;
            display: grid;
            gap: 16px;
        }
        .sv-notes-title, .sv-reply-title {
            margin: 0;
            color: #f8fafc;
            font-size: 1.2rem;
            font-weight: 700;
        }
        .sv-notes-sub, .sv-reply-sub {
            margin: 0;
            color: #94a3b8;
            font-size: 0.9rem;
        }
        .sv-notes-preview {
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 8px;
            background: rgba(0,0,0,0.2);
            padding: 12px;
            color: #cbd5e1;
            font-size: 0.9rem;
            line-height: 1.5;
            max-height: 120px;
            overflow-y: auto;
            border-left: 3px solid var(--sv-accent);
        }
        .sv-notes-input, .sv-reply-textarea, .sv-reply-input {
            width: 100%;
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.1);
            background: rgba(0,0,0,0.3);
            color: #f8fafc;
            padding: 12px;
            font: inherit;
            font-size: 0.95rem;
            line-height: 1.5;
            box-sizing: border-box;
            transition: all 0.2s;
        }
        .sv-notes-input, .sv-reply-textarea {
            min-height: 140px;
            resize: vertical;
        }
        .sv-notes-input:focus, .sv-reply-textarea:focus, .sv-reply-input:focus {
            outline: none;
            border-color: var(--sv-accent);
            box-shadow: 0 0 0 3px var(--sv-accent-soft);
        }
        .sv-notes-actions, .sv-reply-actions {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            padding-top: 8px;
        }
        .sv-reply-channel-row {
            display: flex;
            gap: 12px;
        }
        .sv-reply-channel-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.9rem;
            color: #cbd5e1;
            cursor: pointer;
        }
        .sv-reply-channel-btn input {
            accent-color: var(--sv-accent);
            width: 16px;
            height: 16px;
        }
        .sv-reply-field {
            display: grid;
            gap: 8px;
        }
        .sv-reply-field label {
            font-size: 0.8rem;
            font-weight: 600;
            color: #94a3b8;
        }
        .sv-reply-to {
            padding: 10px 12px;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 8px;
            color: #f8fafc;
            font-size: 0.95rem;
        }
        
        @media (max-width: 640px) {
            .sv-vault-header { flex-direction: column; align-items: flex-start; }
            .sv-prayer-toolbar-grid { grid-template-columns: 1fr; }
            .sv-prayer-list-footer { flex-direction: column; align-items: flex-start; }
            .sv-home-section-grid { grid-template-columns: repeat(auto-fill, minmax(85px, 1fr)); gap: 12px 6px; }
            .sv-app-item { width: 85px; }
            .sv-app-icon { width: 70px; height: 70px; font-size: 2.5rem; border-radius: 18px; }
            .sv-app-label { font-size: calc(0.84rem - 1px); min-height: 2.1em; }
        }
    `;
    document.head.appendChild(style);
}
// ==========================================
// SHELL HTML
// ==========================================

function renderSecureVaultShell() {
    function renderAdminReplyForm() {
        return `
                <section class="sv-reply-modal" id="sv-reply-modal" aria-hidden="true">
                    <div class="sv-reply-panel" role="dialog" aria-modal="true" aria-labelledby="sv-reply-title">
                        <h5 class="sv-reply-title" id="sv-reply-title">Reply</h5>
                        <p class="sv-reply-sub" id="sv-reply-sub">Craft a response to this prayer request.</p>

                        <div class="sv-reply-channel-row" id="sv-reply-channel-row">
                            <label class="sv-reply-channel-btn">
                                <input type="radio" name="sv-reply-channel" id="sv-reply-channel-email" value="email" checked />
                                <span>Email</span>
                            </label>
                            <label class="sv-reply-channel-btn">
                                <input type="radio" name="sv-reply-channel" id="sv-reply-channel-text" value="text" />
                                <span>Text</span>
                            </label>
                        </div>

                        <div class="sv-reply-field">
                            <label>To</label>
                            <div class="sv-reply-to" id="sv-reply-to"></div>
                        </div>

                        <div class="sv-reply-field" id="sv-reply-subject-wrap">
                            <label for="sv-reply-subject">Subject</label>
                            <input id="sv-reply-subject" class="sv-reply-input" type="text" placeholder="Regarding your prayer request" />
                        </div>

                        <div class="sv-reply-field">
                            <label for="sv-reply-message">Message</label>
                            <textarea id="sv-reply-message" class="sv-reply-textarea" placeholder="Type your response..."></textarea>
                        </div>

                        <div class="sv-reply-status" id="sv-reply-status"></div>

                        <div class="sv-reply-actions">
                            <button type="button" class="clear-btn" id="sv-reply-cancel-btn">Cancel</button>
                            <button type="button" class="clear-btn" id="sv-reply-send-btn">Send Reply</button>
                        </div>
                    </div>
                </section>
        `;
    }

    return `
        <section class="sv-shell">

            <!-- LOGIN VIEW -->
            <section class="sv-card" id="sv-login-card">
                <div>
                    <p class="sv-kicker">Vault Access Required</p>
                    <h3 class="sv-title">Secure Vault</h3>
                    <p class="sv-sub" style="margin-top:6px;">Sign in with your admin credentials to unlock the private vault.</p>
                </div>
                <form id="sv-login-form" autocomplete="on">
                    <div class="sv-field">
                        <label for="sv-email">Admin Email</label>
                        <input id="sv-email" type="email" autocomplete="username" placeholder="your@email.com" />
                    </div>
                    <div class="sv-field">
                        <label for="sv-passcode">Admin Passcode</label>
                        <input id="sv-passcode" type="password" autocomplete="current-password" placeholder="••••••••" />
                    </div>
                    <div class="sv-actions">
                        <button type="submit" class="clear-btn" id="sv-unlock-btn">Unlock Vault</button>
                    </div>
                    <div class="sv-status" id="sv-login-status"></div>
                </form>
            </section>

            <!-- VAULT VIEW -->
            <section class="sv-card" id="sv-vault-card" style="display:none;">
                <div class="sv-vault-header">
                    <div class="sv-vault-identity">
                        <span class="sv-vault-icon">🔒</span>
                        <div>
                            <p class="sv-kicker">Private Access</p>
                            <h3 class="sv-title">Secure Vault</h3>
                        </div>
                    </div>
                    <div class="sv-actions">
                        <button class="sv-vault-action-btn sv-vault-home-btn" id="sv-home-btn">🏠 Home</button>
                        <button class="sv-vault-action-btn sv-vault-lock-btn" id="sv-lock-btn">🔒 Lock</button>
                    </div>
                </div>

                <div class="sv-links-grid" id="sv-links-grid"></div>

                <section class="sv-tab-workspace" id="sv-tab-workspace">
                <div class="sv-welcome-message" id="sv-welcome-message">
                    <h4>Welcome to the Secure Workspace</h4>
                    <p>Select an app above to get started.</p>
                </div>
                <section class="sv-prayer-wrap" id="sv-prayer-wrap" style="display:none;">
                    <div class="sv-prayer-header">
                        <div>
                            <h4 class="sv-prayer-title">Prayer Requests</h4>
                            <p class="sv-prayer-note">Rendered from the connected Prayer Google Form responses.</p>
                            <div class="sv-session-chip" id="sv-session-reuse-chip"><span class="sv-session-dot" aria-hidden="true"></span><span id="sv-session-reuse-label">Session: Local Login</span></div>
                        </div>
                        <div class="sv-actions">
                            <button class="clear-btn" id="sv-prayer-refresh-btn">Refresh</button>
                        </div>
                    </div>
                    <div class="sv-status" id="sv-prayer-status">Not loaded.</div>
                    <div class="sv-prayer-toolbar" id="sv-prayer-toolbar">
                        <div class="sv-prayer-toolbar-grid">
                            <div class="sv-prayer-toolbar-field">
                                <label for="sv-prayer-filter-search">Search</label>
                                <input id="sv-prayer-filter-search" type="search" placeholder="Name, prayer text, contact..." />
                            </div>
                            <div class="sv-prayer-toolbar-field">
                                <label for="sv-prayer-filter-from">From Date</label>
                                <input id="sv-prayer-filter-from" type="date" />
                            </div>
                            <div class="sv-prayer-toolbar-field">
                                <label for="sv-prayer-filter-to">To Date</label>
                                <input id="sv-prayer-filter-to" type="date" />
                            </div>
                            <div class="sv-prayer-toolbar-field">
                                <label for="sv-prayer-filter-followup">Follow-up</label>
                                <select id="sv-prayer-filter-followup">
                                    <option value="">Any</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                </select>
                            </div>
                            <button type="button" class="sv-prayer-filter-reset" id="sv-prayer-filter-reset">Clear</button>
                            <button type="button" class="sv-prayer-toggle-view" id="sv-prayer-toggle-view">View: Table</button>
                        </div>
                        <div class="sv-prayer-quick-row">
                            <span class="sv-prayer-quick-label">Quick</span>
                            <button type="button" class="sv-prayer-quick-btn is-active" id="sv-prayer-quick-all" data-quick-filter="all">All</button>
                            <button type="button" class="sv-prayer-quick-btn" id="sv-prayer-quick-today" data-quick-filter="today">Today</button>
                            <button type="button" class="sv-prayer-quick-btn" id="sv-prayer-quick-last7" data-quick-filter="last7">Last 7 Days</button>
                            <button type="button" class="sv-prayer-quick-btn" id="sv-prayer-quick-followup" data-quick-filter="followupYes">Follow-up Yes</button>
                        </div>
                    </div>
                    <div class="sv-prayer-table-wrap" id="sv-prayer-table-wrap" style="display:none;">
                        <table class="sv-prayer-table">
                            <thead>
                                <tr>
                                    <th>Submitted</th>
                                    <th>Name</th>
                                    <th>Follow-up</th>
                                    <th>Prayer</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="sv-prayer-tbody"></tbody>
                        </table>
                    </div>
                    <div class="sv-prayer-list" id="sv-prayer-list"></div>
                    <div class="sv-prayer-list-footer">
                        <div class="sv-prayer-rows-wrap">
                            <span>Rows per page</span>
                            <select id="sv-prayer-rows-per-page">
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="50" selected>50</option>
                            </select>
                        </div>
                        <div class="sv-prayer-list-summary" id="sv-prayer-list-summary"></div>
                        <div class="sv-prayer-pagination" id="sv-prayer-pagination"></div>
                    </div>
                </section>

                <section class="sv-sheep-wrap" id="sv-sheep-wrap" style="display:none;">
                    <div>
                        <h4 class="sv-sheep-title">Sheep Workspace</h4>
                        <p class="sv-sheep-note">Manage pastoral members directly in this workspace panel.</p>
                    </div>
                    <div id="sv-sheep-host"></div>
                </section>

                <section class="sv-sheep-wrap" id="sv-todo-wrap" style="display:none;">
                    <div>
                        <h4 class="sv-sheep-title">To Do List</h4>
                        <p class="sv-sheep-note">Manage tasks, deadlines, and assignments.</p>
                    </div>
                    <div id="sv-todo-host"></div>
                </section>

                <section class="sv-sheep-wrap" id="sv-mirror-wrap" style="display:none;">
                    <div>
                        <h4 class="sv-sheep-title">Pastoral Mirror</h4>
                        <p class="sv-sheep-note">Open the pastoral mirror app from this tab.</p>
                    </div>
                    <div class="sv-actions">
                        <button type="button" class="clear-btn" id="sv-mirror-open-btn">Open Mirror</button>
                    </div>
                </section>
                </section>

                <section class="sv-notes-modal" id="sv-notes-modal" aria-hidden="true">
                    <div class="sv-notes-panel" role="dialog" aria-modal="true" aria-labelledby="sv-notes-title">
                        <h5 class="sv-notes-title" id="sv-notes-title">Prayer Notes</h5>
                        <p class="sv-notes-sub" id="sv-notes-sub">Add private admin notes for this request.</p>
                        <div id="sv-notes-preview" class="sv-notes-preview"></div>
                        <textarea id="sv-notes-input" class="sv-notes-input" placeholder="Type notes here..."></textarea>
                        <div class="sv-notes-actions">
                            <button type="button" class="clear-btn" id="sv-notes-cancel-btn">Cancel</button>
                            <button type="button" class="clear-btn" id="sv-notes-save-btn">Save Notes</button>
                        </div>
                    </div>
                </section>

                ${renderAdminReplyForm()}
            </section>

        </section>
    `;
}

// ==========================================
// APP ENTRY POINT
// ==========================================

function openSecureApp() {
    const backText = document.getElementById('modal-back-text');
    const backBtn = document.getElementById('modal-back-btn');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const container = document.getElementById('modal-body-container');
    const modal = document.getElementById('data-modal');

    if (!backText || !backBtn || !title || !subtitle || !container || !modal) return;

    secureVaultEnsureStyles();

    backText.innerText = 'HOME';
    backBtn.onclick = () => {
        if (typeof window._resetSecureVaultMountState === 'function') window._resetSecureVaultMountState();
        if (typeof closeModal === 'function') {
            closeModal({ navigateBack: false });
        } else if (typeof window.closeModal === 'function') {
            window.closeModal({ navigateBack: false });
        }
    };
    title.innerHTML = '<span style="filter:none !important; text-shadow:none !important; margin-right:8px;">🔒</span>SECURE';
    subtitle.innerText = 'PRIVATE VAULT';
    container.innerHTML = renderSecureVaultShell();
    modal.classList.add('active');

    // Fire endpoint warm-up as soon as login screen appears (wake cold GAS containers)
    warmSecureEndpoints();

    initSecureVaultRuntime();

    if (typeof bounceModalBodyToTop === 'function') bounceModalBodyToTop();
}

// ==========================================
// RUNTIME (auth + session + handling)
// ==========================================

function initSecureVaultRuntime() {
    const loginCard = document.getElementById('sv-login-card');
    const vaultCard = document.getElementById('sv-vault-card');
    const emailEl = document.getElementById('sv-email');
    const passcodeEl = document.getElementById('sv-passcode');
    const unlockBtn = document.getElementById('sv-unlock-btn');
    const loginForm = document.getElementById('sv-login-form');
    const lockBtn = document.getElementById('sv-lock-btn');
    const homeBtn = document.getElementById('sv-home-btn');
    if (homeBtn) homeBtn.addEventListener('click', function() {
        if (typeof window._resetSecureVaultMountState === 'function') window._resetSecureVaultMountState();
        if (typeof closeModal === 'function') {
            closeModal({ navigateBack: false });
        } else if (typeof window.closeModal === 'function') {
            window.closeModal({ navigateBack: false });
        }
    });
    const statusEl = document.getElementById('sv-login-status');
    const prayerRefreshBtn = document.getElementById('sv-prayer-refresh-btn');
    const sessionReuseChipEl = document.getElementById('sv-session-reuse-chip');
    const sessionReuseLabelEl = document.getElementById('sv-session-reuse-label');
    const prayerStatusEl = document.getElementById('sv-prayer-status');
    const prayerListEl = document.getElementById('sv-prayer-list');
    const prayerFilterSearchEl = document.getElementById('sv-prayer-filter-search');
    const prayerFilterFromEl = document.getElementById('sv-prayer-filter-from');
    const prayerFilterToEl = document.getElementById('sv-prayer-filter-to');
    const prayerFilterFollowUpEl = document.getElementById('sv-prayer-filter-followup');
    const prayerFilterResetEl = document.getElementById('sv-prayer-filter-reset');
    const prayerQuickButtons = Array.from(document.querySelectorAll('[data-quick-filter]'));
    const prayerRowsPerPageEl = document.getElementById('sv-prayer-rows-per-page');
    const prayerPaginationEl = document.getElementById('sv-prayer-pagination');
    const prayerListSummaryEl = document.getElementById('sv-prayer-list-summary');
    const prayerWrapEl = document.getElementById('sv-prayer-wrap');
    const sheepWrapEl = document.getElementById('sv-sheep-wrap');
    const mirrorWrapEl = document.getElementById('sv-mirror-wrap');
    const todoWrapEl = document.getElementById('sv-todo-wrap');
    const todoHostEl = document.getElementById('sv-todo-host');
    const sheepHostEl = document.getElementById('sv-sheep-host');
    const mirrorOpenBtn = document.getElementById('sv-mirror-open-btn');
    const notesModalEl = document.getElementById('sv-notes-modal');
    const notesInputEl = document.getElementById('sv-notes-input');
    const notesPreviewEl = document.getElementById('sv-notes-preview');
    const notesSubEl = document.getElementById('sv-notes-sub');
    const notesCancelBtn = document.getElementById('sv-notes-cancel-btn');
    const notesSaveBtn = document.getElementById('sv-notes-save-btn');
    const replyModalEl = document.getElementById('sv-reply-modal');
    const replySubEl = document.getElementById('sv-reply-sub');
    const replyToEl = document.getElementById('sv-reply-to');
    const replySubjectWrapEl = document.getElementById('sv-reply-subject-wrap');
    const replySubjectEl = document.getElementById('sv-reply-subject');
    const replyMessageEl = document.getElementById('sv-reply-message');
    const replyStatusEl = document.getElementById('sv-reply-status');
    const replyCancelBtn = document.getElementById('sv-reply-cancel-btn');
    const replySendBtn = document.getElementById('sv-reply-send-btn');
    const replyChannelEmailEl = document.getElementById('sv-reply-channel-email');
    const replyChannelTextEl = document.getElementById('sv-reply-channel-text');
    let activityWatchBound = false;
    let lastSessionTouchAt = 0;
    let sessionExpiryTimer = null;
    let activeNotesRowIndex = null;
    let activeNotesFallbackText = '';
    let activePrayerPreviewText = '';
    let prayerNotesCacheRows = [];
    let prayerNotesCacheAt = 0;
    let prayerNotesCacheEndpoint = '';
    let prayerLoadInFlight = false;
    let prayerEndpointWarmAt = 0;
    let prayerEndpointWarmOk = false;
    let prayerEndpointWarmInFlight = null;
    let activeReplyContext = null;
    let prayerAllRows = [];
    let prayerFilteredRows = [];
    let prayerCurrentPage = 1;
    let prayerRowsPerPage = Number(prayerRowsPerPageEl ? prayerRowsPerPageEl.value : 50) || 50;
    let prayerActiveQuickFilter = 'all';
    let prayerViewMode = 'table';
    let prayerAutoCards = false;
    let secureActiveTab = '';
    let sheepMounted = false;
    let todoMounted = false;

    // Expose a reset function so closeModal / Home can clear mounting flags
    // without destroying the session token in sessionStorage.
    window._resetSecureVaultMountState = function() {
        secureActiveTab = '';
        sheepMounted = false;
        todoMounted = false;
        prayerNotesCacheRows = [];
        prayerNotesCacheAt = 0;
        prayerNotesCacheEndpoint = '';
        prayerLoadInFlight = false;
        prayerAllRows = [];
        prayerFilteredRows = [];
        prayerCurrentPage = 1;
        prayerActiveQuickFilter = 'all';
        prayerViewMode = 'table';
        prayerRowsPerPage = 50;
    };

    const baseEndpoint = (window.AUTH_ENDPOINTS && window.AUTH_ENDPOINTS.login) || (window.MASTER_API_URL || '');
    const ownerEmail = String((window.APP_CONFIG && window.APP_CONFIG.contactEmail) || '').trim().toLowerCase();

    function setStatus(msg, kind) {
        if (!statusEl) return;
        statusEl.textContent = msg || '';
        statusEl.className = 'sv-status ' + (kind || '');
    }

    function nowMs() {
        return Date.now();
    }

    function didPageLoadFromReload() {
        try {
            if (typeof performance !== 'undefined' && typeof performance.getEntriesByType === 'function') {
                const entries = performance.getEntriesByType('navigation');
                if (entries && entries.length) {
                    return entries[0].type === 'reload';
                }
            }
            if (typeof performance !== 'undefined' && performance.navigation) {
                return Number(performance.navigation.type) === 1;
            }
        } catch (err) {
            // Ignore unsupported performance APIs.
        }
        return false;
    }

    function readSecureSessionPayload() {
        try {
            const raw = localStorage.getItem(SECURE_SESSION_KEY);
            if (!raw) return null;
            if (raw === '1') return null;
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return null;
            return parsed;
        } catch (err) {
            return null;
        }
    }

    function clearSecureSessionPayload() {
        try { localStorage.removeItem(SECURE_SESSION_KEY); } catch (err) { /* ignore */ }
    }

    function writeSecureSessionPayload(basePayload) {
        const safe = basePayload && typeof basePayload === 'object' ? basePayload : {};
        const touchedAt = nowMs();
        const providedFirstName = String(safe.firstName || '').trim();
        const providedLastName = String(safe.lastName || '').trim();
        const providedFullName = String(safe.fullName || '').trim();
        const emailLocalPart = String(safe.email || '').split('@')[0] || '';
        const emailNameParts = String(emailLocalPart || '').split(/[._\-\s]+/).filter(Boolean);
        const fallbackFirstName = emailNameParts[0] || '';
        const fallbackLastName = emailNameParts.length > 1 ? emailNameParts[emailNameParts.length - 1] : '';
        const payload = {
            token: String(safe.token || ''),
            email: String(safe.email || ''),
            role: String(safe.role || 'readonly'),
            source: String(safe.source || 'secure-local'),
            firstName: providedFirstName || fallbackFirstName,
            lastName: providedLastName || fallbackLastName,
            fullName: providedFullName,
            touchedAt,
            expiresAt: touchedAt + SECURE_SESSION_IDLE_TIMEOUT_MS
        };
        try {
            localStorage.setItem(SECURE_SESSION_KEY, JSON.stringify(payload));
        } catch (err) {
            // Ignore restricted storage contexts.
        }
        return payload;
    }

    function getSessionUpdatedByDisplay() {
        const payload = readSecureSessionPayload();
        if (!payload) return 'Staff';
        const firstName = String(payload.firstName || '').trim();
        const lastName = String(payload.lastName || '').trim();
        const fullName = String(payload.fullName || '').trim();
        const fromNames = formatFirstNameLastInitial(firstName, lastName, fullName);
        const hasStrongName = !!lastName || /\s+/.test(fullName);
        if (fromNames && fromNames !== 'Staff' && hasStrongName) return fromNames;

        const local = String(payload.email || '').split('@')[0] || '';

        const ownerEmailLocal = String(window.APP_CONFIG && window.APP_CONFIG.contactEmail ? window.APP_CONFIG.contactEmail : '')
            .trim()
            .toLowerCase()
            .split('@')[0] || '';
        const ownerName = String(window.APP_CONFIG && window.APP_CONFIG.contactName ? window.APP_CONFIG.contactName : '').trim();
        if (ownerName && local && ownerEmailLocal && local.toLowerCase() === ownerEmailLocal) {
            const fromOwner = formatFirstNameLastInitial('', '', ownerName);
            if (fromOwner && fromOwner !== 'Staff') return fromOwner;
        }

        const parts = String(local || '').split(/[._\-\s]+/).filter(Boolean);
        const fallbackFirst = parts[0] || '';
        const fallbackLast = parts.length > 1 ? parts[parts.length - 1] : '';
        return formatFirstNameLastInitial(fallbackFirst, fallbackLast, '') || 'Staff';
    }

    function getFreshSecureSessionPayload() {
        const payload = readSecureSessionPayload();
        if (!payload) return null;
        const expiresAt = Number(payload.expiresAt || 0);
        if (!expiresAt || expiresAt <= nowMs()) {
            clearSecureSessionPayload();
            return null;
        }
        return payload;
    }

    function updateSessionReuseIndicator(sessionPayload) {
        if (!sessionReuseChipEl || !sessionReuseLabelEl) return;
        const payload = sessionPayload && typeof sessionPayload === 'object' ? sessionPayload : null;
        const source = String((payload && payload.source) || '').trim().toLowerCase();
        const reused = source === 'secure-login';

        sessionReuseChipEl.classList.toggle('is-reused', reused);
        sessionReuseLabelEl.textContent = reused
            ? 'Session: Reused from Secure Login'
            : 'Session: Local Login';
    }

    function touchSecureSession() {
        const payload = getFreshSecureSessionPayload();
        if (!payload) return false;
        writeSecureSessionPayload(payload);
        return true;
    }

    function clearSessionExpiryTimer() {
        if (!sessionExpiryTimer) return;
        clearInterval(sessionExpiryTimer);
        sessionExpiryTimer = null;
    }

    function startSessionExpiryTimer() {
        clearSessionExpiryTimer();
        sessionExpiryTimer = setInterval(function() {
            const fresh = getFreshSecureSessionPayload();
            if (fresh) return;
            setStatus('Secure session timed out. Please log in again.', 'err');
            showLogin();
        }, 15000);
    }

    function maybeTouchSecureSession() {
        const now = nowMs();
        if ((now - lastSessionTouchAt) < SECURE_SESSION_TOUCH_THROTTLE_MS) return;
        if (touchSecureSession()) {
            lastSessionTouchAt = now;
        }
    }

    function handleSecureActivityEvent() {
        if (!vaultCard || vaultCard.style.display === 'none') return;
        maybeTouchSecureSession();
    }

    function bindActivityWatch() {
        if (activityWatchBound || !vaultCard) return;
        ['click', 'keydown', 'mousemove', 'touchstart', 'scroll'].forEach(function(eventName) {
            vaultCard.addEventListener(eventName, handleSecureActivityEvent, { passive: true });
        });
        activityWatchBound = true;
    }

    function unbindActivityWatch() {
        if (!activityWatchBound || !vaultCard) return;
        ['click', 'keydown', 'mousemove', 'touchstart', 'scroll'].forEach(function(eventName) {
            vaultCard.removeEventListener(eventName, handleSecureActivityEvent, { passive: true });
        });
        activityWatchBound = false;
    }

    function setPrayerStatus(msg, kind) {
        if (!prayerStatusEl) return;
        prayerStatusEl.textContent = msg || '';
        prayerStatusEl.className = 'sv-status ' + (kind || '');
    }

    function warmPrayerEndpointConnectivity(force) {
        const endpoint = String(window.PASTORAL_DB_V2_ENDPOINT || '').trim();
        if (!endpoint) return Promise.resolve(false);

        const warmAgeMs = Date.now() - prayerEndpointWarmAt;
        if (!force && prayerEndpointWarmOk && warmAgeMs < 60000) {
            return Promise.resolve(true);
        }
        if (prayerEndpointWarmInFlight) return prayerEndpointWarmInFlight;

        const sep = endpoint.includes('?') ? '&' : '?';
        const probeUrl = `${endpoint}${sep}action=health&_=${Date.now()}`;

        prayerEndpointWarmInFlight = (async function() {
            const controller = typeof AbortController === 'function' ? new AbortController() : null;
            const timeoutId = controller
                ? setTimeout(function() {
                    try { controller.abort(); } catch (err) { /* ignore */ }
                }, 4500)
                : null;

            try {
                const resp = await fetch(probeUrl, {
                    method: 'GET',
                    cache: 'no-store',
                    signal: controller ? controller.signal : undefined
                });
                prayerEndpointWarmOk = !!resp;
                prayerEndpointWarmAt = Date.now();
                return prayerEndpointWarmOk;
            } catch (err) {
                prayerEndpointWarmOk = false;
                prayerEndpointWarmAt = Date.now();
                return false;
            } finally {
                if (timeoutId) clearTimeout(timeoutId);
                prayerEndpointWarmInFlight = null;
            }
        })();

        return prayerEndpointWarmInFlight;
    }

    function invalidatePrayerNotesCache() {
        prayerNotesCacheRows = [];
        prayerNotesCacheAt = 0;
        prayerNotesCacheEndpoint = '';
    }

    function pickAny(source, candidates) {
        if (!source || typeof source !== 'object') return '';
        const keys = Object.keys(source);

        const canonicalize = function(value) {
            return String(value || '')
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '');
        };

        for (let i = 0; i < candidates.length; i += 1) {
            const token = canonicalize(candidates[i]);
            const matched = keys.find(function(k) {
                return canonicalize(k) === token;
            });
            if (matched) return String(source[matched] == null ? '' : source[matched]).trim();
        }
        return '';
    }

    function pickByIncludes(source, includesTokens) {
        if (!source || typeof source !== 'object') return '';
        const keys = Object.keys(source);

        const canonicalize = function(value) {
            return String(value || '')
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '');
        };

        for (let i = 0; i < includesTokens.length; i += 1) {
            const token = canonicalize(includesTokens[i]);
            const matched = keys.find(function(k) {
                return canonicalize(k).includes(token);
            });
            if (matched) return String(source[matched] == null ? '' : source[matched]).trim();
        }
        return '';
    }

    function parseInlinePrayerNote(value) {
        const raw = String(value == null ? '' : value).trim();
        if (!raw) return null;

        try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
                const text = String(parsed.text || parsed.note || '').trim();
                const by = String(parsed.updatedBy || parsed.by || parsed.author || '').trim();
                const submittedAt = String(parsed.updatedAt || parsed.submittedAt || parsed.at || parsed.timestamp || '').trim();
                if (text) {
                    return { text, by: by || 'Staff', submittedAt };
                }
            }
        } catch (err) {
            // Treat as non-JSON fallback below.
        }

        const byMatch = raw.match(/^Last Updated By:\s*(.+)$/im);
        const atMatch = raw.match(/^Updated At:\s*(.+)$/im);
        const cleaned = raw
            .replace(/^Last Updated By:.*$/gim, '')
            .replace(/^Updated At:.*$/gim, '')
            .trim();

        if (!cleaned) return null;
        return {
            text: cleaned,
            by: byMatch && byMatch[1] ? String(byMatch[1]).trim() : 'Staff',
            submittedAt: atMatch && atMatch[1] ? String(atMatch[1]).trim() : ''
        };
    }

    function normalizePrayerRow(row) {
        if (Array.isArray(row)) {
            const submittedAt = String(row[0] == null ? '' : row[0]).trim();
            const firstName = String(row[1] == null ? '' : row[1]).trim();
            const lastName = String(row[2] == null ? '' : row[2]).trim();
            const phone = String(row[3] == null ? '' : row[3]).trim();
            const email = String(row[4] == null ? '' : row[4]).trim();
            const prayerText = String(row[5] == null ? '' : row[5]).trim();
            const followUp = String(row[6] == null ? '' : row[6]).trim();
            const notesRaw = String(row[7] == null ? '' : row[7]).trim();
            const parsedNote = parseInlinePrayerNote(notesRaw);
            const notes = parsedNote ? parsedNote.text : notesRaw;
            const prayerNotes = parsedNote && parsedNote.text
                ? [{ text: parsedNote.text, by: parsedNote.by || 'Staff', submittedAt: parsedNote.submittedAt || '' }]
                : [];
            const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || 'Anonymous';
            return { submittedAt, fullName, email, phone, followUp, prayerText, notes, prayerNotes };
        }

        const firstName = pickAny(row, ['firstName', 'firstname', 'first_name', 'First Name']) || pickByIncludes(row, ['firstname']);
        const lastName = pickAny(row, ['lastName', 'lastname', 'last_name', 'Last Name']) || pickByIncludes(row, ['lastname']);
        const nameFromSingle = pickAny(row, ['name', 'fullName', 'fullname']) || pickByIncludes(row, ['fullname', 'name']);
        const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || nameFromSingle || 'Anonymous';
        const email = pickAny(row, ['email', 'emailAddress', 'Email Address']) || pickByIncludes(row, ['email']);
        const phone = pickAny(row, ['phone', 'phoneNumber', 'phone_number', 'Phone Number']) || pickByIncludes(row, ['phone']);
        const followUp = pickAny(row, ['followUp', 'follow_up', 'Would You Like Us to Follow Up with You?']) || pickByIncludes(row, ['followup', 'wouldyoulikeustofollowupwithyou']);
        const submittedAt = pickAny(row, ['timestamp', 'submittedAt', 'createdAt', 'date', 'Timestamp']) || pickByIncludes(row, ['timestamp', 'submitted', 'created', 'date']);
        const prayerText = pickAny(row, [
            'prayer',
            'request',
            'prayerRequest',
            'prayer_request',
            'prayerText',
            'message',
            'details',
            'How Can We Pray for You?',
            'How can we pray for you?'
        ]) || pickByIncludes(row, [
            'howcanweprayforyou',
            'prayerrequest',
            'prayertext',
            'message',
            'details',
            'prayer',
            'request'
        ]);

        const notesRaw = pickAny(row, [
            'note',
            'notes',
            'prayerNote',
            'prayerNotes',
            'prayer_note',
            'prayer_notes',
            'adminNote',
            'adminNotes',
            'admin_note',
            'admin_notes',
            'privateNote',
            'privateNotes'
        ]) || pickByIncludes(row, [
            'note',
            'notes',
            'prayernote',
            'adminnote'
        ]);

        const parsedNote = parseInlinePrayerNote(notesRaw);
        const notes = parsedNote ? parsedNote.text : notesRaw;

        const prayerNotes = Array.isArray(row && row.prayerNotes)
            ? row.prayerNotes
            : (parsedNote && parsedNote.text
                ? [{ text: parsedNote.text, by: parsedNote.by || 'Staff', submittedAt: parsedNote.submittedAt || '' }]
                : []);

        return { submittedAt, fullName, email, phone, followUp, prayerText, notes, prayerNotes };
    }

    function formatFirstNameLastInitial(firstName, lastName, fallbackFullName) {
        const first = String(firstName || '').trim();
        const last = String(lastName || '').trim();
        const full = String(fallbackFullName || '').trim();

        let pickedFirst = first;
        let pickedLast = last;

        if (!pickedFirst && full) {
            const parts = full.split(/\s+/).filter(Boolean);
            if (parts.length) pickedFirst = parts[0];
            if (!pickedLast && parts.length > 1) pickedLast = parts[parts.length - 1];
        }

        if (!pickedFirst) return 'Staff';
        const initial = pickedLast ? pickedLast.charAt(0).toUpperCase() : '';
        return initial ? `${pickedFirst} ${initial}.` : pickedFirst;
    }

    function normalizePrayerNoteRow(rowEntry) {
        const wrapped = rowEntry && typeof rowEntry === 'object'
            ? rowEntry
            : { rowIndex: 0, row: rowEntry };
        const raw = wrapped.row;

        if (Array.isArray(raw)) {
            // PrayerNotes exact headers: Row Index | Note | Updated At | Updated By
            const requestRowIndex = Number(raw[0] || 0);
            const noteText = String(raw[1] == null ? '' : raw[1]).trim();
            const noteCreatedAt = String(raw[2] == null ? '' : raw[2]).trim();
            const noteAuthor = String(raw[3] == null ? '' : raw[3]).trim();
            return {
                requestRowIndex,
                noteText,
                noteAuthor: noteAuthor || 'Staff',
                noteCreatedAt,
                requestSubmittedAt: '',
                requestEmail: '',
                requestFullName: ''
            };
        }

        const requestRowIndex = Number(pickAny(raw, [
            'Row Index',
            'requestRowIndex',
            'request_row_index',
            'rowIndex',
            'row_index',
            'index',
            'responseRowIndex',
            'response_row_index',
            'prayerRowIndex',
            'prayer_row_index'
        ]) || pickByIncludes(raw, ['rowindex', 'requestrow', 'responserow']) || 0);

        const firstName = pickAny(raw, ['firstName', 'firstname', 'first_name', 'First Name']) || pickByIncludes(raw, ['firstname', 'notebyfirstname', 'createdbyfirstname']);
        const lastName = pickAny(raw, ['lastName', 'lastname', 'last_name', 'Last Name']) || pickByIncludes(raw, ['lastname', 'notebylastname', 'createdbylastname']);
        const fullName = pickAny(raw, ['Updated By', 'name', 'fullName', 'fullname', 'authorName', 'noteAuthor', 'createdByName']) || pickByIncludes(raw, ['updatedby', 'authorname', 'createdbyname']);

        const noteText = pickAny(raw, [
            'Note',
            'note',
            'notes',
            'Pastoral_Notes',
            'pastoralNotes',
            'prayerNote',
            'prayerNotes',
            'adminNote',
            'adminNotes',
            'privateNote',
            'privateNotes',
            'text',
            'message'
        ]) || pickByIncludes(raw, ['note', 'notes', 'adminnote', 'prayernote']);

        const noteCreatedAt = pickAny(raw, ['Updated At', 'timestamp', 'createdAt', 'date', 'Timestamp']) || pickByIncludes(raw, ['updatedat', 'timestamp', 'created', 'date']);

        const requestSubmittedAt = pickAny(raw, ['requestSubmittedAt', 'requestTimestamp', 'prayerSubmittedAt']) || pickByIncludes(raw, ['requestsubmitted', 'requesttimestamp', 'prayersubmitted']);
        const requestEmail = pickAny(raw, ['requestEmail', 'prayerEmail', 'email']) || pickByIncludes(raw, ['requestemail', 'prayeremail']);
        const requestFullName = pickAny(raw, ['requestName', 'prayerName', 'requestFullName']) || pickByIncludes(raw, ['requestname', 'prayername', 'requestfullname']);

        return {
            requestRowIndex,
            noteText: String(noteText || '').trim(),
            noteAuthor: String(fullName || formatFirstNameLastInitial(firstName, lastName, fullName) || 'Staff').trim(),
            noteCreatedAt: String(noteCreatedAt || '').trim(),
            requestSubmittedAt: String(requestSubmittedAt || '').trim(),
            requestEmail: String(requestEmail || '').trim(),
            requestFullName: String(requestFullName || '').trim()
        };
    }

    function normalizeNoteAuthorDisplay(authorValue, requestFullName) {
        const rawAuthor = String(authorValue || '').trim();
        if (!rawAuthor) return 'Staff';

        const normalizedRaw = rawAuthor.toLowerCase().replace(/[^a-z0-9]/g, '');
        const session = readSecureSessionPayload();
        const sessionEmailLocal = String(session && session.email ? session.email : '')
            .trim()
            .toLowerCase()
            .split('@')[0] || '';
        const sessionDisplay = formatFirstNameLastInitial(
            String(session && session.firstName ? session.firstName : '').trim(),
            String(session && session.lastName ? session.lastName : '').trim(),
            String(session && session.fullName ? session.fullName : '').trim()
        );

        const ownerEmail = String(window.APP_CONFIG && window.APP_CONFIG.contactEmail ? window.APP_CONFIG.contactEmail : '').trim().toLowerCase();
        const ownerEmailLocal = ownerEmail.split('@')[0] || '';
        const ownerName = String(window.APP_CONFIG && window.APP_CONFIG.contactName ? window.APP_CONFIG.contactName : '').trim();
        const ownerDisplay = formatFirstNameLastInitial('', '', ownerName);

        if (normalizedRaw && ownerEmailLocal && normalizedRaw === ownerEmailLocal.replace(/[^a-z0-9]/g, '') && ownerDisplay && ownerDisplay !== 'Staff') {
            return ownerDisplay;
        }

        if (normalizedRaw && sessionEmailLocal && normalizedRaw === sessionEmailLocal.replace(/[^a-z0-9]/g, '') && sessionDisplay && sessionDisplay !== 'Staff') {
            return sessionDisplay;
        }

        if (rawAuthor.includes('@')) {
            const emailLower = rawAuthor.toLowerCase();
            const sessionEmail = String(session && session.email ? session.email : '').trim().toLowerCase();
            if (sessionEmail && sessionEmail === emailLower) {
                const fromSession = sessionDisplay;
                if (fromSession && fromSession !== 'Staff') return fromSession;
            }

            if (ownerEmail && ownerEmail === emailLower && ownerName) {
                const fromOwner = ownerDisplay;
                if (fromOwner && fromOwner !== 'Staff') return fromOwner;
            }

            const fromRequestName = formatFirstNameLastInitial('', '', requestFullName);
            if (fromRequestName && fromRequestName !== 'Staff') return fromRequestName;

            const local = rawAuthor.split('@')[0] || '';
            const parts = String(local).split(/[._\-\s]+/).filter(Boolean);
            const first = parts[0] || '';
            const last = parts.length > 1 ? parts[parts.length - 1] : '';
            return formatFirstNameLastInitial(first, last, '') || 'Staff';
        }

        // Ensure plain names are consistently shown as FirstName L.
        return formatFirstNameLastInitial('', '', rawAuthor);
    }

    function openNotesModal(rowIndex, existingNotes, personLabel, prayerText) {
        if (!notesModalEl || !notesInputEl) return;
        activeNotesRowIndex = rowIndex;
        activeNotesFallbackText = String(existingNotes || '').trim();
        activePrayerPreviewText = String(prayerText || '').trim();
        notesInputEl.value = '';
        if (notesSubEl) {
            const label = String(personLabel || '').trim();
            notesSubEl.textContent = label
                ? `Add private admin notes for ${label}.`
                : 'Add private admin notes for this request.';
        }
        if (notesPreviewEl) {
            notesPreviewEl.textContent = activePrayerPreviewText || '(No prayer text available for this row.)';
        }
        notesModalEl.classList.add('active');
        notesModalEl.setAttribute('aria-hidden', 'false');
        setTimeout(function() {
            notesInputEl.focus();
            notesInputEl.setSelectionRange(notesInputEl.value.length, notesInputEl.value.length);
        }, 0);
    }

    function closeNotesModal() {
        if (!notesModalEl || !notesInputEl) return;
        notesModalEl.classList.remove('active');
        notesModalEl.setAttribute('aria-hidden', 'true');
        notesInputEl.value = '';
        if (notesPreviewEl) notesPreviewEl.textContent = '';
        activeNotesRowIndex = null;
        activeNotesFallbackText = '';
        activePrayerPreviewText = '';
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatPrayerSubmittedAt(value) {
        const raw = String(value == null ? '' : value).trim();
        if (!raw) return '';

        const parsed = new Date(raw);
        if (Number.isNaN(parsed.getTime())) return raw;

        const pad2 = function(n) { return String(n).padStart(2, '0'); };
        const month = pad2(parsed.getMonth() + 1);
        const day = pad2(parsed.getDate());
        const year = String(parsed.getFullYear());
        return `${month}/${day}/${year}`;
    }

    function formatPrayerPhone(value) {
        const raw = String(value == null ? '' : value).trim();
        if (!raw) return '';

        const digitsOnly = raw.replace(/\D/g, '');
        const normalized = digitsOnly.length === 11 && digitsOnly.charAt(0) === '1'
            ? digitsOnly.slice(1)
            : digitsOnly;

        if (normalized.length !== 10) return raw;
        return `(${normalized.slice(0, 3)})${normalized.slice(3, 6)}-${normalized.slice(6)}`;
    }

    function normalizePhoneForSms(value) {
        const raw = String(value == null ? '' : value).trim();
        if (!raw) return '';
        const digitsOnly = raw.replace(/\D/g, '');
        if (digitsOnly.length === 11 && digitsOnly.charAt(0) === '1') {
            return `+${digitsOnly}`;
        }
        if (digitsOnly.length === 10) {
            return `+1${digitsOnly}`;
        }
        return '';
    }

    function firstNameFromLabel(label) {
        const raw = String(label || '').trim();
        if (!raw || /^anonymous$/i.test(raw)) return 'there';
        const parts = raw.split(/\s+/).filter(Boolean);
        return parts.length ? parts[0] : 'there';
    }

    function getActiveReplyChannel() {
        if (replyChannelTextEl && replyChannelTextEl.checked) return 'text';
        return 'email';
    }

    function setReplyStatus(msg, kind) {
        if (!replyStatusEl) return;
        replyStatusEl.textContent = String(msg || '');
        replyStatusEl.className = 'sv-reply-status' + (kind ? ` ${kind}` : '');
    }

    function updateReplyFormUi() {
        if (!activeReplyContext) return;
        const channel = getActiveReplyChannel();
        const canEmail = !!activeReplyContext.email;
        const canText = !!activeReplyContext.smsPhone;

        if (replyChannelEmailEl) replyChannelEmailEl.disabled = !canEmail;
        if (replyChannelTextEl) replyChannelTextEl.disabled = !canText;

        if (!canEmail && canText && replyChannelTextEl) replyChannelTextEl.checked = true;
        if (!canText && canEmail && replyChannelEmailEl) replyChannelEmailEl.checked = true;

        const selectedChannel = getActiveReplyChannel();
        const toValue = selectedChannel === 'text'
            ? (activeReplyContext.formattedPhone || activeReplyContext.phone || '')
            : (activeReplyContext.email || '');

        if (replyToEl) replyToEl.textContent = toValue || '(No recipient available)';
        if (replySubjectWrapEl) replySubjectWrapEl.style.display = selectedChannel === 'email' ? '' : 'none';
    }

    function buildReplyContext(rowIndex, personLabel, email, phone, prayerText) {
        const name = String(personLabel || '').trim() || 'Anonymous';
        const cleanEmail = String(email || '').trim();
        const cleanPhone = String(phone || '').trim();
        const formattedPhone = formatPrayerPhone(cleanPhone);
        const smsPhone = normalizePhoneForSms(cleanPhone);
        const firstName = firstNameFromLabel(name);
        const defaultSubject = 'Regarding your prayer request';
        const defaultMessage = `Hi ${firstName},\n\nThank you for sharing your prayer request. We are praying with you.\n\n- Admin Team`;
        return {
            rowIndex,
            name,
            email: cleanEmail,
            phone: cleanPhone,
            formattedPhone,
            smsPhone,
            prayerText: String(prayerText || '').trim(),
            source: 'prayer-request',
            defaultSubject,
            defaultMessage
        };
    }

    function openReplyModal(context) {
        if (!replyModalEl || !replyMessageEl || !replySubjectEl) return;
        activeReplyContext = context;

        if (replySubEl) {
            replySubEl.textContent = `Craft a response for ${context.name}.`;
        }

        if (replySubjectEl) replySubjectEl.value = context.defaultSubject;
        if (replyMessageEl) replyMessageEl.value = context.defaultMessage;
        if (replyChannelEmailEl) replyChannelEmailEl.checked = !!context.email;
        if (replyChannelTextEl) replyChannelTextEl.checked = !context.email && !!context.smsPhone;

        updateReplyFormUi();
        setReplyStatus('', '');
        replyModalEl.classList.add('active');
        replyModalEl.setAttribute('aria-hidden', 'false');

        setTimeout(function() {
            replyMessageEl.focus();
            replyMessageEl.setSelectionRange(replyMessageEl.value.length, replyMessageEl.value.length);
        }, 0);
    }

    window.openSecureReplyFormForRecipient = function(payload) {
        const safe = payload && typeof payload === 'object' ? payload : {};
        const preferredChannel = String(safe.preferredChannel || '').toLowerCase() === 'text' ? 'text' : 'email';
        const context = buildReplyContext(
            Number(safe.rowIndex || 0),
            String(safe.name || safe.fullName || 'Member'),
            String(safe.email || ''),
            String(safe.phone || ''),
            String(safe.prayerText || '')
        );

        if (!context.email && !context.smsPhone) {
            return false;
        }

        if (safe.subject) context.defaultSubject = String(safe.subject);
        if (safe.message) context.defaultMessage = String(safe.message);
        if (safe.source) context.source = String(safe.source);

        openReplyModal(context);

        if (preferredChannel === 'text' && context.smsPhone && replyChannelTextEl) {
            replyChannelTextEl.checked = true;
        } else if (context.email && replyChannelEmailEl) {
            replyChannelEmailEl.checked = true;
        }

        updateReplyFormUi();
        return true;
    };

    function closeReplyModal() {
        if (!replyModalEl) return;
        replyModalEl.classList.remove('active');
        replyModalEl.setAttribute('aria-hidden', 'true');
        setReplyStatus('', '');
        activeReplyContext = null;
        if (replySubjectEl) replySubjectEl.value = '';
        if (replyMessageEl) replyMessageEl.value = '';
        if (replyToEl) replyToEl.textContent = '';
    }

    function launchReplyComposer(channel, context, subject, message) {
        if (channel === 'text') {
            if (!context.smsPhone) throw new Error('No phone number available for text reply.');
            const smsUrl = `sms:${context.smsPhone}?&body=${encodeURIComponent(message)}`;
            window.open(smsUrl, '_blank', 'noopener');
            return;
        }

        if (!context.email) throw new Error('No email available for email reply.');
        const mailtoUrl = `mailto:${encodeURIComponent(context.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        window.open(mailtoUrl, '_blank', 'noopener');
    }

    async function appendReplyToPastoralMemberNotes(channel, context, subject, message) {
        if (!context || context.source !== 'pastoral-member') return;

        const endpoint = String(window.PASTORAL_NOTES_ENDPOINT || '').trim();
        const rowIndex = Number(context.rowIndex || 0);
        const session = getFreshSecureSessionPayload();
        if (!endpoint || !rowIndex || !session) return;

        const token = String(
            session.token ||
            session.accessToken ||
            session.authToken ||
            session.jwt ||
            ''
        ).trim();
        const email = String(session.email || '').trim().toLowerCase();
        if (!token || !email) return;

        const ts = new Date().toLocaleString();
        const channelLabel = channel === 'text' ? 'Text' : 'Email';
        const lines = [
            `[Reply ${channelLabel}] ${ts} by ${email}`,
            channel === 'email' && subject ? `Subject: ${subject}` : '',
            message
        ].filter(Boolean);
        const entry = lines.join('\n');
        const existing = String(context.prayerText || '').trim();
        const combined = existing ? `${existing}\n\n${entry}` : entry;

        const params = new URLSearchParams({
            action: 'pastoral.notes.update',
            rowIndex: String(rowIndex),
            note: combined,
            token: token,
            email: email
        });

        const res = await fetch(endpoint + '?' + params.toString(), { method: 'GET', cache: 'no-store' });
        const data = await res.json();
        if (!data || !data.ok) {
            throw new Error((data && data.message) || 'Unable to append reply to pastoral notes.');
        }

        context.prayerText = combined;
    }

    async function sendReplyFromModal() {
        if (!activeReplyContext) return;

        const channel = getActiveReplyChannel();
        const subject = String(replySubjectEl ? replySubjectEl.value : '').trim();
        const message = String(replyMessageEl ? replyMessageEl.value : '').trim();

        if (channel === 'email' && !activeReplyContext.email) {
            setReplyStatus('No recipient email is available for this request.', 'err');
            return;
        }
        if (channel === 'text' && !activeReplyContext.smsPhone) {
            setReplyStatus('No recipient phone number is available for this request.', 'err');
            return;
        }
        if (channel === 'email' && !subject) {
            setReplyStatus('Email subject is required.', 'err');
            return;
        }
        if (!message) {
            setReplyStatus('Reply message is required.', 'err');
            return;
        }

        replySendBtn.disabled = true;
        setReplyStatus('Opening your reply composer...', '');
        try {
            launchReplyComposer(channel, activeReplyContext, subject, message);
            try {
                await appendReplyToPastoralMemberNotes(channel, activeReplyContext, subject, message);
            } catch (notesErr) {
                console.warn('Pastoral note append skipped:', notesErr);
            }
            setPrayerStatus(`Reply composer opened via ${channel}.`, 'ok');
            closeReplyModal();
        } catch (err) {
            const msg = String(err && err.message ? err.message : err);
            setReplyStatus(msg, 'err');
        } finally {
            replySendBtn.disabled = false;
        }
    }

    function parsePrayerDateStamp(value) {
        const raw = String(value == null ? '' : value).trim();
        if (!raw) return null;
        const parsed = new Date(raw);
        if (Number.isNaN(parsed.getTime())) return null;
        return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).getTime();
    }

    function parseFilterDateStamp(value, endOfDay) {
        const raw = String(value == null ? '' : value).trim();
        if (!raw) return null;
        const parts = raw.split('-').map(function(part) { return Number(part); });
        if (parts.length !== 3) return null;
        const year = parts[0];
        const month = parts[1] - 1;
        const day = parts[2];
        const dt = endOfDay
            ? new Date(year, month, day, 23, 59, 59, 999)
            : new Date(year, month, day, 0, 0, 0, 0);
        if (Number.isNaN(dt.getTime())) return null;
        return dt.getTime();
    }

    function formatDateInputYmd(dateObj) {
        const year = String(dateObj.getFullYear());
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function syncQuickFilterButtons() {
        prayerQuickButtons.forEach(function(btn) {
            const token = String(btn.getAttribute('data-quick-filter') || '').trim();
            btn.classList.toggle('is-active', token === prayerActiveQuickFilter);
        });
    }

    function applyQuickPrayerFilter(kind) {
        const normalizedKind = String(kind || '').trim();
        const now = new Date();
        const todayYmd = formatDateInputYmd(now);

        if (normalizedKind === 'today') {
            if (prayerFilterSearchEl) prayerFilterSearchEl.value = '';
            if (prayerFilterFromEl) prayerFilterFromEl.value = todayYmd;
            if (prayerFilterToEl) prayerFilterToEl.value = todayYmd;
            if (prayerFilterFollowUpEl) prayerFilterFollowUpEl.value = '';
            prayerActiveQuickFilter = 'today';
        } else if (normalizedKind === 'last7') {
            const start = new Date(now);
            start.setDate(now.getDate() - 6);
            if (prayerFilterSearchEl) prayerFilterSearchEl.value = '';
            if (prayerFilterFromEl) prayerFilterFromEl.value = formatDateInputYmd(start);
            if (prayerFilterToEl) prayerFilterToEl.value = todayYmd;
            if (prayerFilterFollowUpEl) prayerFilterFollowUpEl.value = '';
            prayerActiveQuickFilter = 'last7';
        } else if (normalizedKind === 'followupYes') {
            if (prayerFilterSearchEl) prayerFilterSearchEl.value = '';
            if (prayerFilterFromEl) prayerFilterFromEl.value = '';
            if (prayerFilterToEl) prayerFilterToEl.value = '';
            if (prayerFilterFollowUpEl) prayerFilterFollowUpEl.value = 'yes';
            prayerActiveQuickFilter = 'followupYes';
        } else {
            if (prayerFilterSearchEl) prayerFilterSearchEl.value = '';
            if (prayerFilterFromEl) prayerFilterFromEl.value = '';
            if (prayerFilterToEl) prayerFilterToEl.value = '';
            if (prayerFilterFollowUpEl) prayerFilterFollowUpEl.value = '';
            prayerActiveQuickFilter = 'all';
        }

        prayerCurrentPage = 1;
        syncQuickFilterButtons();
        applyPrayerFiltersAndRender();
    }

    function doesPrayerRowMatchFilters(item) {
        const searchToken = String(prayerFilterSearchEl && prayerFilterSearchEl.value ? prayerFilterSearchEl.value : '').trim().toLowerCase();
        const followUpToken = String(prayerFilterFollowUpEl && prayerFilterFollowUpEl.value ? prayerFilterFollowUpEl.value : '').trim().toLowerCase();
        const fromStamp = parseFilterDateStamp(prayerFilterFromEl ? prayerFilterFromEl.value : '', false);
        const toStamp = parseFilterDateStamp(prayerFilterToEl ? prayerFilterToEl.value : '', true);

        if (searchToken) {
            const haystack = [
                item.fullName,
                item.email,
                item.phone,
                item.followUp,
                item.prayerText,
                item.notes,
                item.submittedAt
            ].map(function(v) { return String(v || '').toLowerCase(); }).join(' ');
            if (!haystack.includes(searchToken)) return false;
        }

        if (followUpToken) {
            const raw = String(item.followUp || '').trim().toLowerCase();
            const affirmative = /^(yes|y|true|1|sure|ok)$/i.test(raw);
            if (followUpToken === 'yes' && !affirmative) return false;
            if (followUpToken === 'no' && affirmative) return false;
        }

        if (fromStamp != null || toStamp != null) {
            const rowStamp = parsePrayerDateStamp(item.submittedAt);
            if (rowStamp == null) return false;
            if (fromStamp != null && rowStamp < fromStamp) return false;
            if (toStamp != null && rowStamp > toStamp) return false;
        }

        return true;
    }

    function renderPrayerPagination(totalRows) {
        if (!prayerPaginationEl) return;
        const safePerPage = Math.max(1, Number(prayerRowsPerPage) || 10);
        const totalPages = Math.max(1, Math.ceil(totalRows / safePerPage));
        if (prayerCurrentPage > totalPages) prayerCurrentPage = totalPages;

        const windowStart = Math.max(1, prayerCurrentPage - 2);
        const windowEnd = Math.min(totalPages, windowStart + 4);
        const pageButtons = [];

        for (let page = windowStart; page <= windowEnd; page += 1) {
            const active = page === prayerCurrentPage ? ' is-active' : '';
            pageButtons.push(`<button type="button" class="sv-prayer-page-btn${active}" data-page="${page}">${page}</button>`);
        }

        prayerPaginationEl.innerHTML = [
            `<button type="button" class="sv-prayer-page-btn" data-page="prev" ${prayerCurrentPage <= 1 ? 'disabled' : ''}>Prev</button>`,
            pageButtons.join(''),
            `<button type="button" class="sv-prayer-page-btn" data-page="next" ${prayerCurrentPage >= totalPages ? 'disabled' : ''}>Next</button>`
        ].join('');

        prayerPaginationEl.querySelectorAll('.sv-prayer-page-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                if (this.hasAttribute('disabled')) return;
                const target = String(this.getAttribute('data-page') || '').trim();
                if (!target) return;

                if (target === 'prev') prayerCurrentPage = Math.max(1, prayerCurrentPage - 1);
                else if (target === 'next') prayerCurrentPage = Math.min(totalPages, prayerCurrentPage + 1);
                else prayerCurrentPage = Math.min(totalPages, Math.max(1, Number(target) || 1));

                applyPrayerFiltersAndRender();
            });
        });
    }

    function renderPrayerSummary(totalRows, visibleRows, totalPages) {
        if (!prayerListSummaryEl) return;
        if (!totalRows) {
            prayerListSummaryEl.textContent = 'No matching requests.';
            return;
        }

        const pageStart = ((prayerCurrentPage - 1) * prayerRowsPerPage) + 1;
        const pageEnd = Math.min(totalRows, pageStart + visibleRows - 1);
        prayerListSummaryEl.textContent = `Showing ${pageStart}-${pageEnd} of ${totalRows} request(s) • Page ${prayerCurrentPage}/${totalPages}`;
    }

    function applyPrayerFiltersAndRender() {
        const source = Array.isArray(prayerAllRows) ? prayerAllRows : [];
        prayerFilteredRows = source.filter(doesPrayerRowMatchFilters);

        const totalRows = prayerFilteredRows.length;
        const safePerPage = Math.max(1, Number(prayerRowsPerPage) || 10);
        const totalPages = Math.max(1, Math.ceil(totalRows / safePerPage));
        if (prayerCurrentPage > totalPages) prayerCurrentPage = totalPages;
        if (prayerCurrentPage < 1) prayerCurrentPage = 1;

        prayerRender();
        renderPrayerPagination(totalRows);
        renderPrayerSummary(totalRows, prayerFilteredRows.slice((prayerCurrentPage - 1) * safePerPage, prayerCurrentPage * safePerPage).length, totalPages);
        syncQuickFilterButtons();
    }

    function prayerIsMobileViewport() {
        try {
            return window.matchMedia('(max-width: 900px)').matches;
        } catch (err) {
            return window.innerWidth <= 900;
        }
    }

    function prayerTableWouldOverflow() {
        const tableWrap = document.getElementById('sv-prayer-table-wrap');
        const table = document.querySelector('.sv-prayer-table');
        if (!tableWrap || !table) return false;

        let restore = false;
        const isHidden = window.getComputedStyle(tableWrap).display === 'none';
        if (isHidden) {
            tableWrap.style.display = '';
            tableWrap.style.visibility = 'hidden';
            restore = true;
        }

        const overflow = table.scrollWidth > (tableWrap.clientWidth + 1);

        if (restore) {
            tableWrap.style.display = 'none';
            tableWrap.style.visibility = '';
        }

        return overflow;
    }

    function prayerRender() {
        const forceCards = prayerViewMode === 'table' && (prayerIsMobileViewport() || prayerTableWouldOverflow());
        prayerAutoCards = forceCards;

        if (prayerViewMode === 'cards' || forceCards) {
            renderPrayerCards();
            return;
        }
        renderPrayerTable();
    }

    function renderPrayerTable() {
        const tbody = document.getElementById('sv-prayer-tbody');
        const tableWrap = document.getElementById('sv-prayer-table-wrap');
        const cardsWrap = document.getElementById('sv-prayer-cards-wrap');
        if (!tbody) return;

        if (tableWrap) tableWrap.style.display = '';
        if (cardsWrap) cardsWrap.style.display = 'none';

        const rows = prayerFilteredRows.slice((prayerCurrentPage - 1) * prayerRowsPerPage, prayerCurrentPage * prayerRowsPerPage);
        if (!rows.length) {
            tbody.innerHTML = `<tr><td colspan="5" style="padding: 22px 12px; text-align: center; color: #94a3b8;">No prayer requests match the current filters.</td></tr>`;
            return;
        }

        tbody.innerHTML = '';
        rows.forEach(function(row) {
            tbody.appendChild(buildPrayerTableRow(row));
        });
    }

    function buildPrayerTableRow(item) {
        const tr = document.createElement('tr');
        const submittedAt = formatPrayerSubmittedAt(item.submittedAt);
        const prayerText = item.prayerText || '(No prayer text)';
        const prayerPreview = prayerText.length > 80 ? prayerText.substring(0, 80) + '...' : prayerText;

        // Submitted date
        const tdDate = document.createElement('td');
        tdDate.textContent = submittedAt || '—';
        tr.appendChild(tdDate);

        // Name
        const tdName = document.createElement('td');
        tdName.textContent = item.fullName || '—';
        tr.appendChild(tdName);

        // Follow-up
        const tdFollowUp = document.createElement('td');
        tdFollowUp.textContent = item.followUp || '—';
        tr.appendChild(tdFollowUp);

        // Prayer text (truncated)
        const tdPrayer = document.createElement('td');
        tdPrayer.className = 'sv-prayer-td-prayer';
        tdPrayer.textContent = prayerPreview;
        tdPrayer.title = prayerText;

        const metaLine = document.createElement('div');
        metaLine.className = 'sv-prayer-td-meta';

        const emailPill = document.createElement('span');
        emailPill.className = 'sv-prayer-mini-pill';
        emailPill.textContent = `Email: ${maskPrayerEmail(item.email)}`;
        metaLine.appendChild(emailPill);

        const phonePill = document.createElement('span');
        phonePill.className = 'sv-prayer-mini-pill';
        phonePill.textContent = `Phone: ${maskPrayerPhone(item.phone)}`;
        metaLine.appendChild(phonePill);

        const notesCount = Array.isArray(item.prayerNotes) ? item.prayerNotes.length : (item.notes ? 1 : 0);
        const notesPill = document.createElement('span');
        notesPill.className = 'sv-prayer-mini-pill';
        notesPill.textContent = `Notes: ${notesCount}`;
        metaLine.appendChild(notesPill);

        tdPrayer.appendChild(metaLine);
        tr.appendChild(tdPrayer);

        // Actions
        const tdActions = document.createElement('td');
        tdActions.className = 'sv-prayer-td-actions';

        const replyBtn = document.createElement('button');
        replyBtn.type = 'button';
        replyBtn.className = 'sv-prayer-btn';
        replyBtn.textContent = '✉️';
        replyBtn.title = 'Reply';
        replyBtn.addEventListener('click', function() {
            const name = item.fullName || '';
            const email = item.email || '';
            const phone = item.phone || '';
            const prayer = item.prayerText || '';
            const context = buildReplyContext(item.rowIndex, name, email, phone, prayer);
            openReplyModal(context);
        });
        tdActions.appendChild(replyBtn);

        const noteBtn = document.createElement('button');
        noteBtn.type = 'button';
        noteBtn.className = 'sv-prayer-btn';
        noteBtn.textContent = '🐑';
        noteBtn.title = 'Add Note';
        noteBtn.addEventListener('click', function() {
            const latestNote = Array.isArray(item.prayerNotes) && item.prayerNotes.length
                ? String(item.prayerNotes[item.prayerNotes.length - 1].text || '').trim()
                : String(item.notes || '').trim();
            editPrayerNotesHandler(item.rowIndex, latestNote, item.fullName || '', item.prayerText || '');
        });
        tdActions.appendChild(noteBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'sv-prayer-btn';
        deleteBtn.textContent = '🗑️';
        deleteBtn.title = 'Delete';
        deleteBtn.addEventListener('click', function() {
            const confirmed = confirm('Delete this prayer request?');
            if (confirmed) deletePrayerRequestHandler(item.rowIndex);
        });
        tdActions.appendChild(deleteBtn);

        tr.appendChild(tdActions);
        return tr;
    }

    function renderPrayerCards() {
        let cardsWrap = document.getElementById('sv-prayer-cards-wrap');
        if (!cardsWrap) {
            cardsWrap = document.createElement('div');
            cardsWrap.id = 'sv-prayer-cards-wrap';
            cardsWrap.className = 'sv-prayer-cards-wrap';
            const listEl = document.getElementById('sv-prayer-list');
            if (listEl) {
                listEl.parentNode.insertBefore(cardsWrap, listEl.nextSibling);
            }
        }

        const tableWrap = document.getElementById('sv-prayer-table-wrap');
        if (tableWrap) tableWrap.style.display = 'none';
        cardsWrap.style.display = '';

        const rows = prayerFilteredRows.slice((prayerCurrentPage - 1) * prayerRowsPerPage, prayerCurrentPage * prayerRowsPerPage);
        if (!rows.length) {
            cardsWrap.innerHTML = `<div style="padding: 22px 12px; text-align: center; color: #94a3b8;">No prayer requests match the current filters.</div>`;
            return;
        }

        cardsWrap.innerHTML = '';
        rows.forEach(function(row) {
            cardsWrap.appendChild(buildPrayerCard(row));
        });
    }

    function maskPrayerEmail(emailValue) {
        const email = String(emailValue || '').trim();
        if (!email || email.indexOf('@') === -1) return 'Email hidden';
        const parts = email.split('@');
        const user = parts[0] || '';
        const domain = parts[1] || '';
        const safeUser = user.length <= 2 ? `${user.charAt(0) || '*'}*` : `${user.slice(0, 2)}***`;
        return `${safeUser}@${domain}`;
    }

    function maskPrayerPhone(phoneValue) {
        const digits = String(phoneValue || '').replace(/\D/g, '');
        if (!digits) return 'Phone hidden';
        if (digits.length < 4) return '••••';
        return `•••-•••-${digits.slice(-4)}`;
    }

    function normalizeFollowUpChip(value) {
        const raw = String(value || '').trim().toLowerCase();
        if (raw === 'yes' || raw === 'y' || raw === 'true') return 'yes';
        if (raw === 'no' || raw === 'n' || raw === 'false') return 'no';
        return 'unknown';
    }

    function buildShieldRow(labelText, maskedValue, fullValue) {
        const row = document.createElement('div');
        row.className = 'sv-prayer-shield-row';

        const label = document.createElement('span');
        label.className = 'sv-prayer-shield-label';
        label.textContent = labelText;
        row.appendChild(label);

        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = 'sv-prayer-shield-pill';
        pill.textContent = String(maskedValue || '').trim() || 'Hidden';

        const safeFull = String(fullValue || '').trim();
        if (!safeFull) {
            pill.disabled = true;
            pill.style.opacity = '0.55';
            pill.style.cursor = 'default';
            pill.textContent = 'Not provided';
        } else {
            pill.addEventListener('click', function(e) {
                e.stopPropagation();
                if (pill.classList.contains('is-revealed')) return;
                pill.classList.add('is-revealed');
                pill.textContent = safeFull;
                pill.setAttribute('aria-label', `${labelText} revealed`);
            });
        }

        row.appendChild(pill);
        return row;
    }

    function buildPrayerCard(item) {
        const card = document.createElement('article');
        card.className = 'sv-prayer-card';

        const headBtn = document.createElement('button');
        headBtn.type = 'button';
        headBtn.className = 'sv-prayer-card-head';

        const info = document.createElement('div');
        info.className = 'sv-prayer-card-head-info';

        const name = document.createElement('div');
        name.className = 'sv-prayer-card-head-name';
        name.textContent = item.fullName || 'Anonymous';
        info.appendChild(name);

        const date = document.createElement('div');
        date.className = 'sv-prayer-card-head-date';
        date.textContent = formatPrayerSubmittedAt(item.submittedAt) || 'No date';
        info.appendChild(date);

        const chev = document.createElement('span');
        chev.className = 'sv-prayer-card-chevron';
        chev.textContent = '▼';

        headBtn.appendChild(info);
        headBtn.appendChild(chev);
        headBtn.addEventListener('click', function() {
            const shouldOpen = !card.classList.contains('is-open');
            const wrap = card.parentElement;
            if (wrap) {
                wrap.querySelectorAll('.sv-prayer-card.is-open').forEach(function(openCard) {
                    openCard.classList.remove('is-open');
                    var ob = openCard.querySelector('.sv-prayer-card-body');
                    if (ob) ob.style.display = 'none';
                });
            }
            card.classList.toggle('is-open', shouldOpen);
            body.style.display = shouldOpen ? 'grid' : 'none';
        });

        const body = document.createElement('div');
        body.className = 'sv-prayer-card-body';

        const followUpState = normalizeFollowUpChip(item.followUp);
        const followUpChip = document.createElement('span');
        followUpChip.className = `sv-prayer-followup-chip ${followUpState === 'yes' ? 'is-yes' : (followUpState === 'no' ? 'is-no' : '')}`;
        followUpChip.textContent = followUpState === 'yes'
            ? 'Follow-up: Yes'
            : (followUpState === 'no' ? 'Follow-up: No' : `Follow-up: ${String(item.followUp || 'Unknown')}`);
        body.appendChild(followUpChip);

        const meta = document.createElement('div');
        meta.className = 'sv-prayer-card-meta';
        meta.appendChild(buildShieldRow('Email', maskPrayerEmail(item.email), item.email));
        meta.appendChild(buildShieldRow('Phone', maskPrayerPhone(item.phone), formatPrayerPhone(item.phone)));
        body.appendChild(meta);

        const prayer = document.createElement('p');
        prayer.className = 'sv-prayer-card-prayer';
        prayer.textContent = item.prayerText || '(No prayer text)';
        body.appendChild(prayer);

        const noteItems = Array.isArray(item.prayerNotes) && item.prayerNotes.length ? item.prayerNotes : (item.notes ? [{ text: item.notes, by: 'Staff' }] : []);
        if (noteItems.length) {
            noteItems.forEach(function(note) {
                const noteDiv = document.createElement('div');
                noteDiv.className = 'sv-prayer-card-notes';
                const noteText = String(note && note.text ? note.text : '').trim();
                const noteBy = String(note && note.by ? note.by : 'Staff').trim();

                const noteHead = document.createElement('div');
                noteHead.className = 'sv-prayer-card-notes-head';

                const noteAuthor = document.createElement('strong');
                noteAuthor.textContent = noteBy;
                noteHead.appendChild(noteAuthor);

                const revealBtn = document.createElement('button');
                revealBtn.type = 'button';
                revealBtn.className = 'sv-prayer-note-reveal-btn';
                revealBtn.textContent = 'Reveal Note';
                noteHead.appendChild(revealBtn);

                const noteTextEl = document.createElement('div');
                noteTextEl.className = 'sv-prayer-card-note-text is-shielded';
                noteTextEl.textContent = noteText || '(No note text)';

                revealBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    noteTextEl.classList.remove('is-shielded');
                    revealBtn.textContent = 'Visible';
                    revealBtn.disabled = true;
                });

                noteDiv.appendChild(noteHead);
                noteDiv.appendChild(noteTextEl);
                body.appendChild(noteDiv);
            });
        }

        const actions = document.createElement('div');
        actions.className = 'sv-prayer-card-actions';

        const replyBtn = document.createElement('button');
        replyBtn.type = 'button';
        replyBtn.className = 'sv-prayer-btn';
        replyBtn.textContent = '✉️ Reply';
        replyBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const context = buildReplyContext(item.rowIndex, item.fullName || '', item.email || '', item.phone || '', item.prayerText || '');
            openReplyModal(context);
        });
        actions.appendChild(replyBtn);

        const noteBtn = document.createElement('button');
        noteBtn.type = 'button';
        noteBtn.className = 'sv-prayer-btn';
        noteBtn.textContent = '🐑 Add Note';
        noteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const latestNote = Array.isArray(item.prayerNotes) && item.prayerNotes.length
                ? String(item.prayerNotes[item.prayerNotes.length - 1].text || '').trim()
                : String(item.notes || '').trim();
            editPrayerNotesHandler(item.rowIndex, latestNote, item.fullName || '', item.prayerText || '');
        });
        actions.appendChild(noteBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'sv-prayer-btn';
        deleteBtn.textContent = '🗑️ Delete';
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const confirmed = confirm('Delete this prayer request?');
            if (confirmed) deletePrayerRequestHandler(item.rowIndex);
        });
        actions.appendChild(deleteBtn);

        body.appendChild(actions);
        card.appendChild(headBtn);
        card.appendChild(body);
        return card;
    }

    function renderPrayerRowsOld(rows) {
        if (!prayerListEl) return;
        const source = Array.isArray(rows) ? rows : [];
        if (!source.length) {
            prayerListEl.innerHTML = '';
            return;
        }

        prayerListEl.innerHTML = '';
        return;
    }

    function renderPrayerRowsLegacy(source) {
        prayerListEl.innerHTML = source.map(function(item) {
            const submittedAt = formatPrayerSubmittedAt(item.submittedAt);
            const meta = [
                submittedAt ? `<span>${escapeHtml(submittedAt)}</span>` : '',
                item.fullName ? `<span>${escapeHtml(item.fullName)}</span>` : '',
                item.email
                    ? `<button type="button" class="sv-prayer-email-pill" data-email="${escapeHtml(item.email)}" aria-label="Reveal submitter email">Click to Reveal</button>`
                    : '',
                item.phone
                    ? `<button type="button" class="sv-prayer-phone-pill" data-phone="${escapeHtml(formatPrayerPhone(item.phone))}" aria-label="Reveal submitter phone number">Click to Reveal</button>`
                    : '',
                item.followUp ? `<span>Follow-up: ${escapeHtml(item.followUp)}</span>` : ''
            ].filter(Boolean).join('');

            const body = item.prayerText || '(No prayer text found in this row.)';
            const noteItems = Array.isArray(item.prayerNotes) && item.prayerNotes.length
                ? item.prayerNotes
                : (item.notes ? [{ text: item.notes, by: 'Staff', submittedAt: '' }] : []);

            const notesHtml = noteItems.length
                ? `<div class="sv-prayer-notes-list">${noteItems.map(function(note) {
                    const noteText = String(note && note.text ? note.text : '').trim();
                    if (!noteText) return '';
                    const noteByRaw = String(note && note.by ? note.by : 'Staff').trim();
                    const noteBy = normalizeNoteAuthorDisplay(noteByRaw, item.fullName) || 'Staff';
                    const noteAtRaw = String(note && (note.rawSubmittedAt || note.submittedAt) ? (note.rawSubmittedAt || note.submittedAt) : '').trim();
                    const noteAt = formatPrayerSubmittedAt(noteAtRaw);
                    const noteAtHtml = noteAt ? `<span class="sv-prayer-note-time">${escapeHtml(noteAt)}</span>` : '';
                    return `<div class="sv-prayer-note-entry"><div class="sv-prayer-note-head"><span class="sv-prayer-note-author">Last Updated By: ${escapeHtml(noteBy)}</span>${noteAtHtml}</div><div class="sv-prayer-note-text">${escapeHtml(noteText)}</div></div>`;
                }).join('')}</div>`
                : '';

            const latestNote = noteItems.length
                ? String(noteItems[noteItems.length - 1].text || '').trim()
                : String(item.notes || '').trim();
            return `<article class="sv-prayer-item" data-row-idx="${item.rowIndex}">
                <div class="sv-prayer-meta">${meta}</div>
                <p class="sv-prayer-body">${escapeHtml(body)}</p>
                ${notesHtml}
                <div style="display:flex; gap:8px; margin-top:10px;">
                    <button type="button" class="sv-prayer-btn sv-prayer-reply-btn" data-row-idx="${item.rowIndex}" data-name="${escapeHtml(item.fullName || '')}" data-email="${escapeHtml(item.email || '')}" data-phone="${escapeHtml(item.phone || '')}" data-prayer="${escapeHtml(body)}" title="Craft a reply">✉️ Reply</button>
                    <button type="button" class="sv-prayer-btn sv-prayer-notes-btn" data-row-idx="${item.rowIndex}" data-notes="${escapeHtml(latestNote)}" data-name="${escapeHtml(item.fullName || '')}" data-prayer="${escapeHtml(body)}" title="Add a pastoral note">🐑 Add Note</button>
                    <button type="button" class="sv-prayer-btn sv-prayer-delete-btn" data-row-idx="${item.rowIndex}" title="Delete this request">🗑️ Delete</button>
                </div>
            </article>`;
        }).join('');

        prayerListEl.querySelectorAll('.sv-prayer-delete-btn').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                const rowIdx = this.getAttribute('data-row-idx');
                const confirmed = confirm('Are you sure you want to delete this prayer request?');
                if (!confirmed) return;
                await deletePrayerRequestHandler(rowIdx);
            });
        });

        prayerListEl.querySelectorAll('.sv-prayer-notes-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const rowIdx = this.getAttribute('data-row-idx');
                const existingNotes = this.getAttribute('data-notes') || '';
                const fullName = this.getAttribute('data-name') || '';
                const prayerText = this.getAttribute('data-prayer') || '';
                editPrayerNotesHandler(rowIdx, existingNotes, fullName, prayerText);
            });
        });

        prayerListEl.querySelectorAll('.sv-prayer-reply-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const rowIndex = Number(this.getAttribute('data-row-idx') || 0);
                const name = this.getAttribute('data-name') || '';
                const email = this.getAttribute('data-email') || '';
                const phone = this.getAttribute('data-phone') || '';
                const prayerText = this.getAttribute('data-prayer') || '';
                const context = buildReplyContext(rowIndex, name, email, phone, prayerText);
                openReplyModal(context);
            });
        });

        prayerListEl.querySelectorAll('.sv-prayer-email-pill').forEach(function(btn) {
            btn.addEventListener('click', function() {
                if (this.classList.contains('is-revealed')) return;
                const email = String(this.getAttribute('data-email') || '').trim();
                if (!email) return;
                this.textContent = email;
                this.classList.add('is-revealed');
                this.setAttribute('aria-label', 'Submitter email revealed');
            });
        });

        prayerListEl.querySelectorAll('.sv-prayer-phone-pill').forEach(function(btn) {
            btn.addEventListener('click', function() {
                if (this.classList.contains('is-revealed')) return;
                const phone = String(this.getAttribute('data-phone') || '').trim();
                if (!phone) return;
                this.textContent = phone;
                this.classList.add('is-revealed');
                this.setAttribute('aria-label', 'Submitter phone number revealed');
            });
        });

    }

    function renderPrayerRequests(rows) {
        const source = Array.isArray(rows) ? rows : [];
        prayerCurrentPage = 1;

        if (!source.length) {
            prayerAllRows = [];
            prayerFilteredRows = [];
            prayerRender();
            renderPrayerPagination(0);
            renderPrayerSummary(0, 0, 1);
            return;
        }

        prayerAllRows = source.map((entry, idx) => {
            const hasWrappedRow = entry && typeof entry === 'object' && Object.prototype.hasOwnProperty.call(entry, 'row');
            const rawRow = hasWrappedRow ? entry.row : entry;
            const explicitRowIndex = hasWrappedRow ? Number(entry.rowIndex || 0) : 0;
            const rowIndex = explicitRowIndex > 0 ? explicitRowIndex : (idx + 2);
            return { ...normalizePrayerRow(rawRow), rowIndex };
        }).reverse();

        applyPrayerFiltersAndRender();
    }

    function renderVaultLinks() {
        const grid = document.getElementById('sv-links-grid');
        if (!grid) return;

        function ensureSheepWorkspaceLoaded() {
            if (!sheepHostEl) return false;
            if (sheepMounted) return true;

            if (typeof openPastoralApp !== 'function') {
                sheepHostEl.innerHTML = '<div class="sv-empty" style="padding:22px 12px;">Sheep app is not available in this build.</div>';
                setPrayerStatus('Sheep app is not available in this build.', 'err');
                return false;
            }

            openPastoralApp({ hostElement: sheepHostEl });
            sheepMounted = true;
            return true;
        }

        function ensureTodoWorkspaceLoaded() {
            if (!todoHostEl) return false;
            if (todoMounted) return true;

            if (typeof openTodoApp !== 'function') {
                setTimeout(function() {
                    if (!todoMounted && typeof openTodoApp === 'function') {
                        openTodoApp({ hostElement: todoHostEl });
                        todoMounted = true;
                    }
                }, 1500);
                return false;
            }

            openTodoApp({ hostElement: todoHostEl });
            todoMounted = true;
            return true;
        }

        function setSecureTab(tabKey) {
            secureActiveTab = String(tabKey || '').trim().toLowerCase();

            var welcomeEl = document.getElementById('sv-welcome-message');
            if (welcomeEl) welcomeEl.style.display = secureActiveTab ? 'none' : '';

            grid.querySelectorAll('.sv-app-item[data-tab-key]').forEach(function(btn) {
                btn.classList.toggle('sv-app-active', btn.getAttribute('data-tab-key') === secureActiveTab);
            });

            if (prayerWrapEl) prayerWrapEl.style.display = secureActiveTab === 'prayer-response' ? '' : 'none';
            if (sheepWrapEl) sheepWrapEl.style.display = secureActiveTab === 'sheep' ? '' : 'none';
            if (mirrorWrapEl) mirrorWrapEl.style.display = secureActiveTab === 'mirror' ? '' : 'none';
            if (todoWrapEl) todoWrapEl.style.display = secureActiveTab === 'todo' ? '' : 'none';

            if (secureActiveTab === 'prayer-response') {
                loadPrayerRequests();
            } else if (secureActiveTab === 'sheep') {
                ensureSheepWorkspaceLoaded();
            } else if (secureActiveTab === 'todo') {
                ensureTodoWorkspaceLoaded();
            }
        }

        // ── Build the home-screen-style app grid ──

        // Define sections + their apps (same order as SECURE_VAULT_LINKS, grouped)
        const sections = [
            {
                heading: 'Pastoral Care',
                apps: [
                    { icon: '✉️', label: 'PRAYER<br>RESPONSE', tabKey: 'prayer-response' },
                    { icon: '🐑', label: 'THE<br>FLOCK', tabKey: 'sheep' },
                    { icon: '🔬', label: 'PASTORAL<br>MIRROR', tabKey: 'mirror' }
                ]
            },
            {
                heading: 'Operations',
                apps: [
                    { icon: '✅', label: 'TO DO<br>LIST', tabKey: 'todo' },
                    { icon: '🙏', label: 'PRAYER<br>ADMIN', action: 'prayer-admin' },
                    { icon: '🔐', label: 'ADMIN<br>PROVISION', action: 'admin-provision' }
                ]
            },
            {
                heading: 'Resources',
                apps: [
                    { icon: '📁', label: 'DRIVE<br>VAULT', url: 'https://drive.google.com/drive/folders/1A-g8KEWAKCMGdgn3WgfSjKpHEA0wgKuc?usp=drive_link' }
                ]
            }
        ];

        // Append additional entries from SECURE_VAULT_LINKS that aren't already covered
        const coveredApps = new Set(['prayer-response', 'pastoral', 'mirror', 'todo', 'admin-provision']);
        const extraLinks = (Array.isArray(SECURE_VAULT_LINKS) ? SECURE_VAULT_LINKS : []).filter(function(item) {
            const appKey = String(item && item.app || '').trim().toLowerCase();
            const title = String(item && item.title || '').trim().toLowerCase();
            if (title === 'open pastoral map') return false;
            if (coveredApps.has(appKey)) return false;
            if (appKey === 'pastoral-care' || appKey === 'sheep' || appKey === 'the-flock') return false;
            if (appKey === 'todo-list' || appKey === 'to-do') return false;
            // Skip Drive Vault (already in Resources)
            if (!appKey && item.url && String(item.url).includes('drive.google.com')) return false;
            return true;
        });
        if (extraLinks.length) {
            const extraApps = extraLinks.map(function(item) {
                return {
                    icon: item.icon || '🔗',
                    label: String(item.title || 'Link').toUpperCase().replace(/\s+/g, '<br>'),
                    url: item.url && item.url !== '#' ? item.url : undefined,
                    action: item.app || undefined
                };
            });
            sections.push({ heading: 'More', apps: extraApps });
        }

        grid.innerHTML = '';

        sections.forEach(function(section) {
            if (!section.apps || !section.apps.length) return;

            const sectionEl = document.createElement('section');
            sectionEl.className = 'sv-home-section';

            const headEl = document.createElement('h3');
            headEl.className = 'sv-home-section-head';
            headEl.innerHTML = '<span class="sv-home-dot"></span>' + section.heading;
            sectionEl.appendChild(headEl);

            const gridEl = document.createElement('div');
            gridEl.className = 'sv-home-section-grid';

            section.apps.forEach(function(app) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'sv-app-item';

                if (app.tabKey) {
                    btn.setAttribute('data-tab-key', app.tabKey);
                    btn.addEventListener('click', function() {
                        setSecureTab(app.tabKey);
                    });
                } else if (app.action === 'admin-provision') {
                    btn.addEventListener('click', function() {
                        if (typeof openAdminProvisionApp === 'function') {
                            openAdminProvisionApp();
                        } else {
                            setPrayerStatus('Admin app is not available in this build.', 'err');
                        }
                    });
                } else if (app.action === 'prayer-admin') {
                    btn.addEventListener('click', function() {
                        if (typeof openPrayerAdminApp === 'function') {
                            openPrayerAdminApp();
                        } else {
                            setPrayerStatus('Prayer Admin app is not available in this build.', 'err');
                        }
                    });
                } else if (app.url) {
                    btn.addEventListener('click', function() {
                        window.open(app.url, '_blank', 'noopener,noreferrer');
                    });
                }

                btn.innerHTML =
                    '<div class="sv-app-icon">' + (app.icon || '🔗') + '</div>' +
                    '<div class="sv-app-label">' + (app.label || 'APP') + '</div>';

                gridEl.appendChild(btn);
            });

            sectionEl.appendChild(gridEl);
            grid.appendChild(sectionEl);
        });

        setSecureTab(secureActiveTab || '');

        // Warm-load sub-app data in the background on vault unlock.
        try { ensureSheepWorkspaceLoaded(); } catch (e) { /* non-blocking */ }
        try { loadPrayerRequests(); } catch (e) { /* non-blocking */ }
        try { ensureTodoWorkspaceLoaded(); } catch (e) { /* non-blocking */ }
    }

    async function deletePrayerRequestHandler(rowIndex) {
        try {
            const endpoint = window.PASTORAL_DB_V2_ENDPOINT || '';
            const sessionData = readSecureSessionPayload();
            const userEmail = sessionData ? sessionData.email : '';
            const token = sessionData ? sessionData.token : '';

            if (!endpoint) throw new Error('Prayer request endpoint not configured.');
            if (!userEmail || !token) throw new Error('Not authenticated.');

            const resp = await fetch(endpoint + '?action=prayer.archive'
                + '&token=' + encodeURIComponent(token)
                + '&authEmail=' + encodeURIComponent(userEmail)
                + '&rowIndex=' + rowIndex, {
                method: 'GET',
                cache: 'no-store'
            });

            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

            const result = await resp.json();
            if (!result.ok) throw new Error(result.message || 'Failed to archive.');

            setPrayerStatus('Prayer request archived.', 'ok');
            invalidatePrayerNotesCache();
            await loadPrayerRequests();
        } catch (err) {
            const message = String(err && err.message ? err.message : err);
            setPrayerStatus(`Failed to archive request: ${message}`, 'err');
        }
    }

    function editPrayerNotesHandler(rowIndex, existingNotes, personLabel, prayerText) {
        openNotesModal(rowIndex, existingNotes, personLabel, prayerText);
    }

    async function updatePrayerNotesHandler(rowIndex, notes) {
        try {
            const endpoint = window.PASTORAL_DB_V2_ENDPOINT || '';
            const sessionData = readSecureSessionPayload();
            const userEmail = sessionData ? sessionData.email : '';
            const token = sessionData ? sessionData.token : '';
            const updatedBy = getSessionUpdatedByDisplay();

            if (!endpoint) throw new Error('Prayer request endpoint not configured.');
            if (!userEmail || !token) throw new Error('Not authenticated.');

            // Build combined admin notes: append new entry to existing
            const timestamp = new Date().toLocaleString();
            const newEntry = '[' + updatedBy + ' \u00B7 ' + timestamp + ']\n' + notes;
            const combined = activeNotesFallbackText
                ? activeNotesFallbackText + '\n\n' + newEntry
                : newEntry;

            const resp = await fetch(endpoint + '?action=prayer.update'
                + '&token=' + encodeURIComponent(token)
                + '&authEmail=' + encodeURIComponent(userEmail)
                + '&rowIndex=' + rowIndex
                + '&adminNotes=' + encodeURIComponent(combined), {
                method: 'GET',
                cache: 'no-store'
            });

            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

            const result = await resp.json();
            if (!result.ok) throw new Error(result.message || 'Failed to save notes.');

            setPrayerStatus('Notes saved.', 'ok');
            invalidatePrayerNotesCache();
            await loadPrayerRequests();
        } catch (err) {
            const message = String(err && err.message ? err.message : err);
            setPrayerStatus(`Failed to save notes: ${message}`, 'err');
        }
    }

    if (notesCancelBtn) {
        notesCancelBtn.addEventListener('click', function() {
            closeNotesModal();
        });
    }

    if (notesModalEl) {
        notesModalEl.addEventListener('click', function(e) {
            if (e.target === notesModalEl) closeNotesModal();
        });
    }

    if (notesInputEl) {
        notesInputEl.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                e.preventDefault();
                closeNotesModal();
            }
        });
    }

    if (notesSaveBtn) {
        notesSaveBtn.addEventListener('click', async function() {
            if (!activeNotesRowIndex) {
                closeNotesModal();
                return;
            }
            const nextNotes = String(notesInputEl ? notesInputEl.value : '').trim();
            if (!nextNotes) {
                closeNotesModal();
                return;
            }
            notesSaveBtn.disabled = true;
            await updatePrayerNotesHandler(activeNotesRowIndex, nextNotes);
            notesSaveBtn.disabled = false;
            closeNotesModal();
        });
    }

    if (replyChannelEmailEl) {
        replyChannelEmailEl.addEventListener('change', function() {
            updateReplyFormUi();
        });
    }

    if (replyChannelTextEl) {
        replyChannelTextEl.addEventListener('change', function() {
            updateReplyFormUi();
        });
    }

    if (replyCancelBtn) {
        replyCancelBtn.addEventListener('click', function() {
            closeReplyModal();
        });
    }

    if (replyModalEl) {
        replyModalEl.addEventListener('click', function(e) {
            if (e.target === replyModalEl) closeReplyModal();
        });
    }

    if (replyMessageEl) {
        replyMessageEl.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                e.preventDefault();
                closeReplyModal();
            }
        });
    }

    if (replySendBtn) {
        replySendBtn.addEventListener('click', async function() {
            await sendReplyFromModal();
        });
    }

    function showVault() {
        // If a post-login target is set, navigate there instead of showing vault
        if (window.__AOS_POST_LOGIN_TARGET__ === 'member-portal') {
            delete window.__AOS_POST_LOGIN_TARGET__;
            if (typeof openMemberPortalApp === 'function') {
                openMemberPortalApp();
                return;
            }
        }
        if (loginCard) loginCard.style.display = 'none';
        if (vaultCard) vaultCard.style.display = '';
        updateSessionReuseIndicator(getFreshSecureSessionPayload());
        bindActivityWatch();
        maybeTouchSecureSession();
        startSessionExpiryTimer();
        renderVaultLinks();
    }

    function showLogin() {
        if (loginCard) loginCard.style.display = '';
        if (vaultCard) vaultCard.style.display = 'none';
        updateSessionReuseIndicator(null);
        unbindActivityWatch();
        clearSessionExpiryTimer();
        if (passcodeEl) passcodeEl.value = '';
        setStatus('', '');

        // Auto-populate from stored credential (Chromium only; Safari/Firefox use native form autofill)
        if (navigator.credentials && window.PasswordCredential) {
            navigator.credentials.get({ password: true, mediation: 'optional' }).then(function(cred) {
                if (cred && cred.type === 'password' && emailEl && passcodeEl) {
                    emailEl.value = cred.id;
                    passcodeEl.value = cred.password;
                }
            }).catch(function() { /* silently ignore */ });
        }
    }

    function lockVault() {
        clearSecureSessionPayload();
        showLogin();
    }

    function buildEndpointList() {
        const candidates = [];
        if (baseEndpoint) candidates.push(baseEndpoint);
        if (Array.isArray(window.APP_ENDPOINTS)) {
            candidates.push(...window.APP_ENDPOINTS);
        } else if (window.APP_ENDPOINTS) {
            candidates.push(window.APP_ENDPOINTS);
        }
        const seen = new Set();
        return candidates.map(function(e) { return String(e || '').trim(); }).filter(function(e) {
            if (!e || seen.has(e)) return false;
            seen.add(e);
            return true;
        });
    }

    function withAction(endpoint, action) {
        const url = String(endpoint || '').trim();
        return url + (url.includes('?') ? '&' : '?') + 'action=' + encodeURIComponent(action);
    }

    function tabsPayload() {
        return window.AUTH_SHEET_TABS || {
            users: 'AuthUsers_v1',
            profiles: 'UserProfiles_v1',
            audit: 'AuthAudit_v1'
        };
    }

    async function attemptLogin(email, passcode) {
        const endpoints = buildEndpointList();
        if (!endpoints.length) {
            throw new Error('No auth endpoints configured.');
        }

        let lastError = null;
        for (const ep of endpoints) {
            try {
                const resp = await fetch(withAction(ep, 'auth.login'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                    body: 'payload=' + encodeURIComponent(JSON.stringify({ email, passcode, tabs: tabsPayload() }))
                });
                if (!resp.ok) { lastError = new Error(`HTTP ${resp.status}`); continue; }
                return await resp.json();
            } catch (err) {
                lastError = err;
            }
        }

        throw lastError || new Error('All endpoints unreachable.');
    }

    function mapPrayerResultRows(result) {
        function pickRowIndex(item) {
            if (!item || typeof item !== 'object') return 0;
            const raw = item.index ?? item.rowIndex ?? item.row_index ?? item.RowIndex ?? item['Row Index'];
            const parsed = Number(raw || 0);
            return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
        }

        return Array.isArray(result && result.rows)
            ? result.rows
                .map(function(item, idx) {
                    const fallbackRowIndex = idx + 2;
                    if (item && typeof item === 'object' && Object.prototype.hasOwnProperty.call(item, 'data')) {
                        return {
                            rowIndex: pickRowIndex(item) || fallbackRowIndex,
                            row: item.data
                        };
                    }

                    if (item && typeof item === 'object' && (Array.isArray(item.row) || (item.row && typeof item.row === 'object'))) {
                        return {
                            rowIndex: pickRowIndex(item) || fallbackRowIndex,
                            row: item.row
                        };
                    }

                    return {
                        rowIndex: pickRowIndex(item) || fallbackRowIndex,
                        row: item
                    };
                })
                .filter(function(item) { return item && (Array.isArray(item.row) || (item.row && typeof item.row === 'object')); })
            : [];
    }

    async function fetchPrayerRowsForTab(endpoint, tabName) {
        const base = String(endpoint || '').trim();
        const tab = String(tabName || '').trim();
        if (!base || !tab) return [];

        const sep = base.includes('?') ? '&' : '?';
        const url = `${base}${sep}action=prayer.request.list&tab=${encodeURIComponent(tab)}`;
        const resp = await fetch(url, {
            method: 'GET',
            cache: 'no-store'
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const result = await resp.json();
        if (!result || result.ok !== true) {
            throw new Error((result && result.message) ? String(result.message) : 'Failed to load tab rows.');
        }
        return mapPrayerResultRows(result);
    }

    async function fetchPrayerRequestRows(endpoint) {
        const base = String(endpoint || '').trim();
        if (!base) return [];

        const sessionData = readSecureSessionPayload();
        const token = sessionData ? sessionData.token : '';
        const authEmail = sessionData ? sessionData.email : '';

        const url = base + '?action=prayer.list'
            + '&token=' + encodeURIComponent(token)
            + '&authEmail=' + encodeURIComponent(authEmail);

        const resp = await fetch(url, {
            method: 'GET',
            cache: 'no-store'
        });

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        const result = await resp.json();
        if (!result || result.ok !== true) {
            throw new Error((result && result.message) ? String(result.message) : 'Failed to load requests.');
        }

        return mapPrayerResultRows(result);
    }

    async function fetchPrayerNotesActionRows(endpoint) {
        const base = String(endpoint || '').trim();
        if (!base) return [];
        const sep = base.includes('?') ? '&' : '?';
        const url = `${base}${sep}action=prayer.notes.list`;
        const resp = await fetch(url, {
            method: 'GET',
            cache: 'no-store'
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const result = await resp.json();
        if (!result || result.ok !== true) {
            throw new Error((result && result.message) ? String(result.message) : 'Failed to load prayer notes.');
        }
        return mapPrayerResultRows(result);
    }

    async function fetchPrayerNotesRows(endpoint) {
        const now = Date.now();
        const cacheStillValid = prayerNotesCacheRows.length
            && prayerNotesCacheEndpoint === String(endpoint || '').trim()
            && (now - prayerNotesCacheAt) < 20000;
        if (cacheStillValid) {
            return prayerNotesCacheRows;
        }

        try {
            const rows = await fetchPrayerNotesActionRows(endpoint);
            prayerNotesCacheRows = Array.isArray(rows) ? rows : [];
            prayerNotesCacheAt = now;
            prayerNotesCacheEndpoint = String(endpoint || '').trim();
            if (rows.length) return rows;
        } catch (err) {
            // Fallback to tab-based fetch below.
        }

        const tabs = Array.isArray(SECURE_PRAYER_NOTES_TAB_CANDIDATES)
            ? SECURE_PRAYER_NOTES_TAB_CANDIDATES
            : ['PrayerNotes'];

        let lastErr = null;
        for (let i = 0; i < tabs.length; i += 1) {
            const tab = String(tabs[i] || '').trim();
            if (!tab) continue;
            try {
                const rows = await fetchPrayerRowsForTab(endpoint, tab);
                prayerNotesCacheRows = Array.isArray(rows) ? rows : [];
                prayerNotesCacheAt = now;
                prayerNotesCacheEndpoint = String(endpoint || '').trim();
                return rows;
            } catch (err) {
                lastErr = err;
            }
        }

        if (lastErr) throw lastErr;
        return [];
    }

    function mergePrayerNotesRows(prayerRows, notesRows) {
        const sourcePrayerRows = Array.isArray(prayerRows) ? prayerRows : [];
        const sourceNotesRows = Array.isArray(notesRows) ? notesRows : [];
        if (!sourceNotesRows.length) return sourcePrayerRows;

        const byIndex = new Map();
        const bySignature = new Map();

        sourceNotesRows.forEach(function(entry) {
            const note = normalizePrayerNoteRow(entry);
            if (!note.noteText) return;

            if (note.requestRowIndex > 0) {
                if (!byIndex.has(note.requestRowIndex)) byIndex.set(note.requestRowIndex, []);
                byIndex.get(note.requestRowIndex).push(note);
            }

            const sig = [
                String(note.requestSubmittedAt || '').trim().toLowerCase(),
                String(note.requestEmail || '').trim().toLowerCase(),
                String(note.requestFullName || '').trim().toLowerCase()
            ].join('|');

            if (sig !== '||') {
                if (!bySignature.has(sig)) bySignature.set(sig, []);
                bySignature.get(sig).push(note);
            }
        });

        return sourcePrayerRows.map(function(entry) {
            const wrapped = entry && typeof entry === 'object' ? entry : { rowIndex: 0, row: entry };
            const rowIndex = Number(wrapped.rowIndex || 0);
            const normalized = normalizePrayerRow(wrapped.row);

            let matchedNotes = [];
            if (rowIndex > 0 && byIndex.has(rowIndex)) {
                matchedNotes = byIndex.get(rowIndex) || [];
            } else {
                const sig = [
                    String(normalized.submittedAt || '').trim().toLowerCase(),
                    String(normalized.email || '').trim().toLowerCase(),
                    String(normalized.fullName || '').trim().toLowerCase()
                ].join('|');
                if (bySignature.has(sig)) matchedNotes = bySignature.get(sig) || [];
            }

            if (!matchedNotes.length) return wrapped;

            const mappedNotes = matchedNotes.map(function(note) {
                return {
                    text: String(note.noteText || '').trim(),
                    by: normalizeNoteAuthorDisplay(note.noteAuthor, note.requestFullName),
                    submittedAt: String(note.noteCreatedAt || '').trim()
                };
            }).filter(function(note) {
                return !!note.text;
            });

            if (!mappedNotes.length) return wrapped;

            const existingPrayerNotes = Array.isArray(normalized.prayerNotes)
                ? normalized.prayerNotes
                : [];

            const combinedNotes = existingPrayerNotes.concat(mappedNotes);
            const latestNoteText = combinedNotes.length
                ? String(combinedNotes[combinedNotes.length - 1].text || '').trim()
                : String(normalized.notes || '').trim();

            if (wrapped.row && typeof wrapped.row === 'object' && !Array.isArray(wrapped.row)) {
                return {
                    rowIndex,
                    row: {
                        ...wrapped.row,
                        notes: latestNoteText,
                        prayerNotes: combinedNotes
                    }
                };
            }

            return {
                rowIndex,
                row: {
                    submittedAt: normalized.submittedAt,
                    fullName: normalized.fullName,
                    email: normalized.email,
                    phone: normalized.phone,
                    followUp: normalized.followUp,
                    prayerText: normalized.prayerText,
                    notes: latestNoteText,
                    prayerNotes: combinedNotes
                }
            };
        });
    }

    async function loadPrayerRequests() {
        if (prayerLoadInFlight) return;
        prayerLoadInFlight = true;
        setPrayerStatus('Loading prayer requests...', '');
        if (prayerListEl) prayerListEl.innerHTML = '';

        try {
            const preload = window.__SECURE_PRAYER_PRELOAD_CACHE__;
            const cacheFresh = preload
                && Array.isArray(preload.rows)
                && preload.rows.length
                && (Date.now() - Number(preload.at || 0)) < 10 * 60 * 1000;
            if (cacheFresh) {
                renderPrayerRequests(preload.rows);
                setPrayerStatus(`Loaded ${preload.rows.length} request(s).`, preload.rows.length ? 'ok' : '');
            }
        } catch (preloadErr) {
            // Continue with live fetch path below.
        }

        try {
            const endpoint = window.PASTORAL_DB_V2_ENDPOINT || '';
            if (!endpoint) throw new Error('Prayer request endpoint not configured.');

            // Warm non-sensitive endpoint connectivity before auth data fetch path.
            await warmPrayerEndpointConnectivity(false);

            const rows = await fetchPrayerRequestRows(endpoint);

            renderPrayerRequests(rows);
            setPrayerStatus(`Loaded ${rows.length} request(s).`, rows.length ? 'ok' : '');
        } catch (err) {
            const message = String(err && err.message ? err.message : err);
            setPrayerStatus(`Failed to load prayer requests: ${message}`, 'err');
            if (prayerListEl) {
                prayerListEl.innerHTML = '<div class="sv-empty" style="padding:22px 12px;">Unable to load prayer requests from the server.</div>';
            }
        } finally {
            prayerLoadInFlight = false;
        }
    }

    try {
        warmPrayerEndpointConnectivity(false);
        const forcePromptOnly = !!window.__AOS_FORCE_SECURE_LOGIN_PROMPT__;
        window.__AOS_FORCE_SECURE_LOGIN_PROMPT__ = false;

        const activeSession = getFreshSecureSessionPayload();

        if (forcePromptOnly && !activeSession) {
            clearSecureSessionPayload();
            throw new Error('force-login-prompt');
        }
        if (activeSession) {
            showVault();
            if (lockBtn) lockBtn.addEventListener('click', lockVault);
            return;
        }

    } catch (storageErr) { /* sessionStorage unavailable in this context */ }

    if (lockBtn) lockBtn.addEventListener('click', lockVault);
    if (prayerRefreshBtn) {
        prayerRefreshBtn.addEventListener('click', function() {
            loadPrayerRequests();
        });
    }
    if (mirrorOpenBtn) {
        mirrorOpenBtn.addEventListener('click', function() {
            if (typeof openMirrorApp === 'function') {
                openMirrorApp();
                return;
            }
            setPrayerStatus('Mirror app is not available in this build.', 'err');
        });
    }
    if (prayerFilterSearchEl) {
        prayerFilterSearchEl.addEventListener('input', function() {
            prayerActiveQuickFilter = '';
            prayerCurrentPage = 1;
            applyPrayerFiltersAndRender();
        });
    }

    if (prayerFilterFromEl) {
        prayerFilterFromEl.addEventListener('change', function() {
            prayerActiveQuickFilter = '';
            prayerCurrentPage = 1;
            applyPrayerFiltersAndRender();
        });
    }

    if (prayerFilterToEl) {
        prayerFilterToEl.addEventListener('change', function() {
            prayerActiveQuickFilter = '';
            prayerCurrentPage = 1;
            applyPrayerFiltersAndRender();
        });
    }

    if (prayerFilterFollowUpEl) {
        prayerFilterFollowUpEl.addEventListener('change', function() {
            prayerActiveQuickFilter = '';
            prayerCurrentPage = 1;
            applyPrayerFiltersAndRender();
        });
    }

    if (prayerFilterResetEl) {
        prayerFilterResetEl.addEventListener('click', function() {
            applyQuickPrayerFilter('all');
        });
    }

    const prayerToggleViewBtn = document.getElementById('sv-prayer-toggle-view');
    if (prayerToggleViewBtn) {
        prayerToggleViewBtn.addEventListener('click', function() {
            prayerViewMode = prayerViewMode === 'table' ? 'cards' : 'table';
            applyPrayerFiltersAndRender();
            updatePrayerViewToggleButton();
        });
    }

    function updatePrayerViewToggleButton() {
        if (!prayerToggleViewBtn) return;
        if (prayerViewMode === 'cards') {
            prayerToggleViewBtn.textContent = 'View: Cards';
        } else if (prayerAutoCards) {
            prayerToggleViewBtn.textContent = prayerIsMobileViewport() ? 'View: Auto Accordions' : 'View: Auto Cards';
        } else {
            prayerToggleViewBtn.textContent = 'View: Table';
        }
    }

    let prayerResizeRaf = 0;
    window.addEventListener('resize', function() {
        if (prayerResizeRaf) return;
        prayerResizeRaf = window.requestAnimationFrame(function() {
            prayerResizeRaf = 0;
            const modal = document.getElementById('data-modal');
            if (!modal || !modal.classList.contains('active')) return;
            applyPrayerFiltersAndRender();
            updatePrayerViewToggleButton();
        });
    });

    prayerQuickButtons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            const kind = String(this.getAttribute('data-quick-filter') || '').trim();
            applyQuickPrayerFilter(kind);
        });
    });

    if (prayerRowsPerPageEl) {
        prayerRowsPerPageEl.addEventListener('change', function() {
            prayerRowsPerPage = Math.max(1, Number(prayerRowsPerPageEl.value || 10) || 10);
            prayerCurrentPage = 1;
            applyPrayerFiltersAndRender();
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async function handleUnlock(e) {
            e.preventDefault();
            const email = String(emailEl ? emailEl.value : '').trim().toLowerCase();
            const passcode = String(passcodeEl ? passcodeEl.value : '').trim();

            if (!email) { setStatus('Email is required.', 'err'); return; }
            if (!passcode) { setStatus('Passcode is required.', 'err'); return; }

            if (ownerEmail && email !== ownerEmail) {
                setStatus('Access denied.', 'err');
                return;
            }

            if (unlockBtn) unlockBtn.disabled = true;
            setStatus('Verifying...', '');

            try {
                const result = await attemptLogin(email, passcode);
                const authenticated = result && result.ok === true && result.session;

                if (authenticated) {
                    const sessionToken = String(
                        (result && result.session && (
                            result.session.token ||
                            result.session.accessToken ||
                            result.session.authToken ||
                            result.session.jwt
                        )) ||
                        (result && (result.token || result.accessToken || result.authToken || result.jwt)) ||
                        ''
                    ).trim();

                    writeSecureSessionPayload({
                        token: sessionToken,
                        email,
                        role: result && result.session ? result.session.role : 'readonly',
                        source: 'secure-manual',
                        firstName: String(
                            (result && result.session && (result.session.firstName || result.session.firstname)) ||
                            (result && result.profile && (result.profile.firstName || result.profile.firstname)) ||
                            ''
                        ).trim(),
                        lastName: String(
                            (result && result.session && (result.session.lastName || result.session.lastname)) ||
                            (result && result.profile && (result.profile.lastName || result.profile.lastname)) ||
                            ''
                        ).trim(),
                        fullName: String(
                            (result && result.session && (result.session.name || result.session.fullName || result.session.fullname)) ||
                            (result && result.profile && (result.profile.name || result.profile.fullName || result.profile.fullname)) ||
                            ''
                        ).trim()
                    });

                    // Prompt browser to save credentials
                    if (window.PasswordCredential) {
                        try {
                            var cred = new PasswordCredential({ id: email, password: passcode, name: email });
                            navigator.credentials.store(cred);
                        } catch (_) { /* optional — silently ignore */ }
                    }

                    setStatus('', '');
                    showVault();
                } else {
                    const msg = (result && result.error) ? String(result.error) : 'Access denied. Check credentials.';
                    setStatus(msg, 'err');
                }
            } catch (err) {
                setStatus('Could not reach the auth service. Please try again.', 'err');
            } finally {
                if (unlockBtn) unlockBtn.disabled = false;
            }
        });
    }
}
