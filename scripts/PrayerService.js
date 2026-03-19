// ==========================================
// APP: PUBLIC PRAYER
// ==========================================

const publicPrayerAppState = {
    epistlesChart: null,
    actsChart: null
};

const PRAYER_REQUEST_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSd8DI4jqhNOjN11nX0mcKUYsyQBeCGmshb8i1ixmDQ5AYlvLw/formResponse';
const PRAYER_REQUEST_FIELDS = Object.freeze({
    submitterName:    'entry.1023237368',
    submitterEmail:   'entry.1675031504',
    submitterPhone:   'entry.838365685',
    prayerText:       'entry.1669993371',
    category:         'entry.1087914189',
    isConfidential:   'entry.869907406',
    followUpRequested:'entry.773840389',
    adminNotes:       'entry.217466599'
});

// ── Easily-updatable category list for the prayer request form ──
const PRAYER_CATEGORY_OPTIONS = [
    'Health',
    'Family',
    'Financial',
    'Spiritual Growth',
    'Grief / Loss',
    'Relationships',
    'Work / Career',
    'Praise Report',
    'Other'
];

const PRAYER_FOLLOWUP_METHODS = [
    'Text',
    'Email',
    'Phone Call'
];

async function publicPrayerSubmitToGoogleForm(payload) {
    const encodedBody = payload.toString();

    // Primary path: standard form POST.
    try {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeoutId = controller
            ? setTimeout(function() { controller.abort(); }, 9000)
            : null;

        try {
            await fetch(PRAYER_REQUEST_FORM_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                body: encodedBody,
                signal: controller ? controller.signal : undefined
            });
            return true;
        } finally {
            if (timeoutId) clearTimeout(timeoutId);
        }
    } catch (error) {
        // Fallback path below.
    }

    // Fallback path: queue send via Beacon API when available.
    try {
        if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
            const blob = new Blob([encodedBody], { type: 'application/x-www-form-urlencoded;charset=UTF-8' });
            return navigator.sendBeacon(PRAYER_REQUEST_FORM_URL, blob);
        }
    } catch (error) {
        // Ignore and return failure.
    }

    return false;
}

const publicPrayerAppWorkflowSteps = {
    1: {
        title: 'Step 1: The Burden',
        body: '<p>Nehemiah\'s first response to crisis was liturgical mourning. Holy activity must be preceded by holy affection. We do not work to earn God\'s favor; we work because our hearts have been captured by His priorities.</p>',
        scripture: '"As soon as I heard these words I sat down and wept and mourned for days..." - Nehemiah 1:4 (ESV)'
    },
    2: {
        title: 'Step 2: The Arrow Prayer',
        body: '<p>In the presence of the king, Nehemiah had seconds to respond. He prayed before speaking. This is action-prayer: split-second alignment with God in real-time decisions.</p>',
        scripture: '"So I prayed to the God of heaven. And I said to the king..." - Nehemiah 2:4-5 (ESV)'
    },
    3: {
        title: 'Step 3: The Vigilance',
        body: '<p>Nehemiah combined prayer and preparation. He did not retreat from action, nor trust action alone. Vigilance is prayer in boots, faith with obedience.</p>',
        scripture: '"And we prayed to our God and set a guard... day and night." - Nehemiah 4:9 (ESV)'
    },
    4: {
        title: 'Step 4: The Glory',
        body: '<p>When the wall was completed, the credit went to God. Prayer keeps the heart from self-glory and returns praise to the One who enabled the work.</p>',
        scripture: '"...this work had been accomplished with the help of our God." - Nehemiah 6:16 (ESV)'
    }
};

function publicPrayerAppDestroyCharts() {
    if (publicPrayerAppState.epistlesChart) {
        publicPrayerAppState.epistlesChart.destroy();
        publicPrayerAppState.epistlesChart = null;
    }
    if (publicPrayerAppState.actsChart) {
        publicPrayerAppState.actsChart.destroy();
        publicPrayerAppState.actsChart = null;
    }
}

function publicPrayerAppUpdateStep(stepNumber) {
    const step = publicPrayerAppWorkflowSteps[stepNumber] || publicPrayerAppWorkflowSteps[1];
    const title = document.getElementById('prayer-flow-title');
    const body = document.getElementById('prayer-flow-body');
    const scripture = document.getElementById('prayer-flow-scripture');

    if (title) title.textContent = step.title;
    if (body) body.innerHTML = step.body;
    if (scripture) scripture.textContent = step.scripture;

    document.querySelectorAll('#prayer-workflow .prayer-step-btn').forEach((btn, idx) => {
        const active = idx + 1 === stepNumber;
        btn.style.opacity = active ? '1' : '0.62';
        btn.style.borderLeftColor = active ? '#f59e0b' : 'transparent';
        btn.style.background = active ? 'rgba(245,158,11,0.14)' : 'rgba(15,23,42,0.62)';
    });
}

function publicPrayerAppInitCharts() {
    publicPrayerAppDestroyCharts();

    const epistlesCanvas = document.getElementById('prayer-epistles-chart');
    const actsCanvas = document.getElementById('prayer-acts-chart');
    if (!epistlesCanvas || !actsCanvas || typeof Chart === 'undefined') return;

    const epistlesCtx = epistlesCanvas.getContext('2d');
    const grad = epistlesCtx.createLinearGradient(0, 0, 0, 360);
    grad.addColorStop(0, '#06b6d4');
    grad.addColorStop(1, '#3b82f6');

    publicPrayerAppState.epistlesChart = new Chart(epistlesCtx, {
        type: 'bar',
        data: {
            labels: ['Romans', 'Ephesians', 'Philippians', 'Colossians', '1 Thess', '1 Timothy'],
            datasets: [{
                label: 'Prayer Directives',
                data: [7, 6, 4, 6, 5, 4],
                backgroundColor: grad,
                borderRadius: 8,
                hoverBackgroundColor: '#f59e0b'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.08)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    });

    publicPrayerAppState.actsChart = new Chart(actsCanvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Adoration', 'Confession', 'Thanksgiving', 'Supplication'],
            datasets: [{
                data: [25, 25, 25, 25],
                backgroundColor: ['#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899'],
                borderColor: 'rgba(2,6,23,0.85)',
                borderWidth: 4,
                hoverOffset: 12
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#94a3b8', padding: 16, font: { size: 12, weight: 'bold' } }
                }
            }
        }
    });
}

async function publicPrayerAppSubmitRequest(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const submitBtn = document.getElementById('prayer-request-submit');
    const statusEl = document.getElementById('prayer-request-status');
    if (!form || !submitBtn || !statusEl) return;

    const firstName = String(form.firstName?.value || '').trim();
    const lastName = String(form.lastName?.value || '').trim();
    const phone = String(form.phone?.value || '').trim();
    const email = String(form.email?.value || '').trim();
    const prayer = String(form.prayer?.value || '').trim();
    const followUp = String(form.followUp?.value || '').trim();
    const followUpMethod = String(form.followUpMethod?.value || 'Text').trim();
    const category = String(form.category?.value || '').trim();
    const confidential = form.confidential?.checked ? 'Yes' : 'No';

    if (!firstName || !lastName || !phone || !email || !prayer) {
        statusEl.style.color = '#fca5a5';
        statusEl.textContent = 'Please complete all required fields.';
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'SENDING...';
    statusEl.style.color = '#93c5fd';
    statusEl.textContent = 'Submitting your request...';

    try {
        const fullName = firstName + ' ' + lastName;
        const payload = new URLSearchParams();
        payload.append(PRAYER_REQUEST_FIELDS.submitterName, fullName);
        payload.append(PRAYER_REQUEST_FIELDS.submitterEmail, email);
        payload.append(PRAYER_REQUEST_FIELDS.submitterPhone, phone);
        payload.append(PRAYER_REQUEST_FIELDS.prayerText, prayer);
        payload.append(PRAYER_REQUEST_FIELDS.category, category || 'Other');
        payload.append(PRAYER_REQUEST_FIELDS.isConfidential, confidential);
        payload.append(PRAYER_REQUEST_FIELDS.followUpRequested, followUp);
        payload.append(PRAYER_REQUEST_FIELDS.adminNotes, 'Follow-up method: ' + followUpMethod);

        const queued = await publicPrayerSubmitToGoogleForm(payload);
        if (!queued) {
            throw new Error('Submission queue failed');
        }

        statusEl.style.color = '#86efac';
        statusEl.textContent = 'Prayer request sent. We will stand with you in prayer.';
        form.reset();
        // Restore defaults after reset
        if (form.followUp) form.followUp.value = 'Yes';
        if (form.followUpMethod) form.followUpMethod.value = 'Text';
        if (form.confidential) form.confidential.checked = true;
    } catch (error) {
        statusEl.style.color = '#fca5a5';
        statusEl.textContent = 'Unable to submit right now. Please try again in a moment.';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'SEND PRAYER REQUEST';
    }
}

function publicPrayerAppBindRequestForm() {
    const form = document.getElementById('prayer-request-form');
    if (!form || form.dataset.bound === '1') return;
    form.addEventListener('submit', publicPrayerAppSubmitRequest);
    form.dataset.bound = '1';
}

function openPublicPrayerRequestApp(prefillText = '') {
    document.getElementById('modal-back-text').innerText = 'CLEAR';
    document.getElementById('modal-back-btn').onclick = () => closeModal();
    document.getElementById('modal-title').innerHTML = `<span style="filter:none !important; text-shadow:none !important; margin-right:8px;">💌</span>REQUEST`;
    document.getElementById('modal-subtitle').innerText = 'SUBMIT PRAYER REQUEST';

    const categoryOptions = PRAYER_CATEGORY_OPTIONS.map(c => `<option value="${c}">${c}</option>`).join('');
    const followUpMethodOptions = PRAYER_FOLLOWUP_METHODS.map(m => `<option value="${m}">${m}</option>`).join('');

    const container = document.getElementById('modal-body-container');
    container.innerHTML = `
        <style>
            #prayer-request-app {
                width: min(100%, 980px);
                margin: 0 auto;
                padding: 12px clamp(8px, 2.4vw, 14px) var(--scroll-tail-pad);
                color: #f8fafc;
                background: radial-gradient(circle at top right, #1e1b4b, #020617, #0f172a);
                border-radius: 18px;
                box-sizing: border-box;
            }
            .pr-panel {
                width: 100%;
                margin-bottom: 14px;
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 16px;
                background: rgba(255,255,255,0.03);
                padding: clamp(14px, 2.5vw, 22px);
                box-sizing: border-box;
                overflow: hidden;
            }
            .pr-hero {
                border-radius: 18px;
                backdrop-filter: blur(10px);
                background: linear-gradient(135deg, rgba(6,182,212,0.08), rgba(139,92,246,0.06), rgba(255,255,255,0.02));
                border: 1px solid rgba(6,182,212,0.18);
                text-align: center;
                padding: clamp(24px, 4vw, 40px) clamp(14px, 3vw, 32px);
            }
            .pr-hero-icon {
                font-size: 3rem;
                margin-bottom: 8px;
                filter: none !important;
                text-shadow: none !important;
            }
            .pr-hero h2 {
                margin: 0 0 10px;
                font-family: 'Merriweather', serif;
                font-size: clamp(1.6rem, 4vw, 2.4rem);
                color: #fff;
                line-height: 1.3;
            }
            .pr-hero-verse {
                margin: 14px auto 0;
                max-width: 520px;
                padding: 12px 16px;
                border-radius: 12px;
                border: 1px solid rgba(245,158,11,0.22);
                background: rgba(245,158,11,0.06);
                color: #fde68a;
                font-style: italic;
                font-size: 0.95rem;
                line-height: 1.65;
            }
            .pr-hero-verse cite {
                display: block;
                margin-top: 6px;
                font-style: normal;
                font-weight: 700;
                font-size: 0.78rem;
                letter-spacing: 1px;
                color: #f59e0b;
            }
            .pr-form {
                display: grid;
                gap: 12px;
            }
            .pr-form-section-label {
                display: flex;
                align-items: center;
                gap: 8px;
                margin: 6px 0 2px;
                font-size: 0.72rem;
                font-weight: 800;
                letter-spacing: 1.8px;
                text-transform: uppercase;
                color: #67e8f9;
            }
            .pr-form-section-label::after {
                content: '';
                flex: 1;
                height: 1px;
                background: rgba(6,182,212,0.18);
            }
            .pr-row {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 10px;
            }
            .pr-field {
                width: 100%;
                min-width: 0;
                padding: 12px 14px;
                border-radius: 12px;
                border: 1px solid rgba(255,255,255,0.12);
                background: rgba(15,23,42,0.65);
                color: #fff;
                font-size: 0.95rem;
                outline: none;
                box-sizing: border-box;
                transition: border-color 0.2s, box-shadow 0.2s;
            }
            .pr-field::placeholder { color: #64748b; }
            .pr-field:focus {
                border-color: rgba(6,182,212,0.5);
                box-shadow: 0 0 0 3px rgba(6,182,212,0.12);
            }
            .pr-field option { background: #0f172a; color: #fff; }
            #prayer-request-textarea {
                resize: vertical;
                min-height: 120px;
            }
            .pr-options-row {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
                gap: 10px;
                align-items: start;
            }
            .pr-check-label {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 10px 14px;
                border-radius: 12px;
                border: 1px solid rgba(139,92,246,0.2);
                background: rgba(139,92,246,0.06);
                color: #e2e8f0;
                font-size: 0.9rem;
                cursor: pointer;
                transition: border-color 0.2s, background 0.2s;
                user-select: none;
            }
            .pr-check-label:hover {
                border-color: rgba(139,92,246,0.4);
                background: rgba(139,92,246,0.1);
            }
            .pr-check-label input[type="checkbox"] {
                width: 18px; height: 18px;
                accent-color: #8b5cf6;
                cursor: pointer;
                flex-shrink: 0;
            }
            .pr-actions {
                display: grid;
                grid-template-columns: auto minmax(0, 1fr);
                align-items: center;
                gap: 12px;
                margin-top: 4px;
            }
            #prayer-request-submit {
                padding: 12px 20px;
                font-size: 0.75rem;
                font-weight: 800;
                letter-spacing: 1.5px;
                border-radius: 12px;
                border: 1px solid rgba(6,182,212,0.35);
                background: linear-gradient(135deg, rgba(6,182,212,0.18), rgba(139,92,246,0.12));
                color: #fff;
                cursor: pointer;
                transition: transform 0.15s, box-shadow 0.2s, background 0.2s;
            }
            #prayer-request-submit:hover:not(:disabled) {
                transform: translateY(-1px);
                box-shadow: 0 4px 16px rgba(6,182,212,0.2);
                background: linear-gradient(135deg, rgba(6,182,212,0.28), rgba(139,92,246,0.18));
            }
            #prayer-request-submit:disabled {
                opacity: 0.6; cursor: wait;
            }
            #prayer-request-status {
                min-width: 0;
                font-size: 0.82rem;
                color: #94a3b8;
                overflow-wrap: anywhere;
            }
            .pr-footer {
                text-align: center;
                border: 1px solid rgba(255,255,255,0.06);
                border-radius: 14px;
                padding: 14px;
                background: rgba(2,6,23,0.4);
            }
            .pr-footer p {
                margin: 0;
                color: #94a3b8;
                font-size: 0.78rem;
                letter-spacing: 1.4px;
                text-transform: uppercase;
                line-height: 1.6;
            }
            @media (max-width: 760px) {
                .pr-row,
                .pr-actions {
                    grid-template-columns: 1fr;
                }
            }
        </style>

        <div id="prayer-request-app">

            <!-- ── Hero ── -->
            <section class="pr-panel pr-hero">
                <div class="pr-hero-icon">🕊️</div>
                <h2>How Can We Pray For You?</h2>
                <p style="margin:0 auto; max-width:540px; color:#cbd5e1; font-size:1.03rem; line-height:1.72;">
                    Share your request and let us carry it together in prayer. Every submission is treated with care, compassion, and confidentiality.
                </p>
                <div class="pr-hero-verse">
                    &ldquo;We pray, because He first prayed for us.&rdquo;
                    <cite>— John 17</cite>
                </div>
            </section>

            <!-- ── Form ── -->
            <section class="pr-panel">
                <form id="prayer-request-form" class="pr-form">

                    <div class="pr-form-section-label">Your Information</div>

                    <div class="pr-row">
                        <input class="pr-field" name="firstName" type="text" required placeholder="First Name" autocomplete="given-name" />
                        <input class="pr-field" name="lastName" type="text" required placeholder="Last Name" autocomplete="family-name" />
                    </div>

                    <div class="pr-row">
                        <input class="pr-field" name="phone" type="tel" required placeholder="Phone Number" autocomplete="tel" />
                        <input class="pr-field" name="email" type="email" required placeholder="Email Address" autocomplete="email" />
                    </div>

                    <div class="pr-form-section-label">Your Prayer Request</div>

                    <textarea id="prayer-request-textarea" class="pr-field" name="prayer" required rows="8" placeholder="How can we pray for you?"></textarea>

                    <select class="pr-field" name="category">
                        <option value="" disabled selected>Category (optional)</option>
                        ${categoryOptions}
                    </select>

                    <div class="pr-form-section-label">Follow Up</div>

                    <div class="pr-options-row">
                        <select class="pr-field" name="followUp">
                            <option value="Yes" selected>Yes, please follow up with me</option>
                            <option value="No">No follow up needed</option>
                        </select>

                        <select class="pr-field" name="followUpMethod">
                            ${followUpMethodOptions}
                        </select>
                    </div>

                    <label class="pr-check-label">
                        <input type="checkbox" name="confidential" checked />
                        Keep my request confidential (pastor only)
                    </label>

                    <div class="pr-actions">
                        <button id="prayer-request-submit" type="submit">SEND PRAYER REQUEST</button>
                        <div id="prayer-request-status"> </div>
                    </div>
                </form>
            </section>

            <!-- ── Footer ── -->
            <section class="pr-footer">
                <p>The Power of Prayer Is the God of Prayer</p>
            </section>

        </div>
    `;

    publicPrayerAppBindRequestForm();
    const textarea = document.getElementById('prayer-request-textarea');
    const seed = String(prefillText || '').trim();
    if (textarea && seed) textarea.value = seed;

    document.getElementById('data-modal').classList.add('active');
    bounceModalBodyToTop();
}

function openPublicPrayerApp() {
    document.getElementById('modal-back-text').innerText = 'CLEAR';
    document.getElementById('modal-back-btn').onclick = () => closeModal();
    document.getElementById('modal-title').innerHTML = `<span style="filter:none !important; text-shadow:none !important; margin-right:8px;">🙏</span>PRAYER`;
    document.getElementById('modal-subtitle').innerText = 'PRAYERFUL ACTION | EXEGETICAL WORKFLOW';

    const container = document.getElementById('modal-body-container');
    container.innerHTML = `
        <div id="prayer-app" style="padding:10px 10px var(--scroll-tail-pad) 10px; color:#f8fafc; background:radial-gradient(circle at top right, #1e1b4b, #020617, #0f172a); border-radius:18px;">
            <section style="padding:22px; border:1px solid rgba(255,255,255,0.1); border-radius:18px; background:rgba(255,255,255,0.03); backdrop-filter:blur(10px); margin-bottom:14px;">
                <div style="display:inline-block; padding:4px 10px; border-radius:999px; border:1px solid rgba(245,158,11,0.25); color:#f59e0b; font-size:0.7rem; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:10px;">Exegetical Research</div>
                <h2 style="margin:0 0 10px; font-family:'Merriweather', serif; font-size:clamp(2rem, 4vw, 3rem); color:#fff;">Prayerful Action</h2>
                <p style="margin:0; color:#cbd5e1; font-size:1.03rem; line-height:1.72;">The necessity, power, and practical application of prayer in the life of the believer.</p>
            </section>

            <section style="padding:18px; border:1px solid rgba(255,255,255,0.1); border-radius:16px; background:rgba(15,23,42,0.6); margin-bottom:14px;">
                <h3 style="margin:0 0 10px; color:#fff; font-size:1.2rem;">The Vital Breath</h3>
                <p style="margin:0 0 8px; color:#cbd5e1; line-height:1.72;">Prayer is not optional; it is the oxygen of the soul. Prayerful action is dependence and obedience working together.</p>
                <p style="margin:0; color:#cbd5e1; line-height:1.72;">We labor faithfully while confessing that unless the Lord builds the house, those who build labor in vain.</p>
            </section>

            <section style="display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr)); gap:12px; margin-bottom:14px;">
                <div style="border:1px solid rgba(255,255,255,0.1); border-radius:16px; padding:14px; background:rgba(15,23,42,0.62);">
                    <h3 style="margin:0 0 12px; font-size:1rem; color:#fff;">Biblical Emphasis by Epistle</h3>
                    <div style="height:280px;"><canvas id="prayer-epistles-chart"></canvas></div>
                </div>
                <div style="border:1px solid rgba(255,255,255,0.1); border-radius:16px; padding:14px; background:rgba(15,23,42,0.62);">
                    <h3 style="margin:0 0 12px; font-size:1rem; color:#fff;">The ACTS Framework</h3>
                    <div style="height:280px;"><canvas id="prayer-acts-chart"></canvas></div>
                </div>
            </section>

            <section style="display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr)); gap:12px; margin-bottom:14px;">
                <div style="border:1px solid rgba(245,158,11,0.25); border-radius:16px; padding:14px; background:rgba(245,158,11,0.07);">
                    <h3 style="margin:0 0 8px; color:#fff; font-size:1rem;">The Sovereign Ordination</h3>
                    <p style="margin:0; color:#cbd5e1; line-height:1.72;">God ordains both ends and means. Prayer is His appointed instrument for bringing His purposes to pass.</p>
                </div>
                <div style="border:1px solid rgba(6,182,212,0.25); border-radius:16px; padding:14px; background:rgba(6,182,212,0.07);">
                    <h3 style="margin:0 0 8px; color:#fff; font-size:1rem;">The Spirit's Advocacy</h3>
                    <p style="margin:0; color:#cbd5e1; line-height:1.72;">In weakness, the Spirit helps and intercedes, aligning our prayers with the will of God.</p>
                </div>
            </section>

            <section id="prayer-workflow" style="border:1px solid rgba(255,255,255,0.1); border-radius:16px; background:rgba(255,255,255,0.03); overflow:hidden; margin-bottom:14px;">
                <div style="padding:14px 16px; border-bottom:1px solid rgba(255,255,255,0.08); background:linear-gradient(90deg, rgba(6,182,212,0.15), rgba(30,41,59,0.05));">
                    <h3 style="margin:0; font-size:1.05rem; color:#fff;">Nehemiah's Method: Prayerful Action Workflow</h3>
                </div>
                <div style="display:grid; grid-template-columns:1fr;" id="prayer-workflow-grid">
                    <div style="padding:12px; display:grid; gap:8px; border-bottom:1px solid rgba(255,255,255,0.08);">
                        <button class="prayer-step-btn" onclick="publicPrayerAppUpdateStep(1)" style="text-align:left; padding:10px 12px; border-radius:10px; border:1px solid rgba(255,255,255,0.09); border-left:4px solid transparent; color:#fff; background:rgba(15,23,42,0.62); cursor:pointer;">STEP 01 · The Burden</button>
                        <button class="prayer-step-btn" onclick="publicPrayerAppUpdateStep(2)" style="text-align:left; padding:10px 12px; border-radius:10px; border:1px solid rgba(255,255,255,0.09); border-left:4px solid transparent; color:#fff; background:rgba(15,23,42,0.62); cursor:pointer;">STEP 02 · The Arrow Prayer</button>
                        <button class="prayer-step-btn" onclick="publicPrayerAppUpdateStep(3)" style="text-align:left; padding:10px 12px; border-radius:10px; border:1px solid rgba(255,255,255,0.09); border-left:4px solid transparent; color:#fff; background:rgba(15,23,42,0.62); cursor:pointer;">STEP 03 · The Vigilance</button>
                        <button class="prayer-step-btn" onclick="publicPrayerAppUpdateStep(4)" style="text-align:left; padding:10px 12px; border-radius:10px; border:1px solid rgba(255,255,255,0.09); border-left:4px solid transparent; color:#fff; background:rgba(15,23,42,0.62); cursor:pointer;">STEP 04 · The Glory</button>
                    </div>
                    <div style="padding:16px; background:rgba(255,255,255,0.02);">
                        <h4 id="prayer-flow-title" style="margin:0 0 10px; font-size:1.35rem; color:#fff;"></h4>
                        <div id="prayer-flow-body" style="color:#cbd5e1; font-size:1rem; line-height:1.75; margin-bottom:12px;"></div>
                        <div style="border:1px solid rgba(245,158,11,0.25); background:rgba(245,158,11,0.08); color:#fde68a; border-radius:12px; padding:12px; font-style:italic; line-height:1.65;" id="prayer-flow-scripture"></div>
                    </div>
                </div>
            </section>

            <section style="border:1px solid rgba(255,255,255,0.1); border-radius:16px; background:rgba(15,23,42,0.62); padding:16px; margin-bottom:14px;">
                <h3 style="margin:0 0 8px; font-size:1.05rem; color:#fff;">The Anatomy of Prayer</h3>
                <p style="margin:0 0 12px; color:#cbd5e1; line-height:1.72;">A disciplined prayer life is intentional and structured.</p>
                <div style="display:grid; gap:8px;">
                    <label style="display:flex; gap:10px; align-items:flex-start; color:#cbd5e1;"><input type="checkbox" style="margin-top:3px;"> <span><strong style="color:#fff;">Expository Meditation</strong><br><span style="font-size:0.9rem;">Start with Scripture to align your mind with God's Word.</span></span></label>
                    <label style="display:flex; gap:10px; align-items:flex-start; color:#cbd5e1;"><input type="checkbox" style="margin-top:3px;"> <span><strong style="color:#fff;">Vigilant Obedience</strong><br><span style="font-size:0.9rem;">Pair requests with concrete steps of faithful action.</span></span></label>
                    <label style="display:flex; gap:10px; align-items:flex-start; color:#cbd5e1;"><input type="checkbox" style="margin-top:3px;"> <span><strong style="color:#fff;">Unceasing Awareness</strong><br><span style="font-size:0.9rem;">Practice silent communion throughout the day.</span></span></label>
                </div>
            </section>

            <section style="border:1px solid rgba(255,255,255,0.1); border-radius:16px; background:rgba(255,255,255,0.03); padding:16px; margin-bottom:14px;">
                <h3 style="margin:0 0 8px; font-size:1.05rem; color:#fff;">Submit A Prayer Request</h3>
                <p style="margin:0 0 6px; color:#cbd5e1; line-height:1.72;">Share your request privately. We will pray with faith and follow up if you request it.</p>
                <p style="margin:0 0 14px; color:#fde68a; font-style:italic; font-size:0.92rem; line-height:1.6;">&ldquo;We pray, because He first prayed for us.&rdquo; &mdash; John 17</p>

                <form id="prayer-request-form" style="display:grid; gap:10px;">
                    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:10px;">
                        <input name="firstName" type="text" required placeholder="First Name" autocomplete="given-name" style="padding:10px 12px; border-radius:10px; border:1px solid rgba(255,255,255,0.14); background:rgba(15,23,42,0.7); color:#fff; outline:none;" />
                        <input name="lastName" type="text" required placeholder="Last Name" autocomplete="family-name" style="padding:10px 12px; border-radius:10px; border:1px solid rgba(255,255,255,0.14); background:rgba(15,23,42,0.7); color:#fff; outline:none;" />
                    </div>

                    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:10px;">
                        <input name="phone" type="tel" required placeholder="Phone Number" autocomplete="tel" style="padding:10px 12px; border-radius:10px; border:1px solid rgba(255,255,255,0.14); background:rgba(15,23,42,0.7); color:#fff; outline:none;" />
                        <input name="email" type="email" required placeholder="Email Address" autocomplete="email" style="padding:10px 12px; border-radius:10px; border:1px solid rgba(255,255,255,0.14); background:rgba(15,23,42,0.7); color:#fff; outline:none;" />
                    </div>

                    <textarea name="prayer" required rows="8" placeholder="How can we pray for you?" style="padding:10px 12px; border-radius:10px; border:1px solid rgba(255,255,255,0.14); background:rgba(15,23,42,0.7); color:#fff; outline:none; resize:vertical;"></textarea>

                    <select name="category" style="padding:10px 12px; border-radius:10px; border:1px solid rgba(255,255,255,0.14); background:rgba(15,23,42,0.7); color:#fff; outline:none;">
                        <option value="" disabled selected>Category (optional)</option>
                        ${PRAYER_CATEGORY_OPTIONS.map(c => '<option value="' + c + '">' + c + '</option>').join('')}
                    </select>

                    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:10px;">
                        <select name="followUp" style="padding:10px 12px; border-radius:10px; border:1px solid rgba(255,255,255,0.14); background:rgba(15,23,42,0.7); color:#fff; outline:none;">
                            <option value="Yes" selected>Yes, please follow up with me</option>
                            <option value="No">No follow up needed</option>
                        </select>
                        <select name="followUpMethod" style="padding:10px 12px; border-radius:10px; border:1px solid rgba(255,255,255,0.14); background:rgba(15,23,42,0.7); color:#fff; outline:none;">
                            ${PRAYER_FOLLOWUP_METHODS.map(m => '<option value="' + m + '">' + m + '</option>').join('')}
                        </select>
                    </div>

                    <label style="display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px; border:1px solid rgba(139,92,246,0.2); background:rgba(139,92,246,0.06); color:#e2e8f0; font-size:0.9rem; cursor:pointer; user-select:none;">
                        <input type="checkbox" name="confidential" checked style="width:18px; height:18px; accent-color:#8b5cf6; cursor:pointer;" />
                        Keep my request confidential (pastor only)
                    </label>

                    <div style="display:flex; flex-wrap:wrap; align-items:center; gap:10px; justify-content:space-between; margin-top:4px;">
                        <button id="prayer-request-submit" type="submit" class="clear-btn" style="padding:12px 20px; font-size:0.72rem;">SEND PRAYER REQUEST</button>
                        <div id="prayer-request-status" style="font-size:0.82rem; color:#94a3b8;"> </div>
                    </div>
                </form>
            </section>

            <section style="text-align:center; border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:14px; background:rgba(2,6,23,0.45);">
                <p style="margin:0; color:#94a3b8; font-size:0.78rem; letter-spacing:1.6px; text-transform:uppercase;">The Power of Prayer Is the God of Prayer</p>
            </section>
        </div>
    `;

    publicPrayerAppUpdateStep(1);
    publicPrayerAppInitCharts();
    publicPrayerAppBindRequestForm();

    document.getElementById('data-modal').classList.add('active');
    bounceModalBodyToTop();
}

window.openPublicPrayerApp = openPublicPrayerApp;
window.openPublicPrayerRequestApp = openPublicPrayerRequestApp;

// ==========================================
// APP: PRAYER ADMIN DASHBOARD
// ==========================================
// Authenticated admin view for logging, tracking, updating,
// archiving, and contacting those who submit prayer requests.
// Mirrors the Pastoral.js dashboard patterns exactly.

const prayerAdminState = {
    rows: [],
    loaded: false,
    loading: false,
    filter: '',
    editorMode: 'create',
    showArchived: false,
    viewMode: 'table',
    autoCards: false
};

let _prayerAdminActiveRow = null;

const PRAYER_STATUS_OPTIONS = ['New', 'In Progress', 'Answered', 'Closed'];

// ── Styles ───────────────────────────────────────────────────────────────────

function prayerAdminEnsureStyles() {
    if (document.getElementById('prayer-admin-style')) return;
    const style = document.createElement('style');
    style.id = 'prayer-admin-style';
    style.textContent = `
        .pra-wrap {
            font-family: 'Avenir Next', 'Segoe UI', sans-serif;
            color: #d8e1eb;
            background:
                radial-gradient(1200px 480px at 8% -30%, rgba(139,92,246,0.14), transparent 55%),
                radial-gradient(900px 420px at 100% -20%, rgba(6,182,212,0.10), transparent 52%),
                linear-gradient(180deg, rgba(2,8,18,0.95), rgba(5,13,28,0.95));
            border: 1px solid rgba(148,163,184,0.18);
            border-radius: 16px;
            padding: 16px;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 18px 40px rgba(2,6,23,0.45);
        }
        .pra-toolbar {
            display: grid;
            gap: 12px;
            margin-bottom: 14px;
            padding: 12px;
            border-radius: 14px;
            border: 1px solid rgba(148,163,184,0.2);
            background: linear-gradient(160deg, rgba(15,23,42,0.72), rgba(7,15,30,0.86));
        }
        .pra-toolbar-main {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
        }
        .pra-toolbar-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }
        .pra-search-wrap {
            flex: 1;
            min-width: 220px;
            position: relative;
        }
        .pra-search-wrap::before {
            content: 'Search Requests';
            position: absolute;
            left: 12px;
            top: 7px;
            font-size: 0.62rem;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-weight: 700;
            color: #a78bfa;
        }
        .pra-search {
            width: 100%; box-sizing: border-box;
            background: rgba(15,23,42,0.72); border: 1px solid rgba(148,163,184,0.32);
            border-radius: 10px; color: #ecf3fb; padding: 23px 14px 8px; font-size: 0.88rem;
            outline: none;
        }
        .pra-search:focus {
            border-color: #a78bfa;
            box-shadow: 0 0 0 3px rgba(139,92,246,0.15);
        }
        .pra-search::placeholder { color: #6b84a0; }
        .pra-count {
            font-size: 0.72rem;
            color: #b7c7d9;
            white-space: nowrap;
            padding: 8px 11px;
            border-radius: 999px;
            border: 1px solid rgba(148,163,184,0.3);
            background: rgba(15,23,42,0.65);
            letter-spacing: 0.02em;
        }
        .pra-btn {
            border-radius: 9px;
            font-size: 0.78rem;
            font-weight: 700;
            letter-spacing: 0.04em;
            padding: 8px 13px;
            cursor: pointer;
            transition: 0.15s ease;
        }
        .pra-add-btn {
            border: 1px solid rgba(139,92,246,0.58);
            background: linear-gradient(180deg, rgba(139,92,246,0.26), rgba(109,40,217,0.25));
            color: #ede9fe;
        }
        .pra-add-btn:hover {
            background: linear-gradient(180deg, rgba(167,139,250,0.34), rgba(139,92,246,0.34));
            color: #f5f3ff;
        }
        .pra-archive-toggle-btn {
            border: 1px solid rgba(148,163,184,0.4);
            background: rgba(71,85,105,0.28);
            color: #d5e0ec;
        }
        .pra-archive-toggle-btn:hover { background: rgba(100,116,139,0.4); color: #f1f5f9; }
        .pra-archive-toggle-btn.active {
            border-color: rgba(34,197,94,0.55);
            background: rgba(22,163,74,0.2);
            color: #86efac;
        }
        .pra-view-toggle-btn {
            border: 1px solid rgba(99,102,241,0.42);
            background: rgba(79,70,229,0.22);
            color: #dbeafe;
        }
        .pra-view-toggle-btn:hover { background: rgba(79,70,229,0.32); }
        .pra-error {
            color: #fca5a5;
            background: rgba(239,68,68,0.08);
            border: 1px solid rgba(239,68,68,0.25);
            border-radius: 10px;
            padding: 12px 14px;
            margin-bottom: 12px;
            font-size: 0.85rem;
        }
        .pra-empty {
            text-align: center;
            color: #94a3b8;
            padding: 32px 16px;
            font-size: 0.9rem;
        }
        .pra-loading-shimmer {
            height: 18px;
            border-radius: 6px;
            background: linear-gradient(90deg, rgba(148,163,184,0.08), rgba(148,163,184,0.18), rgba(148,163,184,0.08));
            background-size: 400% 100%;
            animation: praShimmer 1.6s ease-in-out infinite;
        }
        @keyframes praShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .pra-table-wrap { overflow-x: auto; }
        .pra-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: auto;
        }
        .pra-table th {
            text-align: left;
            padding: 10px 12px;
            font-size: 0.68rem;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #a78bfa;
            border-bottom: 1px solid rgba(148,163,184,0.2);
            white-space: nowrap;
        }
        .pra-table td {
            padding: 10px 12px;
            font-size: 0.88rem;
            border-bottom: 1px solid rgba(148,163,184,0.08);
            vertical-align: top;
        }
        .pra-table tbody tr { cursor: pointer; transition: background 0.15s; }
        .pra-table tbody tr:hover { background: rgba(139,92,246,0.06); }
        .pra-table tbody tr.pra-row-archived { opacity: 0.5; }
        .pra-status-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 999px;
            font-size: 0.68rem;
            font-weight: 800;
            letter-spacing: 0.06em;
            text-transform: uppercase;
        }
        .pra-status-new { background: rgba(6,182,212,0.18); color: #67e8f9; border: 1px solid rgba(6,182,212,0.3); }
        .pra-status-in-progress { background: rgba(245,158,11,0.18); color: #fde68a; border: 1px solid rgba(245,158,11,0.3); }
        .pra-status-answered { background: rgba(34,197,94,0.18); color: #86efac; border: 1px solid rgba(34,197,94,0.3); }
        .pra-status-closed { background: rgba(148,163,184,0.18); color: #cbd5e1; border: 1px solid rgba(148,163,184,0.3); }
        .pra-cat-badge {
            display: inline-block;
            padding: 2px 7px;
            border-radius: 999px;
            font-size: 0.66rem;
            font-weight: 700;
            letter-spacing: 0.04em;
            background: rgba(139,92,246,0.12);
            color: #c4b5fd;
            border: 1px solid rgba(139,92,246,0.2);
        }
        .pra-conf-icon {
            display: inline-block;
            font-size: 0.78rem;
            color: #f87171;
            cursor: help;
        }

        /* ── Cards ── */
        .pra-cards-wrap { display: grid; gap: 10px; }
        .pra-cards-wrap .pra-card:nth-child(6n+1) { --pra-card-accent: #8b5cf6; }
        .pra-cards-wrap .pra-card:nth-child(6n+2) { --pra-card-accent: #06b6d4; }
        .pra-cards-wrap .pra-card:nth-child(6n+3) { --pra-card-accent: #f59e0b; }
        .pra-cards-wrap .pra-card:nth-child(6n+4) { --pra-card-accent: #ec4899; }
        .pra-cards-wrap .pra-card:nth-child(6n+5) { --pra-card-accent: #22c55e; }
        .pra-cards-wrap .pra-card:nth-child(6n)   { --pra-card-accent: #3b82f6; }
        .pra-card {
            --pra-card-accent: #8b5cf6;
            border: 1px solid color-mix(in srgb, var(--pra-card-accent) 38%, rgba(255,255,255,0.12));
            background: linear-gradient(155deg, color-mix(in srgb, var(--pra-card-accent) 10%, transparent), rgba(255,255,255,0.02));
            border-radius: 14px;
            padding: 14px;
            display: grid;
            gap: 8px;
            box-shadow: 0 6px 18px rgba(2,6,23,0.3);
        }
        .pra-card.pra-card-archived {
            border-color: rgba(148,163,184,0.2);
            background: rgba(100,116,139,0.09);
            opacity: 0.55;
        }
        .pra-card-header {
            display: flex;
            align-items: center;
            gap: 10px;
            justify-content: space-between;
        }
        .pra-card-name {
            font-weight: 800;
            font-size: 1rem;
            color: #f1f5f9;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .pra-card-badges { display: flex; gap: 6px; flex-shrink: 0; }
        .pra-card-prayer-text {
            color: #cbd5e1;
            font-size: 0.88rem;
            line-height: 1.6;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        .pra-card-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            align-items: center;
        }
        .pra-card-meta-item {
            font-size: 0.72rem;
            font-weight: 700;
            letter-spacing: 0.04em;
            color: #94a3b8;
            text-transform: uppercase;
        }
        .pra-card-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            padding-top: 4px;
            border-top: 1px solid rgba(148,163,184,0.1);
        }
        .pra-card-action-btn {
            font-size: 0.68rem;
            font-weight: 800;
            letter-spacing: 0.06em;
            padding: 6px 10px;
            border-radius: 8px;
            border: 1px solid rgba(148,163,184,0.25);
            background: rgba(15,23,42,0.65);
            color: #cbd5e1;
            cursor: pointer;
            transition: 0.15s;
        }
        .pra-card-action-btn:hover { background: rgba(139,92,246,0.15); color: #f1f5f9; border-color: rgba(139,92,246,0.5); }
        .pra-card-action-btn.pra-contact { border-color: rgba(6,182,212,0.4); color: #67e8f9; }
        .pra-card-action-btn.pra-contact:hover { background: rgba(6,182,212,0.15); }

        /* ── Detail Overlay ── */
        .pra-overlay {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: rgba(2,6,23,0.85);
            backdrop-filter: blur(6px);
            justify-content: center;
            align-items: flex-start;
            padding: 32px 12px;
            overflow-y: auto;
        }
        .pra-overlay.active { display: flex; }
        .pra-dialog {
            width: min(100%, 640px);
            background: linear-gradient(180deg, rgba(15,23,42,0.98), rgba(7,15,30,0.98));
            border: 1px solid rgba(148,163,184,0.25);
            border-radius: 18px;
            padding: 22px;
            box-shadow: 0 24px 64px rgba(2,6,23,0.6);
            animation: praSlideUp 0.25s ease-out;
        }
        @keyframes praSlideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .pra-dialog-title {
            margin: 0 0 4px;
            font-size: 1.05rem;
            font-weight: 900;
            color: #f1f5f9;
            letter-spacing: 0.04em;
        }
        .pra-dialog-sub {
            margin: 0 0 16px;
            font-size: 0.76rem;
            color: #94a3b8;
            letter-spacing: 0.06em;
            text-transform: uppercase;
        }
        .pra-field-group {
            margin-bottom: 14px;
        }
        .pra-field-label {
            display: block;
            font-size: 0.66rem;
            font-weight: 800;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #a78bfa;
            margin-bottom: 4px;
        }
        .pra-input {
            width: 100%; box-sizing: border-box;
            padding: 10px 12px;
            border-radius: 10px;
            border: 1px solid rgba(148,163,184,0.25);
            background: rgba(15,23,42,0.65);
            color: #e2e8f0;
            font-size: 0.88rem;
            outline: none;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        .pra-input:focus {
            border-color: rgba(139,92,246,0.55);
            box-shadow: 0 0 0 3px rgba(139,92,246,0.13);
        }
        .pra-input option { background: #0f172a; color: #fff; }
        .pra-input[readonly] { opacity: 0.6; cursor: default; }
        .pra-textarea {
            resize: vertical;
            min-height: 90px;
        }
        .pra-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .pra-section-divider {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 16px 0 10px;
            font-size: 0.66rem;
            font-weight: 800;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #67e8f9;
        }
        .pra-section-divider::after {
            content: '';
            flex: 1;
            height: 1px;
            background: rgba(6,182,212,0.18);
        }
        .pra-dialog-footer {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 10px;
            margin-top: 18px;
            padding-top: 14px;
            border-top: 1px solid rgba(148,163,184,0.12);
        }
        .pra-save-btn {
            padding: 10px 18px;
            border-radius: 10px;
            border: 1px solid rgba(34,197,94,0.5);
            background: linear-gradient(180deg, rgba(34,197,94,0.22), rgba(22,163,74,0.2));
            color: #86efac;
            font-size: 0.76rem;
            font-weight: 800;
            letter-spacing: 0.06em;
            cursor: pointer;
            transition: 0.15s;
        }
        .pra-save-btn:hover { background: linear-gradient(180deg, rgba(34,197,94,0.32), rgba(22,163,74,0.28)); color: #bbf7d0; }
        .pra-cancel-btn {
            padding: 10px 18px;
            border-radius: 10px;
            border: 1px solid rgba(148,163,184,0.3);
            background: rgba(71,85,105,0.2);
            color: #cbd5e1;
            font-size: 0.76rem;
            font-weight: 800;
            letter-spacing: 0.06em;
            cursor: pointer;
            transition: 0.15s;
        }
        .pra-cancel-btn:hover { background: rgba(100,116,139,0.3); }
        .pra-archive-btn {
            margin-left: auto;
            padding: 10px 18px;
            border-radius: 10px;
            border: 1px solid rgba(239,68,68,0.4);
            background: rgba(239,68,68,0.1);
            color: #fca5a5;
            font-size: 0.76rem;
            font-weight: 800;
            letter-spacing: 0.06em;
            cursor: pointer;
            transition: 0.15s;
        }
        .pra-archive-btn:hover { background: rgba(239,68,68,0.18); color: #fecaca; }
        .pra-dialog-status {
            width: 100%;
            font-size: 0.8rem;
            min-height: 1.2em;
            margin-top: 4px;
        }

        /* ── Contact bar ── */
        .pra-contact-bar {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 8px;
        }
        .pra-contact-link {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 7px 12px;
            border-radius: 9px;
            border: 1px solid rgba(6,182,212,0.35);
            background: rgba(6,182,212,0.08);
            color: #67e8f9;
            font-size: 0.74rem;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-decoration: none;
            cursor: pointer;
            transition: 0.15s;
        }
        .pra-contact-link:hover { background: rgba(6,182,212,0.18); color: #a5f3fc; }
        .pra-contact-link.pra-sms { border-color: rgba(34,197,94,0.4); background: rgba(34,197,94,0.08); color: #86efac; }
        .pra-contact-link.pra-sms:hover { background: rgba(34,197,94,0.18); }
        .pra-contact-link.pra-email { border-color: rgba(245,158,11,0.4); background: rgba(245,158,11,0.08); color: #fde68a; }
        .pra-contact-link.pra-email:hover { background: rgba(245,158,11,0.18); }

        /* ── Notes Overlay ── */
        .pra-notes-dialog {
            width: min(100%, 560px);
            background: linear-gradient(180deg, rgba(15,23,42,0.98), rgba(7,15,30,0.98));
            border: 1px solid rgba(148,163,184,0.25);
            border-radius: 18px;
            padding: 22px;
            box-shadow: 0 24px 64px rgba(2,6,23,0.6);
            animation: praSlideUp 0.25s ease-out;
        }
        .pra-notes-title {
            margin: 0 0 4px;
            font-size: 1.05rem;
            font-weight: 900;
            color: #f1f5f9;
        }
        .pra-notes-sub {
            margin: 0 0 14px;
            font-size: 0.76rem;
            color: #94a3b8;
            letter-spacing: 0.06em;
            text-transform: uppercase;
        }
        .pra-notes-existing {
            padding: 12px;
            border-radius: 10px;
            border: 1px solid rgba(148,163,184,0.15);
            background: rgba(15,23,42,0.5);
            color: #cbd5e1;
            font-size: 0.88rem;
            line-height: 1.65;
            white-space: pre-wrap;
            margin-bottom: 12px;
            max-height: 200px;
            overflow-y: auto;
        }
        .pra-notes-meta {
            font-size: 0.7rem;
            color: #64748b;
            margin-bottom: 14px;
        }
        .pra-auto-log {
            padding: 10px 12px;
            border-radius: 10px;
            border: 1px solid rgba(148,163,184,0.1);
            background: rgba(15,23,42,0.4);
            color: #94a3b8;
            font-size: 0.78rem;
            line-height: 1.6;
            white-space: pre-wrap;
            max-height: 120px;
            overflow-y: auto;
            margin-bottom: 14px;
        }

        @media (max-width: 760px) {
            .pra-row { grid-template-columns: 1fr; }
            .pra-toolbar-main { flex-direction: column; align-items: stretch; }
        }
        @media (max-width: 430px) {
            .pra-btn { font-size: 0.66rem; padding: 6px 8px; }
            .pra-card-action-btn { font-size: 0.62rem; padding: 5px 7px; }
        }
    `;
    document.head.appendChild(style);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function prayerAdminBuildSmsLink(phone, body) {
    const digits = String(phone || '').replace(/\D/g, '');
    if (!digits) return '#';
    const sep = (navigator.userAgent.match(/iPhone|iPad|iPod/i)) ? '&' : '?';
    return 'sms:' + digits + (body ? sep + 'body=' + encodeURIComponent(body) : '');
}

function prayerAdminBuildEmailLink(email, subject, body) {
    const addr = String(email || '').trim();
    if (!addr) return '#';
    let link = 'mailto:' + encodeURIComponent(addr);
    const parts = [];
    if (subject) parts.push('subject=' + encodeURIComponent(subject));
    if (body) parts.push('body=' + encodeURIComponent(body));
    if (parts.length) link += '?' + parts.join('&');
    return link;
}

function prayerAdminStatusClass(status) {
    const s = String(status || '').toLowerCase().replace(/\s+/g, '-');
    if (s === 'new') return 'pra-status-new';
    if (s === 'in-progress') return 'pra-status-in-progress';
    if (s === 'answered') return 'pra-status-answered';
    return 'pra-status-closed';
}

function prayerAdminFormatDate(iso) {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return String(iso);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) { return String(iso); }
}

function prayerAdminTruncate(text, max) {
    const s = String(text || '').trim();
    return s.length > max ? s.substring(0, max) + '…' : s;
}

function prayerAdminEscapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function prayerAdminNormalizeRow(row, fallbackIndex) {
    const s = row && typeof row === 'object' ? row : {};
    return {
        index:            Number(s.index || fallbackIndex || 0),
        id:               String(s.id == null ? '' : s.id),
        memberId:         String(s.memberId == null ? '' : s.memberId),
        submitterName:    String(s.submitterName == null ? '' : s.submitterName),
        submitterEmail:   String(s.submitterEmail == null ? '' : s.submitterEmail),
        submitterPhone:   String(s.submitterPhone == null ? '' : s.submitterPhone),
        prayerText:       String(s.prayerText == null ? '' : s.prayerText),
        category:         String(s.category == null ? '' : s.category),
        isConfidential:   !!(s.isConfidential === true || s.isConfidential === 'true' || s.isConfidential === 'TRUE'),
        followUpRequested:!!(s.followUpRequested === true || s.followUpRequested === 'true' || s.followUpRequested === 'TRUE'),
        status:           String(s.status == null ? '' : s.status),
        adminNotes:       String(s.adminNotes == null ? '' : s.adminNotes),
        assignedTo:       String(s.assignedTo == null ? '' : s.assignedTo),
        submittedAt:      String(s.submittedAt == null ? '' : s.submittedAt),
        lastUpdated:      String(s.lastUpdated == null ? '' : s.lastUpdated),
        updatedBy:        String(s.updatedBy == null ? '' : s.updatedBy),
        archived:         !!(s.archived === true || s.archived === 'true' || s.archived === 'TRUE'),
        autoLog:          String(s.autoLog == null ? '' : s.autoLog)
    };
}

function prayerAdminNormalizeRows(rows) {
    return (Array.isArray(rows) ? rows : [])
        .filter(function(r) { return r && typeof r === 'object'; })
        .map(function(r, i) { return prayerAdminNormalizeRow(r, i + 2); });
}

function prayerAdminGetVisibleRows() {
    const all = prayerAdminState.rows;
    const visible = [];
    let archivedCount = 0;
    const needle = prayerAdminState.filter.toLowerCase();

    for (let i = 0; i < all.length; i++) {
        const row = all[i];
        if (row.archived) archivedCount++;
        if (row.archived && !prayerAdminState.showArchived) continue;
        if (needle) {
            const hay = [
                row.submitterName, row.submitterEmail, row.submitterPhone,
                row.prayerText, row.category, row.status, row.assignedTo
            ].join(' ').toLowerCase();
            if (!hay.includes(needle)) continue;
        }
        visible.push(row);
    }
    return { visible: visible, total: all.length, archivedCount: archivedCount };
}

// ── Fetch ────────────────────────────────────────────────────────────────────

function prayerAdminFetchNoReferrer(url) {
    return fetch(url, {
        method: 'GET',
        cache: 'no-store',
        credentials: 'omit',
        referrerPolicy: 'no-referrer'
    });
}

function prayerAdminGetAuth() {
    return typeof getPastoralAuthPayload === 'function' ? getPastoralAuthPayload() : null;
}

function prayerAdminFetchData() {
    const endpoint = String(window.PASTORAL_DB_V2_ENDPOINT || '').trim();
    const auth = prayerAdminGetAuth();
    const errEl = document.getElementById('pra-error-msg');
    const tbody = document.getElementById('pra-tbody');

    if (!endpoint) {
        if (errEl) { errEl.className = 'pra-error'; errEl.textContent = 'Prayer endpoint is not configured.'; errEl.style.display = ''; }
        return;
    }
    if (!auth) {
        if (errEl) { errEl.className = 'pra-error'; errEl.textContent = 'Secure session required. Open Secure and sign in first.'; errEl.style.display = ''; }
        if (typeof pastoralRedirectToSecure === 'function') pastoralRedirectToSecure('Missing secure session for prayer admin.');
        return;
    }

    prayerAdminState.loading = true;

    if (tbody) {
        tbody.innerHTML = [1, 2, 3, 4, 5].map(function() {
            return '<tr><td colspan="6"><div class="pra-loading-shimmer"></div></td></tr>';
        }).join('');
    }

    const params = new URLSearchParams({
        action: 'prayer.list',
        token: auth.token,
        email: auth.email,
        includeArchived: 'true',
        _: String(Date.now())
    });

    prayerAdminFetchNoReferrer(endpoint + '?' + params.toString())
        .then(function(r) {
            if (!r.ok) {
                if (r.status === 401 || r.status === 403) {
                    if (typeof pastoralRedirectToSecure === 'function') pastoralRedirectToSecure('Unauthorized');
                    return Promise.reject(new Error('Unauthorized'));
                }
                throw new Error('HTTP ' + r.status);
            }
            return r.json();
        })
        .then(function(data) {
            if (!data) return;
            if (!data.ok) {
                if (typeof pastoralIsAuthErrorMessage === 'function' && pastoralIsAuthErrorMessage(data.message)) {
                    if (typeof pastoralRedirectToSecure === 'function') pastoralRedirectToSecure(data.message);
                    return;
                }
                throw new Error(data.message || 'Server error');
            }
            prayerAdminState.rows = prayerAdminNormalizeRows(data.rows);
            prayerAdminState.loaded = true;
            prayerAdminState.loading = false;
            if (errEl) errEl.style.display = 'none';
            prayerAdminRender();
        })
        .catch(function(err) {
            prayerAdminState.loading = false;
            if (typeof pastoralIsAuthErrorMessage === 'function' && pastoralIsAuthErrorMessage(err && err.message)) {
                if (typeof pastoralRedirectToSecure === 'function') pastoralRedirectToSecure(err.message);
                return;
            }
            if (errEl) { errEl.className = 'pra-error'; errEl.textContent = String(err && err.message ? err.message : err); errEl.style.display = ''; }
        });
}

// ── Render ───────────────────────────────────────────────────────────────────

function prayerAdminRender() {
    const isMobile = window.innerWidth <= 760;
    const forceCards = prayerAdminState.viewMode === 'table' && isMobile;
    prayerAdminState.autoCards = forceCards;

    if (prayerAdminState.viewMode === 'cards' || forceCards) {
        prayerAdminRenderCards();
    } else {
        prayerAdminRenderTable();
    }
}

function prayerAdminUpdateTopControls(meta) {
    const countEl = document.getElementById('pra-count');
    if (countEl) {
        let text = meta.visible.length + ' request' + (meta.visible.length !== 1 ? 's' : '');
        if (meta.archivedCount && !prayerAdminState.showArchived) {
            text += ' (' + meta.archivedCount + ' archived hidden)';
        }
        countEl.textContent = text;
    }
    const archBtn = document.getElementById('pra-toggle-archived');
    if (archBtn) {
        archBtn.textContent = prayerAdminState.showArchived ? 'Archived: Shown' : 'Archived: Hidden';
        archBtn.classList.toggle('active', prayerAdminState.showArchived);
    }
    const viewBtn = document.getElementById('pra-toggle-view');
    if (viewBtn) {
        viewBtn.textContent = 'View: ' + (prayerAdminState.autoCards ? 'Cards (auto)' : (prayerAdminState.viewMode === 'cards' ? 'Cards' : 'Table'));
    }
}

function prayerAdminRenderTable() {
    const tbody = document.getElementById('pra-tbody');
    const tableWrap = document.getElementById('pra-table-wrap');
    const cardsWrap = document.getElementById('pra-cards-wrap');
    if (!tbody) return;

    if (tableWrap) tableWrap.style.display = '';
    if (cardsWrap) cardsWrap.style.display = 'none';

    const meta = prayerAdminGetVisibleRows();
    prayerAdminUpdateTopControls(meta);

    if (!meta.visible.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="pra-empty">' +
            (prayerAdminState.filter ? 'No requests match your search.' : 'No prayer requests found.') +
            '</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    meta.visible.forEach(function(row) {
        const tr = document.createElement('tr');
        if (row.archived) tr.className = 'pra-row-archived';
        tr.onclick = function() { prayerAdminOpenDetailModal(row); };

        // Name + confidential indicator
        const tdName = document.createElement('td');
        let nameHtml = '<div style="font-weight:700; color:#f1f5f9;">' + prayerAdminEscapeHtml(row.submitterName || 'Anonymous') + '</div>';
        if (row.isConfidential) nameHtml += '<span class="pra-conf-icon" title="Confidential">🔒</span> ';
        if (row.followUpRequested) nameHtml += '<span style="font-size:0.68rem; color:#67e8f9; font-weight:700;">FOLLOW-UP</span>';
        tdName.innerHTML = nameHtml;

        // Category
        const tdCat = document.createElement('td');
        tdCat.innerHTML = row.category ? '<span class="pra-cat-badge">' + prayerAdminEscapeHtml(row.category) + '</span>' : '';

        // Status
        const tdStatus = document.createElement('td');
        tdStatus.innerHTML = '<span class="pra-status-badge ' + prayerAdminStatusClass(row.status) + '">' + prayerAdminEscapeHtml(row.status || 'New') + '</span>';

        // Assigned
        const tdAssigned = document.createElement('td');
        tdAssigned.style.fontSize = '0.82rem';
        tdAssigned.style.color = '#94a3b8';
        tdAssigned.textContent = row.assignedTo || '—';

        // Date
        const tdDate = document.createElement('td');
        tdDate.style.fontSize = '0.78rem';
        tdDate.style.color = '#64748b';
        tdDate.style.whiteSpace = 'nowrap';
        tdDate.textContent = prayerAdminFormatDate(row.submittedAt);

        // Prayer text preview
        const tdPreview = document.createElement('td');
        tdPreview.style.fontSize = '0.82rem';
        tdPreview.style.color = '#94a3b8';
        tdPreview.style.maxWidth = '260px';
        tdPreview.style.overflow = 'hidden';
        tdPreview.style.textOverflow = 'ellipsis';
        tdPreview.style.whiteSpace = 'nowrap';
        tdPreview.textContent = prayerAdminTruncate(row.prayerText, 80);

        tr.appendChild(tdName);
        tr.appendChild(tdCat);
        tr.appendChild(tdStatus);
        tr.appendChild(tdAssigned);
        tr.appendChild(tdDate);
        tr.appendChild(tdPreview);
        tbody.appendChild(tr);
    });
}

function prayerAdminRenderCards() {
    const tableWrap = document.getElementById('pra-table-wrap');
    const cardsWrap = document.getElementById('pra-cards-wrap');
    if (!cardsWrap) return;

    if (tableWrap) tableWrap.style.display = 'none';
    cardsWrap.style.display = '';

    const meta = prayerAdminGetVisibleRows();
    prayerAdminUpdateTopControls(meta);

    if (!meta.visible.length) {
        cardsWrap.innerHTML = '<div class="pra-empty">' +
            (prayerAdminState.filter ? 'No requests match your search.' : 'No prayer requests found.') +
            '</div>';
        return;
    }

    cardsWrap.innerHTML = '';
    meta.visible.forEach(function(row) {
        const card = document.createElement('article');
        card.className = 'pra-card' + (row.archived ? ' pra-card-archived' : '');

        let headerBadges = '';
        if (row.isConfidential) headerBadges += '<span class="pra-conf-icon" title="Confidential">🔒</span>';
        headerBadges += '<span class="pra-status-badge ' + prayerAdminStatusClass(row.status) + '">' + prayerAdminEscapeHtml(row.status || 'New') + '</span>';

        let metaItems = '';
        if (row.category) metaItems += '<span class="pra-card-meta-item"><span class="pra-cat-badge">' + prayerAdminEscapeHtml(row.category) + '</span></span>';
        if (row.submittedAt) metaItems += '<span class="pra-card-meta-item">' + prayerAdminFormatDate(row.submittedAt) + '</span>';
        if (row.assignedTo) metaItems += '<span class="pra-card-meta-item">→ ' + prayerAdminEscapeHtml(row.assignedTo) + '</span>';
        if (row.followUpRequested) metaItems += '<span class="pra-card-meta-item" style="color:#67e8f9;">FOLLOW-UP</span>';

        let contactBtns = '';
        if (row.submitterPhone) {
            contactBtns += '<button class="pra-card-action-btn pra-contact" onclick="event.stopPropagation(); window.open(\'' + prayerAdminEscapeHtml(prayerAdminBuildSmsLink(row.submitterPhone, 'Hello ' + (row.submitterName || '') + ', we received your prayer request and are praying with you.')) + '\', \'_blank\');">TEXT</button>';
            contactBtns += '<button class="pra-card-action-btn pra-contact" onclick="event.stopPropagation(); window.open(\'tel:' + prayerAdminEscapeHtml(String(row.submitterPhone).replace(/\D/g, '')) + '\');">CALL</button>';
        }
        if (row.submitterEmail) {
            contactBtns += '<button class="pra-card-action-btn pra-contact" onclick="event.stopPropagation(); window.open(\'' + prayerAdminEscapeHtml(prayerAdminBuildEmailLink(row.submitterEmail, 'Re: Your Prayer Request', 'Hello ' + (row.submitterName || '') + ',\\n\\nThank you for sharing your prayer request. We are lifting you up in prayer.\\n\\nIn Christ,\\nPrayer Team')) + '\');">EMAIL</button>';
        }

        card.innerHTML = `
            <div class="pra-card-header">
                <div class="pra-card-name">${prayerAdminEscapeHtml(row.submitterName || 'Anonymous')}</div>
                <div class="pra-card-badges">${headerBadges}</div>
            </div>
            <div class="pra-card-prayer-text">${prayerAdminEscapeHtml(row.prayerText)}</div>
            <div class="pra-card-meta">${metaItems}</div>
            <div class="pra-card-actions">
                <button class="pra-card-action-btn" onclick="event.stopPropagation(); prayerAdminOpenDetailModal(prayerAdminState.rows.find(function(r){return r.id==='${prayerAdminEscapeHtml(row.id)}';}));">DETAILS</button>
                <button class="pra-card-action-btn" onclick="event.stopPropagation(); prayerAdminOpenNotesModal(prayerAdminState.rows.find(function(r){return r.id==='${prayerAdminEscapeHtml(row.id)}';}));">NOTES</button>
                ${contactBtns}
            </div>
        `;

        card.onclick = function() { prayerAdminOpenDetailModal(row); };
        cardsWrap.appendChild(card);
    });
}

// ── Detail / Edit Overlay ────────────────────────────────────────────────────

function prayerAdminOpenDetailModal(row) {
    prayerAdminState.editorMode = row ? 'edit' : 'create';
    _prayerAdminActiveRow = row || null;

    const overlay = document.getElementById('pra-detail-overlay');
    if (!overlay) return;

    const s = row || {};
    const isEdit = !!row;

    function setVal(id, val) { const el = document.getElementById(id); if (el) el.value = String(val == null ? '' : val); }
    function setCheck(id, val) { const el = document.getElementById(id); if (el) el.checked = !!val; }

    const title = document.getElementById('pra-detail-title');
    const sub = document.getElementById('pra-detail-sub');
    if (title) title.textContent = isEdit ? '📋 PRAYER REQUEST' : '➕ NEW PRAYER REQUEST';
    if (sub) sub.textContent = isEdit ? 'View, update, contact, or archive' : 'Create a new prayer request';

    setVal('pra-f-id', s.id);
    setVal('pra-f-name', s.submitterName);
    setVal('pra-f-email', s.submitterEmail);
    setVal('pra-f-phone', s.submitterPhone);
    setVal('pra-f-prayer', s.prayerText);
    setVal('pra-f-category', s.category || 'Other');
    setVal('pra-f-status', s.status || 'New');
    setVal('pra-f-assigned', s.assignedTo);
    setVal('pra-f-notes', s.adminNotes);
    setVal('pra-f-memberid', s.memberId);
    setCheck('pra-f-confidential', s.isConfidential);
    setCheck('pra-f-followup', s.followUpRequested);

    // Contact bar
    const contactBar = document.getElementById('pra-contact-bar');
    if (contactBar) {
        let cHtml = '';
        if (s.submitterPhone) {
            const smsLink = prayerAdminBuildSmsLink(s.submitterPhone, 'Hello ' + (s.submitterName || '') + ', we received your prayer request and are praying with you.');
            cHtml += '<a class="pra-contact-link pra-sms" href="' + prayerAdminEscapeHtml(smsLink) + '" target="_blank">📱 TEXT</a>';
            cHtml += '<a class="pra-contact-link" href="tel:' + prayerAdminEscapeHtml(String(s.submitterPhone).replace(/\D/g, '')) + '">📞 CALL</a>';
        }
        if (s.submitterEmail) {
            const mailLink = prayerAdminBuildEmailLink(s.submitterEmail, 'Re: Your Prayer Request', 'Hello ' + (s.submitterName || '') + ',\n\nThank you for sharing your prayer request. We are lifting you up in prayer.\n\nIn Christ,\nPrayer Team');
            cHtml += '<a class="pra-contact-link pra-email" href="' + prayerAdminEscapeHtml(mailLink) + '" target="_blank">✉️ EMAIL</a>';
        }
        contactBar.innerHTML = cHtml || '<span style="color:#64748b; font-size:0.78rem;">No contact info available</span>';
    }

    // Audit meta
    const metaEl = document.getElementById('pra-detail-meta');
    if (metaEl) {
        let meta = '';
        if (s.submittedAt) meta += 'Submitted: ' + prayerAdminFormatDate(s.submittedAt);
        if (s.lastUpdated) meta += (meta ? ' · ' : '') + 'Updated: ' + prayerAdminFormatDate(s.lastUpdated);
        if (s.updatedBy) meta += (meta ? ' · ' : '') + 'By: ' + prayerAdminEscapeHtml(s.updatedBy);
        metaEl.textContent = meta || '';
    }

    // Archive button
    const archBtn = document.getElementById('pra-detail-archive');
    if (archBtn) {
        archBtn.style.display = isEdit ? '' : 'none';
        archBtn.textContent = s.archived ? 'UNARCHIVE' : 'ARCHIVE';
    }

    const statusEl = document.getElementById('pra-detail-status');
    if (statusEl) { statusEl.textContent = ''; statusEl.style.color = '#94a3b8'; }

    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');

    setTimeout(function() { const el = document.getElementById('pra-f-name'); if (el) el.focus(); }, 50);
}

function prayerAdminCloseDetailModal() {
    const overlay = document.getElementById('pra-detail-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
    }
    _prayerAdminActiveRow = null;
    prayerAdminState.editorMode = 'create';
}

function prayerAdminSaveFromModal() {
    const endpoint = String(window.PASTORAL_DB_V2_ENDPOINT || '').trim();
    const auth = prayerAdminGetAuth();
    if (!endpoint || !auth) return;

    const statusEl = document.getElementById('pra-detail-status');
    const saveBtn = document.getElementById('pra-detail-save');

    function getVal(id) { const el = document.getElementById(id); return el ? el.value : ''; }
    function getCheck(id) { const el = document.getElementById(id); return el ? el.checked : false; }

    const mode = prayerAdminState.editorMode;
    const isCreate = mode === 'create';
    const action = isCreate ? 'prayer.create' : 'prayer.update';

    const payload = {
        action: action,
        token: auth.token,
        email: auth.email,
        submitterName: getVal('pra-f-name'),
        submitterEmail: getVal('pra-f-email'),
        submitterPhone: getVal('pra-f-phone'),
        prayerText: getVal('pra-f-prayer'),
        category: getVal('pra-f-category'),
        status: getVal('pra-f-status'),
        assignedTo: getVal('pra-f-assigned'),
        adminNotes: getVal('pra-f-notes'),
        memberId: getVal('pra-f-memberid'),
        isConfidential: getCheck('pra-f-confidential') ? 'true' : 'false',
        followUpRequested: getCheck('pra-f-followup') ? 'true' : 'false',
        _: String(Date.now())
    };

    if (!isCreate && _prayerAdminActiveRow) {
        payload.rowIndex = String(_prayerAdminActiveRow.index);
    }

    if (!payload.prayerText.trim()) {
        if (statusEl) { statusEl.style.color = '#fca5a5'; statusEl.textContent = 'Prayer text is required.'; }
        return;
    }

    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'SAVING...'; }
    if (statusEl) { statusEl.style.color = '#93c5fd'; statusEl.textContent = 'Saving...'; }

    const params = new URLSearchParams(payload);
    prayerAdminFetchNoReferrer(endpoint + '?' + params.toString())
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (!data || !data.ok) throw new Error((data && data.message) || 'Save failed');

            const fresh = data.row ? prayerAdminNormalizeRow(data.row, data.row.index) : null;
            if (fresh) {
                if (!isCreate && _prayerAdminActiveRow) {
                    const idx = prayerAdminState.rows.findIndex(function(r) { return r.id === _prayerAdminActiveRow.id; });
                    if (idx !== -1) {
                        prayerAdminState.rows[idx] = fresh;
                    } else {
                        prayerAdminState.rows.unshift(fresh);
                    }
                } else {
                    prayerAdminState.rows.unshift(fresh);
                }
                prayerAdminRender();
            } else {
                prayerAdminFetchData();
            }
            prayerAdminCloseDetailModal();
        })
        .catch(function(err) {
            if (statusEl) { statusEl.style.color = '#fca5a5'; statusEl.textContent = String(err && err.message ? err.message : err); }
        })
        .finally(function() {
            if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'SAVE'; }
        });
}

function prayerAdminArchiveFromModal() {
    if (!_prayerAdminActiveRow) return;

    const label = _prayerAdminActiveRow.archived ? 'unarchive' : 'archive';
    if (!confirm('Are you sure you want to ' + label + ' this prayer request?')) return;

    const endpoint = String(window.PASTORAL_DB_V2_ENDPOINT || '').trim();
    const auth = prayerAdminGetAuth();
    if (!endpoint || !auth) return;

    const statusEl = document.getElementById('pra-detail-status');
    if (statusEl) { statusEl.style.color = '#93c5fd'; statusEl.textContent = 'Archiving...'; }

    const params = new URLSearchParams({
        action: 'prayer.archive',
        token: auth.token,
        email: auth.email,
        rowIndex: String(_prayerAdminActiveRow.index),
        _: String(Date.now())
    });

    prayerAdminFetchNoReferrer(endpoint + '?' + params.toString())
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (!data || !data.ok) throw new Error((data && data.message) || 'Archive failed');

            const fresh = data.row ? prayerAdminNormalizeRow(data.row, data.row.index) : null;
            if (fresh) {
                const idx = prayerAdminState.rows.findIndex(function(r) { return r.id === _prayerAdminActiveRow.id; });
                if (idx !== -1) prayerAdminState.rows[idx] = fresh;
                prayerAdminRender();
            } else {
                prayerAdminFetchData();
            }
            prayerAdminCloseDetailModal();
        })
        .catch(function(err) {
            if (statusEl) { statusEl.style.color = '#fca5a5'; statusEl.textContent = String(err && err.message ? err.message : err); }
        });
}

// ── Notes Overlay ────────────────────────────────────────────────────────────

function prayerAdminOpenNotesModal(row) {
    if (!row) return;
    _prayerAdminActiveRow = row;

    const overlay = document.getElementById('pra-notes-overlay');
    if (!overlay) return;

    const nameEl = document.getElementById('pra-notes-name');
    const existingEl = document.getElementById('pra-notes-existing');
    const metaEl = document.getElementById('pra-notes-meta');
    const logEl = document.getElementById('pra-notes-log');
    const inputEl = document.getElementById('pra-notes-input');
    const statusEl = document.getElementById('pra-notes-status');

    if (nameEl) nameEl.textContent = row.submitterName || 'Anonymous';
    if (existingEl) existingEl.textContent = row.adminNotes || '(no notes yet)';
    if (metaEl) {
        let meta = '';
        if (row.lastUpdated) meta += 'Last updated: ' + prayerAdminFormatDate(row.lastUpdated);
        if (row.updatedBy) meta += (meta ? ' by ' : '') + row.updatedBy;
        metaEl.textContent = meta;
    }
    if (logEl) {
        logEl.style.display = row.autoLog ? '' : 'none';
        logEl.textContent = row.autoLog || '';
    }
    if (inputEl) inputEl.value = '';
    if (statusEl) { statusEl.textContent = ''; statusEl.style.color = '#94a3b8'; }

    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');

    setTimeout(function() { if (inputEl) inputEl.focus(); }, 50);
}

function prayerAdminCloseNotesModal() {
    const overlay = document.getElementById('pra-notes-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
    }
}

function prayerAdminSaveNote() {
    if (!_prayerAdminActiveRow) return;

    const inputEl = document.getElementById('pra-notes-input');
    const statusEl = document.getElementById('pra-notes-status');
    const saveBtn = document.getElementById('pra-notes-save');
    const newNote = inputEl ? inputEl.value.trim() : '';

    if (!newNote) {
        if (statusEl) { statusEl.style.color = '#fca5a5'; statusEl.textContent = 'Type a note first.'; }
        return;
    }

    const endpoint = String(window.PASTORAL_DB_V2_ENDPOINT || '').trim();
    const auth = prayerAdminGetAuth();
    if (!endpoint || !auth) return;

    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'SAVING...'; }
    if (statusEl) { statusEl.style.color = '#93c5fd'; statusEl.textContent = 'Saving note...'; }

    // Append new note to existing notes
    const existing = _prayerAdminActiveRow.adminNotes || '';
    const timestamp = new Date().toISOString();
    const combined = (existing ? existing + '\n\n' : '') + '[' + auth.email + ' · ' + prayerAdminFormatDate(timestamp) + ']\n' + newNote;

    const params = new URLSearchParams({
        action: 'prayer.update',
        token: auth.token,
        email: auth.email,
        rowIndex: String(_prayerAdminActiveRow.index),
        adminNotes: combined,
        _: String(Date.now())
    });

    prayerAdminFetchNoReferrer(endpoint + '?' + params.toString())
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (!data || !data.ok) throw new Error((data && data.message) || 'Save failed');

            const fresh = data.row ? prayerAdminNormalizeRow(data.row, data.row.index) : null;
            if (fresh) {
                const idx = prayerAdminState.rows.findIndex(function(r) { return r.id === _prayerAdminActiveRow.id; });
                if (idx !== -1) prayerAdminState.rows[idx] = fresh;
                _prayerAdminActiveRow = fresh;
            }

            // Update existing notes display
            const existingEl = document.getElementById('pra-notes-existing');
            if (existingEl) existingEl.textContent = fresh ? fresh.adminNotes : combined;
            if (inputEl) inputEl.value = '';
            if (statusEl) { statusEl.style.color = '#86efac'; statusEl.textContent = 'Note saved.'; }
            prayerAdminRender();
        })
        .catch(function(err) {
            if (statusEl) { statusEl.style.color = '#fca5a5'; statusEl.textContent = String(err && err.message ? err.message : err); }
        })
        .finally(function() {
            if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'SAVE NOTE'; }
        });
}

// ── App Launcher ─────────────────────────────────────────────────────────────

function openPrayerAdminApp() {
    prayerAdminEnsureStyles();

    document.getElementById('modal-back-text').innerText = 'CLEAR';
    document.getElementById('modal-back-btn').onclick = function() { closeModal(); };
    document.getElementById('modal-title').innerHTML = '<span style="filter:none !important; text-shadow:none !important; margin-right:8px;">🙏</span>PRAYER';
    document.getElementById('modal-subtitle').innerText = 'PRAYER REQUEST MANAGEMENT';

    const categoryOptions = PRAYER_CATEGORY_OPTIONS.map(function(c) { return '<option value="' + c + '">' + c + '</option>'; }).join('');
    const statusOptions = PRAYER_STATUS_OPTIONS.map(function(s) { return '<option value="' + s + '">' + s + '</option>'; }).join('');

    const container = document.getElementById('modal-body-container');
    container.innerHTML = `
        <div class="pra-wrap" style="padding-bottom: var(--scroll-tail-pad, 80px);">

            <!-- Toolbar -->
            <div class="pra-toolbar">
                <div class="pra-toolbar-main">
                    <div class="pra-search-wrap">
                        <input class="pra-search" id="pra-search" type="text" placeholder="name, category, status..." autocomplete="off" />
                    </div>
                    <span class="pra-count" id="pra-count">loading...</span>
                </div>
                <div class="pra-toolbar-actions">
                    <button class="pra-btn pra-add-btn" id="pra-add-btn" onclick="prayerAdminOpenDetailModal(null);">+ New Request</button>
                    <button class="pra-btn pra-archive-toggle-btn" id="pra-toggle-archived" onclick="prayerAdminState.showArchived=!prayerAdminState.showArchived; prayerAdminRender();">Archived: Hidden</button>
                    <button class="pra-btn pra-view-toggle-btn" id="pra-toggle-view" onclick="prayerAdminState.viewMode = prayerAdminState.viewMode==='table'?'cards':'table'; prayerAdminRender();">View: Table</button>
                </div>
            </div>

            <div id="pra-error-msg" style="display:none;"></div>

            <!-- Table View -->
            <div class="pra-table-wrap" id="pra-table-wrap">
                <table class="pra-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Assigned</th>
                            <th>Date</th>
                            <th>Request</th>
                        </tr>
                    </thead>
                    <tbody id="pra-tbody"></tbody>
                </table>
            </div>

            <!-- Cards View -->
            <div class="pra-cards-wrap" id="pra-cards-wrap" style="display:none;"></div>

            <!-- Detail / Edit Overlay -->
            <div class="pra-overlay" id="pra-detail-overlay" aria-hidden="true" onclick="if(event.target===this) prayerAdminCloseDetailModal();">
                <div class="pra-dialog">
                    <h4 class="pra-dialog-title" id="pra-detail-title">📋 PRAYER REQUEST</h4>
                    <p class="pra-dialog-sub" id="pra-detail-sub">View, update, contact, or archive</p>

                    <div class="pra-section-divider">Contact</div>
                    <div id="pra-contact-bar" class="pra-contact-bar"></div>

                    <div class="pra-section-divider">Identity</div>
                    <div class="pra-field-group">
                        <label class="pra-field-label">ID</label>
                        <input class="pra-input" id="pra-f-id" readonly />
                    </div>
                    <div class="pra-row">
                        <div class="pra-field-group">
                            <label class="pra-field-label">Name</label>
                            <input class="pra-input" id="pra-f-name" placeholder="Full name" />
                        </div>
                        <div class="pra-field-group">
                            <label class="pra-field-label">Member ID</label>
                            <input class="pra-input" id="pra-f-memberid" placeholder="Optional link" />
                        </div>
                    </div>
                    <div class="pra-row">
                        <div class="pra-field-group">
                            <label class="pra-field-label">Email</label>
                            <input class="pra-input" id="pra-f-email" type="email" placeholder="Email" />
                        </div>
                        <div class="pra-field-group">
                            <label class="pra-field-label">Phone</label>
                            <input class="pra-input" id="pra-f-phone" type="tel" placeholder="Phone" />
                        </div>
                    </div>

                    <div class="pra-section-divider">Request Details</div>
                    <div class="pra-field-group">
                        <label class="pra-field-label">Prayer Request</label>
                        <textarea class="pra-input pra-textarea" id="pra-f-prayer" rows="5" placeholder="Prayer request text..."></textarea>
                    </div>
                    <div class="pra-row">
                        <div class="pra-field-group">
                            <label class="pra-field-label">Category</label>
                            <select class="pra-input" id="pra-f-category">
                                <option value="">Select...</option>
                                ${categoryOptions}
                            </select>
                        </div>
                        <div class="pra-field-group">
                            <label class="pra-field-label">Status</label>
                            <select class="pra-input" id="pra-f-status">
                                ${statusOptions}
                            </select>
                        </div>
                    </div>
                    <div class="pra-row">
                        <div class="pra-field-group">
                            <label class="pra-field-label">Assigned To</label>
                            <input class="pra-input" id="pra-f-assigned" placeholder="Staff name" />
                        </div>
                        <div class="pra-field-group" style="display:flex; gap:16px; align-items:center; padding-top:20px;">
                            <label style="display:flex; align-items:center; gap:6px; color:#e2e8f0; font-size:0.82rem; cursor:pointer;">
                                <input type="checkbox" id="pra-f-confidential" style="accent-color:#8b5cf6;" /> Confidential
                            </label>
                            <label style="display:flex; align-items:center; gap:6px; color:#e2e8f0; font-size:0.82rem; cursor:pointer;">
                                <input type="checkbox" id="pra-f-followup" style="accent-color:#06b6d4;" /> Follow-Up
                            </label>
                        </div>
                    </div>

                    <div class="pra-section-divider">Admin Notes</div>
                    <div class="pra-field-group">
                        <textarea class="pra-input pra-textarea" id="pra-f-notes" rows="4" placeholder="Internal notes (pastor+ only)..."></textarea>
                    </div>

                    <div id="pra-detail-meta" style="font-size:0.72rem; color:#64748b; margin-top:6px;"></div>

                    <div class="pra-dialog-footer">
                        <button class="pra-save-btn" id="pra-detail-save" onclick="prayerAdminSaveFromModal();">SAVE</button>
                        <button class="pra-cancel-btn" onclick="prayerAdminCloseDetailModal();">CANCEL</button>
                        <button class="pra-archive-btn" id="pra-detail-archive" onclick="prayerAdminArchiveFromModal();" style="display:none;">ARCHIVE</button>
                    </div>
                    <div class="pra-dialog-status" id="pra-detail-status"></div>
                </div>
            </div>

            <!-- Notes Overlay -->
            <div class="pra-overlay" id="pra-notes-overlay" aria-hidden="true" onclick="if(event.target===this) prayerAdminCloseNotesModal();">
                <div class="pra-notes-dialog">
                    <h4 class="pra-notes-title">📝 PRAYER NOTES</h4>
                    <p class="pra-notes-sub">Notes for <span id="pra-notes-name"></span></p>

                    <label class="pra-field-label" style="margin-bottom:4px;">Existing Notes</label>
                    <div class="pra-notes-existing" id="pra-notes-existing">(no notes)</div>
                    <div class="pra-notes-meta" id="pra-notes-meta"></div>

                    <label class="pra-field-label" style="margin-bottom:4px;">Activity Log</label>
                    <div class="pra-auto-log" id="pra-notes-log" style="display:none;"></div>

                    <label class="pra-field-label" style="margin-bottom:4px;">Add Note</label>
                    <textarea class="pra-input pra-textarea" id="pra-notes-input" rows="4" placeholder="Type a note…"></textarea>

                    <div class="pra-dialog-footer">
                        <button class="pra-save-btn" id="pra-notes-save" onclick="prayerAdminSaveNote();">SAVE NOTE</button>
                        <button class="pra-cancel-btn" onclick="prayerAdminCloseNotesModal();">CANCEL</button>
                    </div>
                    <div class="pra-dialog-status" id="pra-notes-status"></div>
                </div>
            </div>

        </div>
    `;

    // Bind search
    const searchEl = document.getElementById('pra-search');
    if (searchEl) {
        searchEl.addEventListener('input', function() {
            prayerAdminState.filter = this.value.trim();
            prayerAdminRender();
        });
    }

    // Reset state for fresh load
    prayerAdminState.rows = [];
    prayerAdminState.loaded = false;
    prayerAdminState.loading = false;
    prayerAdminState.filter = '';
    prayerAdminState.showArchived = false;

    document.getElementById('data-modal').classList.add('active');
    bounceModalBodyToTop();

    // Fetch data
    prayerAdminFetchData();
}

window.openPrayerAdminApp = openPrayerAdminApp;
window.prayerAdminOpenDetailModal = prayerAdminOpenDetailModal;
window.prayerAdminOpenNotesModal = prayerAdminOpenNotesModal;

if (typeof installAppAnchorSync === 'function') {
    installAppAnchorSync();
}