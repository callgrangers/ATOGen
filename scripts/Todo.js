// ==========================================
// APP: TO DO LIST — Secure Vault Tab
// ==========================================
// Renders a searchable, filterable to-do list inside the
// Secure Vault workspace. Uses the same auth/fetch patterns
// as the Pastoral (Sheep) app.
//
// Google Sheet tab: "ToDo"
// Headers: ID | Title | Description | AssignedTo | DueDate |
//          Priority | Status | Notes | AutoLog | CreatedBy |
//          CreatedAt | UpdatedBy | UpdatedAt
// ==========================================

const todoAppState = {
    rows: [],
    loaded: false,
    loading: false,
    filter: '',
    editorMode: 'create',
    showArchived: false,
    viewMode: window.innerWidth <= 640 ? 'cards' : 'table',
    autoCards: false
};

let _todoActiveEditRow = null;
let _todoActiveNoteRow = null;
let _todoResizeRaf = 0;

window.__TODO_PRELOAD_CACHE__ = window.__TODO_PRELOAD_CACHE__ || null;

// ── Fetch helper (mirrors Pastoral) ──────────────────────────

function todoFetchNoReferrer(url) {
    return fetch(url, {
        method: 'GET',
        cache: 'no-store',
        credentials: 'omit',
        referrerPolicy: 'no-referrer'
    });
}

function todoEscapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function todoFormatDisplayDate(raw) {
    if (!raw) return '—';
    var d = new Date(raw);
    if (isNaN(d.getTime())) return String(raw);
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    var yyyy = d.getFullYear();
    var hh = String(d.getHours()).padStart(2, '0');
    var min = String(d.getMinutes()).padStart(2, '0');
    var datePart = mm + '/' + dd + '/' + yyyy;
    return (hh === '00' && min === '00') ? datePart : datePart + ' ' + hh + ':' + min;
}

// ── Normalize ────────────────────────────────────────────────

function todoNormalizeRow(row, fallbackIndex) {
    const source = row && typeof row === 'object' ? row : {};
    const out = Object.assign({}, source);

    const parsedIndex = Number(source.index || source.rowIndex || source.row_index || 0);
    out.index = Number.isFinite(parsedIndex) && parsedIndex > 0 ? parsedIndex : Number(fallbackIndex || 0);
    out.id          = String(source.id          == null ? '' : source.id);
    out.title       = String(source.title       == null ? '' : source.title);
    out.description = String(source.description == null ? '' : source.description);
    out.assignedTo  = String(source.assignedTo  == null ? '' : source.assignedTo);
    out.dueDate     = String(source.dueDate     == null ? '' : source.dueDate);
    out.priority    = String(source.priority    == null ? 'Medium' : source.priority);
    out.status      = String(source.status      == null ? 'Not Started' : source.status);
    out.notes       = String(source.notes       == null ? '' : source.notes);
    out.autoLog     = String(source.autoLog     == null ? '' : source.autoLog);
    out.createdBy   = String(source.createdBy   == null ? '' : source.createdBy);
    out.createdAt   = String(source.createdAt   == null ? '' : source.createdAt);
    out.updatedBy   = String(source.updatedBy   == null ? '' : source.updatedBy);
    out.updatedAt   = String(source.updatedAt   == null ? '' : source.updatedAt);
    out.archived    = (out.status.toLowerCase() === 'archived');

    return out;
}

function todoNormalizeRows(rows) {
    const list = Array.isArray(rows) ? rows : [];
    return list
        .filter(function(row) { return row && typeof row === 'object'; })
        .map(function(row, idx) {
            return todoNormalizeRow(row, idx + 2);
        });
}

// ── Auth (reuses Pastoral auth helper) ───────────────────────

function getTodoAuthPayload() {
    if (typeof getPastoralAuthPayload === 'function') {
        return getPastoralAuthPayload();
    }

    const secureKey = (typeof SECURE_SESSION_KEY !== 'undefined' && SECURE_SESSION_KEY)
        ? SECURE_SESSION_KEY
        : 'atogen_secure_vault_v1';

    try {
        const raw = localStorage.getItem(secureKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;
        const token = String(parsed.token || '').trim();
        const email = String(parsed.email || '').trim().toLowerCase();
        if (!token || !email) return null;
        return { token: token, email: email };
    } catch (err) {
        return null;
    }
}

function todoIsAuthErrorMessage(message) {
    const text = String(message || '').toLowerCase();
    return (
        text.includes('missing token') ||
        text.includes('missing email') ||
        text.includes('unauthorized') ||
        text.includes('access denied') ||
        text.includes('session expired')
    );
}

function todoRedirectToSecure(reason) {
    const msg = String(reason || 'Session expired. Please sign in again.');
    try {
        if (typeof closeModal === 'function') closeModal();
    } catch (err) { /* noop */ }
    if (typeof openHomeSecureLogin === 'function') {
        openHomeSecureLogin();
    }
    console.warn('ToDo auth redirect:', msg);
}

// ── Preload ──────────────────────────────────────────────────

window.preloadTodoItems = async function preloadTodoItems() {
    const endpoint = String(window.TODO_ENDPOINT || '').trim();
    const auth = getTodoAuthPayload();
    if (!endpoint || !auth) return null;

    const params = new URLSearchParams({
        action: 'todo.list',
        token: auth.token,
        email: auth.email,
        _: String(Date.now())
    });

    try {
        const resp = await todoFetchNoReferrer(endpoint + '?' + params.toString());
        if (!resp.ok) {
            if (resp.status === 401 || resp.status === 403) return null;
            throw new Error('ToDo preload failed: HTTP ' + resp.status);
        }

        const data = await resp.json();
        if (!data || !data.ok) {
            if (todoIsAuthErrorMessage(data && data.message)) return null;
            throw new Error((data && data.message) || 'ToDo preload failed');
        }

        const rows = todoNormalizeRows(data.rows);
        window.__TODO_PRELOAD_CACHE__ = {
            endpoint: endpoint,
            rows: rows,
            at: Date.now()
        };
        return window.__TODO_PRELOAD_CACHE__;
    } catch (err) {
        if (todoIsAuthErrorMessage(err && err.message)) return null;
        throw err;
    }
};

// ── Styles ───────────────────────────────────────────────────

function todoEnsureStyles() {
    if (document.getElementById('todo-app-style')) return;
    const style = document.createElement('style');
    style.id = 'todo-app-style';
    style.textContent = `
        .td-wrap {
            font-family: 'Avenir Next', 'Segoe UI', sans-serif;
            color: #d8e1eb;
            background:
                radial-gradient(1200px 480px at 8% -30%, rgba(34, 197, 94, 0.14), transparent 55%),
                radial-gradient(900px 420px at 100% -20%, rgba(14, 165, 233, 0.10), transparent 52%),
                linear-gradient(180deg, rgba(2, 8, 18, 0.95), rgba(5, 13, 28, 0.95));
            border: 1px solid rgba(148, 163, 184, 0.18);
            border-radius: 16px;
            padding: 16px;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 18px 40px rgba(2, 6, 23, 0.45);
        }

        /* ── Toolbar ── */
        .td-toolbar {
            display: grid;
            gap: 12px;
            margin-bottom: 14px;
            padding: 12px;
            border-radius: 14px;
            border: 1px solid rgba(148, 163, 184, 0.2);
            background: linear-gradient(160deg, rgba(15, 23, 42, 0.72), rgba(7, 15, 30, 0.86));
        }
        .td-toolbar-main {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
        }
        .td-toolbar-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }
        .td-search-wrap {
            flex: 1;
            min-width: 220px;
            position: relative;
        }
        .td-search-wrap::before {
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
        .td-search {
            width: 100%; box-sizing: border-box;
            background: rgba(15, 23, 42, 0.72); border: 1px solid rgba(148, 163, 184, 0.32);
            border-radius: 10px; color: #ecf3fb; padding: 23px 14px 8px; font-size: 0.88rem;
            outline: none;
        }
        .td-search:focus {
            border-color: #38bdf8;
            box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
        }
        .td-search::placeholder { color: #6b84a0; }
        .td-count {
            font-size: 0.72rem;
            color: #b7c7d9;
            white-space: nowrap;
            padding: 8px 11px;
            border-radius: 999px;
            border: 1px solid rgba(148, 163, 184, 0.3);
            background: rgba(15, 23, 42, 0.65);
            letter-spacing: 0.02em;
        }

        /* ── Buttons ── */
        .td-add-btn {
            border: 1px solid rgba(34,197,94,0.58);
            background: linear-gradient(180deg, rgba(34,197,94,0.26), rgba(22,163,74,0.25));
            color: #dcfce7;
            border-radius: 9px;
            font-size: 0.78rem;
            font-weight: 700;
            letter-spacing: 0.04em;
            padding: 8px 13px;
            cursor: pointer;
            transition: 0.15s ease;
        }
        .td-add-btn:hover {
            background: linear-gradient(180deg, rgba(74,222,128,0.34), rgba(34,197,94,0.34));
            color: #ecfdf5;
        }
        .td-archive-toggle-btn {
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
        .td-archive-toggle-btn:hover {
            background: rgba(100,116,139,0.4);
            color: #f1f5f9;
        }
        .td-archive-toggle-btn.active {
            border-color: rgba(34,197,94,0.55);
            background: rgba(22,163,74,0.2);
            color: #86efac;
        }
        .td-view-toggle-btn {
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
        .td-view-toggle-btn:hover { background: rgba(79, 70, 229, 0.32); }

        /* ── Quick Filters ── */
        .td-quick-row {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
            padding: 6px 0 0;
        }
        .td-quick-label {
            font-size: 0.64rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.07em;
            color: #7fb0dd;
        }
        .td-quick-btn {
            font-size: 0.72rem;
            font-weight: 700;
            padding: 4px 10px;
            border: 1px solid rgba(148,163,184,0.32);
            border-radius: 999px;
            background: rgba(15,23,42,0.55);
            color: #b7c7d9;
            cursor: pointer;
            transition: 0.15s;
        }
        .td-quick-btn:hover { border-color: rgba(56,189,248,0.6); color: #ecf3fb; }
        .td-quick-btn.is-active {
            border-color: rgba(56,189,248,0.7);
            background: rgba(56,189,248,0.18);
            color: #e0f7ff;
        }

        /* ── Table ── */
        .td-table-scroll {
            overflow-x: auto;
            overflow-y: auto;
            max-height: min(56vh, 560px);
            border-radius: 14px;
            border: 1px solid rgba(148,163,184,0.24);
            background: linear-gradient(180deg, rgba(8, 14, 28, 0.82), rgba(6, 11, 22, 0.82));
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
        }
        .td-table {
            width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.82rem;
            min-width: 860px;
        }
        .td-table thead tr {
            background: rgba(10,22,39,0.94);
            border-bottom: 1px solid rgba(125,211,252,0.3);
        }
        .td-table th {
            padding: 10px 12px; text-align: left; font-size: 0.66rem;
            font-weight: 800; letter-spacing: 0.1em; color: #86d7ff;
            text-transform: uppercase; white-space: nowrap; user-select: none;
            position: sticky; top: 0; z-index: 3;
            background: rgba(10,22,39,0.95);
        }
        .td-table tbody tr {
            border-bottom: 1px solid rgba(148,163,184,0.12);
            transition: background 0.12s ease, box-shadow 0.12s ease;
        }
        .td-table tbody tr:last-child { border-bottom: none; }
        .td-table tbody tr:hover {
            background: rgba(56,189,248,0.09);
            box-shadow: inset 0 0 0 1px rgba(56,189,248,0.17);
        }
        .td-table tbody tr.td-row-archived {
            border-color: rgba(148,163,184,0.18);
            background: rgba(100,116,139,0.08);
        }
        .td-table td { padding: 10px 12px; vertical-align: middle; }

        /* ── Priority Badge ── */
        .td-priority-badge {
            font-size: 0.68rem; font-weight: 700; letter-spacing: 0.04em;
            padding: 3px 8px; border-radius: 6px; display: inline-block;
        }
        .td-priority-high {
            background: rgba(239,68,68,0.22); border: 1px solid rgba(239,68,68,0.5); color: #fca5a5;
        }
        .td-priority-medium {
            background: rgba(234,179,8,0.18); border: 1px solid rgba(234,179,8,0.45); color: #fde68a;
        }
        .td-priority-low {
            background: rgba(34,197,94,0.18); border: 1px solid rgba(34,197,94,0.45); color: #86efac;
        }

        /* ── Status Badge ── */
        .td-status-badge {
            font-size: 0.68rem; font-weight: 700; letter-spacing: 0.04em;
            padding: 3px 8px; border-radius: 6px; display: inline-block; white-space: nowrap;
        }
        .td-status-not-started {
            background: rgba(148,163,184,0.18); border: 1px solid rgba(148,163,184,0.4); color: #cbd5e1;
        }
        .td-status-in-progress {
            background: rgba(56,189,248,0.18); border: 1px solid rgba(56,189,248,0.45); color: #7dd3fc;
        }
        .td-status-completed {
            background: rgba(34,197,94,0.18); border: 1px solid rgba(34,197,94,0.45); color: #86efac;
        }
        .td-status-archived {
            background: rgba(100,116,139,0.15); border: 1px solid rgba(100,116,139,0.35); color: #94a3b8;
        }

        /* ── Due Date ── */
        .td-due-overdue { color: #fca5a5; font-weight: 700; }
        .td-due-soon    { color: #fde68a; font-weight: 600; }
        .td-due-ok      { color: #cbd5e1; }

        /* ── Action Buttons in table ── */
        .td-action-btn {
            font-size: 0.7rem;
            padding: 4px 8px;
            border-radius: 7px;
            border: 1px solid rgba(148,163,184,0.38);
            background: rgba(148,163,184,0.14);
            color: #f1f5f9;
            cursor: pointer;
            white-space: nowrap;
            transition: 0.15s;
            margin-right: 4px;
        }
        .td-action-btn:last-child { margin-right: 0; }
        .td-action-btn:hover { background: rgba(148,163,184,0.26); }
        .td-action-btn.edit {
            border-color: rgba(56,189,248,0.4);
            background: rgba(56,189,248,0.14);
            color: #bae6fd;
        }
        .td-action-btn.edit:hover { background: rgba(56,189,248,0.26); }
        .td-action-btn.notes {
            border-color: rgba(168,85,247,0.4);
            background: rgba(168,85,247,0.14);
            color: #d8b4fe;
        }
        .td-action-btn.notes:hover { background: rgba(168,85,247,0.26); }
        .td-action-btn.log {
            border-color: rgba(234,179,8,0.4);
            background: rgba(234,179,8,0.14);
            color: #fde68a;
        }
        .td-action-btn.log:hover { background: rgba(234,179,8,0.26); }

        /* ── Cards View ── */
        .td-cards-wrap { display: grid; gap: 12px; }
        .td-card {
            --td-card-accent: rgba(56,189,248,1);
            border: 1px solid color-mix(in srgb, var(--td-card-accent) 44%, rgba(255,255,255,0.18));
            background: linear-gradient(155deg, color-mix(in srgb, var(--td-card-accent) 12%, transparent), rgba(255,255,255,0.03));
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 24px rgba(2, 6, 23, 0.36);
            transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .td-card:hover {
            transform: translateY(-1px);
            box-shadow: 0 14px 30px rgba(2, 6, 23, 0.45);
        }
        .td-card.td-card-archived {
            border-color: rgba(148,163,184,0.2);
            background: rgba(100,116,139,0.09);
        }
        .td-card-head {
            width: 100%; border: none; background: transparent;
            color: var(--text-main, #e2e8f0); text-align: left;
            padding: 12px; cursor: pointer;
            display: flex; align-items: center; justify-content: space-between; gap: 10px;
        }
        .td-card-title { font-weight: 800; font-size: 0.9rem; }
        .td-card-sub { margin-top: 2px; font-size: 0.76rem; color: #94a3b8; overflow-wrap: anywhere; }
        .td-card-chevron { font-size: 0.9rem; transition: transform 0.18s ease; flex-shrink: 0; color: #7dd3fc; }
        .td-card.is-open .td-card-chevron { transform: rotate(180deg); }
        .td-card-body {
            display: none;
            border-top: 1px solid rgba(255,255,255,0.08);
            padding: 12px; gap: 10px;
        }
        .td-card.is-open .td-card-body { display: grid; }
        .td-card-grid {
            display: grid; gap: 8px 10px;
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .td-card-field { min-width: 0; }
        .td-card-field.full { grid-column: 1 / -1; }
        .td-card-field-label {
            font-size: 0.62rem; font-weight: 700; letter-spacing: 0.08em;
            text-transform: uppercase; color: #7dd3fc; line-height: 1.2;
        }
        .td-card-field-value {
            margin-top: 2px; font-size: 0.83rem;
            color: var(--text-main, #e2e8f0); overflow-wrap: anywhere;
        }
        .td-card-field-value.muted { color: #94a3b8; }
        .td-card-actions { display: flex; flex-wrap: wrap; gap: 8px; }

        /* ── Editor Overlay (add/edit) ── */
        .td-editor-overlay {
            position: fixed; inset: 0;
            display: none; align-items: center; justify-content: center;
            z-index: 1200; background: rgba(0,0,0,0.6);
            backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
        }
        .td-editor-overlay.active { display: flex; }
        .td-editor-dialog {
            width: min(720px, 96vw); max-height: 92vh; overflow-y: auto;
            background: linear-gradient(170deg, rgba(13,20,36,0.97), rgba(6,11,22,0.97));
            border: 1px solid rgba(148,163,184,0.28);
            border-radius: 18px; padding: 22px 18px 16px;
            box-shadow: 0 32px 64px rgba(2,6,23,0.55);
        }
        .td-editor-title {
            font-size: 1.05rem; font-weight: 800; color: #f1f5f9; margin: 0 0 4px;
        }
        .td-editor-sub {
            font-size: 0.78rem; color: #94a3b8; margin: 0 0 16px;
        }
        .td-editor-grid {
            display: grid; gap: 12px 14px;
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .td-editor-field { min-width: 0; }
        .td-editor-field.full { grid-column: 1 / -1; }
        .td-editor-label {
            display: block; font-size: 0.66rem; font-weight: 700;
            letter-spacing: 0.08em; text-transform: uppercase;
            color: #7fb0dd; margin-bottom: 4px;
        }
        .td-editor-input, .td-editor-select {
            width: 100%; box-sizing: border-box;
            background: rgba(15,23,42,0.72);
            border: 1px solid rgba(148,163,184,0.32);
            border-radius: 10px; color: #ecf3fb;
            padding: 10px 12px; font-size: 0.86rem; outline: none;
        }
        .td-editor-input:focus, .td-editor-select:focus {
            border-color: #38bdf8;
            box-shadow: 0 0 0 3px rgba(56,189,248,0.15);
        }
        .td-editor-textarea {
            width: 100%; box-sizing: border-box;
            background: rgba(15,23,42,0.72);
            border: 1px solid rgba(148,163,184,0.32);
            border-radius: 10px; color: #ecf3fb;
            padding: 10px 12px; font-size: 0.84rem; outline: none;
            resize: vertical; min-height: 80px;
        }
        .td-editor-textarea:focus {
            border-color: #38bdf8;
            box-shadow: 0 0 0 3px rgba(56,189,248,0.15);
        }
        .td-editor-foot {
            display: flex; align-items: center; gap: 10px;
            margin-top: 16px; flex-wrap: wrap;
        }
        .td-editor-status {
            flex: 1; font-size: 0.78rem; color: #94a3b8; min-width: 0;
        }
        .td-editor-status.err { color: #fca5a5; }
        .td-editor-status.ok  { color: #86efac; }
        .td-editor-delete-btn {
            border: 1px solid rgba(239,68,68,0.5);
            background: rgba(239,68,68,0.18);
            color: #fca5a5;
            border-radius: 9px; font-size: 0.76rem; font-weight: 700;
            padding: 8px 12px; cursor: pointer; transition: 0.15s;
        }
        .td-editor-delete-btn:hover { background: rgba(239,68,68,0.3); }
        .td-editor-cancel-btn {
            border: 1px solid rgba(148,163,184,0.4);
            background: rgba(71,85,105,0.28);
            color: #d5e0ec;
            border-radius: 9px; font-size: 0.76rem; font-weight: 700;
            padding: 8px 12px; cursor: pointer; transition: 0.15s;
        }
        .td-editor-cancel-btn:hover { background: rgba(100,116,139,0.4); }
        .td-editor-save-btn {
            border: 1px solid rgba(34,197,94,0.58);
            background: linear-gradient(180deg, rgba(34,197,94,0.26), rgba(22,163,74,0.25));
            color: #dcfce7;
            border-radius: 9px; font-size: 0.78rem; font-weight: 700;
            padding: 8px 14px; cursor: pointer; transition: 0.15s;
        }
        .td-editor-save-btn:hover {
            background: linear-gradient(180deg, rgba(74,222,128,0.34), rgba(34,197,94,0.34));
        }

        /* ── Notes Overlay ── */
        .td-notes-overlay {
            position: fixed; inset: 0;
            display: none; align-items: center; justify-content: center;
            z-index: 1200; background: rgba(0,0,0,0.6);
            backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
        }
        .td-notes-overlay.active { display: flex; }
        .td-notes-dialog {
            width: min(560px, 96vw); max-height: 88vh; overflow-y: auto;
            background: linear-gradient(170deg, rgba(13,20,36,0.97), rgba(6,11,22,0.97));
            border: 1px solid rgba(148,163,184,0.28);
            border-radius: 18px; padding: 20px 16px;
            box-shadow: 0 32px 64px rgba(2,6,23,0.55);
        }
        .td-notes-header {
            display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;
        }
        .td-notes-dlg-title { font-size: 1rem; font-weight: 800; color: #f1f5f9; margin: 0; }
        .td-notes-sub { font-size: 0.78rem; color: #94a3b8; margin: 2px 0 0; }
        .td-notes-close {
            border: none; background: transparent; color: #94a3b8; font-size: 1.2rem;
            cursor: pointer; padding: 4px; line-height: 1;
        }
        .td-notes-close:hover { color: #f1f5f9; }
        .td-notes-existing-label {
            font-size: 0.64rem; font-weight: 700; text-transform: uppercase;
            letter-spacing: 0.08em; color: #7fb0dd; margin-bottom: 4px;
        }
        .td-notes-existing {
            background: rgba(15,23,42,0.6);
            border: 1px solid rgba(148,163,184,0.2);
            border-radius: 10px; padding: 10px 12px;
            font-size: 0.82rem; color: #cbd5e1;
            max-height: 160px; overflow-y: auto;
            white-space: pre-wrap; word-break: break-word;
            margin-bottom: 12px;
        }
        .td-notes-field-label {
            display: block; font-size: 0.64rem; font-weight: 700;
            text-transform: uppercase; letter-spacing: 0.08em;
            color: #7fb0dd; margin-bottom: 4px;
        }
        .td-notes-textarea {
            width: 100%; box-sizing: border-box;
            background: rgba(15,23,42,0.72);
            border: 1px solid rgba(148,163,184,0.32);
            border-radius: 10px; color: #ecf3fb;
            padding: 10px 12px; font-size: 0.84rem;
            resize: vertical; min-height: 90px; outline: none;
        }
        .td-notes-textarea:focus {
            border-color: #38bdf8;
            box-shadow: 0 0 0 3px rgba(56,189,248,0.15);
        }
        .td-notes-footer {
            display: flex; align-items: center; gap: 10px;
            margin-top: 14px; flex-wrap: wrap;
        }
        .td-notes-status { flex: 1; font-size: 0.78rem; color: #94a3b8; }
        .td-notes-status.err { color: #fca5a5; }

        /* ── Auto-Log Overlay ── */
        .td-log-overlay {
            position: fixed; inset: 0;
            display: none; align-items: center; justify-content: center;
            z-index: 1200; background: rgba(0,0,0,0.6);
            backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
        }
        .td-log-overlay.active { display: flex; }
        .td-log-dialog {
            width: min(520px, 96vw); max-height: 80vh; overflow-y: auto;
            background: linear-gradient(170deg, rgba(13,20,36,0.97), rgba(6,11,22,0.97));
            border: 1px solid rgba(148,163,184,0.28);
            border-radius: 18px; padding: 20px 16px;
            box-shadow: 0 32px 64px rgba(2,6,23,0.55);
        }
        .td-log-header {
            display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;
        }
        .td-log-title { font-size: 1rem; font-weight: 800; color: #f1f5f9; margin: 0; }
        .td-log-sub { font-size: 0.78rem; color: #94a3b8; margin: 2px 0 0; }
        .td-log-close {
            border: none; background: transparent; color: #94a3b8; font-size: 1.2rem;
            cursor: pointer; padding: 4px; line-height: 1;
        }
        .td-log-close:hover { color: #f1f5f9; }
        .td-log-content {
            background: rgba(15,23,42,0.6);
            border: 1px solid rgba(148,163,184,0.2);
            border-radius: 10px; padding: 12px;
            font-size: 0.78rem; color: #cbd5e1;
            max-height: 400px; overflow-y: auto;
            white-space: pre-wrap; word-break: break-word;
            font-family: 'SF Mono', 'Fira Code', monospace;
            line-height: 1.6;
        }
        .td-log-empty {
            color: #64748b; font-style: italic;
        }

        /* ── Responsive ── */
        @media (max-width: 640px) {
            .td-editor-grid { grid-template-columns: 1fr; }
            .td-card-grid { grid-template-columns: 1fr; }
        }
    `;
    document.head.appendChild(style);
}

// ── Render shell ─────────────────────────────────────────────

function renderTodoAppShell(targetEl) {
    todoEnsureStyles();
    const container = targetEl || document.getElementById('modal-body-container');
    if (!container) return;

    container.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'td-wrap';
    wrap.innerHTML = `
        <!-- Toolbar -->
        <div class="td-toolbar">
            <div class="td-toolbar-main">
                <div class="td-search-wrap">
                    <input class="td-search" id="td-search" type="search" placeholder="Filter tasks…" />
                </div>
                <span class="td-count" id="td-count"></span>
            </div>
            <div class="td-toolbar-actions">
                <button class="td-add-btn" id="td-add-btn">+ New Task</button>
                <button class="td-archive-toggle-btn" id="td-toggle-archived-btn">Archived: Hidden</button>
                <button class="td-view-toggle-btn" id="td-toggle-view-btn">View: Table</button>
            </div>
            <div class="td-quick-row">
                <span class="td-quick-label">Filter</span>
                <button type="button" class="td-quick-btn is-active" data-td-quick="all">All</button>
                <button type="button" class="td-quick-btn" data-td-quick="not-started">Not Started</button>
                <button type="button" class="td-quick-btn" data-td-quick="in-progress">In Progress</button>
                <button type="button" class="td-quick-btn" data-td-quick="completed">Completed</button>
                <button type="button" class="td-quick-btn" data-td-quick="overdue">Overdue</button>
                <button type="button" class="td-quick-btn" data-td-quick="high">High Priority</button>
            </div>
        </div>

        <!-- TABLE VIEW -->
        <div class="td-table-scroll" id="td-table-wrap">
            <table class="td-table" id="td-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Assigned To</th>
                        <th>Due Date</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="td-tbody"></tbody>
            </table>
        </div>

        <!-- CARD VIEW (hidden) -->
        <div class="td-cards-wrap" id="td-cards-wrap" style="display:none;"></div>

        <!-- EDITOR OVERLAY (Add / Edit) -->
        <div class="td-editor-overlay" id="td-editor-overlay" aria-hidden="true">
            <div class="td-editor-dialog">
                <h4 class="td-editor-title" id="td-editor-title">✅ New Task</h4>
                <p class="td-editor-sub" id="td-editor-sub">Create a new to-do item.</p>
                <div class="td-editor-grid">
                    <div class="td-editor-field full">
                        <label class="td-editor-label" for="td-ed-title">Title</label>
                        <input class="td-editor-input" id="td-ed-title" type="text" placeholder="Task title" />
                    </div>
                    <div class="td-editor-field full">
                        <label class="td-editor-label" for="td-ed-description">Description</label>
                        <textarea class="td-editor-textarea" id="td-ed-description" rows="3" placeholder="Detailed description…"></textarea>
                    </div>
                    <div class="td-editor-field">
                        <label class="td-editor-label" for="td-ed-assigned">Assigned To</label>
                        <input class="td-editor-input" id="td-ed-assigned" type="text" placeholder="Name or email" />
                    </div>
                    <div class="td-editor-field">
                        <label class="td-editor-label" for="td-ed-due">Due Date</label>
                        <input class="td-editor-input" id="td-ed-due" type="date" />
                    </div>
                    <div class="td-editor-field">
                        <label class="td-editor-label" for="td-ed-priority">Priority</label>
                        <select class="td-editor-select" id="td-ed-priority">
                            <option value="High">High</option>
                            <option value="Medium" selected>Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>
                    <div class="td-editor-field">
                        <label class="td-editor-label" for="td-ed-status">Status</label>
                        <select class="td-editor-select" id="td-ed-status">
                            <option value="Not Started" selected>Not Started</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                        </select>
                    </div>
                    <div class="td-editor-field full">
                        <label class="td-editor-label" for="td-ed-notes">Notes</label>
                        <textarea class="td-editor-textarea" id="td-ed-notes" rows="3" placeholder="Additional notes…"></textarea>
                    </div>
                </div>
                <div class="td-editor-foot">
                    <span class="td-editor-status" id="td-editor-status"></span>
                    <button class="td-editor-delete-btn" id="td-editor-archive" style="display:none;">Archive</button>
                    <button class="td-editor-cancel-btn" id="td-editor-cancel">Cancel</button>
                    <button class="td-editor-save-btn" id="td-editor-save">Save Task</button>
                </div>
            </div>
        </div>

        <!-- NOTES OVERLAY -->
        <div class="td-notes-overlay" id="td-notes-overlay" aria-hidden="true">
            <div class="td-notes-dialog">
                <div class="td-notes-header">
                    <div>
                        <h5 class="td-notes-dlg-title">📝 Task Notes</h5>
                        <p class="td-notes-sub" id="td-notes-sub"></p>
                    </div>
                    <button class="td-notes-close" id="td-notes-close">✕</button>
                </div>
                <div id="td-notes-existing-wrap" style="display:none;">
                    <div class="td-notes-existing-label">Current notes</div>
                    <div class="td-notes-existing" id="td-notes-existing"></div>
                </div>
                <div>
                    <label class="td-notes-field-label">New note</label>
                    <textarea class="td-notes-textarea" id="td-notes-input" rows="5" placeholder="Add a note…"></textarea>
                </div>
                <div class="td-notes-footer">
                    <span class="td-notes-status" id="td-notes-status"></span>
                    <button class="td-editor-cancel-btn" id="td-notes-cancel">Cancel</button>
                    <button class="td-editor-save-btn" id="td-notes-save">Save Note</button>
                </div>
            </div>
        </div>

        <!-- AUTO-LOG OVERLAY -->
        <div class="td-log-overlay" id="td-log-overlay" aria-hidden="true">
            <div class="td-log-dialog">
                <div class="td-log-header">
                    <div>
                        <h5 class="td-log-title">📋 Activity Log</h5>
                        <p class="td-log-sub" id="td-log-sub"></p>
                    </div>
                    <button class="td-log-close" id="td-log-close">✕</button>
                </div>
                <div class="td-log-content" id="td-log-content"></div>
            </div>
        </div>
    `;

    container.appendChild(wrap);

    // ── Bind events ──
    todoBindEvents();
    todoFetchData();
}

// ── Event binding ────────────────────────────────────────────

function todoBindEvents() {
    // Search
    const searchEl = document.getElementById('td-search');
    if (searchEl) {
        searchEl.addEventListener('input', function() {
            todoAppState.filter = String(searchEl.value || '').trim().toLowerCase();
            todoRender();
        });
    }

    // Add button
    const addBtn = document.getElementById('td-add-btn');
    if (addBtn) {
        addBtn.addEventListener('click', function() { todoOpenEditor(null); });
    }

    // Archive toggle
    const archBtn = document.getElementById('td-toggle-archived-btn');
    if (archBtn) {
        archBtn.addEventListener('click', function() {
            todoAppState.showArchived = !todoAppState.showArchived;
            archBtn.textContent = 'Archived: ' + (todoAppState.showArchived ? 'Shown' : 'Hidden');
            archBtn.classList.toggle('active', todoAppState.showArchived);
            todoRender();
        });
    }

    // View toggle
    const viewBtn = document.getElementById('td-toggle-view-btn');
    if (viewBtn) {
        viewBtn.textContent = 'View: ' + (todoAppState.viewMode === 'table' ? 'Table' : 'Cards');
        viewBtn.addEventListener('click', function() {
            todoAppState.viewMode = todoAppState.viewMode === 'table' ? 'cards' : 'table';
            viewBtn.textContent = 'View: ' + (todoAppState.viewMode === 'table' ? 'Table' : 'Cards');
            todoRender();
        });
    }

    // Quick filter buttons
    document.querySelectorAll('[data-td-quick]').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('[data-td-quick]').forEach(function(b) { b.classList.remove('is-active'); });
            btn.classList.add('is-active');
            todoAppState.quickFilter = btn.getAttribute('data-td-quick');
            todoRender();
        });
    });

    // Editor events
    document.getElementById('td-editor-cancel').addEventListener('click', todoCloseEditor);
    document.getElementById('td-editor-save').addEventListener('click', todoSaveFromEditor);
    document.getElementById('td-editor-archive').addEventListener('click', todoArchiveFromEditor);

    // Notes events
    document.getElementById('td-notes-close').addEventListener('click', todoCloseNotes);
    document.getElementById('td-notes-cancel').addEventListener('click', todoCloseNotes);
    document.getElementById('td-notes-save').addEventListener('click', todoSaveNote);

    // Log events
    document.getElementById('td-log-close').addEventListener('click', todoCloseLog);

    // Close overlays on background click
    ['td-editor-overlay', 'td-notes-overlay', 'td-log-overlay'].forEach(function(id) {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('click', function(e) {
                if (e.target === el) {
                    el.classList.remove('active');
                    el.setAttribute('aria-hidden', 'true');
                }
            });
        }
    });
}

// ── Fetch data ───────────────────────────────────────────────

async function todoFetchData() {
    const endpoint = String(window.TODO_ENDPOINT || '').trim();
    const auth = getTodoAuthPayload();

    if (!endpoint) {
        todoAppState.rows = [];
        todoAppState.loaded = true;
        todoRender();
        return;
    }

    if (!auth) {
        todoRedirectToSecure('Missing secure session.');
        return;
    }

    todoAppState.loading = true;
    todoRender();

    const params = new URLSearchParams({
        action: 'todo.list',
        token: auth.token,
        email: auth.email,
        _: String(Date.now())
    });

    try {
        const resp = await todoFetchNoReferrer(endpoint + '?' + params.toString());
        if (!resp.ok) {
            if (resp.status === 401 || resp.status === 403) {
                todoRedirectToSecure('Authentication failed.');
                return;
            }
            throw new Error('HTTP ' + resp.status);
        }

        const data = await resp.json();
        if (!data || !data.ok) {
            if (todoIsAuthErrorMessage(data && data.message)) {
                todoRedirectToSecure(data.message);
                return;
            }
            throw new Error((data && data.message) || 'Failed to load tasks.');
        }

        todoAppState.rows = todoNormalizeRows(data.rows);
        todoAppState.loaded = true;
        todoAppState.loading = false;

        // Update preload cache
        window.__TODO_PRELOAD_CACHE__ = {
            endpoint: endpoint,
            rows: todoAppState.rows,
            at: Date.now()
        };

        todoRender();
    } catch (err) {
        todoAppState.loading = false;
        todoRender();
        console.warn('ToDo fetch error:', err);
    }
}

// ── Filter logic ─────────────────────────────────────────────

function todoGetFilteredRows() {
    let rows = todoAppState.rows.slice();
    const quick = todoAppState.quickFilter || 'all';
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Archived filter
    if (!todoAppState.showArchived) {
        rows = rows.filter(function(r) { return !r.archived; });
    }

    // Quick filters
    if (quick === 'not-started') {
        rows = rows.filter(function(r) { return r.status === 'Not Started'; });
    } else if (quick === 'in-progress') {
        rows = rows.filter(function(r) { return r.status === 'In Progress'; });
    } else if (quick === 'completed') {
        rows = rows.filter(function(r) { return r.status === 'Completed'; });
    } else if (quick === 'overdue') {
        rows = rows.filter(function(r) {
            if (!r.dueDate || r.status === 'Completed' || r.archived) return false;
            var due = new Date(r.dueDate);
            return due < today;
        });
    } else if (quick === 'high') {
        rows = rows.filter(function(r) { return r.priority === 'High'; });
    }

    // Text search
    if (todoAppState.filter) {
        var q = todoAppState.filter;
        rows = rows.filter(function(r) {
            return (
                r.title.toLowerCase().includes(q) ||
                r.description.toLowerCase().includes(q) ||
                r.assignedTo.toLowerCase().includes(q) ||
                r.notes.toLowerCase().includes(q) ||
                r.priority.toLowerCase().includes(q) ||
                r.status.toLowerCase().includes(q)
            );
        });
    }

    return rows;
}

// ── Render ───────────────────────────────────────────────────

function todoRender() {
    const rows = todoGetFilteredRows();
    const countEl = document.getElementById('td-count');
    const tbodyEl = document.getElementById('td-tbody');
    const tableWrap = document.getElementById('td-table-wrap');
    const cardsWrap = document.getElementById('td-cards-wrap');

    if (countEl) {
        countEl.textContent = todoAppState.loading
            ? 'Loading…'
            : rows.length + ' task' + (rows.length !== 1 ? 's' : '');
    }

    if (todoAppState.viewMode === 'table') {
        if (tableWrap) tableWrap.style.display = '';
        if (cardsWrap) cardsWrap.style.display = 'none';
        todoRenderTable(rows);
    } else {
        if (tableWrap) tableWrap.style.display = 'none';
        if (cardsWrap) cardsWrap.style.display = '';
        todoRenderCards(rows);
    }
}

// ── Table rendering ──────────────────────────────────────────

function todoRenderTable(rows) {
    const tbody = document.getElementById('td-tbody');
    if (!tbody) return;

    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:#64748b;">No tasks found.</td></tr>';
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    tbody.innerHTML = rows.map(function(r) {
        var archClass = r.archived ? ' td-row-archived' : '';

        // Priority badge
        var pClass = 'td-priority-medium';
        if (r.priority === 'High') pClass = 'td-priority-high';
        else if (r.priority === 'Low') pClass = 'td-priority-low';

        // Status badge
        var sClass = 'td-status-not-started';
        if (r.status === 'In Progress') sClass = 'td-status-in-progress';
        else if (r.status === 'Completed') sClass = 'td-status-completed';
        else if (r.archived) sClass = 'td-status-archived';

        // Due date styling
        var dueDisplay = todoFormatDisplayDate(r.dueDate);
        var dueClass = 'td-due-ok';
        if (r.dueDate && r.status !== 'Completed' && !r.archived) {
            var due = new Date(r.dueDate);
            if (due < today) {
                dueClass = 'td-due-overdue';
                dueDisplay = todoFormatDisplayDate(r.dueDate) + ' ⚠️';
            } else {
                var diff = (due - today) / (1000 * 60 * 60 * 24);
                if (diff <= 3) dueClass = 'td-due-soon';
            }
        }

        return '<tr class="' + archClass + '" data-td-row-idx="' + r.index + '">'
            + '<td style="font-weight:700;color:#f1f5f9;min-width:180px;">'
                + '<div>' + todoEscapeHtml(r.title) + '</div>'
                + (r.description ? '<div style="font-size:0.72rem;color:#94a3b8;font-weight:400;margin-top:2px;">' + todoEscapeHtml(r.description.substring(0, 80)) + (r.description.length > 80 ? '…' : '') + '</div>' : '')
            + '</td>'
            + '<td style="color:#cbd5e1;">' + todoEscapeHtml(r.assignedTo || '—') + '</td>'
            + '<td class="' + dueClass + '">' + todoEscapeHtml(dueDisplay) + '</td>'
            + '<td><span class="td-priority-badge ' + pClass + '">' + todoEscapeHtml(r.priority) + '</span></td>'
            + '<td><span class="td-status-badge ' + sClass + '">' + todoEscapeHtml(r.status) + '</span></td>'
            + '<td style="white-space:nowrap;">'
                + '<button class="td-action-btn edit" data-td-action="edit" data-td-idx="' + r.index + '">✏️ Edit</button>'
                + '<button class="td-action-btn notes" data-td-action="notes" data-td-idx="' + r.index + '">📝 Notes</button>'
                + '<button class="td-action-btn log" data-td-action="log" data-td-idx="' + r.index + '">📋 Log</button>'
            + '</td>'
        + '</tr>';
    }).join('');

    // Delegate action clicks
    tbody.onclick = function(e) {
        var btn = e.target.closest('[data-td-action]');
        if (!btn) return;
        var action = btn.getAttribute('data-td-action');
        var idx = parseInt(btn.getAttribute('data-td-idx'), 10);
        var row = todoFindRowByIndex(idx);
        if (!row) return;

        if (action === 'edit') todoOpenEditor(row);
        else if (action === 'notes') todoOpenNotes(row);
        else if (action === 'log') todoOpenLog(row);
    };
}

// ── Card rendering ───────────────────────────────────────────

function todoRenderCards(rows) {
    const cardsWrap = document.getElementById('td-cards-wrap');
    if (!cardsWrap) return;

    if (!rows.length) {
        cardsWrap.innerHTML = '<div style="text-align:center;padding:24px;color:#64748b;">No tasks found.</div>';
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    cardsWrap.innerHTML = rows.map(function(r) {
        var archClass = r.archived ? ' td-card-archived' : '';
        var pClass = 'td-priority-medium';
        if (r.priority === 'High') pClass = 'td-priority-high';
        else if (r.priority === 'Low') pClass = 'td-priority-low';

        var sClass = 'td-status-not-started';
        if (r.status === 'In Progress') sClass = 'td-status-in-progress';
        else if (r.status === 'Completed') sClass = 'td-status-completed';
        else if (r.archived) sClass = 'td-status-archived';

        var dueDisplay = todoFormatDisplayDate(r.dueDate);
        var dueClass = '';
        if (r.dueDate && r.status !== 'Completed' && !r.archived) {
            var due = new Date(r.dueDate);
            if (due < today) { dueClass = ' td-due-overdue'; dueDisplay = todoFormatDisplayDate(r.dueDate) + ' ⚠️'; }
            else if ((due - today) / (1000 * 60 * 60 * 24) <= 3) dueClass = ' td-due-soon';
        }

        return '<div class="td-card' + archClass + '" data-td-card-idx="' + r.index + '">'
            + '<button type="button" class="td-card-head" data-td-toggle-card="' + r.index + '">'
                + '<div>'
                    + '<div class="td-card-title">' + todoEscapeHtml(r.title) + '</div>'
                    + '<div class="td-card-sub">'
                        + '<span class="td-priority-badge ' + pClass + '" style="margin-right:6px;">' + todoEscapeHtml(r.priority) + '</span>'
                        + '<span class="td-status-badge ' + sClass + '">' + todoEscapeHtml(r.status) + '</span>'
                    + '</div>'
                + '</div>'
                + '<span class="td-card-chevron">▼</span>'
            + '</button>'
            + '<div class="td-card-body">'
                + '<div class="td-card-grid">'
                    + '<div class="td-card-field"><div class="td-card-field-label">Assigned To</div><div class="td-card-field-value">' + todoEscapeHtml(r.assignedTo || '—') + '</div></div>'
                    + '<div class="td-card-field"><div class="td-card-field-label">Due Date</div><div class="td-card-field-value' + dueClass + '">' + todoEscapeHtml(dueDisplay) + '</div></div>'
                    + (r.description ? '<div class="td-card-field full"><div class="td-card-field-label">Description</div><div class="td-card-field-value">' + todoEscapeHtml(r.description) + '</div></div>' : '')
                    + (r.notes ? '<div class="td-card-field full"><div class="td-card-field-label">Notes</div><div class="td-card-field-value">' + todoEscapeHtml(r.notes) + '</div></div>' : '')
                + '</div>'
                + '<div class="td-card-actions">'
                    + '<button class="td-action-btn edit" data-td-action="edit" data-td-idx="' + r.index + '">✏️ Edit</button>'
                    + '<button class="td-action-btn notes" data-td-action="notes" data-td-idx="' + r.index + '">📝 Notes</button>'
                    + '<button class="td-action-btn log" data-td-action="log" data-td-idx="' + r.index + '">📋 Log</button>'
                + '</div>'
            + '</div>'
        + '</div>';
    }).join('');

    // Card toggle
    cardsWrap.onclick = function(e) {
        var toggleBtn = e.target.closest('[data-td-toggle-card]');
        if (toggleBtn) {
            var card = toggleBtn.closest('.td-card');
            if (card) card.classList.toggle('is-open');
            return;
        }

        var actionBtn = e.target.closest('[data-td-action]');
        if (!actionBtn) return;
        var action = actionBtn.getAttribute('data-td-action');
        var idx = parseInt(actionBtn.getAttribute('data-td-idx'), 10);
        var row = todoFindRowByIndex(idx);
        if (!row) return;

        if (action === 'edit') todoOpenEditor(row);
        else if (action === 'notes') todoOpenNotes(row);
        else if (action === 'log') todoOpenLog(row);
    };
}

// ── Find row helper ──────────────────────────────────────────

function todoFindRowByIndex(idx) {
    return todoAppState.rows.find(function(r) { return r.index === idx; }) || null;
}

// ── Editor (Add / Edit) ─────────────────────────────────────

function todoOpenEditor(row) {
    _todoActiveEditRow = row || null;
    todoAppState.editorMode = row ? 'edit' : 'create';

    var overlay  = document.getElementById('td-editor-overlay');
    var title    = document.getElementById('td-editor-title');
    var sub      = document.getElementById('td-editor-sub');
    var status   = document.getElementById('td-editor-status');
    var archBtn  = document.getElementById('td-editor-archive');

    var source = row || {};

    document.getElementById('td-ed-title').value       = String(source.title       || '');
    document.getElementById('td-ed-description').value = String(source.description || '');
    document.getElementById('td-ed-assigned').value    = String(source.assignedTo  || '');
    document.getElementById('td-ed-due').value         = todoFormatDateForInput(source.dueDate);
    document.getElementById('td-ed-priority').value    = String(source.priority    || 'Medium');
    document.getElementById('td-ed-status').value      = String(source.status === 'Archived' ? 'Not Started' : (source.status || 'Not Started'));
    document.getElementById('td-ed-notes').value       = String(source.notes       || '');

    if (title) title.textContent = row ? '✅ Edit Task' : '✅ New Task';
    if (sub) sub.textContent = row ? (source.title || 'Edit task details') : 'Create a new to-do item.';
    if (status) { status.textContent = ''; status.className = 'td-editor-status'; }
    if (archBtn) {
        archBtn.style.display = row ? '' : 'none';
        archBtn.disabled = false;
        archBtn.textContent = row && row.archived ? 'Unarchive' : 'Archive';
    }

    if (overlay) {
        overlay.classList.add('active');
        overlay.setAttribute('aria-hidden', 'false');
    }

    setTimeout(function() {
        var el = document.getElementById('td-ed-title');
        if (el) el.focus();
    }, 50);
}

function todoCloseEditor() {
    var overlay = document.getElementById('td-editor-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
    }
    _todoActiveEditRow = null;
    todoAppState.editorMode = 'create';
}

function todoFormatDateForInput(dateStr) {
    if (!dateStr) return '';
    try {
        var d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        var yyyy = d.getFullYear();
        var mm = String(d.getMonth() + 1).padStart(2, '0');
        var dd = String(d.getDate()).padStart(2, '0');
        return yyyy + '-' + mm + '-' + dd;
    } catch (err) {
        return '';
    }
}

function todoSaveFromEditor() {
    var endpoint = String(window.TODO_ENDPOINT || '').trim();
    var auth = getTodoAuthPayload();
    var status = document.getElementById('td-editor-status');
    var saveBtn = document.getElementById('td-editor-save');

    if (!endpoint) {
        if (status) { status.textContent = 'ToDo endpoint not configured.'; status.className = 'td-editor-status err'; }
        return;
    }
    if (!auth) {
        if (status) { status.textContent = 'Session expired.'; status.className = 'td-editor-status err'; }
        todoRedirectToSecure('Missing secure session while saving task.');
        return;
    }

    var title = String(document.getElementById('td-ed-title').value || '').trim();
    if (!title) {
        if (status) { status.textContent = 'Title is required.'; status.className = 'td-editor-status err'; }
        return;
    }

    var mode = todoAppState.editorMode === 'edit' ? 'edit' : 'create';
    var action = mode === 'edit' ? 'todo.update' : 'todo.create';

    var params = new URLSearchParams({
        action: action,
        token: auth.token,
        email: auth.email,
        title: title,
        description: String(document.getElementById('td-ed-description').value || '').trim(),
        assignedTo: String(document.getElementById('td-ed-assigned').value || '').trim(),
        dueDate: String(document.getElementById('td-ed-due').value || '').trim(),
        priority: String(document.getElementById('td-ed-priority').value || 'Medium'),
        status: String(document.getElementById('td-ed-status').value || 'Not Started'),
        notes: String(document.getElementById('td-ed-notes').value || '').trim()
    });

    if (mode === 'edit' && _todoActiveEditRow) {
        params.set('rowIndex', String(_todoActiveEditRow.index));
    }

    if (saveBtn) saveBtn.disabled = true;
    if (status) { status.textContent = mode === 'edit' ? 'Saving…' : 'Creating…'; status.className = 'td-editor-status'; }

    todoFetchNoReferrer(endpoint + '?' + params.toString())
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (!data || !data.ok) {
                var message = (data && data.message) || 'Unknown error';
                if (todoIsAuthErrorMessage(message)) {
                    todoCloseEditor();
                    todoRedirectToSecure(message);
                    return;
                }
                throw new Error(message);
            }

            // Refresh the full list to get correct row indices
            todoCloseEditor();
            todoFetchData();
        })
        .catch(function(err) {
            if (status) {
                status.textContent = 'Error: ' + String(err && err.message ? err.message : err);
                status.className = 'td-editor-status err';
            }
        })
        .finally(function() {
            if (saveBtn) saveBtn.disabled = false;
        });
}

function todoArchiveFromEditor() {
    if (!_todoActiveEditRow) return;

    var endpoint = String(window.TODO_ENDPOINT || '').trim();
    var auth = getTodoAuthPayload();
    var status = document.getElementById('td-editor-status');
    var archBtn = document.getElementById('td-editor-archive');
    var saveBtn = document.getElementById('td-editor-save');
    var row = _todoActiveEditRow;

    if (!endpoint || !auth) {
        if (status) { status.textContent = 'Session expired.'; status.className = 'td-editor-status err'; }
        return;
    }

    var shouldUnarchive = !!row.archived;
    var label = row.title || 'this task';
    var ok = shouldUnarchive
        ? window.confirm('Unarchive "' + label + '"? This restores the task.')
        : window.confirm('Archive "' + label + '"? This hides it from the active list.');
    if (!ok) return;

    if (archBtn) archBtn.disabled = true;
    if (saveBtn) saveBtn.disabled = true;
    if (status) {
        status.textContent = shouldUnarchive ? 'Unarchiving…' : 'Archiving…';
        status.className = 'td-editor-status';
    }

    var params = new URLSearchParams({
        action: shouldUnarchive ? 'todo.unarchive' : 'todo.archive',
        token: auth.token,
        email: auth.email,
        rowIndex: String(row.index)
    });

    todoFetchNoReferrer(endpoint + '?' + params.toString())
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (!data || !data.ok) {
                var message = (data && data.message) || 'Unknown error';
                if (todoIsAuthErrorMessage(message)) {
                    todoCloseEditor();
                    todoRedirectToSecure(message);
                    return;
                }
                throw new Error(message);
            }
            todoCloseEditor();
            todoFetchData();
        })
        .catch(function(err) {
            if (status) {
                status.textContent = 'Error: ' + String(err && err.message ? err.message : err);
                status.className = 'td-editor-status err';
            }
        })
        .finally(function() {
            if (archBtn) archBtn.disabled = false;
            if (saveBtn) saveBtn.disabled = false;
        });
}

// ── Notes modal ──────────────────────────────────────────────

function todoOpenNotes(row) {
    _todoActiveNoteRow = row;

    var overlay   = document.getElementById('td-notes-overlay');
    var sub       = document.getElementById('td-notes-sub');
    var existWrap = document.getElementById('td-notes-existing-wrap');
    var existEl   = document.getElementById('td-notes-existing');
    var inputEl   = document.getElementById('td-notes-input');
    var status    = document.getElementById('td-notes-status');

    if (sub) sub.textContent = row.title || 'Task notes';

    var hasNotes = !!String(row.notes || '').trim();
    if (existWrap) existWrap.style.display = hasNotes ? '' : 'none';
    if (existEl) existEl.textContent = row.notes || '';
    if (inputEl) inputEl.value = '';
    if (status) { status.textContent = ''; status.className = 'td-notes-status'; }

    if (overlay) {
        overlay.classList.add('active');
        overlay.setAttribute('aria-hidden', 'false');
    }

    setTimeout(function() { if (inputEl) inputEl.focus(); }, 50);
}

function todoCloseNotes() {
    var overlay = document.getElementById('td-notes-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
    }
    _todoActiveNoteRow = null;
}

function todoSaveNote() {
    var row      = _todoActiveNoteRow;
    var inputEl  = document.getElementById('td-notes-input');
    var saveBtn  = document.getElementById('td-notes-save');
    var status   = document.getElementById('td-notes-status');
    var endpoint = String(window.TODO_ENDPOINT || '').trim();
    var auth     = getTodoAuthPayload();

    if (!row || !inputEl || !endpoint) return;
    if (!auth) {
        if (status) { status.textContent = 'Session expired.'; status.className = 'td-notes-status err'; }
        todoRedirectToSecure('Missing secure session while saving note.');
        return;
    }

    var rawNew = inputEl.value.trim();
    if (!rawNew) {
        if (status) { status.textContent = 'Note cannot be empty.'; status.className = 'td-notes-status err'; }
        return;
    }

    // Append new note with timestamp to existing
    var existing = String(row.notes || '').trim();
    var stamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    var entry = '[' + stamp + ' — ' + auth.email + ']\n' + rawNew;
    var combined = existing ? existing + '\n\n' + entry : entry;

    if (saveBtn) saveBtn.disabled = true;
    if (status) { status.textContent = 'Saving…'; status.className = 'td-notes-status'; }

    var params = new URLSearchParams({
        action: 'todo.notes.update',
        rowIndex: String(row.index),
        note: combined,
        token: auth.token,
        email: auth.email
    });

    todoFetchNoReferrer(endpoint + '?' + params.toString())
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data && data.ok) {
                row.notes = combined;
                todoCloseNotes();
                todoRender();
            } else {
                var message = (data && data.message) || 'Unknown';
                if (todoIsAuthErrorMessage(message)) {
                    todoCloseNotes();
                    todoRedirectToSecure(message);
                    return;
                }
                if (status) { status.textContent = 'Error: ' + message; status.className = 'td-notes-status err'; }
            }
        })
        .catch(function(err) {
            if (status) { status.textContent = 'Network error.'; status.className = 'td-notes-status err'; }
        })
        .finally(function() { if (saveBtn) saveBtn.disabled = false; });
}

// ── Auto-Log viewer ──────────────────────────────────────────

function todoOpenLog(row) {
    var overlay = document.getElementById('td-log-overlay');
    var sub     = document.getElementById('td-log-sub');
    var content = document.getElementById('td-log-content');

    if (sub) sub.textContent = row.title || 'Activity log';

    var log = String(row.autoLog || '').trim();
    if (content) {
        if (log) {
            content.innerHTML = '';
            content.textContent = log;
        } else {
            content.innerHTML = '<span class="td-log-empty">No activity recorded yet.</span>';
        }
    }

    if (overlay) {
        overlay.classList.add('active');
        overlay.setAttribute('aria-hidden', 'false');
    }
}

function todoCloseLog() {
    var overlay = document.getElementById('td-log-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
    }
}

// ── Delete handler (called from confirm dialog in future) ────

function todoDeleteTask(row) {
    if (!row) return;

    var endpoint = String(window.TODO_ENDPOINT || '').trim();
    var auth = getTodoAuthPayload();
    if (!endpoint || !auth) return;

    var label = row.title || 'this task';
    if (!window.confirm('Permanently delete "' + label + '"? This cannot be undone.')) return;

    var params = new URLSearchParams({
        action: 'todo.delete',
        token: auth.token,
        email: auth.email,
        rowIndex: String(row.index)
    });

    todoFetchNoReferrer(endpoint + '?' + params.toString())
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data && data.ok) {
                todoFetchData();
            } else {
                console.warn('Delete failed:', data && data.message);
            }
        })
        .catch(function(err) {
            console.warn('Delete error:', err);
        });
}

// ── Public entry point (mirrors openPastoralApp for Secure) ──

window.openTodoApp = function openTodoApp(opts) {
    var hostElement = (opts && opts.hostElement) || null;

    // Auto-switch table ↔ cards on resize
    if (!todoAppState._resizeListenerAdded) {
        todoAppState._resizeListenerAdded = true;
        window.addEventListener('resize', function() {
            cancelAnimationFrame(_todoResizeRaf);
            _todoResizeRaf = requestAnimationFrame(function() {
                var shouldCards = window.innerWidth <= 640;
                var current = todoAppState.viewMode;
                if (shouldCards && current === 'table') {
                    todoAppState.viewMode = 'cards';
                    var vb = document.getElementById('td-toggle-view-btn');
                    if (vb) vb.textContent = 'View: Cards';
                    todoRender();
                } else if (!shouldCards && current === 'cards') {
                    todoAppState.viewMode = 'table';
                    var vb2 = document.getElementById('td-toggle-view-btn');
                    if (vb2) vb2.textContent = 'View: Table';
                    todoRender();
                }
            });
        });
    }

    renderTodoAppShell(hostElement);
};
