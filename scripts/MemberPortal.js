// ==========================================
// APP: MEMBER PORTAL v3 — PRAYER · LEARN · JOURNAL
// ==========================================

function getMemberPortalAuth() {
    var keys = [
        { storage: localStorage, key: typeof SECURE_SESSION_KEY !== 'undefined' ? SECURE_SESSION_KEY : 'atogen_secure_vault_v1' },
        { storage: localStorage, key: typeof AUTH_SESSION_KEY !== 'undefined' ? AUTH_SESSION_KEY : 'aos_auth_session_v1' }
    ];

    for (var i = 0; i < keys.length; i++) {
        try {
            var raw = keys[i].storage.getItem(keys[i].key);
            if (!raw) continue;
            var parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') continue;
            var token = String(parsed.token || parsed.accessToken || '').trim();
            var email = String(parsed.email || '').trim().toLowerCase();
            var role  = String(parsed.role || '').trim().toLowerCase();
            if (token && email) return { token: token, email: email, role: role };
        } catch (e) {
            /* skip */
        }
    }
    return null;
}

var MP_CACHE_TTL_MS = 3 * 60 * 1000;

// ---------- logout ----------
function mpHandleLogout() {
    var keys = ['atogen_secure_vault_v1', 'aos_auth_session_v1'];
    if (typeof SECURE_SESSION_KEY !== 'undefined') keys.push(SECURE_SESSION_KEY);
    if (typeof AUTH_SESSION_KEY !== 'undefined') keys.push(AUTH_SESSION_KEY);
    for (var i = 0; i < keys.length; i++) {
        try { localStorage.removeItem(keys[i]); } catch (e) { /* ignore */ }
    }
    _mpProfile = null; _mpProfileEmail = ''; _mpProfileAt = 0;
    _mpPrayerRows = []; _mpPrayerEmail = ''; _mpPrayerAt = 0;
    _mpJournalRows = []; _mpJournalEmail = ''; _mpJournalAt = 0;
    _mpDirRows = []; _mpDirEmail = ''; _mpDirAt = 0;
    _mpWarmPromise = null; _mpWarmEmail = '';
    if (typeof closeModal === 'function') { closeModal(); }
}

// ---------- helpers ----------
function _mpFreshCache(ts) { return Number.isFinite(ts) && (Date.now() - ts) < MP_CACHE_TTL_MS; }
function _mpEndpoint() { return typeof PASTORAL_DB_V2_ENDPOINT !== 'undefined' ? PASTORAL_DB_V2_ENDPOINT : ''; }

// ---------- state (var to avoid let-collision with Contact.js) ----------
var _mpProfile      = null;
var _mpProfileEmail = '';
var _mpProfileAt    = 0;
var _mpPrayerRows   = [];
var _mpPrayerEmail  = '';
var _mpPrayerAt     = 0;
var _mpJournalRows  = [];
var _mpJournalEmail = '';
var _mpJournalAt    = 0;
var _mpWarmPromise  = null;
var _mpWarmEmail    = '';
var _mpDirRows      = [];
var _mpDirEmail     = '';
var _mpDirAt        = 0;

// ==========================================
//  API LAYER
// ==========================================

async function mpFetchProfile(auth) {
    var ep = _mpEndpoint();
    if (!ep) throw new Error('No endpoint configured.');
    var params = new URLSearchParams({ action: 'members.search', token: auth.token, authEmail: auth.email, q: auth.email });
    var res = await fetch(ep + '?' + params.toString(), { cache: 'no-store', signal: AbortSignal.timeout(12000) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    if (!data || !data.ok) throw new Error(data && data.message ? data.message : 'Profile lookup failed');
    var rows = Array.isArray(data.rows) ? data.rows : [];
    return rows.find(function(r) { return String(r.primaryEmail || r.email || '').trim().toLowerCase() === auth.email; }) || null;
}

async function mpFetchPrayerList(auth) {
    var ep = _mpEndpoint();
    if (!ep) throw new Error('No endpoint configured.');
    var params = new URLSearchParams({ action: 'prayer.list', token: auth.token, authEmail: auth.email });
    var res = await fetch(ep + '?' + params.toString(), { cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    if (!data || !data.ok) throw new Error(data && data.message ? data.message : 'Prayer list failed');
    var all = Array.isArray(data.rows) ? data.rows : [];
    // client-side filter to only this user's submissions
    return all.filter(function(r) { return String(r.submitterEmail || r.email || '').trim().toLowerCase() === auth.email; });
}

async function mpSubmitPrayer(auth, text, category) {
    var ep = _mpEndpoint();
    if (!ep) throw new Error('No endpoint configured.');
    var params = new URLSearchParams({
        action: 'prayer.create', token: auth.token, authEmail: auth.email,
        prayerText: text, category: category || 'Personal',
        isConfidential: 'true',
        submitterName: (_mpProfile ? [_mpProfile.firstName, _mpProfile.lastName].filter(Boolean).join(' ') : ''),
        submitterEmail: auth.email,
        submitterPhone: (_mpProfile ? (_mpProfile.cellPhone || _mpProfile.phone || '') : '')
    });
    var res = await fetch(ep + '?' + params.toString(), { cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    if (!data || !data.ok) throw new Error(data && data.message ? data.message : 'Submission failed');
    return data.row || null;
}

async function mpFetchJournal(auth) {
    var ep = _mpEndpoint();
    if (!ep) throw new Error('No endpoint configured.');
    var params = new URLSearchParams({
        action: 'todo.list', token: auth.token, authEmail: auth.email,
        assignedTo: auth.email, category: 'Journal'
    });
    var res = await fetch(ep + '?' + params.toString(), { cache: 'no-store', signal: AbortSignal.timeout(12000) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    if (!data || !data.ok) throw new Error(data && data.message ? data.message : 'Journal fetch failed');
    return Array.isArray(data.rows) ? data.rows : [];
}

async function mpSaveJournalEntry(auth, title, body) {
    var ep = _mpEndpoint();
    if (!ep) throw new Error('No endpoint configured.');
    var params = new URLSearchParams({
        action: 'todo.create', token: auth.token, authEmail: auth.email,
        title: title, description: body, category: 'Journal',
        assignedTo: auth.email, priority: 'Low'
    });
    var res = await fetch(ep + '?' + params.toString(), { cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    if (!data || !data.ok) throw new Error(data && data.message ? data.message : 'Save failed');
    return data.row || null;
}

async function mpUpdateJournalEntry(auth, rowIndex, updates) {
    var ep = _mpEndpoint();
    if (!ep) throw new Error('No endpoint configured.');
    var params = new URLSearchParams({
        action: 'todo.update', token: auth.token, authEmail: auth.email,
        rowIndex: String(rowIndex)
    });
    if (updates.title != null) params.set('title', updates.title);
    if (updates.description != null) params.set('description', updates.description);
    if (updates.status != null) params.set('status', updates.status);
    var res = await fetch(ep + '?' + params.toString(), { cache: 'no-store', signal: AbortSignal.timeout(12000) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    if (!data || !data.ok) throw new Error(data && data.message ? data.message : 'Update failed');
    return data.row || null;
}

async function mpFetchDirectory(auth) {
    var ep = _mpEndpoint();
    if (!ep) throw new Error('No endpoint configured.');
    var params = new URLSearchParams({ action: 'members.list', token: auth.token, authEmail: auth.email, includeArchived: 'false' });
    var res = await fetch(ep + '?' + params.toString(), { cache: 'no-store', signal: AbortSignal.timeout(12000) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    if (!data || !data.ok) throw new Error(data && data.message ? data.message : 'Directory failed');
    return Array.isArray(data.rows) ? data.rows : [];
}

// ==========================================
//  WARM CACHE / PRELOAD
// ==========================================
function preloadMemberPortalData(forceReload) {
    var auth = getMemberPortalAuth();
    if (!auth) return Promise.resolve(null);
    var email = auth.email;
    if (!forceReload && _mpWarmPromise && _mpWarmEmail === email) return _mpWarmPromise;
    _mpWarmEmail = email;
    _mpWarmPromise = Promise.allSettled([
        mpFetchProfile(auth).then(function(p) { _mpProfile = p; _mpProfileEmail = email; _mpProfileAt = Date.now(); }),
        mpFetchPrayerList(auth).then(function(r) { _mpPrayerRows = r; _mpPrayerEmail = email; _mpPrayerAt = Date.now(); }),
        mpFetchJournal(auth).then(function(r) { _mpJournalRows = r; _mpJournalEmail = email; _mpJournalAt = Date.now(); })
    ]);
    return _mpWarmPromise;
}

// ==========================================
//  CSS
// ==========================================
var MP_CSS = `
/* ── Portal Shell ── */
.mp-shell { position:relative; padding-bottom:60px; }
.mp-shell::before {
    content:''; position:absolute; inset:0 0 auto 0; height:280px;
    background:radial-gradient(circle at top center, rgba(56,189,248,0.18), transparent 58%);
    pointer-events:none;
}

/* ── Cards ── */
.mp-card {
    position:relative;
    background:linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02)), rgba(15,23,42,0.78);
    border:1px solid rgba(255,255,255,0.09); border-radius:18px; padding:18px;
    box-shadow:0 14px 38px rgba(0,0,0,0.18); overflow:hidden;
}
.mp-card::after {
    content:''; position:absolute; inset:auto -20% -40% auto; width:180px; height:180px;
    background:radial-gradient(circle, rgba(246,216,122,0.10), transparent 65%); pointer-events:none;
}

/* ── Section Heads ── */
.mp-section-head {
    display:flex; align-items:center; justify-content:space-between; gap:10px;
    font-family:'JetBrains Mono'; font-size:0.82rem; font-weight:800;
    color:var(--accent-cyan, #38bdf8); letter-spacing:2px; text-transform:uppercase;
    margin:28px 0 12px; padding-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.08);
}

/* ── Hero ── */
.mp-hero {
    position:relative; padding:20px; border-radius:22px;
    background:
        radial-gradient(circle at top left, rgba(56,189,248,0.18), transparent 30%),
        radial-gradient(circle at right center, rgba(246,216,122,0.14), transparent 32%),
        linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02)),
        rgba(15,23,42,0.84);
    border:1px solid rgba(255,255,255,0.10); box-shadow:0 16px 42px rgba(0,0,0,0.22);
    overflow:hidden;
}
.mp-hero-grid { display:grid; grid-template-columns:1fr; gap:12px; }
.mp-welcome-name {
    font-size:1.7rem; font-weight:900; line-height:1.1; color:#fff; letter-spacing:-0.02em;
}
.mp-welcome-sub { color:#cbd5e1; line-height:1.6; font-size:0.92rem; }
.mp-eyebrow {
    font-family:'JetBrains Mono'; font-size:0.72rem; font-weight:700;
    color:var(--text-muted, #94a3b8); letter-spacing:2px; text-transform:uppercase;
}
.mp-logout-btn {
    position:absolute; top:14px; right:14px; z-index:2;
    background:rgba(239,68,68,0.15); color:#f87171; border:1px solid rgba(239,68,68,0.3);
    font-family:'JetBrains Mono'; font-size:0.68rem; font-weight:700;
    letter-spacing:1.5px; text-transform:uppercase; padding:6px 14px;
    border-radius:8px; cursor:pointer; transition:all 0.2s;
}
.mp-logout-btn:hover { background:rgba(239,68,68,0.3); color:#fca5a5; }
.mp-stat-row { display:flex; flex-wrap:wrap; gap:10px; margin-top:14px; }
.mp-stat-chip {
    flex:1; min-width:90px; border-radius:14px; padding:12px 12px 10px;
    background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08);
}
.mp-stat-chip.cyan  { box-shadow:inset 0 1px 0 rgba(56,189,248,0.10); }
.mp-stat-chip.gold  { box-shadow:inset 0 1px 0 rgba(246,216,122,0.12); }
.mp-stat-chip.green { box-shadow:inset 0 1px 0 rgba(45,212,191,0.12); }
.mp-stat-val { font-size:1.15rem; font-weight:800; color:#fff; line-height:1; }
.mp-stat-lbl {
    margin-top:6px; font-family:'JetBrains Mono',monospace; font-size:0.64rem;
    letter-spacing:1px; color:var(--text-muted, #94a3b8); text-transform:uppercase;
}

/* ── Prayer Timeline ── */
.mp-prayer-list { display:flex; flex-direction:column; gap:12px; position:relative; padding-left:22px; }
.mp-prayer-line {
    position:absolute; left:8px; top:0; bottom:0; width:2px;
    background:linear-gradient(180deg, rgba(56,189,248,0.25), rgba(246,216,122,0.15), transparent);
}
.mp-prayer-item {
    position:relative; padding:14px 16px; border-radius:14px;
    background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07);
    transition:border-color 0.2s;
}
.mp-prayer-item:hover { border-color:rgba(255,255,255,0.15); }
.mp-prayer-dot {
    position:absolute; left:-22px; top:18px; width:14px; height:14px;
    border-radius:50%; display:flex; align-items:center; justify-content:center;
    font-size:0.55rem; z-index:1;
}
.mp-prayer-meta {
    display:flex; justify-content:space-between; align-items:center; gap:8px;
    font-family:'JetBrains Mono'; font-size:0.7rem; margin-bottom:6px;
}
.mp-prayer-text { font-size:0.88rem; color:#cbd5e1; line-height:1.55; word-break:break-word; }
.mp-prayer-cat {
    display:inline-block; padding:2px 8px; border-radius:6px; font-size:0.65rem;
    font-family:'JetBrains Mono'; letter-spacing:0.5px; text-transform:uppercase;
    background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08);
    color:var(--text-muted, #94a3b8); margin-top:6px;
}

/* ── Prayer Form ── */
.mp-prayer-form { display:flex; flex-direction:column; gap:10px; margin-top:14px; }
.mp-prayer-form textarea {
    width:100%; min-height:90px; padding:12px 14px; border-radius:12px;
    border:1px solid rgba(255,255,255,0.12); background:rgba(15,23,42,0.85);
    color:#e2e8f0; font-family:'JetBrains Mono',monospace; font-size:0.85rem;
    resize:vertical; outline:none; transition:border-color 0.2s;
}
.mp-prayer-form textarea:focus { border-color:var(--accent-cyan, #38bdf8); }
.mp-prayer-form textarea::placeholder { color:rgba(255,255,255,0.3); }
.mp-prayer-form select {
    padding:8px 12px; border-radius:10px;
    border:1px solid rgba(255,255,255,0.12); background:rgba(15,23,42,0.85);
    color:#e2e8f0; font-family:'JetBrains Mono',monospace; font-size:0.8rem; outline:none;
}
.mp-prayer-form select:focus { border-color:var(--accent-cyan, #38bdf8); }

/* ── Journal ── */
.mp-journal-list { display:flex; flex-direction:column; gap:10px; }
.mp-journal-card {
    padding:14px 16px; border-radius:14px;
    background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07);
    transition:border-color 0.2s;
}
.mp-journal-card:hover { border-color:rgba(255,255,255,0.15); }
.mp-journal-title { font-weight:800; font-size:0.95rem; color:#fff; margin-bottom:4px; }
.mp-journal-body { font-size:0.85rem; color:#cbd5e1; line-height:1.5; white-space:pre-wrap; word-break:break-word; }
.mp-journal-date {
    font-family:'JetBrains Mono'; font-size:0.65rem; color:var(--text-muted, #94a3b8);
    letter-spacing:0.5px; margin-top:6px;
}
.mp-journal-form { display:flex; flex-direction:column; gap:8px; margin-top:14px; }
.mp-journal-form input, .mp-journal-form textarea {
    width:100%; padding:10px 14px; border-radius:10px;
    border:1px solid rgba(255,255,255,0.12); background:rgba(15,23,42,0.85);
    color:#e2e8f0; font-family:'JetBrains Mono',monospace; font-size:0.85rem;
    outline:none; transition:border-color 0.2s;
}
.mp-journal-form input:focus, .mp-journal-form textarea:focus { border-color:var(--accent-cyan, #38bdf8); }
.mp-journal-form input::placeholder, .mp-journal-form textarea::placeholder { color:rgba(255,255,255,0.3); }
.mp-journal-form textarea { min-height:80px; resize:vertical; }

/* ── Learning Hub Grid ── */
.mp-hub-grid {
    display:grid; grid-template-columns:repeat(auto-fill, minmax(130px, 1fr));
    gap:10px;
}
.mp-hub-card {
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap:6px; padding:16px 10px; border-radius:14px; cursor:pointer;
    background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07);
    transition:background 0.2s, border-color 0.2s, transform 0.15s; text-align:center;
}
.mp-hub-card:hover { background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.18); transform:translateY(-2px); }
.mp-hub-icon { font-size:1.6rem; filter:none !important; text-shadow:none !important; }
.mp-hub-label {
    font-family:'JetBrains Mono',monospace; font-size:0.68rem; font-weight:700;
    color:var(--text-muted, #94a3b8); letter-spacing:1px; text-transform:uppercase; line-height:1.3;
}

/* ── Directory (compact) ── */
.mp-dir-search {
    width:100%; padding:10px 14px; border-radius:10px;
    border:1px solid rgba(255,255,255,0.15); background:rgba(15,23,42,0.85);
    color:#e2e8f0; font-family:'JetBrains Mono',monospace; font-size:0.85rem;
    outline:none; transition:border-color 0.2s;
}
.mp-dir-search:focus { border-color:var(--accent-cyan, #38bdf8); }
.mp-dir-search::placeholder { color:rgba(255,255,255,0.35); }
.mp-dir-count {
    text-align:center; font-family:'JetBrains Mono'; font-size:0.7rem;
    color:var(--text-muted, #94a3b8); padding:4px 0 8px; letter-spacing:1px;
}
.mp-dir-card {
    display:flex; align-items:center; justify-content:space-between; gap:12px;
    background:rgba(15,23,42,0.7); border:1px solid rgba(255,255,255,0.08);
    border-radius:12px; padding:12px 14px; margin-bottom:8px; transition:border-color 0.2s;
}
.mp-dir-card:hover { border-color:rgba(255,255,255,0.2); }
.mp-dir-header { display:flex; align-items:center; gap:10px; min-width:0; flex:1; }
.mp-dir-avatar { flex-shrink:0; }
.mp-dir-name { font-weight:700; font-size:0.95rem; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.mp-dir-preferred { font-size:0.75rem; color:var(--accent-gold, #f6d87a); font-style:italic; }
.mp-dir-role {
    font-size:0.7rem; color:var(--text-muted, #94a3b8);
    font-family:'JetBrains Mono'; text-transform:uppercase; letter-spacing:0.8px; margin-top:1px;
}
.mp-dir-actions { display:flex; gap:6px; flex-shrink:0; }
.mp-dir-btn {
    display:flex; align-items:center; justify-content:center;
    width:36px; height:36px; border-radius:10px;
    background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1);
    text-decoration:none; font-size:1rem; transition:background 0.2s, border-color 0.2s;
    filter:none !important; text-shadow:none !important;
}
.mp-dir-btn:hover { background:rgba(255,255,255,0.12); border-color:rgba(255,255,255,0.25); }

/* ── Buttons ── */
.mp-btn {
    display:inline-flex; align-items:center; justify-content:center; gap:6px;
    padding:10px 20px; border-radius:12px; cursor:pointer;
    font-family:'JetBrains Mono',monospace; font-size:0.8rem; font-weight:700;
    letter-spacing:1px; text-transform:uppercase; border:1px solid rgba(255,255,255,0.12);
    background:rgba(255,255,255,0.06); color:#e2e8f0;
    transition:background 0.2s, border-color 0.2s;
}
.mp-btn:hover { background:rgba(255,255,255,0.12); border-color:rgba(255,255,255,0.25); }
.mp-btn.primary {
    background:linear-gradient(135deg, rgba(56,189,248,0.25), rgba(56,189,248,0.12));
    border-color:rgba(56,189,248,0.35); color:var(--accent-cyan, #38bdf8);
}
.mp-btn.primary:hover { background:linear-gradient(135deg, rgba(56,189,248,0.35), rgba(56,189,248,0.20)); }
.mp-btn:disabled { opacity:0.45; pointer-events:none; }
.mp-empty {
    text-align:center; padding:30px 20px; color:var(--text-muted, #94a3b8);
    font-family:'JetBrains Mono'; font-size:0.82rem;
}
.mp-error {
    text-align:center; padding:20px; color:var(--accent-magenta, #f472b6);
    font-family:'JetBrains Mono'; font-size:0.82rem;
}
.mp-tab-bar {
    display:flex; gap:4px; border-bottom:1px solid rgba(255,255,255,0.08);
    padding-bottom:0; margin-bottom:16px; overflow-x:auto;
}
.mp-tab {
    padding:8px 16px; border-radius:10px 10px 0 0; cursor:pointer;
    font-family:'JetBrains Mono',monospace; font-size:0.72rem; font-weight:700;
    letter-spacing:1px; text-transform:uppercase;
    color:var(--text-muted, #94a3b8); background:transparent; border:none;
    border-bottom:2px solid transparent; transition:color 0.2s, border-color 0.2s;
    white-space:nowrap;
}
.mp-tab:hover { color:#e2e8f0; }
.mp-tab.active { color:var(--accent-cyan, #38bdf8); border-bottom-color:var(--accent-cyan, #38bdf8); }
.mp-tab-panel { display:none; }
.mp-tab-panel.active { display:block; }
`;

// ==========================================
//  RENDER HELPERS
// ==========================================

function mpStatChip(label, value, tone) {
    return '<div class="mp-stat-chip ' + (tone || '') + '">'
        + '<div class="mp-stat-val">' + escapeHtml(String(value != null ? value : '0')) + '</div>'
        + '<div class="mp-stat-lbl">' + escapeHtml(label) + '</div>'
        + '</div>';
}

function mpPrayerStatusTone(status) {
    var s = String(status || '').toLowerCase();
    if (s === 'answered')    return { color: '#2dd4bf', icon: '✓', cls: '' };
    if (s === 'in progress') return { color: '#38bdf8', icon: '◉', cls: '' };
    if (s === 'on hold')     return { color: '#f6d87a', icon: '⏸', cls: '' };
    return { color: '#94a3b8', icon: '●', cls: '' };
}

function mpFormatDate(raw) {
    if (!raw) return '';
    try {
        var d = new Date(raw);
        if (isNaN(d.getTime())) return String(raw);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) { return String(raw); }
}

function mpRenderPrayerTimeline(rows) {
    if (!rows || !rows.length) return '<div class="mp-empty">No prayer requests yet. Use the form below to submit one.</div>';
    var sorted = rows.slice().sort(function(a, b) {
        return new Date(b.submittedAt || b.createdAt || 0) - new Date(a.submittedAt || a.createdAt || 0);
    });
    var html = '<div class="mp-prayer-list"><div class="mp-prayer-line"></div>';
    for (var i = 0; i < sorted.length; i++) {
        var r = sorted[i];
        var tone = mpPrayerStatusTone(r.status);
        var preview = String(r.prayerText || '').length > 200
            ? String(r.prayerText).substring(0, 200) + '...'
            : String(r.prayerText || '');
        html += '<div class="mp-prayer-item">'
            + '<div class="mp-prayer-dot" style="background:' + tone.color + ';">' + tone.icon + '</div>'
            + '<div class="mp-prayer-meta">'
            +   '<span style="color:' + tone.color + ';">' + escapeHtml(r.status || 'New') + '</span>'
            +   '<span>' + escapeHtml(mpFormatDate(r.submittedAt || r.createdAt)) + '</span>'
            + '</div>'
            + '<div class="mp-prayer-text">' + escapeHtml(preview) + '</div>'
            + (r.category ? '<div class="mp-prayer-cat">' + escapeHtml(r.category) + '</div>' : '')
            + '</div>';
    }
    html += '</div>';
    return html;
}

function mpRenderJournal(rows) {
    if (!rows || !rows.length) return '<div class="mp-empty">Your journal is empty. Write your first entry below.</div>';
    var sorted = rows.slice().sort(function(a, b) {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
    var html = '<div class="mp-journal-list">';
    for (var i = 0; i < sorted.length; i++) {
        var r = sorted[i];
        html += '<div class="mp-journal-card">'
            + '<div class="mp-journal-title">' + escapeHtml(r.title || 'Untitled') + '</div>'
            + '<div class="mp-journal-body">' + escapeHtml(r.description || r.notes || '') + '</div>'
            + '<div class="mp-journal-date">' + escapeHtml(mpFormatDate(r.createdAt)) + '</div>'
            + '</div>';
    }
    html += '</div>';
    return html;
}

function mpRenderDirectoryCard(m) {
    var firstName = escapeHtml(String(m.firstName || '').trim());
    var lastName  = escapeHtml(String(m.lastName || '').trim());
    var preferred = String(m.preferredName || '').trim();
    var fullName  = firstName && lastName ? firstName + ' ' + lastName : (firstName || lastName || 'Unknown');
    var phone     = String(m.cellPhone || m.phone || '').trim();
    var email     = String(m.primaryEmail || m.email || '').trim();
    var ministry  = escapeHtml(String(m.ministryTeams || '').trim());
    var status    = String(m.membershipStatus || '').trim();
    var photoUrl  = String(m.photoUrl || '').trim();
    var websiteLink = String(m.websiteLink || '').trim();
    var cleanPhone = phone.replace(/\\D/g, '');
    var smsLink = cleanPhone ? (typeof resolveContactSmsLink === 'function' ? resolveContactSmsLink(cleanPhone) : 'sms:' + cleanPhone) : '';
    var telLink = cleanPhone ? 'tel:+' + cleanPhone : '';
    var mailLink = email ? 'mailto:' + escapeHtml(email) : '';
    var avatarHtml = photoUrl
        ? '<img src="' + escapeHtml(photoUrl) + '" alt="' + fullName + '" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.2);">'
        : '<div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#334155,#1e293b);border:2px solid rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;font-size:1.3rem;">✝️</div>';
    var roleLabel = ministry || (status === 'Active' ? 'Member' : status || 'Member');

    return '<div class="mp-dir-card">'
        + '<div class="mp-dir-header">'
        +   '<div class="mp-dir-avatar">' + avatarHtml + '</div>'
        +   '<div>'
        +     '<div class="mp-dir-name">' + fullName + '</div>'
        +     (preferred && preferred !== fullName.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>') ? '<div class="mp-dir-preferred">"' + escapeHtml(preferred) + '"</div>' : '')
        +     '<div class="mp-dir-role">' + roleLabel + '</div>'
        +   '</div>'
        + '</div>'
        + '<div class="mp-dir-actions">'
        +   (telLink ? '<a class="mp-dir-btn" href="' + telLink + '">📞</a>' : '')
        +   (smsLink ? '<a class="mp-dir-btn" href="' + smsLink + '">💬</a>' : '')
        +   (mailLink ? '<a class="mp-dir-btn" href="' + mailLink + '">✉️</a>' : '')
        +   (websiteLink ? '<a class="mp-dir-btn" href="' + escapeHtml(websiteLink) + '" target="_blank" rel="noopener">📅</a>' : '')
        + '</div>'
        + '</div>';
}

// ==========================================
//  ROLE HIERARCHY
// ==========================================
var MP_ROLE_LEVELS = { readonly: 0, volunteer: 1, leader: 2, pastor: 3, admin: 4 };

function mpHasRole(auth, minRole) {
    if (!auth || !auth.role) return false;
    var level = MP_ROLE_LEVELS[auth.role] || 0;
    var needed = MP_ROLE_LEVELS[minRole] || 0;
    return level >= needed;
}

// ==========================================
//  LEARNING HUB ITEMS
// ==========================================
var MP_HUB_LEARN = [
    { icon: '📖', label: 'Daily Bread',      fn: 'openIntel' },
    { icon: '⛪', label: 'Bible Doctrine',    fn: 'openTheology' },
    { icon: '🎼', label: 'Praying Psalms',    fn: 'openPsalmsApp' },
    { icon: '⚔️', label: 'Common Questions',  fn: 'openApologeticsApp' },
    { icon: '📜', label: 'Characters',         fn: 'openCharactersApp' },
    { icon: '🔎', label: 'Word Search',        fn: 'openWordsApp' },
    { icon: '📚', label: 'Bible Books',        fn: 'openExplorer' },
    { icon: '🧠', label: 'Bible Quiz',         fn: 'openQuizApp' }
];

var MP_HUB_PRAY = [
    { icon: '💌', label: 'Prayer Request',  fn: 'openPublicPrayerRequestApp' },
    { icon: '🙏', label: 'What is Prayer',  fn: 'openPublicPrayerApp' },
    { icon: '🙇', label: 'What is Worship', fn: 'openPostureApp' }
];

// ── Role-gated hub sections ──
var MP_HUB_LEADER = [
    { icon: '✅', label: 'To Do List',      fn: 'openTodoApp' }
];

var MP_HUB_PASTOR = [
    { icon: '🐑', label: 'Pastoral Care',   fn: 'openPastoralApp' },
    { icon: '🔬', label: 'Pastoral Mirror',  fn: 'openMirrorApp' },
    { icon: '💒', label: 'Prayer Admin',     fn: 'openPrayerAdminApp' }
];

var MP_HUB_ADMIN = [
    { icon: '🔐', label: 'Admin Provision',  fn: 'openAdminProvisionApp' },
    { icon: '📁', label: 'Drive Vault',      url: 'https://drive.google.com/drive/folders/1A-g8KEWAKCMGdgn3WgfSjKpHEA0wgKuc?usp=drive_link' }
];

function mpLaunchHubApp(fnName) {
    var fn = window[fnName];
    if (typeof fn !== 'function') return;
    fn();
    // After the app renders, patch its back button to return to Member Portal
    var backBtn = document.getElementById('modal-back-btn');
    var backText = document.getElementById('modal-back-text');
    if (backBtn) {
        backBtn.onclick = function() { openMemberPortalApp(); };
    }
    if (backText) backText.textContent = 'BACK';
}

function mpRenderHubGrid(items) {
    var html = '<div class="mp-hub-grid">';
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (item.url) {
            html += '<a class="mp-hub-card" href="' + escapeHtml(item.url) + '" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit;">'
                + '<span class="mp-hub-icon">' + item.icon + '</span>'
                + '<span class="mp-hub-label">' + escapeHtml(item.label) + '</span>'
                + '</a>';
        } else {
            html += '<button type="button" class="mp-hub-card" onclick="mpLaunchHubApp(\'' + item.fn + '\')">' 
                + '<span class="mp-hub-icon">' + item.icon + '</span>'
                + '<span class="mp-hub-label">' + escapeHtml(item.label) + '</span>'
                + '</button>';
        }
    }
    html += '</div>';
    return html;
}

function mpRenderRoleGatedSections(auth) {
    var html = '';
    if (mpHasRole(auth, 'leader')) {
        html += '<div class="mp-section-head">✉️ Leadership Tools</div>'
            +   '<div class="mp-card">' + mpRenderHubGrid(MP_HUB_LEADER) + '</div>';
    }
    if (mpHasRole(auth, 'pastor')) {
        html += '<div class="mp-section-head">🐑 Pastoral Tools</div>'
            +   '<div class="mp-card">' + mpRenderHubGrid(MP_HUB_PASTOR) + '</div>';
    }
    if (mpHasRole(auth, 'admin')) {
        html += '<div class="mp-section-head">🔐 Admin Tools</div>'
            +   '<div class="mp-card">' + mpRenderHubGrid(MP_HUB_ADMIN) + '</div>';
    }
    return html;
}

function mpCountHubApps(auth) {
    var count = MP_HUB_LEARN.length + MP_HUB_PRAY.length;
    if (mpHasRole(auth, 'leader')) count += MP_HUB_LEADER.length;
    if (mpHasRole(auth, 'pastor')) count += MP_HUB_PASTOR.length;
    if (mpHasRole(auth, 'admin'))  count += MP_HUB_ADMIN.length;
    return count;
}

// ==========================================
//  MAIN PORTAL APP
// ==========================================

async function openMemberPortalApp() {
    var auth = getMemberPortalAuth();
    if (!auth) {
        if (typeof openHomeSecureLogin === 'function') openHomeSecureLogin();
        return;
    }

    // warm cache in background
    preloadMemberPortalData(false).catch(function() {});

    document.getElementById('modal-back-text').innerText = 'CLEAR';
    document.getElementById('modal-back-btn').onclick = function() { closeModal(); };
    document.getElementById('modal-title').innerHTML = '<span style="filter:none !important;text-shadow:none !important;margin-right:8px;">⛪</span>MEMBER PORTAL';
    document.getElementById('modal-subtitle').innerText = 'PRAY · LEARN · JOURNAL';

    var container = document.getElementById('modal-body-container');

    container.innerHTML = '<div class="contact-shell fade-in mp-shell"><style>' + MP_CSS + '</style>'
        // ── Hero ──
        + '<div class="mp-hero">'
        +   '<button type="button" class="mp-logout-btn" id="mp-logout-btn">LOGOUT</button>'
        + '<div class="mp-hero-grid">'
        +   '<div>'
        +     '<div class="mp-eyebrow">WELCOME BACK</div>'
        +     '<div class="mp-welcome-name" id="mp-welcome-name">Member</div>'
        +     '<div class="mp-welcome-sub">Your personal hub for prayer, study, and spiritual growth.</div>'
        +   '</div>'
        +   '<div class="mp-stat-row" id="mp-stats">'
        +     mpStatChip('Prayers', '—', 'gold')
        +     mpStatChip('Journal', '—', 'cyan')
        +     mpStatChip('Hub Apps', mpCountHubApps(auth), 'green')
        +   '</div>'
        + '</div></div>'

        // ── Tabs ──
        + '<div class="mp-tab-bar" id="mp-tabs" style="margin-top:20px;">'
        +   '<button type="button" class="mp-tab active" data-mp-tab="prayer">🙏 My Prayers</button>'
        +   '<button type="button" class="mp-tab" data-mp-tab="journal">📓 Journal</button>'
        +   '<button type="button" class="mp-tab" data-mp-tab="learn">📖 Learn</button>'
        +   '<button type="button" class="mp-tab" data-mp-tab="directory">👥 Directory</button>'
        +   (mpHasRole(auth, 'leader') ? '<button type="button" class="mp-tab" data-mp-tab="admin">🔐 Admin</button>' : '')
        + '</div>'

        // ── Prayer Panel ──
        + '<div class="mp-tab-panel active" id="mp-panel-prayer">'
        +   '<div class="mp-card" id="mp-prayer-timeline"><div class="loader"> </div></div>'
        +   '<div class="mp-section-head">Submit a Prayer Request</div>'
        +   '<div class="mp-card">'
        +     '<div class="mp-prayer-form">'
        +       '<textarea id="mp-prayer-text" placeholder="What\'s on your heart today?" maxlength="2000"></textarea>'
        +       '<select id="mp-prayer-category">'
        +         '<option value="Personal">Personal</option>'
        +         '<option value="Health">Health</option>'
        +         '<option value="Family">Family</option>'
        +         '<option value="Spiritual Growth">Spiritual Growth</option>'
        +         '<option value="Finances">Finances</option>'
        +         '<option value="Relationships">Relationships</option>'
        +         '<option value="Guidance">Guidance</option>'
        +         '<option value="Praise Report">Praise Report</option>'
        +         '<option value="Other">Other</option>'
        +       '</select>'
        +       '<button type="button" class="mp-btn primary" id="mp-prayer-submit">SUBMIT PRAYER</button>'
        +     '</div>'
        +   '</div>'
        + '</div>'

        // ── Journal Panel ──
        + '<div class="mp-tab-panel" id="mp-panel-journal">'
        +   '<div class="mp-card" id="mp-journal-list"><div class="loader"> </div></div>'
        +   '<div class="mp-section-head">New Journal Entry</div>'
        +   '<div class="mp-card">'
        +     '<div class="mp-journal-form">'
        +       '<input type="text" id="mp-journal-title" placeholder="Title (e.g. Today\'s Reflection)" maxlength="200">'
        +       '<textarea id="mp-journal-body" placeholder="Write your thoughts, Scripture notes, or prayer reflections..." maxlength="5000"></textarea>'
        +       '<button type="button" class="mp-btn primary" id="mp-journal-submit">SAVE ENTRY</button>'
        +     '</div>'
        +   '</div>'
        + '</div>'

        // ── Learn Panel ──
        + '<div class="mp-tab-panel" id="mp-panel-learn">'
        +   '<div class="mp-section-head">📖 Study & Grow</div>'
        +   '<div class="mp-card">' + mpRenderHubGrid(MP_HUB_LEARN) + '</div>'
        +   '<div class="mp-section-head">🙏 Prayer & Worship</div>'
        +   '<div class="mp-card">' + mpRenderHubGrid(MP_HUB_PRAY) + '</div>'
        +   mpRenderRoleGatedSections(auth)
        + '</div>'

        // ── Directory Panel ──
        + '<div class="mp-tab-panel" id="mp-panel-directory">'
        +   '<div class="mp-card">'
        +     '<div style="padding:6px 0 10px;">'
        +       '<input type="text" class="mp-dir-search" id="mp-dir-search" placeholder="Search members..." autocomplete="off">'
        +     '</div>'
        +     '<div class="mp-dir-count" id="mp-dir-count"></div>'
        +     '<div id="mp-dir-list"><div class="loader"> </div></div>'
        +   '</div>'
        + '</div>'

        // ── Admin Panel (leader+) ──
        + (mpHasRole(auth, 'leader')
            ? '<div class="mp-tab-panel" id="mp-panel-admin">'
            +   mpRenderRoleGatedSections(auth)
            + '</div>'
            : '')

        + '</div>'; // close mp-shell

    document.getElementById('data-modal').classList.add('active');
    if (typeof bounceModalBodyToTop === 'function') bounceModalBodyToTop();

    // ── Tab Switching ──
    var tabBar = document.getElementById('mp-tabs');
    if (tabBar) {
        tabBar.addEventListener('click', function(e) {
            var btn = e.target.closest('.mp-tab');
            if (!btn) return;
            var tabId = btn.getAttribute('data-mp-tab');
            tabBar.querySelectorAll('.mp-tab').forEach(function(t) { t.classList.remove('active'); });
            btn.classList.add('active');
            document.querySelectorAll('.mp-tab-panel').forEach(function(p) { p.classList.remove('active'); });
            var panel = document.getElementById('mp-panel-' + tabId);
            if (panel) panel.classList.add('active');

            // lazy-load directory on first switch
            if (tabId === 'directory') mpLoadDirectory(auth);
        });
    }

    // ── Logout ──
    var logoutBtn = document.getElementById('mp-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() { mpHandleLogout(); });
    }

    // ── Prayer Submit ──
    var submitBtn = document.getElementById('mp-prayer-submit');
    if (submitBtn) {
        submitBtn.addEventListener('click', function() { mpHandlePrayerSubmit(auth); });
    }

    // ── Journal Submit ──
    var journalBtn = document.getElementById('mp-journal-submit');
    if (journalBtn) {
        journalBtn.addEventListener('click', function() { mpHandleJournalSubmit(auth); });
    }

    // ── Load Data ──
    await mpLoadPortalData(auth);
}

// ==========================================
//  DATA LOADERS
// ==========================================

async function mpLoadPortalData(auth) {
    var email = auth.email;

    // Profile
    try {
        var profile;
        if (_mpProfileEmail === email && _mpProfile && _mpFreshCache(_mpProfileAt)) {
            profile = _mpProfile;
        } else {
            profile = await mpFetchProfile(auth);
            _mpProfile = profile; _mpProfileEmail = email; _mpProfileAt = Date.now();
        }
        if (profile) {
            var name = [profile.preferredName || profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Member';
            var nameEl = document.getElementById('mp-welcome-name');
            if (nameEl) nameEl.textContent = name;
        }
    } catch (e) { /* non-critical */ }

    // Prayer
    try {
        var prayers;
        if (_mpPrayerEmail === email && _mpPrayerRows.length && _mpFreshCache(_mpPrayerAt)) {
            prayers = _mpPrayerRows;
        } else {
            prayers = await mpFetchPrayerList(auth);
            _mpPrayerRows = prayers; _mpPrayerEmail = email; _mpPrayerAt = Date.now();
        }
        var timelineEl = document.getElementById('mp-prayer-timeline');
        if (timelineEl) timelineEl.innerHTML = mpRenderPrayerTimeline(prayers);
        mpUpdateStats(prayers.length, null);
    } catch (e) {
        var timelineEl2 = document.getElementById('mp-prayer-timeline');
        if (timelineEl2) timelineEl2.innerHTML = '<div class="mp-error">SYNC ERROR: ' + escapeHtml(e.message) + '</div>';
    }

    // Journal
    try {
        var journal;
        if (_mpJournalEmail === email && _mpJournalRows.length && _mpFreshCache(_mpJournalAt)) {
            journal = _mpJournalRows;
        } else {
            journal = await mpFetchJournal(auth);
            _mpJournalRows = journal; _mpJournalEmail = email; _mpJournalAt = Date.now();
        }
        var journalEl = document.getElementById('mp-journal-list');
        if (journalEl) journalEl.innerHTML = mpRenderJournal(journal);
        mpUpdateStats(null, journal.length);
    } catch (e) {
        var journalEl2 = document.getElementById('mp-journal-list');
        if (journalEl2) journalEl2.innerHTML = '<div class="mp-error">SYNC ERROR: ' + escapeHtml(e.message) + '</div>';
    }
}

function mpUpdateStats(prayerCount, journalCount) {
    var el = document.getElementById('mp-stats');
    if (!el) return;
    var pc = prayerCount != null ? prayerCount : (_mpPrayerRows ? _mpPrayerRows.length : 0);
    var jc = journalCount != null ? journalCount : (_mpJournalRows ? _mpJournalRows.length : 0);
    el.innerHTML = mpStatChip('Prayers', pc, 'gold')
        + mpStatChip('Journal', jc, 'cyan')
        + mpStatChip('Hub Apps', MP_HUB_LEARN.length + MP_HUB_PRAY.length, 'green');
}

// ==========================================
//  PRAYER SUBMIT
// ==========================================

async function mpHandlePrayerSubmit(auth) {
    var textEl = document.getElementById('mp-prayer-text');
    var catEl = document.getElementById('mp-prayer-category');
    var btn = document.getElementById('mp-prayer-submit');
    if (!textEl || !btn) return;

    var text = textEl.value.trim();
    if (!text) { textEl.focus(); return; }

    btn.disabled = true;
    btn.textContent = 'SUBMITTING...';

    try {
        var created = await mpSubmitPrayer(auth, text, catEl ? catEl.value : 'Personal');
        if (created) _mpPrayerRows.unshift(created);
        textEl.value = '';

        var timelineEl = document.getElementById('mp-prayer-timeline');
        if (timelineEl) timelineEl.innerHTML = mpRenderPrayerTimeline(_mpPrayerRows);
        mpUpdateStats(_mpPrayerRows.length, null);
    } catch (e) {
        var timelineEl2 = document.getElementById('mp-prayer-timeline');
        if (timelineEl2) {
            var errDiv = document.createElement('div');
            errDiv.className = 'mp-error';
            errDiv.textContent = 'SUBMIT ERROR: ' + e.message;
            timelineEl2.prepend(errDiv);
        }
    } finally {
        btn.disabled = false;
        btn.textContent = 'SUBMIT PRAYER';
    }
}

// ==========================================
//  JOURNAL SUBMIT
// ==========================================

async function mpHandleJournalSubmit(auth) {
    var titleEl = document.getElementById('mp-journal-title');
    var bodyEl = document.getElementById('mp-journal-body');
    var btn = document.getElementById('mp-journal-submit');
    if (!titleEl || !bodyEl || !btn) return;

    var title = titleEl.value.trim();
    var body = bodyEl.value.trim();
    if (!title && !body) { titleEl.focus(); return; }
    if (!title) title = 'Journal Entry';

    btn.disabled = true;
    btn.textContent = 'SAVING...';

    try {
        var created = await mpSaveJournalEntry(auth, title, body);
        if (created) _mpJournalRows.unshift(created);
        titleEl.value = '';
        bodyEl.value = '';

        var listEl = document.getElementById('mp-journal-list');
        if (listEl) listEl.innerHTML = mpRenderJournal(_mpJournalRows);
        mpUpdateStats(null, _mpJournalRows.length);
    } catch (e) {
        var listEl2 = document.getElementById('mp-journal-list');
        if (listEl2) {
            var errDiv = document.createElement('div');
            errDiv.className = 'mp-error';
            errDiv.textContent = 'SAVE ERROR: ' + e.message;
            listEl2.prepend(errDiv);
        }
    } finally {
        btn.disabled = false;
        btn.textContent = 'SAVE ENTRY';
    }
}

// ==========================================
//  DIRECTORY
// ==========================================

var _mpDirLoaded = false;

async function mpLoadDirectory(auth) {
    if (_mpDirLoaded && _mpDirRows.length) return;
    var listEl = document.getElementById('mp-dir-list');
    if (!listEl) return;

    try {
        var rows;
        if (_mpDirEmail === auth.email && _mpDirRows.length && _mpFreshCache(_mpDirAt)) {
            rows = _mpDirRows;
        } else {
            rows = await mpFetchDirectory(auth);
            _mpDirRows = rows; _mpDirEmail = auth.email; _mpDirAt = Date.now();
        }
        _mpDirLoaded = true;
        mpRenderDirectoryList(rows, '');

        var searchEl = document.getElementById('mp-dir-search');
        var timer = null;
        if (searchEl) {
            searchEl.addEventListener('input', function() {
                clearTimeout(timer);
                timer = setTimeout(function() { mpRenderDirectoryList(_mpDirRows, searchEl.value); }, 200);
            });
        }
    } catch (e) {
        listEl.innerHTML = '<div class="mp-error">SYNC ERROR: ' + escapeHtml(e.message) + '</div>';
    }
}

function mpRenderDirectoryList(members, filter) {
    var listEl = document.getElementById('mp-dir-list');
    if (!listEl) return;

    var term = (filter || '').toLowerCase().trim();
    var visible = members.filter(function(m) {
        var s = String(m.membershipStatus || '').toLowerCase();
        if (s === 'inactive' || s === 'member in glory') return false;
        if (!term) return true;
        var hay = [m.firstName, m.lastName, m.preferredName, m.ministryTeams, m.primaryEmail, m.email]
            .map(function(v) { return String(v || '').toLowerCase(); }).join(' ');
        return hay.indexOf(term) !== -1;
    });

    if (!visible.length) {
        listEl.innerHTML = '<div class="mp-empty">' + (term ? 'NO MATCHES FOUND' : 'NO MEMBERS AVAILABLE') + '</div>';
        return;
    }

    visible.sort(function(a, b) {
        var an = (String(a.firstName || '') + ' ' + String(a.lastName || '')).trim().toLowerCase();
        var bn = (String(b.firstName || '') + ' ' + String(b.lastName || '')).trim().toLowerCase();
        return an.localeCompare(bn);
    });

    listEl.innerHTML = visible.map(mpRenderDirectoryCard).join('');

    var countEl = document.getElementById('mp-dir-count');
    if (countEl) {
        var total = members.filter(function(m) {
            var s = String(m.membershipStatus || '').toLowerCase();
            return s !== 'inactive' && s !== 'member in glory';
        }).length;
        countEl.textContent = term
            ? visible.length + ' OF ' + total + ' MEMBER' + (total !== 1 ? 'S' : '')
            : total + ' MEMBER' + (total !== 1 ? 'S' : '');
    }
}

// ==========================================
//  DIRECTORY APP (stand-alone route)
// ==========================================

async function openMemberDirectoryApp() {
    var auth = getMemberPortalAuth();
    if (!auth) {
        if (typeof openHomeSecureLogin === 'function') openHomeSecureLogin();
        return;
    }

    // Open portal then switch to directory tab
    await openMemberPortalApp();
    var dirTab = document.querySelector('.mp-tab[data-mp-tab="directory"]');
    if (dirTab) dirTab.click();
}

// ==========================================
//  WINDOW EXPORTS
// ==========================================
window.openMemberPortalApp = openMemberPortalApp;
window.openMemberDirectoryApp = openMemberDirectoryApp;
window.preloadMemberPortalData = preloadMemberPortalData;

if (typeof installAppAnchorSync === 'function') {
    installAppAnchorSync();
}
