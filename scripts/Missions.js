// ==========================================
// APP: MISSIONS DIRECTORY & SATELLITE DOSSIER
// ==========================================

const missionsSyncState = {
    cache: new Map(),
    inFlight: new Map(),
    primeInFlight: null,
    incrementalTimerId: null,
    cacheTtlMs: 12 * 60 * 1000,
    incrementalMs: 2 * 60 * 1000
};

function missionsDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
}

function missionTabName(country) {
    return String((country && (country.tabName || country.name)) || '').trim();
}

function getMissionCacheEntry(tabName) {
    const key = String(tabName || '').trim();
    if (!key) return null;
    const entry = missionsSyncState.cache.get(key);
    if (!entry || !Array.isArray(entry.rows)) return null;
    return entry;
}

function setMissionCacheEntry(tabName, rows) {
    const key = String(tabName || '').trim();
    if (!key) return;
    missionsSyncState.cache.set(key, {
        rows: Array.isArray(rows) ? rows : [],
        loadedAt: Date.now()
    });
}

function hasFreshMissionCache(tabName) {
    const entry = getMissionCacheEntry(tabName);
    if (!entry) return false;
    return (Date.now() - Number(entry.loadedAt || 0)) < missionsSyncState.cacheTtlMs;
}

async function fetchMissionRows(tabName, attempts = 3) {
    let lastError = null;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
        try {
            const response = await fetch(`${MASTER_API_URL}?tab=${encodeURIComponent(tabName)}&_=${Date.now()}`, {
                cache: 'no-store',
                signal: AbortSignal.timeout(10000)
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const payload = await response.json();
            if (!Array.isArray(payload)) {
                throw new Error('Mission payload was not an array');
            }
            return payload;
        } catch (error) {
            lastError = error;
            if (attempt < attempts - 1) {
                await missionsDelay(450 * (attempt + 1));
            }
        }
    }

    throw (lastError || new Error(`Failed to fetch mission tab ${tabName}`));
}

async function loadMissionRows(country, forceReload = false) {
    const tabName = missionTabName(country);
    if (!tabName) throw new Error('Mission tab name missing');

    if (!forceReload && hasFreshMissionCache(tabName)) {
        const fresh = getMissionCacheEntry(tabName);
        return { rows: fresh.rows, fromCache: true };
    }

    if (missionsSyncState.inFlight.has(tabName)) {
        return missionsSyncState.inFlight.get(tabName);
    }

    const pending = (async () => {
        const rows = await fetchMissionRows(tabName, 3);
        setMissionCacheEntry(tabName, rows);
        return { rows, fromCache: false };
    })();

    missionsSyncState.inFlight.set(tabName, pending);

    try {
        return await pending;
    } finally {
        missionsSyncState.inFlight.delete(tabName);
    }
}

function formatMissionNumber(value, isPercent = false) {
    if (!value && value !== 0) return '--';
    
    const num = parseFloat(value);
    if (isNaN(num)) return String(value);
    
    // If explicitly marked as percent, or if it's a small decimal (0-1) that looks like a decimal percentage
    const isDecimalPercent = (num >= 0 && num <= 1 && typeof value === 'string' && value.match(/^0?\.\d+$/));
    
    if (isPercent || isDecimalPercent) {
        const percentValue = isDecimalPercent ? num * 100 : num;
        const formatted = percentValue % 1 === 0 ? Math.round(percentValue) : percentValue.toFixed(2).replace(/\.?0+$/, '');
        return `${formatted}%`;
    }
    
    if (Number.isInteger(num) || num % 1 === 0) {
        return Math.round(num).toLocaleString('en-US');
    } else {
        return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
    }
}

function createMapsLink(coordString) {
    if (!coordString || typeof coordString !== 'string') {
        return `<div class="region-coords">${coordString || 'LAT/LONG CLASSIFIED'}</div>`;
    }
    
    const coordTrimmed = coordString.trim();
    const coordMatch = coordTrimmed.match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
    
    if (!coordMatch) {
        return `<div class="region-coords">${coordTrimmed}</div>`;
    }
    
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    
    if (isNaN(lat) || isNaN(lng)) {
        return `<div class="region-coords">${coordTrimmed}</div>`;
    }
    
    const mapsUrl = `https://www.google.com/maps/@${lat},${lng},13z?t=s`;
    
    return `<a href="${mapsUrl}" target="_blank" class="region-coords" style="cursor: pointer; text-decoration: underline; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">${coordTrimmed}</a>`;
}

function renderMissionCards(container, data) {
    if (!container) return;
    container.innerHTML = '';

    data.forEach((row) => {
        const keys = Object.keys(row || {});
        const name = row[keys.find(k => k.toLowerCase().includes('_en') || k === 'region' || k === 'state')] || 'Region';
        const color = row[keys.find(k => k.toLowerCase().includes('color'))] || '#00ffff';

        const riskCards = [];
        let riskCardIndex = 0;
        keys.forEach(k => {
            const val = row[k];
            const lowK = k.toLowerCase();
            const excluded = ['region','population','color','coord','lit','atoll','municipality','district','division','governorate','department','province','state'];

            if (!excluded.some(ex => lowK.includes(ex)) && val) {
                const rowLabel = k
                    .replace(/_/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .replace(/\b\w/g, (char) => char.toUpperCase());
                const isHigh = String(val).toLowerCase().includes('high') || String(val).toLowerCase().includes('extreme');
                const rendered = formatMissionRiskValue(rowLabel, val);
                const badgeClass = `badge ${isHigh ? 'extreme' : 'high'}`;
                const badgeTitle = rendered.isPrimaryHurdle ? ` title="${rendered.fullText.replace(/"/g, '&quot;')}"` : '';

                riskCards.push(buildProtocolDetailCard({
                    label: rowLabel,
                    headerRight: `<span class="${badgeClass}"${badgeTitle}>${rendered.display}</span>`,
                    variant: getProtocolCardVariant(riskCardIndex)
                }));
                riskCardIndex += 1;
            }
        });

        const contentCardsHtml = buildProtocolCardStack(riskCards);
        const coordsField = row[keys.find(k => k.toLowerCase().includes('coord'))];
        const coordsHtml = createMapsLink(coordsField);
        const popValue = formatMissionNumber(row[keys.find(k => k.toLowerCase().includes('pop'))]);
        const litValue = formatMissionNumber(row[keys.find(k => k.toLowerCase().includes('lit'))], true);
        container.innerHTML += `<div class="region-card"><div class="region-color-bar" style="background:${color}; box-shadow: 0 0 20px ${color};"></div><div class="accordion-header" onclick="toggleAccordion(this)"><div><div class="region-title">${name}</div>${coordsHtml}</div><i data-lucide="chevron-down" class="chevron-icon" size="22"></i></div><div class="card-content"><div class="stats-grid"><div class="stat-box"><div class="stat-label">Population</div><div class="stat-value">${popValue}</div></div><div class="stat-box"><div class="stat-label">Literacy</div><div class="stat-value">${litValue}</div></div></div>${contentCardsHtml}</div></div>`;
    });

    lucide.createIcons();
}

async function primeMissionsCache(forceReload = false) {
    if (missionsSyncState.primeInFlight && !forceReload) {
        return missionsSyncState.primeInFlight;
    }

    const activeMissions = Array.isArray(missionList) ? missionList.slice() : [];
    const concurrency = 4;
    let cursor = 0;

    const worker = async () => {
        while (cursor < activeMissions.length) {
            const country = activeMissions[cursor++];
            try {
                await loadMissionRows(country, forceReload);
            } catch {
                // Keep priming remaining countries.
            }
            await missionsDelay(60);
        }
    };

    missionsSyncState.primeInFlight = Promise.all(
        Array.from({ length: Math.min(concurrency, Math.max(1, activeMissions.length)) }, () => worker())
    ).finally(() => {
        missionsSyncState.primeInFlight = null;
    });

    return missionsSyncState.primeInFlight;
}

function startMissionsIncrementalSync() {
    if (missionsSyncState.incrementalTimerId) return;
    missionsSyncState.incrementalTimerId = setInterval(() => {
        primeMissionsCache(true);
    }, missionsSyncState.incrementalMs);
}

function populateMissionsDirectory() {
    const grid = document.getElementById('folder-grid');
    if (!grid) return;
    
    grid.innerHTML = ''; // Clear existing
    
    missionList.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'app-item';
        btn.onclick = () => { 
            toggleFolder(false); 
            openMission(c); 
        };
        
        let label = c.name;
        if (label.length > 10) {
            label = label.split(' ')[0];
        }
        
        btn.innerHTML = `
            <div class="app-icon">${c.icon}</div>
            <div class="app-label" title="${c.name}">${label}</div>
        `;
        grid.appendChild(btn);
    });
}

async function openMission(c, fromBread = false, fromFocus = false) {
    const backText = document.getElementById('modal-back-text');
    const backBtn = document.getElementById('modal-back-btn');
    const modalTitle = document.getElementById('modal-title');
    const modalSubtitle = document.getElementById('modal-subtitle');
    const modalBodyContainer = document.getElementById('modal-body-container');
    const modal = document.getElementById('data-modal');

    if (!backText || !backBtn || !modalTitle || !modalSubtitle || !modalBodyContainer || !modal) {
        return;
    }

    if (fromFocus) { backText.innerText = 'CLOSE'; backBtn.onclick = () => { if (typeof closeModal === 'function') closeModal(); }; }
    else if (fromBread) { backText.innerText = 'BACK'; backBtn.onclick = () => openIntel(); }
    else { backText.innerText = 'CLEAR'; backBtn.onclick = () => returnToMissionsDirectory(); }

    modalTitle.innerHTML = `<span style="filter:none !important; text-shadow:none !important; margin-right:8px;">${c.icon}</span>${c.name}`;
    modalSubtitle.innerText = 'STARLINK DATA STREAM ACTIVE';
    modalBodyContainer.innerHTML = `<div class="region-grid" id="modal-body-grid"><div class="loader" style="grid-column:1/-1;"> </div></div>`;
    modal.classList.add('active');
    bounceModalBodyToTop();

    const tabName = missionTabName(c);
    const cached = getMissionCacheEntry(tabName);

    const gridEl = document.getElementById('modal-body-grid');
    if (cached && Array.isArray(cached.rows) && cached.rows.length && gridEl) {
        renderMissionCards(gridEl, cached.rows);
        bounceModalBodyToTop();
    }

    try {
        const { rows } = await loadMissionRows(c, !cached);
        const container = document.getElementById('modal-body-grid');
        if (!container) return;
        renderMissionCards(container, rows);
        bounceModalBodyToTop();
    } catch (err) {
        console.error(`Failed to fetch ${c.name} data:`, err);
        const liveGrid = document.getElementById('modal-body-grid');
        if (liveGrid && cached && Array.isArray(cached.rows) && cached.rows.length) {
            return;
        }
        const liveContainer = document.getElementById('modal-body-container');
        if (liveContainer) {
            liveContainer.innerHTML = `<div class="loader">STARLINK SYNC ERROR</div>`;
        }
    }
}

window.openFocusCountry = function(index, fromBread = false) {
    const c = missionList[index];
    if (c) openMission(c, fromBread);
};

window.primeMissionsCache = primeMissionsCache;
window.startMissionsIncrementalSync = startMissionsIncrementalSync;
window.openMission = openMission;
window.populateMissionsDirectory = populateMissionsDirectory;