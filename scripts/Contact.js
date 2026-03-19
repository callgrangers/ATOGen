// ==========================================
// APP: CONTACT & PRAYER CARD
// ==========================================

let contactPrayerTimer = null;
let contactPrayerIndex = 0;

const contactPrayerRequests = [
    "Lord, protect the hidden networks of believers meeting in secret across the country.",
    "Father, give supernatural peace to those facing interrogation for their faith in Christ.",
    "God, blind the eyes of surveillance and monitoring systems tracking believers.",
    "Lord, sustain the couriers risking their lives to deliver Bibles across difficult terrain.",
    "Father, provide daily bread for believers cut off from employment and community support.",
    "Lord, strengthen the weary leaders shepherding scattered flocks in isolation.",
    "God, comfort those who have lost family, safety, or status because of their faith.",
    "Father, give courage to believers facing intense pressure from their own families.",
    "Lord, open the hearts of persecutors and reveal Jesus to them with saving power.",
    "God, provide safe communication, wise discernment, and secure fellowship for Your people."
];

const contactMissionListFallback = [
    { name: 'Afghanistan', icon: '🇦🇫' },
    { name: 'Belarus', icon: '🇧🇾' },
    { name: 'Cambodia', icon: '🇰🇭' },
    { name: 'China', icon: '🇨🇳' },
    { name: 'France', icon: '🇫🇷' },
    { name: 'Germany', icon: '🇩🇪' },
    { name: 'Guatemala', icon: '🇬🇹' },
    { name: 'India', icon: '🇮🇳' },
    { name: 'Colombia', icon: '🇨🇴' },
    { name: 'Nigeria', icon: '🇳🇬' },
    { name: 'North Korea', icon: '🇰🇵', tabName: 'NKorea' },
    { name: 'Iran', icon: '🇮🇷' }
];

// --- INTERNAL HELPERS (Restored to prevent Sync Errors) ---
function internalDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

function internalBuildSmsLink(phone, body = '') {
    const cleanPhone = String(phone || '').replace(/\D/g, '');
    const separator = (navigator.userAgent.match(/iPhone|iPad|iPod/i)) ? '&' : '?';
    return `sms:+${cleanPhone}${body ? separator + 'body=' + encodeURIComponent(body) : ''}`;
}

function internalNormalizeWords(words) {
    const source = Array.isArray(words) ? words : [];
    return source.map(w => ({
        language: w.language || w.lang || '',
        strongs: w.strongs || w.number || '',
        english: w.english || w.word || '',
        original: w.original || w.greek || w.hebrew || '',
        transliteration: w.transliteration || w.trans || '',
        definition: w.definition || w.meaning || ''
    })).filter(w => w.english && w.definition);
}

function resolveContactDayIndex(date = new Date()) {
    if (typeof dayOfYear === 'function') return dayOfYear(date);
    return internalDayOfYear(date);
}

function resolveContactSmsLink(phone, body = '') {
    if (typeof buildSmsLink === 'function') return buildSmsLink(phone, body);
    return internalBuildSmsLink(phone, body);
}

function resolveContactWords(wordsRaw) {
    if (typeof normalizeContactWords === 'function') return normalizeContactWords(wordsRaw);
    return internalNormalizeWords(wordsRaw);
}

function resolveContactPayloadRows(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.rows)) return payload.rows;
    if (Array.isArray(payload?.result)) return payload.result;
    return [];
}

function getContactMissionList() {
    if (typeof missionList !== 'undefined' && Array.isArray(missionList) && missionList.length) {
        return missionList;
    }
    return contactMissionListFallback;
}

function resolveContactDayWithinWindow(day, planLength, referenceDate = new Date()) {
    if (typeof clampDayToWindow === 'function') {
        return clampDayToWindow(day, planLength, referenceDate);
    }
    return Math.max(1, Math.min(Math.max(1, Number(planLength) || 1), Number(day) || 1));
}

function contactDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
}

function ensureContactStateDefaults() {
    if (!contactCardState || typeof contactCardState !== 'object') return;
    if (!Array.isArray(contactCardState.plan)) contactCardState.plan = [];
    if (!Array.isArray(contactCardState.devos)) contactCardState.devos = [];
    if (!Array.isArray(contactCardState.words)) contactCardState.words = [];
    if (!Number.isFinite(contactCardState.currentDay)) contactCardState.currentDay = 1;
    if (!Number.isFinite(contactCardState.lastLoadedAt)) contactCardState.lastLoadedAt = 0;
    if (!Number.isFinite(contactCardState.cacheTtlMs)) contactCardState.cacheTtlMs = 3 * 60 * 1000;
    if (!('inFlightLoadPromise' in contactCardState)) contactCardState.inFlightLoadPromise = null;
}

async function contactFetchTabData(tabName, attempts = 3) {
    let lastError = null;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
        try {
            const response = await fetch(`${MASTER_API_URL}?tab=${encodeURIComponent(tabName)}&_=${Date.now()}`, {
                cache: 'no-store',
                signal: AbortSignal.timeout(9000)
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const payload = await response.json();
            return resolveContactPayloadRows(payload);
        } catch (error) {
            lastError = error;
            if (attempt < attempts - 1) {
                await contactDelay(450 * (attempt + 1));
            }
        }
    }

    throw (lastError || new Error(`Failed to load ${tabName}`));
}

async function loadContactCardData(forceReload = false) {
    ensureContactStateDefaults();

    const hasWarmCache = contactCardState.plan.length > 0
        && contactCardState.devos.length > 0
        && contactCardState.words.length > 0
        && (Date.now() - contactCardState.lastLoadedAt) < contactCardState.cacheTtlMs;

    if (!forceReload && hasWarmCache) {
        return {
            plan: contactCardState.plan,
            devos: contactCardState.devos,
            words: contactCardState.words,
            fromCache: true
        };
    }

    // Seed from Bread's preloaded globals if available, avoiding redundant fetches
    if (!forceReload
        && typeof cachedPlan !== 'undefined' && Array.isArray(cachedPlan) && cachedPlan.length > 0
        && typeof cachedDevos !== 'undefined' && Array.isArray(cachedDevos) && cachedDevos.length > 0
    ) {
        // Convert Bread's flat plan format into Contact's readings format
        const plan = cachedPlan.map(p => ({
            day: p.day,
            date: p.date,
            readings: [
                { label: 'OT', text: p.ot || '', cls: 'ot' },
                { label: 'NT', text: p.nt || '', cls: 'nt' },
                { label: 'PS', text: p.ps || '', cls: 'ps' },
                { label: 'PR', text: p.pr || '', cls: 'pr' }
            ].filter(r => r.text)
        }));
        const devos = cachedDevos.map(d => ({
            date: d.date || '',
            title: d.title || 'Daily Devotional',
            theme: d.theme || '',
            scripture: d.scripture || '',
            reflection: d.reflection || '',
            question: d.question || '',
            prayer: d.prayer || ''
        }));
        const words = (typeof cachedWords !== 'undefined' && Array.isArray(cachedWords)) ? cachedWords : [];

        contactCardState.plan = plan;
        contactCardState.devos = devos;
        contactCardState.words = words;
        contactCardState.lastLoadedAt = Date.now();

        return { plan, devos, words, fromCache: true };
    }

    if (contactCardState.inFlightLoadPromise) {
        return contactCardState.inFlightLoadPromise;
    }

    contactCardState.inFlightLoadPromise = (async () => {
        const [devosRows, planRows, wordsRows] = await Promise.all([
            contactFetchTabData('Devotionals', 3),
            contactFetchTabData('Reading', 3),
            contactFetchTabData('Words', 3)
        ]);

        const plan = buildContactPlan(planRows);
        const devos = normalizeContactDevos(devosRows);
        const words = resolveContactWords(wordsRows);

        if (!plan.length) {
            throw new Error('Contact sync returned no reading rows.');
        }

        contactCardState.plan = plan;
        contactCardState.devos = devos;
        contactCardState.words = words;
        contactCardState.lastLoadedAt = Date.now();

        return { plan, devos, words, fromCache: false };
    })();

    try {
        return await contactCardState.inFlightLoadPromise;
    } finally {
        contactCardState.inFlightLoadPromise = null;
    }
}

// --- APP LOGIC ---

function stopContactPrayerTicker() {
    if (contactPrayerTimer) {
        clearInterval(contactPrayerTimer);
        contactPrayerTimer = null;
    }
}

function startContactPrayerTicker() {
    stopContactPrayerTicker();
    const prayerEl = document.getElementById('contact-prayer-text');
    if (!prayerEl || !contactPrayerRequests.length) return;
    contactPrayerIndex = 0;
    prayerEl.textContent = `"${contactPrayerRequests[contactPrayerIndex]}"`;
    contactPrayerTimer = setInterval(() => {
        prayerEl.classList.add('is-fade-out');
        setTimeout(() => {
            contactPrayerIndex = (contactPrayerIndex + 1) % contactPrayerRequests.length;
            prayerEl.textContent = `"${contactPrayerRequests[contactPrayerIndex]}"`;
            prayerEl.classList.remove('is-fade-out');
        }, 550);
    }, 30000);
}

function buildContactPlan(planData) {
    const source = resolveContactPayloadRows(planData);
    let mIdx = 0;
    let dIM = 1;
    const plan = [];
    const internalMonths = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const internalDaysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    for (let i = 0; i < source.length; i++) {
        if (mIdx > 11) break;
        const row = source[i] || {};
        const cleanDate = `${internalMonths[mIdx]} ${dIM}`;
        plan.push({
            day: i + 1,
            date: cleanDate,
            readings: [
                { label: 'OT', text: row.ot || row.old_testament || row['old testament'] || '', cls: 'ot' },
                { label: 'NT', text: row.nt || row.new_testament || row['new testament'] || '', cls: 'nt' },
                { label: 'PS', text: row.ps || row.psalms || row.psalm || '', cls: 'ps' },
                { label: 'PR', text: row.pr || row.proverbs || row.proverb || '', cls: 'pr' }
            ]
        });
        dIM++;
        if (dIM > internalDaysInMonth[mIdx]) {
            dIM = 1;
            mIdx++;
        }
    }
    return plan;
}

function normalizeContactDevos(devos) {
    const source = Array.isArray(devos) ? devos : [];
    return source.map(d => ({
        date: d.date || d.day || '',
        title: d.title || d.devo_title || d.devotional_title || 'Daily Encouragement',
        theme: d.theme || d.focus || 'Daily Encouragement',
        scripture: d.scripture || d.verse || '',
        reflection: d.reflection || d.body || '',
        question: d.question || d.reflection_question || '',
        prayer: d.prayer || d.closing_prayer || ''
    })).filter(d => d.title && String(d.title).trim() !== '');
}

function pickContactWordOfDay(words, language, dayIndex) {
    const lang = String(language || '').toLowerCase();
    const options = words.filter(item => String(item.language || '').toLowerCase().includes(lang));
    if (!options.length) return null;

    const sorted = [...options].sort((a, b) => {
        const aa = `${a.strongs}|${a.english}`.toLowerCase();
        const bb = `${b.strongs}|${b.english}`.toLowerCase();
        return aa.localeCompare(bb);
    });

    const idx = Math.max(0, (dayIndex - 1) % sorted.length);
    return sorted[idx];
}

function getWordOfDayCardsHtml(words, dayIndex) {
    const source = Array.isArray(words) ? words : [];
    const greek = pickContactWordOfDay(source, 'greek', dayIndex);
    const hebrew = pickContactWordOfDay(source, 'hebrew', dayIndex);

    const card = (title, word, accent, key) => {
        const cardId = `word-card-${key}-${dayIndex}`;
        const btnId = `word-toggle-${key}-${dayIndex}`;
        if (!word) {
            return `<div id="${cardId}" class="contact-reading-card word-accordion-card" style="cursor:default; border:1px solid rgba(255,255,255,0.16); background:linear-gradient(145deg, rgba(15,23,42,0.86), rgba(30,41,59,0.75));"><span class="contact-reading-label" style="color:${accent}; font-size:0.76rem;">${title}</span><span class="contact-reading-value" style="font-size:1rem;">Unavailable</span></div>`;
        }

        return `<div id="${cardId}" class="contact-reading-card word-accordion-card" style="cursor:default; border:1px solid rgba(255,255,255,0.16); background:linear-gradient(145deg, rgba(15,23,42,0.86), rgba(30,41,59,0.75));"><span class="contact-reading-label" style="color:${accent}; font-size:0.76rem; letter-spacing:1.8px;">${title}</span><span class="contact-reading-value" style="font-weight:800; color:#fff; text-transform:uppercase; font-size:1.12rem; margin-top:2px;">${escapeHtml(word.english)}</span><div style="margin-top:6px; color:#dbe4f3; font-family:'Merriweather', serif; font-size:1.2rem; font-style:italic;">${escapeHtml(word.original || '-')}</div><div style="margin-top:7px; color:#94a3b8; font-size:0.76rem; font-family:'JetBrains Mono'; letter-spacing:0.4px;">${escapeHtml(word.strongs || 'N/A')} | ${escapeHtml(word.transliteration || '-')}</div><div class="word-definition">${escapeHtml(word.definition)}</div><button type="button" id="${btnId}" class="word-read-toggle" onclick="toggleWordAccordion('${cardId}', '${btnId}')">Read More...</button></div>`;
    };

    return `${card('Greek Word of the Day', greek, '#60a5fa', 'greek')}${card('Hebrew Word of the Day', hebrew, '#f6d87a', 'hebrew')}`;
}

window.toggleWordAccordion = function(cardId, btnId) {
    const card = document.getElementById(cardId);
    const btn = document.getElementById(btnId);
    if (!card || !btn) return;
    const expanded = card.classList.toggle('expanded');
    btn.textContent = expanded ? 'Show Less' : 'Read More...';
}

function renderContactSnapshotForDay(dayIndex) {
    const plan = Array.isArray(contactCardState.plan) ? contactCardState.plan : [];
    const devos = Array.isArray(contactCardState.devos) ? contactCardState.devos : [];
    const words = Array.isArray(contactCardState.words) ? contactCardState.words : [];
    const container = document.getElementById('contact-bread-content');
    if (!container) return;

    if (!plan.length) {
        container.innerHTML = `<div class="loader" style="animation:none; color:var(--accent-magenta);">NO READING DATA FOUND.</div>`;
        return;
    }

    const selectedDay = Math.max(1, Math.min(plan.length, Number(dayIndex) || 1));
    contactCardState.currentDay = selectedDay;
    const d = plan[selectedDay - 1];
    if (!d) return;

    let currentDevo = null;
    const year = new Date().getFullYear();
    const currentPlanDateString = new Date(year, 0, selectedDay).toDateString();
    for (const devo of devos) {
        if (devo.date && new Date(devo.date).toDateString() === currentPlanDateString) {
            currentDevo = devo;
            break;
        }
    }

    const activeMissionList = getContactMissionList();
    const countryIndex = (selectedDay - 1) % activeMissionList.length;
    const focusCountry = activeMissionList[countryIndex] || { name: 'Global Church', icon: '🌍' };
    const readingLabelMap = { ot: 'Old Testament', nt: 'New Testament', ps: 'Psalms', pr: 'Proverbs' };

    let html = `
        <div class="bread-status-strip">
            <div class="bread-selector-wrap">
                <div class="day-controls">
                    <button class="day-btn" onclick="changeContactDay(-1)"><i data-lucide="chevron-left"></i></button>
                    <div class="bread-center-stack">
                        <div class="bread-exhort-wrap">
                            <div class="bread-exhort-badge">Day ${d.day} • ${d.date}</div>
                        </div>
                        <button class="day-today-btn" onclick="setContactToday()">Today</button>
                    </div>
                    <button class="day-btn" onclick="changeContactDay(1)"><i data-lucide="chevron-right"></i></button>
                </div>
            </div>
        </div>

        <div class="focus-country-card">
            <div class="focus-header-row">
                <div class="focus-flag-shell"><div class="focus-icon">${focusCountry.icon}</div></div>
                <div class="focus-meta">
                    <div class="focus-label">Daily Focus Country</div>
                    <div class="focus-title">${focusCountry.name}</div>
                    <button class="focus-btn" onclick="if(typeof openFocusCountry === 'function') { openFocusCountry(${countryIndex}, true); } else { alert('Missions Directory not loaded.'); }">Load Dossier</button>
                </div>
            </div>
        </div>

        <div style="display:flex; gap:10px; margin:0 0 18px; flex-wrap:wrap;">
            <button class="focus-btn" style="width:auto; min-width:180px;" onclick="openContactBreadDay()">Open Full Bread</button>
            <a href="/request" onclick="return navigateAppAnchor(event, '/request')" class="focus-btn" style="width:auto; min-width:180px; text-decoration:none; display:inline-flex; align-items:center; justify-content:center;">Completed Today</a>
        </div>

        <div class="scripture-grid">
            ${d.readings.map(r => {
                const text = String(r.text || '').trim() || 'Unavailable';
                if (text === 'Unavailable') return '';
                const safeLink = getBibleLink(text);
                const label = readingLabelMap[r.cls] || r.label;
                return `<a href="${safeLink}" target="_blank" class="scripture-card"><span class="scripture-label">${label}</span><span class="scripture-text">${escapeHtml(text)}</span></a>`;
            }).join('')}
        </div>
    `;

    if (currentDevo) {
        html += `
            <div class="devo-container">
                <h2 style="font-size:2.1rem; font-weight:900; color:var(--accent-gold); margin-top:0; margin-bottom:15px; line-height:1.2;">${currentDevo.title}</h2>
                ${currentDevo.theme ? `<div class="devo-theme-badge">FOCUS: ${currentDevo.theme}</div>` : ''}
                ${currentDevo.scripture ? `<div class="devo-scripture-quote">${currentDevo.scripture}</div>` : ''}
                ${currentDevo.reflection ? `<div class="devo-application-box"><div class="devo-card-label">Practical Explanation</div><p class="devo-card-copy">${currentDevo.reflection}</p></div>` : ''}
                ${currentDevo.question ? `<div class="devo-question-box"><div class="devo-card-label">Reflection Protocol</div><p class="devo-card-copy">${currentDevo.question}</p></div>` : ''}
                <div class="contact-reading-grid" style="margin-top:16px; margin-bottom:6px;">${getWordOfDayCardsHtml(words, selectedDay)}</div>
                ${currentDevo.prayer ? `<div style="text-align:center; padding-top:22px; border-top:1px solid rgba(255,255,255,0.1);"><div style="font-family:'JetBrains Mono'; font-weight:800; font-size:0.8rem; color:var(--text-muted); margin-bottom:12px; text-transform:uppercase;">Closing Prayer</div><div style="font-size:1.02rem; font-style:italic; color:white; line-height:1.6;">"${escapeHtml(currentDevo.prayer)}"</div></div>` : ''}
            </div>
        `;
    } else {
        html += `<div class="devo-container"><div class="loader" style="animation:none; color:var(--accent-magenta); padding:30px;">NO DEVOTIONAL ENTRY FOUND FOR THIS DATE.</div></div>`;
    }

    container.innerHTML = html;
    if (window.lucide && typeof lucide.createIcons === 'function') lucide.createIcons();
}

window.openContactBreadDay = function() {
    if (typeof openIntel !== 'function') return;
    if (typeof intelState !== 'undefined' && contactCardState.currentDay) {
        intelState.currentDay = contactCardState.currentDay;
    }
    if (typeof closeModal === 'function') closeModal();
    setTimeout(() => openIntel(), 80);
};

window.changeContactDay = function(delta) {
    if (!contactCardState.plan.length) return;
    const nextDay = Math.max(1, Math.min(contactCardState.plan.length, contactCardState.currentDay + delta));
    renderContactSnapshotForDay(nextDay);
}

window.setContactToday = function() {
    if (!contactCardState.plan.length) return;
    const todayDay = resolveContactDayWithinWindow(resolveContactDayIndex(new Date()), contactCardState.plan.length, new Date());
    renderContactSnapshotForDay(todayDay);
}

function openContactLearnMore(event) {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();

    const target = String(APP_CONFIG.learnMoreLink || '').trim();
    if (!target) return false;

    const lower = target.toLowerCase();
    if (lower === 'afghanistan' || lower === 'app:afghanistan') {
        const afghanistan = missionList.find(c => String(c.name).toLowerCase() === 'afghanistan');
        if (afghanistan) {
            openMission(afghanistan);
            return false;
        }
    }

    window.open(target, '_blank', 'noopener');
    return false;
}

async function openContactCard() {
    document.getElementById('modal-back-text').innerText = 'CLEAR';
    document.getElementById('modal-back-btn').onclick = () => closeModal();
    document.getElementById('modal-title').innerHTML = `<span style="filter:none !important; text-shadow:none !important; margin-right:8px;">📇</span>CONTACT`;
    document.getElementById('modal-subtitle').innerText = 'CONTACT CARD + DAILY BREAD SNAPSHOT';

    const container = document.getElementById('modal-body-container');
    container.innerHTML = `
        <div class="contact-shell fade-in">
            <section class="contact-hero">
                <div class="contact-eyebrow">HOW CAN WE PRAY FOR YOU TODAY?</div>
                <h2>Our Mission</h2>
                <p>Welcome to A Touch of the Gospel. This page keeps communication and daily discipleship in one place for practical gospel care.</p>
            </section>

            <section class="contact-grid">
                <div class="contact-panel">
                    <div class="contact-card-head">
                        <div class="contact-chip-row">
                            <div class="contact-chip gold">Contact Card</div>
                            <div class="contact-chip red">CARD_77(h) // V5.0</div>
                        </div>
                        <div class="contact-identity">
                            <div class="contact-seal">🇦🇫</div>
                            <div>
                                <h3 class="contact-name">${escapeHtml(APP_CONFIG.contactName)}</h3>
                                <div class="contact-role">${escapeHtml(APP_CONFIG.contactRole)}</div>
                            </div>
                        </div>
                    </div>

                    <div class="contact-card-body">
                        <p class="contact-lede">Devoted to gospel advancement and spiritual care through digital and community engagement. This page is built to make reaching out simple, clear, and meaningful.</p>
                        <div class="contact-action-grid">
                            <a id="contact-btn-call" class="contact-action" href="#">
                                <span class="icon">📞</span>
                                <span><span class="label">Phone</span></span>
                            </a>
                            <a id="contact-btn-sms" class="contact-action" href="#">
                                <span class="icon">💬</span>
                                <span><span class="label">Text</span></span>
                            </a>
                            <a id="contact-btn-email" class="contact-action" href="#">
                                <span class="icon">✉️</span>
                                <span><span class="label">Mail</span></span>
                            </a>
                            <a id="contact-btn-schedule" target="_blank" rel="noopener" class="contact-action" href="#">
                                <span class="icon">📅</span>
                                <span><span class="label">Book</span></span>
                            </a>
                            <a id="contact-btn-learn" class="contact-action" href="#" onclick="return openContactLearnMore(event)">
                                <span class="icon">🌍</span>
                                <span><span class="label">Learn</span></span>
                            </a>
                        </div>

                        <a id="contact-prayer-link" href="#" class="contact-prayer-btn">🙏 Request Prayer</a>
                        <div class="contact-mini-footer">SOLI DEO GLORIA | BUILT TO BE SHARED</div>
                    </div>
                </div>

                <div class="contact-stack">
                    <div id="contact-bread-content" class="contact-sub-panel">
                        <div class="loader"> </div>
                    </div>
                </div>
            </section>
        </div>
    `;

    document.getElementById('data-modal').classList.add('active');
    bounceModalBodyToTop();

    document.getElementById('contact-btn-call').href = `tel:${APP_CONFIG.contactPhone}`;
    document.getElementById('contact-btn-sms').href = resolveContactSmsLink(APP_CONFIG.smsNumber);
    document.getElementById('contact-btn-email').href = `mailto:${APP_CONFIG.contactEmail}`;
    document.getElementById('contact-btn-schedule').href = APP_CONFIG.scheduleLink || '#';
    document.getElementById('contact-btn-learn').href = APP_CONFIG.learnMoreLink || '#';
    document.getElementById('contact-prayer-link').href = '/request';
    document.getElementById('contact-prayer-link').onclick = (event) => navigateAppAnchor(event, '/request');

    startContactPrayerTicker();

    try {
        ensureContactStateDefaults();

        const hasWarmCache = contactCardState.plan.length > 0
            && contactCardState.devos.length > 0
            && contactCardState.words.length > 0
            && (Date.now() - contactCardState.lastLoadedAt) < contactCardState.cacheTtlMs;

        if (hasWarmCache) {
            const cachedDay = resolveContactDayWithinWindow(contactCardState.currentDay, contactCardState.plan.length || 1, new Date());
            renderContactSnapshotForDay(cachedDay);
        }

        const { plan } = await loadContactCardData(false);
        const current = resolveContactDayWithinWindow(resolveContactDayIndex(new Date()), plan.length || 1, new Date());
        contactCardState.currentDay = current;
        renderContactSnapshotForDay(current);
    } catch (e) {
        console.error("Bread Sync Error:", e);
        const breadContainer = document.getElementById('contact-bread-content');
        if (breadContainer && !contactCardState.plan.length) {
            breadContainer.innerHTML = `<div class="loader" style="animation:none; color:var(--accent-magenta);">STARLINK SYNC ERROR:<br><span style="font-size:0.9rem;">Unable to retrieve latest data stream. Check console for details.</span></div>`;
        }
    }
}

// Global Bridge
window.openContactCard = openContactCard;
window.loadContactCardData = loadContactCardData;

// ==========================================
// APP: USER CONTACT CARD + MEMBER DIRECTORY
// ==========================================

function getUserContactAuthPayload() {
    const keys = [
        { storage: localStorage, key: typeof SECURE_SESSION_KEY !== 'undefined' ? SECURE_SESSION_KEY : 'atogen_secure_vault_v1' },
        { storage: localStorage,  key: typeof AUTH_SESSION_KEY !== 'undefined' ? AUTH_SESSION_KEY : 'aos_auth_session_v1' }
    ];

    for (const { storage, key } of keys) {
        try {
            const raw = storage.getItem(key);
            if (!raw) continue;
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') continue;
            const token = String(parsed.token || parsed.accessToken || '').trim();
            const email = String(parsed.email || '').trim().toLowerCase();
            const role = String(parsed.role || '').trim().toLowerCase();
            if (token && email) return { token, email, role };
        } catch { /* skip */ }
    }
    return null;
}

async function fetchUserOwnProfile(auth) {
    const endpoint = typeof PASTORAL_DB_V2_ENDPOINT !== 'undefined' ? PASTORAL_DB_V2_ENDPOINT : '';
    if (!endpoint) throw new Error('No pastoral endpoint configured.');

    const params = new URLSearchParams({
        action: 'members.search',
        token: auth.token,
        authEmail: auth.email,
        q: auth.email
    });

    const response = await fetch(`${endpoint}?${params.toString()}`, { cache: 'no-store', signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data || !data.ok) throw new Error(data?.message || 'Profile lookup failed');

    const rows = Array.isArray(data.rows) ? data.rows : [];
    // Find exact email match
    const match = rows.find(r => {
        const e = String(r.primaryEmail || r.email || '').trim().toLowerCase();
        return e === auth.email;
    });
    return match || null;
}

async function fetchMemberDirectory(auth) {
    const endpoint = typeof PASTORAL_DB_V2_ENDPOINT !== 'undefined' ? PASTORAL_DB_V2_ENDPOINT : '';
    if (!endpoint) throw new Error('No pastoral endpoint configured.');

    const params = new URLSearchParams({
        action: 'members.list',
        token: auth.token,
        authEmail: auth.email,
        includeArchived: 'false'
    });

    const response = await fetch(`${endpoint}?${params.toString()}`, { cache: 'no-store', signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data || !data.ok) throw new Error(data?.message || 'Failed to load directory');

    return Array.isArray(data.rows) ? data.rows : [];
}

function buildUserContactProfileHtml(profile) {
    const firstName = String(profile.firstName || '').trim();
    const lastName = String(profile.lastName || '').trim();
    const preferred = String(profile.preferredName || '').trim();
    const fullName = firstName && lastName ? `${firstName} ${lastName}` : (firstName || lastName || 'Member');
    const phone = String(profile.cellPhone || profile.phone || '').trim();
    const email = String(profile.primaryEmail || profile.email || '').trim();
    const photoUrl = String(profile.photoUrl || '').trim();
    const websiteLink = String(profile.websiteLink || '').trim();
    const ministry = String(profile.ministryTeams || '').trim();
    const role = String(profile.membershipStatus || '').trim();
    const smallGroup = String(profile.smallGroup || '').trim();

    const cleanPhone = phone.replace(/\D/g, '');
    const smsHref = cleanPhone ? resolveContactSmsLink(cleanPhone) : '';
    const telHref = cleanPhone ? `tel:+${cleanPhone}` : '';
    const mailHref = email ? `mailto:${escapeHtml(email)}` : '';

    const avatarHtml = photoUrl
        ? `<img src="${escapeHtml(photoUrl)}" alt="${escapeHtml(fullName)}" style="width:80px; height:80px; border-radius:50%; object-fit:cover; border:3px solid rgba(255,255,255,0.2);">`
        : `<div style="width:80px; height:80px; border-radius:50%; background:linear-gradient(135deg, #334155, #1e293b); border:3px solid rgba(255,255,255,0.15); display:flex; align-items:center; justify-content:center; font-size:2.2rem;">✝️</div>`;

    const roleLabel = ministry || (role === 'Active' ? 'Member' : role || 'Member');

    const infoRows = [];
    if (phone) infoRows.push(`<div class="uc-info-row"><span class="uc-info-label">PHONE</span><span class="uc-info-value">${escapeHtml(phone)}</span></div>`);
    if (email) infoRows.push(`<div class="uc-info-row"><span class="uc-info-label">EMAIL</span><span class="uc-info-value">${escapeHtml(email)}</span></div>`);
    if (smallGroup) infoRows.push(`<div class="uc-info-row"><span class="uc-info-label">SMALL GROUP</span><span class="uc-info-value">${escapeHtml(smallGroup)}</span></div>`);
    if (ministry) infoRows.push(`<div class="uc-info-row"><span class="uc-info-label">MINISTRY</span><span class="uc-info-value">${escapeHtml(ministry)}</span></div>`);

    return `
        <div class="contact-panel">
            <div class="contact-card-head">
                <div class="contact-chip-row">
                    <div class="contact-chip gold">My Contact Card</div>
                    <div class="contact-chip red">${escapeHtml(role || 'MEMBER')}</div>
                </div>
                <div class="contact-identity">
                    <div class="contact-seal" style="font-size:unset;">${avatarHtml}</div>
                    <div>
                        <h3 class="contact-name">${escapeHtml(fullName)}</h3>
                        ${preferred && preferred !== fullName ? `<div style="font-size:0.85rem; color:var(--accent-gold, #f6d87a); font-style:italic; margin-top:2px;">"${escapeHtml(preferred)}"</div>` : ''}
                        <div class="contact-role">${escapeHtml(roleLabel)}</div>
                    </div>
                </div>
            </div>

            <div class="contact-card-body">
                ${infoRows.length ? `<div class="uc-info-block">${infoRows.join('')}</div>` : ''}

                <div class="contact-action-grid">
                    ${telHref ? `<a class="contact-action" href="${telHref}"><span class="icon">📞</span><span><span class="label">Phone</span></span></a>` : ''}
                    ${smsHref ? `<a class="contact-action" href="${smsHref}"><span class="icon">💬</span><span><span class="label">Text</span></span></a>` : ''}
                    ${mailHref ? `<a class="contact-action" href="${mailHref}"><span class="icon">✉️</span><span><span class="label">Mail</span></span></a>` : ''}
                    ${websiteLink ? `<a class="contact-action" href="${escapeHtml(websiteLink)}" target="_blank" rel="noopener"><span class="icon">📅</span><span><span class="label">Scheduler</span></span></a>` : ''}
                </div>

                <div class="contact-mini-footer" style="margin-top:18px;">
                    <a href="/settings" onclick="return navigateAppAnchor(event, '/settings')" style="color:var(--accent-cyan, #38bdf8); text-decoration:none; font-family:'JetBrains Mono'; font-size:0.78rem; letter-spacing:1px;">⚙️ EDIT IN SETTINGS</a>
                </div>
            </div>
        </div>
    `;
}

function buildDirectoryCardHtml(member) {
    const firstName = escapeHtml(String(member.firstName || '').trim());
    const lastName = escapeHtml(String(member.lastName || '').trim());
    const preferred = String(member.preferredName || '').trim();
    const fullName = firstName && lastName ? `${firstName} ${lastName}` : (firstName || lastName || 'Unknown');
    const phone = String(member.cellPhone || member.phone || '').trim();
    const email = String(member.primaryEmail || member.email || '').trim();
    const ministry = escapeHtml(String(member.ministryTeams || '').trim());
    const status = String(member.membershipStatus || '').trim();
    const photoUrl = String(member.photoUrl || '').trim();
    const websiteLink = String(member.websiteLink || '').trim();

    const cleanPhone = phone.replace(/\D/g, '');
    const smsLink = cleanPhone ? resolveContactSmsLink(cleanPhone) : '';
    const telLink = cleanPhone ? `tel:+${cleanPhone}` : '';
    const mailLink = email ? `mailto:${escapeHtml(email)}` : '';

    const avatarHtml = photoUrl
        ? `<img src="${escapeHtml(photoUrl)}" alt="${fullName}" style="width:44px; height:44px; border-radius:50%; object-fit:cover; border:2px solid rgba(255,255,255,0.2);">`
        : `<div style="width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg, #334155, #1e293b); border:2px solid rgba(255,255,255,0.15); display:flex; align-items:center; justify-content:center; font-size:1.3rem;">✝️</div>`;

    const roleLabel = ministry || (status === 'Active' ? 'Member' : status || 'Member');

    return `
        <div class="uc-dir-card">
            <div class="uc-dir-header">
                <div class="uc-dir-avatar">${avatarHtml}</div>
                <div class="uc-dir-identity">
                    <div class="uc-dir-name">${fullName}</div>
                    ${preferred && preferred !== fullName ? `<div class="uc-dir-preferred">"${escapeHtml(preferred)}"</div>` : ''}
                    <div class="uc-dir-role">${roleLabel}</div>
                </div>
            </div>
            <div class="uc-dir-actions">
                ${telLink ? `<a class="uc-dir-btn" href="${telLink}">📞</a>` : ''}
                ${smsLink ? `<a class="uc-dir-btn" href="${smsLink}">💬</a>` : ''}
                ${mailLink ? `<a class="uc-dir-btn" href="${mailLink}">✉️</a>` : ''}
                ${websiteLink ? `<a class="uc-dir-btn" href="${escapeHtml(websiteLink)}" target="_blank" rel="noopener">📅</a>` : ''}
            </div>
        </div>
    `;
}

function renderMemberDirectoryList(members, filter) {
    const container = document.getElementById('uc-directory-list');
    if (!container) return;

    const term = (filter || '').toLowerCase().trim();
    const visible = members.filter(m => {
        const status = String(m.membershipStatus || '').toLowerCase();
        if (status === 'inactive' || status === 'member in glory') return false;
        if (!term) return true;
        const haystack = [m.firstName, m.lastName, m.preferredName, m.ministryTeams, m.primaryEmail, m.email].map(v => String(v || '').toLowerCase()).join(' ');
        return haystack.includes(term);
    });

    if (!visible.length) {
        container.innerHTML = `<div style="text-align:center; color:var(--text-muted, #94a3b8); padding:30px 20px; font-family:'JetBrains Mono'; font-size:0.85rem;">${term ? 'NO MATCHES FOUND' : 'NO CONTACTS AVAILABLE'}</div>`;
        return;
    }

    visible.sort((a, b) => {
        const aName = `${a.firstName || ''} ${a.lastName || ''}`.trim().toLowerCase();
        const bName = `${b.firstName || ''} ${b.lastName || ''}`.trim().toLowerCase();
        return aName.localeCompare(bName);
    });

    container.innerHTML = visible.map(m => buildDirectoryCardHtml(m)).join('');

    const countEl = document.getElementById('uc-dir-count');
    if (countEl) {
        const total = members.filter(m => {
            const s = String(m.membershipStatus || '').toLowerCase();
            return s !== 'inactive' && s !== 'member in glory';
        }).length;
        countEl.textContent = term ? `${visible.length} OF ${total} MEMBER${total !== 1 ? 'S' : ''}` : `${total} MEMBER${total !== 1 ? 'S' : ''}`;
    }
}

let _ucDirectoryRows = [];

async function showMemberDirectory() {
    const dirSection = document.getElementById('uc-directory-section');
    if (!dirSection) return;

    const auth = getUserContactAuthPayload();
    if (!auth) {
        dirSection.innerHTML = `<div style="text-align:center; padding:30px; color:var(--accent-magenta, #f472b6); font-family:'JetBrains Mono'; font-size:0.85rem;">SESSION EXPIRED — PLEASE LOG IN AGAIN</div>`;
        return;
    }

    dirSection.innerHTML = `
        <div style="padding:6px 0 10px;">
            <input type="text" class="uc-dir-search" id="uc-dir-search-input" placeholder="Search members..." autocomplete="off">
        </div>
        <div class="uc-dir-count" id="uc-dir-count"></div>
        <div id="uc-directory-list"><div class="loader"> </div></div>
    `;

    try {
        const rows = await fetchMemberDirectory(auth);
        _ucDirectoryRows = rows;

        // Verify the current user has a member profile
        const userEmail = auth.email;
        const hasProfile = rows.some(r => String(r.primaryEmail || r.email || '').trim().toLowerCase() === userEmail);
        if (!hasProfile) {
            document.getElementById('uc-directory-list').innerHTML = `<div style="text-align:center; padding:30px 20px; color:var(--accent-magenta, #f472b6); font-family:'JetBrains Mono'; font-size:0.85rem;">NO MEMBER PROFILE FOUND<br><span style="font-size:0.78rem; color:var(--text-muted, #94a3b8);">Only users with a member profile can access the directory.</span></div>`;
            return;
        }

        renderMemberDirectoryList(rows, '');

        const searchInput = document.getElementById('uc-dir-search-input');
        let searchTimer = null;
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimer);
                searchTimer = setTimeout(() => renderMemberDirectoryList(_ucDirectoryRows, searchInput.value), 200);
            });
        }
    } catch (e) {
        document.getElementById('uc-directory-list').innerHTML = `<div style="text-align:center; padding:30px; color:var(--accent-magenta, #f472b6); font-family:'JetBrains Mono'; font-size:0.85rem;">SYNC ERROR: ${escapeHtml(e.message)}</div>`;
    }
}

async function openUserContactApp() {
    document.getElementById('modal-back-text').innerText = 'CLEAR';
    document.getElementById('modal-back-btn').onclick = () => closeModal();
    document.getElementById('modal-title').innerHTML = `<span style="filter:none !important; text-shadow:none !important; margin-right:8px;">👥</span>USER CONTACT`;
    document.getElementById('modal-subtitle').innerText = 'YOUR CONTACT CARD';

    const container = document.getElementById('modal-body-container');
    container.innerHTML = `
        <div class="contact-shell fade-in">
            <style>
                .uc-info-block { margin-bottom: 18px; }
                .uc-info-row { display:flex; justify-content:space-between; align-items:center; padding:9px 0; border-bottom:1px solid rgba(255,255,255,0.06); }
                .uc-info-label { font-family:'JetBrains Mono'; font-size:0.7rem; font-weight:700; color:var(--text-muted, #94a3b8); letter-spacing:1.5px; text-transform:uppercase; }
                .uc-info-value { font-size:0.92rem; color:#e2e8f0; text-align:right; }
                .uc-dir-section-head { font-family:'JetBrains Mono'; font-size:0.82rem; font-weight:800; color:var(--accent-cyan, #38bdf8); letter-spacing:2px; text-transform:uppercase; margin:28px 0 12px; padding-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.08); }
                .uc-dir-search {
                    width:100%; padding:10px 14px; border-radius:10px;
                    border:1px solid rgba(255,255,255,0.15); background:rgba(15,23,42,0.85);
                    color:#e2e8f0; font-family:'JetBrains Mono',monospace; font-size:0.85rem;
                    outline:none; transition:border-color 0.2s;
                }
                .uc-dir-search:focus { border-color:var(--accent-cyan, #38bdf8); }
                .uc-dir-search::placeholder { color:rgba(255,255,255,0.35); }
                .uc-dir-count { text-align:center; font-family:'JetBrains Mono'; font-size:0.7rem; color:var(--text-muted, #94a3b8); padding:4px 0 8px; letter-spacing:1px; }
                .uc-dir-card {
                    display:flex; align-items:center; justify-content:space-between; gap:12px;
                    background:rgba(15,23,42,0.7); border:1px solid rgba(255,255,255,0.08);
                    border-radius:12px; padding:12px 14px; margin-bottom:8px;
                    transition:border-color 0.2s;
                }
                .uc-dir-card:hover { border-color:rgba(255,255,255,0.2); }
                .uc-dir-header { display:flex; align-items:center; gap:10px; min-width:0; flex:1; }
                .uc-dir-avatar { flex-shrink:0; }
                .uc-dir-identity { min-width:0; }
                .uc-dir-name { font-weight:700; font-size:0.95rem; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
                .uc-dir-preferred { font-size:0.75rem; color:var(--accent-gold, #f6d87a); font-style:italic; }
                .uc-dir-role { font-size:0.7rem; color:var(--text-muted, #94a3b8); font-family:'JetBrains Mono'; text-transform:uppercase; letter-spacing:0.8px; margin-top:1px; }
                .uc-dir-actions { display:flex; gap:6px; flex-shrink:0; }
                .uc-dir-btn {
                    display:flex; align-items:center; justify-content:center;
                    width:36px; height:36px; border-radius:10px;
                    background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1);
                    text-decoration:none; font-size:1rem; transition:background 0.2s, border-color 0.2s;
                    filter:none !important; text-shadow:none !important;
                }
                .uc-dir-btn:hover { background:rgba(255,255,255,0.12); border-color:rgba(255,255,255,0.25); }
            </style>

            <section class="contact-grid">
                <div id="uc-profile-card">
                    <div class="loader"> </div>
                </div>

                <div class="contact-stack">
                    <div id="contact-bread-content" class="contact-sub-panel">
                        <div class="loader"> </div>
                    </div>
                </div>
            </section>

            <div class="uc-dir-section-head">Member Directory</div>
            <div id="uc-directory-section">
                <div style="text-align:center; padding:20px;">
                    <button class="focus-btn" style="width:auto; min-width:200px;" onclick="showMemberDirectory()">🔐 Access Directory</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('data-modal').classList.add('active');
    bounceModalBodyToTop();

    // Load the user's own profile card
    const auth = getUserContactAuthPayload();
    const profileContainer = document.getElementById('uc-profile-card');

    if (!auth) {
        profileContainer.innerHTML = `
            <div class="contact-panel">
                <div class="contact-card-body" style="text-align:center; padding:40px 20px;">
                    <div style="font-family:'JetBrains Mono'; font-size:0.88rem; color:var(--accent-magenta, #f472b6); margin-bottom:16px;">SIGN IN TO VIEW YOUR CONTACT CARD</div>
                    <button class="focus-btn" style="width:auto; min-width:180px;" onclick="if(typeof closeModal==='function')closeModal();setTimeout(function(){if(typeof openHomeSecureLogin==='function')openHomeSecureLogin();},100);">Log In</button>
                </div>
            </div>`;
    } else {
        try {
            const profile = await fetchUserOwnProfile(auth);
            if (profile) {
                profileContainer.innerHTML = buildUserContactProfileHtml(profile);
            } else {
                profileContainer.innerHTML = `
                    <div class="contact-panel">
                        <div class="contact-card-body" style="text-align:center; padding:40px 20px;">
                            <div style="font-family:'JetBrains Mono'; font-size:0.85rem; color:var(--text-muted, #94a3b8);">NO MEMBER PROFILE FOUND</div>
                            <p style="font-size:0.82rem; color:var(--text-muted, #94a3b8); margin-top:10px;">Contact your administrator to set up your profile.</p>
                        </div>
                    </div>`;
            }
        } catch (e) {
            profileContainer.innerHTML = `
                <div class="contact-panel">
                    <div class="contact-card-body" style="text-align:center; padding:40px 20px;">
                        <div style="font-family:'JetBrains Mono'; font-size:0.85rem; color:var(--accent-magenta, #f472b6);">SYNC ERROR: ${escapeHtml(e.message)}</div>
                    </div>
                </div>`;
        }
    }

    // Load Daily Bread snapshot (same as developer contact card)
    startContactPrayerTicker();
    try {
        ensureContactStateDefaults();
        const hasWarmCache = contactCardState.plan.length > 0
            && contactCardState.devos.length > 0
            && contactCardState.words.length > 0
            && (Date.now() - contactCardState.lastLoadedAt) < contactCardState.cacheTtlMs;

        if (hasWarmCache) {
            const cachedDay = resolveContactDayWithinWindow(contactCardState.currentDay, contactCardState.plan.length || 1, new Date());
            renderContactSnapshotForDay(cachedDay);
        }

        const { plan } = await loadContactCardData(false);
        const current = resolveContactDayWithinWindow(resolveContactDayIndex(new Date()), plan.length || 1, new Date());
        contactCardState.currentDay = current;
        renderContactSnapshotForDay(current);
    } catch (e) {
        const breadContainer = document.getElementById('contact-bread-content');
        if (breadContainer && !contactCardState.plan.length) {
            breadContainer.innerHTML = `<div class="loader" style="animation:none; color:var(--accent-magenta);">STARLINK SYNC ERROR:<br><span style="font-size:0.9rem;">Unable to retrieve latest data stream.</span></div>`;
        }
    }
}

window.openUserContactApp = openUserContactApp;
window.showMemberDirectory = showMemberDirectory;

if (typeof installAppAnchorSync === 'function') {
    installAppAnchorSync();
}