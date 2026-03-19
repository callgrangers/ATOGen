// ==========================================
// APP: BIBLE QUIZ
// ==========================================

const QUIZ_APP_CONFIG = {
    apiURL: MASTER_API_URL
};

const quizAppState = {
    db: [],
    quizQuestions: [],
    currentQuestionIndex: 0,
    userAnswers: [],
    quizActive: true,
    currentCorrectLetter: '',
    currentCorrectText: '',
    catChartInstance: null,
    diffChartInstance: null,
    initialized: false,
    lastLoadedAt: 0,
    cacheTtlMs: 5 * 60 * 1000,
    inFlightLoadPromise: null
};

function qzEscape(text) {
    return String(text == null ? '' : text)
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#39;');
}

function qzShuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function ensureQuizChartLibrary() {
    if (window.Chart) return;
    await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', sans-serif";
}

function renderQuizAppShell() {
    const container = document.getElementById('modal-body-container');
    container.innerHTML = `
        <div class="qz-app-wrap" id="qz-app">
            <div id="qz-app-loading" class="qz-glass text-center" style="padding:26px; border-radius:18px; margin-bottom:18px;">
                <div style="width:56px; height:56px; border:4px solid rgba(56,189,248,0.25); border-top-color:#38bdf8; border-radius:50%; margin:0 auto 12px; animation:qzSpin 1s linear infinite;"></div>
                <h2 style="margin:0; font-size:1.1rem; font-weight:900; letter-spacing:1px; text-transform:uppercase;" class="qz-text-gradient">Initializing Quiz Module</h2>
                <p style="margin:8px 0 0; color:#94a3b8; font-size:0.9rem;">Connecting to database...</p>
            </div>

            <header style="margin-bottom:18px; text-align:center;">
                <h1 style="margin:0 0 8px; font-size:clamp(1.6rem, 4vw, 2.25rem); font-weight:900; letter-spacing:1px; text-transform:uppercase;" class="qz-text-gradient">Biblical Knowledge Assessment</h1>
                <p style="margin:0; color:#94a3b8;">Interactive test, source table, and analytics in one view.</p>
            </header>

            <nav style="display:flex; justify-content:center; flex-wrap:wrap; gap:8px; margin-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px;">
                <button onclick="quizSwitchTab('test')" id="qz-tab-test" class="qz-tab-btn" style="padding:10px 14px; border-radius:10px; border:1px solid transparent; background:rgba(255,255,255,0.1); color:#38bdf8; font-weight:800; letter-spacing:1px; text-transform:uppercase; cursor:pointer;">Interactive Test</button>
                <button onclick="quizSwitchTab('data')" id="qz-tab-data" class="qz-tab-btn" style="padding:10px 14px; border-radius:10px; border:1px solid transparent; background:transparent; color:#94a3b8; font-weight:800; letter-spacing:1px; text-transform:uppercase; cursor:pointer;">Data Spreadsheet</button>
                <button onclick="quizSwitchTab('analytics')" id="qz-tab-analytics" class="qz-tab-btn" style="padding:10px 14px; border-radius:10px; border:1px solid transparent; background:transparent; color:#94a3b8; font-weight:800; letter-spacing:1px; text-transform:uppercase; cursor:pointer;">Analytics</button>
            </nav>

            <section id="qz-content-test" class="qz-tab-content active qz-glass" style="padding:18px; border-radius:16px;">
                <div style="margin-bottom:16px;">
                    <h2 style="font-size:1.5rem; margin:0 0 4px; font-weight:900;">Test Your Knowledge</h2>
                    <p style="margin:0; color:#94a3b8;">Questions and options are randomized, and each answer advances automatically.</p>
                </div>
                <div id="qz-quiz-container" class="qz-glass" style="background:rgba(0,0,0,0.2); padding:18px; border-radius:14px;">
                    <div style="width:100%; background:rgba(255,255,255,0.08); border-radius:100px; height:6px; margin-bottom:12px;">
                        <div id="qz-quiz-progress-bar" style="height:6px; border-radius:100px; width:0%; background:#38bdf8; transition:width 0.3s;"></div>
                    </div>
                    <div style="display:flex; justify-content:space-between; gap:10px; margin-bottom:14px; font-size:0.72rem; font-weight:900; letter-spacing:1px; text-transform:uppercase; color:#64748b;">
                        <span id="qz-quiz-progress" style="background:rgba(255,255,255,0.05); padding:5px 8px; border-radius:8px;">Loading...</span>
                        <span id="qz-quiz-category" style="background:rgba(99,102,241,0.2); color:#c7d2fe; border:1px solid rgba(99,102,241,0.35); padding:5px 8px; border-radius:8px;">Category</span>
                    </div>
                    <h3 id="qz-quiz-question" class="qz-question-fade" style="font-size:1.45rem; line-height:1.4; margin:0 0 14px;">Fetching questions...</h3>
                    <div id="qz-quiz-options" class="qz-question-fade" style="display:grid; gap:10px;"></div>
                    <div id="qz-quiz-feedback" style="margin-top:12px;"></div>
                </div>
                <div id="qz-quiz-results" class="qz-glass" style="display:none; margin-top:14px; background:rgba(0,0,0,0.2); padding:20px; border-radius:14px; text-align:center;">
                    <div style="font-size:2.1rem; margin-bottom:8px;">🏆</div>
                    <h3 style="margin:0; font-size:1.7rem; font-weight:900;">Assessment Complete</h3>
                    <p style="color:#94a3b8; margin:6px 0 18px;">Here is how you performed.</p>
                    <div id="qz-final-score-display" class="qz-text-gradient" style="font-size:3rem; font-weight:900;">0/0</div>
                    <p id="qz-final-percentage" style="font-size:0.85rem; text-transform:uppercase; letter-spacing:1px; color:#64748b; font-weight:800; margin-top:4px;">0% Accuracy</p>
                    <div id="qz-study-areas" style="margin:18px 0;"></div>
                    <button onclick="quizReset()" class="clear-btn" style="margin:0 auto; justify-content:center;">Retake Test</button>
                </div>
            </section>

            <section id="qz-content-data" class="qz-tab-content qz-glass" style="padding:18px; border-radius:16px;">
                <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; align-items:flex-end; margin-bottom:12px;">
                    <div>
                        <h2 style="font-size:1.45rem; margin:0 0 5px; font-weight:900;">Master Database</h2>
                        <p style="margin:0; color:#94a3b8;">Full list of questions and metadata.</p>
                    </div>
                    <button onclick="quizCopyTable()" class="clear-btn" style="justify-content:center;">Copy Database</button>
                </div>
                <div style="overflow-x:auto; border-radius:14px; border:1px solid rgba(255,255,255,0.1); background:rgba(0,0,0,0.2); padding:4px;">
                    <table id="qz-questions-table" class="qz-table" style="min-width:900px;">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Question</th>
                                <th>Option A</th>
                                <th>Option B</th>
                                <th>Option C</th>
                                <th>Option D</th>
                                <th>Answer</th>
                                <th>Reference</th>
                                <th>Category</th>
                                <th>Difficulty</th>
                            </tr>
                        </thead>
                        <tbody id="qz-table-body"></tbody>
                    </table>
                </div>
            </section>

            <section id="qz-content-analytics" class="qz-tab-content qz-glass" style="padding:18px; border-radius:16px;">
                <div style="text-align:center; margin-bottom:14px;">
                    <h2 style="font-size:1.45rem; margin:0 0 5px; font-weight:900;">Assessment Analytics</h2>
                    <p style="margin:0; color:#94a3b8;">Category and difficulty distribution for the loaded question set.</p>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 280px), 1fr)); gap:12px;">
                    <div class="qz-glass" style="background:rgba(0,0,0,0.2); padding:12px; border-radius:14px;">
                        <h3 style="font-size:0.74rem; margin:0 0 8px; letter-spacing:1px; text-transform:uppercase; color:#94a3b8; font-weight:900;">Distribution by Category</h3>
                        <div class="qz-chart-container"><canvas id="qz-categoryChart"></canvas></div>
                    </div>
                    <div class="qz-glass" style="background:rgba(0,0,0,0.2); padding:12px; border-radius:14px;">
                        <h3 style="font-size:0.74rem; margin:0 0 8px; letter-spacing:1px; text-transform:uppercase; color:#94a3b8; font-weight:900;">Distribution by Difficulty</h3>
                        <div class="qz-chart-container"><canvas id="qz-difficultyChart"></canvas></div>
                    </div>
                </div>
            </section>
        </div>
    `;
}

function quizSwitchTab(tabId) {
    document.querySelectorAll('.qz-tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.qz-tab-btn').forEach(btn => {
        btn.style.background = 'transparent';
        btn.style.color = '#94a3b8';
        btn.style.borderColor = 'transparent';
    });
    const content = document.getElementById(`qz-content-${tabId}`);
    const tabBtn = document.getElementById(`qz-tab-${tabId}`);
    if (content) content.classList.add('active');
    if (tabBtn) {
        tabBtn.style.background = 'rgba(255,255,255,0.1)';
        tabBtn.style.color = '#38bdf8';
        tabBtn.style.borderColor = 'rgba(56,189,248,0.5)';
    }
    if (tabId === 'analytics') {
        quizInitCharts();
    }
}

function qzSelectTab(tabId) {
    quizSwitchTab(tabId);
}

function quizInitTable() {
    const tbody = document.getElementById('qz-table-body');
    if (!tbody) return;
    let html = '';
    quizAppState.db.forEach(item => {
        html += `
            <tr>
                <td style="font-weight:800; color:#94a3b8;">${qzEscape(item.id)}</td>
                <td style="font-weight:700; color:#f8fafc;">${qzEscape(item.q)}</td>
                <td>${qzEscape(item.a)}</td>
                <td>${qzEscape(item.b)}</td>
                <td>${qzEscape(item.c)}</td>
                <td>${qzEscape(item.d)}</td>
                <td style="font-weight:900; color:#38bdf8; text-align:center;">${qzEscape(item.ans)}</td>
                <td style="font-size:0.75rem; color:#94a3b8;">${qzEscape(item.ref)}</td>
                <td><span style="background:rgba(99,102,241,0.2); color:#c7d2fe; border:1px solid rgba(99,102,241,0.35); padding:3px 6px; border-radius:8px; font-size:0.72rem; white-space:nowrap;">${qzEscape(item.cat)}</span></td>
                <td><span style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); padding:3px 6px; border-radius:8px; font-size:0.72rem; white-space:nowrap;">${qzEscape(item.diff)}</span></td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

async function quizCopyTable() {
    const table = document.getElementById('qz-questions-table');
    if (!table) return;
    const text = table.innerText;
    try {
        await navigator.clipboard.writeText(text);
        alert('Database copied to clipboard!');
    } catch {
        const range = document.createRange();
        range.selectNode(table);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        document.execCommand('copy');
        window.getSelection().removeAllRanges();
        alert('Database copied to clipboard!');
    }
}

function quizStart() {
    quizAppState.quizQuestions = qzShuffleArray([...quizAppState.db]);
    quizAppState.currentQuestionIndex = 0;
    quizAppState.userAnswers = [];
    quizLoadQuestion();
}

function quizLoadQuestion() {
    if (quizAppState.currentQuestionIndex >= quizAppState.quizQuestions.length) {
        quizShowResults();
        return;
    }

    const q = quizAppState.quizQuestions[quizAppState.currentQuestionIndex];
    const progressEl = document.getElementById('qz-quiz-progress');
    const progressBarEl = document.getElementById('qz-quiz-progress-bar');
    const categoryEl = document.getElementById('qz-quiz-category');
    const questionEl = document.getElementById('qz-quiz-question');
    const optionsEl = document.getElementById('qz-quiz-options');
    const feedbackEl = document.getElementById('qz-quiz-feedback');

    if (!progressEl || !progressBarEl || !categoryEl || !questionEl || !optionsEl || !feedbackEl) return;

    progressEl.innerText = `Question ${quizAppState.currentQuestionIndex + 1} of ${quizAppState.quizQuestions.length}`;
    progressBarEl.style.width = `${(quizAppState.currentQuestionIndex / quizAppState.quizQuestions.length) * 100}%`;
    categoryEl.innerText = q.cat;

    questionEl.classList.remove('qz-question-fade');
    optionsEl.classList.remove('qz-question-fade');
    void questionEl.offsetWidth;
    questionEl.classList.add('qz-question-fade');
    optionsEl.classList.add('qz-question-fade');

    questionEl.innerText = q.q;

    const originalAnsLetter = String(q.ans || '').toLowerCase();
    quizAppState.currentCorrectText = q[originalAnsLetter];

    const optionsText = qzShuffleArray([q.a, q.b, q.c, q.d]);
    const labels = ['A', 'B', 'C', 'D'];

    const optionsHtml = optionsText.map((text, index) => {
        const letter = labels[index];
        if (text === quizAppState.currentCorrectText) quizAppState.currentCorrectLetter = letter;
        return `
            <label class="qz-option" style="display:block; padding:14px; border:1px solid rgba(255,255,255,0.12); border-radius:12px; cursor:pointer; transition:all 0.2s; background:rgba(255,255,255,0.03);" onclick="quizSelectAnswer('${letter}')">
                <input type="radio" name="qz-answer" value="${letter}" style="display:none;">
                <span style="color:#cbd5e1;"><strong style="color:rgba(56,189,248,0.7); margin-right:7px;">${letter})</strong>${qzEscape(text)}</span>
            </label>
        `;
    }).join('');

    optionsEl.innerHTML = optionsHtml;
    feedbackEl.innerHTML = '';
    quizAppState.quizActive = true;
}

function quizSelectAnswer(selectedLetter) {
    if (!quizAppState.quizActive) return;
    quizAppState.quizActive = false;

    const q = quizAppState.quizQuestions[quizAppState.currentQuestionIndex];
    const isCorrect = selectedLetter === quizAppState.currentCorrectLetter;
    quizAppState.userAnswers.push({ category: q.cat, correct: isCorrect });

    const labels = document.querySelectorAll('#qz-quiz-options .qz-option');
    const feedbackEl = document.getElementById('qz-quiz-feedback');
    labels.forEach(label => {
        const input = label.querySelector('input');
        input.disabled = true;
        label.style.cursor = 'default';
        if (input.value === quizAppState.currentCorrectLetter) {
            label.style.background = 'rgba(16,185,129,0.2)';
            label.style.borderColor = 'rgba(16,185,129,0.55)';
        } else if (input.value === selectedLetter && !isCorrect) {
            label.style.background = 'rgba(244,63,94,0.2)';
            label.style.borderColor = 'rgba(244,63,94,0.55)';
        } else {
            label.style.opacity = '0.55';
        }
    });

    if (feedbackEl) {
        feedbackEl.innerHTML = isCorrect
            ? `<div class="qz-question-fade"><span style="color:#34d399; font-weight:900; letter-spacing:1px; text-transform:uppercase;">Correct</span> <span style="font-size:0.74rem; color:#94a3b8; text-transform:uppercase; margin-left:6px;">Ref: ${qzEscape(q.ref)}</span></div>`
            : `<div class="qz-question-fade"><span style="color:#fb7185; font-weight:900; letter-spacing:1px; text-transform:uppercase;">Incorrect</span> <span style="font-size:0.74rem; color:#94a3b8; text-transform:uppercase; margin-left:6px;">Ref: ${qzEscape(q.ref)}</span></div>`;
    }

    setTimeout(() => {
        quizAppState.currentQuestionIndex += 1;
        quizLoadQuestion();
    }, 1400);
}

function quizShowResults() {
    const quizContainer = document.getElementById('qz-quiz-container');
    const results = document.getElementById('qz-quiz-results');
    if (!quizContainer || !results) return;

    quizContainer.style.display = 'none';
    results.style.display = 'block';

    const totalCorrect = quizAppState.userAnswers.filter(a => a.correct).length;
    const total = quizAppState.quizQuestions.length || 1;
    const pct = Math.round((totalCorrect / total) * 100);

    const scoreEl = document.getElementById('qz-final-score-display');
    const pctEl = document.getElementById('qz-final-percentage');
    if (scoreEl) scoreEl.innerText = `${totalCorrect}/${quizAppState.quizQuestions.length}`;
    if (pctEl) pctEl.innerText = `${pct}% Accuracy`;

    const categoryStats = {};
    quizAppState.userAnswers.forEach(ans => {
        if (!categoryStats[ans.category]) categoryStats[ans.category] = { total: 0, correct: 0 };
        categoryStats[ans.category].total += 1;
        if (ans.correct) categoryStats[ans.category].correct += 1;
    });

    const weakAreas = [];
    for (const [cat, stats] of Object.entries(categoryStats)) {
        const catPct = stats.correct / stats.total;
        if (catPct < 0.7) weakAreas.push({ cat, catPct });
    }

    const studyContainer = document.getElementById('qz-study-areas');
    if (!studyContainer) return;
    if (weakAreas.length > 0) {
        weakAreas.sort((a, b) => a.catPct - b.catPct);
        let html = `<h4 style="font-size:1.15rem; font-weight:800; margin:0 0 10px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:7px;">Recommended Study Areas</h4><div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:8px; text-align:left;">`;
        weakAreas.forEach(area => {
            const scoreFormatted = Math.round(area.catPct * 100);
            html += `<div class="qz-glass" style="background:rgba(244,63,94,0.08); border-color:rgba(244,63,94,0.25); padding:10px; border-radius:10px;"><span style="display:block; font-size:0.7rem; font-weight:900; color:#fb7185; text-transform:uppercase; letter-spacing:1px; margin-bottom:3px;">${qzEscape(area.cat)}</span><span style="font-size:0.88rem; color:#cbd5e1;">Category Score: <strong style="color:#fff;">${scoreFormatted}%</strong></span></div>`;
        });
        html += '</div>';
        studyContainer.innerHTML = html;
    } else {
        studyContainer.innerHTML = `<div class="qz-glass" style="background:rgba(16,185,129,0.1); border-color:rgba(16,185,129,0.25); padding:12px; border-radius:10px;"><h4 style="margin:0 0 4px; font-size:0.82rem; color:#34d399; text-transform:uppercase; letter-spacing:1px; font-weight:900;">Outstanding Work</h4><p style="margin:0; color:#cbd5e1; font-size:0.9rem;">You demonstrated strong proficiency across all categories.</p></div>`;
    }
}

function quizReset() {
    const results = document.getElementById('qz-quiz-results');
    const quizContainer = document.getElementById('qz-quiz-container');
    if (results) results.style.display = 'none';
    if (quizContainer) quizContainer.style.display = 'block';
    quizStart();
}

async function quizInitCharts() {
    const categoryCanvas = document.getElementById('qz-categoryChart');
    const difficultyCanvas = document.getElementById('qz-difficultyChart');
    if (!categoryCanvas || !difficultyCanvas || !quizAppState.db.length) return;

    try {
        await ensureQuizChartLibrary();
    } catch {
        return;
    }

    if (quizAppState.catChartInstance) quizAppState.catChartInstance.destroy();
    if (quizAppState.diffChartInstance) quizAppState.diffChartInstance.destroy();

    const categories = {};
    const difficulties = {};
    quizAppState.db.forEach(q => {
        categories[q.cat] = (categories[q.cat] || 0) + 1;
        difficulties[q.diff] = (difficulties[q.diff] || 0) + 1;
    });

    const palette = ['#38bdf8', '#818cf8', '#c084fc', '#e879f9', '#f472b6', '#fb7185', '#34d399', '#2dd4bf'];

    const catCtx = categoryCanvas.getContext('2d');
    quizAppState.catChartInstance = new Chart(catCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: palette,
                borderWidth: 2,
                borderColor: '#020617',
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right', labels: { color: '#e2e8f0' } } }
        }
    });

    const diffCtx = difficultyCanvas.getContext('2d');
    quizAppState.diffChartInstance = new Chart(diffCtx, {
        type: 'bar',
        data: {
            labels: ['Easy', 'Medium', 'Hard'],
            datasets: [{
                label: 'Questions',
                data: [difficulties['Easy'] || 0, difficulties['Medium'] || 0, difficulties['Hard'] || 0],
                backgroundColor: ['#34d399', '#38bdf8', '#c084fc'],
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', stepSize: 1 } },
                x: { grid: { display: false }, ticks: { color: '#e2e8f0', font: { weight: 'bold' } } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function quizPickField(obj, keys) {
    if (!obj || typeof obj !== 'object') return '';
    const objKeys = Object.keys(obj);
    for (const key of keys) {
        const found = objKeys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === key.toLowerCase().replace(/[^a-z0-9]/g, ''));
        if (found && obj[found] != null) return String(obj[found]).trim();
    }
    return '';
}

function quizNormalizeAnswer(rawAns, options) {
    const ans = String(rawAns || '').trim();
    if (!ans) return '';
    const letter = ans.charAt(0).toLowerCase();
    if (['a', 'b', 'c', 'd'].includes(letter) && ans.length <= 3) return letter;
    const idx = options.findIndex(opt => String(opt || '').trim().toLowerCase() === ans.toLowerCase());
    return idx >= 0 ? ['a', 'b', 'c', 'd'][idx] : '';
}

function quizNormalizeDataset(payload) {
    let rows = payload;
    if (rows && typeof rows === 'object' && !Array.isArray(rows)) {
        if (Array.isArray(rows.data)) rows = rows.data;
        else if (Array.isArray(rows.rows)) rows = rows.rows;
        else if (Array.isArray(rows.questions)) rows = rows.questions;
    }
    if (!Array.isArray(rows)) return [];

    return rows.map((row, idx) => {
        const q = quizPickField(row, ['q', 'question', 'prompt']);
        const a = quizPickField(row, ['a', 'optiona', 'choicea', 'answera']);
        const b = quizPickField(row, ['b', 'optionb', 'choiceb', 'answerb']);
        const c = quizPickField(row, ['c', 'optionc', 'choicec', 'answerc']);
        const d = quizPickField(row, ['d', 'optiond', 'choiced', 'answerd']);
        const ansRaw = quizPickField(row, ['ans', 'answer', 'correct', 'correctanswer']);
        const options = [a, b, c, d];
        const ans = quizNormalizeAnswer(ansRaw, options);

        return {
            id: quizPickField(row, ['id', 'qid', 'index']) || String(idx + 1),
            q, a, b, c, d, ans,
            ref: quizPickField(row, ['ref', 'reference', 'verse']) || 'N/A',
            cat: quizPickField(row, ['cat', 'category', 'topic']) || 'General',
            diff: quizPickField(row, ['diff', 'difficulty', 'level']) || 'Medium'
        };
    }).filter(item => item.q && item.a && item.b && item.c && item.d && item.ans);
}

async function quizLoadData(forceReload = false, background = false) {
    const now = Date.now();
    const hasWarmCache = quizAppState.db.length > 0 && (now - quizAppState.lastLoadedAt) < quizAppState.cacheTtlMs;
    if (!forceReload && hasWarmCache) return;

    if (quizAppState.inFlightLoadPromise) {
        return quizAppState.inFlightLoadPromise;
    }

    quizAppState.inFlightLoadPromise = (async () => {
    const base = QUIZ_APP_CONFIG.apiURL;
    const url = `${base}?tab=Quiz`;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Quiz API error: ${response.status}`);
    const data = await response.json();
    const normalized = quizNormalizeDataset(data);
    if (!normalized.length) throw new Error('Quiz API returned no valid rows');
    quizAppState.db = normalized;
    quizAppState.lastLoadedAt = Date.now();
    })();

    try {
        await quizAppState.inFlightLoadPromise;
    } catch (error) {
        if (!background) throw error;
    } finally {
        quizAppState.inFlightLoadPromise = null;
    }
}

function openQuizWindow() {
    openQuizApp();
}

async function openQuizApp() {
    document.getElementById('modal-back-text').innerText = 'CLEAR';
    document.getElementById('modal-back-btn').onclick = () => closeModal();
    document.getElementById('modal-title').innerHTML = `<span style="filter:none !important; text-shadow:none !important; margin-right:8px;">🧠</span>BIBLE QUIZ`;
    document.getElementById('modal-subtitle').innerText = 'INTERACTIVE TEST + DATABASE + ANALYTICS';

    renderQuizAppShell();
    document.getElementById('data-modal').classList.add('active');
    bounceModalBodyToTop();

    try {
        await quizLoadData(false, false);
        quizInitTable();
        quizStart();

        // Refresh quiz data silently for next app entry.
        quizLoadData(true, true).catch(() => {});
    } catch (e) {
        console.error('Quiz app load error:', e);
        const feedback = document.getElementById('qz-quiz-feedback');
        if (feedback) {
            feedback.innerHTML = '<span style="color:#ff4040; font-weight:700;">Live quiz database failed to load. Check API tab Quiz.</span>';
        }
    }

    const loading = document.getElementById('qz-app-loading');
    if (loading) loading.style.display = 'none';
    if (!quizAppState.initialized) quizAppState.initialized = true;
}

window.openQuizApp = openQuizApp;
window.openQuizWindow = openQuizWindow;
window.qzSelectTab = qzSelectTab;
window.quizSwitchTab = quizSwitchTab;

if (typeof installAppAnchorSync === 'function') {
    installAppAnchorSync('quiz', openQuizApp);
}