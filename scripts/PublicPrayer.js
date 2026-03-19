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

if (typeof installAppAnchorSync === 'function') {
    installAppAnchorSync();
}