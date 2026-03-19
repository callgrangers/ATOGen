// ==========================================
// APP: SHEPHERD'S MIRROR (TRIAGE)
// ==========================================

const mirrorAppState = {
    categories: {},
    answers: {},
    chart: null,
    apiURL: `${MASTER_API_URL}?tab=Mirror`,
    loaded: false,
    lastLoadedAt: 0,
    cacheTtlMs: 5 * 60 * 1000,
    inFlightLoadPromise: null
};

function mirrorEnsureStyles() {
    if (document.getElementById('mirror-app-style')) return;
    const style = document.createElement('style');
    style.id = 'mirror-app-style';
    style.textContent = `
        .mirror-wrap { font-family: 'Inter', sans-serif; background-color: #020617; color: #f8fafc; }
        .mirror-serif { font-family: 'Merriweather', serif; }
        .mirror-glass-panel { background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); }
        .mirror-chart-bg { background: radial-gradient(circle at center, rgba(34, 211, 238, 0.08) 0%, transparent 85%); }
        .mirror-scripture-pill { background: rgba(34, 211, 238, 0.1); border: 1px solid #22d3ee; color: #22d3ee; transition: all 0.2s; text-decoration: none; font-size: 0.7rem; }
        .mirror-scripture-pill:hover { background: #22d3ee; color: #000; box-shadow: 0 0 10px #22d3ee; }
        .mirror-btn-toggle { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); cursor: pointer; transition: 0.2s; color: #cbd5e1; }
        .mirror-active-yes { background: #f43f5e !important; border-color: #fb7185; color: #fff; }
        .mirror-active-no { background: #10b981 !important; border-color: #34d399; color: #fff; }
        .mirror-heart { position: relative; width: 16px; height: 16px; transform: rotate(-45deg); will-change: transform; transition: 0.4s; }
        .mirror-heart::before, .mirror-heart::after { content: ''; position: absolute; width: 16px; height: 16px; background-color: inherit; border-radius: 50%; }
        .mirror-heart::before { top: -8px; left: 0; }
        .mirror-heart::after { top: 0; left: 8px; }
        .mirror-h-distressed { animation: mirror-beat 0.5s infinite; }
        @keyframes mirror-beat {
            0% { transform: scale(1) rotate(-45deg); }
            30% { transform: scale(1.2) rotate(-45deg); }
            50% { transform: scale(1) rotate(-45deg); }
        }
        .mirror-prescription-entry { animation: mirror-slideIn 0.3s ease-out forwards; }
        @keyframes mirror-slideIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .mirror-loading-shimmer { background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%); background-size: 200% 100%; animation: mirror-shimmer 1.5s infinite; }
        @keyframes mirror-shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
    `;
    document.head.appendChild(style);
}

function renderMirrorAppShell() {
    mirrorEnsureStyles();
    const container = document.getElementById('modal-body-container');
    container.innerHTML = `
        <div class="mirror-wrap" style="padding:16px; border-radius:18px;">
            <header style="max-width:100%; margin:0 auto 20px auto; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:12px; gap:12px;">
                <div>
                    <h1 class="mirror-serif" style="font-size:1.8rem; font-weight:700; color:#fff; margin:0;">Shepherd's Mirror</h1>
                    <p style="color:#22d3ee; letter-spacing:0.2em; font-size:10px; margin:4px 0 0 0; text-transform:uppercase; font-weight:700;">Live Comprehensive Soul Triage</p>
                </div>
                <div class="mirror-glass-panel" style="padding:8px 14px; border-radius:12px; display:flex; align-items:center; gap:10px;">
                    <span style="font-size:9px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.04em;">Heart Load</span>
                    <div id="mirror-heart" class="mirror-heart" style="background:#10b981;"></div>
                </div>
            </header>

            <main style="display:grid; grid-template-columns:1fr; gap:16px;">
                <div id="mirror-diagnostic-sections" style="display:flex; flex-direction:column; gap:10px;">
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        <div class="mirror-loading-shimmer" style="height:26px; width:180px; border-radius:8px;"></div>
                        <div class="mirror-loading-shimmer" style="height:90px; width:100%; border-radius:14px; opacity:0.5;"></div>
                        <div class="mirror-loading-shimmer" style="height:90px; width:100%; border-radius:14px; opacity:0.3;"></div>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr; gap:12px;">
                    <div class="mirror-glass-panel mirror-chart-bg" style="padding:16px; border-radius:18px; border-color:rgba(34, 211, 238, 0.2);">
                        <h3 style="text-align:center; font-size:10px; font-weight:700; letter-spacing:0.2em; color:#22d3ee; text-transform:uppercase; margin:0 0 10px 0;">Diagnostic Intensity Map</h3>
                        <div style="height:320px;"><canvas id="mirror-radarChart"></canvas></div>
                    </div>

                    <div class="mirror-glass-panel" style="padding:16px; border-radius:18px; border-top:2px solid rgba(16,185,129,0.5);">
                        <h3 class="mirror-serif" style="font-size:1.1rem; font-weight:700; margin:0 0 10px 0; color:#fff;">Strategic Action Plan</h3>
                        <div id="mirror-active-prescriptions" style="display:flex; flex-direction:column; gap:8px; margin-bottom:12px; max-height:260px; overflow-y:auto;">
                            <p style="color:#64748b; font-style:italic; font-size:0.8rem; text-align:center; padding:12px 0; margin:0;">Waiting for diagnostic data...</p>
                        </div>

                        <div style="padding-top:12px; border-top:1px solid rgba(255,255,255,0.1);">
                            <button onclick="sendMirrorSMS()" style="width:100%; background:linear-gradient(to bottom right, #0891b2, #1d4ed8); border:none; color:#fff; font-weight:900; font-size:11px; letter-spacing:0.18em; padding:14px 12px; border-radius:12px; cursor:pointer; text-transform:uppercase;">Transmit Soul Triage via SMS</button>
                            <p style="font-size:9px; color:#64748b; text-align:center; margin:8px 0 0 0; text-transform:uppercase; letter-spacing:0.15em; opacity:0.75;">Opens native encrypted messaging</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    `;
}

function mirrorGetValue(row, keys) {
    for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
        const found = Object.keys(row).find(k => k.toLowerCase() === key.toLowerCase());
        if (found && row[found] !== undefined && row[found] !== null && row[found] !== '') return row[found];
    }
    return '';
}

function mirrorBuildCategories(rows) {
    const grouped = {};
    rows.forEach((row, idx) => {
        const categoryId = String(mirrorGetValue(row, ['category_id', 'Category_ID', 'categoryId']) || `cat_${idx}`).trim();
        const categoryTitle = String(mirrorGetValue(row, ['category_title', 'Category_Title', 'categoryTitle']) || 'General').trim();
        const color = String(mirrorGetValue(row, ['color']) || '#22d3ee').trim();
        const chartLabel = String(mirrorGetValue(row, ['chart_label', 'chartAxis', 'chart_axis']) || categoryTitle).trim();

        if (!grouped[categoryId]) {
            grouped[categoryId] = {
                title: categoryTitle,
                color,
                chartLabel,
                items: []
            };
        }

        grouped[categoryId].items.push({
            id: String(mirrorGetValue(row, ['question_id', 'Question_ID', 'questionId']) || `q_${idx}`).trim(),
            text: String(mirrorGetValue(row, ['question', 'Question']) || '').trim(),
            p: String(mirrorGetValue(row, ['prescription', 'Prescription']) || '').trim(),
            ref: String(mirrorGetValue(row, ['scripture', 'verse_reference', 'verseReference']) || '').trim(),
            slug: String(mirrorGetValue(row, ['slug']) || '').trim()
        });
    });

    return grouped;
}

async function mirrorFetchData(forceReload = false, background = false) {
    const sections = document.getElementById('mirror-diagnostic-sections');
    const now = Date.now();
    const hasWarmCache = mirrorAppState.loaded && Object.keys(mirrorAppState.categories || {}).length > 0 && (now - mirrorAppState.lastLoadedAt) < mirrorAppState.cacheTtlMs;

    if (!forceReload && hasWarmCache) {
        mirrorRenderUI();
        mirrorInitChart();
        return;
    }

    if (mirrorAppState.inFlightLoadPromise) {
        return mirrorAppState.inFlightLoadPromise;
    }

    mirrorAppState.inFlightLoadPromise = (async () => {
    try {
        const response = await fetch(`${mirrorAppState.apiURL}&_=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Network response was not ok');
        const payload = await response.json();

        if (payload && payload.categories && typeof payload.categories === 'object') {
            mirrorAppState.categories = payload.categories;
        } else {
            const rows = Array.isArray(payload) ? payload : (payload.data || payload.result || []);
            if (!Array.isArray(rows) || !rows.length) throw new Error('No rows returned from Mirror tab');
            mirrorAppState.categories = mirrorBuildCategories(rows);
        }

        mirrorAppState.loaded = true;
        mirrorAppState.lastLoadedAt = Date.now();

        mirrorRenderUI();
        mirrorInitChart();
    } catch (error) {
        console.error('Mirror initialization error:', error);
        if (background) return;
        if (sections) {
            sections.innerHTML = `
                <div class="mirror-glass-panel" style="padding:20px; text-align:center; border-radius:16px; border-color:rgba(244,63,94,0.5);">
                    <p style="color:#fb7185; font-weight:700; margin:0 0 6px 0;">Starlink Sync Error</p>
                    <p style="color:#94a3b8; font-size:0.9rem; margin:0;">Unable to retrieve latest data stream.</p>
                </div>
            `;
        }
    } finally {
        mirrorAppState.inFlightLoadPromise = null;
    }
    })();

    return mirrorAppState.inFlightLoadPromise;
}

function mirrorRenderUI() {
    const container = document.getElementById('mirror-diagnostic-sections');
    if (!container) return;

    container.innerHTML = '';
    Object.keys(mirrorAppState.categories).forEach(catKey => {
        const cat = mirrorAppState.categories[catKey];
        const section = document.createElement('div');
        section.style.marginBottom = '8px';
        section.innerHTML = `
            <h3 class="mirror-serif" style="font-size:1.15rem; font-weight:700; margin:0 0 10px 0; display:flex; align-items:center; gap:8px; color:${cat.color};">
                <span style="width:6px; height:24px; border-radius:99px; background:${cat.color};"></span>
                ${cat.title}
            </h3>
        `;

        (cat.items || []).forEach(item => {
            const card = document.createElement('div');
            card.className = 'mirror-glass-panel';
            card.style.cssText = 'padding:14px; border-radius:14px; margin-bottom:10px; display:flex; flex-direction:column; gap:10px; transition:all 0.2s;';
            card.innerHTML = `
                <p style="color:#e2e8f0; font-size:0.95rem; font-weight:600; line-height:1.55; margin:0;">${item.text}</p>
                <div style="display:flex; gap:6px; flex-wrap:wrap;">
                    <button onclick="mirrorUpdate('${item.id}', true)" id="mirror-y-${item.id}" class="mirror-btn-toggle" style="padding:8px 14px; border-radius:10px; font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:0.15em;">Yes</button>
                    <button onclick="mirrorUpdate('${item.id}', false)" id="mirror-n-${item.id}" class="mirror-btn-toggle" style="padding:8px 14px; border-radius:10px; font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:0.15em;">No</button>
                </div>
            `;
            section.appendChild(card);
        });

        container.appendChild(section);
    });

    const plan = document.getElementById('mirror-active-prescriptions');
    if (plan) {
        plan.innerHTML = '<p style="color:#64748b; font-style:italic; font-size:0.8rem; text-align:center; padding:12px 0; margin:0;">Select diagnostic markers to generate strategy...</p>';
    }
}

function mirrorInitChart() {
    const canvas = document.getElementById('mirror-radarChart');
    if (!canvas) return;

    const labels = Object.values(mirrorAppState.categories).map(cat => cat.chartLabel || cat.title || 'Category');
    if (mirrorAppState.chart) {
        mirrorAppState.chart.destroy();
        mirrorAppState.chart = null;
    }

    mirrorAppState.chart = new Chart(canvas.getContext('2d'), {
        type: 'radar',
        data: {
            labels,
            datasets: [{
                data: labels.map(() => 0),
                backgroundColor: 'rgba(34, 211, 238, 0.25)',
                borderColor: '#22d3ee',
                borderWidth: 2,
                pointBackgroundColor: '#ffffff',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    min: 0, max: 5, beginAtZero: true,
                    angleLines: { color: 'rgba(255,255,255,0.1)' },
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    pointLabels: { color: '#94a3b8', font: { family: 'Inter', size: 10, weight: '700' }, padding: 15 },
                    ticks: { display: false, stepSize: 1 }
                }
            },
            plugins: { legend: { display: false } },
            animation: { duration: 400 }
        }
    });
}

function mirrorUpdate(id, val) {
    mirrorAppState.answers[id] = val;
    document.querySelectorAll(`[id$='-${id}']`).forEach(btn => {
        btn.classList.remove('mirror-active-yes', 'mirror-active-no');
    });
    const selected = document.getElementById(`mirror-${val ? 'y' : 'n'}-${id}`);
    if (selected) selected.classList.add(val ? 'mirror-active-yes' : 'mirror-active-no');
    mirrorProcess();
}

function mirrorProcess() {
    const chartData = Object.keys(mirrorAppState.categories).map(catKey => {
        const cat = mirrorAppState.categories[catKey];
        return (cat.items || []).filter(item => mirrorAppState.answers[item.id] === true).length;
    });

    if (mirrorAppState.chart) {
        mirrorAppState.chart.data.datasets[0].data = chartData;
        mirrorAppState.chart.update('none');
    }

    const list = document.getElementById('mirror-active-prescriptions');
    let html = '';
    let activeCount = 0;

    Object.keys(mirrorAppState.categories).forEach(catKey => {
        const cat = mirrorAppState.categories[catKey];
        (cat.items || []).forEach(item => {
            if (mirrorAppState.answers[item.id] === true) {
                activeCount++;
                const href = item.slug ? `https://www.bible.com/bible/59/${item.slug}.ESV` : '#';
                const verseLink = item.ref
                    ? `<a href="${href}" target="_blank" rel="noopener noreferrer" class="mirror-scripture-pill" style="padding:2px 8px; border-radius:8px;">${item.ref}</a>`
                    : '';

                html += `
                    <div class="mirror-prescription-entry" style="padding:12px; border-radius:10px; background:rgba(255,255,255,0.05); border-left:4px solid ${cat.color}; margin-bottom:8px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; gap:8px;">
                            <span style="font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.16em; color:${cat.color};">${cat.title} Action</span>
                            ${verseLink}
                        </div>
                        <p style="margin:0; color:#cbd5e1; font-size:0.8rem; line-height:1.55;">"${item.p}"</p>
                    </div>
                `;
            }
        });
    });

    if (list) {
        list.innerHTML = activeCount > 0 ? html : '<p style="color:#64748b; font-style:italic; font-size:0.8rem; text-align:center; padding:12px 0; margin:0;">Select diagnostic markers to generate strategy...</p>';
    }

    const heart = document.getElementById('mirror-heart');
    if (heart) {
        heart.className = `mirror-heart ${activeCount > 6 ? 'mirror-h-distressed' : ''}`;
        heart.style.background = activeCount > 6 ? '#f43f5e' : (activeCount > 0 ? '#f59e0b' : '#10b981');
    }
}

function sendMirrorSMS() {
    const activeStruggles = [];
    Object.keys(mirrorAppState.categories).forEach(catKey => {
        const cat = mirrorAppState.categories[catKey];
        (cat.items || []).forEach(item => {
            if (mirrorAppState.answers[item.id] === true) {
                activeStruggles.push({ cat: cat.title, ref: item.ref || 'N/A' });
            }
        });
    });

    if (!activeStruggles.length) {
        alert('The Mirror is currently clear. Please select diagnostic markers before requesting help.');
        return;
    }

    let message = "Shepherd's Mirror Triage Report:\n";
    activeStruggles.forEach((s, i) => {
        message += `${i + 1}. [${s.cat}] Focus: ${s.ref}\n`;
    });
    message += '\nI am requesting a soul-care follow-up based on these findings.';

    if (typeof openPrayerRequestApp === 'function') {
        openPrayerRequestApp(message);
        return;
    }
    window.location.href = '/request';
}

function openMirrorApp() {
    document.getElementById('modal-back-text').innerText = 'CLEAR';
    document.getElementById('modal-back-btn').onclick = () => closeModal();
    document.getElementById('modal-title').innerHTML = `<span style="filter:none !important; text-shadow:none !important; margin-right:8px;">🪞</span>MIRROR`;
    document.getElementById('modal-subtitle').innerText = 'SHEPHERD\'S MIRROR | COMPREHENSIVE DIAGNOSTICS';

    mirrorAppState.answers = {};
    if (mirrorAppState.chart) {
        mirrorAppState.chart.destroy();
        mirrorAppState.chart = null;
    }

    renderMirrorAppShell();
    document.getElementById('data-modal').classList.add('active');
    bounceModalBodyToTop();

    const hasCachedCategories = mirrorAppState.loaded && Object.keys(mirrorAppState.categories || {}).length > 0;
    if (hasCachedCategories) {
        mirrorRenderUI();
        mirrorInitChart();
        mirrorFetchData(true, true).catch(() => {});
        return;
    }

    mirrorFetchData(false, false);
}

window.openMirrorApp = openMirrorApp;

if (typeof installAppAnchorSync === 'function') {
    installAppAnchorSync();
}