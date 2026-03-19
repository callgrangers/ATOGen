// ==========================================
// APP: WORDS / LEXICON EXPLORER
// ==========================================

const WORDS_APP_API_URL = `${MASTER_API_URL}?tab=Words`;
const WORDS_THEME_DEFINITIONS = {
    'Deity': 'Focuses on the nature, character, and attributes of the Divine.',
    'Salvation': 'Relates to the economy of redemption and spiritual rescue.',
    'Humanity': 'Defines the human experience and condition before God.',
    'Action': 'Represents behavioral responses or physical postures with spiritual meaning.',
    'Covenant': 'Focuses on relationship framework, promises, and obligations.',
    'Eschatology': 'Deals with destiny, final realities, and eternal horizons.',
    'Concept': 'Abstract theological and philosophical categories.'
};

const wordsAppState = {
    lexiconData: [],
    currentViewData: [],
    loaded: false
};

function wordsGetFuzzyValue(obj, possibleKeys) {
    const objKeys = Object.keys(obj || {});
    for (const key of possibleKeys) {
        const foundKey = objKeys.find(k => k.toLowerCase().trim() === key.toLowerCase());
        if (foundKey) return obj[foundKey];
    }
    return '';
}

function wordsNormalizeTestament(value) {
    const text = String(value || '').trim();
    const upper = text.toUpperCase();
    if (upper === 'OT' || upper === 'OLD' || upper === 'OLD TESTAMENT') return 'Old';
    if (upper === 'NT' || upper === 'NEW' || upper === 'NEW TESTAMENT') return 'New';
    return text;
}

function wordsNormalizeData(data) {
    return (Array.isArray(data) ? data : []).map(item => ({
        english: (wordsGetFuzzyValue(item, ['english', 'word', 'term']) || '').toString().trim(),
        strongs: (wordsGetFuzzyValue(item, ['strongs', 'id']) || '').toString(),
        original: (wordsGetFuzzyValue(item, ['original', 'root']) || '').toString(),
        translit: (wordsGetFuzzyValue(item, ['transliteration', 'translit']) || '').toString(),
        definition: (wordsGetFuzzyValue(item, ['definition', 'meaning']) || '').toString(),
        nuance: (wordsGetFuzzyValue(item, ['nuance', 'context']) || '').toString(),
        testament: wordsNormalizeTestament(wordsGetFuzzyValue(item, ['testament', 'bible'])),
        theme: (wordsGetFuzzyValue(item, ['theme', 'category']) || 'Concept').toString(),
        count: (wordsGetFuzzyValue(item, ['count', 'hits', 'usage']) || 0).toString(),
        versesRaw: (wordsGetFuzzyValue(item, ['verses', 'reference', 'refs', 'scripture']) || '').toString()
    })).filter(item => item.english !== '');
}

function wordsUpdateStatus(text, ok) {
    const dot = document.getElementById('words-sync-dot');
    const label = document.getElementById('words-sync-text');
    if (dot) {
        dot.style.background = ok ? '#40e0d0' : '#f59e0b';
        dot.style.boxShadow = ok ? '0 0 12px #40e0d0' : 'none';
    }
    if (label) label.textContent = text;
}

function wordsRenderPlaceholder() {
    const detail = document.getElementById('words-detail-view');
    if (!detail) return;
    detail.innerHTML = `
        <div style="height:100%; min-height:420px; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; color:#94a3b8; padding:30px;">
            <div style="font-size:3rem; opacity:0.4; margin-bottom:14px;">✦</div>
            <div style="font-family:'JetBrains Mono'; letter-spacing:2px; text-transform:uppercase; font-size:0.8rem; margin-bottom:8px; color:#f8fafc;">Words</div>
            <div style="font-size:0.9rem;">Select a term from the dictionary index to begin.</div>
        </div>
    `;
}

function wordsBounceToElement(targetEl) {
    const modalBody = document.querySelector('#data-modal .modal-body');
    if (!modalBody || !targetEl) return;
    const bodyRect = modalBody.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    const targetTop = Math.max(0, modalBody.scrollTop + (targetRect.top - bodyRect.top) - 8);

    modalBody.scrollTo({ top: targetTop, behavior: 'smooth' });
    setTimeout(() => modalBody.scrollTo({ top: targetTop + 18, behavior: 'smooth' }), 230);
    setTimeout(() => modalBody.scrollTo({ top: targetTop, behavior: 'smooth' }), 430);
}

function wordsBounceToDetailPanel() {
    const detail = document.getElementById('words-detail-view');
    if (detail) wordsBounceToElement(detail);
}

function wordsBounceToSearchPanel() {
    const searchPanel = document.getElementById('words-search-shell') || document.getElementById('words-search-input');
    if (searchPanel) wordsBounceToElement(searchPanel);
}

function wordsBuildThemeProfile(item, countNum, versesArray) {
    const themeSummary = WORDS_THEME_DEFINITIONS[item.theme] || 'This term represents a core lexical concept in biblical theology.';
    const testament = String(item.testament || '').toLowerCase();
    const nuance = String(item.nuance || '').trim();
    const definition = String(item.definition || '').trim();

    let testamentContext = 'It functions across biblical interpretation as a meaningful theological term.';
    if (testament.includes('old')) {
        testamentContext = 'Its Old Testament setting suggests the word should be read against covenant history, worship patterns, and Israel\'s developing revelation.';
    } else if (testament.includes('new')) {
        testamentContext = 'Its New Testament setting suggests the word should be read in light of Christ\'s fulfillment, apostolic teaching, and the life of the church.';
    }

    let frequencyContext = 'Its frequency suggests a specialized but still meaningful contribution to biblical theology.';
    if (countNum >= 200) {
        frequencyContext = 'Its high frequency suggests this is a major recurring thread, not a marginal detail, so it helps trace a broad biblical pattern.';
    } else if (countNum >= 75) {
        frequencyContext = 'Its repeated use suggests this idea carries real interpretive weight and should be treated as part of a larger theological motif.';
    } else if (countNum > 0 && countNum < 10) {
        frequencyContext = 'Its relatively low frequency suggests careful attention is needed, because rarer terms often carry concentrated significance in key passages.';
    }

    let nuanceContext = '';
    if (nuance) {
        nuanceContext = `The nuance in the sheet indicates that this word is not merely lexical data; it frames ${nuance.charAt(0).toLowerCase() + nuance.slice(1)}.`;
    } else if (definition) {
        nuanceContext = `Read alongside its definition, the term points beyond a dictionary gloss toward a fuller theological and pastoral meaning.`;
    }

    let anchorContext = '';
    if (versesArray.length === 1) {
        anchorContext = `The attached scriptural anchor shows where this concept becomes especially visible in context.`;
    } else if (versesArray.length > 1) {
        anchorContext = `The attached scriptural anchors show that this concept should be traced across passages rather than read in isolation.`;
    }

    return [themeSummary, testamentContext, frequencyContext, nuanceContext, anchorContext].filter(Boolean).join(' ');
}

function wordsCloseDetailWindow() {
    document.querySelectorAll('.words-item').forEach(el => {
        el.style.borderLeftColor = 'transparent';
        el.style.background = 'transparent';
        el.style.transform = 'translateX(0)';
    });
    wordsRenderPlaceholder();
    wordsBounceToSearchPanel();
}

function wordsSelectWord(item, element) {
    document.querySelectorAll('.words-item').forEach(el => {
        el.style.borderLeftColor = 'transparent';
        el.style.background = 'transparent';
        el.style.transform = 'translateX(0)';
    });
    if (element) {
        element.style.borderLeftColor = '#f6d87a';
        element.style.background = 'rgba(246, 216, 122, 0.08)';
        element.style.transform = 'translateX(8px)';
    }

    const detail = document.getElementById('words-detail-view');
    if (!detail) return;

    const versesArray = item.versesRaw ? item.versesRaw.split(/[,;]/).filter(v => v.trim() !== '') : [];
    const versesHtml = versesArray.map(v => `
        <span style="background:rgba(15,23,42,0.9); border:1px solid rgba(255,255,255,0.12); color:#40e0d0; padding:6px 10px; border-radius:10px; font-size:0.72rem; font-family:'JetBrains Mono'; letter-spacing:1px; text-transform:uppercase;">${escapeHtml(v.trim())}</span>
    `).join('');
    const countNum = Math.max(0, parseInt(item.count || '0', 10) || 0);
    const barWidth = Math.min(100, Math.round((countNum / 1000) * 100));
    const themeBlurb = wordsBuildThemeProfile(item, countNum, versesArray);

    detail.innerHTML = `
        <div style="padding:18px 20px 40px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px; margin-bottom:14px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px;">
                <div>
                    <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px;">
                        <span style="font-size:0.65rem; letter-spacing:2px; text-transform:uppercase; color:#0b1020; background:#40e0d0; padding:3px 8px; border-radius:999px; font-weight:700;">${escapeHtml(item.testament || 'NA')} Testament</span>
                        <span style="font-size:0.65rem; letter-spacing:2px; text-transform:uppercase; color:#cbd5e1; border:1px solid rgba(255,255,255,0.16); padding:3px 8px; border-radius:999px; font-weight:700;">${escapeHtml(item.theme || 'Concept')}</span>
                    </div>
                    <div style="font-family:'Merriweather', serif; font-size:clamp(1.5rem, 3.2vw, 2.5rem); font-weight:800; color:#fff; text-transform:uppercase;">${escapeHtml(item.english)}</div>
                    <div style="margin-top:8px; color:#f6d87a; font-size:1.4rem; font-family:'Merriweather', serif;">${escapeHtml(item.original)}</div>
                    <div style="color:#94a3b8; font-style:italic; font-size:1rem;">/${escapeHtml(item.translit)}/</div>
                </div>
                <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px; padding-top:8px;">
                    <button class="clear-btn" style="padding:6px 12px; font-size:0.68rem;" onclick="wordsCloseDetailWindow()">CLOSE</button>
                    <div style="background:linear-gradient(135deg, #7c3aed, #a855f7); color:#fff; border-radius:12px; padding:8px 12px; border:1px solid rgba(233,213,255,0.35); min-width:110px; text-align:center; box-shadow:0 10px 22px rgba(124,58,237,0.28); margin-top:4px;">
                        <div style="font-size:0.62rem; letter-spacing:2px; text-transform:uppercase; opacity:0.8; margin-bottom:2px;">Strong's Ref</div>
                        <div style="font-family:'JetBrains Mono'; font-size:1.2rem; font-weight:900;">${escapeHtml(item.strongs || '---')}</div>
                    </div>
                </div>
            </div>

            <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:12px; margin-bottom:12px;">
                <div style="font-size:0.72rem; color:#40e0d0; text-transform:uppercase; letter-spacing:2px; font-family:'JetBrains Mono'; margin-bottom:6px;">Thematic Profile</div>
                <div style="color:#cbd5e1; font-size:var(--body-copy-size); line-height:var(--body-copy-line);">${escapeHtml(themeBlurb)}</div>
            </div>

            <div style="margin-bottom:12px;">
                <div style="font-size:0.72rem; color:#a020f0; text-transform:uppercase; letter-spacing:2px; font-family:'JetBrains Mono'; margin-bottom:6px;">Semantic Concept</div>
                <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:14px; color:#fff; line-height:1.65;">${escapeHtml(item.definition)}</div>
            </div>

            <div style="margin-bottom:12px;">
                <div style="font-size:0.72rem; color:#ff4040; text-transform:uppercase; letter-spacing:2px; font-family:'JetBrains Mono'; margin-bottom:6px;">Theological Nuance</div>
                <div style="padding:6px 0 6px 12px; border-left:2px solid rgba(255,64,64,0.35); color:#d1d5db; font-style:italic;">"${escapeHtml(item.nuance)}"</div>
            </div>

            <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:10px;">
                <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:12px;">
                    <div style="font-size:0.62rem; color:#94a3b8; text-transform:uppercase; letter-spacing:2px; font-family:'JetBrains Mono'; margin-bottom:6px;">Database Frequency</div>
                    <div style="font-size:1.8rem; color:#fff; font-weight:900; line-height:1;">${countNum}</div>
                    <div style="margin-top:8px; width:100%; height:7px; border-radius:999px; background:rgba(0,0,0,0.45); overflow:hidden; border:1px solid rgba(255,255,255,0.1);">
                        <div style="width:${barWidth}%; height:100%; background:linear-gradient(90deg,#a020f0,#ff4040,#f6d87a);"></div>
                    </div>
                </div>
                <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:12px;">
                    <div style="font-size:0.62rem; color:#94a3b8; text-transform:uppercase; letter-spacing:2px; font-family:'JetBrains Mono'; margin-bottom:8px;">Scriptural Anchors</div>
                    <div style="display:flex; flex-wrap:wrap; gap:6px;">${versesHtml || '<span style="font-size:0.7rem; color:#64748b; text-transform:uppercase; letter-spacing:1px; font-family:JetBrains Mono;">No reference nodes detected</span>'}</div>
                </div>
            </div>
        </div>
    `;
    wordsBounceToDetailPanel();
}

function wordsRenderWordList(data) {
    const list = document.getElementById('words-list');
    const filteredCount = document.getElementById('words-filtered-count');
    if (!list) return;

    const sorted = [...data].sort((a, b) => a.english.localeCompare(b.english));
    wordsAppState.currentViewData = sorted;
    if (filteredCount) filteredCount.textContent = `${sorted.length} Nodes`;

    if (!sorted.length) {
        list.innerHTML = `<div style="padding:36px 16px; text-align:center; color:#94a3b8; font-size:0.75rem; letter-spacing:2px; text-transform:uppercase; font-family:JetBrains Mono;">No nodes located</div>`;
        wordsRenderPlaceholder();
        return;
    }

    list.innerHTML = sorted.map((item, index) => `
        <div class="words-item" data-index="${index}" style="padding:12px; border-bottom:1px solid rgba(255,255,255,0.08); border-left:4px solid transparent; cursor:pointer; transition:all 0.25s ease;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:4px;">
                <div style="color:#fff; font-weight:800; letter-spacing:1px; text-transform:uppercase; font-size:0.9rem; flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(item.english)}</div>
                <span style="background:linear-gradient(135deg, #7c3aed, #a855f7); color:#fff; border-radius:8px; border:1px solid rgba(233,213,255,0.28); padding:3px 8px; font-size:0.68rem; font-family:JetBrains Mono; font-weight:800; letter-spacing:1px; margin-top:3px; box-shadow:0 6px 14px rgba(124,58,237,0.22);">${escapeHtml(item.strongs || '---')}</span>
            </div>
            <div style="font-size:0.72rem; color:#94a3b8; font-style:italic; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(item.original)} / ${escapeHtml(item.translit)}</div>
        </div>
    `).join('');

    list.querySelectorAll('.words-item').forEach(el => {
        el.addEventListener('mouseenter', () => {
            if (el.style.borderLeftColor !== 'rgb(246, 216, 122)') {
                el.style.background = 'rgba(255,255,255,0.05)';
                el.style.transform = 'translateX(4px)';
            }
        });
        el.addEventListener('mouseleave', () => {
            if (el.style.borderLeftColor !== 'rgb(246, 216, 122)') {
                el.style.background = 'transparent';
                el.style.transform = 'translateX(0)';
            }
        });
        el.addEventListener('click', () => {
            const idx = Number(el.getAttribute('data-index'));
            const item = wordsAppState.currentViewData[idx];
            if (item) wordsSelectWord(item, el);
        });
    });
}

function wordsSetupControls() {
    const input = document.getElementById('words-search-input');
    if (!input) return;

    let filterTimer = null;
    const doFilter = () => {
        if (filterTimer) clearTimeout(filterTimer);
        filterTimer = setTimeout(() => {
            const search = input.value.toLowerCase().trim();
            const filtered = wordsAppState.lexiconData.filter(item => {
                const english = item.english.toLowerCase();
                const strongs = item.strongs.toLowerCase();
                const translit = item.translit.toLowerCase();
                return english.includes(search) || strongs.includes(search) || translit.includes(search);
            });
            wordsRenderWordList(filtered);
        }, 250);
    };
    input.oninput = doFilter;
}

async function wordsLoadData(forceReload = false) {
    if (!forceReload && wordsAppState.loaded && wordsAppState.lexiconData.length) return;
    wordsUpdateStatus(' ', false);

    // Try each endpoint in sequence until one works
    let lastError = null;
    for (const endpoint of APP_ENDPOINTS) {
        try {
            const freshUrl = `${endpoint}?tab=Words&_=${Date.now()}`;
            const response = await fetch(freshUrl, { cache: 'no-store' });
            if (!response.ok) {
                lastError = new Error(`Words sync failed: ${response.status}`);
                continue;
            }
            const raw = await response.json();
            const source = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw?.rows) ? raw.rows : []));
            if (!source.length) {
                lastError = new Error('Words sync failed: no rows');
                continue;
            }
            
            wordsAppState.lexiconData = wordsNormalizeData(source);
            wordsAppState.loaded = true;
            return; // Success
        } catch (e) {
            lastError = e;
            continue;
        }
    }
    
    // All endpoints failed
    throw lastError || new Error('Words sync failed: no working endpoints');
}

function renderWordsAppShell() {
    const container = document.getElementById('modal-body-container');
    container.innerHTML = `
        <div style="max-width:1200px; margin:0 auto; display:flex; flex-direction:column; gap:12px; color:#e2e8f0; padding:4px 4px var(--scroll-tail-pad) 4px;">
            <div style="background:linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01)); border:1px solid rgba(255,255,255,0.1); border-radius:16px; padding:12px; display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <span id="words-sync-dot" style="width:8px; height:8px; border-radius:50%; background:#f59e0b;"></span>
                    <span id="words-sync-text" style="font-size:0.72rem; letter-spacing:2px; text-transform:uppercase; font-family:'JetBrains Mono'; color:#94a3b8;"> </span>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:0.62rem; letter-spacing:2px; text-transform:uppercase; color:#f6d87a; font-family:'JetBrains Mono';">Starlink Feed</div>
                    <div id="words-word-count" style="font-family:'Merriweather', serif; font-size:1.1rem; color:#fff; font-weight:800;">---</div>
                </div>
            </div>

            <div id="words-search-shell" style="background:linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01)); border:1px solid rgba(255,255,255,0.1); border-radius:16px; padding:12px;">
                <div style="position:relative;">
                    <span style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#f6d87a; opacity:0.75;">🔍</span>
                    <input id="words-search-input" type="text" placeholder="Search meanings, roots, or Strong's IDs..." style="width:100%; border-radius:12px; border:1px solid rgba(255,255,255,0.12); background:#0f172a; color:#fff; padding:12px 12px 12px 38px; outline:none; font-size:0.95rem;">
                </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr; gap:12px; min-height:560px;" id="words-grid-wrap">
                <div style="background:linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01)); border:1px solid rgba(255,255,255,0.1); border-radius:16px; overflow:hidden;">
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; border-bottom:1px solid rgba(255,255,255,0.08); background:rgba(11,16,32,0.72);">
                        <span style="font-size:0.68rem; letter-spacing:2px; text-transform:uppercase; color:#fff; font-family:'JetBrains Mono';">Dictionary Index</span>
                        <span id="words-filtered-count" style="font-size:0.62rem; letter-spacing:1px; text-transform:uppercase; color:#40e0d0; border:1px solid rgba(64,224,208,0.35); padding:3px 7px; border-radius:999px; font-family:'JetBrains Mono';">---</span>
                    </div>
                    <div id="words-list" class="custom-scrollbar" style="max-height:320px; overflow-y:auto;"></div>
                </div>

                <div id="words-detail-view" class="custom-scrollbar" style="background:linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01)); border:1px solid rgba(255,255,255,0.1); border-radius:16px; overflow-y:auto;"></div>
            </div>
        </div>
    `;

    const wrap = document.getElementById('words-grid-wrap');
    if (wrap && window.matchMedia('(min-width: 1024px)').matches) {
        wrap.style.gridTemplateColumns = '1fr 2fr';
    }

    wordsRenderPlaceholder();
}

async function openWordsApp() {
    document.getElementById('modal-back-text').innerText = 'CLEAR';
    document.getElementById('modal-back-btn').onclick = () => closeModal();
    document.getElementById('modal-title').innerHTML = `<span style="filter:none !important; text-shadow:none !important; margin-right:8px;">🔎</span>WORDS`;
    document.getElementById('modal-subtitle').innerText = 'WORD LOOKUP | MIDNIGHT GLASS PORTAL';

    renderWordsAppShell();
    document.getElementById('data-modal').classList.add('active');
    bounceModalBodyToTop();

    try {
        await wordsLoadData(false);
        const countEl = document.getElementById('words-word-count');
        if (countEl) countEl.innerText = String(wordsAppState.lexiconData.length);
        wordsRenderWordList(wordsAppState.lexiconData);
        wordsSetupControls();
        wordsUpdateStatus('Starlink Synced', true);

        if (wordsAppState.lexiconData.length) {
            const sorted = [...wordsAppState.lexiconData].sort((a, b) => a.english.localeCompare(b.english));
            let startWord = sorted[0];
            const preferred = sorted.find(w => String(w.english || '').toLowerCase() === 'christ');
            if (preferred) startWord = preferred;

            const idx = sorted.findIndex(w => w === startWord);
            const startEl = document.querySelector(`.words-item[data-index="${idx}"]`);
            wordsSelectWord(startWord, startEl || null);
        }

        // Refresh data in background without blocking app re-entry.
        wordsLoadData(true)
            .then(() => {
                const nextCountEl = document.getElementById('words-word-count');
                if (nextCountEl) nextCountEl.innerText = String(wordsAppState.lexiconData.length);
                wordsRenderWordList(wordsAppState.lexiconData);
                wordsUpdateStatus('Starlink Synced', true);
            })
            .catch(() => {});
    } catch (e) {
        wordsUpdateStatus('Starlink Error', false);
        const list = document.getElementById('words-list');
        if (list) {
            list.innerHTML = `<div style="padding:30px 14px; color:#ff4040; text-align:center; font-size:0.72rem; letter-spacing:2px; text-transform:uppercase; font-family:JetBrains Mono;">Starlink Sync Error: Connection Refused</div>`;
        }
        wordsRenderPlaceholder();
        console.error('Words app sync error:', e);
    }
}

window.wordsCloseDetailWindow = wordsCloseDetailWindow;
window.openWordsApp = openWordsApp;

if (typeof installAppAnchorSync === 'function') {
    installAppAnchorSync();
}