// ==========================================
// CORE SYSTEM: ROUTING, GLOBAL UTILS & PUBLIC BOOT
// ==========================================

// Global Constants for Date Calculations
const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const quizLinks = [
    { title: 'Bible Knowledge Test', icon: '📝', url: 'BibleQuiz.html', app: 'quiz' },
    { title: 'Heart Condition Diagnostic', icon: '❤️', url: 'Heart.html', app: 'heart' }
];

const diagnosticToolsLinks = [
    { title: 'Heart Check', icon: '❤️', app: 'heart' },
    { title: 'Bible Quiz', icon: '🧠', app: 'quiz' },
    { title: 'Pastoral Mirror', icon: '🪞', app: 'mirror' }
];

const researchLinks = [
    { title: 'Statistics', icon: '📊', app: 'statistics' },
    { title: 'Analysis', icon: '📈', app: 'analysis' },
    { title: 'Family', icon: '🏡', app: 'family' }
];


const invitationData = [
    { id: 1, title: "The Call to the Exhausted", quote: "Come to me, all who labor and are heavy laden, and I will give you rest.", reference: "Matthew 11:28", icon: "🕊️", insight: "Jesus does not demand more religious striving. He identifies the exhaustion of trying to earn worth and offers Himself as the antidote." },
    { id: 2, title: "The Call to the Thirsty", quote: "If anyone thirsts, let him come to me and drink.", reference: "John 7:37-38", icon: "💧", insight: "Addressed to human dissatisfaction. Jesus promises a qualitative kind of life that provides an internal, eternal satisfaction." },
    { id: 3, title: "The Call to Intimacy", quote: "Behold, I stand at the door and knock.", reference: "Revelation 3:20", icon: "🚪", insight: "A picture of divine pursuit. God does not force His way in; He knocks and offers friendship and reconciliation." }
];

const iamData = [
    { label: 'Bread of Life', need: 'Spiritual Hunger', verse: 'John 6:35', description: 'Just as physical bread sustains the body, Jesus is the essential nutrient for the soul. Without Him, the spirit starves; with Him, there is enduring life.', color: '#f472b6', icon: '🍞' },
    { label: 'Light of the World', need: 'Guidance in Darkness', verse: 'John 8:12', description: 'In a world of confusion, Jesus provides absolute clarity. Following Him guarantees you will walk in the light of life.', color: '#facce1', icon: '🕯️' },
    { label: 'Door of the Sheep', need: 'Security & Access', verse: 'John 10:9', description: 'Jesus is the singular entry point to safety. Through Him, one finds protection from spiritual predators and the freedom of abundant life.', color: '#2dd4bf', icon: '🚪' },
    { label: 'Good Shepherd', need: 'Care & Protection', verse: 'John 10:11', description: 'Unlike a hired hand, the Good Shepherd loves so profoundly that He willingly lays down His life for the vulnerable.', color: '#38bdf8', icon: '🐑' },
    { label: 'Resurrection & Life', need: 'Victory over Death', verse: 'John 11:25', description: 'Faced with the terror of death, Jesus claims total authority. He is the resurrection; in Him, death is merely a doorway.', color: '#c084fc', icon: '🌱' },
    { label: 'Way, Truth, Life', need: 'Direction & Reality', verse: 'John 14:6', description: 'The embodiment of ultimate reality and the source of all existence. All human searching ends in Him.', color: '#60a5fa', icon: '📚' },
    { label: 'True Vine', need: 'Purpose & Fruitfulness', verse: 'John 15:1', description: 'By abiding in (and remaining) attached to Jesus, believers draw on His endless grace, mercy and strength to produce true fruit.', color: '#34d399', icon: '🍇' }
];

const workData = [
    { id: 'incarnation', title: 'The Incarnation', subtitle: 'God With Us', summary: 'The Creator took on human flesh, experiencing our pains and limitations without sin.', hope: 'God knows exactly what it feels like to be human. You are deeply understood.' },
    { id: 'crucifixion', title: 'The Crucifixion', subtitle: 'The Atonement', summary: 'On the cross, Jesus absorbed the debt of sin and guilt, declaring "It is finished."', hope: 'Your failures are paid for. There is no condemnation left for those who trust Him.' },
    { id: 'resurrection', title: 'The Resurrection', subtitle: 'Victory Over Death', summary: 'Three days later, Jesus rose, defeating the finality of death and inaugurating a new creation.', hope: 'Death is not the end. The worst things are never the last things.' },
    { id: 'ascension', title: 'Ascension', subtitle: 'The Eternal Advocate', summary: 'Jesus ascended to the Father, where He currently reigns and intercedes for His people.', hope: 'You have a perfect representative in the highest court of reality.' }
];

const missionList = [
    { name: "Afghanistan", icon: "🇦🇫" }, { name: "Belarus", icon: "🇧🇾" }, { name: "Cambodia", icon: "🇰🇭" },
    { name: "China", icon: "🇨🇳" }, { name: "France", icon: "🇫🇷" }, { name: "Germany", icon: "🇩🇪" },
    { name: "Guatemala", icon: "🇬🇹" }, { name: "India", icon: "🇮🇳" }, { name: "Colombia", icon: "🇨🇴" },
    { name: "Nigeria", icon: "🇳🇬" }, { name: "North Korea", icon: "🇰🇵", tabName: "NKorea" }, { name: "Iran", icon: "🇮🇷" },
    { name: "Iraq", icon: "🇮🇶" }, { name: "Japan", icon: "🇯🇵" }, { name: "Mexico", icon: "🇲🇽" },
    { name: "Pakistan", icon: "🇵🇰" }, { name: "Russia", icon: "🇷🇺" }, { name: "Thailand", icon: "🇹🇭" },
    { name: "Turkey", icon: "🇹🇷" }, { name: "UK", icon: "🇬🇧" }, { name: "Yemen", icon: "🇾🇪" },
    { name: "Somalia", icon: "🇸🇴" }, { name: "Saudi Arabia", icon: "🇸🇦", tabName: "Saudi" }, { name: "Egypt", icon: "🇪🇬" },
    { name: "Vietnam", icon: "🇻🇳" }, { name: "Myanmar", icon: "🇲🇲" }, { name: "Bangladesh", icon: "🇧🇩" },
    { name: "Sudan", icon: "🇸🇩" }, { name: "Syria", icon: "🇸🇾" }, { name: "Malaysia", icon: "🇲🇾" },
    { name: "Nepal", icon: "🇳🇵" }, { name: "Algeria", icon: "🇩🇿" }, { name: "Mali", icon: "🇲🇱" },
    { name: "Laos", icon: "🇱🇦" }, { name: "Morocco", icon: "🇲🇦" }, { name: "Libya", icon: "🇱🇾" },
    { name: "Bhutan", icon: "🇧🇹" }, { name: "Oman", icon: "🇴🇲" }, { name: "Tajikistan", icon: "🇹🇯", tabName: "Tajikstan" },
    { name: "Turkmenistan", icon: "🇹🇲" }, { name: "Maldives", icon: "🇲🇻" }, { name: "Qatar", icon: "🇶🇦" },
    { name: "Mauritania", icon: "🇲🇷" }, { name: "Djibouti", icon: "🇩🇯" }, { name: "Sri Lanka", icon: "🇱🇰", tabName: "Sri" },
    { name: "Kuwait", icon: "🇰🇼" }, { name: "Uzbekistan", icon: "🇺🇿" }, { name: "Eritrea", icon: "🇪🇷" }
];

let explorerData = [];
let explorerState = { testament: 'All', genre: 'All', selectedId: null };
let cachedPlan = [];
let cachedDevos = [];
let cachedWords = [];
let intelState = { currentDay: 1, tab: 'today' };
let contactCardState = { plan: [], devos: [], words: [], currentDay: 1, lastLoadedAt: 0, cacheTtlMs: 3 * 60 * 1000, inFlightLoadPromise: null };

const MAIN_SCREEN_APP_LINKS = Object.freeze({
    'app-invitation': '/invitation',
    'app-focus': '/focus',
    'app-counseling': '/wisdom',
    'app-apologetics': '/apologetics',
    'app-bread': '/bread',
    'app-missions': '/missions',
    'app-characters': '/characters',
    'app-words': '/words',
    'app-explorer': '/books',
    'app-theology': '/theology',
    'app-psalms': '/psalms',
    'app-prayer': '/request',
    'app-prayer-action': '/prayer',
    'app-posture': '/worship',
    'app-heart': '/heart',
    'app-pastoral': '/mirror',
    'app-family': '/family',
    'app-quiz': '/quiz',
    'app-research': '/research',
    'app-diagnostic-tools': '/diagnostic-tools',
    'app-statistics': '/statistics',
    'app-analysis': '/analysis',
    'app-contact': '/contact',
    'app-member-portal': '/member-portal',
    'app-member-directory': '/member-directory',
    'app-our-mission': '/our-mission',
    'app-settings': '/settings',
    'app-themes': '/themes'
});

// ==========================================
// SHARED UTILITIES (Dates, Text, & Words)
// ==========================================

const bookMap = {
    "Genesis":"GEN", "Exodus":"EXO", "Leviticus":"LEV", "Numbers":"NUM", "Deuteronomy":"DEU", "Joshua":"JOS",
    "Judges":"JDG", "Ruth":"RUT", "1 Samuel":"1SA", "2 Samuel":"2SA", "1 Kings":"1KI", "2 Kings":"2KI",
    "1 Chronicles":"1CH", "2 Chronicles":"2CH", "Ezra":"EZR", "Nehemiah":"NEH", "Esther":"EST", "Job":"JOB",
    "Psalm":"PSA", "Psalms":"PSA", "Proverbs":"PRO", "Ecclesiastes":"ECC", "Song of Solomon":"SNG", "Isaiah":"ISA", "Jeremiah":"JER",
    "Lamentations":"LAM", "Ezekiel":"EZK", "Daniel":"DAN", "Hosea":"HOS", "Joel":"JOL", "Amos":"AMO",
    "Obadiah":"OBA", "Jonah":"JON", "Micah":"MIC", "Nahum":"NAM", "Habakkuk":"HAB", "Zephaniah":"ZEP",
    "Haggai":"HAG", "Zechariah":"ZEC", "Malachi":"MAL", "Matthew":"MAT", "Mark":"MRK", "Luke":"LUK",
    "John":"JHN", "Acts":"ACT", "Romans":"ROM", "1 Corinthians":"1CO", "2 Corinthians":"2CO", "Galatians":"GAL",
    "Ephesians":"EPH", "Philippians":"PHP", "Colossians":"COL", "1 Thessalonians":"1TH", "2 Thessalonians":"2TH",
    "1 Timothy":"1TI", "2 Timothy":"2TI", "Titus":"TIT", "Philemon":"PHM", "Hebrews":"HEB", "James":"JAS",
    "1 Peter":"1PE", "2 Peter":"2PE", "1 John":"1JN", "2 John":"2JN", "3 John":"3JN", "Jude":"JUD", "Revelation":"REV"
};

function getBibleLink(passage) {
    if (!passage) return "https://www.bible.com/bible/59/GEN.1.ESV";
    const match = passage.trim().match(/^(\d\s+[a-zA-Z]+|[a-zA-Z]+(?:\s[a-zA-Z]+)*)\s+(\d+)/);
    if (match) {
        const book = match[1].trim();
        const chap = match[2];
        const id = bookMap[book] || "GEN";
        return `https://www.bible.com/bible/59/${id}.${chap}.ESV`;
    }
    return `https://www.bible.com/bible/59/GEN.1.ESV`;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function dayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = (date - start) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60000);
    return Math.max(1, Math.min(365, Math.floor(diff / 86400000)));
}

function getReadingWindowBounds(planLength, referenceDate = new Date()) {
    const total = Math.max(0, Number(planLength) || 0);
    if (!total) return { startDay: 1, endDay: 1 };
    const todayDay = Math.max(1, Math.min(total, dayOfYear(referenceDate)));
    const startDay = Math.max(1, todayDay - 1);
    const endDay = Math.min(total, todayDay + 30);
    return { startDay, endDay };
}

function clampDayToWindow(day, planLength, referenceDate = new Date()) {
    const { startDay, endDay } = getReadingWindowBounds(planLength, referenceDate);
    return Math.max(startDay, Math.min(endDay, Number(day) || startDay));
}

function normalizeContactWords(wordsRaw) {
    const rows = Array.isArray(wordsRaw)
        ? wordsRaw
        : (Array.isArray(wordsRaw?.data) ? wordsRaw.data : (Array.isArray(wordsRaw?.rows) ? wordsRaw.rows : []));

    return rows.map(row => ({
        english: String(row.english || row.word || row.term || '').trim(),
        original: String(row.original || row.root || '').trim(),
        transliteration: String(row.transliteration || row.translit || '').trim(),
        strongs: String(row.strongs || row.id || '').trim(),
        language: String(row.language || '').trim(),
        definition: String(row.definition || row.meaning || '').trim()
    })).filter(item => item.english && item.definition);
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
};

function getCurrentContactDevo(devos, currentDayIndex, todayObj) {
    if (!devos.length) return null;
    const baseDate = todayObj instanceof Date ? todayObj : new Date();
    const currentPlanDateString = new Date(baseDate.getFullYear(), 0, currentDayIndex).toDateString();
    let currentDevo = null;
    for (let i = 0; i < devos.length; i++) {
        const devo = devos[i];
        if (devo.date && new Date(devo.date).toDateString() === currentPlanDateString) {
            currentDevo = devo;
            break;
        }
    }
    return currentDevo;
}

window.toggleAccordion = function(headerElement) {
    const cardElement = headerElement.parentElement;
    const isActive = cardElement.classList.contains('active');
    document.querySelectorAll('.region-card').forEach(c => c.classList.remove('active'));
    if (!isActive) cardElement.classList.add('active');
};

window.toggleFolder = function(show) {
    const folder = document.getElementById('missions-folder');
    if (folder) folder.classList.toggle('active', show);
};

window.toggleQuizFolder = function(show) {
    const folder = document.getElementById('quiz-folder');
    if (folder) folder.classList.toggle('active', show);
};

window.toggleResearchFolder = function(show) {
    const folder = document.getElementById('research-folder');
    if (folder) folder.classList.toggle('active', show);
};

window.toggleDiagnosticToolsFolder = function(show) {
    const folder = document.getElementById('diagnostic-tools-folder');
    if (folder) folder.classList.toggle('active', show);
};

function bounceModalBodyToTop() {
    const modalBody = document.querySelector('#data-modal .modal-body');
    if (!modalBody) return;

    modalBody.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => { modalBody.scrollTo({ top: 22, behavior: 'smooth' }); }, 220);
    setTimeout(() => { modalBody.scrollTo({ top: 0, behavior: 'smooth' }); }, 420);
}

const SERVICE_SHUTDOWN_DELAY_MS = 45000;
let deferredServiceShutdownTimer = null;

function isModalAppVisible() {
    const modal = document.getElementById('data-modal');
    return !!(modal && modal.classList.contains('active'));
}

function cancelDeferredServiceShutdown() {
    if (!deferredServiceShutdownTimer) return;
    clearTimeout(deferredServiceShutdownTimer);
    deferredServiceShutdownTimer = null;
}

function runServiceShutdown() {
    // Never tear down while an app modal is visible.
    if (isModalAppVisible()) return;

    if (typeof stopContactPrayerTicker === 'function') stopContactPrayerTicker();
    if (typeof prayerAppDestroyCharts === 'function') prayerAppDestroyCharts();
    if (typeof psalmsAppDestroyChart === 'function') psalmsAppDestroyChart();
    if (typeof statisticsStopTelemetry === 'function') statisticsStopTelemetry();
    if (typeof analysisAppDestroy === 'function') analysisAppDestroy();

    const modalContainer = document.getElementById('modal-body-container');
    if (modalContainer) modalContainer.innerHTML = '';
}

window.closeModal = function(options) {
    const opts = options && typeof options === 'object' ? options : {};
    const modal = document.getElementById('data-modal');
    if (modal) modal.classList.remove('active');

    cancelDeferredServiceShutdown();
    deferredServiceShutdownTimer = setTimeout(() => {
        if (isModalAppVisible()) return;
        runServiceShutdown();
        deferredServiceShutdownTimer = null;
    }, SERVICE_SHUTDOWN_DELAY_MS);

    const currentPath = normalizeAnchorPath(window.location.pathname);
    const shouldNavigateBack = opts.navigateBack !== false;

    if (shouldNavigateBack && window.location.protocol !== 'file:' && currentPath !== '/') {
        try {
            window.history.back();
            return;
        } catch {
            // Fallback to root anchor update below.
        }
    }

    if (opts.syncAnchor !== false) {
        setAppAnchor('/', true);
    }
};

// --- App Visibility System ---
function loadAppVisibility() {
    try {
        return JSON.parse(readLocalStorage(APP_VISIBILITY_KEY, '{}'));
    } catch {
        return {};
    }
}

function readLocalStorage(key, fallbackValue) {
    try {
        return localStorage.getItem(key) || fallbackValue;
    } catch {
        return fallbackValue;
    }
}

function applyAppVisibility() {
    const map = loadAppVisibility();
    document.querySelectorAll('#main-app-grid .app-item[id]').forEach(el => {
        const hidden = map[el.id] === false;
        el.style.display = hidden ? 'none' : '';
    });

    syncOwnerOnlyAppVisibility();
    syncPreLoginAppVisibility();
}

function hasHomeScreenLoginSession() {
    if (window.hasActiveSecureVaultSession && window.hasActiveSecureVaultSession()) return true;

    const session = getSessionSnapshot();
    const email = String((session && session.email) || '').trim();
    const token = String((session && session.token) || '').trim();
    return !!(email || token);
}

function syncPreLoginAppVisibility() {
    const grid = document.getElementById('main-app-grid');
    const hasAccess = hasHomeScreenLoginSession();

    const pastoralTile = grid ? grid.querySelector('#app-pastoral-care') : null;
    if (pastoralTile) pastoralTile.style.display = hasAccess ? '' : 'none';
}

function getSessionSnapshot() {
    try {
        return JSON.parse(readLocalStorage(AUTH_SESSION_KEY, 'null'));
    } catch {
        return null;
    }
}

function getProfileSnapshot() {
    try {
        const wrapped = JSON.parse(readLocalStorage(AUTH_PROFILE_KEY, 'null'));
        if (!wrapped || typeof wrapped !== 'object') return null;
        return wrapped.profile && typeof wrapped.profile === 'object' ? wrapped.profile : null;
    } catch {
        return null;
    }
}

function getOwnerEmail() {
    const fallback = 'callgrangers@gmail.com';
    if (!window.APP_CONFIG) return fallback;
    const configured = String(window.APP_CONFIG.contactEmail || '').trim().toLowerCase();
    return configured || fallback;
}

function isTrustedLocalPreview() {
    const host = String(window.location.hostname || '').toLowerCase();
    return window.location.protocol === 'file:' || host === 'localhost' || host === '127.0.0.1';
}

function isOwnerSessionActive() {
    const session = getSessionSnapshot();
    const email = String((session && session.email) || '').trim().toLowerCase();
    return !!email && email === getOwnerEmail();
}

function isAdminRoleSessionActive() {
    const session = getSessionSnapshot();
    const profile = getProfileSnapshot();
    const sessionRole = String((session && session.role) || '').trim().toLowerCase();
    const profileRole = String((profile && profile.role) || '').trim().toLowerCase();

    return sessionRole === 'admin' || profileRole === 'admin';
}

function isPastorRoleSessionActive() {
    const session = getSessionSnapshot();
    const profile = getProfileSnapshot();
    const sessionRole = String((session && session.role) || '').trim().toLowerCase();
    const profileRole = String((profile && profile.role) || '').trim().toLowerCase();

    return sessionRole === 'pastor' || profileRole === 'pastor';
}

function isAdminOrPastorSessionActive() {
    return isOwnerSessionActive() || isAdminRoleSessionActive() || isPastorRoleSessionActive();
}

function hasAdminProvisionAccess() {
    return isAdminRoleSessionActive();
}

function syncOwnerOnlyAppVisibility() {
    const pastoralCareSuiteTiles = ['app-pastoral-care'];

    // Pastoral Care Suite temporary rollout: visible for everyone.
    pastoralCareSuiteTiles.forEach((id) => {
        const tile = document.getElementById(id);
        if (!tile) return;
        tile.style.display = '';
    });
}

window.addEventListener('focus', function() {
    syncOwnerOnlyAppVisibility();
    syncPreLoginAppVisibility();
});
window.addEventListener('storage', function(event) {
    if (!event) return;
    if (event.key === AUTH_SESSION_KEY || event.key === AUTH_PROFILE_KEY) {
        syncOwnerOnlyAppVisibility();
        syncPreLoginAppVisibility();
    }
});

window.hasActiveSecureVaultSession = function hasActiveSecureVaultSession() {
    var key = (typeof SECURE_SESSION_KEY !== 'undefined' && SECURE_SESSION_KEY)
        ? SECURE_SESSION_KEY
        : 'atogen_secure_vault_v1';
    try {
        var raw = localStorage.getItem(key);
        if (!raw || raw === '1') return false;
        var parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return false;
        var expiresAt = Number(parsed.expiresAt || 0);
        return expiresAt > Date.now();
    } catch (e) {
        return false;
    }
};

function requireSecureVaultSession(originalAction) {
    if (window.hasActiveSecureVaultSession()) {
        originalAction();
        return true;
    }
    openHomeSecureLogin();
    return false;
}

function openAdminProvisionPage() {
    return requireSecureVaultSession(function() {
        if (typeof openAdminProvisionApp === 'function') {
            openAdminProvisionApp();
        }
    });
}

function normalizeAuthBasePath(pathValue) {
    const raw = String(pathValue || '').trim();
    const stableFromScript = (function() {
        try {
            const scriptUrl = new URL((document.currentScript && document.currentScript.src) || '', window.location.href);
            const pathname = String(scriptUrl.pathname || '').trim();
            const scriptsIndex = pathname.toLowerCase().indexOf('/scripts/');
            if (scriptsIndex > 0) return pathname.slice(0, scriptsIndex);
        } catch {
            // Ignore missing/invalid currentScript contexts.
        }
        return '';
    })();

    const inferred = (function() {
        const pathname = String(window.location.pathname || '/').trim() || '/';
        const lower = pathname.toLowerCase();
        const pagesIndex = lower.indexOf('/pages/');
        if (pagesIndex > 0) return pathname.slice(0, pagesIndex);
        const parts = pathname.split('/').filter(Boolean);
        return parts.length ? `/${parts[0]}` : '/ATOGen';
    })();
    const base = raw || stableFromScript || inferred;
    const withLeadingSlash = base.startsWith('/') ? base : `/${base}`;
    return withLeadingSlash.endsWith('/') ? withLeadingSlash.slice(0, -1) : withLeadingSlash;
}

function buildHomeSecureLoginTarget() {
    const returnPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const isLocal = window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    let loginUrl;
    if (isLocal) {
        loginUrl = new URL(window.location.href);
        loginUrl.search = '';
    } else {
        const origin = String(window.location.origin || '').trim();
        const basePath = normalizeAuthBasePath(window.AUTH_CANONICAL_BASE_PATH || '');
        loginUrl = new URL(`${origin}${basePath}/`);
    }

    loginUrl.hash = '/secure-login';
    loginUrl.searchParams.set('return', returnPath);
    return loginUrl.toString();
}

function openHomeSecureLogin() {
    window.__AOS_FORCE_SECURE_LOGIN_PROMPT__ = true;
    window.__AOS_POST_LOGIN_TARGET__ = 'member-portal';

    if (typeof openSecureApp === 'function') {
        openSecureApp();
        return true;
    }

    if (window.__AOS_SCRIPTS_LOADING__) {
        window.addEventListener('aos:scripts-ready', function onScriptsReady() {
            if (typeof openSecureApp === 'function') {
                openSecureApp();
            }
        }, { once: true });
        return true;
    }

    console.warn('[Login] Login form is not ready yet.');
    return true;
}

window.openHomeSecureLogin = openHomeSecureLogin;

function installEarlySecureLoginBinding() {
    // Secure Login tile removed — login now routes through Member Portal.
}

window.redirectToLoginForAppRoute = function(routePath, reason, appId) {
    const targetRoute = normalizeAnchorPath(routePath || '/');

    try {
        if (window.location.protocol !== 'file:' && APP_ANCHOR_PATH_SET.has(targetRoute)) {
            window.history.replaceState(null, '', targetRoute);
            syncModalBackLabel();
        }
    } catch {
        // Ignore history restrictions and continue with auth prompt.
    }

    openHomeSecureLogin();
    return true;
};

// --- Routing & Deep Linking System ---
const APP_ANCHOR_ROUTES = [
    { path: '/secure-login', label: 'Login', action: () => { openHomeSecureLogin(); } },
    { path: '/invitation', label: 'Invitation', action: () => { if (typeof openOutreachApp === 'function') openOutreachApp(); } },
    { path: '/missions', label: 'Missions', action: () => { if (typeof toggleFolder === 'function') toggleFolder(true); } },
    { path: '/focus', label: 'Focus', action: () => { if (typeof openTodaysFocusCountry === 'function') openTodaysFocusCountry(); } },
    { path: '/wisdom', label: 'Wisdom', action: () => { if (typeof openCounseling === 'function') openCounseling(); } },
    { path: '/apologetics', label: 'Apologetics', action: () => { if (typeof openApologeticsApp === 'function') openApologeticsApp(); } },
    { path: '/bread', label: 'Bread', action: () => { if (typeof openIntel === 'function') openIntel(); } },
    { path: '/books', label: 'Books', action: () => { if (typeof openExplorer === 'function') openExplorer(); } },
    { path: '/characters', label: 'Characters', action: () => { if (typeof openCharactersApp === 'function') openCharactersApp(); } },
    { path: '/words', label: 'Words', action: () => { if (typeof openWordsApp === 'function') openWordsApp(); } },
    { path: '/theology', label: 'Theology', action: () => { if (typeof openTheology === 'function') openTheology(); } },
    { path: '/psalms', label: 'Psalms', action: () => { if (typeof openPsalmsApp === 'function') openPsalmsApp(); } },
    { path: '/request', label: 'Request', action: () => { if (typeof openPublicPrayerRequestApp === 'function') openPublicPrayerRequestApp(); } },
    { path: '/prayer', label: 'Prayer', action: () => { if (typeof openPublicPrayerApp === 'function') openPublicPrayerApp(); } },
    { path: '/worship', label: 'Worship', action: () => { if (typeof openPostureApp === 'function') openPostureApp(); } },
    { path: '/heart', label: 'Heart', action: () => { if (typeof openHeartApp === 'function') openHeartApp(); } },
    { path: '/quiz', label: 'Quiz', action: () => { if (typeof openQuizWindow === 'function') openQuizWindow(); } },
    { path: '/research', label: 'Research', action: () => { if (typeof toggleResearchFolder === 'function') toggleResearchFolder(true); } },
    { path: '/diagnostic-tools', label: 'Diagnostic Tools', action: () => { if (typeof toggleDiagnosticToolsFolder === 'function') toggleDiagnosticToolsFolder(true); } },
    { path: '/settings', label: 'Settings', action: () => { if (typeof openSettingsApp === 'function') openSettingsApp(); } },
    { path: '/family', label: 'Family', action: () => { if (typeof openFamilyApp === 'function') openFamilyApp(); } },
    { path: '/mirror', label: 'Mirror', action: () => { if (typeof openMirrorApp === 'function') openMirrorApp(); } },
    { path: '/sheep', label: 'Sheep', action: () => { if (typeof openPastoralApp === 'function') openPastoralApp(); } },
    { path: '/statistics', label: 'Statistics', action: () => { if (typeof openStatisticsApp === 'function') openStatisticsApp(); } },
    { path: '/analysis', label: 'Analysis', action: () => { if (typeof openAnalysisApp === 'function') openAnalysisApp(); } },
    { path: '/contact', label: 'Contact', action: () => { if (typeof openContactCard === 'function') openContactCard(); } },
    { path: '/member-portal', label: 'Member Portal', action: () => { if (typeof openMemberPortalApp === 'function') openMemberPortalApp(); } },
    { path: '/member-directory', label: 'Member Directory', action: () => { if (typeof openMemberDirectoryApp === 'function') openMemberDirectoryApp(); } },
    { path: '/our-mission', label: 'Our Mission', action: () => { if (typeof openDisclaimerApp === 'function') openDisclaimerApp(); } },
    { path: '/themes', label: 'Themes', action: () => { if (typeof openThemesApp === 'function') openThemesApp(); } },
    { path: '/admin-provision', label: 'Provision', action: () => openAdminProvisionPage() },
    { path: '/secure', label: 'Secure', action: () => { openHomeSecureLogin(); } }
];

const APP_ANCHOR_PATH_SET = new Set(APP_ANCHOR_ROUTES.map(r => r.path));
let appAnchorSyncInstalled = false;

function wrapAppEntryFunction(fnName, routePath) {
    const original = window[fnName];
    if (typeof original !== 'function') return;
    if (original.__aosAnchorWrapped === true) return;

    const wrapped = function(...args) {
        cancelDeferredServiceShutdown();
        const result = original.apply(this, args);
        if (routePath) setAppAnchor(routePath);
        return result;
    };

    wrapped.__aosAnchorWrapped = true;
    window[fnName] = wrapped;
}

function normalizeAnchorPath(pathname) {
    const raw = String(pathname || '/').trim() || '/';
    const withSlash = raw.startsWith('/') ? raw : `/${raw}`;
    return (withSlash.replace(/\/+$/, '') || '/').toLowerCase();
}

function syncModalBackLabel() {
    const backTextEl = document.getElementById('modal-back-text');
    if (!backTextEl) return;
    const currentLabel = String(backTextEl.textContent || '').trim().toUpperCase();
    if (currentLabel !== 'CLEAR' && currentLabel !== 'BACK') return;
    const path = normalizeAnchorPath(window.location.pathname);
    backTextEl.textContent = path === '/' ? 'CLEAR' : 'BACK';
}

function setAppAnchor(path, replace = false) {
    const normalized = normalizeAnchorPath(path);
    const current = normalizeAnchorPath(window.location.pathname);
    if (normalized === current) {
        syncModalBackLabel();
        return;
    }
    if (window.location.protocol === 'file:') return;
    const fn = replace ? 'replaceState' : 'pushState';
    try {
        window.history[fn](null, '', normalized);
        syncModalBackLabel();
    } catch {
        // Ignore History API restrictions in local file previews.
    }
}

function openAppFromAnchor(path) {
    cancelDeferredServiceShutdown();
    const normalized = normalizeAnchorPath(path);
    const route = APP_ANCHOR_ROUTES.find(r => r.path === normalized);
    if (!route) return false;
    route.action();
    return true;
}

window.navigateAppAnchor = function(event, path) {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    const normalized = normalizeAnchorPath(path);
    const opened = openAppFromAnchor(normalized);
    if (opened) setAppAnchor(normalized);
    return false;
};

window.getAppAnchorLinksHtml = function() {
    return APP_ANCHOR_ROUTES.map(route => {
        return `<a href="${route.path}" class="anchor-link-chip" onclick="return navigateAppAnchor(event, '${route.path}')">${route.path}</a>`;
    }).join('');
};

function installAppAnchorSync() {
    const wrappers = [
        { fnName: 'openOutreachApp', routePath: '/invitation' },
        { fnName: 'openInvitationApp', routePath: '/invitation' },
        { fnName: 'openCounseling', routePath: '/wisdom' },
        { fnName: 'openApologeticsApp', routePath: '/apologetics' },
        { fnName: 'openIntel', routePath: '/bread' },
        { fnName: 'openExplorer', routePath: '/books' },
        { fnName: 'openCharactersApp', routePath: '/characters' },
        { fnName: 'openWordsApp', routePath: '/words' },
        { fnName: 'openTheology', routePath: '/theology' },
        { fnName: 'openPsalmsApp', routePath: '/psalms' },
        { fnName: 'openPublicPrayerRequestApp', routePath: '/request' },
        { fnName: 'openPublicPrayerApp', routePath: '/prayer' },
        { fnName: 'openPostureApp', routePath: '/worship' },
        { fnName: 'openHeartApp', routePath: '/heart' },
        { fnName: 'openQuizWindow', routePath: '/quiz' },
        { fnName: 'openQuizApp', routePath: '/quiz' },
        { fnName: 'openFamilyApp', routePath: '/family' },
        { fnName: 'openMirrorApp', routePath: '/mirror' },
        { fnName: 'openPastoralApp', routePath: '/sheep' },
        { fnName: 'openStatisticsApp', routePath: '/statistics' },
        { fnName: 'openAnalysisApp', routePath: '/analysis' },
        { fnName: 'openContactCard', routePath: '/contact' },
        { fnName: 'openMemberPortalApp', routePath: '/member-portal' },
        { fnName: 'openMemberDirectoryApp', routePath: '/member-directory' },
        { fnName: 'openDisclaimerApp', routePath: '/our-mission' },
        { fnName: 'openSettingsApp', routePath: '/settings' },
        { fnName: 'openThemesApp', routePath: '/themes' },
        { fnName: 'openAdminProvisionApp', routePath: '/admin-provision' },

        { fnName: 'openTodaysFocusCountry', routePath: '/focus' },
        { fnName: 'openFocusCountry', routePath: '/focus' },
        { fnName: 'openMission', routePath: '/missions' },
        { fnName: 'openContactBreadDay', routePath: '/bread' }
    ];

    wrappers.forEach(({ fnName, routePath }) => {
        wrapAppEntryFunction(fnName, routePath);
    });

    if (appAnchorSyncInstalled) return;
    appAnchorSyncInstalled = true;

    const originalToggleFolder = window.toggleFolder;
    if (typeof originalToggleFolder === 'function') {
        window.toggleFolder = function(show) {
            const result = originalToggleFolder.apply(this, arguments);
            setAppAnchor(show ? '/missions' : '/', true);
            return result;
        };
    }

    const originalToggleResearchFolder = window.toggleResearchFolder;
    if (typeof originalToggleResearchFolder === 'function') {
        window.toggleResearchFolder = function(show) {
            const result = originalToggleResearchFolder.apply(this, arguments);
            setAppAnchor(show ? '/research' : '/', true);
            return result;
        };
    }

    const originalToggleSettingsFolder = window.toggleSettingsFolder;
    if (typeof originalToggleSettingsFolder === 'function') {
        window.toggleSettingsFolder = function(show) {
            const result = originalToggleSettingsFolder.apply(this, arguments);
            setAppAnchor(show ? '/settings' : '/', true);
            return result;
        };
    }
}

// --- Main Screen App Routing ---
function buildSmsLink(phone, body) {
    const digits = String(phone || (typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.smsNumber : '') || '').replace(/\D/g, '');
    const cleanedBody = String(body || '').trim();
    const base = digits ? `sms:${digits}` : 'sms:';
    return cleanedBody ? `${base}?body=${encodeURIComponent(cleanedBody)}` : base;
}

function launchMainScreenApp(routePath, event) {
    cancelDeferredServiceShutdown();
    const normalized = normalizeAnchorPath(routePath);
    const route = APP_ANCHOR_ROUTES.find(item => item.path === normalized);
    if (!route || typeof route.action !== 'function') return false;
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    route.action(event);
    setAppAnchor(normalized);
    return false;
}

function rebuildMainScreenAppLinks() {
    const grid = document.getElementById('main-app-grid');
    if (!grid) return;

    Object.entries(MAIN_SCREEN_APP_LINKS).forEach(([id, routePath]) => {
        const el = document.getElementById(id);
        if (!el) return;

        el.dataset.appRoute = routePath;

        if (el.tagName === 'BUTTON') {
            el.type = 'button';
        }

        if (el.tagName === 'A') {
            el.href = routePath;
        }
    });

    if (grid.dataset.linksBound === 'true') return;

    grid.addEventListener('click', (event) => {
        const trigger = event.target.closest('.app-item[data-app-route]');
        if (!trigger || !grid.contains(trigger)) return;
        launchMainScreenApp(trigger.dataset.appRoute, event);
    });

    grid.dataset.linksBound = 'true';
}

// --- Background OS Processes (Clock & Network) ---
function updateClock() {
    const now = new Date();
    const zulu = now.toLocaleTimeString('en-GB', {
        timeZone: 'UTC',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    const clockEl = document.getElementById('clock');
    if (clockEl) clockEl.innerText = `${zulu} ZULU`;
}

let clockIntervalId = null;
let clockBoundaryTimeoutId = null;

function startClock() {
    updateClock();
    if (clockIntervalId) clearInterval(clockIntervalId);
    if (clockBoundaryTimeoutId) clearTimeout(clockBoundaryTimeoutId);

    const now = new Date();
    const msUntilNextMinute = ((60 - now.getSeconds()) * 1000) - now.getMilliseconds();
    clockBoundaryTimeoutId = setTimeout(() => {
        updateClock();
        clockIntervalId = setInterval(updateClock, 60000);
    }, Math.max(50, msUntilNextMinute));
}

async function updateConnectionStatus() {
    const dot = document.getElementById('conn-dot');
    const bars = Array.from(document.querySelectorAll('.signal-bars .bar'));
    if (!dot) return;

    const DOT_GREEN = '#2bff58';

    function applyIndicators(barCount) {
        const glow = 0.65;
        dot.style.backgroundColor = DOT_GREEN;
        dot.style.boxShadow = `0 0 ${Math.round(8 * glow)}px rgba(43,255,88,${(0.7 * glow).toFixed(2)}), 0 0 ${Math.round(20 * glow)}px rgba(43,255,88,${(0.45 * glow).toFixed(2)}), 0 0 ${Math.round(34 * glow)}px rgba(43,255,88,${(0.28 * glow).toFixed(2)})`;
        // Bars represent traffic intensity
        bars.forEach((bar, i) => {
            bar.style.background = i < barCount ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.18)';
            bar.style.opacity = '1';
            bar.style.transition = 'background 0.15s ease-out';
        });
    }

    if (window.location.protocol === 'file:') {
        applyIndicators(4);
        return;
    }

    // Get signal bars (fewer active requests = stronger signal, starts at 1 bar on load)
    const trafficBars = (typeof window.apiGetTrafficBars === 'function') ? window.apiGetTrafficBars() : 1;
    applyIndicators(trafficBars);
    
    // Update frequently for near-instant response to traffic
    setTimeout(updateConnectionStatus, 150);
}

function initConnectionDot() {
    if (window.location.protocol === 'file:') {
        updateConnectionStatus();
        return;
    }

    updateConnectionStatus();
    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);
}

// --- Main Initializer ---
function init() {
    installAppAnchorSync();
    rebuildMainScreenAppLinks();

    if (typeof populateMissionsDirectory === 'function') {
        populateMissionsDirectory();
    }
    if (typeof primeMissionsCache === 'function') {
        primeMissionsCache(false);
    }
    if (typeof startMissionsIncrementalSync === 'function') {
        startMissionsIncrementalSync();
    }
    if (typeof startSitewideAppSync === 'function') {
        startSitewideAppSync();
    }

    // Pre-load all app data in the background
    if (typeof preloadAllAppData === 'function') {
        preloadAllAppData().catch(() => {});
    }

    // Populate Quiz Folder dynamically
    const quizGrid = document.getElementById('quiz-grid');
    if (quizGrid && typeof quizLinks !== 'undefined') {
        quizGrid.innerHTML = '';
        quizLinks.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'app-item';
            btn.onclick = () => {
                if (typeof toggleQuizFolder === 'function') toggleQuizFolder(false);
                if (item.app === 'heart' && typeof openHeartApp === 'function') {
                    openHeartApp();
                } else if (typeof openQuizApp === 'function') {
                    openQuizApp();
                }
            };
            btn.innerHTML = `<div class="app-icon">${item.icon}</div><div class="app-label" title="${item.title}">${item.title}</div>`;
            quizGrid.appendChild(btn);
        });
    }

    // Populate Research Folder dynamically
    const researchGrid = document.getElementById('research-grid');
    if (researchGrid && typeof researchLinks !== 'undefined') {
        researchGrid.innerHTML = '';
        researchLinks.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'app-item';
            btn.onclick = () => {
                if (typeof toggleResearchFolder === 'function') toggleResearchFolder(false);
                if (item.app === 'statistics' && typeof openStatisticsApp === 'function') {
                    openStatisticsApp();
                } else if (item.app === 'analysis' && typeof openAnalysisApp === 'function') {
                    openAnalysisApp();
                } else if (item.app === 'family' && typeof openFamilyApp === 'function') {
                    openFamilyApp();
                }
            };
            btn.innerHTML = `<div class="app-icon">${item.icon}</div><div class="app-label" title="${item.title}">${item.title}</div>`;
            researchGrid.appendChild(btn);
        });
    }

    // Populate Diagnostic Tools Folder dynamically
    const diagGrid = document.getElementById('diagnostic-tools-grid');
    if (diagGrid && typeof diagnosticToolsLinks !== 'undefined') {
        diagGrid.innerHTML = '';
        diagnosticToolsLinks.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'app-item';
            btn.onclick = () => {
                if (typeof toggleDiagnosticToolsFolder === 'function') toggleDiagnosticToolsFolder(false);
                if (item.app === 'heart' && typeof openHeartApp === 'function') {
                    openHeartApp();
                } else if (item.app === 'quiz' && typeof openQuizApp === 'function') {
                    openQuizApp();
                } else if (item.app === 'mirror' && typeof openMirrorApp === 'function') {
                    openMirrorApp();
                }
            };
            btn.innerHTML = `<div class="app-icon">${item.icon}</div><div class="app-label" title="${item.title}">${item.title}</div>`;
            diagGrid.appendChild(btn);
        });
    }

    applyAppVisibility();
    window.addEventListener('storage', syncOwnerOnlyAppVisibility);

    if (window.lucide) lucide.createIcons();

    startClock();
    initConnectionDot();

    const savedColorScheme = readLocalStorage('colorScheme', '');
    if (savedColorScheme && typeof changeColorScheme === 'function') changeColorScheme(savedColorScheme);

    const savedBgScheme = readLocalStorage('bgScheme', '');
    if (savedBgScheme && typeof changeBackgroundScheme === 'function') changeBackgroundScheme(savedBgScheme);

    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = (now - start) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60000);
    if (typeof window.intelState !== 'undefined') {
        window.intelState.currentDay = Math.max(1, Math.min(365, Math.floor(diff / 86400000)));
    }

    if (typeof updateFocusButton === 'function') updateFocusButton();

    window.addEventListener('popstate', () => {
        const path = normalizeAnchorPath(window.location.pathname);
        syncModalBackLabel();
        if (path === '/') {
            closeModal({ navigateBack: false, syncAnchor: false });
            if (typeof toggleFolder === 'function') toggleFolder(false);
            if (typeof toggleQuizFolder === 'function') toggleQuizFolder(false);
            if (typeof toggleResearchFolder === 'function') toggleResearchFolder(false);
            if (typeof toggleDiagnosticToolsFolder === 'function') toggleDiagnosticToolsFolder(false);
            if (typeof toggleSettingsFolder === 'function') toggleSettingsFolder(false);
            return;
        }
        if (!APP_ANCHOR_PATH_SET.has(path)) return;
        openAppFromAnchor(path);
    });

    const initialPath = normalizeAnchorPath(window.location.pathname);
    syncModalBackLabel();
    if (initialPath !== '/' && APP_ANCHOR_PATH_SET.has(initialPath)) {
        openAppFromAnchor(initialPath);
    }
}

window.startProtectedApp = function() {
    init();
};

async function runInitOnce() {
    if (window.__AOS_MAIN_INIT_DONE__) return;
    window.__AOS_MAIN_INIT_DONE__ = true;

    installEarlySecureLoginBinding();
    init();
}

// Bootstrap
installEarlySecureLoginBinding();

if (window.__AOS_SCRIPTS_LOADING__) {
    window.addEventListener('aos:scripts-ready', runInitOnce, { once: true });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.__AOS_SCRIPTS_LOADING__) {
            runInitOnce();
        }
    });
} else if (!window.__AOS_SCRIPTS_LOADING__) {
    runInitOnce();
}
