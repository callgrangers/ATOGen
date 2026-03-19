// ==========================================
// APP: STATISTICS / TELEMETRY
// ==========================================

const statisticsAppState = {
    timerId: null,
    statusTimerId: null,
    statusLiveTimerId: null,
    launchDate: '2026-02-02T00:00:00',
    analyticsAnchorDate: '2026-03-13T00:00:00',
    analyticsAnchorEvents: 621231,
    annualRates: {
        marriages: 1900000,
        divorce: 780000,
        births: 134000000,
        mentalIllness: 420000000,
        persecutedGrowth: 1825000,
        americanChurch: 32000000,
        churchHurt: 2400000,
        emptyPulpit: 42000,
        falseTeaching: 185000
    }
};

function statisticsEnsureStyles() {
    if (document.getElementById('statistics-app-style')) return;
    const style = document.createElement('style');
    style.id = 'statistics-app-style';
    style.textContent = `
        .stats-wrap {
            margin: 0; padding: 0; background-color: #020204; color: #fff; min-height: 100%;
            position: relative; overflow-x: hidden; border-radius: 16px;
        }
        .stats-wrap::after {
            content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%),
                        linear-gradient(90deg, rgba(255, 0, 0, 0.02), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.02));
            background-size: 100% 2px, 3px 100%; pointer-events: none; z-index: 3;
        }
        .stats-map {
            position: absolute; width: 100%; height: 100%; top: 0; left: 0;
            background: url('https://upload.wikimedia.org/wikipedia/commons/4/41/Simple_world_map.svg') no-repeat center;
            background-size: contain; opacity: 0.06; filter: invert(1); z-index: 0;
        }
        .stats-main-display { padding: 22px 14px 24px; position: relative; z-index: 2; text-align: center; }
        .stats-label-main { font-size: 12px; text-transform: uppercase; letter-spacing: 0.6em; color: #00f2ff; margin-bottom: 12px; font-weight: 800; opacity: 0.9; }
        .stats-main-val {
            font-size: clamp(3.4rem, 13vw, 7rem); font-weight: 900; letter-spacing: -2px; line-height: 0.88;
            background: linear-gradient(to bottom, #fff 75%, rgba(255,255,255,0.3));
            -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 0 30px rgba(0, 242, 255, 0.3));
        }
        .stats-meta-row { display: flex; justify-content: center; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 10px; }
        .stats-status-pill {
            font-family: 'Fira Code', 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; letter-spacing: 1px;
            text-transform: uppercase; border-radius: 999px; padding: 6px 12px; border: 1px solid rgba(255,255,255,0.2); transition: all 0.25s ease;
        }
        .stats-status-pill.live { color: #10b981; border-color: rgba(16,185,129,0.5); background: rgba(16,185,129,0.14); box-shadow: 0 0 14px rgba(16,185,129,0.35); }
        .stats-status-pill.syncing { color: #00f2ff; border-color: rgba(0,242,255,0.55); background: rgba(0,242,255,0.13); box-shadow: 0 0 14px rgba(0,242,255,0.35); }
        .stats-uptime { font-family: 'Fira Code', 'JetBrains Mono', monospace; font-size: 11px; color: #94a3b8; letter-spacing: 0.6px; text-transform: uppercase; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); gap: 0.9rem; padding: 0 14px 22px; position: relative; z-index: 2; }
        .stats-card {
            background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255, 255, 255, 0.12); border-left: 6px solid #00f2ff;
            padding: 16px; border-radius: 12px; backdrop-filter: blur(15px); box-shadow: 0 8px 24px rgba(0,0,0,0.45);
        }
        .stats-card.alert { border-left-color: #ff3333; }
        .stats-card.growth { border-left-color: #10b981; }
        .stats-card-label { font-family: 'Fira Code', 'JetBrains Mono', monospace; font-size: 11px; text-transform: uppercase; color: #00f2ff; letter-spacing: 1px; margin-bottom: 6px; font-weight: 700; }
        .stats-card-desc { font-size: 12px; color: #cbd5e1; line-height: 1.55; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; }
        .stats-card-value { font-family: 'Fira Code', 'JetBrains Mono', monospace; font-size: 28px; font-weight: 700; color: #ffffff; display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
        .stats-card-unit { font-size: 12px; color: #94a3b8; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; }
    `;
    document.head.appendChild(style);
}

function renderStatisticsAppShell() {
    statisticsEnsureStyles();
    const container = document.getElementById('modal-body-container');
    container.innerHTML = `
        <div class="stats-wrap">
            <div class="stats-map"></div>
            <div class="stats-main-display">
                <div class="stats-label-main">Global Reached Souls</div>
                <div class="stats-main-val" id="stats-totalVal">621,231</div>
                <div class="stats-meta-row">
                    <span id="stats-status" class="stats-status-pill live">LIVE</span>
                    <span id="stats-uptime" class="stats-uptime">Uptime: --</span>
                </div>
            </div>
            <div class="stats-grid">
                <div class="stats-card">
                    <div class="stats-card-label">Covenant Stability</div>
                    <div class="stats-card-desc">Tracking the YTD ratio of life-unions against dissolutions to monitor discipleship stability in the home.</div>
                    <div class="stats-card-value">
                        <span id="stats-marriageVal">0</span>
                        <span style="color:#ff3333; margin:0 8px;">/</span>
                        <span id="stats-divorceVal" style="color:#ff3333;">0</span>
                    </div>
                </div>
                <div class="stats-card">
                    <div class="stats-card-label">Generational Heritage</div>
                    <div class="stats-card-desc">Measuring births with literacy as a long-view indicator for Scripture access and doctrinal resilience.</div>
                    <div class="stats-card-value">
                        <span id="stats-birthVal">0</span>
                        <span class="stats-card-unit">Born YTD</span>
                    </div>
                    <div class="stats-card-value" style="font-size:22px; margin-top:4px;">
                        <span style="color:#94a3b8;">86.7</span><span class="stats-card-unit">% Literacy</span>
                    </div>
                </div>
                <div class="stats-card alert">
                    <div class="stats-card-label">Family Mental Health Impact</div>
                    <div class="stats-card-desc">Estimated individuals within family units navigating anxiety or depression burdens.</div>
                    <div class="stats-card-value" id="stats-mentalVal">0</div>
                </div>
                <div class="stats-card growth">
                    <div class="stats-card-label">Underground Church Expansion</div>
                    <div class="stats-card-desc">Growth signal from restricted and hostile regions where resilient gospel communities multiply.</div>
                    <div class="stats-card-value" id="stats-persecutedVal">+0</div>
                </div>
                <div class="stats-card">
                    <div class="stats-card-label">Western Church Attendance</div>
                    <div class="stats-card-desc">Weekly engagement in North American and European contexts against secular drift.</div>
                    <div class="stats-card-value" id="stats-americanChurchVal">0</div>
                </div>
                <div class="stats-card alert">
                    <div class="stats-card-label">Church Hurt and Deconstruction</div>
                    <div class="stats-card-desc">People withdrawing from fellowship due to spiritual trauma or theological disorientation.</div>
                    <div class="stats-card-value" id="stats-hurtVal">0</div>
                </div>
                <div class="stats-card alert">
                    <div class="stats-card-label">Leadership Gap (Empty Pulpits)</div>
                    <div class="stats-card-desc">Congregations operating without a primary shepherd or elder succession pathway.</div>
                    <div class="stats-card-value"><span id="stats-pulpitVal">0</span> <span class="stats-card-unit">Vacant Seats</span></div>
                </div>
                <div class="stats-card alert">
                    <div class="stats-card-label">False Teaching Alerts</div>
                    <div class="stats-card-desc">Rising digital and public-square spread of syncretic and deviant gospel narratives.</div>
                    <div class="stats-card-value" id="stats-falseTeachingVal">0</div>
                </div>
            </div>
        </div>
    `;
}

function statisticsGetYTDValue(annualRate) {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const elapsedSeconds = (now - startOfYear) / 1000;
    const totalSecondsInYear = 31536000;
    return Math.floor((annualRate / totalSecondsInYear) * elapsedSeconds);
}

function statisticsGetLaunchDate() {
    const parsed = new Date(statisticsAppState.launchDate);
    if (Number.isNaN(parsed.getTime())) {
        return new Date('2026-02-02T00:00:00');
    }
    return parsed;
}

function statisticsGetLiveHits() {
    const launch = statisticsGetLaunchDate();
    const anchorDate = new Date(statisticsAppState.analyticsAnchorDate);
    const anchorTimeMs = Number.isNaN(anchorDate.getTime()) ? Date.now() : anchorDate.getTime();
    const anchorEvents = Math.max(0, Number(statisticsAppState.analyticsAnchorEvents) || 0);

    const launchTimeMs = launch.getTime();
    const secondsLaunchToAnchor = Math.max(1, Math.floor((anchorTimeMs - launchTimeMs) / 1000));
    const inferredEventsPerSecond = anchorEvents / secondsLaunchToAnchor;

    const nowMs = Date.now();
    if (nowMs <= anchorTimeMs) {
        const secondsSinceLaunch = Math.max(0, Math.floor((nowMs - launchTimeMs) / 1000));
        return Math.floor(secondsSinceLaunch * inferredEventsPerSecond);
    }

    const secondsSinceAnchor = Math.max(0, Math.floor((nowMs - anchorTimeMs) / 1000));
    return Math.floor(anchorEvents + (secondsSinceAnchor * inferredEventsPerSecond));
}

function statisticsFormatUptime() {
    const launch = statisticsGetLaunchDate();
    let seconds = Math.max(0, Math.floor((Date.now() - launch.getTime()) / 1000));

    const days = Math.floor(seconds / 86400);
    seconds -= days * 86400;
    const hours = Math.floor(seconds / 3600);
    seconds -= hours * 3600;
    const mins = Math.floor(seconds / 60);
    seconds -= mins * 60;

    const pad = n => String(n).padStart(2, '0');
    return `Uptime: ${days}d ${pad(hours)}h ${pad(mins)}m ${pad(seconds)}s | Live Since 02/02/2026`;
}

function statisticsSetStatus(syncing) {
    const status = document.getElementById('stats-status');
    if (!status) return;

    if (syncing) {
        status.classList.remove('live');
        status.classList.add('syncing');
        status.innerText = 'Receiving Updates... Standby...';
        return;
    }

    status.classList.remove('syncing');
    status.classList.add('live');
    status.innerText = 'LIVE';
}

function statisticsStopStatusLoop() {
    if (statisticsAppState.statusTimerId) {
        clearTimeout(statisticsAppState.statusTimerId);
        statisticsAppState.statusTimerId = null;
    }
    if (statisticsAppState.statusLiveTimerId) {
        clearTimeout(statisticsAppState.statusLiveTimerId);
        statisticsAppState.statusLiveTimerId = null;
    }
}

function statisticsRunStatusPulse() {
    statisticsSetStatus(true);
    statisticsAppState.statusLiveTimerId = setTimeout(() => {
        statisticsSetStatus(false);
    }, 1400);
    const nextDelayMs = Math.floor((5 + Math.random() * 7) * 1000);
    statisticsAppState.statusTimerId = setTimeout(statisticsRunStatusPulse, nextDelayMs);
}

function statisticsStartStatusLoop() {
    statisticsStopStatusLoop();
    statisticsSetStatus(false);
    const firstDelayMs = Math.floor((5 + Math.random() * 7) * 1000);
    statisticsAppState.statusTimerId = setTimeout(statisticsRunStatusPulse, firstDelayMs);
}

function statisticsSyncTelemetry() {
    const totalVal = document.getElementById('stats-totalVal');
    if (!totalVal) return;

    const uptimeEl = document.getElementById('stats-uptime');
    const rates = statisticsAppState.annualRates;
    const liveReach = statisticsGetLiveHits();

    totalVal.innerText = liveReach.toLocaleString();
    if (uptimeEl) uptimeEl.innerText = statisticsFormatUptime();

    const map = [
        ['stats-marriageVal', statisticsGetYTDValue(rates.marriages)],
        ['stats-divorceVal', statisticsGetYTDValue(rates.divorce)],
        ['stats-birthVal', statisticsGetYTDValue(rates.births)],
        ['stats-mentalVal', statisticsGetYTDValue(rates.mentalIllness)],
        ['stats-americanChurchVal', statisticsGetYTDValue(rates.americanChurch)],
        ['stats-hurtVal', statisticsGetYTDValue(rates.churchHurt)],
        ['stats-pulpitVal', statisticsGetYTDValue(rates.emptyPulpit)],
        ['stats-falseTeachingVal', statisticsGetYTDValue(rates.falseTeaching)]
    ];

    map.forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.innerText = Number(value).toLocaleString();
    });

    const persecutedVal = document.getElementById('stats-persecutedVal');
    if (persecutedVal) {
        persecutedVal.innerText = `+${statisticsGetYTDValue(rates.persecutedGrowth).toLocaleString()}`;
    }
}

function statisticsStopTelemetry() {
    if (statisticsAppState.timerId) {
        clearInterval(statisticsAppState.timerId);
        statisticsAppState.timerId = null;
    }
    statisticsStopStatusLoop();
}

function statisticsStartTelemetry() {
    statisticsStopTelemetry();
    statisticsSyncTelemetry();
    statisticsAppState.timerId = setInterval(statisticsSyncTelemetry, 5000);
    statisticsStartStatusLoop();
}

function openStatisticsApp() {
    document.getElementById('modal-back-text').innerText = 'CLEAR';
    document.getElementById('modal-back-btn').onclick = () => closeModal();
    document.getElementById('modal-title').innerHTML = `<span style="filter:none !important; text-shadow:none !important; margin-right:8px;">📊</span>STATISTICS`;
    document.getElementById('modal-subtitle').innerText = 'MISSION COMMAND | GLOBAL TELEMETRY';

    renderStatisticsAppShell();
    document.getElementById('data-modal').classList.add('active');
    bounceModalBodyToTop();

    statisticsStartTelemetry();
}

window.openStatisticsApp = openStatisticsApp;

if (typeof installAppAnchorSync === 'function') {
    installAppAnchorSync();
}