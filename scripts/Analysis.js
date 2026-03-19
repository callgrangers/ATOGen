// ==========================================
// APP: ANALYSIS (AMERICAN CHURCH)
// ==========================================

const analysisAppState = {
    charts: {
        generational: null,
        growth: null,
        radar: null
    },
    reasons: [
        {
            id: 'politics',
            title: 'Political Entanglement',
            stat: '42%',
            desc: 'Many younger adults report that overt partisan alignment makes the church feel politically captured rather than pastorally grounded.'
        },
        {
            id: 'authenticity',
            title: 'Authenticity Gap',
            stat: '35%',
            desc: 'Younger believers often prefer transparent discipleship over polished event-driven experiences that can feel performative.'
        },
        {
            id: 'trust',
            title: 'Institutional Trust Loss',
            stat: '45%',
            desc: 'Leadership scandals and abuse coverups have amplified skepticism toward centralized authority structures.'
        },
        {
            id: 'formation',
            title: 'Weak Formation Pathways',
            stat: '31%',
            desc: 'Where theological formation is thin, younger generations disengage because belief is not anchored in durable discipleship habits.'
        }
    ],
    selectedReasonId: 'politics'
};

function analysisEnsureStyles() {
    if (document.getElementById('analysis-app-style')) return;
    const style = document.createElement('style');
    style.id = 'analysis-app-style';
    style.textContent = `
        .analysis-wrap {
            color: #cbd5e1;
            background:
                radial-gradient(900px 450px at 10% -10%, rgba(6, 182, 212, 0.12), transparent 65%),
                radial-gradient(1000px 500px at 90% 110%, rgba(236, 72, 153, 0.1), transparent 68%),
                #020617;
            border-radius: 14px;
            border: 1px solid rgba(148, 163, 184, 0.22);
            padding: 18px;
        }
        .analysis-lead {
            font-size: 0.94rem;
            line-height: 1.7;
            color: #94a3b8;
            max-width: 900px;
        }
        .analysis-grid {
            display: grid;
            gap: 14px;
        }
        .analysis-panel {
            background: rgba(15, 23, 42, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 14px;
            box-shadow: 0 10px 28px rgba(0, 0, 0, 0.3);
        }
        .analysis-panel h4 {
            margin: 0 0 6px;
            color: #f8fafc;
            font-size: 1rem;
            font-weight: 800;
            letter-spacing: 0.3px;
        }
        .analysis-panel p {
            margin: 0;
            color: #94a3b8;
            font-size: 0.86rem;
            line-height: 1.6;
        }
        .analysis-chart {
            position: relative;
            width: 100%;
            height: 320px;
            margin-top: 12px;
        }
        .analysis-reasons {
            display: grid;
            grid-template-columns: minmax(220px, 1fr) 2fr;
            gap: 12px;
            margin-top: 14px;
        }
        .analysis-reason-btn {
            width: 100%;
            text-align: left;
            border-radius: 10px;
            border: 1px solid rgba(148, 163, 184, 0.22);
            background: rgba(15, 23, 42, 0.45);
            color: #cbd5e1;
            padding: 10px 12px;
            font-size: 0.84rem;
            font-weight: 700;
            cursor: pointer;
            margin-bottom: 8px;
            transition: all 0.2s ease;
        }
        .analysis-reason-btn:hover {
            border-color: rgba(6, 182, 212, 0.55);
            transform: translateY(-1px);
        }
        .analysis-reason-btn.active {
            background: rgba(6, 182, 212, 0.14);
            border-color: rgba(6, 182, 212, 0.65);
            color: #e2f9ff;
        }
        .analysis-reason-card {
            border-radius: 10px;
            border: 1px solid rgba(148, 163, 184, 0.25);
            background: rgba(2, 6, 23, 0.78);
            padding: 14px;
        }
        .analysis-reason-stat {
            display: inline-block;
            border: 1px solid rgba(6, 182, 212, 0.5);
            background: rgba(6, 182, 212, 0.15);
            color: #67e8f9;
            border-radius: 8px;
            padding: 4px 9px;
            font-size: 1.2rem;
            font-weight: 900;
            margin-bottom: 10px;
        }
        .analysis-two-col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
            margin-top: 14px;
        }
        @media (max-width: 900px) {
            .analysis-reasons {
                grid-template-columns: 1fr;
            }
            .analysis-two-col {
                grid-template-columns: 1fr;
            }
            .analysis-chart {
                height: 280px;
            }
        }
    `;
    document.head.appendChild(style);
}

function analysisDestroyCharts() {
    Object.values(analysisAppState.charts).forEach((chart) => {
        if (chart && typeof chart.destroy === 'function') chart.destroy();
    });
    analysisAppState.charts.generational = null;
    analysisAppState.charts.growth = null;
    analysisAppState.charts.radar = null;
}

function analysisRenderReasonButtons() {
    const host = document.getElementById('analysis-reasons-nav');
    if (!host) return;

    host.innerHTML = analysisAppState.reasons.map((reason) => {
        const isActive = reason.id === analysisAppState.selectedReasonId;
        return `<button type="button" class="analysis-reason-btn${isActive ? ' active' : ''}" onclick="analysisSelectReason('${reason.id}')">${reason.title}</button>`;
    }).join('');
}

function analysisRenderReasonCard() {
    const reason = analysisAppState.reasons.find((item) => item.id === analysisAppState.selectedReasonId) || analysisAppState.reasons[0];
    const host = document.getElementById('analysis-reason-content');
    if (!host || !reason) return;

    host.innerHTML = `
        <div class="analysis-reason-card">
            <div class="analysis-reason-stat">${reason.stat}</div>
            <h4 style="margin:0 0 8px; color:#f8fafc; font-size:1.05rem; font-weight:800;">${reason.title}</h4>
            <p style="margin:0; color:#cbd5e1; font-size:0.92rem; line-height:1.7;">${reason.desc}</p>
        </div>
    `;
}

window.analysisSelectReason = function(reasonId) {
    analysisAppState.selectedReasonId = reasonId;
    analysisRenderReasonButtons();
    analysisRenderReasonCard();
};

function analysisInitCharts() {
    if (typeof Chart === 'undefined') {
        const host = document.getElementById('analysis-app');
        if (host) {
            host.insertAdjacentHTML('beforeend', '<p style="margin-top:12px; color:#f87171;">Chart runtime is unavailable.</p>');
        }
        return;
    }

    analysisDestroyCharts();

    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = 'rgba(255,255,255,0.08)';

    const tooltip = {
        backgroundColor: 'rgba(15,23,42,0.95)',
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 10
    };

    const genCanvas = document.getElementById('analysis-generational-chart');
    if (genCanvas) {
        analysisAppState.charts.generational = new Chart(genCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['1990', '1995', '2000', '2005', '2010', '2015', '2020', '2024'],
                datasets: [
                    { label: 'Boomers', data: [65, 63, 62, 60, 58, 56, 52, 49], borderColor: '#64748b', tension: 0.35 },
                    { label: 'Gen X', data: [55, 52, 50, 48, 45, 42, 38, 35], borderColor: '#94a3b8', tension: 0.35 },
                    { label: 'Millennials', data: [null, null, 45, 40, 32, 28, 22, 18], borderColor: '#0ea5e9', borderWidth: 3, tension: 0.35 },
                    { label: 'Gen Z', data: [null, null, null, null, null, 25, 18, 12], borderColor: '#06b6d4', borderWidth: 3, borderDash: [5, 5], tension: 0.35 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' }, tooltip },
                scales: {
                    y: { beginAtZero: true, max: 80, title: { display: true, text: 'Attendance %' } },
                    x: { grid: { color: 'rgba(255,255,255,0.05)' } }
                }
            }
        });
    }

    const growthCanvas = document.getElementById('analysis-growth-chart');
    if (growthCanvas) {
        analysisAppState.charts.growth = new Chart(growthCanvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Global Avg', 'North America', 'Iran (Underground)', 'Afghanistan (Underground)', 'China (House Church)'],
                datasets: [{
                    label: 'Annual Growth (%)',
                    data: [1.18, -0.4, 19.6, 11.2, 5.5],
                    backgroundColor: ['rgba(71,85,105,0.65)', 'rgba(14,165,233,0.85)', 'rgba(236,72,153,0.9)', 'rgba(217,70,239,0.9)', 'rgba(249,115,22,0.9)'],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip },
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Annual Growth (%)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    const radarCanvas = document.getElementById('analysis-radar-chart');
    if (radarCanvas) {
        analysisAppState.charts.radar = new Chart(radarCanvas.getContext('2d'), {
            type: 'radar',
            data: {
                labels: ['Institutional Overhead', 'Relational Depth', 'Reliance on Clergy', 'Multiplication Speed', 'Cultural Safety'],
                datasets: [
                    {
                        label: 'American Evangelical',
                        data: [9, 4, 8, 2, 9],
                        backgroundColor: 'rgba(6,182,212,0.18)',
                        borderColor: '#06b6d4',
                        pointBackgroundColor: '#06b6d4'
                    },
                    {
                        label: 'Underground / Persecuted',
                        data: [1, 9, 2, 9, 1],
                        backgroundColor: 'rgba(236,72,153,0.18)',
                        borderColor: '#ec4899',
                        pointBackgroundColor: '#ec4899'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' }, tooltip },
                scales: {
                    r: {
                        min: 0,
                        max: 10,
                        ticks: { display: false },
                        angleLines: { color: 'rgba(255,255,255,0.1)' },
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        pointLabels: { color: '#cbd5e1', font: { size: 11 } }
                    }
                }
            }
        });
    }
}

function renderAnalysisShell() {
    const container = document.getElementById('modal-body-container');
    if (!container) return;

    analysisEnsureStyles();
    container.innerHTML = `
        <div id="analysis-app" class="analysis-wrap">
            <h2 style="margin:0 0 6px; color:#f8fafc; font-size:1.2rem; font-weight:900;">American Church vs Underground Church</h2>
            <p class="analysis-lead">Comparative diagnostics dashboard for generational attendance decline, underground movement growth, and structural paradigm differences.</p>

            <div class="analysis-grid" style="margin-top:14px;">
                <section class="analysis-panel">
                    <h4>Generational Church Attendance (1990-2024)</h4>
                    <p>Younger generations show steep drop-off compared to prior cohorts.</p>
                    <div class="analysis-chart"><canvas id="analysis-generational-chart"></canvas></div>
                </section>

                <section class="analysis-panel">
                    <h4>Why Younger Generations Leave</h4>
                    <div class="analysis-reasons">
                        <div id="analysis-reasons-nav"></div>
                        <div id="analysis-reason-content"></div>
                    </div>
                </section>

                <section class="analysis-panel">
                    <h4>Underground Church Growth vs Global Average</h4>
                    <p>High-restriction environments continue to show rapid multiplication.</p>
                    <div class="analysis-chart"><canvas id="analysis-growth-chart"></canvas></div>
                </section>

                <section class="analysis-panel">
                    <h4>Operational Footprint Comparison</h4>
                    <p>Radar profile of institutional and relational dynamics.</p>
                    <div class="analysis-chart"><canvas id="analysis-radar-chart"></canvas></div>
                </section>

                <section class="analysis-panel">
                    <h4>Conclusion</h4>
                    <p>Western decline appears tied to institutional dependency and low-cost formation. Underground expansion appears tied to distributed leadership, relational discipleship, and costly commitment.</p>
                </section>
            </div>
        </div>
    `;

    analysisRenderReasonButtons();
    analysisRenderReasonCard();
    analysisInitCharts();
}

function openAnalysisApp() {
    const modalBackText = document.getElementById('modal-back-text');
    const modalBackBtn = document.getElementById('modal-back-btn');
    const modalTitle = document.getElementById('modal-title');
    const modalSubtitle = document.getElementById('modal-subtitle');
    const container = document.getElementById('modal-body-container');
    const modal = document.getElementById('data-modal');

    if (!modalBackText || !modalBackBtn || !modalTitle || !modalSubtitle || !container || !modal) return;

    modalBackText.innerText = 'CLEAR';
    modalBackBtn.onclick = () => closeModal();
    modalTitle.innerHTML = `<span style="filter:none !important; text-shadow:none !important; margin-right:8px;">📈</span>ANALYSIS`;
    modalSubtitle.innerText = 'DIAGNOSTICS | AMERICAN CHURCH TRENDS';

    renderAnalysisShell();

    modal.classList.add('active');
    if (typeof bounceModalBodyToTop === 'function') bounceModalBodyToTop();
}

window.openAnalysisApp = openAnalysisApp;
window.analysisAppDestroy = analysisDestroyCharts;

if (typeof installAppAnchorSync === 'function') {
    installAppAnchorSync();
}
