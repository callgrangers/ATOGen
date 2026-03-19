// ==========================================
// APP: HEART CONDITION DIAGNOSTIC
// ==========================================

const heartAppState = {
    diagnosticData: [],
    answers: {},
    scanChartInstance: null,
    apiURL: `${MASTER_API_URL}?tab=Heart`,
    lastLoadedAt: 0,
    cacheTtlMs: 3 * 60 * 1000,
    inFlightLoadPromise: null
};

function renderHeartAppShell() {
    const container = document.getElementById('modal-body-container');
    container.innerHTML = `
        <div class="heart-app-wrap" id="heart-app" style="padding:16px;">
            <div style="margin-bottom:18px;">
                <h2 style="margin:0 0 4px; font-size:1.2rem; font-weight:900; color:#f8fafc;">Heart Condition Diagnostic</h2>
                <p style="margin:0; color:#94a3b8; font-size:0.9rem; line-height:1.6;">A biblical counseling tool to assess your spiritual vitality.</p>
            </div>

            <div class="heart-app-grid">
                <div class="heart-col-questions">
                    <h3 style="font-size:1rem; font-weight:700; margin:0 0 12px; color:#c084fc;">Diagnostic Questionnaire</h3>
                    <div id="heart-questions-container">
                        <div style="text-align:center; padding:20px;"><p style="color:#38bdf8;"> </p></div>
                    </div>
                </div>

                <div class="heart-col-chart">
                    <div class="heart-glass-panel" style="padding:16px; border-radius:12px;">
                        <h3 style="text-align:center; margin:0 0 8px 0; font-size:1rem; font-weight:700; color:#2dd4bf;">Spiritual Vitality Scan</h3>
                        <div class="heart-wrapper">
                            <div id="vitality-heart" class="css-heart heart-healthy"></div>
                        </div>
                        <p id="heart-status-text" style="text-align:center; margin:0 0 12px 0; font-size:0.75rem; font-weight:700; color:#2dd4bf; text-transform:uppercase; letter-spacing:1px;">Heart Condition: Clear</p>
                        <div class="heart-chart-container">
                            <canvas id="scanChart"></canvas>
                        </div>
                    </div>
                </div>

                <div class="heart-col-faith">
                    <div class="heart-glass-panel" style="padding:16px; border-radius:12px; border-top:2px solid rgba(6, 182, 212, 0.3);">
                        <h3 style="margin:0 0 12px 0; font-size:1rem; font-weight:700; color:#f8fafc;">Faith Response Plan</h3>
                        <div id="prescriptions-container" style="margin-bottom:12px;">
                            <p style="color:#94a3b8; font-size:0.85rem; text-align:center; font-style:italic;">Awaiting data...</p>
                        </div>
                        <button onclick="sendHeartSMS()" style="width:100%; background:linear-gradient(to right, #9333ea, #06b6d4); border:none; color:white; font-weight:700; padding:14px; border-radius:8px; cursor:pointer; font-size:0.9rem; text-transform:uppercase; letter-spacing:0.5px;">🆘 REQUEST HELP VIA SMS</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function heartFetchQuestions(forceReload = false) {
    const now = Date.now();
    const hasWarmCache = heartAppState.diagnosticData.length > 0 && (now - heartAppState.lastLoadedAt) < heartAppState.cacheTtlMs;
    if (!forceReload && hasWarmCache) {
        heartInitApp();
        return;
    }

    if (heartAppState.inFlightLoadPromise) {
        return heartAppState.inFlightLoadPromise;
    }

    heartAppState.inFlightLoadPromise = (async () => {
        let lastError = null;

        for (let attempt = 0; attempt < 3; attempt += 1) {
            try {
                const response = await fetch(heartAppState.apiURL, {
                    cache: 'no-store',
                    signal: AbortSignal.timeout(9000)
                });
                const rawData = await response.json();
                const dataArray = Array.isArray(rawData) ? rawData : (rawData.data || rawData.result || []);

                if (!Array.isArray(dataArray) || dataArray.length === 0) {
                    throw new Error('No data returned from API');
                }

                heartAppState.diagnosticData = dataArray.map(item => ({
                    id: item.question_id,
                    category: item.category,
                    chartAxis: item.chart_axis,
                    text: item.question,
                    prescription: item.prescription,
                    verseReference: item.verse_reference
                }));

                heartAppState.lastLoadedAt = Date.now();
                heartInitApp();
                return;
            } catch (error) {
                lastError = error;
                if (attempt < 2) {
                    await new Promise(resolve => setTimeout(resolve, 450 * (attempt + 1)));
                }
            }
        }

        throw lastError || new Error('Heart data sync failed');
    })();

    try {
        await heartAppState.inFlightLoadPromise;
    } catch (error) {
        console.error('Heart Database Error:', error);
        const container = document.getElementById('heart-questions-container');
        if (container) {
            container.innerHTML = `
                <div style="padding:16px; color:#f87171; text-align:center; font-size:0.85rem; border:1px solid rgba(244,63,94,0.3); border-radius:8px;">
                    <p style="margin:0 0 8px 0; font-weight:700;">⚠️ Starlink sync error. Please try again.</p>
                </div>
            `;
        }
    } finally {
        heartAppState.inFlightLoadPromise = null;
    }
}

function heartInitApp() {
    heartRenderQuestions();
    heartInitChart();
}

function heartRenderQuestions() {
    const container = document.getElementById('heart-questions-container');
    if (!container) return; // Prevent errors during preload before modal is open
    
    container.innerHTML = '';

    heartAppState.diagnosticData.forEach((item, index) => {
        const qDiv = document.createElement('div');
        qDiv.className = 'heart-glass-panel';
        qDiv.id = `heart-card-${item.id}`;
        qDiv.style.cssText = 'padding:12px; border-radius:8px; margin-bottom:8px; border:1px solid rgba(255,255,255,0.1); transition:all 0.3s;';
        
        qDiv.innerHTML = `
            <div style="margin-bottom:8px;">
                <span style="font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:0.15em; color:#38bdf8;">${item.category}</span>
                <p style="margin:4px 0 0 0; font-size:0.98rem; line-height:1.52; color:#e2e8f0;">${index + 1}. ${item.text}</p>
            </div>
            <div style="display:flex; gap:6px;">
                <button onclick="heartHandleAnswer('${item.id}', 'yes')" id="btn-yes-${item.id}" class="answer-btn" style="flex:1; font-size:0.8rem;">Yes</button>
                <button onclick="heartHandleAnswer('${item.id}', 'no')" id="btn-no-${item.id}" class="answer-btn" style="flex:1; font-size:0.8rem;">No</button>
            </div>
        `;
        container.appendChild(qDiv);

        const priorAnswer = heartAppState.answers[item.id];
        if (priorAnswer === 'yes') {
            const yesBtn = qDiv.querySelector(`#btn-yes-${item.id}`);
            if (yesBtn) yesBtn.classList.add('selected-yes');
            qDiv.style.borderColor = 'rgba(244, 63, 94, 0.4)';
        } else if (priorAnswer === 'no') {
            const noBtn = qDiv.querySelector(`#btn-no-${item.id}`);
            if (noBtn) noBtn.classList.add('selected-no');
            qDiv.style.borderColor = 'rgba(20, 184, 166, 0.4)';
        }
    });

    const scrollBtn = document.createElement('div');
    scrollBtn.style.cssText = 'margin-top:16px; text-align:center;';
    scrollBtn.innerHTML = `
        <button onclick="document.querySelector('#data-modal .modal-body').scrollTo({top:0,behavior:'smooth'})" class="answer-btn" style="width:100%; padding:14px; border-radius:10px; font-size:0.88rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; background:linear-gradient(to right, rgba(147,51,234,0.3), rgba(6,182,212,0.3)); border-color:rgba(6,182,212,0.4); color:#e2e8f0;">
            ↑ View My Results
        </button>
    `;
    container.appendChild(scrollBtn);
}

function heartHandleAnswer(questionId, answer) {
    heartAppState.answers[questionId] = answer;
    const btnYes = document.getElementById(`btn-yes-${questionId}`);
    const btnNo = document.getElementById(`btn-no-${questionId}`);
    const card = document.getElementById(`heart-card-${questionId}`);

    btnYes.classList.remove('selected-yes');
    btnNo.classList.remove('selected-no');
    
    if (answer === 'yes') {
        btnYes.classList.add('selected-yes');
        card.style.borderColor = 'rgba(244, 63, 94, 0.4)';
    } else {
        btnNo.classList.add('selected-no');
        card.style.borderColor = 'rgba(20, 184, 166, 0.4)';
    }
    heartUpdateDashboard();
}

function heartInitChart() {
    const canvas = document.getElementById('scanChart');
    if (!canvas) return;

    if (heartAppState.scanChartInstance) {
        heartAppState.scanChartInstance.destroy();
        heartAppState.scanChartInstance = null;
    }

    const ctx = canvas.getContext('2d');
    const categories = [...new Set(heartAppState.diagnosticData.map(d => d.chartAxis))];
    
    heartAppState.scanChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [{
                data: categories.map(() => 0),
                backgroundColor: 'rgba(20, 184, 166, 0.8)',
                borderRadius: 3
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { min: 0, max: 3, grid: { display: false }, ticks: { stepSize: 1, color: '#94a3b8' } },
                y: { grid: { display: false }, ticks: { color: '#f1f5f9', font: { size: 10 } } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function heartUpdateDashboard() {
    const categories = [...new Set(heartAppState.diagnosticData.map(d => d.chartAxis))];
    const scores = categories.map(cat => 
        heartAppState.diagnosticData.filter(d => d.chartAxis === cat && heartAppState.answers[d.id] === 'yes').length
    );

    // Only update if chart exists (may not be in DOM during preload)
    if (heartAppState.scanChartInstance) {
        heartAppState.scanChartInstance.data.datasets[0].data = scores;
        heartAppState.scanChartInstance.data.datasets[0].backgroundColor = scores.map(val => 
            val >= 2 ? 'rgba(244, 63, 94, 0.9)' : (val >= 1 ? 'rgba(245, 158, 11, 0.9)' : 'rgba(20, 184, 166, 0.8)')
        );
        heartAppState.scanChartInstance.update();
    }

    const totalYes = Object.values(heartAppState.answers).filter(v => v === 'yes').length;
    const heart = document.getElementById('vitality-heart');
    const statusText = document.getElementById('heart-status-text');
    const pContainer = document.getElementById('prescriptions-container');

    heart.className = 'css-heart ' + (totalYes > 4 ? 'heart-distressed' : (totalYes > 0 ? 'heart-warning' : 'heart-healthy'));
    statusText.innerText = totalYes > 4 ? "HEART CONDITION: HIGH DISTRESS" : (totalYes > 0 ? "HEART CONDITION: WARNING" : "HEART CONDITION: CLEAR");
    statusText.style.color = totalYes > 4 ? "#f43f5e" : (totalYes > 0 ? "#f59e0b" : "#2dd4bf");

    const yesAnswers = heartAppState.diagnosticData.filter(item => heartAppState.answers[item.id] === 'yes');
    pContainer.innerHTML = yesAnswers.length ? '' : '<p style="color:#94a3b8; font-size:0.8rem; text-align:center; font-style:italic;">Awaiting data...</p>';
    
    yesAnswers.forEach(item => {
        const block = document.createElement('div');
        block.className = 'prescription-card-enter heart-glass-panel';
        block.style.cssText = 'padding:8px; border-radius:6px; border-left:3px solid #f43f5e; margin-bottom:6px;';
        block.innerHTML = `
            <h4 style="margin:0 0 4px 0; font-size:0.84rem; font-weight:700; color:#f8fafc;">${item.category}:</h4>
            <p style="margin:0 0 6px 0; font-size:0.84rem; color:#cbd5e1; line-height:1.48;">${item.prescription}</p>
            <span style="background:rgba(255,255,255,0.05); color:#2dd4bf; font-size:0.72rem; font-weight:700; padding:2px 6px; border-radius:4px; display:inline-block;">${item.verseReference}</span>
        `;
        pContainer.appendChild(block);
    });
}

function sendHeartSMS() {
    const struggleItems = heartAppState.diagnosticData.filter(item => heartAppState.answers[item.id] === 'yes');
    if (struggleItems.length === 0) {
        alert("Please answer 'Yes' to at least one question to generate a report.");
        return;
    }

    let message = "HEART DIAGNOSTIC REPORT\n" + "=".repeat(40) + "\n\n";
    message += "AREAS OF SPIRITUAL CONCERN:\n";
    struggleItems.forEach((item, index) => {
        message += `\n${index + 1}. ${item.category.toUpperCase()}\n`;
        message += `   Struggle: ${item.prescription}\n`;
        message += `   Scripture: ${item.verseReference}`;
    });
    message += "\n\n" + "=".repeat(40) + "\n";
    message += "COUNSELING REQUEST:\n";
    message += "I have completed the Heart Condition Diagnostic and would like to discuss these results with a biblical counselor to develop a personal faith response plan.";

    if (typeof openPrayerRequestApp === 'function') {
        openPrayerRequestApp(message);
        return;
    }
    window.location.href = '/request';
}

function openHeartApp() {
    document.getElementById('modal-back-text').innerText = 'CLEAR';
    document.getElementById('modal-back-btn').onclick = () => closeModal();
    document.getElementById('modal-title').innerHTML = `<span style="filter:none !important; text-shadow:none !important; margin-right:8px;">❤️</span>HEART`;
    document.getElementById('modal-subtitle').innerText = 'SPIRITUAL VITALITY SCAN + BIBLICAL COUNSELING';

    renderHeartAppShell();
    document.getElementById('data-modal').classList.add('active');
    bounceModalBodyToTop();

    heartAppState.answers = {};
    
    heartFetchQuestions();
}

function heartHandleClockRefresh(event) {
    const detail = event && event.detail ? event.detail : {};
    const forceRefresh = !!detail.force;
    const heartOpen = !!document.getElementById('heart-app');

    // Minute ticks should only refresh in the background so active sessions are not interrupted.
    if (heartOpen && !forceRefresh) {
        return;
    }

    heartFetchQuestions(forceRefresh).catch((error) => {
        console.error('Heart clock refresh failed:', error);
    });
}

window.addEventListener('aos:clock-refresh', heartHandleClockRefresh);

window.openHeartApp = openHeartApp;

if (typeof installAppAnchorSync === 'function') {
    installAppAnchorSync();
}