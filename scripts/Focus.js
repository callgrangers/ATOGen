/**
 * FOCUS.JS 
 * Part of the A Touch of the Gospel OS
 * Handles Daily Country Intercession & Dossier
 */

const focusMissionListFallback = [
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

function focusGetMissionList() {
    if (typeof missionList !== 'undefined' && Array.isArray(missionList) && missionList.length) {
        return missionList;
    }
    return focusMissionListFallback;
}

function focusGetDayOfYear() {
    if (typeof dayOfYear === 'function') return dayOfYear(new Date());
    return Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
}

function focusGetTodaysCountry() {
    const activeList = focusGetMissionList();
    const day = Math.max(1, focusGetDayOfYear());
    const countryIndex = (day - 1) % activeList.length;
    return { activeList, countryIndex, focusCountry: activeList[countryIndex] };
}

// 1. UPDATE FOCUS BUTTON ICON TO MATCH TODAY'S COUNTRY
function updateFocusButton() {
    const btn = document.getElementById('app-focus');
    if (!btn) return;
    const { focusCountry } = focusGetTodaysCountry();
    const iconEl = btn.querySelector('.app-icon');
    if (focusCountry && iconEl) iconEl.textContent = focusCountry.icon;
}

// 2. BRIDGE FOR MAIN.JS
// This connects your main.js path { path: '/focus'... } to the logic below
window.openTodaysFocusCountry = function() {
    const context = focusGetTodaysCountry();

    // Prefer direct dossier open to mirror Bread's daily focus behavior.
    if (typeof openMission === 'function' && context.focusCountry) {
        openMission(context.focusCountry, false, true);
        return;
    }

    openFocus(context);
};

// 2. MAIN APP LAUNCHER
function openFocus(context) {
    const container = document.getElementById('modal-body-container');
    const modal = document.getElementById('data-modal');
    if (!container || !modal) return;

    const resolved = context || focusGetTodaysCountry();
    const focusCountry = resolved.focusCountry;
    const countryIndex = resolved.countryIndex;

    if (!focusCountry) {
        container.innerHTML = `
            <div style="text-align:center; padding:50px; color:var(--accent-magenta); font-family:'JetBrains Mono';">
                <p>FOCUS DATA UNAVAILABLE</p>
                <p style="font-size:0.7rem; opacity:0.6; margin-top:10px;">Retry after Starlink sync completes.</p>
            </div>`;
        modal.classList.add('active');
        return;
    }

    // Set Modal Headers
    document.getElementById('modal-title').innerText = "GLOBAL FOCUS";
    document.getElementById('modal-subtitle').innerText = "DAILY INTERCESSION";
    document.getElementById('modal-back-text').innerText = "CLOSE";

    // Inject original HTML structure
    container.innerHTML = `
        <div class="fade-in" style="padding: 20px;">
            <div class="focus-country-card">
                <div class="focus-header-row">
                    <div class="focus-flag-shell">
                        <div class="focus-icon">${focusCountry.icon || '📍'}</div>
                    </div>
                    <div class="focus-meta">
                        <div class="focus-label">Daily Focus Country</div>
                        <div class="focus-title">${focusCountry.name}</div>
                        <button class="focus-btn" onclick="openFocusCountry(${countryIndex}, true)">Load Dossier</button>
                    </div>
                </div>
            </div>
            <div id="dossier-details" class="fade-in"></div>
        </div>
    `;

    modal.classList.add('active');
}

// 3. DOSSIER DETAILS RENDERER
// This renders the specific prayer points and status from your Missions logic
window.openFocusCountry = function(index, fromBread = false) {
    const activeList = focusGetMissionList();
    const country = activeList[index];
    const detailArea = document.getElementById('dossier-details');

    if (!country) return;

    if (typeof openMission === 'function') {
        openMission(country, fromBread);
        return;
    }

    detailArea.innerHTML = `
        <div style="margin-top:20px; background:rgba(255,255,255,0.03); padding:25px; border-radius:12px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-family:'JetBrains Mono'; color:var(--accent-magenta); font-size:0.65rem; text-transform:uppercase; margin-bottom:15px; letter-spacing:2px; font-weight:800;">
                Strategic Prayer Focus
            </div>
            
            <p style="font-family:'Merriweather', serif; color:white; line-height:1.8; font-style:italic; font-size:1.1rem; margin-bottom:20px;">
                "${country.focus || 'Pray for the peace of this nation and the advancement of the Gospel.'}"
            </p>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; border-top:1px solid rgba(255,255,255,0.05); pt:15px; margin-top:15px;">
                <div>
                    <span style="display:block; font-size:0.6rem; color:var(--accent-cyan); text-transform:uppercase; font-family:'JetBrains Mono';">Current Status</span>
                    <span style="color:white; font-family:'JetBrains Mono'; font-size:0.85rem;">${country.status || 'Active'}</span>
                </div>
                <div>
                    <span style="display:block; font-size:0.6rem; color:var(--accent-cyan); text-transform:uppercase; font-family:'JetBrains Mono';">Priority Level</span>
                    <span style="color:white; font-family:'JetBrains Mono'; font-size:0.85rem;">${country.priority || 'High'}</span>
                </div>
            </div>
        </div>
    `;
};