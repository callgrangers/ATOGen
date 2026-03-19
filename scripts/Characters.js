// ==========================================
// APP: CHARACTER LINEAGE EXPLORER
// ==========================================

const CHARACTERS_APP_API_URL = `${MASTER_API_URL}?tab=Genealogy`;

const charactersAppState = {
    db: {},
    activeNodeId: null,
    currentMode: 'tree',
    loaded: false,
    lastLoadedAt: 0,
    cacheTtlMs: 5 * 60 * 1000,
    inFlightLoadPromise: null,
    searchSetupDone: false,
    documentClickHandler: null,
    resizeHandlerAttached: false
};

function charactersSafeJsString(value) {
    return String(value)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');
}

function charactersApplyResponsiveLayout() {
    const wrap = document.getElementById('characters-grid-wrap');
    if (!wrap) return;
    wrap.style.gridTemplateColumns = window.matchMedia('(min-width: 1024px)').matches ? '1fr 2fr' : '1fr';
}

function charactersBounceToElement(targetEl) {
    const modalBody = document.querySelector('#data-modal .modal-body');
    if (!modalBody || !targetEl) return;

    const bodyRect = modalBody.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    const targetTop = Math.max(0, modalBody.scrollTop + (targetRect.top - bodyRect.top) - 8);

    modalBody.scrollTo({ top: targetTop, behavior: 'smooth' });
    setTimeout(() => modalBody.scrollTo({ top: targetTop + 16, behavior: 'smooth' }), 220);
    setTimeout(() => modalBody.scrollTo({ top: targetTop, behavior: 'smooth' }), 420);
}

function charactersBounceToSearch() {
    const searchShell = document.getElementById('characters-search-shell');
    if (searchShell) charactersBounceToElement(searchShell);
}

function charactersBounceToDetails() {
    const detail = document.getElementById('characters-detail-shell');
    if (detail) charactersBounceToElement(detail);
}

function charactersRenderWelcomeState() {
    const detail = document.getElementById('characters-detail-shell');
    if (!detail) return;

    detail.innerHTML = `
        <div style="min-height:500px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:28px; color:#94a3b8;">
            <div style="font-size:3rem; margin-bottom:12px; opacity:0.55;">📖</div>
            <div style="font-family:'Merriweather', serif; font-size:1.5rem; color:#fff; margin-bottom:8px;">Select a Figure to Begin</div>
            <div style="max-width:460px; font-size:0.9rem; line-height:1.55;">Explore biblical characters through lineage paths or an alphabetical directory.</div>
        </div>
    `;
}

function charactersNormalizeChildren(rawChildren) {
    if (Array.isArray(rawChildren)) {
        return rawChildren.map(value => String(value).trim()).filter(Boolean);
    }

    if (typeof rawChildren === 'string') {
        return rawChildren
            .split(',')
            .map(value => value.trim())
            .filter(Boolean);
    }

    return [];
}

function charactersNormalizeRow(row, fallbackId = '') {
    const id = String(row.id || row.ID || row.key || row.Key || row.name || row.Name || fallbackId).trim();
    const rawChildren = row.children ?? row.Children ?? row.child ?? row.Child ?? [];

    return {
        name: String(row.name || row.Name || row.character || row.Character || id),
        title: String(row.title || row.Title || row.role || row.Role || ''),
        lifespan: String(row.lifespan || row.Lifespan || row.years || row.Years || ''),
        meaning: String(row.meaning || row.Meaning || row.etymology || row.Etymology || ''),
        ref: String(row.ref || row.reference || row.Reference || ''),
        bio: String(row.bio || row.summary || row.Summary || ''),
        children: charactersNormalizeChildren(rawChildren)
    };
}

function charactersNormalizeDb(raw) {
    let source = raw;

    if (source && typeof source === 'object' && !Array.isArray(source)) {
        if (Array.isArray(source.data)) {
            source = source.data;
        } else if (Array.isArray(source.rows)) {
            source = source.rows;
        }
    }

    if (Array.isArray(source)) {
        const mapped = {};
        source.forEach((row, idx) => {
            const rowObj = row && typeof row === 'object' ? row : {};
            const id = String(rowObj.id || rowObj.ID || rowObj.key || rowObj.Key || rowObj.name || rowObj.Name || `row_${idx}`);
            mapped[id] = charactersNormalizeRow(rowObj, `row_${idx}`);
        });
        return mapped;
    }

    if (source && typeof source === 'object') {
        const mapped = {};
        Object.entries(source).forEach(([key, value]) => {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                mapped[String(key)] = charactersNormalizeRow(value, key);
            }
        });
        return mapped;
    }

    return {};
}

async function charactersFetchDatabase(forceReload = false, background = false) {
    const now = Date.now();
    const hasWarmCache = charactersAppState.loaded && Object.keys(charactersAppState.db || {}).length > 0 && (now - charactersAppState.lastLoadedAt) < charactersAppState.cacheTtlMs;
    if (!forceReload && hasWarmCache) {
        return charactersAppState.db;
    }

    if (charactersAppState.inFlightLoadPromise) {
        return charactersAppState.inFlightLoadPromise;
    }

    charactersAppState.inFlightLoadPromise = (async () => {
    // Try each endpoint in sequence until one works
    let lastError = null;
    for (const endpoint of APP_ENDPOINTS) {
        try {
            const separator = endpoint.includes('?') ? '&' : '?';
            const resp = await fetch(`${endpoint}${separator}tab=Genealogy&_=${Date.now()}`, { cache: 'no-store' });

            if (!resp.ok) {
                lastError = new Error(`Failed to load Characters database: ${resp.status}`);
                continue;
            }

            const data = await resp.json();

            if (data && typeof data === 'object' && !Array.isArray(data) && typeof data.error === 'string') {
                lastError = new Error(data.error);
                continue;
            }

            const normalized = charactersNormalizeDb(data);
            if (!normalized || Object.keys(normalized).length === 0) {
                lastError = new Error('Failed to load Characters database: no rows');
                continue;
            }

            return normalized; // Success
        } catch (e) {
            lastError = e;
            continue;
        }
    }
    
    // All endpoints failed
    throw lastError || new Error('Failed to load Characters database: no working endpoints');
    })();

    try {
        const result = await charactersAppState.inFlightLoadPromise;
        return result;
    } catch (error) {
        if (!background) throw error;
        return charactersAppState.db;
    } finally {
        charactersAppState.inFlightLoadPromise = null;
    }
}

function charactersHasLineage(nodeId) {
    const db = charactersAppState.db;
    const node = db[nodeId];
    if (!node) return false;

    if (Array.isArray(node.children) && node.children.length > 0) return true;

    return Object.values(db).some(data => Array.isArray(data.children) && data.children.includes(nodeId));
}

function charactersGetPathTo(targetId) {
    const db = charactersAppState.db;
    const path = [targetId];
    const visited = new Set([targetId]);

    let current = targetId;
    let found = true;

    while (found) {
        found = false;

        for (const [id, data] of Object.entries(db)) {
            if (Array.isArray(data.children) && data.children.includes(current)) {
                if (visited.has(id)) {
                    return path;
                }
                path.unshift(id);
                visited.add(id);
                current = id;
                found = true;
                break;
            }
        }
    }

    return path;
}

function charactersRenderLinearPath(nodeId) {
    const db = charactersAppState.db;
    const list = document.getElementById('characters-list-container');
    if (!list) return;

    if (!charactersHasLineage(nodeId)) {
        list.innerHTML = `<div style="text-align:center; color:#94a3b8; margin-top:16px; font-style:italic;">This figure has no recorded lineage to chart.</div>`;
        return;
    }

    const path = charactersGetPathTo(nodeId);
    const html = [];

    html.push('<div style="position:relative; width:100%;">');
    html.push('<div style="position:absolute; left:18px; top:4px; bottom:12px; width:2px; background:linear-gradient(180deg, rgba(64,224,208,0.45), rgba(160,32,240,0.45));"></div>');

    path.forEach(id => {
        const person = db[id];
        if (!person) return;

        const selected = id === nodeId;
        const safeId = charactersSafeJsString(id);

        html.push(`
            <div style="position:relative; z-index:1; display:flex; flex-direction:column; margin-bottom:10px;">
                <div style="display:flex; align-items:center; gap:10px; cursor:pointer;" onclick="charactersSelectNode('${safeId}')">
                    <div style="width:34px; height:34px; border-radius:999px; background:#0f172a; border:2px solid ${selected ? '#d946ef' : 'rgba(64,224,208,0.5)'}; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:900;">${selected ? '▼' : '↓'}</div>
                    <div style="flex:1; padding:10px; border-radius:10px; border:1px solid ${selected ? 'rgba(217,70,239,0.45)' : 'rgba(255,255,255,0.1)'}; background:${selected ? 'rgba(217,70,239,0.12)' : 'rgba(255,255,255,0.04)'};">
                        <div style="font-size:0.95rem; font-weight:800; color:#fff;">${escapeHtml(person.name || id)}</div>
                        <div style="font-size:0.72rem; color:${selected ? '#f0abfc' : '#67e8f9'}; margin-top:2px;">${escapeHtml(person.title || '')}</div>
                    </div>
                </div>
            </div>
        `);

        if (selected && Array.isArray(person.children) && person.children.length) {
            html.push('<div style="margin-left:46px; display:flex; flex-direction:column; gap:8px; margin-bottom:14px;">');
            html.push('<div style="font-size:0.62rem; color:#94a3b8; text-transform:uppercase; letter-spacing:2px;">Descendants</div>');

            person.children.forEach(childId => {
                const child = db[childId];
                if (!child) return;
                const safeChildId = charactersSafeJsString(childId);

                html.push(`
                    <div style="display:flex; align-items:center; gap:8px; cursor:pointer;" onclick="charactersSelectNode('${safeChildId}')">
                        <div style="width:18px; height:18px; border-radius:999px; border:1px solid rgba(148,163,184,0.7); color:#94a3b8; display:flex; align-items:center; justify-content:center; font-size:0.7rem;">+</div>
                        <div style="flex:1; background:rgba(0,0,0,0.35); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:8px; color:#cbd5e1; font-size:0.82rem;">${escapeHtml(child.name)}</div>
                    </div>
                `);
            });

            html.push('</div>');
        }
    });

    html.push('</div>');
    list.innerHTML = html.join('');
}

function charactersRenderAZList() {
    const db = charactersAppState.db;
    const list = document.getElementById('characters-list-container');
    if (!list) return;

    const sortedKeys = Object.keys(db).sort((a, b) =>
        String(db[a]?.name || '').localeCompare(String(db[b]?.name || ''))
    );

    const html = [];
    let currentLetter = '';

    sortedKeys.forEach(key => {
        const person = db[key];
        if (!person) return;

        const safeKey = charactersSafeJsString(key);
        const letter = String(person.name || '').charAt(0).toUpperCase() || '#';

        if (letter !== currentLetter) {
            currentLetter = letter;
            html.push(`<div style="font-family:'Merriweather', serif; color:#e879f9; margin:14px 0 6px; border-bottom:1px solid rgba(255,255,255,0.1); font-size:1.15rem;">${escapeHtml(letter)}</div>`);
        }

        const selected = key === charactersAppState.activeNodeId;

        html.push(`
            <div onclick="charactersSelectNode('${safeKey}')" style="padding:10px; border-radius:8px; border:1px solid ${selected ? 'rgba(56,189,248,0.45)' : 'rgba(255,255,255,0.08)'}; background:${selected ? 'rgba(56,189,248,0.12)' : 'rgba(0,0,0,0.2)'}; color:${selected ? '#fff' : '#cbd5e1'}; cursor:pointer; margin-bottom:6px;">
                <div style="font-weight:700;">${escapeHtml(person.name || key)}</div>
                <div style="font-size:0.72rem; color:${selected ? '#bae6fd' : '#67e8f9'}; margin-top:2px;">${escapeHtml(person.title || '')}</div>
            </div>
        `);
    });

    list.innerHTML = html.join('');
}

function charactersLoadDetails(nodeId, skipBounce = false) {
    const db = charactersAppState.db;
    const person = db[nodeId];
    const detail = document.getElementById('characters-detail-shell');

    if (!person || !detail) return;

    const parentItems = [];
    Object.entries(db).forEach(([id, data]) => {
        if (Array.isArray(data.children) && data.children.includes(nodeId)) {
            const safeId = charactersSafeJsString(id);
            parentItems.push(`
                <li style="padding:2px 0;">
                    <button onclick="charactersSelectNode('${safeId}')" style="background:none; border:none; color:#67e8f9; cursor:pointer; padding:0; text-align:left;">
                        ${escapeHtml(data.name)}
                    </button>
                </li>
            `);
        }
    });

    if (!parentItems.length) {
        parentItems.push('<li style="color:#64748b; font-style:italic;">None recorded</li>');
    }

    const childItems = [];
    if (Array.isArray(person.children) && person.children.length) {
        person.children.forEach(childId => {
            const child = db[childId];
            if (!child) return;
            const safeChildId = charactersSafeJsString(childId);

            childItems.push(`
                <li style="padding:2px 0;">
                    <button onclick="charactersSelectNode('${safeChildId}')" style="background:none; border:none; color:#67e8f9; cursor:pointer; padding:0; text-align:left;">
                        ${escapeHtml(child.name)}
                    </button>
                </li>
            `);
        });
    } else {
        childItems.push('<li style="color:#64748b; font-style:italic;">None recorded</li>');
    }

    detail.innerHTML = `
        <div style="padding:14px 16px 34px; min-height:100%;">
            <div style="border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px; margin-bottom:12px;">
                <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:8px;">
                    <div>
                        <div style="font-family:'Merriweather', serif; font-size:clamp(1.5rem, 3vw, 2.2rem); color:#fff; font-weight:800;">${escapeHtml(person.name || nodeId)}</div>
                        <div style="font-size:0.95rem; color:#e879f9; font-style:italic; margin-top:2px;">${escapeHtml(person.title || 'Biblical Figure')}</div>
                    </div>
                    <button class="clear-btn" style="padding:6px 12px; font-size:0.68rem;" onclick="charactersCloseDetails()">CLOSE</button>
                </div>
            </div>

            <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:10px; margin-bottom:12px;">
                <div style="background:rgba(30,41,59,0.45); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:10px;">
                    <div style="font-size:0.62rem; color:#94a3b8; text-transform:uppercase; letter-spacing:2px; margin-bottom:4px;">Etymology / Meaning</div>
                    <div style="font-size:0.95rem; color:#fff;">${escapeHtml(person.meaning || 'Unknown')}</div>
                </div>
                <div style="background:rgba(30,41,59,0.45); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:10px;">
                    <div style="font-size:0.62rem; color:#94a3b8; text-transform:uppercase; letter-spacing:2px; margin-bottom:4px;">Primary Scripture Ref.</div>
                    <div style="font-size:0.95rem; color:#67e8f9;">${escapeHtml(person.ref || 'Various')}</div>
                </div>
            </div>

            <div style="background:rgba(30,41,59,0.24); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:12px; margin-bottom:12px;">
                <div style="font-family:'JetBrains Mono'; font-size:0.7rem; color:#cbd5e1; letter-spacing:2px; text-transform:uppercase; margin-bottom:8px;">Biblical Record</div>
                <div style="color:#e2e8f0; line-height:1.6; font-size:0.92rem;">${escapeHtml(person.bio || 'Further biographical details unrecorded.')}</div>
            </div>

            <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:10px;">
                <div style="background:rgba(30,41,59,0.45); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:10px;">
                    <div style="font-size:0.62rem; color:#94a3b8; text-transform:uppercase; letter-spacing:2px; margin-bottom:6px;">Parentage</div>
                    <ul style="margin:0; padding-left:16px; color:#cbd5e1;">${parentItems.join('')}</ul>
                </div>
                <div style="background:rgba(30,41,59,0.45); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:10px;">
                    <div style="font-size:0.62rem; color:#94a3b8; text-transform:uppercase; letter-spacing:2px; margin-bottom:6px;">Notable Offspring</div>
                    <ul style="margin:0; padding-left:16px; color:#cbd5e1;">${childItems.join('')}</ul>
                </div>
            </div>
        </div>
    `;

    detail.scrollTop = 0;
    if (!skipBounce) charactersBounceToDetails();
}

function charactersRenderCurrentMode() {
    const mode = charactersAppState.currentMode;

    if (mode === 'tree') {
        if (charactersAppState.activeNodeId) {
            charactersRenderLinearPath(charactersAppState.activeNodeId);
        } else {
            const first = Object.keys(charactersAppState.db)[0];
            if (first) charactersRenderLinearPath(first);
        }
    } else {
        charactersRenderAZList();
    }
}

window.charactersSwitchMode = function(mode) {
    charactersAppState.currentMode = mode;

    const treeBtn = document.getElementById('characters-btn-tree');
    const azBtn = document.getElementById('characters-btn-az');

    if (treeBtn) {
        treeBtn.style.background = mode === 'tree' ? 'rgba(64,224,208,0.2)' : 'transparent';
        treeBtn.style.color = mode === 'tree' ? '#40e0d0' : '#94a3b8';
        treeBtn.style.fontWeight = mode === 'tree' ? '700' : '600';
    }

    if (azBtn) {
        azBtn.style.background = mode === 'az' ? 'rgba(64,224,208,0.2)' : 'transparent';
        azBtn.style.color = mode === 'az' ? '#40e0d0' : '#94a3b8';
        azBtn.style.fontWeight = mode === 'az' ? '700' : '600';
    }

    charactersRenderCurrentMode();
};

window.charactersSelectNode = function(nodeId, skipBounce = false) {
    if (!charactersAppState.db[nodeId]) return;
    charactersAppState.activeNodeId = nodeId;
    charactersRenderCurrentMode();
    charactersLoadDetails(nodeId, skipBounce);
};

window.charactersCloseDetails = function() {
    charactersAppState.activeNodeId = null;
    charactersRenderCurrentMode();
    charactersRenderWelcomeState();
    charactersBounceToSearch();
};

function charactersSetupSearch() {
    const input = document.getElementById('characters-search-input');
    const results = document.getElementById('characters-search-results');
    if (!input || !results) return;

    let searchTimer = null;

    input.oninput = () => {
        if (searchTimer) clearTimeout(searchTimer);

        searchTimer = setTimeout(() => {
            const term = input.value.toLowerCase().trim();

            if (term.length < 2) {
                results.classList.add('hidden');
                results.innerHTML = '';
                return;
            }

            const matches = [];

            Object.entries(charactersAppState.db).forEach(([id, person]) => {
                const name = String(person.name || '').toLowerCase();
                const title = String(person.title || '').toLowerCase();

                if (name.includes(term) || title.includes(term)) {
                    matches.push({ id, person });
                }
            });

            if (!matches.length) {
                results.innerHTML = '<div style="padding:10px; color:#94a3b8; font-size:0.78rem;">No names found.</div>';
                results.classList.remove('hidden');
                return;
            }

            results.innerHTML = matches.map(match => {
                const safeId = charactersSafeJsString(match.id);
                return `
                    <div style="padding:10px; border-bottom:1px solid rgba(255,255,255,0.08); cursor:pointer;" onclick="charactersSelectNode('${safeId}'); document.getElementById('characters-search-input').value=''; document.getElementById('characters-search-results').classList.add('hidden');">
                        <div style="font-weight:700; color:#fff;">${escapeHtml(match.person.name || '')}</div>
                        <div style="font-size:0.72rem; color:#67e8f9;">${escapeHtml(match.person.title || '')}</div>
                    </div>
                `;
            }).join('');

            results.classList.remove('hidden');
        }, 260);
    };

    if (!charactersAppState.documentClickHandler) {
        charactersAppState.documentClickHandler = (event) => {
            const currentInput = document.getElementById('characters-search-input');
            const currentResults = document.getElementById('characters-search-results');
            if (!currentInput || !currentResults) return;

            if (!currentInput.contains(event.target) && !currentResults.contains(event.target)) {
                currentResults.classList.add('hidden');
            }
        };

        document.addEventListener('click', charactersAppState.documentClickHandler);
    }

    charactersAppState.searchSetupDone = true;
}

function renderCharactersAppShell() {
    const container = document.getElementById('modal-body-container');
    if (!container) return;

    container.innerHTML = `
        <div style="max-width:1200px; margin:0 auto; color:#e2e8f0; padding:6px 6px var(--scroll-tail-pad) 6px;">
            <div style="background:rgba(0,0,0,0.35); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:10px 12px; display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <div style="font-family:'Merriweather', serif; font-size:clamp(1rem, 2.2vw, 1.4rem); color:#fff;">📜 Biblical Characters</div>
                <div style="text-align:right;">
                    <div style="font-size:0.62rem; letter-spacing:2px; text-transform:uppercase; color:#94a3b8;">Figures</div>
                    <div id="characters-stat-total" style="font-size:1.1rem; color:#67e8f9; font-weight:800;">0</div>
                </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr; gap:10px; min-height:620px;" id="characters-grid-wrap">
                <section style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); border-radius:14px; overflow:hidden;">
                    <div id="characters-search-shell" style="padding:10px; border-bottom:1px solid rgba(255,255,255,0.08); background:rgba(0,0,0,0.2); position:relative;">
                        <div style="display:flex; background:rgba(0,0,0,0.45); border-radius:8px; padding:4px; border:1px solid rgba(255,255,255,0.1); margin-bottom:10px;">
                            <button id="characters-btn-tree" onclick="charactersSwitchMode('tree')" style="flex:1; border:none; background:rgba(64,224,208,0.2); color:#40e0d0; padding:7px 0; border-radius:4px; font-size:0.73rem; letter-spacing:1px; text-transform:uppercase; font-weight:700; cursor:pointer;">Lineage Path</button>
                            <button id="characters-btn-az" onclick="charactersSwitchMode('az')" style="flex:1; border:none; background:transparent; color:#94a3b8; padding:7px 0; border-radius:4px; font-size:0.73rem; letter-spacing:1px; text-transform:uppercase; font-weight:600; cursor:pointer;">A-Z Directory</button>
                        </div>
                        <div style="position:relative;">
                            <span style="position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#67e8f9;">🔍</span>
                            <input id="characters-search-input" type="text" placeholder="Search a name..." style="width:100%; padding:10px 10px 10px 32px; border-radius:8px; border:1px solid rgba(255,255,255,0.12); background:#0f172a; color:#fff; font-size:0.9rem; outline:none;">
                            <div id="characters-search-results" class="hidden" style="position:absolute; left:0; right:0; top:calc(100% + 6px); background:rgba(2,6,23,0.96); border:1px solid rgba(255,255,255,0.12); border-radius:8px; max-height:240px; overflow-y:auto; z-index:20;"></div>
                        </div>
                    </div>
                    <div id="characters-list-container" class="custom-scrollbar" style="padding:12px; max-height:430px; overflow-y:auto;"></div>
                </section>

                <section id="characters-detail-shell" class="custom-scrollbar" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:14px; overflow-y:auto;"></section>
            </div>
        </div>
    `;

    charactersApplyResponsiveLayout();

    if (!charactersAppState.resizeHandlerAttached) {
        window.addEventListener('resize', charactersApplyResponsiveLayout);
        charactersAppState.resizeHandlerAttached = true;
    }

    charactersRenderWelcomeState();
}

async function openCharactersApp() {
    const backText = document.getElementById('modal-back-text');
    const backBtn = document.getElementById('modal-back-btn');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const modal = document.getElementById('data-modal');

    if (backText) backText.innerText = 'CLEAR';
    if (backBtn) backBtn.onclick = () => closeModal();
    if (title) title.innerHTML = `<span style="filter:none !important; text-shadow:none !important; margin-right:8px;">📜</span>CHARACTERS`;
    if (subtitle) subtitle.innerText = 'BIBLICAL CHARACTER EXPLORER';

    renderCharactersAppShell();

    if (modal) modal.classList.add('active');
    if (typeof bounceModalBodyToTop === 'function') bounceModalBodyToTop();

    const list = document.getElementById('characters-list-container');
    if (list) {
        list.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:180px; color:#67e8f9;">
                <div style="font-size:2rem; margin-bottom:8px;">⏳</div>
                <div style="font-family:'Merriweather', serif;"> </div>
            </div>
        `;
    }

    try {
        if (!charactersAppState.loaded || !Object.keys(charactersAppState.db).length) {
            charactersAppState.db = await charactersFetchDatabase(false, false);
            charactersAppState.loaded = true;
            charactersAppState.lastLoadedAt = Date.now();
        }

        const keys = Object.keys(charactersAppState.db);
        const statTotal = document.getElementById('characters-stat-total');
        if (statTotal) statTotal.textContent = String(keys.length);

        charactersAppState.currentMode = 'az';
        charactersSetupSearch();
        charactersSwitchMode('az');

        if (keys.length) {
            let startingNodeId = keys[0];

            for (const key of keys) {
                const name = String(charactersAppState.db[key]?.name || '').toLowerCase();
                if (name === 'jesus' || name === 'jesus christ') {
                    startingNodeId = key;
                    break;
                }
            }

            charactersSelectNode(startingNodeId, true);
        } else {
            charactersRenderWelcomeState();
        }

        // Refresh character database silently for next app entry.
        charactersFetchDatabase(true, true)
            .then((freshDb) => {
                if (!freshDb || !Object.keys(freshDb).length) return;
                charactersAppState.db = freshDb;
                charactersAppState.loaded = true;
                charactersAppState.lastLoadedAt = Date.now();
            })
            .catch(() => {});
    } catch (e) {
        const errHtml = `
            <div style="padding:14px; text-align:center; color:#f87171; background:rgba(127,29,29,0.2); border:1px solid rgba(248,113,113,0.4); border-radius:10px; margin:8px;">
                Starlink sync error. Verify the script URL is correct and accessible.
            </div>
        `;

        if (list) list.innerHTML = errHtml;

        const detail = document.getElementById('characters-detail-shell');
        if (detail) detail.innerHTML = errHtml;

        console.error('Characters app load failed:', e);
    }
}

window.openCharactersApp = openCharactersApp;

if (typeof installAppAnchorSync === 'function') {
    installAppAnchorSync();
}
