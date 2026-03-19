// ==========================================
// APP: PSALMS
// ==========================================

const psalmsAppState = {
    chart: null
};

const psalmsAppThemesData = [
    {
        id: 'lament',
        icon: '💧',
        title: 'Lament & Supplication',
        subtitle: 'Crying out in distress',
        description: 'Laments constitute the largest single category in the Psalter (comprising roughly a third of the book). They are prayers of profound distress, disorientation, and sorrow. Exegetically, laments almost always follow a specific structure: an Invocation of God, a Plea for help, a Complaint detailing the crisis (enemies, sickness, or God\'s apparent absence), a Confession of Trust, and a concluding Vow of Praise. They legitimize bringing raw, unfiltered emotion to God.',
        theology: 'Laments teach us that pain does not equal the absence of faith. Rather, bringing pain to God is an act of profound faith. Remarkably, almost every lament ends in praise (with Psalm 88 being the notable, agonizing exception), showing that prayer shifts our perspective from our circumstances to God\'s character.',
        psalms: [13, 22, 42, 43, 88, 130]
    },
    {
        id: 'praise',
        icon: '🎵',
        title: 'Praise & Thanksgiving',
        subtitle: 'Celebrating God\'s character and acts',
        description: 'Praise Psalms are generally divided into two sub-categories: Descriptive Praise (hymns celebrating who God is, His attributes, and His creation) and Declarative Praise (thanksgiving for what God has specifically done, often answering a lament). These Psalms are characterized by an enthusiastic call to worship, an elaboration of the reasons for praise, and a renewed summons to bless the Lord.',
        theology: 'These Psalms re-orient the believer to reality. By recounting God\'s mighty deeds (often referencing the Exodus) and His steadfast love (Hesed), thanksgiving Psalms act as theological anchors. They culminate at the end of the Psalter (Psalms 146-150), indicating that the ultimate telos of the human soul and all creation is doxology.',
        psalms: [8, 19, 100, 103, 136, 150]
    },
    {
        id: 'wisdom',
        icon: '🌿',
        title: 'Wisdom & Torah',
        subtitle: 'The path of the righteous',
        description: 'Wisdom Psalms reflect the themes found in Proverbs, Job, and Ecclesiastes. They often feature contrastive language (the way of the righteous vs. the way of the wicked), the "fear of the Lord," and practical instruction for daily living. A specific subset, the Torah Psalms, exquisitely extol the beauty, perfection, and life-giving nature of God\'s Law.',
        theology: 'Positioned strategically (Psalm 1 serves as the gateway to the entire Psalter), these Psalms assert that true blessedness (Ashrei) comes only from meditating on God\'s revelation. They combat the human tendency toward autonomy by demonstrating that the Creator\'s design is the only framework for human flourishing.',
        psalms: [1, 19, 37, 73, 119]
    },
    {
        id: 'royal',
        icon: '👑',
        title: 'Royal & Messianic',
        subtitle: 'The anointed King',
        description: 'Royal Psalms originally celebrated the Davidic kings of Israel during events like coronations, royal weddings, or battles. Exegetically, they focus heavily on the Davidic Covenant (2 Samuel 7). As the human kings repeatedly failed, these Psalms increasingly took on an eschatological, Messianic expectation-looking forward to the ultimate anointed one (Mashiach) who would perfectly rule with justice and righteousness.',
        theology: 'For the Christian reader, these are intensely Christological. The New Testament writers frequently quote Royal Psalms to prove Jesus\'s identity, resurrection, and ascension. They remind the believer of the sovereign reign of Christ over the nations, providing deep comfort during times of geopolitical or personal turmoil.',
        psalms: [2, 22, 45, 72, 110]
    },
    {
        id: 'imprecatory',
        icon: '⚒',
        title: 'Imprecatory',
        subtitle: 'Calls for divine justice',
        description: 'Often the most jarring for modern readers, imprecatory Psalms contain curses or appeals for God to pour out His wrath on the psalmist\'s enemies. Exegetically, it is crucial to understand that these are not expressions of personal, petty vindictiveness. Rather, they are appeals to the Supreme Judge of the universe to uphold His covenant, vindicate righteousness, and definitively punish systemic, unrepentant evil.',
        theology: 'These Psalms prevent us from trivializing evil. By handing vengeance over to God rather than taking it into their own hands, the psalmists practice a radical trust in divine justice. For the Christian, these prayers are fulfilled ultimately at the cross (where God\'s wrath against evil was poured out on Christ) and at the final judgment.',
        psalms: [35, 69, 109, 137]
    },
    {
        id: 'ascent',
        icon: '🏔',
        title: 'Songs of Ascent',
        subtitle: 'Pilgrimage to Zion',
        description: 'Psalms 120-134 form a distinct collection known as the Songs of Ascent. These were likely sung by Jewish pilgrims traveling upward to Jerusalem for the three great annual agricultural and redemptive festivals (Passover, Weeks, Booths). They are generally shorter, deeply communal, and highly poetic.',
        theology: 'These Psalms provide a theology of pilgrimage. They begin in distress far from God\'s presence (Ps. 120) and move step-by-step toward the joy of corporate worship in the sanctuary (Ps. 134). They serve as a metaphor for the Christian life: we are travelers moving through a broken world toward the New Jerusalem, sustained by God\'s protective grace.',
        psalms: [120, 121, 125, 127, 130, 133]
    }
];

const psalmsAppAccordionData = [
    {
        title: '1. Select and Read (Lectio)',
        content: 'Do not rush. Choose a Psalm based on your current emotional state or simply read sequentially. Read it aloud, slowly. Notice the transitions, the imagery, and the core emotion. Identify the genre: Are you reading a lament, a hymn of praise, or a wisdom poem? Understanding the genre sets the rules of engagement for how to pray it.'
    },
    {
        title: '2. Meditate (Meditatio)',
        content: 'Pause on a specific verse that strikes a chord. What is the psalmist communicating about God? What is being communicated about the human condition? Ask the Holy Spirit to illuminate the text. Picture the metaphors used (e.g., God as a rock, a shepherd, a fortress). Let the theology of the text sink from your mind into your affections.'
    },
    {
        title: '3. Pray and Echo (Oratio)',
        content: 'Use the very words of the Psalm as a template for your own prayer. If the psalmist says, "How long, O Lord?", bring your own situations of waiting and frustration to God. If the psalmist praises God for His steadfast love, list out the specific ways you have experienced that love recently. You are effectively "filling in the blanks" of the Psalm with the details of your own life.'
    },
    {
        title: '4. Christological Contemplation (Contemplatio)',
        content: 'Read the Psalm through the lens of Jesus Christ. How did Jesus perfectly embody this Psalm? For laments, remember that Jesus cried out Psalm 22 on the cross. For wisdom Psalms, see Jesus as the perfect fulfiller of the Law. Resting in the reality that Christ has prayed these Psalms on our behalf gives us the grace to rest in God\'s finished work.'
    }
];

function psalmsAppEnsureStyles() {
    if (document.getElementById('psalms-app-style')) return;
    const style = document.createElement('style');
    style.id = 'psalms-app-style';
    style.textContent = `
        .psalms-theme-btn.active {
            background-color: rgba(6, 182, 212, 0.15);
            border-left-color: #22d3ee;
            color: #ffffff;
        }
        .psalms-bible-link {
            display: inline-flex;
            align-items: center;
            padding: 0.25rem 0.75rem;
            background-color: rgba(6, 182, 212, 0.1);
            color: #22d3ee;
            border-radius: 9999px;
            text-decoration: none;
            font-family: 'Inter', sans-serif;
            font-size: 0.875rem;
            font-weight: 600;
            border: 1px solid rgba(6, 182, 212, 0.3);
            transition: all 0.2s;
        }
        .psalms-bible-link:hover {
            background-color: rgba(6, 182, 212, 0.25);
            color: #ffffff;
            transform: translateY(-1px);
            box-shadow: 0 0 12px rgba(6, 182, 212, 0.5);
            border-color: #06b6d4;
        }
        .psalms-accordion-content {
            display: none;
        }
        .psalms-accordion-content.expanded {
            display: block;
        }
    `;
    document.head.appendChild(style);
}

function psalmsAppGenerateBibleLink(psalmNum) {
    return `<a href="https://www.bible.com/bible/59/PSA.${psalmNum}.ESV" target="_blank" rel="noopener noreferrer" class="psalms-bible-link">Psalm ${psalmNum} ↗</a>`;
}

function psalmsAppRenderMenu() {
    const menuContainer = document.getElementById('psalms-theme-menu');
    if (!menuContainer) return;

    menuContainer.innerHTML = '';
    psalmsAppThemesData.forEach(theme => {
        const btn = document.createElement('button');
        btn.className = 'psalms-theme-btn w-full text-left px-6 py-4 border-b border-white/10 hover:bg-white/5 transition-colors font-sans flex items-center group focus:outline-none';
        btn.style.borderLeft = '4px solid transparent';
        btn.innerHTML = `
            <span class="text-2xl mr-4 opacity-70 group-hover:opacity-100 transition-all">${theme.icon}</span>
            <div>
                <div class="font-bold text-gray-200 group-hover:text-white transition-colors">${theme.title}</div>
                <div class="text-xs text-cyan-500/80 uppercase tracking-wide mt-1">${theme.subtitle}</div>
            </div>
        `;
        btn.onclick = () => psalmsAppSelectTheme(theme.id, btn);
        menuContainer.appendChild(btn);
    });
}

function psalmsAppSelectTheme(id, btnElement) {
    document.querySelectorAll('.psalms-theme-btn').forEach(btn => btn.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');

    const theme = psalmsAppThemesData.find(item => item.id === id);
    const contentContainer = document.getElementById('psalms-theme-content');
    if (!theme || !contentContainer) return;

    const linksHtml = theme.psalms.map(psalm => psalmsAppGenerateBibleLink(psalm)).join('');

    contentContainer.innerHTML = `
        <div class="fade-in">
            <div class="flex items-center mb-6">
                <span class="text-4xl mr-4">${theme.icon}</span>
                <h3 class="text-3xl font-bold text-white">${theme.title}</h3>
            </div>
            <div class="space-y-6 text-gray-300 leading-relaxed">
                <div>
                    <h4 class="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2 font-sans border-b border-white/10 pb-1">Exegetical Profile</h4>
                    <p>${theme.description}</p>
                </div>
                <div>
                    <h4 class="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2 font-sans border-b border-white/10 pb-1">Theological Application</h4>
                    <p>${theme.theology}</p>
                </div>
                <div class="bg-black/30 border border-white/10 p-4 rounded-xl mt-8">
                    <h4 class="text-sm font-bold text-gray-200 mb-3 font-sans">Key Examples (Open in Bible.com ESV)</h4>
                    <div class="flex flex-wrap gap-2">${linksHtml}</div>
                </div>
            </div>
        </div>
    `;
}

function psalmsAppRenderAccordion() {
    const container = document.getElementById('psalms-accordion-container');
    if (!container) return;

    container.innerHTML = '';
    psalmsAppAccordionData.forEach((item, index) => {
        const id = `psalms-acc-${index}`;
        const wrapper = document.createElement('div');
        wrapper.className = 'border border-white/10 rounded-xl overflow-hidden shadow-lg';
        wrapper.innerHTML = `
            <button class="w-full text-left px-6 py-4 bg-white/5 hover:bg-white/10 font-bold text-lg flex justify-between items-center focus:outline-none transition-colors" onclick="psalmsAppToggleAccordion('${id}')">
                <span class="text-gray-100">${item.title}</span>
                <span id="icon-${id}" class="text-cyan-400 text-2xl">+</span>
            </button>
            <div id="${id}" class="psalms-accordion-content bg-black/20 px-6 py-4 text-gray-300">
                <p>${item.content}</p>
            </div>
        `;
        container.appendChild(wrapper);
    });
}

window.psalmsAppToggleAccordion = function(id) {
    const content = document.getElementById(id);
    const icon = document.getElementById(`icon-${id}`);
    if (!content || !icon) return;

    const isExpanded = content.classList.contains('expanded');

    document.querySelectorAll('.psalms-accordion-content').forEach(el => el.classList.remove('expanded'));
    document.querySelectorAll('[id^="icon-psalms-acc-"]').forEach(el => {
        el.innerHTML = '+';
    });

    if (!isExpanded) {
        content.classList.add('expanded');
        icon.innerHTML = '−';
    }
};

function psalmsAppDestroyChart() {
    if (psalmsAppState.chart) {
        psalmsAppState.chart.destroy();
        psalmsAppState.chart = null;
    }
}

async function psalmsAppInitChart() {
    const canvas = document.getElementById('psalter-chart');
    if (!canvas) return;

    try {
        await ensureQuizChartLibrary(); // Utilizes your existing chart loader
    } catch {
        return;
    }

    psalmsAppDestroyChart();

    const context = canvas.getContext('2d');
    psalmsAppState.chart = new Chart(context, {
        type: 'bar',
        data: {
            labels: ['Book 1 (1-41)', 'Book 2 (42-72)', 'Book 3 (73-89)', 'Book 4 (90-106)', 'Book 5 (107-150)'],
            datasets: [
                {
                    label: 'Lament/Supplication',
                    data: [25, 15, 10, 4, 5],
                    backgroundColor: '#06b6d4',
                    borderRadius: 4
                },
                {
                    label: 'Praise/Thanksgiving',
                    data: [10, 10, 4, 10, 30],
                    backgroundColor: '#ec4899',
                    borderRadius: 4
                },
                {
                    label: 'Wisdom/Royal/Other',
                    data: [6, 6, 3, 3, 9],
                    backgroundColor: '#fbbf24',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { usePointStyle: true, padding: 20 }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#f8fafc',
                    bodyColor: '#e2e8f0',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    titleFont: { size: 14 },
                    bodyFont: { size: 13 },
                    padding: 12,
                    callbacks: {
                        label(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) label += `${context.parsed.y} Psalms`;
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: { display: false },
                    ticks: { color: '#94a3b8' }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Psalms (Approximate)',
                        font: { weight: 'bold' },
                        color: '#94a3b8'
                    },
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#94a3b8' }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

function renderPsalmsAppShell() {
    const container = document.getElementById('modal-body-container');
    if (!container) return;

    container.innerHTML = `
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6" style="color:#e2e8f0; padding-bottom:var(--scroll-tail-pad);">
            <section class="mb-10">
                <div class="text-center max-w-3xl mx-auto">
                    <h1 class="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-pink-500 mb-6 tracking-tight">The Anatomy of the Soul</h1>
                    <p class="text-xl text-cyan-300 mb-8 italic">An Exegetical and Thematic Approach to the Psalms</p>
                    <div class="text-left text-lg space-y-4 text-gray-300">
                        <p>The book of Psalms, or the Psalter, serves as the theological hymnal and prayer book of ancient Israel and the Christian church. John Calvin famously referred to it as "An Anatomy of all the Parts of the Soul," noting that there is no human emotion that is not represented within its 150 chapters as a mirror.</p>
                        <p>Studying the Psalms chronologically or sequentially often misses the profound structural and genre-based frameworks intended by the final compilers. A <strong class="text-cyan-400">thematic approach</strong> allows us to categorize the Psalms by their literary genre (Gattung), as pioneered by scholars like Hermann Gunkel and Claus Westermann.</p>
                    </div>
                </div>
            </section>

            <section class="mb-10 bg-slate-900/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
                <div class="p-6 md:p-10 border-b border-white/10 bg-white/5">
                    <h2 class="text-3xl font-bold text-white mb-2">Thematic Exegesis Explorer</h2>
                    <p class="text-gray-300 text-base font-sans">Select a thematic genre from the list below to explore its exegetical background, theological significance, and direct links to key Psalms in the ESV translation.</p>
                </div>
                <div class="flex flex-col md:flex-row">
                    <div class="md:w-1/3 border-r border-white/10 bg-black/20" id="psalms-theme-menu"></div>
                    <div class="md:w-2/3 p-6 md:p-10" id="psalms-theme-content">
                        <div class="flex flex-col items-center justify-center h-full text-gray-500 py-8">
                            <span class="text-4xl mb-4 text-cyan-500/50">⇦</span>
                            <p class="font-sans font-medium">Select a theme to begin exploration</p>
                        </div>
                    </div>
                </div>
            </section>

            <section class="mb-10">
                <div class="max-w-4xl mx-auto">
                    <h2 class="text-3xl font-bold text-white mb-4 text-center">The Macro-Structure: From Mourning to Dancing</h2>
                    <p class="text-lg text-gray-300 mb-10 text-center">The Psalter's final compilation moves progressively from predominantly individual laments in the early books to overwhelming corporate praise in the final book.</p>
                    <div class="bg-slate-900/40 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-white/10">
                        <div style="position:relative; width:100%; max-width:900px; margin:0 auto; height:45vh; max-height:500px; min-height:260px;">
                            <canvas id="psalter-chart"></canvas>
                        </div>
                        <p class="text-sm text-center text-gray-400 mt-6 font-sans">Estimated distribution of major genres across the Five Books of the Psalter.</p>
                    </div>
                </div>
            </section>

            <section class="bg-slate-900/50 backdrop-blur-xl text-white rounded-3xl p-8 md:p-12 shadow-2xl border border-white/10">
                <div class="max-w-3xl mx-auto">
                    <div class="text-center mb-10">
                        <span class="text-4xl mb-4 block">🙏</span>
                        <h2 class="text-3xl md:text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-cyan-500">A Methodology for Praying the Psalms</h2>
                        <p class="text-gray-300 text-lg">The Psalms were not merely written to be read; they were composed to be prayed and sung.</p>
                    </div>
                    <div class="space-y-4 font-sans" id="psalms-accordion-container"></div>
                </div>
            </section>

            <footer class="bg-black/30 backdrop-blur-md border border-white/10 mt-10 py-6 rounded-2xl">
                <div class="max-w-6xl mx-auto px-4 text-center text-gray-400 text-sm font-sans">
                    <p>Exegetical Research Interactive Application</p>
                    <p class="mt-2 text-gray-500">Scripture quotations are from the ESV® Bible.</p>
                </div>
            </footer>
        </div>
    `;
}

async function openPsalmsApp() {
    document.getElementById('modal-back-text').innerText = 'CLEAR';
    document.getElementById('modal-back-btn').onclick = () => closeModal();
    document.getElementById('modal-title').innerHTML = `<span style="filter:none !important; text-shadow:none !important; margin-right:8px;">🎼</span>PSALMS`;
    document.getElementById('modal-subtitle').innerText = 'THEMATIC EXPLORATION OF THE PSALTER';

    psalmsAppEnsureStyles();
    renderPsalmsAppShell();
    psalmsAppRenderMenu();
    psalmsAppRenderAccordion();

    const firstBtn = document.querySelector('.psalms-theme-btn');
    if (firstBtn) psalmsAppSelectTheme('lament', firstBtn);

    await psalmsAppInitChart();

    document.getElementById('data-modal').classList.add('active');
    bounceModalBodyToTop();
}

window.openPsalmsApp = openPsalmsApp;

if (typeof installAppAnchorSync === 'function') {
    installAppAnchorSync();
}