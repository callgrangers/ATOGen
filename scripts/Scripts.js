// Script manifest + loader profiles.
// This keeps script ordering centralized and reduces clutter across HTML shells.

const AOS1P_HEAD_SCRIPTS = Object.freeze([
    // CDN/runtime dependencies
    'https://unpkg.com/lucide@0.474.0/dist/umd/lucide.js',
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/chart.js',

    // Core bootstrap
    '../scripts/config.js',
    '../scripts/Main.js',

    // Feature modules
    '../scripts/Apologetics.js',
    '../scripts/AdminProvision.js',
    '../scripts/Analysis.js',
    '../scripts/Secure.js',
    '../scripts/BibleQuiz.js',
    '../scripts/Bread.js',
    '../scripts/Characters.js',
    '../scripts/Contact.js',
    '../scripts/MemberPortal.js',
    '../scripts/PrayerService.js',
    '../scripts/Counseling.js',
    '../scripts/Disclaimer.js',
    '../scripts/Explorer.js',
    '../scripts/Family.js',
    '../scripts/Focus.js',
    '../scripts/Heart.js',
    '../scripts/Missions.js',
    '../scripts/Mirror.js',
    '../scripts/Pastoral.js',
    '../scripts/Posture.js',
    '../scripts/PublicPrayer.js',
    '../scripts/Psalms.js',
    '../scripts/Settings.js',
    '../scripts/Statistics.js',
    '../scripts/Theology.js',
    '../scripts/Todo.js',
    '../scripts/Words.js'
]);

const AOS1P_FOOTER_SCRIPTS = Object.freeze([
    // Loaded after inline script block in aos1p shell
    '../scripts/Invitation.js'
]);

const AOS1P_ALL_SCRIPTS = Object.freeze([
    ...AOS1P_HEAD_SCRIPTS,
    ...AOS1P_FOOTER_SCRIPTS
]);

const LEGACY_CORE_SCRIPTS = Object.freeze([
    // Legacy pages keep a minimal script surface
    'https://unpkg.com/lucide@0.474.0/dist/umd/lucide.js',
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/chart.js',
    '../scripts/Apologetics.js'
]);

const SCRIPT_PROFILES = Object.freeze({
    aos1p: AOS1P_ALL_SCRIPTS,
    'legacy-core': LEGACY_CORE_SCRIPTS
});

function resolveProfileName() {
    let scriptProfile = '';
    if (typeof document !== 'undefined' && document.currentScript) {
        try {
            const scriptUrl = new URL(document.currentScript.src, window.location.href);
            scriptProfile = scriptUrl.searchParams.get('profile') || '';
        } catch {
            scriptProfile = '';
        }
    }

    if (scriptProfile) return scriptProfile;

    if (typeof window !== 'undefined') {
        try {
            const pageUrl = new URL(window.location.href);
            const pageProfile = pageUrl.searchParams.get('scriptProfile') || '';
            if (pageProfile) return pageProfile;
        } catch {
            // Ignore malformed URLs and use default profile.
        }
    }

    return 'aos1p';
}

function resolveLoaderVersion() {
    if (typeof document === 'undefined' || !document.currentScript) return '';
    try {
        const scriptUrl = new URL(document.currentScript.src, window.location.href);
        return scriptUrl.searchParams.get('v') || '';
    } catch {
        return '';
    }
}

function resolveLoaderCacheToken() {
    if (typeof document === 'undefined' || !document.currentScript) return '';
    try {
        const scriptUrl = new URL(document.currentScript.src, window.location.href);
        return scriptUrl.searchParams.get('_t') || '';
    } catch {
        return '';
    }
}

function withVersionToken(src, versionToken) {
    if (!versionToken) return src;
    if (/^https?:\/\//i.test(src)) return src;
    const joiner = src.includes('?') ? '&' : '?';
    return `${src}${joiner}v=${encodeURIComponent(versionToken)}`;
}

function withCacheToken(src, cacheToken) {
    if (!cacheToken) return src;
    if (/^https?:\/\//i.test(src)) return src;
    const joiner = src.includes('?') ? '&' : '?';
    return `${src}${joiner}_t=${encodeURIComponent(cacheToken)}`;
}

const ACTIVE_SCRIPT_PROFILE = resolveProfileName();
const ACTIVE_LOADER_VERSION = resolveLoaderVersion();
const ACTIVE_LOADER_CACHE_TOKEN = resolveLoaderCacheToken();
const ACTIVE_SCRIPT_MANIFEST = Object.freeze(
    SCRIPT_PROFILES[ACTIVE_SCRIPT_PROFILE] || AOS1P_ALL_SCRIPTS
);

if (typeof window !== 'undefined') {
    window.AOS1P_SCRIPT_MANIFEST = AOS1P_ALL_SCRIPTS;
    window.SCRIPT_PROFILE_MANIFESTS = SCRIPT_PROFILES;
    window.ACTIVE_SCRIPT_PROFILE = ACTIVE_SCRIPT_PROFILE;
    window.ACTIVE_SCRIPT_MANIFEST = ACTIVE_SCRIPT_MANIFEST;
    window.ACTIVE_LOADER_VERSION = ACTIVE_LOADER_VERSION;
    window.ACTIVE_LOADER_CACHE_TOKEN = ACTIVE_LOADER_CACHE_TOKEN;

    // Guard legacy pages from hard-crashing if the Lucide CDN is temporarily unavailable.
    if (!window.lucide || typeof window.lucide.createIcons !== 'function') {
        window.lucide = window.lucide || {};
        window.lucide.createIcons = window.lucide.createIcons || function() {};
    }
}

function loadScriptsSequentially(srcs, index, onComplete) {
    if (!Array.isArray(srcs) || index >= srcs.length) {
        if (typeof onComplete === 'function') onComplete();
        return;
    }

    const script = document.createElement('script');
    const withVersion = withVersionToken(srcs[index], ACTIVE_LOADER_VERSION);
    script.src = withCacheToken(withVersion, ACTIVE_LOADER_CACHE_TOKEN);
    script.async = false;
    script.onload = () => loadScriptsSequentially(srcs, index + 1, onComplete);
    script.onerror = () => {
        console.warn('[Scripts] Failed to load:', srcs[index]);
        loadScriptsSequentially(srcs, index + 1, onComplete);
    };

    document.head.appendChild(script);
}

if (typeof document !== 'undefined') {
    const alreadyBootstrapped =
        typeof window !== 'undefined' &&
        window.__AOS_SCRIPT_BOOTSTRAPPED__ &&
        window.__AOS_SCRIPT_BOOTSTRAP_VERSION__ === ACTIVE_LOADER_VERSION &&
        window.__AOS_SCRIPT_BOOTSTRAP_CACHE_TOKEN__ === ACTIVE_LOADER_CACHE_TOKEN &&
        window.__AOS_SCRIPT_BOOTSTRAP_PROFILE__ === ACTIVE_SCRIPT_PROFILE;
    if (!alreadyBootstrapped) {
        if (typeof window !== 'undefined') {
            window.__AOS_SCRIPT_BOOTSTRAPPED__ = true;
            window.__AOS_SCRIPTS_LOADING__ = true;
            window.__AOS_SCRIPT_BOOTSTRAP_VERSION__ = ACTIVE_LOADER_VERSION;
            window.__AOS_SCRIPT_BOOTSTRAP_CACHE_TOKEN__ = ACTIVE_LOADER_CACHE_TOKEN;
            window.__AOS_SCRIPT_BOOTSTRAP_PROFILE__ = ACTIVE_SCRIPT_PROFILE;
        }

        loadScriptsSequentially(ACTIVE_SCRIPT_MANIFEST.slice(), 0, () => {
            if (typeof window !== 'undefined') {
                window.__AOS_SCRIPTS_LOADING__ = false;
                window.dispatchEvent(new CustomEvent('aos:scripts-ready'));
            }
        });
    }
}