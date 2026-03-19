// ==========================================
// APP: PASTORAL MEMBERS — TABLE VIEW
// ==========================================
// Renders a searchable, sortable member table pulled from the
// pastoral-server-v2 (Google Apps Script web app) via PASTORAL_DB_V2_ENDPOINT.
// All requests require a valid Secure Vault session (token + email).
// Phone numbers are masked; click to reveal.
// Pastoral notes open in a graphical overlay modal.

const pastoralAppState = {
    rows: [],
    loaded: false,
    loading: false,
    filter: '',
    editorMode: 'create',
    showArchived: false,
    viewMode: 'table',
    autoCards: false
};

let _pastoralResizeRaf = 0;
let _pastoralPrivateRevealBound = false;
let _pastoralKeepAliveLastAt = 0;

window.__PASTORAL_PRELOAD_CACHE__ = window.__PASTORAL_PRELOAD_CACHE__ || null;

function pastoralFetchNoReferrer(url) {
    return fetch(url, {
        method: 'GET',
        cache: 'no-store',
        credentials: 'omit',
        referrerPolicy: 'no-referrer'
    });
}

function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function pastoralNormalizeRow(row, fallbackIndex) {
    const source = row && typeof row === 'object' ? row : {};
    const out = Object.assign({}, source);

    const parsedIndex = Number(source.index || source.rowIndex || source.row_index || 0);
    out.index = Number.isFinite(parsedIndex) && parsedIndex > 0 ? parsedIndex : Number(fallbackIndex || 0);
    out.id = String(source.id == null ? '' : source.id);

    // v2 returns firstName + lastName; build firstLast for display
    const firstName = String(source.firstName == null ? '' : source.firstName).trim();
    const lastName = String(source.lastName == null ? '' : source.lastName).trim();
    if (lastName || firstName) {
        out.lastFirst = firstName && lastName ? firstName + ' ' + lastName : (firstName || lastName);
    } else {
        out.lastFirst = '';
    }
    out.firstName = firstName;
    out.lastName = lastName;
    out.preferredName = String(source.preferredName == null ? '' : source.preferredName);

    // v2 uses primaryEmail / cellPhone
    out.email = String(source.primaryEmail || source.email || '').trim();
    out.phone = String(source.cellPhone || source.phone || '').trim();
    out.membershipDate = String(source.memberSince || source.membershipDate || '');
    out.membershipStatus = String(source.membershipStatus == null ? '' : source.membershipStatus);
    out.pastoralNotes = String(source.pastoralNotes == null ? '' : source.pastoralNotes);
    out.archived = !!source.archived;

    // v2 stores T/B/M/P in the tags field (comma-separated)
    const tags = String(source.tags == null ? '' : source.tags).toUpperCase();
    if (source.t != null) {
        out.t = !!source.t;
    } else {
        out.t = tags.indexOf('T') !== -1;
    }
    if (source.b != null) {
        out.b = !!source.b;
    } else {
        out.b = tags.indexOf('B') !== -1;
    }
    if (source.m != null) {
        out.m = !!source.m;
    } else {
        out.m = tags.indexOf('M') !== -1;
    }
    if (source.p != null) {
        out.p = !!source.p;
    } else {
        out.p = tags.indexOf('P') !== -1;
    }
    out.tags = String(source.tags == null ? '' : source.tags);
    out.updatedBy = String(source.updatedBy == null ? '' : source.updatedBy).trim();
    out.updatedAt = String(source.updatedAt == null ? '' : source.updatedAt).trim();
    out.websiteLink = String(source.websiteLink == null ? '' : source.websiteLink).trim();

    return out;
}

function pastoralNormalizeRows(rows) {
    const list = Array.isArray(rows) ? rows : [];
    return list
        .filter(function(row) { return row && typeof row === 'object'; })
        .map(function(row, idx) {
            return pastoralNormalizeRow(row, idx + 2);
        });
}

window.preloadPastoralMembers = async function preloadPastoralMembers() {
    const endpoint = String(window.PASTORAL_DB_V2_ENDPOINT || '').trim();
    const auth = getPastoralAuthPayload();
    if (!endpoint || !auth) return null;

    const params = new URLSearchParams({
        action: 'members.list',
        token: auth.token,
        email: auth.email,
        includeArchived: 'true',
        _: String(Date.now())
    });

    try {
        const resp = await pastoralFetchNoReferrer(endpoint + '?' + params.toString());
        if (!resp.ok) {
            if (resp.status === 401 || resp.status === 403) return null;
            throw new Error('Pastoral preload failed: HTTP ' + resp.status);
        }

        const data = await resp.json();
        if (!data || !data.ok) {
            if (pastoralIsAuthErrorMessage(data && data.message)) return null;
            throw new Error((data && data.message) || 'Pastoral preload failed');
        }

        const rows = pastoralNormalizeRows(data.rows);
        window.__PASTORAL_PRELOAD_CACHE__ = {
            endpoint: endpoint,
            rows: rows,
            at: Date.now()
        };
        return window.__PASTORAL_PRELOAD_CACHE__;
    } catch (err) {
        if (pastoralIsAuthErrorMessage(err && err.message)) return null;
        throw err;
    }
};

function getPastoralAuthPayload() {
    const secureKey = (typeof SECURE_SESSION_KEY !== 'undefined' && SECURE_SESSION_KEY)
        ? SECURE_SESSION_KEY
        : 'atogen_secure_vault_v1';

    function normalizeFromAny(parsed) {
        if (!parsed || typeof parsed !== 'object') return null;

        const token = String(
            parsed.token ||
            parsed.accessToken ||
            parsed.authToken ||
            parsed.jwt ||
            (parsed.session && parsed.session.token) ||
            (parsed.session && parsed.session.accessToken) ||
            (parsed.session && parsed.session.authToken) ||
            (parsed.session && parsed.session.jwt) ||
            ''
        ).trim();

        const email = String(
            parsed.email ||
            (parsed.session && parsed.session.email) ||
            (parsed.profile && parsed.profile.email) ||
            ''
        ).trim().toLowerCase();

        const role = String(
            parsed.role ||
            (parsed.session && parsed.session.role) ||
            (parsed.profile && parsed.profile.role) ||
            ''
        ).trim().toLowerCase();

        // Restrict flock access to elevated roles when role metadata is present.
        if (role && !['admin', 'pastor', 'deacon', 'leader'].includes(role)) {
            return null;
        }

        if (!token || !email) return null;
        return { token: token, email: email };
    }

    function readJson(storage, key) {
        try {
            if (!storage || !key) return null;
            const raw = storage.getItem(key);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (err) {
            return null;
        }
    }

    // Priority 1: Secure app session (localStorage)
    const securePayload = normalizeFromAny(readJson(localStorage, secureKey));
    if (securePayload) return securePayload;

    // Defensive fallback key in localStorage only.
    const fallbackSession = normalizeFromAny(readJson(localStorage, 'atogen_secure_vault_v1'));
    if (fallbackSession) return fallbackSession;

    return null;
}

function pastoralIsAuthErrorMessage(message) {
    const text = String(message || '').toLowerCase();
    return (
        text.includes('missing token') ||
        text.includes('missing email') ||
        text.includes('unauthorized') ||
        text.includes('access denied') ||
        text.includes('session expired')
    );
}

function pastoralRedirectToSecure(reason) {
    const msg = String(reason || 'Session expired. Please sign in again.');

    if (typeof window.redirectToLoginForAppRoute === 'function') {
        const redirected = window.redirectToLoginForAppRoute('/sheep', 'session-required', 'sheep');
        if (redirected) {
            console.warn('Pastoral auth redirect:', msg);
            return;
        }
    }

    try {
        if (typeof closeModal === 'function') closeModal();
    } catch (err) {
        // noop
    }
    if (typeof openHomeSecureLogin === 'function') {
        openHomeSecureLogin();
    }
    console.warn('Pastoral auth redirect:', msg);
}

// ── STYLES ────────────────────────────────────────────────────────────────────

function pastoralEnsureStyles() {
    if (document.getElementById('pastoral-app-style')) return;
    const style = document.createElement('style');
    style.id = 'pastoral-app-style';
    style.textContent = `
        .pa-wrap {
            font-family: 'Avenir Next', 'Segoe UI', sans-serif;
            color: #d8e1eb;
            background:
                radial-gradient(1200px 480px at 8% -30%, rgba(38, 124, 255, 0.16), transparent 55%),
                radial-gradient(900px 420px at 100% -20%, rgba(14, 165, 233, 0.12), transparent 52%),
                linear-gradient(180deg, rgba(2, 8, 18, 0.95), rgba(5, 13, 28, 0.95));
            border: 1px solid rgba(148, 163, 184, 0.18);
            border-radius: 16px;
            padding: 16px;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 18px 40px rgba(2, 6, 23, 0.45);
        }
        .pa-toolbar {
            display: grid;
            gap: 12px;
            margin-bottom: 14px;
            padding: 12px;
            border-radius: 14px;
            border: 1px solid rgba(148, 163, 184, 0.2);
            background: linear-gradient(160deg, rgba(15, 23, 42, 0.72), rgba(7, 15, 30, 0.86));
        }
        .pa-toolbar-main {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
        }
        .pa-toolbar-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }
        .pa-search-wrap {
            flex: 1;
            min-width: 220px;
            position: relative;
        }
        .pa-search-wrap::before {
            content: 'Search';
            position: absolute;
            left: 12px;
            top: 7px;
            font-size: 0.62rem;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-weight: 700;
            color: #7fb0dd;
        }
        .pa-search {
            width: 100%; box-sizing: border-box;
            background: rgba(15, 23, 42, 0.72); border: 1px solid rgba(148, 163, 184, 0.32);
            border-radius: 10px; color: #ecf3fb; padding: 23px 14px 8px; font-size: 0.88rem;
            outline: none;
        }
        .pa-search:focus {
            border-color: #38bdf8;
            box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
        }
        .pa-search::placeholder { color: #6b84a0; }
        .pa-count {
            font-size: 0.72rem;
            color: #b7c7d9;
            white-space: nowrap;
            padding: 8px 11px;
            border-radius: 999px;
            border: 1px solid rgba(148, 163, 184, 0.3);
            background: rgba(15, 23, 42, 0.65);
            letter-spacing: 0.02em;
        }
        .pa-add-btn {
            border: 1px solid rgba(14,165,233,0.58);
            background: linear-gradient(180deg, rgba(14,165,233,0.26), rgba(2,132,199,0.25));
            color: #dff6ff;
            border-radius: 9px;
            font-size: 0.78rem;
            font-weight: 700;
            letter-spacing: 0.04em;
            padding: 8px 13px;
            cursor: pointer;
            transition: 0.15s ease;
        }
        .pa-add-btn:hover {
            background: linear-gradient(180deg, rgba(56,189,248,0.34), rgba(14,165,233,0.34));
            color: #ecfeff;
        }
        .pa-archive-toggle-btn {
            border: 1px solid rgba(148,163,184,0.4);
            background: rgba(71, 85, 105, 0.28);
            color: #d5e0ec;
            border-radius: 9px;
            font-size: 0.76rem;
            font-weight: 700;
            letter-spacing: 0.04em;
            padding: 8px 12px;
            cursor: pointer;
            transition: 0.15s ease;
        }
        .pa-archive-toggle-btn:hover {
            background: rgba(100,116,139,0.4);
            color: #f1f5f9;
        }
        .pa-archive-toggle-btn.active {
            border-color: rgba(34,197,94,0.55);
            background: rgba(22,163,74,0.2);
            color: #86efac;
        }
        .pa-view-toggle-btn {
            border: 1px solid rgba(99, 102, 241, 0.42);
            background: rgba(79, 70, 229, 0.22);
            color: #dbeafe;
            border-radius: 9px;
            font-size: 0.76rem;
            font-weight: 700;
            letter-spacing: 0.04em;
            padding: 8px 12px;
            cursor: pointer;
            transition: 0.15s;
        }
        .pa-view-toggle-btn:hover { background: rgba(79, 70, 229, 0.32); }

        .pa-cards-wrap { display: grid; gap: 10px; }
        .pa-cards-wrap .pa-card:nth-child(6n+1) { --pa-card-accent: var(--accent-cyan); }
        .pa-cards-wrap .pa-card:nth-child(6n+2) { --pa-card-accent: var(--accent-green); }
        .pa-cards-wrap .pa-card:nth-child(6n+3) { --pa-card-accent: var(--accent-gold); }
        .pa-cards-wrap .pa-card:nth-child(6n+4) { --pa-card-accent: var(--accent-magenta); }
        .pa-cards-wrap .pa-card:nth-child(6n+5) { --pa-card-accent: color-mix(in srgb, var(--accent-cyan) 58%, var(--accent-magenta) 42%); }
        .pa-cards-wrap .pa-card:nth-child(6n) { --pa-card-accent: color-mix(in srgb, var(--accent-green) 60%, var(--accent-cyan) 40%); }
        .pa-card {
            --pa-card-accent: var(--accent-cyan);
            --pa-card-accent-soft: color-mix(in srgb, var(--pa-card-accent) 14%, transparent);
            border: 1px solid color-mix(in srgb, var(--pa-card-accent) 38%, rgba(255,255,255,0.12));
            background: linear-gradient(155deg, var(--pa-card-accent-soft), rgba(255,255,255,0.02));
            border-radius: 14px;
            padding: 12px;
            display: grid;
            gap: 8px;
            box-shadow: 0 6px 18px rgba(2, 6, 23, 0.3);
        }
        .pa-card.pa-card-archived {
            border-color: rgba(148,163,184,0.2);
            background: rgba(100,116,139,0.09);
        }
        .pa-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            flex-wrap: wrap;
        }
        .pa-card-name {
            font-weight: 800;
            font-size: 0.92rem;
            color: color-mix(in srgb, var(--pa-card-accent) 48%, var(--text-main) 52%);
            min-width: 0;
            overflow-wrap: anywhere;
        }
        .pa-card-badges { display: flex; gap: 4px; flex-shrink: 0; }
        .pa-card-details { display: grid; gap: 4px; }
        .pa-card-detail {
            display: flex;
            align-items: baseline;
            gap: 8px;
            min-width: 0;
        }
        .pa-card-detail-label {
            font-size: 0.6rem;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--pa-card-accent);
            flex-shrink: 0;
            min-width: 40px;
        }
        .pa-card-detail-value {
            font-size: 0.82rem;
            color: var(--text-main);
            overflow-wrap: anywhere;
            min-width: 0;
        }
        .pa-card-detail-value.muted { color: var(--text-muted); }
        .pa-card-notes-preview {
            display: grid;
            gap: 3px;
            padding: 8px 10px;
            border-radius: 10px;
            background: rgba(2,6,23,0.4);
            border: 1px solid rgba(148,163,184,0.1);
        }
        .pa-card-notes-text {
            font-size: 0.78rem;
            color: #cbd5e1;
            line-height: 1.45;
            overflow-wrap: anywhere;
        }
        .pa-card-notes-meta {
            font-size: 0.66rem;
            color: #64748b;
            line-height: 1.3;
        }
        .pa-card-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            padding-top: 2px;
        }
        .pa-card-action-btn {
            border: 1px solid rgba(148,163,184,0.38);
            background: rgba(148,163,184,0.14);
            color: var(--text-main);
            border-radius: 8px;
            font-size: 0.74rem;
            font-weight: 700;
            letter-spacing: 0.02em;
            padding: 6px 10px;
            cursor: pointer;
            flex: 1 1 0;
            text-align: center;
            min-width: 0;
        }
        .pa-card-action-btn:hover { background: rgba(148,163,184,0.26); }
        .pa-card-action-btn.contact {
            border-color: rgba(34,211,238,0.45);
            background: rgba(34,211,238,0.14);
            color: #67e8f9;
        }
        .pa-card-action-btn.contact:hover { background: rgba(34,211,238,0.26); }
        .pa-table-scroll {
            overflow-x: auto;
            overflow-y: auto;
            max-height: min(56vh, 560px);
            border-radius: 14px;
            border: 1px solid rgba(148,163,184,0.24);
            background: linear-gradient(180deg, rgba(8, 14, 28, 0.82), rgba(6, 11, 22, 0.82));
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
        }
        .pa-table {
            width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.82rem;
            min-width: 420px;
        }
        .pa-table thead tr {
            background: rgba(10,22,39,0.94);
            border-bottom: 1px solid rgba(125,211,252,0.3);
        }
        .pa-table th {
            padding: 10px 12px; text-align: left; font-size: 0.66rem;
            font-weight: 800; letter-spacing: 0.1em; color: #86d7ff;
            text-transform: uppercase; white-space: nowrap; user-select: none;
            position: sticky; top: 0; z-index: 3;
            background: rgba(10,22,39,0.95);
        }
        .pa-table tbody tr {
            border-bottom: 1px solid rgba(148,163,184,0.12);
            transition: background 0.12s ease, box-shadow 0.12s ease;
        }
        .pa-table tbody tr:last-child { border-bottom: none; }
        .pa-table tbody tr:hover {
            background: rgba(56,189,248,0.09);
            box-shadow: inset 0 0 0 1px rgba(56,189,248,0.17);
        }
        .pa-table tbody tr.pa-row-archived {
            border-color: rgba(148,163,184,0.18);
            background: rgba(100,116,139,0.08);
        }
        .pa-table td { padding: 10px 12px; vertical-align: middle; }
        .pa-td-name { color: #f1f5f9; min-width: 180px; }
        .pa-name-stack { display: grid; gap: 6px; }
        .pa-name-value { font-weight: 800; color: var(--text-main); white-space: nowrap; }
        .pa-name-actions { display: flex; flex-wrap: wrap; gap: 6px; }
        .pa-email-pill {
            font-size: 0.78rem;
            padding: 3px 10px;
            border: 1px solid rgba(56,189,248,0.38);
            border-radius: 999px;
            background: rgba(15, 23, 42, 0.6);
            color: #bae6fd;
            cursor: pointer;
            white-space: nowrap;
            transition: 0.15s;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .pa-email-pill:hover:not(.is-revealed) {
            border-color: rgba(56,189,248,0.7);
            color: #eff9ff;
        }
        .pa-email-pill.is-revealed {
            cursor: default;
            color: var(--text-main);
            border-color: rgba(148,163,184,0.5);
            background: rgba(15, 23, 42, 0.78);
        }
        .pa-td-phone { text-align: right; min-width: 140px; }
        .pa-td-notes-count { text-align: center; white-space: nowrap; min-width: 80px; }
        .pa-note-count-badge {
            display: inline-block;
            font-size: 0.72rem;
            font-weight: 700;
            padding: 3px 10px;
            border-radius: 999px;
            background: rgba(56,189,248,0.12);
            border: 1px solid rgba(56,189,248,0.28);
            color: #7dd3fc;
            letter-spacing: 0.03em;
        }
        .pa-note-count-badge:hover {
            background: rgba(56,189,248,0.22);
            border-color: rgba(56,189,248,0.55);
        }
        .pa-badge {
            font-size: 10px; font-weight: 700; letter-spacing: 0.06em;
            padding: 2px 6px; border-radius: 5px; cursor: pointer;
            border: 1px solid transparent; transition: 0.15s;
            user-select: none; margin-right: 3px;
        }
        .pa-badge:last-child { margin-right: 0; }
        .pa-badge-on  { background: #0891b2; border-color: #22d3ee; color: #fff; }
        .pa-badge-off { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.12); color: #475569; }
        .pa-badge:hover:not(:disabled) { opacity: 0.8; }
        .pa-badge:disabled { cursor: default; opacity: 0.5; }
        .pa-phone-pill {
            font-size: 0.76rem; padding: 2px 9px;
            border: 1px solid rgba(255,255,255,0.14); border-radius: 999px;
            background: rgba(2,6,23,0.55); color: #94a3b8;
            cursor: pointer; white-space: nowrap; transition: 0.15s;
        }
        .pa-phone-pill:hover:not(.is-revealed) {
            border-color: rgba(125,211,252,0.7); color: #e0f2fe;
        }
        .pa-phone-pill.is-revealed { cursor: default; color: #e2e8f0; }
        .pa-note-cell {
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(15,23,42,0.45);
            border: 1px solid rgba(148,163,184,0.16);
            border-radius: 10px;
            padding: 6px;
            min-height: 34px;
        }
        .pa-note-review-btn {
            width: 100%;
            text-align: center;
            font-size: 0.68rem;
            line-height: 1.2;
            padding: 5px 8px;
            border-radius: 7px;
            border: 1px solid rgba(56,189,248,0.34);
            background: rgba(56,189,248,0.14);
            color: #c7ebff;
            cursor: pointer;
            transition: 0.15s;
            white-space: normal;
            text-wrap: balance;
        }
        .pa-note-review-btn:hover {
            background: rgba(56,189,248,0.22);
            border-color: rgba(56,189,248,0.62);
        }
        .pa-note-btn {
            font-size: 0.7rem;
            padding: 4px 8px;
            border-radius: 7px;
            white-space: nowrap;
            border: 1px solid rgba(56,189,248,0.34);
            background: rgba(56,189,248,0.14);
            color: #c7ebff;
            cursor: pointer;
            flex-shrink: 0;
            transition: 0.15s;
        }
        .pa-note-btn:hover { background: rgba(56,189,248,0.22); border-color: rgba(56,189,248,0.62); }
        .pa-note-btn.contact {
            border-color: rgba(20,184,166,0.45);
            background: rgba(20,184,166,0.16);
            color: #99f6e4;
        }
        .pa-note-btn.contact:hover {
            background: rgba(20,184,166,0.26);
            border-color: rgba(20,184,166,0.7);
        }
        .pa-edit-btn {
            font-size: 0.7rem;
            padding: 4px 8px;
            border-radius: 7px;
            border: 1px solid rgba(148,163,184,0.44);
            background: rgba(100,116,139,0.22);
            color: #f1f5f9;
            cursor: pointer;
            flex-shrink: 0;
            transition: 0.15s;
        }
        .pa-edit-btn:hover { background: rgba(100,116,139,0.35); }

        .pa-member-overlay {
            position: fixed;
            inset: 0;
            display: none;
            align-items: center;
            justify-content: center;
            background: rgba(2,6,23,0.84);
            z-index: 10030;
            padding: 18px;
        }
        .pa-member-overlay.active { display: flex; }
        .pa-member-dialog {
            width: min(780px, 96vw);
            max-height: calc(100vh - 36px);
            overflow-y: auto;
            border-radius: 16px;
            border: 1px solid rgba(148,163,184,0.25);
            background: linear-gradient(160deg, rgba(2,6,23,0.99), rgba(15,23,42,0.97));
            box-shadow: 0 24px 60px rgba(0,0,0,0.65);
            padding: 18px;
            display: grid;
            gap: 12px;
        }
        .pa-member-head {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
        }
        .pa-member-title {
            margin: 0;
            color: #f8fafc;
            font-size: 1rem;
            text-transform: uppercase;
            letter-spacing: 0.07em;
            font-weight: 800;
        }
        .pa-member-sub {
            margin: 4px 0 0;
            color: #94a3b8;
            font-size: 0.78rem;
        }
        .pa-member-section-head {
            grid-column: 1 / -1;
            font-size: 0.68rem;
            font-weight: 800;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #38bdf8;
            padding: 8px 0 2px;
            border-bottom: 1px solid rgba(56,189,248,0.18);
            margin-top: 4px;
        }
        .pa-member-grid {
            display: grid;
            gap: 10px;
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .pa-member-field { display: grid; gap: 6px; }
        .pa-member-field.full { grid-column: 1 / -1; }
        .pa-member-label {
            font-size: 0.66rem;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #94a3b8;
        }
        .pa-member-input,
        .pa-member-textarea,
        .pa-member-select {
            width: 100%;
            box-sizing: border-box;
            background: rgba(2,6,23,0.72);
            border: 1px solid rgba(148,163,184,0.3);
            border-radius: 10px;
            color: #e2e8f0;
            padding: 10px 12px;
            font-size: 0.84rem;
            font-family: inherit;
            outline: none;
        }
        .pa-member-select { appearance: auto; }
        .pa-member-input:focus,
        .pa-member-textarea:focus,
        .pa-member-select:focus {
            border-color: rgba(34,211,238,0.55);
            box-shadow: 0 0 0 3px rgba(34,211,238,0.13);
        }
        .pa-member-input[readonly] {
            opacity: 0.55;
            cursor: default;
        }
        .pa-member-textarea {
            min-height: 90px;
            resize: vertical;
            line-height: 1.5;
        }
        .pa-member-checks {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
            padding-top: 2px;
        }
        .pa-member-check {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: #cbd5e1;
            font-size: 0.8rem;
            user-select: none;
        }
        .pa-member-audit {
            grid-column: 1 / -1;
            font-size: 0.66rem;
            color: #64748b;
            line-height: 1.55;
            padding: 6px 0 0;
            border-top: 1px solid rgba(148,163,184,0.12);
        }
        .pa-member-foot {
            display: flex;
            align-items: center;
            gap: 10px;
            justify-content: flex-end;
            flex-wrap: wrap;
        }
        .pa-member-status { flex: 1; font-size: 0.76rem; color: #22d3ee; }
        .pa-member-status.err { color: #f87171; }
        .pa-member-delete-btn {
            padding: 7px 14px;
            border-radius: 8px;
            border: 1px solid rgba(248,113,113,0.55);
            background: rgba(248,113,113,0.14);
            color: #fca5a5;
            font-size: 0.82rem;
            font-weight: 700;
            letter-spacing: 0.04em;
            cursor: pointer;
            transition: 0.15s;
        }
        .pa-member-delete-btn:hover {
            background: rgba(248,113,113,0.28);
            color: #fee2e2;
        }
        .pa-member-delete-btn:disabled { opacity: 0.45; cursor: default; }

        @media (max-width: 720px) {
            .pa-member-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 760px) {
            .pa-toolbar-main,
            .pa-toolbar-actions {
                width: 100%;
            }
            .pa-count {
                width: 100%;
                text-align: left;
            }
            .pa-table-scroll {
                border-radius: 12px;
                max-height: min(52vh, 460px);
            }
            .pa-table {
                min-width: 380px;
            }
            .pa-td-name {
                min-width: 140px;
            }
            .pa-name-actions {
                gap: 4px;
            }
        }

        @media (max-width: 430px) {
            .pa-add-btn,
            .pa-archive-toggle-btn,
            .pa-view-toggle-btn {
                font-size: 0.66rem;
                padding: 6px 8px;
                border-radius: 7px;
                letter-spacing: 0.02em;
            }
            .pa-card-action-btn {
                font-size: 0.64rem;
                padding: 5px 6px;
            }
            .pa-note-btn,
            .pa-edit-btn {
                font-size: 0.64rem;
                padding: 4px 6px;
                border-radius: 6px;
            }
            .pa-card {
                padding: 10px;
                gap: 6px;
                border-radius: 12px;
            }
            .pa-card-name { font-size: 0.86rem; }
            .pa-card-detail-value { font-size: 0.78rem; }
            .pa-card-notes-text { font-size: 0.74rem; }
            .pa-email-pill {
                font-size: 0.66rem;
                padding: 3px 7px;
            }
            .pa-count {
                font-size: 0.66rem;
                padding: 6px 8px;
            }
            .pa-search {
                font-size: 0.8rem;
                padding: 21px 10px 7px;
            }
            .pa-badge {
                font-size: 8px;
                padding: 1px 4px;
                margin-right: 1px;
            }
        }
        /* ── Notes overlay modal ── */
        .pa-notes-overlay {
            position: fixed; inset: 0; display: none; align-items: center;
            justify-content: center; background: rgba(2,6,23,0.82);
            z-index: 10020; padding: 18px;
        }
        .pa-notes-overlay.active { display: flex; }
        .pa-notes-dialog {
            width: min(520px, 96vw); max-height: calc(100vh - 36px);
            overflow-y: auto; border-radius: 16px;
            border: 1px solid rgba(148,163,184,0.25);
            background: linear-gradient(160deg, rgba(2,6,23,0.99), rgba(15,23,42,0.97));
            box-shadow: 0 24px 60px rgba(0,0,0,0.65);
            padding: 20px; display: grid; gap: 14px;
        }
        .pa-notes-header {
            display: flex; align-items: flex-start;
            justify-content: space-between; gap: 12px;
        }
        .pa-notes-dlg-title {
            margin: 0; color: #f8fafc; font-size: 1rem;
            text-transform: uppercase; letter-spacing: 0.07em; font-weight: 800;
        }
        .pa-notes-sub {
            margin: 4px 0 0; color: #94a3b8; font-size: 0.78rem;
        }
        .pa-notes-close {
            background: none; border: none; color: #64748b; font-size: 1.1rem;
            cursor: pointer; padding: 2px 6px; border-radius: 6px; line-height: 1;
            transition: color 0.15s, background 0.15s; flex-shrink: 0;
        }
        .pa-notes-close:hover { color: #f8fafc; background: rgba(255,255,255,0.1); }
        .pa-notes-existing {
            border: 1px solid rgba(148,163,184,0.2); border-radius: 10px;
            background: rgba(15,23,42,0.6); padding: 10px 12px;
            color: #cbd5e1; font-size: 0.8rem; line-height: 1.55;
            white-space: pre-wrap; overflow-wrap: anywhere;
            max-height: 110px; overflow-y: auto;
        }
        .pa-notes-existing-label {
            font-size: 0.65rem; font-weight: 700; letter-spacing: 0.09em;
            text-transform: uppercase; color: #7dd3fc; margin-bottom: 6px;
        }
        .pa-notes-updated-meta {
            font-size: 0.68rem;
            color: #64748b;
            margin-top: 6px;
            line-height: 1.4;
        }
        .pa-notes-field-label {
            font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em;
            text-transform: uppercase; color: #94a3b8; display: block; margin-bottom: 6px;
        }
        .pa-notes-textarea {
            width: 100%; box-sizing: border-box; min-height: 120px; resize: vertical;
            background: rgba(2,6,23,0.72); border: 1px solid rgba(148,163,184,0.3);
            border-radius: 10px; color: #e2e8f0; padding: 10px 12px; font-size: 0.85rem;
            font-family: inherit; outline: none; line-height: 1.55;
        }
        .pa-notes-textarea:focus { border-color: rgba(34,211,238,0.55);
            box-shadow: 0 0 0 3px rgba(34,211,238,0.13); }
        .pa-notes-footer {
            display: flex; align-items: center; gap: 10px;
            justify-content: flex-end; flex-wrap: wrap;
        }
        .pa-notes-status { flex: 1; font-size: 0.76rem; color: #22d3ee; }
        .pa-notes-status.err { color: #f87171; }
        .pa-notes-cancel-btn {
            padding: 7px 18px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.18);
            background: transparent; color: #94a3b8; font-size: 0.82rem; cursor: pointer;
            font-weight: 600; transition: 0.15s;
        }
        .pa-notes-cancel-btn:hover { border-color: rgba(255,255,255,0.35); color: #e2e8f0; }
        .pa-notes-save-btn {
            padding: 7px 20px; border-radius: 8px; border: none;
            background: #0891b2; color: #fff; font-size: 0.82rem;
            font-weight: 700; cursor: pointer; letter-spacing: 0.04em; transition: 0.15s;
        }
        .pa-notes-save-btn:hover { background: #22d3ee; color: #000; }
        .pa-notes-save-btn:disabled { opacity: 0.4; cursor: default; }
        /* ── Loading / error ── */
        .pa-loading { padding: 32px; text-align: center; color: #64748b; font-size: 0.85rem; }
        .pa-loading-shimmer {
            background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
            background-size: 200% 100%; animation: pa-shimmer 1.5s infinite;
            border-radius: 10px; height: 44px; margin-bottom: 6px;
        }
        @keyframes pa-shimmer {
            0%   { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
        .pa-error {
            color: #f87171; background: rgba(248,113,113,0.08);
            border: 1px solid rgba(248,113,113,0.3); border-radius: 10px;
            padding: 12px 16px; font-size: 0.85rem;
        }
        .pa-empty { color: #64748b; font-style: italic; text-align: center; padding: 28px; }
    `;
    document.head.appendChild(style);
}

// ── SHELL ─────────────────────────────────────────────────────────────────────

function renderPastoralAppShell(targetEl) {
    pastoralEnsureStyles();
    pastoralBindPrivateRevealReset();
    const container = targetEl || document.getElementById('modal-body-container');
    if (!container) return;
    container.innerHTML = `
        <div class="pa-wrap">
            <div class="pa-toolbar">
                <div class="pa-toolbar-main">
                    <div class="pa-search-wrap">
                        <input class="pa-search" id="pa-search" type="search" placeholder="Name, email, or phone" autocomplete="off">
                    </div>
                    <span class="pa-count" id="pa-count"></span>
                </div>
                <div class="pa-toolbar-actions">
                    <button type="button" class="pa-add-btn" id="pa-add-member-btn">+ Add Member</button>
                    <button type="button" class="pa-archive-toggle-btn" id="pa-toggle-archived-btn">Archived: Hidden</button>
                    <button type="button" class="pa-view-toggle-btn" id="pa-toggle-view-btn">View: Table</button>
                </div>
            </div>
            <div class="pa-table-scroll" id="pa-table-wrap">
                <div class="pa-loading" id="pa-loading" style="display:none;">Loading…</div>
                <div id="pa-error-msg" style="display:none;"></div>
                <table class="pa-table" id="pa-table" role="grid">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th style="text-align:right;">Phone</th>
                            <th style="text-align:center;">Notes</th>
                        </tr>
                    </thead>
                    <tbody id="pa-tbody"></tbody>
                </table>
            </div>
            <div class="pa-cards-wrap" id="pa-cards-wrap" style="display:none;"></div>
        </div>

        <div class="pa-member-overlay" id="pa-member-overlay" aria-hidden="true">
            <div class="pa-member-dialog" role="dialog" aria-modal="true" aria-labelledby="pa-member-title">
                <div class="pa-member-head">
                    <div>
                        <h5 class="pa-member-title" id="pa-member-title">🐑 Member Editor</h5>
                        <p class="pa-member-sub" id="pa-member-sub"></p>
                    </div>
                    <button class="pa-notes-close" id="pa-member-close" title="Close">✕</button>
                </div>

                <div class="pa-member-grid">
                    <!-- ── Identity ── -->
                    <div class="pa-member-section-head">Identity</div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-id">ID</label>
                        <input class="pa-member-input" id="pa-member-id" type="text" readonly>
                    </div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-lastfirst">First Last</label>
                        <input class="pa-member-input" id="pa-member-lastfirst" type="text" placeholder="Jane Doe">
                    </div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-preferred">Preferred Name</label>
                        <input class="pa-member-input" id="pa-member-preferred" type="text" placeholder="Nickname">
                    </div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-suffix">Suffix</label>
                        <input class="pa-member-input" id="pa-member-suffix" type="text" placeholder="Jr., Sr., III">
                    </div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-dob">Date of Birth</label>
                        <input class="pa-member-input" id="pa-member-dob" type="date">
                    </div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-gender">Gender</label>
                        <select class="pa-member-select" id="pa-member-gender">
                            <option value="">—</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                    <div class="pa-member-field full">
                        <label class="pa-member-label" for="pa-member-photo">Photo URL</label>
                        <input class="pa-member-input" id="pa-member-photo" type="url" placeholder="https://...">
                    </div>

                    <!-- ── Contact ── -->
                    <div class="pa-member-section-head">Contact</div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-email">Primary Email</label>
                        <input class="pa-member-input" id="pa-member-email" type="email" placeholder="jane@example.com">
                    </div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-email2">Secondary Email</label>
                        <input class="pa-member-input" id="pa-member-email2" type="email" placeholder="other@example.com">
                    </div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-phone">Cell Phone</label>
                        <input class="pa-member-input" id="pa-member-phone" type="text" placeholder="(555) 555-5555">
                    </div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-homephone">Home Phone</label>
                        <input class="pa-member-input" id="pa-member-homephone" type="text" placeholder="(555) 555-5555">
                    </div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-workphone">Work Phone</label>
                        <input class="pa-member-input" id="pa-member-workphone" type="text" placeholder="(555) 555-5555">
                    </div>
                    <div class="pa-member-field full">
                        <label class="pa-member-label" for="pa-member-website">Website Link</label>
                        <input class="pa-member-input" id="pa-member-website" type="url" placeholder="https://...">
                    </div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-prefcontact">Preferred Contact</label>
                        <select class="pa-member-select" id="pa-member-prefcontact">
                            <option value="">—</option>
                            <option value="Cell">Cell</option>
                            <option value="Home">Home</option>
                            <option value="Work">Work</option>
                            <option value="Email">Email</option>
                            <option value="Text">Text</option>
                        </select>
                    </div>

                    <!-- ── Address ── -->
                    <div class="pa-member-section-head">Address</div>
                    <div class="pa-member-field full">
                        <label class="pa-member-label" for="pa-member-addr1">Address Line 1</label>
                        <input class="pa-member-input" id="pa-member-addr1" type="text" placeholder="123 Main St">
                    </div>
                    <div class="pa-member-field full">
                        <label class="pa-member-label" for="pa-member-addr2">Address Line 2</label>
                        <input class="pa-member-input" id="pa-member-addr2" type="text" placeholder="Apt 4B">
                    </div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-city">City</label>
                        <input class="pa-member-input" id="pa-member-city" type="text">
                    </div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-state">State</label>
                        <input class="pa-member-input" id="pa-member-state" type="text">
                    </div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-zip">ZIP</label>
                        <input class="pa-member-input" id="pa-member-zip" type="text">
                    </div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-country">Country</label>
                        <input class="pa-member-input" id="pa-member-country" type="text" placeholder="US">
                    </div>

                    <!-- ── Family ── -->
                    <div class="pa-member-section-head">Family &amp; Household</div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-marital">Marital Status</label>
                        <select class="pa-member-select" id="pa-member-marital">
                            <option value="">—</option>
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                            <option value="Divorced">Divorced</option>
                            <option value="Widowed">Widowed</option>
                            <option value="Separated">Separated</option>
                        </select>
                    </div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-spouse">Spouse Name</label>
                        <input class="pa-member-input" id="pa-member-spouse" type="text">
                    </div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-familyrole">Family Role</label>
                        <select class="pa-member-select" id="pa-member-familyrole">
                            <option value="">—</option>
                            <option value="Head">Head</option>
                            <option value="Spouse">Spouse</option>
                            <option value="Child">Child</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-household">Household ID</label>
                        <input class="pa-member-input" id="pa-member-household" type="text">
                    </div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-emergname">Emergency Contact</label>
                        <input class="pa-member-input" id="pa-member-emergname" type="text">
                    </div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-emergphone">Emergency Phone</label>
                        <input class="pa-member-input" id="pa-member-emergphone" type="text">
                    </div>

                    <!-- ── Membership & Spiritual ── -->
                    <div class="pa-member-section-head">Membership &amp; Spiritual</div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-status-sel">Membership Status</label>
                        <select class="pa-member-select" id="pa-member-status-sel">
                            <option value="">—</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Visitor">Visitor</option>
                            <option value="Regular Attendee">Regular Attendee</option>
                            <option value="Transferred">Transferred</option>
                            <option value="Deceased">Deceased</option>
                        </select>
                    </div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-since">Member Since</label>
                        <input class="pa-member-input" id="pa-member-since" type="date">
                    </div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-baptism">Baptism Date</label>
                        <input class="pa-member-input" id="pa-member-baptism" type="date">
                    </div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-salvation">Salvation Date</label>
                        <input class="pa-member-input" id="pa-member-salvation" type="date">
                    </div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-howfound">How Found Us</label>
                        <input class="pa-member-input" id="pa-member-howfound" type="text" placeholder="Invited by friend, online, etc.">
                    </div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-death">Date of Death</label>
                        <input class="pa-member-input" id="pa-member-death" type="date">
                    </div>
                    <div class="pa-member-field">
                        <span class="pa-member-label">Status Flags</span>
                        <div class="pa-member-checks">
                            <label class="pa-member-check"><input id="pa-member-t" type="checkbox"> T</label>
                            <label class="pa-member-check"><input id="pa-member-b" type="checkbox"> B</label>
                            <label class="pa-member-check"><input id="pa-member-m" type="checkbox"> M</label>
                            <label class="pa-member-check"><input id="pa-member-p" type="checkbox"> P</label>
                        </div>
                    </div>

                    <!-- ── Ministry ── -->
                    <div class="pa-member-section-head">Ministry &amp; Involvement</div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-ministry">Ministry Teams</label>
                        <input class="pa-member-input" id="pa-member-ministry" type="text" placeholder="Worship, Youth, Outreach">
                    </div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-volunteer">Volunteer Roles</label>
                        <input class="pa-member-input" id="pa-member-volunteer" type="text" placeholder="Greeter, Sound Tech">
                    </div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-gifts">Spiritual Gifts</label>
                        <input class="pa-member-input" id="pa-member-gifts" type="text" placeholder="Teaching, Mercy, Leadership">
                    </div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-smallgroup">Small Group</label>
                        <input class="pa-member-input" id="pa-member-smallgroup" type="text">
                    </div>

                    <!-- ── Pastoral Follow-Up ── -->
                    <div class="pa-member-section-head">Pastoral Follow-Up</div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-lastcontact">Last Contact</label>
                        <input class="pa-member-input" id="pa-member-lastcontact" type="date">
                    </div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-nextfollowup">Next Follow-Up</label>
                        <input class="pa-member-input" id="pa-member-nextfollowup" type="date">
                    </div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-followuppri">Follow-Up Priority</label>
                        <select class="pa-member-select" id="pa-member-followuppri">
                            <option value="">—</option>
                            <option value="Low">Low</option>
                            <option value="Normal">Normal</option>
                            <option value="High">High</option>
                            <option value="Urgent">Urgent</option>
                        </select>
                    </div>
                    <div class="pa-member-field">
                        <label class="pa-member-label" for="pa-member-assigned">Assigned To</label>
                        <input class="pa-member-input" id="pa-member-assigned" type="text" placeholder="Staff member email">
                    </div>

                    <!-- ── Notes ── -->
                    <div class="pa-member-section-head">Notes</div>
                    <div class="pa-member-field full">
                        <label class="pa-member-label" for="pa-member-notes">Pastoral Notes</label>
                        <textarea class="pa-member-textarea" id="pa-member-notes" placeholder="Add notes..."></textarea>
                    </div>

                    <!-- ── Audit (read-only) ── -->
                    <div class="pa-member-audit" id="pa-member-audit"></div>
                </div>

                <div class="pa-member-foot">
                    <span class="pa-member-status" id="pa-member-status"></span>
                    <button class="pa-member-delete-btn" id="pa-member-delete" style="display:none;">Archive Member</button>
                    <button class="pa-notes-cancel-btn" id="pa-member-cancel">Cancel</button>
                    <button class="pa-notes-save-btn" id="pa-member-save">Save Member</button>
                </div>
            </div>
        </div>

        <!-- Notes overlay -->
        <div class="pa-notes-overlay" id="pa-notes-overlay" aria-hidden="true">
            <div class="pa-notes-dialog" role="dialog" aria-modal="true" aria-labelledby="pa-notes-dlg-title">
                <div class="pa-notes-header">
                    <div>
                        <h5 class="pa-notes-dlg-title" id="pa-notes-dlg-title">🐑 Pastoral Notes</h5>
                        <p class="pa-notes-sub" id="pa-notes-dlg-sub"></p>
                    </div>
                    <button class="pa-notes-close" id="pa-notes-close" title="Close">✕</button>
                </div>
                <div id="pa-notes-existing-wrap" style="display:none;">
                    <div class="pa-notes-existing-label">Current note</div>
                    <div class="pa-notes-existing" id="pa-notes-existing"></div>
                    <div class="pa-notes-updated-meta" id="pa-notes-updated-meta"></div>
                </div>
                <div>
                    <label class="pa-notes-field-label" for="pa-notes-input">New note</label>
                    <textarea class="pa-notes-textarea" id="pa-notes-input" rows="5"
                        placeholder="Type a pastoral note…"></textarea>
                </div>
                <div class="pa-notes-footer">
                    <span class="pa-notes-status" id="pa-notes-status"></span>
                    <button class="pa-notes-cancel-btn" id="pa-notes-cancel">Cancel</button>
                    <button class="pa-notes-save-btn" id="pa-notes-save">Save &amp; Close</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('pa-search').addEventListener('input', function() {
        pastoralAppState.filter = this.value.trim().toLowerCase();
        pastoralRender();
    });

    document.getElementById('pa-add-member-btn').addEventListener('click', function() {
        pastoralOpenMemberModal(null);
    });

    document.getElementById('pa-toggle-archived-btn').addEventListener('click', function() {
        pastoralAppState.showArchived = !pastoralAppState.showArchived;
        pastoralRender();
    });

    document.getElementById('pa-toggle-view-btn').addEventListener('click', function() {
        pastoralAppState.viewMode = pastoralAppState.viewMode === 'table' ? 'cards' : 'table';
        pastoralRender();
    });

    document.getElementById('pa-member-close').addEventListener('click', pastoralCloseMemberModal);
    document.getElementById('pa-member-cancel').addEventListener('click', pastoralCloseMemberModal);
    document.getElementById('pa-member-save').addEventListener('click', pastoralSaveMemberFromModal);
    document.getElementById('pa-member-delete').addEventListener('click', pastoralDeleteMemberFromModal);
    document.getElementById('pa-member-overlay').addEventListener('click', function(e) {
        if (e.target === this) pastoralCloseMemberModal();
    });

    document.getElementById('pa-notes-close').addEventListener('click', pastoralCloseNotesModal);
    document.getElementById('pa-notes-cancel').addEventListener('click', pastoralCloseNotesModal);
    document.getElementById('pa-notes-save').addEventListener('click', pastoralSaveNoteFromModal);
    document.getElementById('pa-notes-overlay').addEventListener('click', function(e) {
        if (e.target === this) pastoralCloseNotesModal();
    });

    window.removeEventListener('resize', pastoralHandleResize);
    window.addEventListener('resize', pastoralHandleResize);
    pastoralBindActivityKeepAlive(container);

    pastoralAppState.filter = '';
}

function pastoralHandleResize() {
    if (_pastoralResizeRaf) return;
    _pastoralResizeRaf = window.requestAnimationFrame(function() {
        _pastoralResizeRaf = 0;
        const modal = document.getElementById('data-modal');
        if (!modal || !modal.classList.contains('active')) return;
        pastoralRender();
    });
}

function pastoralTouchSecureKeepAlive(force) {
    const now = Date.now();
    if (!force && (now - _pastoralKeepAliveLastAt) < 5000) return;

    if (typeof window.touchSecureSessionKeepAlive === 'function') {
        const touched = window.touchSecureSessionKeepAlive(!!force);
        if (touched) _pastoralKeepAliveLastAt = now;
        return;
    }

    const secureKey = (typeof SECURE_SESSION_KEY !== 'undefined' && SECURE_SESSION_KEY)
        ? SECURE_SESSION_KEY
        : 'atogen_secure_vault_v1';
    const secureIdleMs = (typeof SECURE_SESSION_IDLE_TIMEOUT_MS !== 'undefined' && Number(SECURE_SESSION_IDLE_TIMEOUT_MS) > 0)
        ? Number(SECURE_SESSION_IDLE_TIMEOUT_MS)
        : (365 * 24 * 60 * 60 * 1000);

    try {
        const raw = localStorage.getItem(secureKey);
        if (!raw || raw === '1') return;
        const payload = JSON.parse(raw);
        if (!payload || typeof payload !== 'object') return;

        const expiresAt = Number(payload.expiresAt || 0);
        if (!expiresAt || expiresAt <= now) {
            localStorage.removeItem(secureKey);
            return;
        }

        payload.touchedAt = now;
        localStorage.setItem(secureKey, JSON.stringify(payload));
        _pastoralKeepAliveLastAt = now;
    } catch (err) {
        // ignore storage restrictions
    }
}

function pastoralBindActivityKeepAlive(container) {
    if (!container) return;
    const appRoot = container.querySelector('.pa-wrap');
    if (!appRoot) return;
    if (appRoot.dataset.keepAliveBound === '1') return;

    const touch = function() { pastoralTouchSecureKeepAlive(false); };
    ['click', 'keydown', 'touchstart', 'scroll', 'input'].forEach(function(evt) {
        appRoot.addEventListener(evt, touch, { passive: true });
    });
    appRoot.dataset.keepAliveBound = '1';
    pastoralTouchSecureKeepAlive(true);
}

function pastoralSetPrivatePillState(btn, revealed) {
    if (!btn) return;
    const revealValue = String(btn.getAttribute('data-reveal-value') || '').trim();
    const maskedLabel = String(btn.getAttribute('data-masked-label') || 'Click to view').trim() || 'Click to view';

    if (revealed && revealValue) {
        btn.textContent = revealValue;
        btn.classList.add('is-revealed');
        btn.setAttribute('aria-label', 'Private value revealed');
        return;
    }

    btn.textContent = maskedLabel;
    btn.classList.remove('is-revealed');
    btn.setAttribute('aria-label', maskedLabel);
}

function pastoralResetPrivatePills() {
    document.querySelectorAll('.pa-email-pill[data-private-reveal="1"], .pa-phone-pill[data-private-reveal="1"]').forEach(function(btn) {
        pastoralSetPrivatePillState(btn, false);
    });
}

function pastoralBindPrivateRevealReset() {
    if (_pastoralPrivateRevealBound) return;
    _pastoralPrivateRevealBound = true;

    document.addEventListener('click', function(e) {
        const target = e && e.target ? e.target : null;
        if (target && typeof target.closest === 'function' && target.closest('[data-private-reveal="1"]')) return;
        pastoralResetPrivatePills();
    });
}

function pastoralIsMobileViewport() {
    try {
        return window.matchMedia('(max-width: 760px)').matches;
    } catch (err) {
        return window.innerWidth <= 760;
    }
}

function pastoralTableWouldOverflow() {
    const tableWrap = document.getElementById('pa-table-wrap');
    const table = document.getElementById('pa-table');
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

function pastoralRender() {
    const forceCards = pastoralAppState.viewMode === 'table' && (pastoralIsMobileViewport() || pastoralTableWouldOverflow());
    pastoralAppState.autoCards = forceCards;

    if (pastoralAppState.viewMode === 'cards' || forceCards) {
        pastoralRenderCards();
        return;
    }
    pastoralRenderTable();
}

function pastoralGetVisibleRows() {
    const filter = pastoralAppState.filter;
    const activeRows = pastoralAppState.rows.filter(function(row) {
        return !row.archived;
    });
    const archivedRows = pastoralAppState.rows.filter(function(row) {
        return !!row.archived;
    });
    const sourceRows = pastoralAppState.showArchived
        ? pastoralAppState.rows.slice()
        : activeRows;

    const visible = sourceRows.filter(function(row) {
        if (!filter) return true;
        const hay = [row.lastFirst, row.email, row.phone].join(' ').toLowerCase();
        return hay.includes(filter);
    });

    return {
        activeRows: activeRows,
        archivedRows: archivedRows,
        sourceRows: sourceRows,
        visible: visible
    };
}

function pastoralUpdateTopControls(meta) {
    const countEl = document.getElementById('pa-count');
    const archivedToggleBtn = document.getElementById('pa-toggle-archived-btn');
    const viewToggleBtn = document.getElementById('pa-toggle-view-btn');
    const archivedCount = meta.archivedRows.length;

    if (archivedToggleBtn) {
        archivedToggleBtn.textContent = pastoralAppState.showArchived
            ? `Archived: Showing (${archivedCount})`
            : `Archived: Hidden (${archivedCount})`;
        archivedToggleBtn.classList.toggle('active', pastoralAppState.showArchived);
    }

    if (viewToggleBtn) {
        if (pastoralAppState.viewMode === 'cards') {
            viewToggleBtn.textContent = 'View: Cards';
        } else if (pastoralAppState.autoCards) {
            viewToggleBtn.textContent = pastoralIsMobileViewport() ? 'View: Auto Accordions' : 'View: Auto Cards';
        } else {
            viewToggleBtn.textContent = 'View: Table';
        }
    }

    if (countEl) {
        const total = meta.sourceRows.length;
        countEl.textContent = pastoralAppState.filter
            ? `${meta.visible.length} of ${total} members`
            : `${total} member${total !== 1 ? 's' : ''}${!pastoralAppState.showArchived && archivedCount ? ` (${archivedCount} archived hidden)` : ''}`;
    }
}

function pastoralRenderCards() {
    const tableWrap = document.getElementById('pa-table-wrap');
    const cardsWrap = document.getElementById('pa-cards-wrap');
    if (!cardsWrap) return;

    if (tableWrap) tableWrap.style.display = 'none';
    cardsWrap.style.display = '';

    const meta = pastoralGetVisibleRows();
    pastoralUpdateTopControls(meta);

    if (!meta.visible.length) {
        cardsWrap.innerHTML = `<div class="pa-empty">${
            pastoralAppState.filter ? 'No members match your search.' : 'No members found.'
        }</div>`;
        return;
    }

    cardsWrap.innerHTML = '';
    meta.visible.forEach(function(row) {
        cardsWrap.appendChild(pastoralBuildCard(row));
    });
}

function pastoralBuildCard(row) {
    const card = document.createElement('article');
    card.className = 'pa-card' + (row.archived ? ' pa-card-archived' : '');

    // ── Header: name + TBMP badges ──
    const header = document.createElement('div');
    header.className = 'pa-card-header';

    const name = document.createElement('div');
    name.className = 'pa-card-name';
    name.textContent = row.archived
        ? (row.lastFirst ? row.lastFirst + ' (Archived)' : 'Archived Member')
        : (row.lastFirst || 'Unnamed Member');

    const badges = document.createElement('div');
    badges.className = 'pa-card-badges';
    PASTORAL_CHECKBOXES.forEach(function(key) {
        const btn = document.createElement('button');
        btn.className = 'pa-badge ' + (row[key] ? 'pa-badge-on' : 'pa-badge-off');
        btn.textContent = key.toUpperCase();
        btn.title = 'Toggle ' + key.toUpperCase();
        btn.dataset.key = key;
        btn.dataset.active = row[key] ? '1' : '0';
        btn.addEventListener('click', function() {
            pastoralToggleCheckbox(btn, row);
        });
        badges.appendChild(btn);
    });

    header.appendChild(name);
    header.appendChild(badges);
    card.appendChild(header);

    // ── Details: email, phone, since ──
    const details = document.createElement('div');
    details.className = 'pa-card-details';

    function addDetail(label, value, isMuted) {
        const detail = document.createElement('div');
        detail.className = 'pa-card-detail';
        const l = document.createElement('span');
        l.className = 'pa-card-detail-label';
        l.textContent = label;
        const v = document.createElement('span');
        v.className = 'pa-card-detail-value' + (isMuted ? ' muted' : '');
        v.textContent = value || '\u2014';
        detail.appendChild(l);
        detail.appendChild(v);
        details.appendChild(detail);
    }

    addDetail('Phone', row.phone || '', !row.phone);

    const since = row.membershipDate
        ? (function() {
            const d = new Date(row.membershipDate);
            return isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        }())
        : '';
    addDetail('Since', since || '', !since);

    card.appendChild(details);

    // ── Notes preview (if any) ──
    if (row.pastoralNotes) {
        const notesPreview = document.createElement('div');
        notesPreview.className = 'pa-card-notes-preview';
        const notesLabel = document.createElement('span');
        notesLabel.className = 'pa-card-detail-label';
        notesLabel.textContent = 'Notes';
        const notesText = document.createElement('div');
        notesText.className = 'pa-card-notes-text';
        const raw = String(row.pastoralNotes);
        notesText.textContent = raw.length > 120 ? raw.slice(0, 120) + '\u2026' : raw;
        notesPreview.appendChild(notesLabel);
        notesPreview.appendChild(notesText);
        const meta = pastoralFormatUpdatedMeta(row);
        if (meta) {
            const metaEl = document.createElement('div');
            metaEl.className = 'pa-card-notes-meta';
            metaEl.textContent = meta;
            notesPreview.appendChild(metaEl);
        }
        card.appendChild(notesPreview);
    }

    // ── Actions ──
    const actions = document.createElement('div');
    actions.className = 'pa-card-actions';

    const contactBtn = document.createElement('button');
    contactBtn.type = 'button';
    contactBtn.className = 'pa-card-action-btn contact';
    contactBtn.textContent = 'Contact';
    contactBtn.addEventListener('click', function() {
        pastoralContactMember(row);
    });

    const notesBtn = document.createElement('button');
    notesBtn.type = 'button';
    notesBtn.className = 'pa-card-action-btn';
    notesBtn.textContent = 'Notes';
    notesBtn.addEventListener('click', function() {
        pastoralOpenNotesModal(row, null);
    });

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'pa-card-action-btn';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', function() {
        pastoralOpenMemberModal(row);
    });

    actions.appendChild(contactBtn);
    actions.appendChild(notesBtn);
    actions.appendChild(editBtn);
    card.appendChild(actions);

    return card;
}

function pastoralContactMember(row) {
    const email = String((row && row.email) || '').trim();
    const phone = String((row && row.phone) || '').trim();
    const digits = phone.replace(/\D/g, '');
    const sms = digits.length === 10
        ? `+1${digits}`
        : (digits.length === 11 && digits.charAt(0) === '1' ? `+${digits}` : '');
    const name = String((row && row.lastFirst) || 'member').trim();
    const firstName = (function() {
        const raw = String(name || '').trim();
        if (!raw) return 'there';
        const parts = raw.split(/\s+/).filter(Boolean);
        return parts.length ? parts[0] : 'there';
    }());
    const subject = 'Pastoral Follow-up';
    const message = `Hi ${firstName},\n\nFollowing up from the pastoral team regarding your request. We are praying with you and are here to support you.\n\n- Admin Team`;

    function logContact(channelLabel) {
        pastoralLogContactAttempt(row, channelLabel);
    }

    function openSecureReplyForm(channelLabel) {
        const payload = {
            rowIndex: Number(row && row.index ? row.index : 0),
            name: name,
            email: email,
            phone: phone,
            source: 'pastoral-member',
            preferredChannel: channelLabel === 'Text' ? 'text' : 'email',
            subject: subject,
            message: message,
            prayerText: String((row && row.pastoralNotes) || '').trim()
        };

        if (typeof window.openSecureReplyFormForRecipient === 'function') {
            const opened = window.openSecureReplyFormForRecipient(payload);
            if (opened) return true;
        }

        if (typeof openHomeSecureLogin === 'function') {
            openHomeSecureLogin();
        }

        return false;
    }

    if (!email && !sms) {
        window.alert('No phone or email is available for this member.');
        return;
    }

    if (email && sms) {
        const useEmail = window.confirm('Press OK to contact via Email, or Cancel to contact via Text.');
        if (useEmail) {
            if (!openSecureReplyForm('Email')) {
                window.alert('Unable to open Secure reply form. Open Secure and try again.');
                return;
            }
            logContact('Email');
            return;
        }
        if (!openSecureReplyForm('Text')) {
            window.alert('Unable to open Secure reply form. Open Secure and try again.');
            return;
        }
        logContact('Text');
        return;
    }

    if (email) {
        if (!openSecureReplyForm('Email')) {
            window.alert('Unable to open Secure reply form. Open Secure and try again.');
            return;
        }
        logContact('Email');
        return;
    }

    if (!openSecureReplyForm('Text')) {
        window.alert('Unable to open Secure reply form. Open Secure and try again.');
        return;
    }
    logContact('Text');
}

function pastoralLogContactAttempt(row, channelLabel) {
    const endpoint = window.PASTORAL_DB_V2_ENDPOINT || '';
    const auth = getPastoralAuthPayload();
    if (!row || !endpoint || !auth) return;

    const ts = new Date().toLocaleString();
    const actor = String(auth.email || 'admin').trim() || 'admin';
    const entry = `[Contact ${channelLabel}] ${ts} by ${actor}`;
    const existing = String(row.pastoralNotes || '').trim();
    const combined = existing ? `${existing}\n\n${entry}` : entry;

    const params = new URLSearchParams({
        action: 'members.update',
        rowIndex: row.index,
        pastoralNotes: combined,
        token: auth.token,
        email: auth.email
    });

    pastoralFetchNoReferrer(endpoint + '?' + params.toString())
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data && data.ok) {
                row.pastoralNotes = combined;
                pastoralRender();
                return;
            }
            if (pastoralIsAuthErrorMessage(data && data.message)) {
                pastoralRedirectToSecure((data && data.message) || 'Unauthorized');
            }
        })
        .catch(function(err) {
            console.warn('Contact log failed:', err);
        });
}

// ── TABLE RENDER ──────────────────────────────────────────────────────────────

const PASTORAL_CHECKBOXES = ['t', 'b', 'm', 'p'];

function pastoralRenderTable() {
    const tbody = document.getElementById('pa-tbody');
    const tableWrap = document.getElementById('pa-table-wrap');
    const cardsWrap = document.getElementById('pa-cards-wrap');
    if (!tbody) return;

    if (tableWrap) tableWrap.style.display = '';
    if (cardsWrap) cardsWrap.style.display = 'none';

    const meta = pastoralGetVisibleRows();
    const visible = meta.visible;
    pastoralUpdateTopControls(meta);

    if (!visible.length) {
        tbody.innerHTML = `<tr><td colspan="3" class="pa-empty">${
            pastoralAppState.filter ? 'No members match your search.' : 'No members found.'
        }</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    visible.forEach(function(row) {
        tbody.appendChild(pastoralBuildRow(row));
    });
}

function pastoralBuildRow(row) {
    const tr = document.createElement('tr');
    if (row.archived) tr.classList.add('pa-row-archived');

    // Name
    const tdName = document.createElement('td');
    tdName.className = 'pa-td-name';
    tdName.setAttribute('data-label', 'Name');

    const nameStack = document.createElement('div');
    nameStack.className = 'pa-name-stack';

    const nameValue = document.createElement('div');
    nameValue.className = 'pa-name-value';
    nameValue.textContent = row.archived
        ? (row.lastFirst ? row.lastFirst + ' (Archived)' : 'Archived Member')
        : (row.lastFirst || '—');

    const actions = document.createElement('div');
    actions.className = 'pa-name-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'pa-edit-btn';
    editBtn.textContent = 'Edit Member';
    editBtn.addEventListener('click', function() {
        pastoralOpenMemberModal(row);
    });

    const contactBtn = document.createElement('button');
    contactBtn.className = 'pa-note-btn contact';
    contactBtn.textContent = 'Contact';
    contactBtn.addEventListener('click', function() {
        pastoralContactMember(row);
    });

    const notesBtn = document.createElement('button');
    notesBtn.className = 'pa-note-btn';
    notesBtn.textContent = row.pastoralNotes ? 'Notes' : '+ Notes';
    notesBtn.addEventListener('click', function() {
        pastoralOpenNotesModal(row, null);
    });

    actions.appendChild(editBtn);
    actions.appendChild(contactBtn);
    actions.appendChild(notesBtn);

    nameStack.appendChild(nameValue);
    nameStack.appendChild(actions);
    tdName.appendChild(nameStack);
    tr.appendChild(tdName);

    // Phone — masked, click to reveal (right-aligned)
    const tdPhone = document.createElement('td');
    tdPhone.className = 'pa-td-phone';
    tdPhone.setAttribute('data-label', 'Phone');
    if (row.phone) {
        const pill = document.createElement('button');
        pill.className = 'pa-phone-pill';
        pill.setAttribute('data-private-reveal', '1');
        pill.setAttribute('data-masked-label', 'Click to view');
        pill.setAttribute('data-reveal-value', String(row.phone || ''));
        pastoralSetPrivatePillState(pill, false);
        pill.title = 'Click to view phone number';
        pill.addEventListener('click', function() {
            const shouldReveal = !this.classList.contains('is-revealed');
            pastoralSetPrivatePillState(this, shouldReveal);
            this.title = shouldReveal ? row.phone : 'Click to view phone number';
        });
        tdPhone.appendChild(pill);
    } else {
        tdPhone.textContent = '—';
        tdPhone.style.color = '#475569';
    }
    tr.appendChild(tdPhone);

    // Notes count cell (centered)
    const tdNotes = document.createElement('td');
    tdNotes.className = 'pa-td-notes-count';
    tdNotes.setAttribute('data-label', 'Notes');
    const noteRaw = String(row.pastoralNotes || '').trim();
    if (noteRaw) {
        const lines = noteRaw.split(/\n\s*\n|\n/).filter(function(l) { return l.trim(); });
        const count = lines.length;
        const countEl = document.createElement('span');
        countEl.className = 'pa-note-count-badge';
        countEl.textContent = count + (count === 1 ? ' note' : ' notes');
        countEl.title = 'Click to view/edit notes';
        countEl.style.cursor = 'pointer';
        countEl.addEventListener('click', function() {
            pastoralOpenNotesModal(row, null);
        });
        tdNotes.appendChild(countEl);
    } else {
        tdNotes.textContent = '—';
        tdNotes.style.color = '#475569';
    }
    tr.appendChild(tdNotes);

    return tr;
}

// ── NOTES MODAL ───────────────────────────────────────────────────────────────

let _pastoralActiveNoteRow = null;
let _pastoralActiveNoteSnippet = null;
let _pastoralActiveEditRow = null;

function pastoralFormatUpdatedMeta(row) {
    if (!row.updatedBy && !row.updatedAt) return '';
    const who = row.updatedBy || 'Unknown';
    let when = '';
    if (row.updatedAt) {
        const d = new Date(row.updatedAt);
        if (!isNaN(d.getTime())) {
            when = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        }
    }
    return when ? 'Updated by ' + who + ' on ' + when : 'Updated by ' + who;
}

function pastoralFormatDateForInput(value) {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function pastoralOpenMemberModal(row) {
    pastoralAppState.editorMode = row ? 'edit' : 'create';
    _pastoralActiveEditRow = row || null;

    const overlay = document.getElementById('pa-member-overlay');
    const title = document.getElementById('pa-member-title');
    const sub = document.getElementById('pa-member-sub');
    const status = document.getElementById('pa-member-status');
    const deleteBtn = document.getElementById('pa-member-delete');

    const s = row || {};

    function setVal(id, val) {
        var el = document.getElementById(id);
        if (el) el.value = String(val == null ? '' : val);
    }
    function setDate(id, val) {
        setVal(id, pastoralFormatDateForInput(val));
    }
    function setCheck(id, val) {
        var el = document.getElementById(id);
        if (el) el.checked = !!val;
    }

    // Identity
    setVal('pa-member-id', s.id);
    setVal('pa-member-lastfirst', s.firstName && s.lastName ? s.firstName + ' ' + s.lastName : (s.firstName || s.lastName || ''));
    setVal('pa-member-preferred', s.preferredName);
    setVal('pa-member-suffix', s.suffix);
    setDate('pa-member-dob', s.dateOfBirth);
    setVal('pa-member-gender', s.gender);
    setVal('pa-member-photo', s.photoUrl);

    // Contact
    setVal('pa-member-email', s.email || s.primaryEmail);
    setVal('pa-member-email2', s.secondaryEmail);
    setVal('pa-member-phone', s.phone || s.cellPhone);
    setVal('pa-member-homephone', s.homePhone);
    setVal('pa-member-workphone', s.workPhone);
    setVal('pa-member-website', s.websiteLink);
    setVal('pa-member-prefcontact', s.preferredContact);

    // Address
    setVal('pa-member-addr1', s.address1);
    setVal('pa-member-addr2', s.address2);
    setVal('pa-member-city', s.city);
    setVal('pa-member-state', s.state);
    setVal('pa-member-zip', s.zip);
    setVal('pa-member-country', s.country);

    // Family
    setVal('pa-member-marital', s.maritalStatus);
    setVal('pa-member-spouse', s.spouseName);
    setVal('pa-member-familyrole', s.familyRole);
    setVal('pa-member-household', s.householdId);
    setVal('pa-member-emergname', s.emergencyContact);
    setVal('pa-member-emergphone', s.emergencyPhone);

    // Membership & Spiritual
    setVal('pa-member-status-sel', s.membershipStatus);
    setDate('pa-member-since', s.membershipDate || s.memberSince);
    setDate('pa-member-baptism', s.baptismDate);
    setDate('pa-member-salvation', s.salvationDate);
    setVal('pa-member-howfound', s.howFoundUs);
    setDate('pa-member-death', s.dateOfDeath);
    setCheck('pa-member-t', s.t);
    setCheck('pa-member-b', s.b);
    setCheck('pa-member-m', s.m);
    setCheck('pa-member-p', s.p);

    // Ministry
    setVal('pa-member-ministry', s.ministryTeams);
    setVal('pa-member-volunteer', s.volunteerRoles);
    setVal('pa-member-gifts', s.spiritualGifts);
    setVal('pa-member-smallgroup', s.smallGroup);

    // Pastoral follow-up
    setDate('pa-member-lastcontact', s.lastContactDate);
    setDate('pa-member-nextfollowup', s.nextFollowUp);
    setVal('pa-member-followuppri', s.followUpPriority);
    setVal('pa-member-assigned', s.assignedTo);

    // Notes
    setVal('pa-member-notes', s.pastoralNotes);

    // Audit metadata (read-only display)
    var auditEl = document.getElementById('pa-member-audit');
    if (auditEl) {
        if (row) {
            var parts = [];
            if (s.createdBy) {
                var cAt = s.createdAt ? new Date(s.createdAt) : null;
                parts.push('Created by ' + s.createdBy + (cAt && !isNaN(cAt.getTime()) ? ' on ' + cAt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : ''));
            }
            if (s.updatedBy) {
                var uAt = s.updatedAt ? new Date(s.updatedAt) : null;
                parts.push('Last updated by ' + s.updatedBy + (uAt && !isNaN(uAt.getTime()) ? ' on ' + uAt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : ''));
            }
            auditEl.textContent = parts.join(' · ') || '';
            auditEl.style.display = parts.length ? '' : 'none';
        } else {
            auditEl.textContent = '';
            auditEl.style.display = 'none';
        }
    }

    if (title) title.textContent = row ? '🐑 Edit Member' : '🐑 Add Member';
    if (sub) {
        sub.textContent = row
            ? (s.lastFirst || s.email || 'Edit member record')
            : 'Create a new pastoral member record';
    }
    if (status) {
        status.textContent = '';
        status.className = 'pa-member-status';
    }
    if (deleteBtn) {
        deleteBtn.style.display = row ? '' : 'none';
        deleteBtn.disabled = false;
        deleteBtn.textContent = row && row.archived ? 'Unarchive Member' : 'Archive Member';
    }

    if (overlay) {
        overlay.classList.add('active');
        overlay.setAttribute('aria-hidden', 'false');
    }

    setTimeout(function() {
        var el = document.getElementById('pa-member-lastfirst');
        if (el) el.focus();
    }, 50);
}

function pastoralCloseMemberModal() {
    const overlay = document.getElementById('pa-member-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
    }
    _pastoralActiveEditRow = null;
    pastoralAppState.editorMode = 'create';
}

function pastoralSaveMemberFromModal() {
    const endpoint = window.PASTORAL_DB_V2_ENDPOINT || '';
    const auth = getPastoralAuthPayload();
    const status = document.getElementById('pa-member-status');
    const saveBtn = document.getElementById('pa-member-save');

    if (!endpoint) return;
    if (!auth) {
        if (status) {
            status.textContent = 'Session expired. Re-open Secure and sign in again.';
            status.className = 'pa-member-status err';
        }
        pastoralRedirectToSecure('Missing secure session while saving member.');
        return;
    }

    function getVal(id) {
        var el = document.getElementById(id);
        return String(el ? el.value : '').trim();
    }

    var lastFirst = getVal('pa-member-lastfirst');
    var email = getVal('pa-member-email');

    if (!lastFirst && !email) {
        if (status) {
            status.textContent = 'Provide at least a name or email.';
            status.className = 'pa-member-status err';
        }
        return;
    }

    // Split firstLast into firstName / lastName for v2
    var nameParts = lastFirst.trim().split(/\s+/);
    var lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
    var firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : nameParts[0] || '';

    // Build tags from T/B/M/P checkboxes
    var tagFlags = [];
    if (document.getElementById('pa-member-t').checked) tagFlags.push('T');
    if (document.getElementById('pa-member-b').checked) tagFlags.push('B');
    if (document.getElementById('pa-member-m').checked) tagFlags.push('M');
    if (document.getElementById('pa-member-p').checked) tagFlags.push('P');

    const mode = pastoralAppState.editorMode === 'edit' ? 'edit' : 'create';
    const action = mode === 'edit' ? 'members.update' : 'members.create';

    const params = new URLSearchParams({
        action: action,
        token: auth.token,
        authEmail: auth.email,
        // Identity
        id: getVal('pa-member-id'),
        firstName: firstName,
        lastName: lastName,
        preferredName: getVal('pa-member-preferred'),
        suffix: getVal('pa-member-suffix'),
        dateOfBirth: getVal('pa-member-dob'),
        gender: getVal('pa-member-gender'),
        photoUrl: getVal('pa-member-photo'),
        // Contact
        primaryEmail: email,
        secondaryEmail: getVal('pa-member-email2'),
        cellPhone: getVal('pa-member-phone'),
        homePhone: getVal('pa-member-homephone'),
        workPhone: getVal('pa-member-workphone'),
        websiteLink: getVal('pa-member-website'),
        preferredContact: getVal('pa-member-prefcontact'),
        // Address
        address1: getVal('pa-member-addr1'),
        address2: getVal('pa-member-addr2'),
        city: getVal('pa-member-city'),
        state: getVal('pa-member-state'),
        zip: getVal('pa-member-zip'),
        country: getVal('pa-member-country'),
        // Family
        maritalStatus: getVal('pa-member-marital'),
        spouseName: getVal('pa-member-spouse'),
        familyRole: getVal('pa-member-familyrole'),
        householdId: getVal('pa-member-household'),
        emergencyContact: getVal('pa-member-emergname'),
        emergencyPhone: getVal('pa-member-emergphone'),
        // Membership & Spiritual
        membershipStatus: getVal('pa-member-status-sel'),
        memberSince: getVal('pa-member-since'),
        baptismDate: getVal('pa-member-baptism'),
        salvationDate: getVal('pa-member-salvation'),
        howFoundUs: getVal('pa-member-howfound'),
        dateOfDeath: getVal('pa-member-death'),
        tags: tagFlags.join(','),
        // Ministry
        ministryTeams: getVal('pa-member-ministry'),
        volunteerRoles: getVal('pa-member-volunteer'),
        spiritualGifts: getVal('pa-member-gifts'),
        smallGroup: getVal('pa-member-smallgroup'),
        // Pastoral follow-up
        lastContactDate: getVal('pa-member-lastcontact'),
        nextFollowUp: getVal('pa-member-nextfollowup'),
        followUpPriority: getVal('pa-member-followuppri'),
        assignedTo: getVal('pa-member-assigned'),
        // Notes
        pastoralNotes: getVal('pa-member-notes')
    });

    if (mode === 'edit' && _pastoralActiveEditRow) {
        params.set('rowIndex', String(_pastoralActiveEditRow.index));
    }

    if (saveBtn) saveBtn.disabled = true;
    if (status) {
        status.textContent = mode === 'edit' ? 'Saving member…' : 'Creating member…';
        status.className = 'pa-member-status';
    }

    pastoralFetchNoReferrer(endpoint + '?' + params.toString())
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (!data || !data.ok) {
                const message = (data && data.message) || 'Unknown error';
                if (pastoralIsAuthErrorMessage(message)) {
                    pastoralCloseMemberModal();
                    pastoralRedirectToSecure(message);
                    return;
                }
                throw new Error(message);
            }

            const fresh = data.row ? pastoralNormalizeRow(data.row, data.row.index) : null;
            if (fresh) {
                if (mode === 'edit' && _pastoralActiveEditRow) {
                    Object.assign(_pastoralActiveEditRow, fresh);
                } else {
                    pastoralAppState.rows.unshift(fresh);
                }
                pastoralRender();
            } else {
                pastoralFetchData();
            }

            pastoralCloseMemberModal();
        })
        .catch(function(err) {
            if (status) {
                status.textContent = 'Error: ' + String(err && err.message ? err.message : err);
                status.className = 'pa-member-status err';
            }
        })
        .finally(function() {
            if (saveBtn) saveBtn.disabled = false;
        });
}

function pastoralDeleteMemberFromModal() {
    if (!_pastoralActiveEditRow) return;

    const endpoint = window.PASTORAL_DB_V2_ENDPOINT || '';
    const auth = getPastoralAuthPayload();
    const status = document.getElementById('pa-member-status');
    const deleteBtn = document.getElementById('pa-member-delete');
    const saveBtn = document.getElementById('pa-member-save');
    const row = _pastoralActiveEditRow;

    if (!endpoint) return;
    if (!auth) {
        if (status) {
            status.textContent = 'Session expired. Re-open Secure and sign in again.';
            status.className = 'pa-member-status err';
        }
        pastoralRedirectToSecure('Missing secure session while deleting member.');
        return;
    }

    const label = String(row.lastFirst || row.email || row.id || 'this member');
    const shouldUnarchive = !!row.archived;
    const ok = shouldUnarchive
        ? window.confirm('Unarchive ' + label + '? This will restore the member to active view.')
        : window.confirm('Archive ' + label + '? This keeps history and hides the member from the active table.');
    if (!ok) return;

    if (deleteBtn) deleteBtn.disabled = true;
    if (saveBtn) saveBtn.disabled = true;
    if (status) {
        status.textContent = shouldUnarchive ? 'Unarchiving member…' : 'Archiving member…';
        status.className = 'pa-member-status err';
    }

    const params = new URLSearchParams({
        action: shouldUnarchive ? 'members.unarchive' : 'members.archive',
        token: auth.token,
        authEmail: auth.email,
        rowIndex: String(row.index)
    });

    pastoralFetchNoReferrer(endpoint + '?' + params.toString())
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (!data || !data.ok) {
                const message = (data && data.message) || 'Unknown error';
                if (pastoralIsAuthErrorMessage(message)) {
                    pastoralCloseMemberModal();
                    pastoralRedirectToSecure(message);
                    return;
                }
                throw new Error(message);
            }

            if (data.row) {
                Object.assign(row, pastoralNormalizeRow(data.row, data.row.index));
            } else {
                row.archived = !shouldUnarchive;
            }

            pastoralRender();
            pastoralCloseMemberModal();
        })
        .catch(function(err) {
            if (status) {
                status.textContent = 'Error: ' + String(err && err.message ? err.message : err);
                status.className = 'pa-member-status err';
            }
        })
        .finally(function() {
            if (deleteBtn) deleteBtn.disabled = false;
            if (saveBtn) saveBtn.disabled = false;
        });
}

function pastoralOpenNotesModal(row, snippetEl) {
    _pastoralActiveNoteRow = row;
    _pastoralActiveNoteSnippet = snippetEl || null;

    const overlay = document.getElementById('pa-notes-overlay');
    const sub     = document.getElementById('pa-notes-dlg-sub');
    const existing = document.getElementById('pa-notes-existing');
    const existingWrap = document.getElementById('pa-notes-existing-wrap');
    const input   = document.getElementById('pa-notes-input');
    const status  = document.getElementById('pa-notes-status');

    if (sub) sub.textContent = row.lastFirst || '';
    if (status) { status.textContent = ''; status.className = 'pa-notes-status'; }

    const currentNote = String(row.pastoralNotes || '').trim();
    if (currentNote) {
        if (existing) existing.textContent = currentNote;
        if (existingWrap) existingWrap.style.display = '';
    } else {
        if (existingWrap) existingWrap.style.display = 'none';
    }

    const metaEl = document.getElementById('pa-notes-updated-meta');
    if (metaEl) {
        const meta = pastoralFormatUpdatedMeta(row);
        metaEl.textContent = meta;
        metaEl.style.display = meta ? '' : 'none';
    }

    if (input) {
        input.value = '';
        input.placeholder = currentNote ? 'Add a new note (will append)…' : 'Type a pastoral note…';
    }

    if (overlay) {
        overlay.classList.add('active');
        overlay.setAttribute('aria-hidden', 'false');
    }
    setTimeout(function() { if (input) input.focus(); }, 50);
}

function pastoralCloseNotesModal() {
    const overlay = document.getElementById('pa-notes-overlay');
    const input   = document.getElementById('pa-notes-input');
    if (overlay) { overlay.classList.remove('active'); overlay.setAttribute('aria-hidden', 'true'); }
    if (input)   input.value = '';
    _pastoralActiveNoteRow    = null;
    _pastoralActiveNoteSnippet = null;
}

function pastoralSaveNoteFromModal() {
    const row     = _pastoralActiveNoteRow;
    const input   = document.getElementById('pa-notes-input');
    const saveBtn = document.getElementById('pa-notes-save');
    const status  = document.getElementById('pa-notes-status');
    const endpoint = window.PASTORAL_DB_V2_ENDPOINT || '';
    const auth = getPastoralAuthPayload();

    if (!row || !input || !endpoint) return;
    if (!auth) {
        if (status) {
            status.textContent = 'Session expired. Re-open Secure and sign in again.';
            status.className = 'pa-notes-status err';
        }
        pastoralRedirectToSecure('Missing secure session while saving note.');
        return;
    }

    const rawNew = input.value.trim();
    if (!rawNew) {
        if (status) { status.textContent = 'Note cannot be empty.'; status.className = 'pa-notes-status err'; }
        return;
    }

    // Append new note to existing, separated by a blank line
    const existing = String(row.pastoralNotes || '').trim();
    const combined = existing ? existing + '\n\n' + rawNew : rawNew;

    if (saveBtn) saveBtn.disabled = true;
    if (status) { status.textContent = 'Saving…'; status.className = 'pa-notes-status'; }

    const params = new URLSearchParams({
        action: 'members.update',
        rowIndex: row.index,
        pastoralNotes: combined,
        token: auth.token,
        email: auth.email
    });

    pastoralFetchNoReferrer(endpoint + '?' + params.toString())
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data && data.ok) {
                row.pastoralNotes = combined;
                if (_pastoralActiveNoteSnippet) {
                    _pastoralActiveNoteSnippet.textContent = combined;
                    _pastoralActiveNoteSnippet.classList.add('has-note');
                    // Update button label to "Edit" now that a note exists
                    const btn = _pastoralActiveNoteSnippet.nextElementSibling;
                    if (btn && btn.classList.contains('pa-note-btn')) btn.textContent = '✏️ Edit';
                }
                pastoralCloseNotesModal();
            } else {
                const message = (data && data.message) || 'Unknown';
                if (pastoralIsAuthErrorMessage(message)) {
                    pastoralCloseNotesModal();
                    pastoralRedirectToSecure(message);
                    return;
                }
                if (status) { status.textContent = 'Error: ' + ((data && data.message) || 'Unknown'); status.className = 'pa-notes-status err'; }
            }
        })
        .catch(function(err) {
            if (status) { status.textContent = 'Network error.'; status.className = 'pa-notes-status err'; }
            console.warn('Note save error:', err);
        })
        .finally(function() { if (saveBtn) saveBtn.disabled = false; });
}

// ── CHECKBOX TOGGLE ───────────────────────────────────────────────────────────

function pastoralToggleCheckbox(btn, row) {
    const key = btn.dataset.key;
    const newVal = btn.dataset.active !== '1';
    const endpoint = window.PASTORAL_DB_V2_ENDPOINT || '';
    const auth = getPastoralAuthPayload();
    if (!endpoint) { console.warn('PASTORAL_DB_V2_ENDPOINT not set'); return; }
    if (!auth) {
        console.warn('Secure session is missing for pastoral update');
        pastoralRedirectToSecure('Missing secure session while updating checkboxes.');
        return;
    }

    btn.disabled = true;

    // Rebuild tags string from current row state with the toggled value
    const flagMap = { t: !!row.t, b: !!row.b, m: !!row.m, p: !!row.p };
    flagMap[key] = newVal;
    const tagFlags = [];
    if (flagMap.t) tagFlags.push('T');
    if (flagMap.b) tagFlags.push('B');
    if (flagMap.m) tagFlags.push('M');
    if (flagMap.p) tagFlags.push('P');

    const params = new URLSearchParams({
        action: 'members.update',
        rowIndex: row.index,
        token: auth.token,
        email: auth.email,
        tags: tagFlags.join(',')
    });

    pastoralFetchNoReferrer(endpoint + '?' + params.toString())
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data && data.ok) {
                row[key] = newVal;
                btn.dataset.active = newVal ? '1' : '0';
                btn.className = 'pa-badge ' + (newVal ? 'pa-badge-on' : 'pa-badge-off');
            } else {
                if (pastoralIsAuthErrorMessage(data && data.message)) {
                    pastoralRedirectToSecure((data && data.message) || 'Unauthorized');
                    return;
                }
                console.warn('Checkbox update failed:', data && data.message);
            }
        })
        .catch(function(err) { console.warn('Checkbox update error:', err); })
        .finally(function() { btn.disabled = false; });
}

// ── FETCH DATA ────────────────────────────────────────────────────────────────

function pastoralFetchData() {
    const endpoint = window.PASTORAL_DB_V2_ENDPOINT || '';
    const auth = getPastoralAuthPayload();
    const tbody = document.getElementById('pa-tbody');
    const errEl = document.getElementById('pa-error-msg');
    if (!tbody) return;

    if (!endpoint) {
        if (errEl) { errEl.className = 'pa-error'; errEl.textContent = 'PASTORAL_DB_V2_ENDPOINT is not configured.'; errEl.style.display = ''; }
        return;
    }
    if (!auth) {
        if (errEl) {
            errEl.className = 'pa-error';
            errEl.textContent = 'Secure session required. Open Secure and sign in first.';
            errEl.style.display = '';
        }
        pastoralRedirectToSecure('Missing secure session while loading pastoral list.');
        return;
    }

    pastoralAppState.loading = true;

    const preload = window.__PASTORAL_PRELOAD_CACHE__;
    const cacheFresh = preload
        && Array.isArray(preload.rows)
        && preload.rows.length
        && preload.endpoint === endpoint
        && (Date.now() - Number(preload.at || 0)) < 10 * 60 * 1000;
    if (cacheFresh && !pastoralAppState.loaded) {
        pastoralAppState.rows = pastoralNormalizeRows(preload.rows);
        pastoralAppState.loaded = true;
        pastoralRender();
    }

    tbody.innerHTML = [1, 2, 3, 4, 5].map(function() {
        return `<tr><td colspan="3"><div class="pa-loading-shimmer"></div></td></tr>`;
    }).join('');

    const params = new URLSearchParams({
        action: 'members.list',
        token: auth.token,
        email: auth.email,
        includeArchived: 'true',
        _: String(Date.now())
    });

    pastoralFetchNoReferrer(endpoint + '?' + params.toString())
        .then(function(r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        })
        .then(function(data) {
            if (!data || !data.ok) {
                if (pastoralIsAuthErrorMessage(data && data.message)) {
                    pastoralRedirectToSecure((data && data.message) || 'Unauthorized');
                    return;
                }
                throw new Error(data && data.message ? data.message : 'Server error');
            }
            pastoralAppState.rows = pastoralNormalizeRows(data.rows);
            pastoralAppState.loaded = true;
            pastoralRender();
        })
        .catch(function(err) {
            if (pastoralIsAuthErrorMessage(err && err.message)) {
                pastoralRedirectToSecure(err && err.message ? err.message : 'Unauthorized');
                return;
            }
            if (errEl) {
                errEl.className = 'pa-error';
                errEl.textContent = 'Failed to load members: ' + String(err && err.message ? err.message : err);
                errEl.style.display = '';
            } else if (tbody) {
                tbody.innerHTML = `<tr><td colspan="3" class="pa-error">${escapeHtml(String(err && err.message ? err.message : err))}</td></tr>`;
            }
            console.warn('Pastoral fetch error:', err);
        })
        .finally(function() { pastoralAppState.loading = false; });
}

// ── ENTRY POINT ───────────────────────────────────────────────────────────────

function openPastoralApp(options) {
    const opts = options && typeof options === 'object' ? options : {};
    const hostElement = opts.hostElement || null;
    const isEmbedded = !!hostElement;

    if (!isEmbedded && typeof window.hasActiveSecureVaultSession === 'function' && !window.hasActiveSecureVaultSession()) {
        if (typeof openHomeSecureLogin === 'function') openHomeSecureLogin();
        return;
    }

    if (!isEmbedded) {
        const backText = document.getElementById('modal-back-text');
        const backBtn = document.getElementById('modal-back-btn');
        const title = document.getElementById('modal-title');
        const subtitle = document.getElementById('modal-subtitle');
        const modal = document.getElementById('data-modal');

        if (backText) backText.innerText = 'CLOSE';
        if (backBtn) {
            backBtn.onclick = function() {
                if (typeof closeModal === 'function') closeModal();
            };
        }
        if (title) {
            title.innerHTML =
                '<span style="filter:none !important; text-shadow:none !important; margin-right:8px;">🐑</span>SHEEP';
        }
        if (subtitle) subtitle.innerText = 'PASTORAL MEMBERS';

        if (modal) modal.classList.add('active');
        if (typeof bounceModalBodyToTop === 'function') bounceModalBodyToTop();
    }

    renderPastoralAppShell(hostElement);

    pastoralFetchData();
}

window.openPastoralApp = openPastoralApp;
