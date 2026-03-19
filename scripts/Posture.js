(function () {
    const postureAppState = {
        etymologyChart: null,
        componentsChart: null
    };

    function renderPostureAppShell() {
        const container = document.getElementById('modal-body-container');
        container.innerHTML = `
        <div id="posture-app" style="padding: 10px 10px var(--scroll-tail-pad) 10px; color:#e5e7eb; font-family: Inter, sans-serif;">

            <section style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.12); border-radius:18px; padding:22px; margin-bottom:20px; text-align:center;">
                <h2 style="margin:0 0 10px 0; font-family:Merriweather, serif; font-size:2rem; color:#fff;">The Anatomy of Worship</h2>
                <p style="margin:0; color:#cbd5e1; line-height:1.78; font-size:1.08rem;">An interactive exegetical analysis of worship in spirit and truth, tracing its linguistic roots, theological evolution, and biblical mandate.</p>
            </section>

            <section style="margin-bottom:20px;">
                <h3 style="margin:0 0 12px 0; font-family:Merriweather, serif; font-size:1.35rem; color:#fff;">1. Linguistic Foundations</h3>
                <div style="display:grid; grid-template-columns:1fr; gap:12px;">
                    <div id="posture-vocab-cards" style="display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:10px;"></div>
                    <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:14px; padding:20px;">
                        <h4 id="posture-vd-title" style="margin:0 0 12px 0; font-family:Merriweather, serif; font-size:1.5rem; color:#fff;"></h4>
                        <p id="posture-vd-desc" style="margin:0 0 16px 0; color:#cbd5e1; line-height:1.78; font-size:1.08rem;"></p>
                        <div style="background:rgba(0,0,0,0.25); border-left:4px solid #d946ef; border-radius:8px; padding:16px;">
                            <div style="font-size:0.8rem; font-weight:700; text-transform:uppercase; color:#e2e8f0; margin-bottom:6px;">Key Reference</div>
                            <p id="posture-vd-verse" style="margin:0 0 8px 0; font-family:Merriweather, serif; font-style:italic; color:#e5e7eb; font-size:1.05rem; line-height:1.72;"></p>
                            <a id="posture-vd-link" target="_blank" style="color:#d946ef; text-decoration:none; font-weight:600; font-size:0.95rem;"></a>
                        </div>
                    </div>
                </div>
            </section>

            <section style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:16px; padding:20px; margin-bottom:20px;">
                <h3 style="margin:0 0 16px 0; font-family:Merriweather, serif; color:#fff; text-align:center;">Frequency of Primary Worship Terminology</h3>
                <div style="height:320px;"><canvas id="posture-etymology-chart"></canvas></div>
                <p style="text-align:center; color:#94a3b8; font-size:0.85rem; font-style:italic; margin:16px 0 0 0;">Notice the shift in the Epistles from 'Proskuneo' (bowing) to 'Latreuo' (service/lifestyle) as the church matures.</p>
            </section>

            <section style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:16px; padding:20px; margin-bottom:20px;">
                <h3 style="margin:0 0 16px 0; font-family:Merriweather, serif; color:#fff;">2. The Components of Worship</h3>
                <div style="display:flex; flex-wrap:wrap; gap:24px; align-items:center;">
                    <div style="flex:1; min-width:260px; height:300px;"><canvas id="posture-components-chart"></canvas></div>
                    <div style="flex:1; min-width:260px; display:flex; flex-direction:column; gap:16px;">
                        <div style="border-left:4px solid #22d3ee; padding-left:16px; transition:border-color 0.2s;">
                            <h4 style="margin:0; color:#fff; font-size:1.1rem;">Submission & Obedience (Rom 12:1)</h4>
                            <p style="margin:4px 0 0 0; color:#94a3b8; font-size:0.95rem; line-height:1.5;">The foundational layer. Without a surrendered will, outward acts of praise are invalid.</p>
                        </div>
                        <div style="border-left:4px solid #22d3ee; padding-left:16px;">
                            <h4 style="margin:0; color:#fff; font-size:1.1rem;">Service & Action (Heb 13:16)</h4>
                            <p style="margin:4px 0 0 0; color:#94a3b8; font-size:0.95rem; line-height:1.5;"><em>Latreia</em>. Doing good, sharing, and ministering to others as a direct offering to God.</p>
                        </div>
                        <div style="border-left:4px solid #22d3ee; padding-left:16px;">
                            <h4 style="margin:0; color:#fff; font-size:1.1rem;">Adoration & Praise (Heb 13:15)</h4>
                            <p style="margin:4px 0 0 0; color:#94a3b8; font-size:0.95rem; line-height:1.5;">The "fruit of lips," including singing, declaring attributes, and magnifying God's nature.</p>
                        </div>
                        <div style="border-left:4px solid #22d3ee; padding-left:16px;">
                            <h4 style="margin:0; color:#fff; font-size:1.1rem;">Confession & Repentance (Ps 51)</h4>
                            <p style="margin:4px 0 0 0; color:#94a3b8; font-size:0.95rem; line-height:1.5;">The broken and contrite heart recognized as an acceptable sacrifice.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:16px; overflow:hidden;">
                <div style="padding:20px; border-bottom:1px solid rgba(255,255,255,0.1);">
                    <h3 style="margin:0; font-family:Merriweather, serif; color:#fff;">3. Exegetical Deep Dives</h3>
                </div>
                <div id="posture-tabs" style="display:flex; flex-wrap:wrap; border-bottom:1px solid rgba(255,255,255,0.1); background:rgba(0,0,0,0.2);">
                    <button class="posture-tab-btn" data-target="posture-panel-john" style="flex:1; min-width:140px; padding:16px; background:rgba(255,255,255,0.05); color:#22d3ee; border:none; border-bottom:2px solid #22d3ee; font-weight:800; cursor:pointer;">John 4:23-24</button>
                    <button class="posture-tab-btn" data-target="posture-panel-romans" style="flex:1; min-width:140px; padding:16px; background:transparent; color:#94a3b8; border:none; font-weight:700; cursor:pointer; transition:all 0.2s;">Romans 12:1-2</button>
                    <button class="posture-tab-btn" data-target="posture-panel-hebrews" style="flex:1; min-width:140px; padding:16px; background:transparent; color:#94a3b8; border:none; font-weight:700; cursor:pointer; transition:all 0.2s;">Hebrews 13:15-16</button>
                </div>
                <div style="padding:24px;">

                    <div id="posture-panel-john" class="posture-tab-panel" style="display:block;">
                        <h4 style="color:#67e8f9; font-family:Merriweather,serif; font-size:1.4rem; margin:0 0 12px 0;">Spirit and Truth</h4>
                        <blockquote style="border-left:4px solid #d946ef; padding:12px 16px; margin:0 0 20px 0; background:rgba(0,0,0,0.2); border-radius:0 8px 8px 0; font-style:italic; color:#cbd5e1; line-height:1.6; font-size:1.05rem;">
                            "But the hour is coming, and is now here, when the true worshipers will worship the Father in spirit and truth, for the Father is seeking such people to worship him. God is spirit, and those who worship him must worship in spirit and truth."
                        </blockquote>
                        <h5 style="color:#fff; margin:0 0 8px 0; font-size:1.1rem;">Context</h5>
                        <p style="color:#cbd5e1; margin:0 0 20px 0; line-height:1.6;">Jesus speaks to the Samaritan woman at the well, dismantling the geographic and ethnic constraints of worship (Mt. Gerizim vs. Jerusalem).</p>
                        <h5 style="color:#fff; margin:0 0 8px 0; font-size:1.1rem;">Exegetical Insights</h5>
                        <ul style="color:#cbd5e1; margin:0; padding-left:20px; line-height:1.6;">
                            <li style="margin-bottom:8px;"><strong style="color:#e2e8f0;">"In Spirit" (ἐν πνεύματι):</strong> Does not merely mean enthusiasm or emotion. It refers to the realm of the Holy Spirit. True worship requires regeneration-human spirit made alive by God's Spirit interacting with the Divine.</li>
                            <li style="margin-bottom:8px;"><strong style="color:#e2e8f0;">"In Truth" (ἐν ἀληθείᾳ):</strong> Worship must be according to the revelation of God in Jesus Christ (who is "the Truth"). It rejects subjective, self-invented religion and demands adherence to God's revealed character.</li>
                            <li><strong style="color:#e2e8f0;">The Shift:</strong> Worship moves from a localized, physical temple system (shadows) to a spiritual reality located within the believer through Christ.</li>
                        </ul>
                    </div>

                    <div id="posture-panel-romans" class="posture-tab-panel" style="display:none;">
                        <h4 style="color:#67e8f9; font-family:Merriweather,serif; font-size:1.4rem; margin:0 0 12px 0;">The Living Sacrifice</h4>
                        <blockquote style="border-left:4px solid #d946ef; padding:12px 16px; margin:0 0 20px 0; background:rgba(0,0,0,0.2); border-radius:0 8px 8px 0; font-style:italic; color:#cbd5e1; line-height:1.6; font-size:1.05rem;">
                            "I appeal to you therefore, brothers, by the mercies of God, to present your bodies as a living sacrifice, holy and acceptable to God, which is your spiritual worship."
                        </blockquote>
                        <h5 style="color:#fff; margin:0 0 8px 0; font-size:1.1rem;">Context</h5>
                        <p style="color:#cbd5e1; margin:0 0 20px 0; line-height:1.6;">After 11 chapters of dense theological exposition on the gospel and justification by faith ("the mercies of God"), Paul transitions to the practical application of this doctrine.</p>
                        <h5 style="color:#fff; margin:0 0 8px 0; font-size:1.1rem;">Exegetical Insights</h5>
                        <ul style="color:#cbd5e1; margin:0; padding-left:20px; line-height:1.6;">
                            <li style="margin-bottom:8px;"><strong style="color:#e2e8f0;">"Living Sacrifice" (θυσίαν ζῶσαν):</strong> An oxymoron in the ancient world where sacrifices were killed. It implies continuous, daily dying to self while actively living for Christ.</li>
                            <li><strong style="color:#e2e8f0;">"Spiritual Worship" (λογικὴν λατρείαν):</strong> <em>Logikos</em> means reasonable, logical, or belonging to the mind/reason. <em>Latreia</em> means priestly service. True worship is the rational, logical response of an entire life dedicated to God in light of His mercy.</li>
                        </ul>
                    </div>

                    <div id="posture-panel-hebrews" class="posture-tab-panel" style="display:none;">
                        <h4 style="color:#67e8f9; font-family:Merriweather,serif; font-size:1.4rem; margin:0 0 12px 0;">Sacrifices Pleasing to God</h4>
                        <blockquote style="border-left:4px solid #d946ef; padding:12px 16px; margin:0 0 20px 0; background:rgba(0,0,0,0.2); border-radius:0 8px 8px 0; font-style:italic; color:#cbd5e1; line-height:1.6; font-size:1.05rem;">
                            "Through him then let us continually offer up a sacrifice of praise to God, that is, the fruit of lips that acknowledge his name. Do not neglect to do good and to share what you have, for such sacrifices are pleasing to God."
                        </blockquote>
                        <h5 style="color:#fff; margin:0 0 8px 0; font-size:1.1rem;">Context</h5>
                        <p style="color:#cbd5e1; margin:0 0 20px 0; line-height:1.6;">The writer of Hebrews concludes a massive treatise on the superiority of Christ's high priesthood over the Levitical system.</p>
                        <h5 style="color:#fff; margin:0 0 8px 0; font-size:1.1rem;">Exegetical Insights</h5>
                        <ul style="color:#cbd5e1; margin:0; padding-left:20px; line-height:1.6;">
                            <li style="margin-bottom:8px;"><strong style="color:#e2e8f0;">"Through Him":</strong> All acceptable worship is mediated through Jesus Christ. We have no direct access apart from Him.</li>
                            <li style="margin-bottom:8px;"><strong style="color:#e2e8f0;">"Sacrifice of Praise":</strong> Redefines sacrifice from animal blood to verbal declaration. "Fruit of lips" acknowledges God's character and deeds.</li>
                            <li><strong style="color:#e2e8f0;">"Do good and share":</strong> Worship is immediately tied to ethics and community. Philanthropy and sharing are explicitly defined as "sacrifices" that please God, equating outward social action with vertical religious duty.</li>
                        </ul>
                    </div>

                </div>
            </section>
        </div>
    `;
    }

    function postureInitInteractions() {
        const vocabData = {
            shachah: {
                title: 'Shachah (שָׁחָה)',
                subtitle: 'Hebrew (Old Testament)',
                desc: 'The primary Hebrew word for worship. It fundamentally means to bow low or prostrate oneself before a superior as an act of profound reverence and submission. It denotes a physical posture that reflects an inward reality of yielding authority to God.',
                verse: '"Oh come, let us worship and bow down; let us kneel before the LORD, our Maker!"',
                link: 'https://www.bible.com/bible/59/PSA.95.6.ESV',
                refText: 'Psalm 95:6'
            },
            proskuneo: {
                title: 'Proskuneo (προσκυνέω)',
                subtitle: 'Greek (New Testament)',
                desc: 'The most frequent Greek word for worship in the New Testament. Derived from \'pros\' (towards) and \'kyneo\' (to kiss). It carries the imagery of kissing the hand of a monarch or falling on the knees in total homage. It is the immediate response to encountering the divine.',
                verse: '"And going into the house, they saw the child with Mary his mother, and they fell down and worshiped him."',
                link: 'https://www.bible.com/bible/59/MAT.2.11.ESV',
                refText: 'Matthew 2:11'
            },
            latreuo: {
                title: 'Latreuo (λατρεύω)',
                subtitle: 'Greek (New Testament)',
                desc: 'Translated often as \'service\' or \'worship\'. Originally referred to the work of a hired laborer, it evolved in biblical text to mean the official service of priests in the temple. In the New Covenant, it refers to the believer\'s entire life offered as spiritual service to God.',
                verse: '"For God is my witness, whom I serve with my spirit in the gospel of his Son..."',
                link: 'https://www.bible.com/bible/59/ROM.1.9.ESV',
                refText: 'Romans 1:9'
            }
        };

        const cardsWrap = document.getElementById('posture-vocab-cards');
        if (!cardsWrap) return;

        cardsWrap.innerHTML = Object.entries(vocabData).map(([key, item], idx) => `
        <button class="posture-vocab-card" data-word="${key}" style="text-align:left; padding:16px; border-radius:12px; border:1px solid ${idx === 0 ? 'rgba(34,211,238,0.6)' : 'rgba(255,255,255,0.14)'}; background:${idx === 0 ? 'rgba(34,211,238,0.08)' : 'rgba(255,255,255,0.05)'}; color:#e2e8f0; cursor:pointer; transition:all 0.2s;">
            <div style="font-size:0.75rem; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:${idx === 0 ? '#22d3ee' : '#94a3b8'}; margin-bottom:6px;">${item.subtitle}</div>
            <div style="font-family:Merriweather, serif; font-size:1.3rem; font-weight:700; color:#fff;">${item.title}</div>
        </button>
    `).join('');

        const setWord = (key) => {
            const data = vocabData[key];
            if (!data) return;
            document.getElementById('posture-vd-title').textContent = data.title;
            document.getElementById('posture-vd-desc').textContent = data.desc;
            document.getElementById('posture-vd-verse').textContent = data.verse;
            const link = document.getElementById('posture-vd-link');
            link.href = data.link;
            link.innerHTML = `📖 Read ${data.refText} (ESV) &rarr;`;

            document.querySelectorAll('.posture-vocab-card').forEach((btn) => {
                const active = btn.getAttribute('data-word') === key;
                btn.style.borderColor = active ? 'rgba(34,211,238,0.6)' : 'rgba(255,255,255,0.14)';
                btn.style.background = active ? 'rgba(34,211,238,0.08)' : 'rgba(255,255,255,0.05)';
                btn.querySelector('div:first-child').style.color = active ? '#22d3ee' : '#94a3b8';
            });
        };

        document.querySelectorAll('.posture-vocab-card').forEach((btn) => {
            btn.addEventListener('click', () => setWord(btn.getAttribute('data-word')));
        });
        setWord('shachah');

        document.querySelectorAll('.posture-tab-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                const target = btn.getAttribute('data-target');
                document.querySelectorAll('.posture-tab-btn').forEach((other) => {
                    const isActive = other === btn;
                    other.style.color = isActive ? '#22d3ee' : '#94a3b8';
                    other.style.borderBottom = isActive ? '2px solid #22d3ee' : 'none';
                    other.style.background = isActive ? 'rgba(255,255,255,0.05)' : 'transparent';
                });
                document.querySelectorAll('.posture-tab-panel').forEach((panel) => {
                    panel.style.display = panel.id === target ? 'block' : 'none';
                });
            });
        });
    }

    function postureInitCharts() {
        if (postureAppState.etymologyChart) {
            postureAppState.etymologyChart.destroy();
            postureAppState.etymologyChart = null;
        }
        if (postureAppState.componentsChart) {
            postureAppState.componentsChart.destroy();
            postureAppState.componentsChart = null;
        }

        const ety = document.getElementById('posture-etymology-chart');
        const comp = document.getElementById('posture-components-chart');
        if (!ety || !comp) return;

        postureAppState.etymologyChart = new Chart(ety.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Pentateuch', 'Historical', 'Poetry', 'Prophets', 'Gospels/Acts', 'Epistles', 'Revelation'],
                datasets: [
                    { label: 'Shachah (Bow down)', data: [42, 58, 45, 30, 0, 0, 0], backgroundColor: '#d946ef', borderRadius: 4 },
                    { label: 'Proskuneo (Homage)', data: [0, 0, 0, 0, 36, 12, 24], backgroundColor: '#22d3ee', borderRadius: 4 },
                    { label: 'Latreuo (Service/Life)', data: [0, 0, 0, 0, 8, 28, 4], backgroundColor: '#a855f7', borderRadius: 4 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#e2e8f0' } } },
                scales: {
                    x: { stacked: true, ticks: { color: '#94a3b8' }, grid: { display: false } },
                    y: { stacked: true, beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.07)' } }
                }
            }
        });

        postureAppState.componentsChart = new Chart(comp.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Submission & Obedience', 'Service to Others', 'Adoration (Music/Praise)', 'Confession', 'Thanksgiving'],
                datasets: [{
                    data: [35, 25, 20, 10, 10],
                    backgroundColor: ['#8b5cf6', '#22d3ee', '#d946ef', '#3b82f6', '#f43f5e'],
                    borderWidth: 2,
                    borderColor: '#0f172a'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: { legend: { position: 'right', labels: { color: '#e2e8f0' } } }
            }
        });
    }

    function openPostureApp() {
        document.getElementById('modal-back-text').innerText = 'CLEAR';
        document.getElementById('modal-back-btn').onclick = () => closeModal();
        document.getElementById('modal-title').innerHTML = '<span style="filter:none !important; text-shadow:none !important; margin-right:8px;">🙇</span>WORSHIP';
        document.getElementById('modal-subtitle').innerText = 'GOSPEL TOUCH INTERACTIVE';

        renderPostureAppShell();
        document.getElementById('data-modal').classList.add('active');
        bounceModalBodyToTop();
        postureInitInteractions();

        if (window.Chart) {
            postureInitCharts();
        } else if (typeof ensureQuizChartLibrary === 'function') {
            ensureQuizChartLibrary().then(postureInitCharts);
        }
    }

    window.openPostureApp = openPostureApp;

    if (typeof installAppAnchorSync === 'function') {
        installAppAnchorSync('posture', openPostureApp);
    }
})();