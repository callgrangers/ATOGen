// ==========================================
// APP: BREAD
// ==========================================

// Failsafe Mission List in case the global one isn't loaded
const breadMissionListFallback = [
    { name: "Afghanistan", icon: "🇦🇫" }, { name: "Belarus", icon: "🇧🇾" }, { name: "Cambodia", icon: "🇰🇭" },
    { name: "China", icon: "🇨🇳" }, { name: "France", icon: "🇫🇷" }, { name: "Germany", icon: "🇩🇪" },
    { name: "Guatemala", icon: "🇬🇹" }, { name: "India", icon: "🇮🇳" }, { name: "Colombia", icon: "🇨🇴" },
    { name: "Nigeria", icon: "🇳🇬" }, { name: "North Korea", icon: "🇰🇵", tabName: "NKorea" }, { name: "Iran", icon: "🇮🇷" }
];

async function breadPreloadData() {
    if (cachedPlan.length > 0) return;

    const [devosRaw, planRaw, wordsRaw] = await Promise.all([
        fetch(`${MASTER_API_URL}?tab=Devotionals`).then(res => res.json()).catch(() => []),
        fetch(`${MASTER_API_URL}?tab=Reading`).then(res => res.json()).catch(() => []),
        fetch(`${MASTER_API_URL}?tab=Words`).then(res => res.json()).catch(() => [])
    ]);

    const extractData = (payload) => Array.isArray(payload) ? payload : (payload?.data || payload?.rows || payload?.result || []);

    const safeDevos = extractData(devosRaw);
    const safePlan = extractData(planRaw);
    const safeWordsRaw = extractData(wordsRaw);

    let mIdx = 0, dIM = 1;
    cachedPlan = [];
    for (let i = 0; i < safePlan.length; i++) {
        if (mIdx > 11) break;
        const row = safePlan[i];
        const cleanDate = `${months[mIdx]} ${dIM}`;
        cachedPlan.push({
            day: i + 1, date: cleanDate, mIdx: mIdx,
            ot: row.ot || row.old_testament || row['old testament'] || '',
            nt: row.nt || row.new_testament || row['new testament'] || '',
            ps: row.ps || row.psalms || row.psalm || '',
            pr: row.pr || row.proverbs || row.proverb || ''
        });
        dIM++;
        if (dIM > daysInMonth[mIdx]) {
            dIM = 1;
            mIdx++;
        }
    }

    cachedDevos = safeDevos.map(d => ({
        date: d.date || d.day || '',
        title: d.title || d.devo_title || d.devotional_title || 'Daily Devotional',
        theme: d.theme || d.focus || '',
        scripture: d.scripture || d.verse || '',
        reflection: d.reflection || d.body || '',
        question: d.question || d.reflection_question || '',
        prayer: d.prayer || d.closing_prayer || ''
    })).filter(d => d.title && String(d.title).trim() !== '');

    if (typeof normalizeContactWords === 'function') {
        cachedWords = normalizeContactWords(safeWordsRaw);
    } else {
        cachedWords = [];
    }
}

window.breadPreloadData = breadPreloadData;

function resolveBreadDisplayName() {
    const raw = String(localStorage.getItem('app_firstname') || '').trim();
    if (!raw) return 'Beloved';

    // Local values should not override the desired devotional salutation.
    if (/^greg(\s|$)/i.test(raw)) {
        localStorage.setItem('app_firstname', 'Beloved');
        return 'Beloved';
    }

    return raw;
}

function getBreadTodayDay(planLength) {
    const total = Math.max(1, Number(planLength) || 365);
    const todayDay = typeof dayOfYear === 'function' ? dayOfYear(new Date()) : 1;
    return Math.max(1, Math.min(total, todayDay));
}

async function openIntel() {
    const firstName = resolveBreadDisplayName();
    document.getElementById('modal-back-text').innerText = "CLEAR";
    document.getElementById('modal-back-btn').onclick = () => closeModal();

    document.getElementById('modal-title').innerText = "DAILY BREAD";
    document.getElementById('modal-subtitle').innerText = "READING PLAN & DEVOTIONALS";
    const container = document.getElementById('modal-body-container');
    
    container.innerHTML = `
        <div class="bread-protocol-card fade-in">
            <div class="bread-protocol-kicker">⚡ Bread Protocol</div>
            <div class="bread-protocol-line">
                <span style="color: var(--accent-cyan); display:block;">${firstName},</span>
                <span style="display:block; padding-left: 14px;">Read Bible. Obey Bible. Repeat.</span>
            </div>
        </div>
        <div class="intel-nav">
            <button onclick="switchIntelTab('today')" id="tab-today" class="active">TODAY</button>
            <button onclick="switchIntelTab('journey')" id="tab-journey">JOURNEY</button>
            <button onclick="switchIntelTab('library')" id="tab-library">LIBRARY</button>
        </div>
        <div id="intel-content"><div class="loader"> </div></div>
    `;
    document.getElementById('data-modal').classList.add('active');

    if(cachedPlan.length === 0) {
        try {
            await breadPreloadData();
        } catch(e) {
            const ic = document.getElementById('intel-content');
            if (ic) ic.innerHTML = `<div class="loader" style="animation:none; color:var(--accent-magenta);">STARLINK SYNC ERROR:<br><span style="font-size:0.9rem;">${e.message}</span></div>`;
            return;
        }
    }
    
    // Bread should always open at today's day index.
    intelState.currentDay = getBreadTodayDay(cachedPlan.length || 365);
    if (typeof updateFocusButton === 'function') updateFocusButton();

    switchIntelTab(intelState.tab);
}

window.switchIntelTab = function(tab) {
    intelState.tab = tab;
    document.querySelectorAll('.intel-nav button').forEach(b => b.classList.remove('active'));
    
    const targetTab = document.getElementById(`tab-${tab}`);
    if (targetTab) targetTab.classList.add('active');
    
    const content = document.getElementById('intel-content');
    if (!content) return;
    if(tab === 'today') renderIntelToday(content);
    if(tab === 'journey') renderIntelJourney(content);
    if(tab === 'library') renderIntelLibrary(content);
};

window.changeIntelDay = function(delta) {
    intelState.currentDay = Math.max(1, Math.min(cachedPlan.length, intelState.currentDay + delta));
    if (typeof updateFocusButton === 'function') updateFocusButton();
    const content = document.getElementById('intel-content');
    if (!content) return;
    renderIntelToday(content);
}

window.setIntelToday = function() {
    if (!cachedPlan.length) return;
    intelState.currentDay = getBreadTodayDay(cachedPlan.length);
    if (typeof updateFocusButton === 'function') updateFocusButton();
    const content = document.getElementById('intel-content');
    if (!content) return;
    renderIntelToday(content);
}

function renderIntelToday(container) {
    if (!container) return;
    try {
        if(!cachedPlan || cachedPlan.length === 0) {
            container.innerHTML = `<div class="loader" style="animation:none; color:var(--accent-magenta);">NO READING DATA FOUND IN SHEET.</div>`;
            return;
        }
        if (intelState.currentDay > cachedPlan.length) intelState.currentDay = cachedPlan.length;
        if (intelState.currentDay < 1) intelState.currentDay = 1;

        const d = cachedPlan[intelState.currentDay - 1];
        if (!d) return;

        let currentDevo = null;
        const year = new Date().getFullYear();
        const currentPlanDateString = new Date(year, 0, intelState.currentDay).toDateString();

        for (let devo of cachedDevos) {
            if (devo.date && new Date(devo.date).toDateString() === currentPlanDateString) {
                currentDevo = devo; 
                break;
            }
        }
        
        // Failsafe for the Mission List to prevent crashing
        const activeMissionList = (typeof missionList !== 'undefined' && missionList.length > 0) ? missionList : breadMissionListFallback;
        const countryIndex = (intelState.currentDay - 1) % activeMissionList.length;
        const focusCountry = activeMissionList[countryIndex] || { name: "Global Church", icon: "🌍" };
        
        const reflectionFirstName = resolveBreadDisplayName();

        let html = `
            <div class="bread-status-strip">
                <div class="bread-selector-wrap">
                    <div class="day-controls">
                        <button class="day-btn" onclick="changeIntelDay(-1)"><i data-lucide="chevron-left"></i></button>
                        <div class="bread-center-stack">
                            <div class="bread-exhort-wrap">
                                <div class="bread-exhort-badge">Day ${d.day} • ${d.date}</div>
                            </div>
                            <button class="day-today-btn" onclick="setIntelToday()">Today</button>
                        </div>
                        <button class="day-btn" onclick="changeIntelDay(1)"><i data-lucide="chevron-right"></i></button>
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
            
            <div class="scripture-grid">
                ${d.ot ? `<a href="${typeof getBibleLink === 'function' ? getBibleLink(d.ot) : '#'}" target="_blank" class="scripture-card"><span class="scripture-label">OLD TESTAMENT</span><span class="scripture-text">${d.ot}</span></a>` : ''}
                ${d.nt ? `<a href="${typeof getBibleLink === 'function' ? getBibleLink(d.nt) : '#'}" target="_blank" class="scripture-card"><span class="scripture-label">NEW TESTAMENT</span><span class="scripture-text">${d.nt}</span></a>` : ''}
                ${d.ps ? `<a href="${typeof getBibleLink === 'function' ? getBibleLink(d.ps) : '#'}" target="_blank" class="scripture-card"><span class="scripture-label">PSALMS</span><span class="scripture-text">${d.ps}</span></a>` : ''}
                ${d.pr ? `<a href="${typeof getBibleLink === 'function' ? getBibleLink(d.pr) : '#'}" target="_blank" class="scripture-card"><span class="scripture-label">PROVERBS</span><span class="scripture-text">${d.pr}</span></a>` : ''}
            </div>
        `;

        if(currentDevo) {
            html += `
                <div class="devo-container">
                    <h2 style="font-size:2.5rem; font-weight:900; color:var(--accent-gold); margin-top:0; margin-bottom:15px; line-height:1.2;">${currentDevo.title}</h2>
                    ${currentDevo.theme ? `<div class="devo-theme-badge">FOCUS: ${currentDevo.theme}</div>` : ''}
                    ${currentDevo.scripture ? `<div class="devo-scripture-quote">${currentDevo.scripture}</div>` : ''}
                    ${currentDevo.reflection ? `<div class="devo-application-box"><div class="devo-card-label">Practical Explanation for ${reflectionFirstName}</div><p class="devo-card-copy">${currentDevo.reflection}</p></div>` : ''}
                    ${currentDevo.question ? `<div class="devo-question-box"><div class="devo-card-label">Reflection Protocol for ${reflectionFirstName}</div><p class="devo-card-copy">${currentDevo.question}</p></div>` : ''}
                    
                    <div class="contact-reading-grid" style="margin-top:16px; margin-bottom:6px;">
                        ${typeof getWordOfDayCardsHtml === 'function' ? getWordOfDayCardsHtml(cachedWords, intelState.currentDay) : ''}
                    </div>
                    
                    ${currentDevo.prayer ? `<div style="text-align:center; padding-top:30px; border-top:1px solid rgba(255,255,255,0.1);"><div style="font-family:'JetBrains Mono'; font-weight:800; font-size:0.8rem; color:var(--text-muted); margin-bottom:15px; text-transform:uppercase;">Closing Prayer</div><div style="font-size:1.1rem; font-style:italic; color:white; line-height:1.6;">"${currentDevo.prayer}"</div></div>` : ''}
                    
                    <a href="/request" onclick="return navigateAppAnchor(event, '/request')" class="action-button">I Have Completed Today's Word</a>
                </div>
            `;
        } else {
            html += `<div class="devo-container"><div class="loader" style="animation:none; color:var(--accent-magenta); padding:30px;">NO DEVOTIONAL ENTRY FOUND FOR THIS DATE.</div></div>`;
        }
        
        container.innerHTML = html;
        if (window.lucide) lucide.createIcons();
        
    } catch(e) { 
        container.innerHTML = `
            <div style="padding:20px; background:rgba(244,63,94,0.1); border:1px solid #f43f5e; border-radius:12px; margin-bottom:20px;">
                <h3 style="color:#f43f5e; margin-top:0;">Render Error in Bread.js</h3>
                <p style="color:#e2e8f0; font-family:monospace;">${e.message}</p>
                <p style="color:#94a3b8; font-size:0.85rem; margin-bottom:0;">Please check the browser console for more details.</p>
            </div>
        `; 
        console.error("Bread App Render Error:", e);
    }
}

window.selJourneyDay = function(day) { 
    intelState.currentDay = day; 
    if (typeof updateFocusButton === 'function') updateFocusButton();
    switchIntelTab('today'); 
}

function renderIntelJourney(container) {
    if (!container) return;
    if (typeof getReadingWindowBounds !== 'function') return;
    const windowBounds = getReadingWindowBounds(cachedPlan.length);
    const visiblePlan = cachedPlan.slice(windowBounds.startDay - 1, windowBounds.endDay);
    
    let html = `<div style="overflow-x:auto; border:1px solid rgba(255,255,255,0.1); border-radius:20px; background:var(--panel-bg);"><table class="tactical-table"><thead><tr><th>Day</th><th>Old Testament</th><th>New Testament</th><th>Psalms</th><th>Proverbs</th></tr></thead><tbody>`;
    visiblePlan.forEach(d => {
        const isActive = d.day === intelState.currentDay ? 'active-row' : '';
        html += `<tr class="${isActive}" onclick="selJourneyDay(${d.day})"><td><div style="font-weight:900;">DAY ${d.day}</div><div style="font-size:0.8rem; color:var(--accent-cyan);">${d.date}</div></td><td style="color:#e2e8f0;">${d.ot}</td><td style="color:#e2e8f0;">${d.nt}</td><td style="color:#e2e8f0;">${d.ps}</td><td style="color:#e2e8f0;">${d.pr}</td></tr>`;
    });
    container.innerHTML = html + `</tbody></table></div>`;
    setTimeout(() => { 
        const active = container.querySelector('.active-row'); 
        if(active) active.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
    }, 50);
}

window.filterLibrary = function() {
    const query = document.getElementById('lib-search').value.toLowerCase();
    document.querySelectorAll('.lib-item').forEach(item => {
        const text = item.getAttribute('data-search').toLowerCase();
        item.style.display = text.includes(query) ? '' : 'none';
    });
}

window.selLibDay = function(day) { 
    if (typeof clampDayToWindow === 'function') {
        intelState.currentDay = clampDayToWindow(day, cachedPlan.length); 
    } else {
        intelState.currentDay = day;
    }
    if (typeof updateFocusButton === 'function') updateFocusButton();
    switchIntelTab('today'); 
}

function renderIntelLibrary(container) {
    if (!container) return;
    if(cachedDevos.length === 0 || cachedPlan.length === 0) { 
        container.innerHTML = `<div class="loader" style="animation:none;">NO DEVOTIONALS FOUND.</div>`; 
        return; 
    }
    if (typeof getReadingWindowBounds !== 'function' || typeof getCurrentContactDevo !== 'function') return;

    const windowBounds = getReadingWindowBounds(cachedPlan.length);
    const year = new Date().getFullYear();
    const entries = [];
    
    for (let day = windowBounds.startDay; day <= windowBounds.endDay; day++) {
        const devo = getCurrentContactDevo(cachedDevos, day, new Date(year, 0, day));
        if (!devo) continue;
        const planRow = cachedPlan[day - 1];
        entries.push({ day, devo, date: planRow ? planRow.date : `DAY ${day}` });
    }
    
    if (!entries.length) { 
        container.innerHTML = `<div class="loader" style="animation:none;">NO DEVOTIONALS FOUND IN CURRENT WINDOW.</div>`; 
        return; 
    }
    
    let html = `<div class="search-wrapper"><i data-lucide="search" class="search-icon"></i><input type="text" id="lib-search" onkeyup="filterLibrary()" class="tactical-search" placeholder="SEARCH LIBRARY..."></div><div style="display:grid; gap:15px;">`;
    entries.forEach(entry => {
        const d = entry.devo;
        const searchString = `${d.title} ${d.theme} ${d.scripture}`.replace(/"/g, '');
        html += `<div class="lib-item region-card" style="cursor:pointer;" data-search="${searchString}" onclick="selLibDay(${entry.day})"><div style="padding:25px; display:flex; justify-content:space-between; align-items:center;"><div><div style="font-family:'JetBrains Mono'; font-size:0.85rem; color:var(--accent-cyan); font-weight:800; margin-bottom:5px;">DAY ${entry.day} • ${entry.date}</div><div style="font-size:1.4rem; font-weight:900; color:white; text-transform:uppercase;">${d.title}</div><div style="font-size:0.9rem; color:var(--text-muted); font-style:italic; margin-top:5px;">${d.theme}</div></div><i data-lucide="arrow-right" style="color:var(--accent-cyan);"></i></div></div>`;
    });
    
    container.innerHTML = html + `</div>`;
    if (window.lucide) lucide.createIcons();
}