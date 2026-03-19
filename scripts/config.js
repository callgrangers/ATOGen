/* ==========================================
   ATOG(en) API CONFIGURATION
   ========================================== */

const APP_ENDPOINTS = [

    // PRIMARY
    "https://script.google.com/macros/s/AKfycbwyQk9VECtBNDxJLIksdFq3xrjpFAMb3snd1fblbcFIOaVX4ImrIMCgsVwtnVgxWgNDmQ/exec",

    // SECONDARY
    "https://script.google.com/macros/s/AKfycbyxgCjcDyF7Q_SrqJTqSI6nEltSkh21qNP0cUCkYGZKqLcGflin2tkuHcCgDiOYP-Nwyw/exec",

    // TERTIARY
    "https://script.google.com/macros/s/AKfycbyXX4EAvPvJGSp1BLiBt4cg6_9hL0zP9j3-scx4SwfCTPYKZgrJ5V4bU1TtZrLHLI2osg/exec"

];

/* Fallback mapping to keep existing app files working */

const MASTER_API_URL = APP_ENDPOINTS[0];

/* Intelligent endpoint resolver with automatic fallback */
async function resolveWorkingEndpoint(baseUrl, maxRetries = 3) {
    let lastError = null;
    const base = baseUrl.split('?')[0]; // Remove query params for testing
    
    for (let i = 0; i < APP_ENDPOINTS.length && i < maxRetries; i++) {
        try {
            const testUrl = `${APP_ENDPOINTS[i]}?test=1&_=${Date.now()}`;
            const response = await fetch(testUrl, { cache: 'no-store', timeout: 5000 });
            if (response.ok) {
                return APP_ENDPOINTS[i];
            }
        } catch (e) {
            lastError = e;
            continue;
        }
    }
    
    return null;
}

/* ==========================================
   GLOBAL APP CONFIG
   ========================================== */

const APP_CONFIG = {

    colorScheme:   'Default',
    bgScheme:      'Aurora',

    focusIndex:    'rotation',

    smsNumber:     '4423709462',
   smsDisplay:    'Greg Granger',

    contactName:   'Greg Granger',
   contactRole:   'Teacher, Worshipper, Intercessor',
    contactPhone:  '+14423709462',
    contactEmail:  'callgrangers@gmail.com',

    scheduleLink:  'https://calendar.google.com/calendar/appointments/schedules/AcZssZ3x8iNhWTRLm52Bwa4OHgSbhHdbOP1Gc3Pru3MeGrR_GwKVFNK1djE71Y88ps29WCFUUiAQ_ChC',

    learnMoreLink: 'app:afghanistan'

};


/* ==========================================
   STORAGE KEYS
   ========================================== */
const APP_VISIBILITY_KEY = 'app_visibility';
const AUTH_SESSION_KEY = 'aos_auth_session_v1';
const AUTH_PROFILE_KEY = 'aos_auth_profile_v1';
const AUTH_PROFILE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;  // 6 hours — match backend token cache max
const AUTH_ALLOW_LOCAL_MOCK = 0;

const AUTH_ROLE_ALLOWLIST = Object.freeze([
   'Member',
   'Leader',
   'Admin',
   'Pastor',
   'Deacon'
]);

const AUTH_STATUS_ALLOWLIST = Object.freeze([
   'active',
   'archived',
   'disabled',
   'locked',
   'pending'
]);

const AUTH_SHEET_TABS = Object.freeze({
   users: 'AuthUsers_v1',
   profiles: 'UserProfiles_v1',
   audit: 'AuthAudit_v1'
});

const AUTH_ENDPOINT_ACTIONS = Object.freeze({
   login: 'auth.login',
   profile: 'auth.profile',
   refresh: 'auth.refresh',
   logout: 'auth.logout'
});

const AUTH_PRIMARY_ENDPOINT = 'https://script.google.com/macros/s/AKfycbytqHnozW-c2NiiqcdMTzOHphMlt0d3uj6A1E8MxXEeR2VDuG-RfiUriYFgdiw6WVE/exec';
const AUTH_SECONDARY_ENDPOINT = '';
const AUTH_TERTIARY_ENDPOINT = '';
const AUTH_ENDPOINT_FALLBACKS = Object.freeze([
   AUTH_PRIMARY_ENDPOINT,
   AUTH_SECONDARY_ENDPOINT,
   AUTH_TERTIARY_ENDPOINT
].filter((url, index, all) => {
   const value = String(url || '').trim();
   return !!value && all.findIndex(candidate => String(candidate || '').trim() === value) === index;
}));

const AUTH_ENDPOINTS = {
   login: AUTH_PRIMARY_ENDPOINT,
   profile: AUTH_PRIMARY_ENDPOINT,
   refresh: AUTH_PRIMARY_ENDPOINT,
   logout: AUTH_PRIMARY_ENDPOINT
};

const PRAYER_REQUEST_ENDPOINT_OVERRIDE = String((function() {
   try { return localStorage.getItem('ATOG_PRAYER_ENDPOINT') || ''; } catch (err) { return ''; }
})()).trim();

const PRAYER_REQUEST_ENDPOINT = PRAYER_REQUEST_ENDPOINT_OVERRIDE || (
   (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:3000/api/prayer'
      : 'https://script.google.com/macros/s/AKfycbyiWOjfWcxLKbhPoHV6Z3wAY3UbYIM3CKz00orKl4r6C4OMHdt3qYapXI-aIecCmjCx/exec'
);

const PASTORAL_NOTES_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwiQpNQL2XCYz-WJUmMOvTh5Nb1OQJWA7uufIO8cscDyqboDTgNyFQdQj0NyqscLKGe/exec';

// Pastoral Care Database v2 — full member management, RBAC, audit log
const PASTORAL_DB_V2_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwc8gS1V8otvbB47koaq6M8IbyRwZFlP80wU87PmxqWePYgGDb7YgfHOBmPmPCmYDmw2A/exec';

// ToDo endpoint — uses the same sheet as Pastoral (add a "ToDo" tab)
// Replace with your deployed web app URL after deploying code.gs
const TODO_ENDPOINT = PASTORAL_NOTES_ENDPOINT;

const SAUCE_PROFILE_STORAGE_PREFIX = 'sauce_profile_v1';

/* ==========================================
   GLOBAL EXPORTS + API FAILOVER
   ========================================== */

const SECONDARY_API_URL = APP_ENDPOINTS[1] || '';
const TERTIARY_API_URL = APP_ENDPOINTS[2] || '';
const OUTREACH_MAP_ADDRESS = '44550 Monroe Street, Indio, CA 92201';
const OUTREACH_MAP_EMBED_URL = 'https://www.google.com/maps?q=44550+Monroe+Street,+Indio,+CA+92201&output=embed';
const OUTREACH_DIRECTIONS_URL = 'https://www.google.com/maps/dir/?api=1&destination=44550+Monroe+Street,+Indio,+CA+92201';
const API_ENDPOINTS = APP_ENDPOINTS;

window.APP_CONFIG = APP_CONFIG;
window.MASTER_API_URL = MASTER_API_URL;
window.APP_ENDPOINTS = APP_ENDPOINTS;
window.API_ENDPOINTS = API_ENDPOINTS;
window.SECONDARY_API_URL = SECONDARY_API_URL;
window.TERTIARY_API_URL = TERTIARY_API_URL;
window.OUTREACH_MAP_ADDRESS = OUTREACH_MAP_ADDRESS;
window.OUTREACH_MAP_EMBED_URL = OUTREACH_MAP_EMBED_URL;
window.OUTREACH_DIRECTIONS_URL = OUTREACH_DIRECTIONS_URL;
window.AUTH_SESSION_KEY = AUTH_SESSION_KEY;
window.AUTH_PROFILE_KEY = AUTH_PROFILE_KEY;
window.AUTH_PROFILE_CACHE_TTL_MS = AUTH_PROFILE_CACHE_TTL_MS;
window.AUTH_ALLOW_LOCAL_MOCK = AUTH_ALLOW_LOCAL_MOCK;
window.AUTH_ROLE_ALLOWLIST = AUTH_ROLE_ALLOWLIST;
window.AUTH_STATUS_ALLOWLIST = AUTH_STATUS_ALLOWLIST;
window.AUTH_SHEET_TABS = AUTH_SHEET_TABS;
window.AUTH_ENDPOINT_ACTIONS = AUTH_ENDPOINT_ACTIONS;
window.AUTH_ENDPOINTS = AUTH_ENDPOINTS;
window.AUTH_ENDPOINT_FALLBACKS = AUTH_ENDPOINT_FALLBACKS;
window.PRAYER_REQUEST_ENDPOINT = PRAYER_REQUEST_ENDPOINT;
window.PASTORAL_NOTES_ENDPOINT = PASTORAL_NOTES_ENDPOINT;
window.PASTORAL_DB_V2_ENDPOINT = PASTORAL_DB_V2_ENDPOINT;
window.TODO_ENDPOINT = TODO_ENDPOINT;

if (!window.__ATOG_FETCH_FAILOVER_INSTALLED) {
   const API_FAILOVER_DELAY_MS = 1500;
   const API_PRIMARY_CHECK_INTERVAL_MS = 30000;
   const API_PING_REFRESH_MS = 45000;
   const API_MIN_LOADING_DELAY_MS = 350;
   let apiActiveIndex = 0;
   let apiFailureSince = null;
   let apiPrimaryCheckTimer = null;
   let apiLastPingAt = [0, 0, 0]; // per-endpoint last successful ping timestamp
   let apiPingInFlight = null;
   let apiOverlayEl = null;
   let apiOverlayTextEl = null;
   let apiOverlayTimer = null;
   let apiOverlayMessageIndex = 0;
   let apiOverlayActiveRequests = 0;
   let apiActiveRequests = 0;
   let apiLastAttemptCount = 0;
   let apiLastLatencyMs = 0;
   let apiLastSuccessfulIndex = 0;
   let apiLastTriedIndex = 0;
   let apiLastSuccessAt = 0;
   let apiLastErrorAt = 0;
   const apiResponseCache = new Map();
   const API_RESPONSE_CACHE_TTL_MS = 20 * 60 * 1000;
   const API_SITEWIDE_SYNC_INTERVAL_MS = 3 * 60 * 1000;
   const API_SITEWIDE_SYNC_CONCURRENCY = 4;
   const API_SITEWIDE_SYNC_BASE_TABS = [
      'Devotionals',
      'Reading',
      'Words',
      'Counseling',
      'Books',
      'Genealogy',
      'Theology',
      'Mirror',
      'Heart',
      'Quiz',
      'Psalms',
      'Family',
      'Apologetics'
   ];
   let apiSitewideSyncTimer = null;
   let apiSitewideSyncInFlight = null;
   let apiSitewideReadySignaled = false;
   const originalFetch = window.fetch.bind(window);

   /* Traffic monitoring for cellular bars */
   const apiTrafficWindow = {
      requests: [],
      windowMs: 2500,
      maxBars: 5,
      barThresholds: [2, 5, 10, 20, 30]
   };

   function apiTrackRequest() {
      const now = Date.now();
      apiTrafficWindow.requests.push(now);
      
      // Clean old requests outside window
      apiTrafficWindow.requests = apiTrafficWindow.requests.filter(
         timestamp => (now - timestamp) < apiTrafficWindow.windowMs
      );

      // Dispatch event for UI update
      window.dispatchEvent(new CustomEvent('aos:api-traffic-update', { 
         detail: { requestCount: apiTrafficWindow.requests.length }
      }));
   }

   window.apiGetTrafficBars = function() {
      const now = Date.now();
      const count = apiTrafficWindow.requests.filter(
         timestamp => (now - timestamp) < apiTrafficWindow.windowMs
      ).length;
      
      // Reverse: fewer active requests = stronger signal
      // Heavy traffic drops bars, idle = full bars
      if (count >= 30) return 1;
      if (count >= 20) return 1;
      if (count >= 10) return 2;
      if (count >= 5)  return 3;
      if (count >= 2)  return 3;
      return 4;
   };

   function apiDelay(ms) {
      return new Promise(resolve => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
   }

   function apiEnsureStatusStyles() {
      if (!document.getElementById('starlink-fetch-style')) {
         const style = document.createElement('style');
         style.id = 'starlink-fetch-style';
         style.textContent = `
            body.starlink-fetch-lock {
               overflow: hidden !important;
            }
            #starlink-fetch-overlay {
               position: fixed;
               inset: 0;
               z-index: 99999;
               display: flex;
               align-items: center;
               justify-content: center;
               background: rgba(2, 6, 23, 0.35);
               backdrop-filter: blur(14px) saturate(1.05);
               -webkit-backdrop-filter: blur(14px) saturate(1.05);
               opacity: 0;
               transition: opacity 0.24s ease;
               pointer-events: none;
               overflow: hidden;
            }
            #starlink-fetch-overlay.is-visible {
               opacity: 1;
               pointer-events: auto;
            }

            /* ── Dove ── */
            .dove-spirit {
               position: absolute;
               font-size: 42px;
               filter: drop-shadow(0 0 18px rgba(255,255,255,0.45)) drop-shadow(0 0 40px rgba(186,230,253,0.3));
               z-index: 2;
               animation: dove-soar 6s ease-in-out infinite;
               pointer-events: none;
               will-change: transform;
            }
            @keyframes dove-soar {
               0%   { transform: translate(0, 0)       rotate(-3deg)  scale(1);    opacity: 1; }
               12%  { transform: translate(60px, -45px) rotate(4deg)   scale(1.05); opacity: 1; }
               25%  { transform: translate(120px, -20px) rotate(-2deg) scale(0.97); opacity: 1; }
               37%  { transform: translate(50px, 30px)  rotate(5deg)   scale(1.03); opacity: 1; }
               50%  { transform: translate(-40px, 50px) rotate(-4deg)  scale(1);    opacity: 1; }
               62%  { transform: translate(-110px, 10px) rotate(3deg)  scale(1.04); opacity: 1; }
               75%  { transform: translate(-80px, -55px) rotate(-5deg) scale(0.96); opacity: 1; }
               87%  { transform: translate(-20px, -30px) rotate(2deg)  scale(1.02); opacity: 1; }
               100% { transform: translate(0, 0)       rotate(-3deg)  scale(1);    opacity: 1; }
            }

            #starlink-fetch-overlay.is-departing .dove-spirit {
               animation: dove-depart 1.1s ease-in forwards !important;
            }
            @keyframes dove-depart {
               0%   { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
               30%  { transform: translate(30px, -20px) rotate(-8deg) scale(1.15); opacity: 1; }
               100% { transform: translate(200px, -320px) rotate(-25deg) scale(0.3); opacity: 0; }
            }

            .starlink-fetch-shell {
               width: min(760px, calc(100vw - 28px));
               border: 1px solid rgba(186, 230, 253, 0.35);
               border-radius: 16px;
               background: linear-gradient(145deg, rgba(2, 6, 23, 0.92), rgba(15, 23, 42, 0.88));
               box-shadow: 0 16px 42px rgba(0, 0, 0, 0.5), 0 0 60px rgba(186, 230, 253, 0.06);
               overflow: hidden;
               position: relative;
               z-index: 1;
            }
            .starlink-fetch-row {
               display: flex;
               align-items: center;
               gap: 10px;
               padding: 12px 14px;
               color: #e0f2fe;
               font-family: 'JetBrains Mono', monospace;
               font-size: 12px;
               letter-spacing: 0.8px;
               text-transform: uppercase;
               white-space: nowrap;
               overflow: hidden;
               text-overflow: ellipsis;
            }
            .starlink-fetch-bar {
               height: 4px;
               width: 100%;
               background: rgba(148, 163, 184, 0.18);
               overflow: hidden;
            }
            .starlink-fetch-bar::before {
               content: '';
               display: block;
               width: 38%;
               height: 100%;
               background: linear-gradient(90deg, rgba(255,255,255,0.7), #bae6fd, #e0f2fe);
               animation: dove-loading 1.4s ease-in-out infinite;
            }
            @keyframes dove-loading {
               0% { transform: translateX(-120%); }
               100% { transform: translateX(360%); }
            }
            #starlink-fetch-text {
               animation: dove-message-fade 2500ms ease-in-out 1 both;
            }
            @keyframes dove-message-fade {
               0%   { opacity: 0; }
               8%   { opacity: 1; }
               92%  { opacity: 1; }
               100% { opacity: 0; }
            }
         `;
         document.head.appendChild(style);
      }
   }

   const STARLINK_OVERLAY_MESSAGES = [
      'Parting the digital sea...',
      'Gathering daily manna...',
      'Exegeting the data...',
      'Rightly dividing the bytes...',
      'Rebuilding the firewall...',
      'Sending out the dove...',
      'Casting nets on the right...',
      'Translating from Greek...',
      'Girding up the servers...',
      'Seeking ancient paths...',
      'Gleaning the data fields...',
      'Let there be bandwidth...',
      'Unrolling the scrolls...',
      'Consulting the Urim...',
      'Filling the oil lamps...',
      'Sowing the good seed...',
      'Measuring the temple...',
      'Formatting the tablets...',
      'Drawing from the well...',
      'Sounding the shofar...',
      'Guarding the gates...',
      'Binding the strongman...',
      'Watching for the cloud...',
      'Searching the scriptures...'
   ];

   function apiEnsureOverlay() {
      if (apiOverlayEl && document.body && document.body.contains(apiOverlayEl)) return;

      apiEnsureStatusStyles();

      if (!document.body) return;

      apiOverlayEl = document.createElement('div');
      apiOverlayEl.id = 'starlink-fetch-overlay';
      apiOverlayEl.innerHTML = `
         <span class="dove-spirit" aria-hidden="true">🕊️</span>
         <div class="starlink-fetch-shell">
            <div class="starlink-fetch-row">
               <span id="starlink-fetch-text">Sending out the dove...</span>
            </div>
            <div class="starlink-fetch-bar"></div>
         </div>
      `;
      document.body.appendChild(apiOverlayEl);
      apiOverlayTextEl = document.getElementById('starlink-fetch-text');
   }

   function apiSetOverlayMessage(idx) {
      if (!apiOverlayTextEl) return;
      const safeIndex = ((idx % STARLINK_OVERLAY_MESSAGES.length) + STARLINK_OVERLAY_MESSAGES.length) % STARLINK_OVERLAY_MESSAGES.length;
      
      // Restart animation by removing and re-adding it
      apiOverlayTextEl.style.animation = 'none';
      void apiOverlayTextEl.offsetWidth; // Trigger reflow to restart animation
      apiOverlayTextEl.style.animation = 'dove-message-fade 2500ms ease-in-out 1 both';
      
      apiOverlayTextEl.textContent = STARLINK_OVERLAY_MESSAGES[safeIndex];
   }

   let apiShowOverlayEnabled = false;
   let apiInitialLoadComplete = false;
   
   function apiShowOverlay() {
      apiEnsureOverlay();
      if (!apiOverlayEl) return;
      
      // Only show overlay after initial load is complete
      if (!apiInitialLoadComplete) return;
      
      const isAlreadyVisible = apiOverlayEl.classList.contains('is-visible');
      
      apiSetOverlayMessage(apiOverlayMessageIndex);
      apiOverlayEl.classList.add('is-visible');
      if (document.body) document.body.classList.add('starlink-fetch-lock');

      // Only restart timer if overlay was already visible (new data pull)
      if (isAlreadyVisible) {
         if (apiOverlayTimer) {
            clearInterval(apiOverlayTimer);
            apiOverlayTimer = null;
         }
         apiOverlayTimer = setInterval(() => {
            apiOverlayMessageIndex = (apiOverlayMessageIndex + 1) % STARLINK_OVERLAY_MESSAGES.length;
            apiSetOverlayMessage(apiOverlayMessageIndex);
         }, 2500);
      } else if (!apiOverlayTimer) {
         // Start timer for subsequent pulls
         apiOverlayTimer = setInterval(() => {
            apiOverlayMessageIndex = (apiOverlayMessageIndex + 1) % STARLINK_OVERLAY_MESSAGES.length;
            apiSetOverlayMessage(apiOverlayMessageIndex);
         }, 2500);
      }
   }

   function apiHideOverlay() {
      if (apiOverlayTimer) {
         clearInterval(apiOverlayTimer);
         apiOverlayTimer = null;
      }
      if (!apiOverlayEl || !apiOverlayEl.classList.contains('is-visible')) return;

      // Trigger dove fly-away, then fade the overlay
      apiOverlayEl.classList.add('is-departing');
      setTimeout(() => {
         apiOverlayEl.classList.remove('is-visible', 'is-departing');
         if (document.body) document.body.classList.remove('starlink-fetch-lock');
      }, 1100);
   }

   function apiBeginRequest(showOverlay) {
      apiActiveRequests += 1;

      if (showOverlay) {
         apiOverlayActiveRequests += 1;
         apiShowOverlay();
      }
   }

   function apiEndRequest(showOverlay) {
      if (showOverlay) {
         apiOverlayActiveRequests = Math.max(0, apiOverlayActiveRequests - 1);
         if (apiOverlayActiveRequests === 0) apiHideOverlay();
      }

      apiActiveRequests = Math.max(0, apiActiveRequests - 1);
   }

   function apiIsManagedUrl(url) {
      return API_ENDPOINTS.some(endpoint => url.startsWith(endpoint));
   }

   function apiBuildUrl(url, targetIndex) {
      let nextUrl = url;
      API_ENDPOINTS.forEach((endpoint) => {
         if (url.startsWith(endpoint)) {
            nextUrl = API_ENDPOINTS[targetIndex] + url.slice(endpoint.length);
         }
      });
      return nextUrl;
   }

   function apiBuildHealthCheckUrl(targetIndex = 0) {
      return `${API_ENDPOINTS[targetIndex]}?tab=Config&_=${Date.now()}`;
   }

   function apiNormalizeManagedUrl(url) {
      try {
         const parsed = new URL(String(url || ''), window.location.href);
         if (!apiIsManagedUrl(parsed.href)) return '';

         const normalized = new URL(parsed.href);
         API_ENDPOINTS.forEach((endpoint) => {
            if (normalized.href.startsWith(endpoint)) {
               normalized.href = API_ENDPOINTS[0] + normalized.href.slice(endpoint.length);
            }
         });

         normalized.searchParams.delete('_');
         return normalized.toString();
      } catch {
         return '';
      }
   }

   function apiStoreCachedResponse(url, response, bodyText) {
      const key = apiNormalizeManagedUrl(url);
      if (!key) return;

      const headers = {};
      try {
         response.headers.forEach((value, name) => {
            headers[name] = value;
         });
      } catch {}

      apiResponseCache.set(key, {
         bodyText: String(bodyText || ''),
         status: Number(response.status || 200),
         headers,
         cachedAt: Date.now()
      });
   }

   function apiBuildCachedResponse(url) {
      const key = apiNormalizeManagedUrl(url);
      if (!key) return null;
      const cached = apiResponseCache.get(key);
      if (!cached) return null;
      if ((Date.now() - Number(cached.cachedAt || 0)) > API_RESPONSE_CACHE_TTL_MS) {
         apiResponseCache.delete(key);
         return null;
      }

      return new Response(cached.bodyText, {
         status: Number(cached.status || 200),
         headers: cached.headers || { 'content-type': 'application/json' }
      });
   }

   function apiShouldCacheManagedResponse(url, method) {
      const key = apiNormalizeManagedUrl(url);
      const normalizedMethod = String(method || 'GET').toUpperCase();
      return !!key && normalizedMethod === 'GET';
   }

   function apiGetSitewideSyncTabs() {
      const set = new Set(API_SITEWIDE_SYNC_BASE_TABS);
      if (Array.isArray(window.missionList)) {
         window.missionList.forEach((item) => {
            const tabName = String((item && (item.tabName || item.name)) || '').trim();
            if (tabName) set.add(tabName);
         });
      }
      return Array.from(set);
   }

   async function apiSyncTab(tabName) {
      const cleanTab = String(tabName || '').trim();
      if (!cleanTab) return;
      try {
         await window.fetch(`${MASTER_API_URL}?tab=${encodeURIComponent(cleanTab)}&_=${Date.now()}`, {
            method: 'GET',
            cache: 'no-store',
            signal: AbortSignal.timeout(9000),
            __atogBackgroundSync: true
         });
      } catch {
         // Background sync should be best-effort.
      }
   }

   async function apiRunSitewideSyncPass() {
      if (apiSitewideSyncInFlight) return apiSitewideSyncInFlight;

      const tabs = apiGetSitewideSyncTabs();
      let cursor = 0;
      const worker = async () => {
         while (cursor < tabs.length) {
            const tab = tabs[cursor++];
            await apiSyncTab(tab);
            await apiDelay(80);
         }
      };

      apiSitewideSyncInFlight = Promise.all(
         Array.from({ length: Math.min(API_SITEWIDE_SYNC_CONCURRENCY, Math.max(1, tabs.length)) }, () => worker())
      ).finally(() => {
         apiSitewideSyncInFlight = null;
      });

      return apiSitewideSyncInFlight;
   }

   window.__ATOG_SITEWIDE_SYNC_READY__ = false;
   window.__ATOG_SITEWIDE_SYNC_READY_PROMISE__ = Promise.resolve();

   window.startSitewideAppSync = function() {
      const firstPassPromise = apiRunSitewideSyncPass()
         .catch(() => {})
         .finally(() => {
            if (apiSitewideReadySignaled) return;
            apiSitewideReadySignaled = true;
            apiInitialLoadComplete = true;
            window.__ATOG_SITEWIDE_SYNC_READY__ = true;
            window.dispatchEvent(new CustomEvent('aos:sitewide-sync-ready'));
         });

      window.__ATOG_SITEWIDE_SYNC_READY_PROMISE__ = firstPassPromise;

      if (apiSitewideSyncTimer) return;
      apiSitewideSyncTimer = setInterval(() => {
         apiRunSitewideSyncPass();
      }, API_SITEWIDE_SYNC_INTERVAL_MS);

      return firstPassPromise;
   };

   window.stopSitewideAppSync = function() {
      if (!apiSitewideSyncTimer) return;
      clearInterval(apiSitewideSyncTimer);
      apiSitewideSyncTimer = null;
   };

   /* App-level data preloading on startup */
   window.preloadAllAppData = async function() {
      const loaders = [
         { name: 'Words', fn: () => typeof wordsLoadData === 'function' && wordsLoadData(true) },
         { name: 'Bread', fn: () => typeof breadPreloadData === 'function' && breadPreloadData() },
         { name: 'Contact', fn: () => typeof loadContactCardData === 'function' && loadContactCardData() },
         { name: 'MemberPortal', fn: () => typeof preloadMemberPortalData === 'function' && preloadMemberPortalData(false) },
         { name: 'Characters', fn: () => typeof charactersFetchDatabase === 'function' && charactersFetchDatabase() },
         { name: 'Heart', fn: () => typeof heartFetchQuestions === 'function' && heartFetchQuestions(true) },
         { name: 'BibleQuiz', fn: () => typeof quizLoadData === 'function' && quizLoadData() },
         { name: 'Apologetics', fn: () => typeof apologeticsAppFetchAndBuildData === 'function' && apologeticsAppFetchAndBuildData() },
         { name: 'Mirror', fn: () => typeof mirrorFetchData === 'function' && mirrorFetchData() },
         { name: 'Prayer Response (Secure)', fn: () => typeof preloadSecurePrayerResponses === 'function' && preloadSecurePrayerResponses() }
      ];

      const results = await Promise.allSettled(
         loaders.map(async (loader) => {
            try {
               if (loader.fn) {
                  await loader.fn();
                  console.log(`[PreLoad] ${loader.name} app data loaded`);
               }
            } catch (e) {
               console.warn(`[PreLoad] ${loader.name} failed:`, e);
            }
         })
      );

      window.__ATOG_APP_PRELOAD_DONE__ = true;
      window.dispatchEvent(new CustomEvent('aos:app-preload-ready'));
      return results;
   };

   function apiEnsurePing(targetIndex) {
      const now = Date.now();
      const idx = targetIndex || 0;
      if (now - (apiLastPingAt[idx] || 0) < API_PING_REFRESH_MS) return;
      if (apiPingInFlight) return;

      // Fire-and-forget — does not block the real request
      apiPingInFlight = originalFetch(apiBuildHealthCheckUrl(idx), {
         method: 'GET',
         cache: 'no-store'
      })
         .then((response) => {
            if (response && response.ok) apiLastPingAt[idx] = Date.now();
         })
         .catch(() => {})
         .finally(() => {
            apiPingInFlight = null;
         });
   }

   async function apiAttemptFetch(input, init, targetIndex) {
      const url = typeof input === 'string' ? input : input.url;
      const nextUrl = apiBuildUrl(url, targetIndex);
      const request = typeof input === 'string' ? nextUrl : new Request(nextUrl, input);
      const response = await originalFetch(request, init);
      if (!response.ok) {
         throw new Error(`HTTP ${response.status}`);
      }
      return response;
   }

   async function apiAttemptAcrossEndpoints(input, init, startIndex) {
      let lastError = null;
      let attempts = 0;
      for (let offset = 0; offset < API_ENDPOINTS.length; offset += 1) {
         const candidateIndex = (startIndex + offset) % API_ENDPOINTS.length;
         attempts += 1;
         apiLastTriedIndex = candidateIndex;
         try {
            const response = await apiAttemptFetch(input, init, candidateIndex);
            apiActiveIndex = candidateIndex;
            apiFailureSince = null;
            if (apiActiveIndex !== 0) {
               apiSchedulePrimaryCheck();
            }
            return {
               response,
               attempts,
               endpointIndex: candidateIndex
            };
         } catch (candidateError) {
            lastError = candidateError;
         }
      }
      const finalError = lastError || new Error('All API endpoints failed');
      finalError.apiAttempts = attempts;
      throw finalError;
   }

   function apiSchedulePrimaryCheck() {
      if (apiPrimaryCheckTimer) return;
      apiPrimaryCheckTimer = setInterval(async () => {
         if (apiActiveIndex === 0) {
            clearInterval(apiPrimaryCheckTimer);
            apiPrimaryCheckTimer = null;
            return;
         }

         try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const response = await originalFetch(apiBuildHealthCheckUrl(0), {
               method: 'GET',
               cache: 'no-store',
               signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (response.ok) {
               apiActiveIndex = 0;
               apiFailureSince = null;
               clearInterval(apiPrimaryCheckTimer);
               apiPrimaryCheckTimer = null;
            }
         } catch (error) {
            // Keep waiting for primary to recover.
         }
      }, API_PRIMARY_CHECK_INTERVAL_MS);
   }

   window.fetch = async function(input, init) {
      const url = typeof input === 'string' ? input : input.url;
      if (!apiIsManagedUrl(url)) {
         return originalFetch(input, init);
      }

      const method = String((init && init.method) || (typeof input !== 'string' && input.method) || 'GET').toUpperCase();
      const isHeadRequest = method === 'HEAD';
      const isBackgroundSync = !!(init && init.__atogBackgroundSync === true);
      const bootSettled = window.__ATOG_SITEWIDE_SYNC_READY__ === true;
      const useOverlay = !isHeadRequest && !isBackgroundSync && !bootSettled;

      if (!isBackgroundSync) {
         apiBeginRequest(useOverlay);
      }
      const requestStart = Date.now();
      
      // Track traffic for cellular bars
      apiTrackRequest();

      try {
         apiEnsurePing(apiActiveIndex); // fire-and-forget warmup, no added latency
         const result = await apiAttemptAcrossEndpoints(input, init, apiActiveIndex);
         apiLastAttemptCount = Number(result.attempts || 1);
         apiLastSuccessfulIndex = Number(result.endpointIndex || 0);
         apiLastLatencyMs = Date.now() - requestStart;
         apiLastSuccessAt = Date.now();

         if (apiShouldCacheManagedResponse(url, method) && result.response && typeof result.response.clone === 'function') {
            try {
               const cloned = result.response.clone();
               const bodyText = await cloned.text();
               apiStoreCachedResponse(url, result.response, bodyText);
            } catch {
               // Ignore cache storage failures.
            }
         }

         return result.response;
      } catch (error) {
         const now = Date.now();
         if (!apiFailureSince) {
            apiFailureSince = now;
         }

         apiLastAttemptCount = Number(error && error.apiAttempts ? error.apiAttempts : API_ENDPOINTS.length);
         apiLastLatencyMs = Date.now() - requestStart;
         apiLastErrorAt = now;

         if (now - apiFailureSince >= API_FAILOVER_DELAY_MS && apiActiveIndex < API_ENDPOINTS.length - 1) {
            apiActiveIndex += 1;
            apiFailureSince = now;
         }

         if (apiShouldCacheManagedResponse(url, method)) {
            const cachedResponse = apiBuildCachedResponse(url);
            if (cachedResponse) {
               return cachedResponse;
            }
         }

         throw error;
      } finally {
         const elapsed = Date.now() - requestStart;
         if (!isBackgroundSync && useOverlay && elapsed < API_MIN_LOADING_DELAY_MS) {
            await apiDelay(API_MIN_LOADING_DELAY_MS - elapsed);
         }
         if (!isBackgroundSync) {
            apiEndRequest(useOverlay);
         }
      }
   };

   window.apiGetActiveIndex = () => apiActiveIndex;
    window.apiGetFailoverDiagnostics = () => ({
      activeIndex: apiActiveIndex,
      lastAttemptCount: apiLastAttemptCount,
      lastLatencyMs: apiLastLatencyMs,
      lastSuccessfulIndex: apiLastSuccessfulIndex,
      lastTriedIndex: apiLastTriedIndex,
      lastSuccessAt: apiLastSuccessAt,
      lastErrorAt: apiLastErrorAt
   });
   window.__ATOG_FETCH_FAILOVER_INSTALLED = true;
}