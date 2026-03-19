// ==========================================
// APP: FAMILY
// ==========================================

const familyAppState = {
    radarChart: null,
    activeRole: 'husband'
};

function renderFamilyAppShell() {
    const container = document.getElementById('modal-body-container');
    container.innerHTML = `
        <div class="family-app-wrap family-fade-in" style="background:#f8fafc; color:#0f172a; border-radius:22px; overflow:hidden;">
            <header style="position:relative; padding:28px 18px 22px; overflow:hidden; background:linear-gradient(180deg, rgba(2,6,23,0.98), rgba(15,23,42,0.98));">
                <div style="position:absolute; inset:auto auto 0 -60px; width:220px; height:220px; background:radial-gradient(circle, rgba(79,70,229,0.22), transparent 68%);"></div>
                <div style="position:absolute; inset:-40px -50px auto auto; width:220px; height:220px; background:radial-gradient(circle, rgba(45,212,191,0.18), transparent 68%);"></div>
                <div style="position:relative; max-width:920px; margin:0 auto; text-align:center;">
                    <div style="display:inline-block; padding:6px 12px; border-radius:999px; background:rgba(99,102,241,0.12); color:#a5b4fc; border:1px solid rgba(99,102,241,0.22); font-size:0.68rem; font-weight:800; letter-spacing:2px; text-transform:uppercase; margin-bottom:16px;">A Research Master-Page</div>
                    <h2 style="margin:0 0 12px; font-family:'Merriweather', serif; font-size:clamp(2rem, 5vw, 3.4rem); line-height:1.1; font-weight:900; color:#fff; text-shadow:0 0 20px rgba(168,85,247,0.18);">The Blueprint of <span style="background:linear-gradient(90deg, #818cf8, #c084fc, #2dd4bf); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;">Eternal Grace</span></h2>
                    <p style="max-width:720px; margin:0 auto; color:#cbd5e1; font-size:1rem; line-height:1.7;">An interactive research hub exploring the divine hierarchy of marital roles, ministerial purpose, and restorative truth for the modern home.</p>
                    <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:10px; margin-top:20px;">
                        <button type="button" class="clear-btn" data-family-jump="portrait" style="justify-content:center; min-width:180px; background:linear-gradient(135deg, #4f46e5, #9333ea); border:none; color:#fff;">The Divine Design</button>
                        <button type="button" class="clear-btn" data-family-jump="counseling" style="justify-content:center; min-width:180px; background:rgba(255,255,255,0.1); color:#fff; border:1px solid rgba(255,255,255,0.12);">Counseling Resources</button>
                    </div>
                </div>
            </header>

            <div style="padding:22px 14px 30px; background-image:radial-gradient(at 0% 0%, rgba(99,102,241,0.05) 0px, transparent 45%), radial-gradient(at 100% 0%, rgba(168,85,247,0.05) 0px, transparent 45%), radial-gradient(at 50% 100%, rgba(45,212,191,0.06) 0px, transparent 45%);">
                <section id="family-portrait" style="max-width:1040px; margin:0 auto 28px; scroll-margin-top:16px;">
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 280px), 1fr)); gap:18px; align-items:center;">
                        <div style="display:flex; flex-direction:column; gap:14px;">
                            <h3 style="margin:0; font-family:'Merriweather', serif; font-size:2rem; color:#0f172a;">The Divine Portrait</h3>
                            <p style="margin:0; font-size:1rem; line-height:1.8; color:#475569;">Marriage is not a human invention; it is an eternal photograph. The family unit becomes a primary vehicle for the Gospel’s revelation, with Christ and the Church as the blueprint.</p>
                            <div style="display:grid; gap:10px;">
                                <div style="display:flex; align-items:center; gap:12px; padding:14px; border-radius:18px; background:rgba(255,255,255,0.72); border-left:4px solid #6366f1; box-shadow:0 10px 30px -18px rgba(15,23,42,0.28);">
                                    <div style="font-size:1.5rem;">✧</div>
                                    <div>
                                        <div style="font-weight:800; color:#0f172a;">Covenantal Permanence</div>
                                        <div style="font-size:0.92rem; color:#64748b;">Mirroring God’s unwavering faithfulness to His people.</div>
                                    </div>
                                </div>
                                <div style="display:flex; align-items:center; gap:12px; padding:14px; border-radius:18px; background:rgba(255,255,255,0.72); border-left:4px solid #a855f7; box-shadow:0 10px 30px -18px rgba(15,23,42,0.28);">
                                    <div style="font-size:1.5rem;">❋</div>
                                    <div>
                                        <div style="font-weight:800; color:#0f172a;">Complementary Glory</div>
                                        <div style="font-size:0.92rem; color:#64748b;">Reflecting unity and distinction in a God-ordered home.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style="background:rgba(15,23,42,0.94); color:#f8fafc; border:1px solid rgba(255,255,255,0.08); border-radius:24px; padding:20px; box-shadow:0 20px 50px -12px rgba(0,0,0,0.45);">
                            <div style="text-align:center; font-size:0.78rem; font-weight:800; letter-spacing:1.5px; color:#a5b4fc; text-transform:uppercase; margin-bottom:14px;">Biblical Transformation Metrics</div>
                            <div class="family-radar-shell">
                                <canvas id="family-radar-chart"></canvas>
                            </div>
                            <p style="margin:14px 0 0; font-size:0.9rem; line-height:1.72; text-align:center; color:#94a3b8;">Data reflects the shift from self-centered contractual living to Christ-centered covenantal living.</p>
                        </div>
                    </div>
                </section>

                <section id="family-roles" style="max-width:1040px; margin:0 auto 28px;">
                    <div style="text-align:center; margin-bottom:16px;">
                        <h3 style="margin:0 0 8px; font-family:'Merriweather', serif; font-size:2rem; color:#0f172a;">Functional Order & Ministry</h3>
                        <p style="margin:0; color:#64748b; font-size:1rem; line-height:1.72;">Explore the ministerial role and scriptural mandate for each member of the household.</p>
                    </div>
                    <div style="background:rgba(15,23,42,0.94); color:#f8fafc; border-radius:24px; overflow:hidden; box-shadow:0 20px 50px -12px rgba(0,0,0,0.4);">
                        <div style="display:flex; flex-direction:column; border-bottom:1px solid rgba(255,255,255,0.1);" id="family-role-tabs">
                            <button class="family-role-tab active" data-family-role="husband" style="padding:16px 18px; text-align:left; background:linear-gradient(135deg, #4f46e5 0%, #a855f7 100%); color:#fff; border:none; border-bottom:1px solid rgba(255,255,255,0.08); font-weight:800; font-size:1rem; cursor:pointer;">The Husband-Leader</button>
                            <button class="family-role-tab" data-family-role="wife" style="padding:16px 18px; text-align:left; background:transparent; color:#94a3b8; border:none; border-bottom:1px solid rgba(255,255,255,0.08); font-weight:800; font-size:1rem; cursor:pointer;">The Wife-Partner</button>
                            <button class="family-role-tab" data-family-role="child" style="padding:16px 18px; text-align:left; background:transparent; color:#94a3b8; border:none; font-weight:800; font-size:1rem; cursor:pointer;">The Disciple-Child</button>
                        </div>
                        <div id="family-role-panes" style="padding:20px; min-height:380px;"></div>
                    </div>
                </section>

                <section id="family-ministry" style="max-width:1040px; margin:0 auto 28px;">
                    <div style="text-align:center; margin-bottom:16px;">
                        <h3 style="margin:0 0 8px; font-family:'Merriweather', serif; font-size:2rem; color:#0f172a;">The Family as Ministry</h3>
                        <p style="margin:0; color:#64748b; font-size:1rem; line-height:1.72;">The home is the smallest cell of the Kingdom of God.</p>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px;">
                        <div style="position:relative; border-radius:20px; padding:20px; color:#fff; background:rgba(15,23,42,0.94);">
                            <div style="position:absolute; inset:-1px; border-radius:21px; padding:1px; background:linear-gradient(135deg, rgba(99,102,241,0.7), rgba(168,85,247,0.7), rgba(45,212,191,0.7)); -webkit-mask:linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite:xor; mask-composite:exclude;"></div>
                            <div style="position:relative; font-size:1.9rem; margin-bottom:10px;">▢</div>
                            <div style="position:relative; font-size:1.08rem; font-weight:800; margin-bottom:8px;">Hospitality as Evangelism</div>
                            <div style="position:relative; font-size:0.88rem; line-height:1.7; color:#94a3b8;">The table is a pulpit. Opening the home to the broken and the seeking extends Christ’s welcome.</div>
                        </div>
                        <div style="position:relative; border-radius:20px; padding:20px; color:#fff; background:rgba(15,23,42,0.94);">
                            <div style="position:absolute; inset:-1px; border-radius:21px; padding:1px; background:linear-gradient(135deg, rgba(99,102,241,0.7), rgba(168,85,247,0.7), rgba(45,212,191,0.7)); -webkit-mask:linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite:xor; mask-composite:exclude;"></div>
                            <div style="position:relative; font-size:1.9rem; margin-bottom:10px;">✤</div>
                            <div style="position:relative; font-size:1.08rem; font-weight:800; margin-bottom:8px;">Generational Transfer</div>
                            <div style="position:relative; font-size:0.95rem; line-height:1.75; color:#94a3b8;">Ministry begins under your own roof by passing the baton of faith to the next generation.</div>
                        </div>
                        <div style="position:relative; border-radius:20px; padding:20px; color:#fff; background:rgba(15,23,42,0.94);">
                            <div style="position:absolute; inset:-1px; border-radius:21px; padding:1px; background:linear-gradient(135deg, rgba(99,102,241,0.7), rgba(168,85,247,0.7), rgba(45,212,191,0.7)); -webkit-mask:linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite:xor; mask-composite:exclude;"></div>
                            <div style="position:relative; font-size:1.9rem; margin-bottom:10px;">✦</div>
                            <div style="position:relative; font-size:1.08rem; font-weight:800; margin-bottom:8px;">The Salt of the Community</div>
                            <div style="position:relative; font-size:0.95rem; line-height:1.75; color:#94a3b8;">Stable, Christ-centered families model joy, order, and resilience in a chaotic culture.</div>
                        </div>
                    </div>
                </section>

                <section id="family-counseling" style="max-width:1040px; margin:0 auto; scroll-margin-top:16px;">
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 280px), 1fr)); gap:18px; align-items:start;">
                        <div>
                            <div style="position:sticky; top:12px;">
                                <h3 style="margin:0 0 12px; font-family:'Merriweather', serif; font-size:2rem; color:#0f172a;">Truth & Restoration</h3>
                                <p style="margin:0 0 16px; line-height:1.8; color:#475569;">For families in crisis, truth is the only stable foundation for healing. These counseling frames address hard realities with biblical clarity and grace.</p>
                                <div style="padding:16px; border-radius:18px; background:#eef2ff; border:1px solid #c7d2fe;">
                                    <div style="font-weight:800; color:#312e81; margin-bottom:6px;">Need Immediate Help?</div>
                                    <div style="font-size:1rem; line-height:1.75; color:#4338ca;">If you are in danger or facing abandonment, contact trusted church leadership or a certified biblical counselor immediately.</div>
                                </div>
                            </div>
                        </div>

                        <div style="display:grid; gap:10px;">
                            <div style="background:rgba(255,255,255,0.76); border:1px solid rgba(15,23,42,0.08); border-radius:18px; overflow:hidden; box-shadow:0 10px 30px -18px rgba(15,23,42,0.24);">
                                <button class="family-accordion-btn" type="button" style="width:100%; padding:18px; background:transparent; border:none; display:flex; justify-content:space-between; align-items:center; gap:10px; text-align:left; cursor:pointer;">
                                    <span style="font-weight:800; color:#0f172a;">Addressing the Devastation of Divorce</span>
                                    <span class="family-accordion-icon" style="font-size:1.3rem; color:#94a3b8;">+</span>
                                </button>
                                <div class="family-accordion-content">
                                    <div style="padding:0 18px 18px; font-size:0.9rem; line-height:1.8; color:#475569; display:grid; gap:10px;">
                                        <p style="margin:0;"><strong>God's Standard:</strong> Marriage is intended as a lifelong covenant. Divorce is always tied to sin, whether by one party or both.</p>
                                        <p style="margin:0;"><strong>Biblical Allowances:</strong> Scripture identifies unrepentant sexual immorality and abandonment by an unbelieving spouse as primary grounds, while reconciliation remains the first pursuit.</p>
                                        <p style="margin:0;"><strong>The Path of Grace:</strong> Christ offers forgiveness and identity restoration to those who have suffered through divorce.</p>
                                    </div>
                                </div>
                            </div>

                            <div style="background:rgba(255,255,255,0.76); border:1px solid rgba(15,23,42,0.08); border-radius:18px; overflow:hidden; box-shadow:0 10px 30px -18px rgba(15,23,42,0.24);">
                                <button class="family-accordion-btn" type="button" style="width:100%; padding:18px; background:transparent; border:none; display:flex; justify-content:space-between; align-items:center; gap:10px; text-align:left; cursor:pointer;">
                                    <span style="font-weight:800; color:#0f172a;">Conflict, Anger, and De-escalation</span>
                                    <span class="family-accordion-icon" style="font-size:1.3rem; color:#94a3b8;">+</span>
                                </button>
                                <div class="family-accordion-content">
                                    <div style="padding:0 18px 18px; font-size:0.9rem; line-height:1.8; color:#475569; display:grid; gap:10px;">
                                        <p style="margin:0;"><strong>Humility First:</strong> Most conflict grows from unmet desires. The biblical response starts with dealing honestly with your own heart.</p>
                                        <p style="margin:0;"><strong>Communication Rules:</strong> Speak words that build up. Avoid absolute language like “you always” and “you never.”</p>
                                        <p style="margin:0;"><strong>The Practice:</strong> Call a grace-time, step away to pray, then return aiming to understand rather than win.</p>
                                    </div>
                                </div>
                            </div>

                            <div style="background:rgba(255,255,255,0.76); border:1px solid rgba(15,23,42,0.08); border-radius:18px; overflow:hidden; box-shadow:0 10px 30px -18px rgba(15,23,42,0.24);">
                                <button class="family-accordion-btn" type="button" style="width:100%; padding:18px; background:transparent; border:none; display:flex; justify-content:space-between; align-items:center; gap:10px; text-align:left; cursor:pointer;">
                                    <span style="font-weight:800; color:#0f172a;">Financial Stewardship & Unity</span>
                                    <span class="family-accordion-icon" style="font-size:1.3rem; color:#94a3b8;">+</span>
                                </button>
                                <div class="family-accordion-content">
                                    <div style="padding:0 18px 18px; font-size:0.9rem; line-height:1.8; color:#475569; display:grid; gap:10px;">
                                        <p style="margin:0;"><strong>One Flesh, One Wallet:</strong> Financial secrecy poisons unity. Biblical stewardship requires open books and honesty.</p>
                                        <p style="margin:0;"><strong>Priorities:</strong> God owns it all; the family manages what He entrusts, prioritizing giving, saving, and then spending.</p>
                                    </div>
                                </div>
                            </div>

                            <div style="background:rgba(255,255,255,0.76); border:1px solid rgba(15,23,42,0.08); border-radius:18px; overflow:hidden; box-shadow:0 10px 30px -18px rgba(15,23,42,0.24);">
                                <button class="family-accordion-btn" type="button" style="width:100%; padding:18px; background:transparent; border:none; display:flex; justify-content:space-between; align-items:center; gap:10px; text-align:left; cursor:pointer;">
                                    <span style="font-weight:800; color:#0f172a;">Forgiveness and Rebuilding Trust</span>
                                    <span class="family-accordion-icon" style="font-size:1.3rem; color:#94a3b8;">+</span>
                                </button>
                                <div class="family-accordion-content">
                                    <div style="padding:0 18px 18px; font-size:0.9rem; line-height:1.8; color:#475569; display:grid; gap:10px;">
                                        <p style="margin:0;"><strong>The Distinction:</strong> Forgiveness is a decision. Trust is a process that rebuilds through visible repentance and faithfulness.</p>
                                        <p style="margin:0;"><strong>The Goal:</strong> Move from defensive living toward transparent intimacy through the Spirit’s work.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    `;
}

function familyGetRolePaneMarkup(roleId) {
    const panes = {
        husband: {
            accent: '#818cf8',
            cardBg: 'rgba(49,46,129,0.45)',
            cardBorder: 'rgba(129,140,248,0.22)',
            title: 'Cruciform Leadership',
            summary: 'The husband’s role is defined not by dominance, but by sacrificial depth. He becomes the primary minister of the home, carrying responsibility for the emotional and spiritual flourishing of his family.',
            points: [
                'Initiating spiritual rhythms through prayer and devotion',
                'Sacrificial provision and physical protection',
                'Active emotional attunement and patient understanding'
            ],
            keyTitle: 'The Scriptural Key: Ephesians 5:25',
            quote: 'Husbands, love your wives, just as Christ loved the church and gave himself up for her.',
            note: 'Leadership in the home is measured by a willingness to die to self for the sake of wife and children.'
        },
        wife: {
            accent: '#c084fc',
            cardBg: 'rgba(88,28,135,0.45)',
            cardBorder: 'rgba(192,132,252,0.22)',
            title: 'Empowered Partnership',
            summary: 'The wife is the ezer kenegdo, an indispensable helper. Her wisdom, nurture, and grace establish the internal culture of the home and strengthen its ministry.',
            points: [
                'Cultivating the internal culture of the home',
                'Intelligent, willing partnership under godly order',
                'Generational discipleship through wisdom and instruction'
            ],
            keyTitle: 'The Scriptural Key: Proverbs 31:26',
            quote: 'She speaks with wisdom, and faithful instruction is on her tongue.',
            note: 'Her contribution is pivotal in shaping the moral and spiritual temperature of the household.'
        },
        child: {
            accent: '#2dd4bf',
            cardBg: 'rgba(19,78,74,0.5)',
            cardBorder: 'rgba(45,212,191,0.24)',
            title: 'The Disciple\'s Training',
            summary: 'Children are not merely observers. They are arrows in the quiver, learning the beauty of obedience, honor, and stewardship as preparation for walking with God.',
            points: [
                'Joyful obedience to parental authority',
                'Learning the honor commandment with promise',
                'Stewardship, discipline, and responsibility'
            ],
            keyTitle: 'The Scriptural Key: Ephesians 6:1',
            quote: 'Children, obey your parents in the Lord, for this is right.',
            note: 'The home becomes the first school of theology and character training for the next generation.'
        }
    };
    const pane = panes[roleId] || panes.husband;
    return `
        <div class="family-fade-in" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 260px), 1fr)); gap:16px; align-items:start;">
            <div>
                <h4 style="margin:0 0 10px; font-family:'Merriweather', serif; font-size:1.8rem; color:${pane.accent};">${pane.title}</h4>
                <p style="margin:0 0 16px; color:#cbd5e1; line-height:1.85; font-size:1.05rem;">${pane.summary}</p>
                <div style="display:grid; gap:8px;">
                    ${pane.points.map(point => `<div style="display:flex; gap:10px; align-items:flex-start;"><span style="color:#2dd4bf; font-weight:900;">✔</span><span style="color:#e2e8f0; font-size:1rem; line-height:1.75;">${point}</span></div>`).join('')}
                </div>
            </div>
            <div style="background:${pane.cardBg}; padding:18px; border-radius:18px; border:1px solid ${pane.cardBorder};">
                <div style="font-weight:800; color:#fff; margin-bottom:10px;">${pane.keyTitle}</div>
                <p style="margin:0; color:${pane.accent}; font-style:italic; line-height:1.82; font-size:1.05rem;">${pane.quote}</p>
                <div style="margin:14px 0; border-top:1px solid ${pane.cardBorder};"></div>
                <div style="font-size:0.92rem; color:#94a3b8; line-height:1.82;">${pane.note}</div>
            </div>
        </div>
    `;
}

function familySetActiveRole(roleId) {
    familyAppState.activeRole = roleId;
    document.querySelectorAll('.family-role-tab').forEach(btn => {
        const active = btn.dataset.familyRole === roleId;
        btn.classList.toggle('active', active);
        btn.style.background = active ? 'linear-gradient(135deg, #4f46e5 0%, #a855f7 100%)' : 'transparent';
        btn.style.color = active ? '#fff' : '#94a3b8';
    });
    const paneHost = document.getElementById('family-role-panes');
    if (paneHost) paneHost.innerHTML = familyGetRolePaneMarkup(roleId);
}

function familyToggleAccordion(buttonEl) {
    const content = buttonEl.nextElementSibling;
    const icon = buttonEl.querySelector('.family-accordion-icon');
    const isOpen = content && content.classList.contains('expanded');

    document.querySelectorAll('.family-accordion-content').forEach(el => el.classList.remove('expanded'));
    document.querySelectorAll('.family-accordion-icon').forEach(el => el.textContent = '+');

    if (!isOpen && content) {
        content.classList.add('expanded');
        if (icon) icon.textContent = '−';
    }
}

function familyScrollToSection(sectionId) {
    const target = document.getElementById(`family-${sectionId}`);
    const modalBody = document.querySelector('#data-modal .modal-body');
    if (!target || !modalBody) return;

    const bodyRect = modalBody.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const nextTop = Math.max(0, modalBody.scrollTop + (targetRect.top - bodyRect.top) - 12);
    modalBody.scrollTo({ top: nextTop, behavior: 'smooth' });
}

async function familyInitRadarChart() {
    const canvas = document.getElementById('family-radar-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    if (familyAppState.radarChart) {
        familyAppState.radarChart.destroy();
        familyAppState.radarChart = null;
    }

    familyAppState.radarChart = new Chart(canvas.getContext('2d'), {
        type: 'radar',
        data: {
            labels: ['Self-Sacrifice', 'Grace/Forgiveness', 'Spiritual Vitality', 'Unity/Peace', 'Mission/Outreach', 'Resilience'],
            datasets: [{
                label: 'Worldly/Unintentional Model',
                data: [4, 3, 2, 5, 2, 4],
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderColor: 'rgba(148,163,184,0.55)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(148,163,184,1)'
            }, {
                label: 'Christ-Centered Framework',
                data: [9, 10, 10, 8, 9, 10],
                backgroundColor: 'rgba(99,102,241,0.2)',
                borderColor: 'rgba(129,140,248,1)',
                borderWidth: 3,
                pointBackgroundColor: 'rgba(129,140,248,1)',
                pointBorderColor: '#fff',
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: 'rgba(255,255,255,0.1)' },
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    pointLabels: {
                        color: '#94a3b8',
                        font: { size: 10, family: 'Inter' }
                    },
                    ticks: { display: false, stepSize: 2 }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#f8fafc',
                        padding: 18,
                        font: { size: 11 }
                    }
                }
            }
        }
    });
}

async function openFamilyApp() {
    document.getElementById('modal-back-text').innerText = 'CLEAR';
    document.getElementById('modal-back-btn').onclick = () => closeModal();
    document.getElementById('modal-title').innerHTML = `<span style="filter:none !important; text-shadow:none !important; margin-right:8px;">🏡</span>FAMILY`;
    document.getElementById('modal-subtitle').innerText = 'BIBLICAL BLUEPRINT + RESTORATIVE COUNSELING';

    renderFamilyAppShell();
    document.getElementById('data-modal').classList.add('active');
    bounceModalBodyToTop();

    familySetActiveRole(familyAppState.activeRole || 'husband');

    document.querySelectorAll('[data-family-role]').forEach(btn => {
        btn.addEventListener('click', () => familySetActiveRole(btn.dataset.familyRole));
    });
    document.querySelectorAll('.family-accordion-btn').forEach(btn => {
        btn.addEventListener('click', () => familyToggleAccordion(btn));
    });
    document.querySelectorAll('[data-family-jump]').forEach(btn => {
        btn.addEventListener('click', () => familyScrollToSection(btn.dataset.familyJump));
    });

    await familyInitRadarChart();
}
// --- SELF-STARTER BLOCK ---
// This ensures that even if Google Sites blocks the onclick attribute, 
// the app will still try to find the button and hook itself up.
function hookUpFamilyButton() {
    const familyBtn = document.querySelector('[onclick*="openFamilyApp"]');
    if (familyBtn) {
        familyBtn.onclick = (e) => {
            e.preventDefault();
            openFamilyApp();
        };
    }
}

// Run immediately and again in 2 seconds to be sure
hookUpFamilyButton();
setTimeout(hookUpFamilyButton, 2000);

// Global bridge
window.openFamilyApp = openFamilyApp;

if (typeof installAppAnchorSync === 'function') {
    installAppAnchorSync();
}