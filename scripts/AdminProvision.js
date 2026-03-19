function renderSecurePortalShell() {
    return `
        <style>
            .secure-shell { max-width: 1120px; margin: 0 auto; display: grid; gap: 14px; }
            .secure-card {
                border: 1px solid rgba(125, 211, 252, 0.26);
                border-radius: 18px;
                background:
                    radial-gradient(circle at 100% 0%, rgba(34, 211, 238, 0.16), transparent 48%),
                    linear-gradient(145deg, rgba(15, 23, 42, 0.78), rgba(30, 41, 59, 0.68));
                padding: 16px;
                display: grid;
                gap: 12px;
                box-shadow: 0 16px 40px rgba(2, 6, 23, 0.24);
            }
            .secure-title { margin: 0; color: #fff; font-size: 1.08rem; font-weight: 900; letter-spacing: 0.06em; text-transform: uppercase; }
            .secure-sub { margin: 0; color: var(--text-muted); font-size: 0.86rem; line-height: 1.6; }
            .secure-kicker-row { display: flex; flex-wrap: wrap; gap: 8px; }
            .secure-chip {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 5px 10px;
                border-radius: 999px;
                border: 1px solid rgba(255,255,255,0.18);
                background: rgba(15,23,42,0.66);
                color: #dbeafe;
                font-size: 0.67rem;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                font-family: 'JetBrains Mono';
            }
            .secure-login-hero { display: grid; gap: 8px; }
            .secure-login-kicker { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--accent-cyan); font-family: 'JetBrains Mono'; font-weight: 800; }
            .secure-login-callout {
                border: 1px solid rgba(56,189,248,0.35);
                border-radius: 14px;
                background: linear-gradient(135deg, rgba(7,89,133,0.35), rgba(15,23,42,0.7));
                padding: 10px 12px;
                display: grid;
                gap: 6px;
            }
            .secure-login-callout strong { color: #f0f9ff; font-size: 0.8rem; letter-spacing: 0.06em; text-transform: uppercase; }
            .secure-login-callout p { margin: 0; color: #cbd5e1; font-size: 0.78rem; line-height: 1.5; }
            .secure-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
            .secure-field { display: grid; gap: 6px; }
            .secure-field label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-family: 'JetBrains Mono'; }
            .secure-field input, .secure-field select, .secure-subcard textarea {
                width: 100%;
                border: 1px solid rgba(255,255,255,0.14);
                border-radius: 10px;
                background: rgba(15,23,42,0.62);
                color: #f8fafc;
                padding: 10px;
                font: inherit;
                font-size: 0.9rem;
            }
            .secure-subcard textarea { min-height: 120px; resize: vertical; font-size: 0.84rem; }
            .secure-full { grid-column: 1 / -1; }
            .secure-actions { display: flex; flex-wrap: wrap; gap: 10px; }
            .secure-status { min-height: 20px; font-size: 0.8rem; color: var(--text-muted); }
            .secure-status.ok { color: #6dd3a0; }
            .secure-status.err { color: #fca5a5; }
            .secure-app-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
            .secure-app-btn {
                border: 1px solid rgba(255,255,255,0.14);
                border-radius: 12px;
                background: linear-gradient(145deg, rgba(8,47,73,0.44), rgba(30,41,59,0.78));
                color: #fff;
                padding: 12px;
                text-align: left;
                cursor: pointer;
                font: inherit;
            }
            .secure-app-btn strong { display: block; margin-bottom: 6px; letter-spacing: 0.04em; }
            .secure-app-btn span { color: var(--text-muted); font-size: 0.8rem; line-height: 1.4; }
            .secure-output { margin: 0; border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; background: rgba(2,6,23,0.62); color: #e2e8f0; padding: 10px; min-height: 60px; white-space: pre-wrap; font-size: 0.78rem; }
            .secure-output[hidden] { display: none; }
            .secure-result-card { border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; background: rgba(15,23,42,0.72); color: #e2e8f0; padding: 10px 12px; display: grid; gap: 6px; }
            .secure-result-card strong { color: #fff; font-size: 0.82rem; letter-spacing: 0.04em; text-transform: uppercase; }
            .secure-result-card ul { margin: 0; padding-left: 18px; display: grid; gap: 4px; }
            .secure-result-card li { font-size: 0.8rem; line-height: 1.45; }
            .secure-result-card.ok { border-color: rgba(109, 211, 160, 0.3); background: rgba(12, 39, 28, 0.55); }
            .secure-result-card.err { border-color: rgba(252, 165, 165, 0.35); background: rgba(54, 20, 20, 0.48); }
            .secure-helper-note { margin: 0; color: var(--text-muted); font-size: 0.76rem; line-height: 1.45; }
            .secure-monitor { display: grid; gap: 10px; border: 1px solid rgba(125,211,252,0.24); border-radius: 14px; background: linear-gradient(150deg, rgba(8,47,73,0.4), rgba(30,41,59,0.62)); padding: 12px; }
            .secure-monitor-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
            .secure-monitor-item { display: grid; gap: 4px; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 9px; background: rgba(15,23,42,0.68); }
            .secure-monitor-item label { font-size: 0.68rem; letter-spacing: 0.08em; color: var(--text-muted); text-transform: uppercase; font-family: 'JetBrains Mono'; }
            .secure-monitor-item span { color: #fff; font-size: 0.82rem; overflow-wrap: anywhere; }
            .secure-subcard { border: 1px solid rgba(125,211,252,0.2); border-radius: 14px; background: linear-gradient(150deg, rgba(15,23,42,0.56), rgba(30,41,59,0.62)); padding: 12px; display: grid; gap: 8px; }
            .secure-subcard h4 { margin: 0; color: #fff; font-size: 0.84rem; letter-spacing: 0.06em; text-transform: uppercase; }
            .secure-subcard p { margin: 0; color: var(--text-muted); font-size: 0.78rem; line-height: 1.5; }
            .secure-subcard-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
            .secure-section-label {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 28px;
                height: 28px;
                border-radius: 8px;
                font-size: 0.76rem;
                font-weight: 900;
                background: linear-gradient(145deg, rgba(34,211,238,0.24), rgba(56,189,248,0.16));
                color: #67e8f9;
                border: 1px solid rgba(103,232,249,0.26);
            }
            .secure-admin-hero {
                border: 1px solid rgba(125,211,252,0.3);
                border-radius: 14px;
                background: radial-gradient(circle at top right, rgba(34,211,238,0.16), transparent 52%), linear-gradient(145deg, rgba(8,47,73,0.35), rgba(2,6,23,0.72));
                padding: 12px;
                display: grid;
                gap: 10px;
            }
            .secure-admin-hero h4 { margin: 0; color: #f0f9ff; font-size: 0.88rem; letter-spacing: 0.06em; text-transform: uppercase; }
            .secure-admin-hero p { margin: 0; color: #dbeafe; font-size: 0.79rem; line-height: 1.52; }
            .secure-instructions { margin: 0; padding-left: 18px; display: grid; gap: 5px; }
            .secure-instructions li { color: #cbd5e1; font-size: 0.77rem; line-height: 1.44; }
            .secure-meter-wrap { display: grid; gap: 5px; }
            .secure-meter { width: 100%; height: 8px; border-radius: 999px; background: rgba(148,163,184,0.26); overflow: hidden; }
            .secure-meter > span { display: block; height: 100%; width: 0%; background: linear-gradient(90deg, #f97316, #22c55e); transition: width 0.2s ease; }
            .secure-meter-note { font-size: 0.74rem; color: var(--text-muted); font-family: 'JetBrains Mono'; }
            .secure-inline-check { display: inline-flex; align-items: center; gap: 8px; font-size: 0.76rem; color: var(--text-muted); }
            .secure-accordion { border: 1px solid rgba(125,211,252,0.24); border-radius: 14px; background: linear-gradient(160deg, rgba(8,47,73,0.26), rgba(30,41,59,0.5)); overflow: hidden; }
            .secure-accordion + .secure-accordion { margin-top: 10px; }
            .secure-accordion-toggle {
                width: 100%;
                border: none;
                background: linear-gradient(145deg, rgba(15,23,42,0.58), rgba(30,41,59,0.66));
                color: #ecfeff;
                text-align: left;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
                padding: 12px;
                cursor: pointer;
            }
            .secure-accordion-toggle strong { font-size: 0.84rem; letter-spacing: 0.06em; text-transform: uppercase; }
            .secure-accordion-toggle span { color: #bfdbfe; font-size: 0.75rem; }
            .secure-accordion-chevron { color: #67e8f9; font-size: 0.86rem; transition: transform 0.16s ease; flex-shrink: 0; }
            .secure-accordion.is-open .secure-accordion-chevron { transform: rotate(180deg); }
            .secure-accordion-body { display: none; padding: 12px; border-top: 1px solid rgba(255,255,255,0.09); }
            .secure-accordion.is-open .secure-accordion-body { display: grid; gap: 10px; }
            .secure-users-toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }
            .secure-view-toggle-btn {
                border: 1px solid rgba(99, 102, 241, 0.42);
                background: rgba(79, 70, 229, 0.22);
                color: #dbeafe;
                border-radius: 9px;
                font-size: 0.76rem;
                font-weight: 700;
                letter-spacing: 0.04em;
                padding: 8px 12px;
                cursor: pointer;
            }
            .secure-table-wrap {
                overflow-x: auto;
                overflow-y: auto;
                max-height: min(52vh, 520px);
                border-radius: 14px;
                border: 1px solid rgba(148,163,184,0.24);
                background: linear-gradient(180deg, rgba(8, 14, 28, 0.5), rgba(30,41,59,0.55));
            }
            .secure-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.8rem; min-width: 680px; }
            .secure-table th {
                padding: 10px 12px;
                text-align: left;
                font-size: 0.66rem;
                font-weight: 800;
                letter-spacing: 0.1em;
                color: #86d7ff;
                text-transform: uppercase;
                white-space: nowrap;
                position: sticky;
                top: 0;
                z-index: 3;
                background: rgba(10,22,39,0.84);
            }
            .secure-table td { padding: 10px 12px; vertical-align: middle; color: #e2e8f0; }
            .secure-table tbody tr:hover { background: rgba(56,189,248,0.09); }
            .secure-users-cards-wrap { display: grid; gap: 10px; }
            .secure-user-card { border: 1px solid rgba(125,211,252,0.28); background: linear-gradient(155deg, rgba(34,211,238,0.08), rgba(255,255,255,0.04)); border-radius: 14px; overflow: hidden; box-shadow: 0 10px 22px rgba(2, 6, 23, 0.26); }
            .secure-user-card.is-open .secure-user-card-chevron { transform: rotate(180deg); }
            .secure-user-card-head {
                width: 100%;
                border: none;
                background: linear-gradient(120deg, rgba(34,211,238,0.12), rgba(255,255,255,0.02));
                color: #fff;
                text-align: left;
                padding: 12px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
            }
            .secure-user-card-title { font-size: 0.86rem; font-weight: 800; color: #dff7ff; }
            .secure-user-card-sub { margin-top: 2px; font-size: 0.74rem; color: #b8cad7; overflow-wrap: anywhere; }
            .secure-user-card-chevron { color: #67e8f9; font-size: 0.9rem; transition: transform 0.18s ease; flex-shrink: 0; }
            .secure-user-card-body { display: none; border-top: 1px solid rgba(255,255,255,0.08); padding: 12px; background: rgba(15,23,42,0.45); }
            .secure-user-card.is-open .secure-user-card-body { display: grid; gap: 8px; }
            .secure-user-card-grid { display: grid; gap: 8px 10px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .secure-user-card-field-label { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #67e8f9; }
            .secure-user-card-field-value { margin-top: 2px; font-size: 0.82rem; color: #f8fafc; overflow-wrap: anywhere; }
            .secure-user-card-actions { display: flex; flex-wrap: wrap; gap: 8px; }
                        .active-users-wrapper { display: grid; gap: 12px; }
                        .active-users-table-wrap {
                            overflow-x: auto;
                            overflow-y: auto;
                            max-height: min(40vh, 400px);
                            border-radius: 14px;
                            border: 1px solid rgba(148,163,184,0.24);
                            background: linear-gradient(180deg, rgba(8, 14, 28, 0.5), rgba(30,41,59,0.55));
                        }
                        .active-users-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.8rem; min-width: 700px; }
                        .active-users-table th {
                            padding: 10px 12px;
                            text-align: left;
                            font-size: 0.66rem;
                            font-weight: 800;
                            letter-spacing: 0.1em;
                            color: #86d7ff;
                            text-transform: uppercase;
                            white-space: nowrap;
                            position: sticky;
                            top: 0;
                            z-index: 3;
                            background: rgba(10,22,39,0.84);
                        }
                        .active-users-table td { padding: 10px 12px; vertical-align: middle; color: #e2e8f0; }
                        .active-users-table tbody tr:hover { background: rgba(56,189,248,0.09); }
                        .active-users-cards-wrap { display: grid; gap: 10px; }
                        .active-user-card { border: 1px solid rgba(125,211,252,0.28); background: linear-gradient(155deg, rgba(34,211,238,0.08), rgba(255,255,255,0.04)); border-radius: 14px; overflow: hidden; box-shadow: 0 10px 22px rgba(2, 6, 23, 0.26); }
                        .active-user-card.is-open .active-user-card-chevron { transform: rotate(180deg); }
                        .active-user-card-head {
                            width: 100%;
                            border: none;
                            background: linear-gradient(120deg, rgba(34,211,238,0.12), rgba(255,255,255,0.02));
                            color: #fff;
                            text-align: left;
                            padding: 12px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            gap: 8px;
                        }
                        .active-user-card-title { font-size: 0.86rem; font-weight: 800; color: #dff7ff; }
                        .active-user-card-sub { margin-top: 2px; font-size: 0.74rem; color: #b8cad7; overflow-wrap: anywhere; }
                        .active-user-card-chevron { color: #67e8f9; font-size: 0.9rem; transition: transform 0.18s ease; flex-shrink: 0; }
                        .active-user-card-body { display: none; border-top: 1px solid rgba(255,255,255,0.08); padding: 12px; background: rgba(15,23,42,0.45); }
                        .active-user-card.is-open .active-user-card-body { display: grid; gap: 8px; }
                        .active-user-card-grid { display: grid; gap: 8px 10px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
                        .active-user-card-field-label { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #67e8f9; }
                        .active-user-card-field-value { margin-top: 2px; font-size: 0.82rem; color: #f8fafc; overflow-wrap: anywhere; }
                        .active-user-card-actions { display: flex; flex-wrap: wrap; gap: 8px; }
                        @media (max-width: 900px) {
                            .active-users-table-wrap { display: none; }
                            .active-users-cards-wrap { display: grid; }
                        }
                        @media (min-width: 901px) {
                            .active-users-cards-wrap { display: none; }
                            .active-users-table-wrap { display: block; }
                        }
            @media (max-width: 860px) {
                .secure-grid, .secure-app-grid, .secure-monitor-grid, .secure-user-card-grid { grid-template-columns: 1fr; }
            }
        </style>

        <section class="secure-shell">
            <section class="secure-card" id="secure-login-view">
                <div class="secure-login-hero">
                    <span class="secure-login-kicker">Administrative Access</span>
                    <h3 class="secure-title">Secure Login</h3>
                    <p class="secure-sub">Sign in with your owner or Admin account to access the private provisioning tools.</p>
                </div>
                <div class="secure-login-callout">
                    <strong>Session Reuse Enabled</strong>
                    <p>If Auth Pilot already has a valid admin session, this screen will be skipped automatically.</p>
                </div>
                <div class="secure-grid">
                    <div class="secure-field secure-full">
                        <label for="secure-owner-email">Admin Email</label>
                        <input id="secure-owner-email" type="email" autocomplete="username" />
                    </div>
                    <div class="secure-field secure-full">
                        <label for="secure-owner-passcode">Admin Passcode</label>
                        <input id="secure-owner-passcode" type="password" autocomplete="current-password" />
                    </div>
                </div>
                <div class="secure-actions">
                    <button class="clear-btn" id="secure-login-btn">Enter Admin Tools</button>
                </div>
                <div class="secure-status" id="secure-login-status"></div>
            </section>

            <section class="secure-card" id="secure-hub-view" style="display:none;">
                <div class="secure-kicker-row">
                    <span class="secure-chip">Auth Hub</span>
                    <span class="secure-chip">Provisioning</span>
                    <span class="secure-chip">Live Endpoint Monitor</span>
                </div>
                <h3 class="secure-title">Administrative Tools</h3>
                <p class="secure-sub">Use the hub to confirm the active auth endpoint, then open the provisioning console.</p>
                <div class="secure-monitor">
                    <h4 class="secure-title" style="font-size:0.86rem;">Live Script Endpoint</h4>
                    <p class="secure-sub">Shows the currently responsive Apps Script endpoint and measured request speed.</p>
                    <div class="secure-monitor-grid">
                        <div class="secure-monitor-item"><label>Current Live Script</label><span id="secure-live-endpoint">Not checked</span></div>
                        <div class="secure-monitor-item"><label>Speed</label><span id="secure-live-speed">-</span></div>
                        <div class="secure-monitor-item"><label>Last Refresh</label><span id="secure-live-refresh">-</span></div>
                        <div class="secure-monitor-item"><label>Status</label><span id="secure-live-health">Unknown</span></div>
                    </div>
                    <div class="secure-actions">
                        <button class="clear-btn" id="secure-refresh-endpoint-btn">Refresh Live Script</button>
                        <label class="secure-inline-check"><input type="checkbox" id="secure-auto-refresh-toggle" /> Auto Refresh (30s)</label>
                    </div>
                    <pre id="secure-endpoint-output" class="secure-output"></pre>
                </div>
                <div class="secure-app-grid">
                    <button class="secure-app-btn" id="secure-open-admin-app">
                        <strong>Admin Provision</strong>
                        <span>Create users, load the directory, and manage lifecycle actions.</span>
                    </button>
                    <button class="secure-app-btn" disabled>
                        <strong>Reserved Slot</strong>
                        <span>Additional secured tools can be added here later.</span>
                    </button>
                    <button class="secure-app-btn" disabled>
                        <strong>Reserved Slot</strong>
                        <span>Future private utilities will appear in this space.</span>
                    </button>
                </div>
                <div class="secure-actions">
                    <button class="clear-btn" id="secure-lock-hub-btn">Lock Hub</button>
                </div>
                <div class="secure-status" id="secure-hub-status"></div>
            </section>

            <section class="secure-card" id="secure-admin-view" style="display:none;">
                <div class="secure-admin-hero">
                    <h4>Admin Provision</h4>
                    <p>Manage user creation, passcodes, bulk onboarding, and directory updates from one screen.</p>
                </div>
                <div class="secure-actions">
                    <button class="clear-btn" id="secure-admin-back-btn">Back to Secured Apps</button>
                </div>
                <div class="secure-status" id="secure-admin-status"></div>

                <div id="secure-admin-form">
                    <section class="secure-accordion is-open" data-accordion="create-user">
                        <button type="button" class="secure-accordion-toggle" aria-expanded="true" aria-controls="secure-accordion-create-user">
                            <div>
                                <strong>Create Individual User</strong>
                                <span>Single-user onboarding with role and status assignment.</span>
                            </div>
                            <span class="secure-accordion-chevron">▼</span>
                        </button>
                        <div class="secure-accordion-body" id="secure-accordion-create-user">
                            <div class="secure-grid">
                                <div class="secure-field"><label for="secure-user-email">User Email</label><input id="secure-user-email" type="email" autocomplete="off" /></div>
                                <div class="secure-field"><label for="secure-user-passcode">User Passcode</label><input id="secure-user-passcode" type="password" minlength="6" autocomplete="new-password" /></div>
                                <div class="secure-field"><label for="secure-user-display">Display Name</label><input id="secure-user-display" type="text" autocomplete="off" /></div>
                                <div class="secure-field"><label for="secure-user-role">Role</label><select id="secure-user-role"><option>Member</option><option selected>Leader</option><option>Admin</option><option>Pastor</option><option>Deacon</option></select></div>
                                <div class="secure-field"><label for="secure-user-status">Status</label><select id="secure-user-status"><option selected>active</option><option>archived</option><option>pending</option><option>disabled</option><option>locked</option></select></div>
                            </div>
                            <div class="secure-actions">
                                <button class="clear-btn" id="secure-create-user-btn">Create User</button>
                                <button class="clear-btn" id="secure-close-admin-btn">Close Admin App</button>
                            </div>
                            <div id="secure-admin-summary" class="secure-result-card">
                                <strong>Create User Summary</strong>
                                <p class="secure-helper-note">Create a user, and the provision flow will write the account details directly to the auth sheets.</p>
                            </div>
                            <div class="secure-actions"><button class="clear-btn" id="secure-admin-toggle-details-btn" style="display:none;">Show Technical Details</button></div>
                            <pre id="secure-admin-output" class="secure-output" hidden></pre>
                        </div>
                    </section>

                    <section class="secure-accordion is-open" data-accordion="passcode-utility">
                        <button type="button" class="secure-accordion-toggle" aria-expanded="true" aria-controls="secure-accordion-passcode-utility">
                            <div>
                                <strong>Passcode Utility</strong>
                                <span>Generate and apply secure passcodes in one flow.</span>
                            </div>
                            <span class="secure-accordion-chevron">▼</span>
                        </button>
                        <div class="secure-accordion-body" id="secure-accordion-passcode-utility">
                            <section class="secure-subcard">
                                <div class="secure-subcard-header"><h4>Passcode Utility</h4><span class="secure-section-label">A1</span></div>
                                <p>Generate a strong passcode and drop it into the create user form.</p>
                                <ol class="secure-instructions">
                                    <li>Press Generate to create a strong passcode.</li>
                                    <li>Review the strength meter before assigning it.</li>
                                    <li>Press Use In Form to populate the user passcode field.</li>
                                </ol>
                                <div class="secure-actions">
                                    <button class="clear-btn" id="secure-generate-passcode-btn">Generate</button>
                                    <button class="clear-btn" id="secure-apply-passcode-btn">Use In Form</button>
                                </div>
                                <div class="secure-field"><label for="secure-generated-passcode">Generated Passcode</label><input id="secure-generated-passcode" type="text" autocomplete="off" readonly /></div>
                                <div class="secure-meter-wrap">
                                    <div class="secure-meter"><span id="secure-passcode-meter-fill"></span></div>
                                    <div class="secure-meter-note" id="secure-passcode-meter-note">Strength: n/a</div>
                                </div>
                            </section>
                        </div>
                    </section>

                    <section class="secure-accordion" data-accordion="bulk-provision">
                        <button type="button" class="secure-accordion-toggle" aria-expanded="false" aria-controls="secure-accordion-bulk-provision">
                            <div>
                                <strong>Bulk Provision</strong>
                                <span>CSV validation and controlled multi-user onboarding.</span>
                            </div>
                            <span class="secure-accordion-chevron">▼</span>
                        </button>
                        <div class="secure-accordion-body" id="secure-accordion-bulk-provision">
                            <section class="secure-subcard">
                                <div class="secure-subcard-header"><h4>Bulk Provision</h4><span class="secure-section-label">A2</span></div>
                                <p>CSV format: email, passcode, displayName, role, status. Role and status are optional.</p>
                                <textarea id="secure-bulk-users" placeholder="jane@example.com, Pass123!, Jane Smith, Leader, active&#10;john@example.com, B3tterPass!, John Doe, Member, pending"></textarea>
                                <div class="secure-actions">
                                    <button class="clear-btn" id="secure-bulk-validate-btn">Validate</button>
                                    <button class="clear-btn" id="secure-bulk-create-btn">Create Users</button>
                                    <button class="clear-btn" id="secure-bulk-template-btn">Download CSV Template</button>
                                </div>
                                <div class="secure-status" id="secure-bulk-status"></div>
                                <div id="secure-bulk-summary" class="secure-result-card">
                                    <strong>Bulk Summary</strong>
                                    <p class="secure-helper-note">Validate first, then create only the clean rows.</p>
                                </div>
                                <div class="secure-actions"><button class="clear-btn" id="secure-bulk-toggle-details-btn" style="display:none;">Show Technical Details</button></div>
                                <pre id="secure-bulk-output" class="secure-output" hidden></pre>

                            </section>
                        </div>
                    </section>

                    <section class="secure-accordion is-open" data-accordion="active-users">
                        <button type="button" class="secure-accordion-toggle" aria-expanded="true" aria-controls="secure-accordion-active-users">
                            <div>
                                <strong>Active Members (CRM View)</strong>
                                <span>Real-time list of active members with quick editing controls.</span>
                            </div>
                            <span class="secure-accordion-chevron">▼</span>
                        </button>
                        <div class="secure-accordion-body" id="secure-accordion-active-users">
                            <section class="secure-subcard">
                                <div class="secure-subcard-header"><h4>Active Members Directory</h4><span class="secure-section-label">CRM</span></div>
                                <p>View active members with phone, email, and quick action controls. Desktop: table view. Mobile: card view.</p>
                                <div class="active-users-wrapper">
                                    <div class="secure-users-toolbar">
                                        <div class="secure-actions">
                                            <button class="clear-btn" id="active-users-refresh-btn">Refresh Active Members</button>
                                        </div>
                                        <button type="button" class="secure-view-toggle-btn" id="active-users-view-toggle-btn">View: Table</button>
                                    </div>
                                    <div class="active-users-table-wrap">
                                        <table class="active-users-table">
                                            <thead>
                                                <tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Actions</th></tr>
                                            </thead>
                                            <tbody id="active-users-table-body"><tr><td colspan="5">Loading active members...</td></tr></tbody>
                                        </table>
                                    </div>
                                    <div class="active-users-cards-wrap" id="active-users-cards-wrap" style="display:none;"></div>
                                </div>
                                <div class="secure-status" id="active-users-status"></div>
                            </section>
                        </div>
                    </section>

                    <section class="secure-accordion is-open" data-accordion="directory-controls">
                        <button type="button" class="secure-accordion-toggle" aria-expanded="true" aria-controls="secure-accordion-directory-controls">
                            <div>
                                <strong>User Directory and Controls</strong>
                                <span>Table or cards view with lifecycle actions and safeguards.</span>
                            </div>
                            <span class="secure-accordion-chevron">▼</span>
                        </button>
                        <div class="secure-accordion-body" id="secure-accordion-directory-controls">
                            <section class="secure-subcard">
                                <div class="secure-subcard-header"><h4>User Directory and Account Controls</h4><span class="secure-section-label">B1</span></div>
                                <p>Load users from the live auth sheet, then update, archive, unarchive, delete, or reset failed logins.</p>
                                <div class="secure-grid">
                                    <div class="secure-field"><label for="secure-users-search">Search (email or display)</label><input id="secure-users-search" type="text" autocomplete="off" placeholder="Search users..." /></div>
                                    <div class="secure-field"><label for="secure-users-role-filter">Role Filter</label><select id="secure-users-role-filter"><option value="">All Roles</option><option>Member</option><option>Leader</option><option>Admin</option><option>Pastor</option><option>Deacon</option></select></div>
                                    <div class="secure-field"><label for="secure-users-status-filter">Status Filter</label><select id="secure-users-status-filter"><option value="">All Statuses</option><option>active</option><option>archived</option><option>pending</option><option>disabled</option><option>locked</option></select></div>
                                </div>
                                <div class="secure-users-toolbar">
                                    <div class="secure-actions">
                                        <button class="clear-btn" id="secure-load-users-btn">Load Users</button>
                                        <button class="clear-btn" id="secure-export-users-btn">Export Filtered CSV</button>
                                    </div>
                                    <button type="button" class="secure-view-toggle-btn" id="secure-users-view-toggle-btn">View: Table</button>
                                </div>
                                <div class="secure-table-wrap">
                                    <table class="secure-table" id="secure-users-table">
                                        <thead>
                                            <tr><th>Email</th><th>Display</th><th>Role</th><th>Status</th><th>Failed</th></tr>
                                        </thead>
                                        <tbody id="secure-users-table-body"><tr><td colspan="5">No users loaded.</td></tr></tbody>
                                    </table>
                                </div>
                                <div class="secure-users-cards-wrap" id="secure-users-cards-wrap" style="display:none;"></div>
                                <div class="secure-grid">
                                    <div class="secure-field"><label for="secure-manage-email">Target Email</label><input id="secure-manage-email" type="email" autocomplete="off" /></div>
                                    <div class="secure-field"><label for="secure-manage-display">New Display Name (optional)</label><input id="secure-manage-display" type="text" autocomplete="off" /></div>
                                    <div class="secure-field"><label for="secure-manage-role">New Role</label><select id="secure-manage-role"><option>Member</option><option>Leader</option><option>Admin</option><option>Pastor</option><option>Deacon</option></select></div>
                                    <div class="secure-field"><label for="secure-manage-status">New Status</label><select id="secure-manage-status"><option selected>active</option><option>archived</option><option>pending</option><option>disabled</option><option>locked</option></select></div>
                                </div>
                                <p class="secure-helper-note">Tip: click a user row to populate the editor.</p>
                                <div class="secure-actions">
                                    <button class="clear-btn" id="secure-update-user-btn">Apply User Update</button>
                                    <button class="clear-btn" id="secure-archive-user-btn">Archive User</button>
                                    <button class="clear-btn" id="secure-unarchive-user-btn">Unarchive User</button>
                                    <button class="clear-btn" id="secure-delete-user-btn">Delete User</button>
                                    <button class="clear-btn" id="secure-reset-failed-btn">Reset Failed Login Count</button>
                                    <button class="clear-btn" id="secure-apply-filtered-btn">Apply Role/Status To Filtered</button>
                                </div>
                                <div class="secure-status" id="secure-manage-status-output"></div>
                                <div id="secure-manage-summary" class="secure-result-card">
                                    <strong>User Management Summary</strong>
                                    <p class="secure-helper-note">Load users to begin. Advanced server details stay hidden unless you ask for them.</p>
                                </div>
                                <div class="secure-actions"><button class="clear-btn" id="secure-manage-toggle-details-btn" style="display:none;">Show Technical Details</button></div>
                                <pre id="secure-manage-output" class="secure-output" hidden></pre>
                            </section>
                        </div>
                    </section>
                </div>
            </section>
        </section>
    `;
}

function openAdminProvisionApp() {
    const backText = document.getElementById('modal-back-text');
    const backBtn = document.getElementById('modal-back-btn');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const container = document.getElementById('modal-body-container');
    const modal = document.getElementById('data-modal');

    if (!backText || !backBtn || !title || !subtitle || !container || !modal) return;

    backText.innerText = 'CLEAR';
    backBtn.onclick = () => closeModal();
    title.innerHTML = `<span style="filter:none !important; text-shadow:none !important; margin-right:8px;">🔐</span>ADMIN`;
    subtitle.innerText = 'SECURED APPLICATIONS';
    container.innerHTML = renderSecurePortalShell();
    modal.classList.add('active');

    initSecurePortalRuntime();

    if (typeof bounceModalBodyToTop === 'function') bounceModalBodyToTop();
}

function initSecurePortalRuntime() {
    const loginView = document.getElementById('secure-login-view');
    const hubView = document.getElementById('secure-hub-view');
    const adminView = document.getElementById('secure-admin-view');

    const ownerEmailEl = document.getElementById('secure-owner-email');
    const ownerPasscodeEl = document.getElementById('secure-owner-passcode');

    const loginStatusEl = document.getElementById('secure-login-status');
    const hubStatusEl = document.getElementById('secure-hub-status');
    const adminStatusEl = document.getElementById('secure-admin-status');
    const bulkStatusEl = document.getElementById('secure-bulk-status');

    const adminFormEl = document.getElementById('secure-admin-form');
    const adminOutputEl = document.getElementById('secure-admin-output');
    const adminSummaryEl = document.getElementById('secure-admin-summary');
    const adminToggleDetailsBtn = document.getElementById('secure-admin-toggle-details-btn');
    const endpointOutputEl = document.getElementById('secure-endpoint-output');

    const liveEndpointEl = document.getElementById('secure-live-endpoint');
    const liveSpeedEl = document.getElementById('secure-live-speed');
    const liveRefreshEl = document.getElementById('secure-live-refresh');
    const liveHealthEl = document.getElementById('secure-live-health');

    const generatedPasscodeEl = document.getElementById('secure-generated-passcode');
    const passcodeMeterFillEl = document.getElementById('secure-passcode-meter-fill');
    const passcodeMeterNoteEl = document.getElementById('secure-passcode-meter-note');

    const bulkUsersEl = document.getElementById('secure-bulk-users');
    const bulkOutputEl = document.getElementById('secure-bulk-output');
    const bulkSummaryEl = document.getElementById('secure-bulk-summary');
    const bulkToggleDetailsBtn = document.getElementById('secure-bulk-toggle-details-btn');
    const autoRefreshToggleEl = document.getElementById('secure-auto-refresh-toggle');
    const usersTableBodyEl = document.getElementById('secure-users-table-body');
    const manageStatusOutputEl = document.getElementById('secure-manage-status-output');
    const manageOutputEl = document.getElementById('secure-manage-output');
    const manageSummaryEl = document.getElementById('secure-manage-summary');
    const manageToggleDetailsBtn = document.getElementById('secure-manage-toggle-details-btn');
    const usersSearchEl = document.getElementById('secure-users-search');
    const usersRoleFilterEl = document.getElementById('secure-users-role-filter');
    const usersStatusFilterEl = document.getElementById('secure-users-status-filter');
    const usersViewToggleBtnEl = document.getElementById('secure-users-view-toggle-btn');
    const usersCardsWrapEl = document.getElementById('secure-users-cards-wrap');
    const usersTableWrapEl = document.querySelector('.secure-table-wrap');

    const activeUsersTableBodyEl = document.getElementById('active-users-table-body');
    const activeUsersCardsWrapEl = document.getElementById('active-users-cards-wrap');
    const activeUsersViewToggleBtnEl = document.getElementById('active-users-view-toggle-btn');
    const activeUsersRefreshBtnEl = document.getElementById('active-users-refresh-btn');
    const activeUsersStatusEl = document.getElementById('active-users-status');
    const baseEndpoint = (window.AUTH_ENDPOINTS && window.AUTH_ENDPOINTS.login) || (window.MASTER_API_URL || '');
    const ownerEmail = String((window.APP_CONFIG && window.APP_CONFIG.contactEmail) || 'callgrangers@gmail.com').trim().toLowerCase();
    const allowedRoles = ['Member', 'Leader', 'Admin', 'Pastor', 'Deacon'];
    const allowedStatuses = ['active', 'archived', 'pending', 'disabled', 'locked'];

    let gatewayUnlocked = false;
    let ownerSession = null;
    let endpointRefreshTimer = null;
    let loadedUsersDirectory = [];
    let usersViewMode = 'table';

    let activeUsersViewMode = 'table';
    function normalizeRole(roleValue) {
        const raw = String(roleValue || '').trim();
        if (!raw) return 'Member';
        const match = allowedRoles.find(function(role) {
            return role.toLowerCase() === raw.toLowerCase();
        });
        return match || 'Member';
    }

    function getSecureSessionSnapshot() {
        try {
            const raw = localStorage.getItem('atogen_secure_vault_v1');
            if (!raw || raw === '1') return null;
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return null;
            if (parsed.expiresAt && Number(parsed.expiresAt) <= Date.now()) return null;
            return parsed;
        } catch {
            return null;
        }
    }

    function hasAdminProvisionRights(session, profile) {
        const normalizedSession = session && typeof session === 'object' ? session : null;
        const normalizedProfile = profile && typeof profile === 'object' ? profile : null;
        const email = String((normalizedSession && normalizedSession.email) || '').trim().toLowerCase();
        const role = normalizeRole((normalizedProfile && normalizedProfile.role) || (normalizedSession && normalizedSession.role));
        return email === ownerEmail || String(role).toLowerCase() === 'admin';
    }

    function bootstrapOwnerSessionFromSecure() {
        const session = getSecureSessionSnapshot();
        const token = String(
            (session && (
                session.token ||
                session.accessToken ||
                session.authToken ||
                session.jwt
            )) ||
            ''
        ).trim();
        if (!session || !token) return false;
        if (!hasAdminProvisionRights(session, null)) return false;

        gatewayUnlocked = true;
        ownerSession = {
            endpoint: String((window.AUTH_ENDPOINTS && window.AUTH_ENDPOINTS.login) || baseEndpoint || '').trim(),
            email: String(session.email || '').trim().toLowerCase(),
            token: token,
            role: normalizeRole(session.role),
            source: 'secure-session'
        };
        return true;
    }

    function setActiveUsersViewMode(mode) {
        activeUsersViewMode = mode === 'cards' ? 'cards' : 'table';
        if (activeUsersViewToggleBtnEl) {
            activeUsersViewToggleBtnEl.textContent = activeUsersViewMode === 'cards' ? 'View: Cards' : 'View: Table';
        }
        const tableWrap = document.querySelector('.active-users-table-wrap');
        const cardsWrap = activeUsersCardsWrapEl;
        if (tableWrap) tableWrap.style.display = activeUsersViewMode === 'cards' ? 'none' : '';
        if (cardsWrap) cardsWrap.style.display = activeUsersViewMode === 'cards' ? '' : 'none';
    }

    function getActiveUsers(rows) {
        const source = Array.isArray(rows) ? rows : [];
        return source.filter(function(user) {
            const status = String(user && user.status ? user.status : 'active').trim().toLowerCase();
            return status === 'active';
        });
    }

    function renderActiveUsers(rows) {
        if (!activeUsersTableBodyEl) return;
        const source = getActiveUsers(rows);
        if (!source.length) {
            activeUsersTableBodyEl.innerHTML = '<tr><td colspan="5">No active members loaded.</td></tr>';
            if (activeUsersCardsWrapEl) activeUsersCardsWrapEl.innerHTML = '<div class="secure-helper-note">No active members to display.</div>';
            if (activeUsersStatusEl) setStatus(activeUsersStatusEl, 'No active members loaded.', '');
            return;
        }

        activeUsersTableBodyEl.innerHTML = source.map(function(user) {
            const display = String(user.displayName || user.email || '');
            const email = String(user.email || '');
            const phone = String(user.phone || '-');
            const role = String(user.role || 'Member');
            return `<tr data-email="${escapeHtml(email)}" style="cursor:pointer;"><td>${escapeHtml(display)}</td><td>${escapeHtml(email)}</td><td>${escapeHtml(phone)}</td><td>${escapeHtml(role)}</td><td><button class="clear-btn" style="font-size:0.75rem; padding:6px 8px;" data-action="contact" data-email="${escapeHtml(email)}">Contact</button></td></tr>`;
        }).join('');

        Array.from(activeUsersTableBodyEl.querySelectorAll('[data-action="contact"]')).forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const email = String(btn.getAttribute('data-email') || '');
                openQuickContactDialog(email, source.find(function(u) { return String(u.email || '') === email; }));
            });
        });

        if (activeUsersCardsWrapEl) {
            activeUsersCardsWrapEl.innerHTML = source.map(function(user, idx) {
                const display = String(user.displayName || user.email || '');
                const email = String(user.email || '');
                const phone = String(user.phone || '-');
                const role = String(user.role || 'Member');
                const cardId = `active-user-card-${idx}`;
                return `
                    <article class="active-user-card" data-email="${escapeHtml(email)}">
                        <button type="button" class="active-user-card-head" aria-expanded="false" aria-controls="${cardId}">
                            <div>
                                <div class="active-user-card-title">${escapeHtml(display)}</div>
                                <div class="active-user-card-sub">${escapeHtml(email)} • ${escapeHtml(role)}</div>
                            </div>
                            <span class="active-user-card-chevron">▼</span>
                        </button>
                        <div class="active-user-card-body" id="${cardId}">
                            <div class="active-user-card-grid">
                                <div><div class="active-user-card-field-label">Email</div><div class="active-user-card-field-value">${escapeHtml(email)}</div></div>
                                <div><div class="active-user-card-field-label">Phone</div><div class="active-user-card-field-value">${escapeHtml(phone)}</div></div>
                                <div><div class="active-user-card-field-label">Role</div><div class="active-user-card-field-value">${escapeHtml(role)}</div></div>
                                <div><div class="active-user-card-field-label">Status</div><div class="active-user-card-field-value">Active</div></div>
                            </div>
                            <div class="active-user-card-actions">
                                <button type="button" class="clear-btn" data-action="contact" data-email="${escapeHtml(email)}" style="font-size:0.75rem;">Contact Member</button>
                                <button type="button" class="clear-btn" data-action="edit" data-email="${escapeHtml(email)}" style="font-size:0.75rem;">Edit</button>
                            </div>
                        </div>
                    </article>
                `;
            }).join('');

            Array.from(activeUsersCardsWrapEl.querySelectorAll('.active-user-card')).forEach(function(cardEl) {
                const headBtn = cardEl.querySelector('.active-user-card-head');
                const bodyEl = cardEl.querySelector('.active-user-card-body');
                if (headBtn && bodyEl) {
                    headBtn.addEventListener('click', function() {
                        const shouldOpen = !cardEl.classList.contains('is-open');
                        Array.from(activeUsersCardsWrapEl.querySelectorAll('.active-user-card.is-open')).forEach(function(openCard) {
                            openCard.classList.remove('is-open');
                            const openHead = openCard.querySelector('.active-user-card-head');
                            if (openHead) openHead.setAttribute('aria-expanded', 'false');
                        });
                        cardEl.classList.toggle('is-open', shouldOpen);
                        headBtn.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
                    });
                }

                const contactBtn = cardEl.querySelector('[data-action="contact"]');
                if (contactBtn) {
                    contactBtn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        const email = String(contactBtn.getAttribute('data-email') || '');
                        openQuickContactDialog(email, source.find(function(u) { return String(u.email || '') === email; }));
                    });
                }

                const editBtn = cardEl.querySelector('[data-action="edit"]');
                if (editBtn) {
                    editBtn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        const email = String(editBtn.getAttribute('data-email') || '');
                        const user = source.find(function(u) { return String(u.email || '') === email; });
                        applySelectedUserToEditor(email, user && user.displayName ? user.displayName : '', user && user.role ? user.role : 'Member', 'active');
                    });
                }
            });
        }

        if (activeUsersStatusEl) setStatus(activeUsersStatusEl, `Showing ${source.length} active member(s).`, 'ok');
    }

    function openQuickContactDialog(email, user) {
        const msg = window.prompt(`Quick contact for ${String(email || '')}\n\nEnter action: sms, email, or admin note`, 'admin note');
        if (!msg) return;
        const action = String(msg || '').trim().toLowerCase().charAt(0);
        if (action === 's') {
            window.alert(`SMS feature: Would send to ${user && user.phone ? user.phone : 'unknown'}`);
        } else if (action === 'e') {
            window.alert(`Email feature: Would send to ${email}`);
        } else {
            applySelectedUserToEditor(email, user && user.displayName ? user.displayName : '', user && user.role ? user.role : 'Member', 'active');
        }
    }
    function tabsPayload() {
        return window.AUTH_SHEET_TABS || {
            users: 'AuthUsers_v1',
            profiles: 'UserProfiles_v1',
            audit: 'AuthAudit_v1'
        };
    }

    function withAction(endpoint, action) {
        const url = String(endpoint || '').trim();
        return url + (url.includes('?') ? '&' : '?') + 'action=' + encodeURIComponent(action);
    }

    function normalizeEndpointList(raw) {
        const source = Array.isArray(raw) ? raw : [raw];
        const normalized = source
            .map(value => String(value || '').trim())
            .filter(Boolean);
        return normalized.filter((value, index) => normalized.indexOf(value) === index);
    }

    function getAuthEndpointCandidates(primaryEndpoint) {
        const primary = normalizeEndpointList(primaryEndpoint);
        const fallbacks = normalizeEndpointList(window.AUTH_ENDPOINT_FALLBACKS || []);
        const all = primary.concat(fallbacks);
        return all.filter((value, index) => all.indexOf(value) === index);
    }

    async function postActionWithMeta(endpoint, action, payload) {
        const endpoints = getAuthEndpointCandidates(endpoint);
        if (!endpoints.length) {
            throw new Error('No auth endpoints configured.');
        }

        let lastError = null;
        for (const endpointCandidate of endpoints) {
            const startedAt = Date.now();
            try {
                const response = await fetch(withAction(endpointCandidate, action), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                    body: 'payload=' + encodeURIComponent(JSON.stringify(payload || {}))
                });
                if (!response.ok) {
                    lastError = new Error(`Auth request failed (${response.status}).`);
                    continue;
                }
                return {
                    data: await response.json(),
                    endpoint: endpointCandidate,
                    elapsedMs: Math.max(0, Date.now() - startedAt)
                };
            } catch (error) {
                lastError = error;
            }
        }

        throw (lastError || new Error('Failed to reach auth endpoint candidates.'));
    }

    async function postAction(endpoint, action, payload) {
        const result = await postActionWithMeta(endpoint, action, payload);
        return result.data;
    }

    function setStatus(el, msg, kind) {
        el.textContent = msg || '';
        el.className = 'secure-status ' + (kind || '');
    }

    function stringifyPayload(payload) {
        try {
            return JSON.stringify(payload, null, 2);
        } catch {
            return String(payload == null ? '' : payload);
        }
    }

    function setSummaryCard(el, title, items, kind) {
        if (!el) return;
        const rows = (Array.isArray(items) ? items : []).filter(Boolean);
        const safeTitle = escapeHtml(title || 'Summary');
        el.className = 'secure-result-card ' + (kind || '');
        el.innerHTML = `<strong>${safeTitle}</strong>` + (rows.length
            ? `<ul>${rows.map(function(item) { return `<li>${escapeHtml(item)}</li>`; }).join('')}</ul>`
            : `<p class="secure-helper-note">No details to show yet.</p>`);
    }

    function setAdvancedDetails(preEl, toggleBtn, payload) {
        const text = stringifyPayload(payload);
        if (preEl) {
            preEl.textContent = text;
            preEl.hidden = true;
        }
        if (toggleBtn) {
            toggleBtn.style.display = text && text !== '{}' ? '' : 'none';
            toggleBtn.textContent = 'Show Technical Details';
            toggleBtn.setAttribute('aria-expanded', 'false');
        }
    }

    function bindDetailsToggle(toggleBtn, preEl) {
        if (!toggleBtn || !preEl) return;
        toggleBtn.addEventListener('click', function() {
            const nextHidden = !preEl.hidden;
            preEl.hidden = nextHidden;
            toggleBtn.textContent = nextHidden ? 'Show Technical Details' : 'Hide Technical Details';
            toggleBtn.setAttribute('aria-expanded', nextHidden ? 'false' : 'true');
        });
    }

    bindDetailsToggle(adminToggleDetailsBtn, adminOutputEl);
    bindDetailsToggle(bulkToggleDetailsBtn, bulkOutputEl);
    bindDetailsToggle(manageToggleDetailsBtn, manageOutputEl);

    function syncAccordionState(sectionEl, shouldOpen) {
        if (!sectionEl) return;
        const toggleBtn = sectionEl.querySelector('.secure-accordion-toggle');
        const bodyEl = sectionEl.querySelector('.secure-accordion-body');
        sectionEl.classList.toggle('is-open', !!shouldOpen);
        if (toggleBtn) toggleBtn.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
        if (bodyEl) bodyEl.hidden = !shouldOpen;
    }

    function initAdminAccordions() {
        const sections = Array.from(document.querySelectorAll('#secure-admin-form .secure-accordion'));
        sections.forEach(function(sectionEl) {
            const toggleBtn = sectionEl.querySelector('.secure-accordion-toggle');
            const isOpen = sectionEl.classList.contains('is-open');
            syncAccordionState(sectionEl, isOpen);
            if (!toggleBtn) return;
            toggleBtn.addEventListener('click', function() {
                const shouldOpen = !sectionEl.classList.contains('is-open');
                if (shouldOpen) {
                    sections.forEach(function(otherSection) {
                        if (otherSection !== sectionEl) syncAccordionState(otherSection, false);
                    });
                }
                syncAccordionState(sectionEl, shouldOpen);
            });
        });
    }

    initAdminAccordions();

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function applySelectedUserToEditor(email, display, role, status) {
        const emailInput = document.getElementById('secure-manage-email');
        const displayInput = document.getElementById('secure-manage-display');
        const roleInput = document.getElementById('secure-manage-role');
        const statusInput = document.getElementById('secure-manage-status');
        if (emailInput) emailInput.value = String(email || '');
        if (displayInput) displayInput.value = String(display || '');
        if (roleInput) roleInput.value = String(role || 'Member');
        if (statusInput) statusInput.value = String(status || 'active');
        setStatus(manageStatusOutputEl, `Selected ${String(email || '')} for editing.`, 'ok');
    }

    function setUsersViewMode(mode) {
        usersViewMode = mode === 'cards' ? 'cards' : 'table';
        if (usersViewToggleBtnEl) {
            usersViewToggleBtnEl.textContent = usersViewMode === 'cards' ? 'View: Cards' : 'View: Table';
        }
        if (usersTableWrapEl) usersTableWrapEl.style.display = usersViewMode === 'cards' ? 'none' : '';
        if (usersCardsWrapEl) usersCardsWrapEl.style.display = usersViewMode === 'cards' ? '' : 'none';
    }

    function getFilteredUsers(rows) {
        const source = Array.isArray(rows) ? rows : [];
        const search = String(usersSearchEl && usersSearchEl.value ? usersSearchEl.value : '').trim().toLowerCase();
        const roleFilter = String(usersRoleFilterEl && usersRoleFilterEl.value ? usersRoleFilterEl.value : '').trim().toLowerCase();
        const statusFilter = String(usersStatusFilterEl && usersStatusFilterEl.value ? usersStatusFilterEl.value : '').trim().toLowerCase();

        return source.filter(function(user) {
            const email = String(user.email || '').toLowerCase();
            const display = String(user.displayName || '').toLowerCase();
            const role = String(user.role || '').toLowerCase();
            const status = String(user.status || '').toLowerCase();

            if (search && email.indexOf(search) === -1 && display.indexOf(search) === -1) return false;
            if (roleFilter && role !== roleFilter) return false;
            if (statusFilter && status !== statusFilter) return false;
            return true;
        });
    }

    function stopEndpointAutoRefresh() {
        if (!endpointRefreshTimer) return;
        clearInterval(endpointRefreshTimer);
        endpointRefreshTimer = null;
    }

    function startEndpointAutoRefresh() {
        stopEndpointAutoRefresh();
        endpointRefreshTimer = setInterval(function() {
            if (!gatewayUnlocked || hubView.style.display === 'none') return;
            refreshLiveScriptStatus();
        }, 30000);
    }

    function setAutoRefreshEnabled(enabled) {
        if (enabled) {
            startEndpointAutoRefresh();
        } else {
            stopEndpointAutoRefresh();
        }
        try {
            localStorage.setItem('secureAdminAutoRefresh', enabled ? '1' : '0');
        } catch (err) {
            // Ignore storage failures in restricted browsers.
        }
    }

    function scorePasscode(passcode) {
        const value = String(passcode || '');
        if (!value) return { score: 0, label: 'n/a' };

        let score = Math.min(60, value.length * 4);
        if (/[a-z]/.test(value)) score += 10;
        if (/[A-Z]/.test(value)) score += 10;
        if (/\d/.test(value)) score += 10;
        if (/[^A-Za-z0-9]/.test(value)) score += 10;
        if (value.length >= 14) score += 10;
        score = Math.max(0, Math.min(100, score));

        let label = 'Weak';
        if (score >= 75) label = 'Strong';
        else if (score >= 50) label = 'Good';
        else if (score >= 35) label = 'Fair';
        return { score, label };
    }

    function applyPasscodeMeter(passcode) {
        const { score, label } = scorePasscode(passcode);
        if (passcodeMeterFillEl) passcodeMeterFillEl.style.width = `${score}%`;
        if (passcodeMeterNoteEl) passcodeMeterNoteEl.textContent = `Strength: ${label}${passcode ? ` (${score}%)` : ''}`;
    }

    function generateStrongPasscode(length = 16) {
        const source = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+[]{}';
        let result = '';
        for (let i = 0; i < length; i += 1) {
            const idx = Math.floor(Math.random() * source.length);
            result += source.charAt(idx);
        }
        return result;
    }

    function looksLikeEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
    }

    function normalizeBulkRole(value) {
        const raw = String(value || '').trim();
        if (!raw) return 'Member';
        const match = allowedRoles.find(role => role.toLowerCase() === raw.toLowerCase());
        return match || 'Member';
    }

    function normalizeBulkStatus(value) {
        const raw = String(value || '').trim().toLowerCase();
        if (!raw) return 'active';
        return allowedStatuses.includes(raw) ? raw : 'active';
    }

    function parseBulkUsers(rawText) {
        const source = String(rawText || '');
        const lines = source.split(/\r?\n/);
        const rows = [];
        const errors = [];
        const emailSet = new Set();

        lines.forEach((line, idx) => {
            const lineNo = idx + 1;
            const clean = String(line || '').trim();
            if (!clean) return;

            const parts = clean.split(',').map(part => String(part || '').trim());
            if (parts.length < 3) {
                errors.push(`Line ${lineNo}: expected at least email, passcode, displayName.`);
                return;
            }

            const email = String(parts[0] || '').toLowerCase();
            const passcode = String(parts[1] || '');
            const displayName = String(parts[2] || '');
            const role = normalizeBulkRole(parts[3]);
            const status = normalizeBulkStatus(parts[4]);

            if (!looksLikeEmail(email)) {
                errors.push(`Line ${lineNo}: invalid email.`);
                return;
            }
            if (passcode.length < 6) {
                errors.push(`Line ${lineNo}: passcode must be at least 6 characters.`);
                return;
            }
            if (!displayName) {
                errors.push(`Line ${lineNo}: displayName is required.`);
                return;
            }
            if (emailSet.has(email)) {
                errors.push(`Line ${lineNo}: duplicate email in batch.`);
                return;
            }

            emailSet.add(email);
            rows.push({ lineNo, email, passcode, displayName, role, status });
        });

        return { rows, errors, inputLines: lines.filter(line => String(line || '').trim()).length };
    }

    async function probeEndpoint(endpointCandidate) {
        const endpoint = String(endpointCandidate || '').trim();
        const startedAt = Date.now();
        if (!endpoint) return { endpoint: '', ok: false, elapsedMs: 0, detail: 'missing endpoint' };

        let controller = null;
        let timeoutId = null;
        try {
            if (typeof AbortController !== 'undefined') {
                controller = new AbortController();
                timeoutId = setTimeout(() => controller.abort(), 6500);
            }

            const url = withAction(endpoint, 'ping') + '&_ts=' + Date.now();
            const response = await fetch(url, {
                method: 'GET',
                cache: 'no-store',
                signal: controller ? controller.signal : undefined
            });

            const elapsedMs = Math.max(0, Date.now() - startedAt);
            if (!response.ok) {
                return { endpoint, ok: false, elapsedMs, detail: `HTTP ${response.status}` };
            }

            let payload = null;
            try {
                payload = await response.json();
            } catch (err) {
                payload = null;
            }

            const service = payload && payload.service ? String(payload.service) : 'reachable';
            return { endpoint, ok: true, elapsedMs, detail: service };
        } catch (err) {
            const elapsedMs = Math.max(0, Date.now() - startedAt);
            const message = (err && err.name === 'AbortError') ? 'timeout' : String(err && err.message ? err.message : err);
            return { endpoint, ok: false, elapsedMs, detail: message };
        } finally {
            if (timeoutId) clearTimeout(timeoutId);
        }
    }

    async function refreshLiveScriptStatus() {
        const preferredEndpoint = String((ownerSession && ownerSession.endpoint) || baseEndpoint || '').trim();
        const candidates = getAuthEndpointCandidates(preferredEndpoint);
        if (!candidates.length) {
            liveEndpointEl.textContent = 'No endpoint configured';
            liveSpeedEl.textContent = '-';
            liveRefreshEl.textContent = new Date().toLocaleTimeString();
            liveHealthEl.textContent = 'Offline';
            endpointOutputEl.textContent = 'No endpoint candidates were found.';
            return;
        }

        liveHealthEl.textContent = 'Checking...';
        endpointOutputEl.textContent = 'Running endpoint checks...';

        const results = await Promise.all(candidates.map(candidate => probeEndpoint(candidate)));
        const healthy = results.filter(item => item.ok).sort((a, b) => a.elapsedMs - b.elapsedMs);
        const winner = healthy[0] || null;

        if (winner && ownerSession) {
            ownerSession.endpoint = winner.endpoint;
        }

        liveEndpointEl.textContent = winner ? winner.endpoint : 'No responsive endpoint';
        liveSpeedEl.textContent = winner ? `${winner.elapsedMs} ms` : '-';
        liveRefreshEl.textContent = new Date().toLocaleTimeString();
        liveHealthEl.textContent = winner ? 'Online' : 'Offline';

        endpointOutputEl.textContent = results
            .map(item => `${item.ok ? 'OK' : 'FAIL'}  ${item.elapsedMs}ms  ${item.endpoint}  (${item.detail})`)
            .join('\n');
    }

    function showLogin() {
        gatewayUnlocked = false;
        ownerSession = null;
        stopEndpointAutoRefresh();
        loginView.style.display = '';
        hubView.style.display = 'none';
        adminView.style.display = 'none';
        ownerEmailEl.value = '';
        ownerPasscodeEl.value = '';
        adminOutputEl.textContent = '';
        adminOutputEl.hidden = true;
        setSummaryCard(adminSummaryEl, 'Create User Summary', ['Create a user, and the provision flow will write the account details directly to the auth sheets.'], '');
        setAdvancedDetails(adminOutputEl, adminToggleDetailsBtn, '');
        if (bulkOutputEl) {
            bulkOutputEl.textContent = '';
            bulkOutputEl.hidden = true;
            setAdvancedDetails(bulkOutputEl, bulkToggleDetailsBtn, '');
        }
        if (endpointOutputEl) endpointOutputEl.textContent = '';
        setStatus(hubStatusEl, '', '');
        setStatus(adminStatusEl, '', '');
        setStatus(bulkStatusEl, '', '');
        if (generatedPasscodeEl) generatedPasscodeEl.value = '';
        if (manageOutputEl) {
            manageOutputEl.textContent = '';
            manageOutputEl.hidden = true;
            setAdvancedDetails(manageOutputEl, manageToggleDetailsBtn, '');
        }
        setSummaryCard(bulkSummaryEl, 'Bulk Summary', ['Validate first, then create only the clean rows.'], '');
        setSummaryCard(manageSummaryEl, 'User Management Summary', ['Load users to begin. Advanced server details stay hidden unless you ask for them.'], '');
        loadedUsersDirectory = [];
        if (usersTableBodyEl) usersTableBodyEl.innerHTML = '<tr><td colspan="5">No users loaded.</td></tr>';
        applyPasscodeMeter('');
    }

    function showHub() {
        loginView.style.display = 'none';
        hubView.style.display = '';
        adminView.style.display = 'none';
        if (autoRefreshToggleEl && autoRefreshToggleEl.checked) startEndpointAutoRefresh();
        refreshLiveScriptStatus();
    }

    async function showAdminApp() {
        hubView.style.display = 'none';
        adminView.style.display = '';
        adminFormEl.style.display = '';

        if (!ownerSession) {
            setStatus(adminStatusEl, 'Session expired. Log in again.', 'err');
            showLogin();
            return;
        }

        setStatus(adminStatusEl, 'Admin tool ready. Loading users...', 'ok');
        await loadUsersDirectory();
    }

    async function verifyOwner(endpoint, email, passcode) {
        const authResult = await postActionWithMeta(endpoint, 'auth.login', {
            email,
            passcode,
            tabs: tabsPayload()
        });
        const data = authResult.data;

        if (!data.ok || !data.session) {
            throw new Error(data.error || 'Owner verification failed.');
        }

        if (!hasAdminProvisionRights(data.session, data.profile)) {
            throw new Error('This account is not authorized for admin tools.');
        }

        return {
            data,
            endpoint: authResult.endpoint,
            elapsedMs: authResult.elapsedMs
        };
    }

    document.getElementById('secure-login-btn').addEventListener('click', async function() {
        const endpoint = baseEndpoint;
        const email = String(ownerEmailEl.value || '').trim().toLowerCase();
        const passcode = ownerPasscodeEl.value;

        if (!endpoint || !email || !passcode) {
            setStatus(loginStatusEl, 'Enter your admin email and passcode.', 'err');
            return;
        }

        setStatus(loginStatusEl, 'Verifying...', '');

        try {
            const auth = await verifyOwner(endpoint, email, passcode);
            gatewayUnlocked = true;
            ownerSession = {
                endpoint: auth.endpoint || endpoint,
                email,
                token: String(
                    (auth && auth.data && auth.data.session && (
                        auth.data.session.token ||
                        auth.data.session.accessToken ||
                        auth.data.session.authToken ||
                        auth.data.session.jwt
                    )) ||
                    (auth && auth.data && (
                        auth.data.token ||
                        auth.data.accessToken ||
                        auth.data.authToken ||
                        auth.data.jwt
                    )) ||
                    ''
                ).trim(),
                role: normalizeRole(auth && auth.data && auth.data.profile ? auth.data.profile.role : (auth && auth.data && auth.data.session ? auth.data.session.role : '')),
                source: 'manual-login'
            };
            setStatus(loginStatusEl, '', '');
            showHub();
        } catch (err) {
            setStatus(loginStatusEl, String(err && err.message ? err.message : err), 'err');
        } finally {
            ownerPasscodeEl.value = '';
        }
    });

    ownerPasscodeEl.addEventListener('keydown', function(event) {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        document.getElementById('secure-login-btn').click();
    });

    document.getElementById('secure-open-admin-app').addEventListener('click', function() {
        if (!gatewayUnlocked) {
            setStatus(hubStatusEl, 'Secure hub is locked. Log in again.', 'err');
            showLogin();
            return;
        }
        showAdminApp();
    });

    document.getElementById('secure-lock-hub-btn').addEventListener('click', function() {
        showLogin();
        setStatus(loginStatusEl, 'Hub locked.', '');
    });

    document.getElementById('secure-admin-back-btn').addEventListener('click', function() {
        showHub();
    });

    document.getElementById('secure-refresh-endpoint-btn').addEventListener('click', async function() {
        await refreshLiveScriptStatus();
    });

    if (autoRefreshToggleEl) {
        let defaultEnabled = false;
        try {
            defaultEnabled = localStorage.getItem('secureAdminAutoRefresh') === '1';
        } catch (err) {
            defaultEnabled = false;
        }
        autoRefreshToggleEl.checked = defaultEnabled;
        if (defaultEnabled) setAutoRefreshEnabled(true);

        autoRefreshToggleEl.addEventListener('change', function() {
            setAutoRefreshEnabled(!!autoRefreshToggleEl.checked);
            refreshLiveScriptStatus();
        });
    }

    document.getElementById('secure-generate-passcode-btn').addEventListener('click', function() {
        const generated = generateStrongPasscode(18);
        generatedPasscodeEl.value = generated;
        applyPasscodeMeter(generated);
    });

    document.getElementById('secure-apply-passcode-btn').addEventListener('click', function() {
        const generated = String(generatedPasscodeEl.value || '');
        if (!generated) {
            setStatus(adminStatusEl, 'Generate a passcode first.', 'err');
            return;
        }
        const target = document.getElementById('secure-user-passcode');
        if (target) target.value = generated;
        setStatus(adminStatusEl, 'Generated passcode copied into user form.', 'ok');
    });

    document.getElementById('secure-bulk-validate-btn').addEventListener('click', function() {
        const parsed = parseBulkUsers(bulkUsersEl.value);
        const report = {
            inputLines: parsed.inputLines,
            validRows: parsed.rows.length,
            errors: parsed.errors
        };
        setAdvancedDetails(bulkOutputEl, bulkToggleDetailsBtn, report);

        if (parsed.errors.length) {
            setSummaryCard(bulkSummaryEl, 'Bulk Validation', [
                `${parsed.rows.length} valid row(s) ready`,
                `${parsed.errors.length} issue(s) need attention`,
                parsed.errors[0]
            ], 'err');
            setStatus(bulkStatusEl, `Validation found ${parsed.errors.length} issue(s).`, 'err');
            return;
        }

        setSummaryCard(bulkSummaryEl, 'Bulk Validation', [
            `${parsed.rows.length} valid row(s) ready to create`,
            'No validation issues found'
        ], 'ok');
        setStatus(bulkStatusEl, `Validation passed for ${parsed.rows.length} row(s).`, 'ok');
    });

    document.getElementById('secure-bulk-create-btn').addEventListener('click', async function() {
        const endpoint = String((ownerSession && ownerSession.endpoint) || baseEndpoint || '').trim();
        if (!ownerSession || !ownerSession.token) {
            setStatus(bulkStatusEl, 'Session expired. Log in again.', 'err');
            showLogin();
            return;
        }

        const parsed = parseBulkUsers(bulkUsersEl.value);
        if (!parsed.rows.length) {
            setStatus(bulkStatusEl, 'No valid rows to create.', 'err');
            setSummaryCard(bulkSummaryEl, 'Bulk Create', ['No valid rows are available to create.'], 'err');
            setAdvancedDetails(bulkOutputEl, bulkToggleDetailsBtn, { inputLines: parsed.inputLines, errors: parsed.errors });
            return;
        }
        if (parsed.errors.length) {
            setStatus(bulkStatusEl, `Fix ${parsed.errors.length} validation issue(s) before creating users.`, 'err');
            setSummaryCard(bulkSummaryEl, 'Bulk Create', [
                `${parsed.errors.length} validation issue(s) must be fixed first`,
                parsed.errors[0]
            ], 'err');
            setAdvancedDetails(bulkOutputEl, bulkToggleDetailsBtn, { inputLines: parsed.inputLines, errors: parsed.errors });
            return;
        }

        const results = [];
        setStatus(bulkStatusEl, `Creating ${parsed.rows.length} user(s)...`, '');
        setSummaryCard(bulkSummaryEl, 'Bulk Create', [`Creating ${parsed.rows.length} user(s)...`], '');
        setAdvancedDetails(bulkOutputEl, bulkToggleDetailsBtn, '');

        for (let i = 0; i < parsed.rows.length; i += 1) {
            const row = parsed.rows[i];
            try {
                const created = await postActionWithMeta(endpoint, 'auth.admin.provisionSession', {
                    token: ownerSession.token,
                    email: row.email,
                    passcode: row.passcode,
                    displayName: row.displayName,
                    role: row.role,
                    status: row.status,
                    tabs: tabsPayload()
                });

                if (created.endpoint) ownerSession.endpoint = created.endpoint;
                results.push({
                    lineNo: row.lineNo,
                    email: row.email,
                    ok: !!(created.data && created.data.ok),
                    endpoint: created.endpoint,
                    elapsedMs: created.elapsedMs,
                    error: created.data && created.data.ok ? '' : String(created.data && created.data.error ? created.data.error : 'Provisioning failed')
                });
            } catch (err) {
                results.push({
                    lineNo: row.lineNo,
                    email: row.email,
                    ok: false,
                    endpoint: endpoint,
                    elapsedMs: 0,
                    error: String(err && err.message ? err.message : err)
                });
            }

            setStatus(bulkStatusEl, `Processed ${i + 1} of ${parsed.rows.length} row(s)...`, '');
        }

        const okCount = results.filter(item => item.ok).length;
        const failCount = results.length - okCount;
        setSummaryCard(bulkSummaryEl, 'Bulk Create Complete', [
            `${okCount} user(s) created`,
            `${failCount} user(s) failed`,
            failCount ? (results.find(function(item) { return !item.ok; }) || {}).error || 'Check technical details for the first error.' : 'All rows completed successfully.'
        ], failCount ? 'err' : 'ok');
        setAdvancedDetails(bulkOutputEl, bulkToggleDetailsBtn, { okCount, failCount, results });
        setStatus(bulkStatusEl, `Bulk complete: ${okCount} created, ${failCount} failed.`, failCount ? 'err' : 'ok');
        refreshLiveScriptStatus();
    });

    document.getElementById('secure-bulk-template-btn').addEventListener('click', function() {
        const template = [
            'email,passcode,displayName,role,status',
            'jane@example.com,Pass123!Safe,Jane Smith,Leader,active',
            'john@example.com,Pass123!Strong,John Doe,Member,pending'
        ].join('\n');

        const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'admin_bulk_template.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setStatus(bulkStatusEl, 'CSV template downloaded.', 'ok');
    });

    function renderUsersTable(rows) {
        if (!usersTableBodyEl) return;
        const source = getFilteredUsers(rows);
        if (!source.length) {
            usersTableBodyEl.innerHTML = '<tr><td colspan="5">No users match current filters.</td></tr>';
            if (usersCardsWrapEl) usersCardsWrapEl.innerHTML = '<div class="secure-helper-note">No users match current filters.</div>';
            return;
        }

        usersTableBodyEl.innerHTML = source.map(function(user) {
            const email = String(user.email || '');
            const display = String(user.displayName || '');
            const role = String(user.role || 'Member');
            const status = String(user.status || 'active');
            const failed = Number(user.failedLoginCount || 0);
            return `<tr data-email="${escapeHtml(email)}"><td>${escapeHtml(email)}</td><td>${escapeHtml(display || '-')}</td><td>${escapeHtml(role)}</td><td>${escapeHtml(status)}</td><td>${failed}</td></tr>`;
        }).join('');

        Array.from(usersTableBodyEl.querySelectorAll('tr[data-email]')).forEach(function(rowEl) {
            rowEl.style.cursor = 'pointer';
            rowEl.addEventListener('click', function() {
                const email = String(rowEl.getAttribute('data-email') || '');
                const cells = rowEl.querySelectorAll('td');
                const display = cells[1] ? cells[1].textContent : '';
                const role = cells[2] ? cells[2].textContent : 'Member';
                const status = cells[3] ? cells[3].textContent : 'active';
                applySelectedUserToEditor(email, display === '-' ? '' : display, role, status);
            });
        });

        if (usersCardsWrapEl) {
            usersCardsWrapEl.innerHTML = source.map(function(user, index) {
                const email = String(user.email || '');
                const display = String(user.displayName || 'Unnamed User');
                const role = String(user.role || 'Member');
                const status = String(user.status || 'active');
                const failed = Number(user.failedLoginCount || 0);
                const created = String(user.createdAt || '-');
                const updated = String(user.updatedAt || '-');
                const cardId = `secure-user-card-${index}`;
                return `
                    <article class="secure-user-card" data-email="${escapeHtml(email)}">
                        <button type="button" class="secure-user-card-head" aria-expanded="false" aria-controls="${cardId}">
                            <div>
                                <div class="secure-user-card-title">${escapeHtml(display)}</div>
                                <div class="secure-user-card-sub">${escapeHtml(email)} • ${escapeHtml(role)} • ${escapeHtml(status)}</div>
                            </div>
                            <span class="secure-user-card-chevron">▼</span>
                        </button>
                        <div class="secure-user-card-body" id="${cardId}">
                            <div class="secure-user-card-grid">
                                <div>
                                    <div class="secure-user-card-field-label">Email</div>
                                    <div class="secure-user-card-field-value">${escapeHtml(email)}</div>
                                </div>
                                <div>
                                    <div class="secure-user-card-field-label">Display Name</div>
                                    <div class="secure-user-card-field-value">${escapeHtml(display)}</div>
                                </div>
                                <div>
                                    <div class="secure-user-card-field-label">Role</div>
                                    <div class="secure-user-card-field-value">${escapeHtml(role)}</div>
                                </div>
                                <div>
                                    <div class="secure-user-card-field-label">Status</div>
                                    <div class="secure-user-card-field-value">${escapeHtml(status)}</div>
                                </div>
                                <div>
                                    <div class="secure-user-card-field-label">Failed Logins</div>
                                    <div class="secure-user-card-field-value">${failed}</div>
                                </div>
                                <div>
                                    <div class="secure-user-card-field-label">Updated</div>
                                    <div class="secure-user-card-field-value">${escapeHtml(updated)}</div>
                                </div>
                                <div style="grid-column:1 / -1;">
                                    <div class="secure-user-card-field-label">Created</div>
                                    <div class="secure-user-card-field-value">${escapeHtml(created)}</div>
                                </div>
                            </div>
                            <div class="secure-user-card-actions">
                                <button type="button" class="secure-user-card-pick-btn" data-pick-user="${escapeHtml(email)}">Use In Editor</button>
                            </div>
                        </div>
                    </article>
                `;
            }).join('');

            Array.from(usersCardsWrapEl.querySelectorAll('.secure-user-card')).forEach(function(cardEl) {
                const headBtn = cardEl.querySelector('.secure-user-card-head');
                const bodyEl = cardEl.querySelector('.secure-user-card-body');
                const pickBtn = cardEl.querySelector('[data-pick-user]');
                if (headBtn && bodyEl) {
                    headBtn.addEventListener('click', function() {
                        const shouldOpen = !cardEl.classList.contains('is-open');
                        Array.from(usersCardsWrapEl.querySelectorAll('.secure-user-card.is-open')).forEach(function(openCard) {
                            openCard.classList.remove('is-open');
                            const openHead = openCard.querySelector('.secure-user-card-head');
                            if (openHead) openHead.setAttribute('aria-expanded', 'false');
                        });
                        cardEl.classList.toggle('is-open', shouldOpen);
                        headBtn.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
                    });
                }
                if (pickBtn) {
                    pickBtn.addEventListener('click', function() {
                        const email = String(cardEl.getAttribute('data-email') || '');
                        const user = source.find(function(item) { return String(item.email || '') === email; }) || null;
                        applySelectedUserToEditor(
                            email,
                            String(user && user.displayName ? user.displayName : ''),
                            String(user && user.role ? user.role : 'Member'),
                            String(user && user.status ? user.status : 'active')
                        );
                    });
                }
            });
        }

        setStatus(manageStatusOutputEl, `Showing ${source.length} user(s) from ${Array.isArray(rows) ? rows.length : 0} loaded.`, 'ok');
    }

    function exportUsersCsv(rows) {
        const source = Array.isArray(rows) ? rows : [];
        if (!source.length) {
            setStatus(manageStatusOutputEl, 'No users available to export.', 'err');
            return;
        }

        const esc = function(value) {
            const raw = String(value == null ? '' : value);
            return '"' + raw.replace(/"/g, '""') + '"';
        };

        const header = ['email', 'displayName', 'role', 'status', 'failedLoginCount', 'createdAt', 'updatedAt'];
        const lines = [header.join(',')];
        source.forEach(function(user) {
            lines.push([
                esc(user.email),
                esc(user.displayName),
                esc(user.role),
                esc(user.status),
                esc(user.failedLoginCount),
                esc(user.createdAt),
                esc(user.updatedAt)
            ].join(','));
        });

        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'admin_users_export.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setStatus(manageStatusOutputEl, `Exported ${source.length} user(s) to CSV.`, 'ok');
    }

    async function loadUsersDirectory() {
        const endpoint = String((ownerSession && ownerSession.endpoint) || baseEndpoint || '').trim();
        if (!ownerSession || !ownerSession.token) {
            setStatus(manageStatusOutputEl, 'Session expired. Log in again.', 'err');
            showLogin();
            return;
        }

        setStatus(manageStatusOutputEl, 'Loading users...', '');
        try {
            const result = await postActionWithMeta(endpoint, 'auth.admin.listUsersSession', {
                token: ownerSession.token,
                tabs: tabsPayload()
            });
            if (result.endpoint) ownerSession.endpoint = result.endpoint;

            const data = result.data || {};
            setAdvancedDetails(manageOutputEl, manageToggleDetailsBtn, data);
            if (!data.ok) {
                setSummaryCard(manageSummaryEl, 'Load Users', [data.error || 'Failed to load users.'], 'err');
                setStatus(manageStatusOutputEl, data.error || 'Failed to load users.', 'err');
                return;
            }

            loadedUsersDirectory = Array.isArray(data.users) ? data.users : [];
            renderUsersTable(loadedUsersDirectory);
                        renderActiveUsers(loadedUsersDirectory);
            const statusCounts = loadedUsersDirectory.reduce(function(acc, user) {
                const status = String(user && user.status ? user.status : 'active').trim().toLowerCase() || 'active';
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {});
            const summaryRows = [
                `${Number(data.count || 0)} total user(s) loaded`
            ].concat(Object.keys(statusCounts).sort().map(function(key) {
                return `${statusCounts[key]} ${key}`;
            }));
            setSummaryCard(manageSummaryEl, 'Load Users', summaryRows, 'ok');
            setStatus(manageStatusOutputEl, `Loaded ${Number(data.count || 0)} users.`, 'ok');
            refreshLiveScriptStatus();
        } catch (err) {
            setSummaryCard(manageSummaryEl, 'Load Users', [String(err && err.message ? err.message : err)], 'err');
            setStatus(manageStatusOutputEl, String(err && err.message ? err.message : err), 'err');
        }
    }

    async function applyUpdateToFilteredUsers() {
        const endpoint = String((ownerSession && ownerSession.endpoint) || baseEndpoint || '').trim();
        const role = String(document.getElementById('secure-manage-role').value || 'Member');
        const status = String(document.getElementById('secure-manage-status').value || 'active');

        if (!ownerSession || !ownerSession.token) {
            setStatus(manageStatusOutputEl, 'Session expired. Log in again.', 'err');
            showLogin();
            return;
        }

        const targets = getFilteredUsers(loadedUsersDirectory);
        if (!targets.length) {
            setStatus(manageStatusOutputEl, 'No filtered users to update.', 'err');
            return;
        }

        const highRiskReasons = [];
        if (String(role).toLowerCase() === 'admin') highRiskReasons.push('role = Admin');
        if (String(status).toLowerCase() === 'locked') highRiskReasons.push('status = locked');
        if (highRiskReasons.length) {
            const approved = window.confirm(`High-risk bulk update: ${highRiskReasons.join(', ')} for ${targets.length} user(s). Continue?`);
            if (!approved) {
                setStatus(manageStatusOutputEl, 'Bulk update canceled by admin.', '');
                return;
            }
        }

        const phrase = window.prompt(`Type APPLY FILTERED to confirm updating ${targets.length} filtered user(s):`);
        if (String(phrase || '').trim() !== 'APPLY FILTERED') {
            setStatus(manageStatusOutputEl, 'Bulk update canceled. Confirmation phrase mismatch.', 'err');
            return;
        }

        setStatus(manageStatusOutputEl, `Bulk updating ${targets.length} user(s)...`, '');
        const results = [];

        for (let i = 0; i < targets.length; i += 1) {
            const user = targets[i];
            try {
                const result = await postActionWithMeta(endpoint, 'auth.admin.updateUserSession', {
                    token: ownerSession.token,
                    email: String(user.email || '').trim().toLowerCase(),
                    role,
                    status,
                    tabs: tabsPayload()
                });
                if (result.endpoint) ownerSession.endpoint = result.endpoint;
                const ok = !!(result.data && result.data.ok);
                results.push({
                    email: user.email,
                    ok,
                    elapsedMs: result.elapsedMs,
                    error: ok ? '' : String(result.data && result.data.error ? result.data.error : 'Update failed')
                });
            } catch (err) {
                results.push({
                    email: user.email,
                    ok: false,
                    elapsedMs: 0,
                    error: String(err && err.message ? err.message : err)
                });
            }

            setStatus(manageStatusOutputEl, `Bulk processed ${i + 1} of ${targets.length} user(s)...`, '');
        }

        const okCount = results.filter(function(item) { return item.ok; }).length;
        const failCount = results.length - okCount;
        const bulkUpdateReport = {
            operation: 'bulk_update_filtered',
            role,
            status,
            targetCount: targets.length,
            okCount,
            failCount,
            results
        };
        setAdvancedDetails(manageOutputEl, manageToggleDetailsBtn, bulkUpdateReport);
        setSummaryCard(manageSummaryEl, 'Bulk Update Complete', [
            `${okCount} user(s) updated`,
            `${failCount} user(s) failed`,
            `Applied role ${role} and status ${status} to ${targets.length} filtered user(s)`
        ], failCount ? 'err' : 'ok');

        setStatus(manageStatusOutputEl, `Bulk update complete: ${okCount} updated, ${failCount} failed.`, failCount ? 'err' : 'ok');
        await loadUsersDirectory();
    }

    document.getElementById('secure-load-users-btn').addEventListener('click', async function() {
        await loadUsersDirectory();
    });

    document.getElementById('secure-export-users-btn').addEventListener('click', function() {
        const filtered = getFilteredUsers(loadedUsersDirectory);
        exportUsersCsv(filtered);
    });

    [usersSearchEl, usersRoleFilterEl, usersStatusFilterEl].forEach(function(control) {
        if (!control) return;
        control.addEventListener('input', function() {
            renderUsersTable(loadedUsersDirectory);
        });
        control.addEventListener('change', function() {
            renderUsersTable(loadedUsersDirectory);
        });
    });

    if (usersViewToggleBtnEl) {
        usersViewToggleBtnEl.addEventListener('click', function() {
            setUsersViewMode(usersViewMode === 'table' ? 'cards' : 'table');
            renderUsersTable(loadedUsersDirectory);
        });
    }

    if (activeUsersRefreshBtnEl) {
        activeUsersRefreshBtnEl.addEventListener('click', async function() {
            renderActiveUsers(loadedUsersDirectory);
        });
    }

    if (activeUsersViewToggleBtnEl) {
        activeUsersViewToggleBtnEl.addEventListener('click', function() {
            setActiveUsersViewMode(activeUsersViewMode === 'table' ? 'cards' : 'table');
            renderActiveUsers(loadedUsersDirectory);
        });
    }
    document.getElementById('secure-update-user-btn').addEventListener('click', async function() {
        const endpoint = String((ownerSession && ownerSession.endpoint) || baseEndpoint || '').trim();
        const email = String(document.getElementById('secure-manage-email').value || '').trim().toLowerCase();
        const displayName = String(document.getElementById('secure-manage-display').value || '').trim();
        const role = String(document.getElementById('secure-manage-role').value || 'Member');
        const status = String(document.getElementById('secure-manage-status').value || 'active');

        if (!ownerSession || !ownerSession.token) {
            setStatus(manageStatusOutputEl, 'Session expired. Log in again.', 'err');
            showLogin();
            return;
        }
        if (!looksLikeEmail(email)) {
            setStatus(manageStatusOutputEl, 'Target email is required.', 'err');
            return;
        }

        const highRiskReasons = [];
        if (String(role).toLowerCase() === 'admin') highRiskReasons.push('role = Admin');
        if (String(status).toLowerCase() === 'locked') highRiskReasons.push('status = locked');
        if (highRiskReasons.length) {
            const approved = window.confirm(`High-risk update for ${email}: ${highRiskReasons.join(', ')}. Continue?`);
            if (!approved) {
                setStatus(manageStatusOutputEl, 'Update canceled by admin.', '');
                return;
            }
        }

        setStatus(manageStatusOutputEl, 'Updating user...', '');
        try {
            const result = await postActionWithMeta(endpoint, 'auth.admin.updateUserSession', {
                token: ownerSession.token,
                email,
                displayName,
                role,
                status,
                tabs: tabsPayload()
            });
            if (result.endpoint) ownerSession.endpoint = result.endpoint;
            const data = result.data || {};
            setAdvancedDetails(manageOutputEl, manageToggleDetailsBtn, data);
            if (!data.ok) {
                setSummaryCard(manageSummaryEl, 'User Update', [data.error || 'Update failed.'], 'err');
                setStatus(manageStatusOutputEl, data.error || 'Update failed.', 'err');
                return;
            }

            setSummaryCard(manageSummaryEl, 'User Update', [
                `Updated ${email}`,
                displayName ? `Display name: ${displayName}` : 'Display name unchanged or cleared',
                `Role: ${role}`,
                `Status: ${status}`
            ], 'ok');
            setStatus(manageStatusOutputEl, 'User updated successfully.', 'ok');
            await loadUsersDirectory();
        } catch (err) {
            setSummaryCard(manageSummaryEl, 'User Update', [String(err && err.message ? err.message : err)], 'err');
            setStatus(manageStatusOutputEl, String(err && err.message ? err.message : err), 'err');
        }
    });

    document.getElementById('secure-reset-failed-btn').addEventListener('click', async function() {
        const endpoint = String((ownerSession && ownerSession.endpoint) || baseEndpoint || '').trim();
        const email = String(document.getElementById('secure-manage-email').value || '').trim().toLowerCase();

        if (!ownerSession || !ownerSession.token) {
            setStatus(manageStatusOutputEl, 'Session expired. Log in again.', 'err');
            showLogin();
            return;
        }
        if (!looksLikeEmail(email)) {
            setStatus(manageStatusOutputEl, 'Target email is required.', 'err');
            return;
        }

        setStatus(manageStatusOutputEl, 'Resetting failed login count...', '');
        try {
            const result = await postActionWithMeta(endpoint, 'auth.admin.resetFailedLoginSession', {
                token: ownerSession.token,
                email,
                tabs: tabsPayload()
            });
            if (result.endpoint) ownerSession.endpoint = result.endpoint;
            const data = result.data || {};
            setAdvancedDetails(manageOutputEl, manageToggleDetailsBtn, data);
            if (!data.ok) {
                setSummaryCard(manageSummaryEl, 'Reset Failed Login Count', [data.error || 'Reset failed.'], 'err');
                setStatus(manageStatusOutputEl, data.error || 'Reset failed.', 'err');
                return;
            }

            setSummaryCard(manageSummaryEl, 'Reset Failed Login Count', [`Failed logins reset for ${email}`], 'ok');
            setStatus(manageStatusOutputEl, 'Failed login count reset.', 'ok');
            await loadUsersDirectory();
        } catch (err) {
            setSummaryCard(manageSummaryEl, 'Reset Failed Login Count', [String(err && err.message ? err.message : err)], 'err');
            setStatus(manageStatusOutputEl, String(err && err.message ? err.message : err), 'err');
        }
    });

    async function applySingleStatusChange(nextStatus, successTitle, successVerb) {
        const endpoint = String((ownerSession && ownerSession.endpoint) || baseEndpoint || '').trim();
        const email = String(document.getElementById('secure-manage-email').value || '').trim().toLowerCase();
        const displayName = String(document.getElementById('secure-manage-display').value || '').trim();
        const role = String(document.getElementById('secure-manage-role').value || 'Member');

        if (!ownerSession || !ownerSession.token) {
            setStatus(manageStatusOutputEl, 'Session expired. Log in again.', 'err');
            showLogin();
            return;
        }
        if (!looksLikeEmail(email)) {
            setStatus(manageStatusOutputEl, 'Target email is required.', 'err');
            return;
        }

        setStatus(manageStatusOutputEl, `${successVerb} user...`, '');
        try {
            const result = await postActionWithMeta(endpoint, 'auth.admin.updateUserSession', {
                token: ownerSession.token,
                email,
                displayName,
                role,
                status: nextStatus,
                tabs: tabsPayload()
            });
            if (result.endpoint) ownerSession.endpoint = result.endpoint;
            const data = result.data || {};
            setAdvancedDetails(manageOutputEl, manageToggleDetailsBtn, data);
            if (!data.ok) {
                setSummaryCard(manageSummaryEl, successTitle, [data.error || `${successTitle} failed.`], 'err');
                setStatus(manageStatusOutputEl, data.error || `${successTitle} failed.`, 'err');
                return;
            }

            setSummaryCard(manageSummaryEl, successTitle, [
                `${email}`,
                `Status set to ${nextStatus}`
            ], 'ok');
            setStatus(manageStatusOutputEl, `${successTitle} completed.`, 'ok');
            await loadUsersDirectory();
        } catch (err) {
            setSummaryCard(manageSummaryEl, successTitle, [String(err && err.message ? err.message : err)], 'err');
            setStatus(manageStatusOutputEl, String(err && err.message ? err.message : err), 'err');
        }
    }

    document.getElementById('secure-archive-user-btn').addEventListener('click', async function() {
        const email = String(document.getElementById('secure-manage-email').value || '').trim().toLowerCase();
        if (!looksLikeEmail(email)) {
            setStatus(manageStatusOutputEl, 'Target email is required.', 'err');
            return;
        }
        const ok = window.confirm(`Archive ${email}? This will keep the record but mark the user as archived.`);
        if (!ok) return;
        await applySingleStatusChange('archived', 'Archive User', 'Archiving');
    });

    document.getElementById('secure-unarchive-user-btn').addEventListener('click', async function() {
        const email = String(document.getElementById('secure-manage-email').value || '').trim().toLowerCase();
        if (!looksLikeEmail(email)) {
            setStatus(manageStatusOutputEl, 'Target email is required.', 'err');
            return;
        }
        const ok = window.confirm(`Unarchive ${email}? This will return the user to active status.`);
        if (!ok) return;
        await applySingleStatusChange('active', 'Unarchive User', 'Unarchiving');
    });

    document.getElementById('secure-delete-user-btn').addEventListener('click', async function() {
        const endpoint = String((ownerSession && ownerSession.endpoint) || baseEndpoint || '').trim();
        const email = String(document.getElementById('secure-manage-email').value || '').trim().toLowerCase();

        if (!ownerSession || !ownerSession.token) {
            setStatus(manageStatusOutputEl, 'Session expired. Log in again.', 'err');
            showLogin();
            return;
        }
        if (!looksLikeEmail(email)) {
            setStatus(manageStatusOutputEl, 'Target email is required.', 'err');
            return;
        }

        const phrase = window.prompt(`Type DELETE ${email} to permanently remove this user:`);
        if (String(phrase || '').trim() !== `DELETE ${email}`) {
            setStatus(manageStatusOutputEl, 'Delete canceled. Confirmation phrase mismatch.', 'err');
            return;
        }

        setStatus(manageStatusOutputEl, 'Deleting user...', '');
        try {
            const result = await postActionWithMeta(endpoint, 'auth.admin.deleteUserSession', {
                token: ownerSession.token,
                email,
                tabs: tabsPayload()
            });
            if (result.endpoint) ownerSession.endpoint = result.endpoint;
            const data = result.data || {};
            setAdvancedDetails(manageOutputEl, manageToggleDetailsBtn, data);
            if (!data.ok) {
                const message = data.error || 'Delete failed. The backend delete action may not be deployed yet.';
                setSummaryCard(manageSummaryEl, 'Delete User', [message], 'err');
                setStatus(manageStatusOutputEl, message, 'err');
                return;
            }

            setSummaryCard(manageSummaryEl, 'Delete User', [`Deleted ${email}`], 'ok');
            setStatus(manageStatusOutputEl, 'User deleted successfully.', 'ok');
            await loadUsersDirectory();
        } catch (err) {
            const message = String(err && err.message ? err.message : err);
            setSummaryCard(manageSummaryEl, 'Delete User', [message, 'If this persists, deploy backend support for auth.admin.deleteUserSession.'], 'err');
            setStatus(manageStatusOutputEl, message, 'err');
        }
    });

    document.getElementById('secure-apply-filtered-btn').addEventListener('click', async function() {
        await applyUpdateToFilteredUsers();
    });

    document.getElementById('secure-create-user-btn').addEventListener('click', async function() {
        const endpoint = String((ownerSession && ownerSession.endpoint) || baseEndpoint || '').trim();
        const email = String(document.getElementById('secure-user-email').value || '').trim().toLowerCase();
        const passcode = String(document.getElementById('secure-user-passcode').value || '');
        const displayName = String(document.getElementById('secure-user-display').value || '').trim();
        const role = String(document.getElementById('secure-user-role').value || 'Member');
        const status = String(document.getElementById('secure-user-status').value || 'active');

        if (!ownerSession || !ownerSession.token) {
            setStatus(adminStatusEl, 'Session expired. Log in again.', 'err');
            showLogin();
            return;
        }

        if (!endpoint || !email || !passcode || !displayName) {
            setStatus(adminStatusEl, 'All provisioning fields are required.', 'err');
            return;
        }

        setStatus(adminStatusEl, 'Creating user...', '');
        adminOutputEl.textContent = '';
        adminOutputEl.hidden = true;

        try {
            const result = await postActionWithMeta(endpoint, 'auth.admin.provisionSession', {
                token: ownerSession.token,
                email,
                passcode,
                displayName,
                role,
                status,
                tabs: tabsPayload()
            });
            const data = result.data;

            if (result.endpoint) ownerSession.endpoint = result.endpoint;

            setAdvancedDetails(adminOutputEl, adminToggleDetailsBtn, data);
            if (!data.ok) {
                setSummaryCard(adminSummaryEl, 'Create User', [data.error || 'Provisioning failed.'], 'err');
                setStatus(adminStatusEl, data.error || 'Provisioning failed.', 'err');
                return;
            }

            setSummaryCard(adminSummaryEl, 'Create User', [
                `${displayName} created`,
                `${email}`,
                `Role: ${role}`,
                `Status: ${status}`,
                'User data has been written directly to the auth sheets.'
            ], 'ok');
            setStatus(adminStatusEl, `User created successfully (${result.elapsedMs} ms).`, 'ok');
            refreshLiveScriptStatus();
        } catch (err) {
            setSummaryCard(adminSummaryEl, 'Create User', [String(err && err.message ? err.message : err)], 'err');
            setStatus(adminStatusEl, String(err && err.message ? err.message : err), 'err');
        }
    });

    document.getElementById('secure-close-admin-btn').addEventListener('click', function() {
        stopEndpointAutoRefresh();
        showHub();
        adminOutputEl.textContent = '';
        adminOutputEl.hidden = true;
        setStatus(hubStatusEl, 'Admin app closed.', '');
    });

    if (bootstrapOwnerSessionFromSecure()) {
        showHub();
        setStatus(hubStatusEl, 'Using current authenticated admin session.', 'ok');
    } else {
        showLogin();
    }

    setUsersViewMode('table');
}

window.openAdminProvisionApp = openAdminProvisionApp;
