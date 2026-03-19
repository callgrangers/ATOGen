/**
 * APOLOGETICS APP
 */

function getApologeticsAppApiUrl() {
    const directGlobal = typeof globalThis !== 'undefined' ? globalThis.MASTER_API_URL : '';
    const lexicalGlobal = typeof MASTER_API_URL !== 'undefined' ? MASTER_API_URL : '';
    const directEndpoints = typeof globalThis !== 'undefined' && Array.isArray(globalThis.APP_ENDPOINTS)
        ? globalThis.APP_ENDPOINTS
        : [];
    const lexicalEndpoints = typeof APP_ENDPOINTS !== 'undefined' && Array.isArray(APP_ENDPOINTS)
        ? APP_ENDPOINTS
        : [];
    const endpointFallback = directEndpoints[0] || lexicalEndpoints[0] || '';
    const base = String(directGlobal || lexicalGlobal || endpointFallback || '').trim();
    return base ? `${base}?tab=Apologetics` : '';
}

function getApologeticsAppConfig() {
    const directGlobal = typeof globalThis !== 'undefined' && globalThis.APP_CONFIG && typeof globalThis.APP_CONFIG === 'object'
        ? globalThis.APP_CONFIG
        : null;
    const lexicalGlobal = typeof APP_CONFIG !== 'undefined' && APP_CONFIG && typeof APP_CONFIG === 'object'
        ? APP_CONFIG
        : null;
    return directGlobal || lexicalGlobal || {};
}

function getApologeticsSmsNumber() {
    const config = getApologeticsAppConfig();
    const candidate = String(config.smsNumber || '').trim();
    return candidate || '4423709462';
}

function getApologeticsThemeAccent() {
    try {
        const value = getComputedStyle(document.documentElement).getPropertyValue('--accent-cyan').trim();
        return value || '#60a5fa';
    } catch {
        return '#60a5fa';
    }
}

const apologeticsAppState = {
    categories: [],
    currentActiveId: null,
    loaded: false,
    lastLoadedAt: 0,
    cacheTtlMs: 5 * 60 * 1000,
    inFlightLoadPromise: null
};

function apologeticsAppEnsureStyles() {
    if (document.getElementById('apologetics-app-style')) return;
    const style = document.createElement('style');
    style.id = 'apologetics-app-style';
    style.textContent = `
        .apo-glass-panel {
            background: rgba(15, 23, 42, 0.45);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
        }
        .apo-message-pill {
            display: inline-flex;
            align-items: center;
            padding: 4px 12px;
            background: color-mix(in srgb, var(--accent-cyan) 14%, transparent);
            color: var(--accent-cyan);
            font-weight: 800;
            font-size: 0.7rem;
            letter-spacing: 1px;
            border-radius: 999px;
            border: 1px solid color-mix(in srgb, var(--accent-cyan) 45%, transparent);
            text-transform: uppercase;
            margin-bottom: 0.5rem;
        }
        .apo-nav-item-active {
            background: rgba(255, 255, 255, 0.1);
            font-weight: 700;
            color: #ffffff !important;
            text-shadow: 0 0 8px rgba(255,255,255,0.3);
        }
        .apo-ref-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 16px;
            border-radius: 999px;
            font-size: 0.85rem;
            font-weight: 800;
            text-decoration: none !important;
            transition: all 0.2s ease;
            background: rgba(255, 255, 255, 0.05);
        }
        .apo-ref-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(-1px);
        }
        .apo-sms-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 8px 20px;
            font-size: 0.85rem;
            font-weight: 700;
            color: #fff;
            background: color-mix(in srgb, var(--accent-cyan) 20%, transparent);
            border: 1px solid color-mix(in srgb, var(--accent-cyan) 55%, transparent);
            border-radius: 999px;
            transition: all 0.2s ease;
            text-decoration: none;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .apo-sms-btn:hover {
            background: color-mix(in srgb, var(--accent-cyan) 30%, transparent);
            transform: scale(1.02);
        }
        .apo-content-stack {
            display: grid;
            gap: 12px;
        }
        .apo-card {
            border-radius: 14px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            background: linear-gradient(145deg, rgba(15, 23, 42, 0.88), rgba(30, 41, 59, 0.72));
            box-shadow: 0 14px 30px rgba(0, 0, 0, 0.28);
            padding: 14px;
        }
        .apo-card-kicker {
            display: inline-block;
            font-size: 0.66rem;
            font-weight: 800;
            letter-spacing: 1.4px;
            text-transform: uppercase;
            padding: 4px 10px;
            border-radius: 999px;
            margin-bottom: 10px;
            border: 1px solid rgba(255,255,255,0.16);
            color: #cbd5e1;
            background: rgba(255,255,255,0.06);
        }
        .apo-card-answer {
            border-left: 4px solid var(--apo-accent, var(--accent-cyan));
        }
        .apo-card-answer p {
            margin: 0;
            color: #e2e8f0;
            line-height: 1.78;
            font-size: 1.02rem;
        }
        .apo-card-quote {
            background: linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.92));
        }
        .apo-card-quote blockquote {
            margin: 0;
            color: #f1f5f9;
            line-height: 1.8;
            font-style: italic;
            font-family: 'Merriweather', serif;
            border-left: 3px solid var(--apo-accent, var(--accent-cyan));
            padding-left: 12px;
        }
        .apo-card-ref {
            background: linear-gradient(145deg, rgba(2, 6, 23, 0.75), rgba(15, 23, 42, 0.9));
        }
        .apo-ref-heading {
            margin: 0 0 10px;
            font-size: 0.94rem;
            font-weight: 800;
            letter-spacing: 1.1px;
            text-transform: uppercase;
        }
        .apo-ref-subcopy {
            margin: 0 0 12px;
            color: #cbd5e1;
            font-size: 0.92rem;
            line-height: 1.65;
        }
        .apo-ref-meta {
            margin: 0 0 12px;
            color: #e2e8f0;
            font-size: 0.82rem;
            letter-spacing: 1.1px;
            text-transform: uppercase;
            font-weight: 700;
            text-align: center;
            font-style: italic;
            text-shadow: 0 0 14px color-mix(in srgb, var(--accent-cyan) 45%, transparent);
            background: linear-gradient(90deg,
                color-mix(in srgb, var(--accent-cyan) 12%, transparent),
                color-mix(in srgb, var(--accent-gold) 12%, transparent),
                color-mix(in srgb, var(--accent-magenta) 12%, transparent)
            );
            border: 1px solid rgba(148, 163, 184, 0.28);
            border-radius: 10px;
            padding: 8px 10px;
        }
        .apo-ref-link-wrap {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px;
            border-radius: 12px;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.08);
        }
    `;
    document.head.appendChild(style);
}

function apologeticsAppNormalizeRows(data) {
    let rows = [];
    if (Array.isArray(data)) rows = data;
    else if (data && typeof data === 'object') {
        if (Array.isArray(data.data)) rows = data.data;
        else if (Array.isArray(data.rows)) rows = data.rows;
    }
    return rows.filter(row => row && typeof row === 'object');
}

function apologeticsAppValue(row, keys) {
    const normalizeKey = (value) => String(value || '')
        .replace(/^\uFEFF/, '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_');

    const normalizedRow = {};
    Object.keys(row || {}).forEach(rawKey => {
        normalizedRow[normalizeKey(rawKey)] = row[rawKey];
    });

    for (const key of keys) {
        if (Object.prototype.hasOwnProperty.call(row, key) && row[key] != null && String(row[key]).trim() !== '') {
            return String(row[key]).trim();
        }

        const normalizedKey = normalizeKey(key);
        if (Object.prototype.hasOwnProperty.call(normalizedRow, normalizedKey)) {
            const value = normalizedRow[normalizedKey];
            if (value != null && String(value).trim() !== '') {
                return String(value).trim();
            }
        }
    }
    return '';
}

function apologeticsAppBuildContent(row, categoryColor) {
    const answer = escapeHtml(apologeticsAppValue(row, ['Answer_Content', 'answer_content', 'Answer Content', 'answer content', 'Answer', 'answer'])).replace(/\n/g, '<br>');
    const quote = escapeHtml(apologeticsAppValue(row, ['Quote_Text', 'quote_text', 'Quote Text', 'quote text', 'Quote', 'quote']));
    const rawRefText = apologeticsAppValue(row, ['Ref_Text', 'ref_text', 'Ref Text', 'ref text', 'Reference_Text', 'reference_text', 'Reference Text', 'reference text']);
    const refText = escapeHtml(rawRefText);
    const refUrl = apologeticsAppValue(row, ['Ref_URL', 'ref_url', 'Ref URL', 'ref url', 'Reference_URL', 'reference_url', 'Reference URL', 'reference url']);
    const fallbackRefUrl = rawRefText && typeof getBibleLink === 'function' ? getBibleLink(rawRefText) : '';
    const resolvedRefUrl = refUrl || fallbackRefUrl;

    let content = `
        <section class="apo-content-stack" style="--apo-accent:${categoryColor};">
            <article class="apo-card apo-card-answer">
                <span class="apo-card-kicker" style="color:${categoryColor}; border-color:${categoryColor}66; background:${categoryColor}22;">Biblical Answer</span>
                <p>${answer}</p>
            </article>
    `;

    if (quote) {
        content += `
            <article class="apo-card apo-card-quote">
                <span class="apo-card-kicker" style="color:${categoryColor}; border-color:${categoryColor}66; background:${categoryColor}1f;">Key Text</span>
                <blockquote>"${quote}"</blockquote>
            </article>
        `;
    }

    if (refText) {
        content += `
            <article class="apo-card apo-card-ref">
                <h4 class="apo-ref-heading" style="color:${categoryColor};">Study Reference</h4>
                <div class="apo-ref-link-wrap">
                    ${resolvedRefUrl
                        ? `<a href="${escapeHtml(resolvedRefUrl)}" target="_blank" rel="noopener noreferrer" class="apo-ref-btn" style="color:${categoryColor}; border:1px solid ${categoryColor}66; background:${categoryColor}1a;"><span style="line-height:1;">⌕</span>${refText}</a>`
                        : `<span class="apo-ref-btn" style="color:${categoryColor}; border:1px solid ${categoryColor}66; background:${categoryColor}1a;"><span style="line-height:1;">⌕</span>${refText}</span>`
                    }
                </div>
            </article>
        `;
    }

    content += '</section>';

    return content;
}

function apologeticsAppProcessRows(rows) {
    const categoriesMap = new Map();

    rows.forEach(row => {
        const categoryId = String(
            row.category_id ?? row.Category_ID ?? row.categoryId ?? row.CategoryID ??
            apologeticsAppValue(row, ['Category_ID', 'category_id', 'Category ID', 'category id', 'CategoryID', 'categoryId'])
        ).trim();
        const questionId = String(
            row.question_id ?? row.Question_ID ?? row.questionId ?? row.QuestionID ??
            apologeticsAppValue(row, ['Question_ID', 'question_id', 'Question ID', 'question id', 'QuestionID', 'questionId'])
        ).trim();
        if (!categoryId || !questionId) return;

        if (!categoriesMap.has(categoryId)) {
            const title = String(
                row.category_title ?? row.Category_Title ?? row.categoryTitle ?? row.CategoryTitle ??
                apologeticsAppValue(row, ['Category_Title', 'category_title', 'Category Title', 'category title', 'Category', 'category'])
            ).trim();
            const color = String(
                row.category_color ?? row.Category_Color ?? row.categoryColor ?? row.CategoryColor ??
                apologeticsAppValue(row, ['Category_Color', 'category_color', 'Category Color', 'category color', 'Color', 'color'])
            ).trim();
            const intro = String(
                row.category_intro ?? row.Category_Intro ?? row.categoryIntro ?? row.CategoryIntro ??
                apologeticsAppValue(row, ['Category_Intro', 'category_intro', 'Category Intro', 'category intro', 'Intro', 'intro'])
            ).trim();

            categoriesMap.set(categoryId, {
                id: categoryId,
                title: title || 'Category',
                color: color || getApologeticsThemeAccent(),
                intro: intro || 'Explore foundational questions and answers rooted in Scripture.',
                sections: []
            });
        }

        const category = categoriesMap.get(categoryId);
        const questionTitle = String(
            row.question_title ?? row.Question_Title ?? row.questionTitle ?? row.QuestionTitle ??
            apologeticsAppValue(row, ['Question_Title', 'question_title', 'Question Title', 'question title', 'Question', 'question'])
        ).trim();
        const shortTitle = String(
            row.short_title ?? row.Short_Title ?? row.shortTitle ?? row.ShortTitle ??
            apologeticsAppValue(row, ['Short_Title', 'short_title', 'Short Title', 'short title', 'Short', 'short'])
        ).trim();

        category.sections.push({
            id: questionId,
            title: questionTitle || 'Question',
            shortTitle: shortTitle || questionTitle || 'Question',
            content: apologeticsAppBuildContent(row, category.color)
        });
    });

    apologeticsAppState.categories = Array.from(categoriesMap.values());
}

function apologeticsAppRenderShell() {
    const container = document.getElementById('modal-body-container');
    if (!container) return;

    const requestHref = '/request';
    const smsDigits = String(getApologeticsSmsNumber() || '').replace(/\D/g, '');
    const smsBody = 'I have an apologetics question.';
    const smsHref = smsDigits
        ? `sms:${smsDigits}?body=${encodeURIComponent(smsBody)}`
        : `sms:?body=${encodeURIComponent(smsBody)}`;

    container.innerHTML = `
        <div style="position:relative; padding:8px; color:#f8fafc; background:#050914; border-radius:18px; overflow:hidden;">
            <div style="position:absolute; inset:0; background:
                radial-gradient(circle at 15% 30%, rgba(248,113,113,0.12), transparent 45%),
                radial-gradient(circle at 85% 20%, rgba(96,165,250,0.12), transparent 45%),
                radial-gradient(circle at 20% 80%, rgba(251,191,36,0.08), transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(192,132,252,0.12), transparent 50%),
                radial-gradient(circle at 50% 50%, rgba(15,23,42,0.9), transparent 70%);
                filter: blur(40px);
                pointer-events:none;
            "></div>

            <div style="position:relative; z-index:1; padding-bottom:var(--scroll-tail-pad);">
                <header class="apo-glass-panel" style="text-align:center; border-radius:16px; padding:20px 14px; margin-bottom:12px;">
                    <div class="apo-message-pill">Scriptural Defense</div>
                    <h2 style="margin:0 0 8px; font-family:'Merriweather', serif; font-size:clamp(1.4rem, 3.2vw, 2rem); font-weight:700;">Foundational Questions of the Faith</h2>
                    <p style="margin:0 auto 12px; max-width:760px; color:#cbd5e1; font-size:0.95rem; line-height:1.6;">A systematic exploration of core biblical doctrines, providing clear answers grounded in the final authority of Scripture.</p>
                    <a href="${requestHref}" onclick="return navigateAppAnchor(event, '/request')" class="apo-sms-btn">💬 Ask a Question</a>
                </header>

                <main style="display:flex; flex-direction:column; gap:12px;">
                    <aside class="apo-glass-panel" style="border-radius:16px; overflow:hidden;">
                        <div style="padding:12px 14px; border-bottom:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); display:flex; justify-content:space-between; align-items:center;">
                            <h3 style="margin:0; font-family:'Merriweather', serif; font-size:1.08rem; font-weight:700; color:#fff;">Contents 📖</h3>
                        </div>
                        <nav id="apo-sidebar-nav" style="display:flex; flex-direction:column; max-height:280px; overflow-y:auto;"></nav>
                    </aside>

                    <section style="display:flex; flex-direction:column; gap:12px;">
                        <div id="apo-category-intro" class="apo-glass-panel fade-in" style="border-left:4px solid #64748b; border-radius:16px; padding:14px; background:rgba(255,255,255,0.05);">
                            <h3 id="apo-intro-title" style="margin:0 0 6px; font-family:'Merriweather', serif; font-size:1.35rem; color:#fff;">Select a Question 🔍</h3>
                            <p id="apo-intro-desc" style="margin:0; color:#cbd5e1; line-height:1.65;">Use the navigation menu to explore foundational questions regarding God's sovereignty, salvation, scripture, and living the Christian faith.</p>
                        </div>

                        <article id="apo-content-pane" class="apo-glass-panel" style="border-radius:16px; min-height:420px; padding:18px;">
                            <div id="apo-placeholder-state" style="display:flex; align-items:center; justify-content:center; flex-direction:column; gap:10px; color:#64748b; min-height:340px; text-align:center;">
                                <span style="font-size:3rem; opacity:0.5;">✨</span>
                                <p id="apo-loading-text" style="margin:0; color:#94a3b8; max-width:320px;">Loading data from Google Sheets...</p>
                                <p id="apo-debug-text" style="margin:0; color:#64748b; max-width:420px; font-size:0.75rem; line-height:1.4;">Waiting for request...</p>
                            </div>

                            <div id="apo-active-content" class="hidden fade-in">
                                <h3 id="apo-content-title" style="margin:0 0 14px; padding-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.12); font-family:'Merriweather', serif; font-size:1.7rem; color:#fff;">Title</h3>
                                <div id="apo-content-body" style="color:#cbd5e1; line-height:1.75; font-size:1rem;"></div>
                            </div>
                        </article>
                    </section>
                </main>

                <footer class="apo-glass-panel" style="margin-top:12px; border-radius:16px; padding:14px; display:flex; flex-direction:column; align-items:center; gap:8px;">
                    <a href="${smsHref}" class="apo-sms-btn">💬 Ask a Question</a>
                    <p style="margin:0; color:#94a3b8; font-weight:700; letter-spacing:1.4px; text-transform:uppercase; font-size:0.75rem;">Soli Deo Gloria | 2026</p>
                </footer>
            </div>
        </div>
    `;

    const modalBody = document.querySelector('#data-modal .modal-body');
    const sidebar = document.getElementById('apo-sidebar-nav');
    if (modalBody && sidebar && window.matchMedia('(min-width: 900px)').matches) {
        sidebar.style.maxHeight = 'calc(100vh - 14rem)';
    }
}

function apologeticsAppSetStatus(message, debug = '') {
    const loadingText = document.getElementById('apo-loading-text');
    const debugText = document.getElementById('apo-debug-text');
    if (loadingText) loadingText.textContent = message;
    if (debugText) debugText.textContent = debug || '';
}

function apologeticsAppRenderNavigation() {
    const navContainer = document.getElementById('apo-sidebar-nav');
    if (!navContainer) return;

    navContainer.innerHTML = '';

    apologeticsAppState.categories.forEach(category => {
        const catHeader = document.createElement('div');
        catHeader.className = 'px-4 py-3 text-[11px] font-bold uppercase tracking-widest border-t border-white/10 mt-2 first:mt-0 first:border-0';
        catHeader.style.color = category.color;
        catHeader.textContent = category.title;
        navContainer.appendChild(catHeader);

        category.sections.forEach(section => {
            const button = document.createElement('button');
            button.className = 'w-full text-left px-4 py-3 text-[13.5px] text-slate-400 hover:bg-white/10 hover:text-white transition-colors duration-150 flex items-center justify-between border-l-4 border-transparent';
            button.id = `apo-nav-${section.id}`;
            button.innerHTML = `<span class="truncate pr-4">${section.shortTitle}</span><span class="text-xs text-slate-600 flex-shrink-0">➤</span>`;
            button.addEventListener('click', () => apologeticsAppLoadContent(category.id, section.id));
            navContainer.appendChild(button);
        });
    });
}

function apologeticsAppLoadContent(categoryId, sectionId) {
    if (apologeticsAppState.currentActiveId) {
        const previousButton = document.getElementById(`apo-nav-${apologeticsAppState.currentActiveId}`);
        if (previousButton) {
            previousButton.classList.remove('apo-nav-item-active');
            previousButton.style.borderLeftColor = 'transparent';
        }
    }

    const category = apologeticsAppState.categories.find(item => item.id === categoryId);
    if (!category) return;

    const section = category.sections.find(item => item.id === sectionId);
    if (!section) return;

    const nextButton = document.getElementById(`apo-nav-${sectionId}`);
    if (nextButton) {
        nextButton.classList.add('apo-nav-item-active');
        nextButton.style.borderLeftColor = category.color;
    }

    apologeticsAppState.currentActiveId = sectionId;

    const placeholder = document.getElementById('apo-placeholder-state');
    const activeContent = document.getElementById('apo-active-content');
    const contentTitle = document.getElementById('apo-content-title');
    const contentBody = document.getElementById('apo-content-body');
    const intro = document.getElementById('apo-category-intro');
    const introTitle = document.getElementById('apo-intro-title');
    const introDesc = document.getElementById('apo-intro-desc');

    if (placeholder) placeholder.classList.add('hidden');
    if (activeContent) {
        if (placeholder) placeholder.style.display = 'none';
        activeContent.classList.remove('hidden');
        activeContent.style.display = 'block';
        activeContent.classList.remove('fade-in');
        void activeContent.offsetWidth;
        activeContent.classList.add('fade-in');
    }

    if (contentTitle) {
        contentTitle.textContent = section.title;
        contentTitle.style.borderBottomColor = `${category.color}66`;
    }
    if (contentBody) contentBody.innerHTML = section.content;

    if (intro && introTitle && introDesc) {
        introTitle.innerHTML = decodeHtml(category.title);
        introDesc.innerHTML = decodeHtml(category.intro);
        // Helper to decode HTML entities for display
        function decodeHtml(html) {
            const txt = document.createElement('textarea');
            txt.innerHTML = html;
            return txt.value;
        }
        intro.style.borderLeftColor = category.color;
        intro.classList.remove('fade-in');
        void intro.offsetWidth;
        intro.classList.add('fade-in');
    }

    if (window.innerWidth < 768) {
        const pane = document.getElementById('apo-content-pane');
        const modalBody = document.querySelector('#data-modal .modal-body');
        if (pane && modalBody) {
            const bodyRect = modalBody.getBoundingClientRect();
            const paneRect = pane.getBoundingClientRect();
            const targetTop = Math.max(0, modalBody.scrollTop + (paneRect.top - bodyRect.top) - 10);
            modalBody.scrollTo({ top: targetTop, behavior: 'smooth' });
        }
    }
}

async function apologeticsAppFetchAndBuildData(forceReload = false, background = false) {
    const now = Date.now();
    const hasWarmCache = apologeticsAppState.loaded && apologeticsAppState.categories.length > 0 && (now - apologeticsAppState.lastLoadedAt) < apologeticsAppState.cacheTtlMs;
    if (!forceReload && hasWarmCache) {
        apologeticsAppRenderNavigation();
        const firstCategory = apologeticsAppState.categories[0];
        const firstSection = firstCategory?.sections?.[0];
        if (firstCategory && firstSection) {
            apologeticsAppLoadContent(firstCategory.id, firstSection.id);
        }
        return;
    }

    if (apologeticsAppState.inFlightLoadPromise) {
        return apologeticsAppState.inFlightLoadPromise;
    }

    apologeticsAppState.inFlightLoadPromise = (async () => {
    if (!background) {
        apologeticsAppSetStatus('Loading data from Google Sheets...', 'Requesting Apologetics tab...');
    }

    if (!forceReload && apologeticsAppState.loaded && apologeticsAppState.categories.length) {
        apologeticsAppRenderNavigation();
        const firstCategory = apologeticsAppState.categories[0];
        const firstSection = firstCategory?.sections?.[0];
        if (firstCategory && firstSection) {
            apologeticsAppLoadContent(firstCategory.id, firstSection.id);
            return;
        }
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        const apiUrl = getApologeticsAppApiUrl();
        if (!apiUrl) throw new Error('MASTER_API_URL is not configured.');

        const response = await fetch(`${apiUrl}&_=${Date.now()}`, {
            cache: 'no-store',
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`Request failed: ${response.status}`);

        const rawText = await response.text();
        let rawData;
        try {
            rawData = JSON.parse(rawText);
        } catch {
            throw new Error('Response was not valid JSON');
        }

        if (rawData && typeof rawData === 'object' && !Array.isArray(rawData) && typeof rawData.error === 'string') {
            throw new Error(rawData.error);
        }

        const rows = apologeticsAppNormalizeRows(rawData);
        if (!rows.length) throw new Error('No rows returned from Apologetics tab.');

        const sampleKeys = Object.keys(rows[0] || {}).slice(0, 6).join(', ');
        if (!background) {
            apologeticsAppSetStatus('Processing data...', `Rows: ${rows.length} | First row keys: ${sampleKeys}`);
        }

        apologeticsAppProcessRows(rows);
        const mappedSections = apologeticsAppState.categories.reduce((sum, category) => sum + category.sections.length, 0);
        if (!background) {
            apologeticsAppSetStatus('Rendering navigation...', `Categories: ${apologeticsAppState.categories.length} | Sections: ${mappedSections}`);
        }
        apologeticsAppRenderNavigation();

        const firstCategory = apologeticsAppState.categories[0];
        const firstSection = firstCategory?.sections?.[0];
        if (firstCategory && firstSection) {
            if (!background) {
                apologeticsAppSetStatus('Rendering first answer...', `${firstCategory.id} / ${firstSection.id}`);
            }
            apologeticsAppLoadContent(firstCategory.id, firstSection.id);
            if (!background) {
                apologeticsAppSetStatus('Ready', `Loaded ${mappedSections} entries across ${apologeticsAppState.categories.length} categories.`);
            }
        } else {
            if (!background) {
                apologeticsAppSetStatus('No questions found in the Apologetics tab.', `Rows mapped: ${rows.length} | Categories: 0`);
            }
        }

        apologeticsAppState.loaded = true;
        apologeticsAppState.lastLoadedAt = Date.now();
    } catch (error) {
        console.error('Apologetics app load failed:', error);
        if (background) return;
        const introTitle = document.getElementById('apo-intro-title');
        const introDesc = document.getElementById('apo-intro-desc');
        if (introTitle) introTitle.textContent = 'Error Loading Data';
        if (introDesc) introDesc.textContent = 'Please verify the Apologetics tab and script deployment are accessible.';
        apologeticsAppSetStatus(
            `Failed to load data: ${escapeHtml(error.message || 'Unknown error')}`,
            `Endpoint: ${getApologeticsAppApiUrl() || 'Unavailable'}`
        );
    } finally {
        apologeticsAppState.inFlightLoadPromise = null;
    }
    })();

    return apologeticsAppState.inFlightLoadPromise;
}

async function openApologeticsApp() {
    document.getElementById('modal-back-text').innerText = 'CLEAR';
    document.getElementById('modal-back-btn').onclick = () => closeModal();
    document.getElementById('modal-title').innerHTML = `<span style="filter:none !important; text-shadow:none !important; margin-right:8px;">🛡️</span>APOLOGETICS`;
    document.getElementById('modal-subtitle').innerText = 'CRITICAL QUESTIONS | BIBLICAL ANSWERS';

    apologeticsAppEnsureStyles();
    apologeticsAppRenderShell();

    document.getElementById('data-modal').classList.add('active');
    bounceModalBodyToTop();

    await apologeticsAppFetchAndBuildData(false, false);

    // Keep cache fresh without blocking app entry.
    apologeticsAppFetchAndBuildData(true, true).catch(() => {});
}

// Ensure the main router and preload pipeline can always resolve Apologetics hooks.
if (typeof window !== 'undefined') {
    window.openApologeticsApp = openApologeticsApp;
    window.apologeticsAppFetchAndBuildData = apologeticsAppFetchAndBuildData;
}