// ==========================================
// APP: INVITATION (formerly Outreach)
// ==========================================

const outreachContent = {
	pageTitle: 'A Hope-Filled View of Jesus Christ | Indio Residents',
	headerTitle: 'A Hope-Filled View <br><span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 italic font-light">of Jesus Christ</span>',
	headerDesc: 'To our Indio Residents, we know the real challenges our community faces. Statistics might tell one story about our neighborhoods, but God\'s Word tells another. This exploration distills the profound hope of Jesus into three pillars: His invitations, His identity, and His finished work.',
	bannerTitle: 'To Our Indio Residents',
	bannerDesc: 'We are reaching out with purpose. We believe that no neighborhood is forgotten by God, and no life is beyond His reach. Whether you are dealing with fear, exhaustion, or simply looking for peace in a chaotic world, there is a very real, unshakeable hope available to you today.',
	bannerTag: 'You are seen. You are loved. You are welcome here.',
	btnExplore: 'Begin Exploration',
	sec1Title: '1. The Great Invitations',
	sec1Desc: 'Jesus issued personal calls characterized by grace rather than performance. Click each card to uncover the profound hope offered to the exhausted, the thirsty, and those seeking intimacy.',
	sec2Title: '2. The "I AM" Declarations',
	sec2Desc: 'In the Gospel of John, Jesus uses seven metaphors to declare how He perfectly meets the deepest needs of the human soul. Select a declaration from the sidebar to explore His identity.',
	sec3Title: '3. The Finished Work',
	sec3Desc: 'Hope is not just found in what Jesus said, but in what He accomplished. Select an event from the timeline to understand the historical progression of His redemptive mission.',
	mapTitle: 'Find Us Near You',
	mapDesc: 'We would love to welcome you this Sunday at Trinity Baptist Church in Indio.',
	mapChurch: 'Trinity Baptist Church',
	mapAddress: '44550 Monroe Street, Indio, CA 92201',
	mapTime: 'Sundays at 10:30 AM',
	btnDirections: 'Get Directions',
	footerTitle: 'An Anchor for the Soul for Indio Residents',
	footerQuote: '"We have this as a sure and steadfast anchor of the soul, a hope that enters into the inner place behind the curtain, where Jesus has gone as a forerunner on our behalf." - Hebrews 6:19-20',
	labels: { theHope: 'The Hope', theDecl: 'The Declaration', needMet: 'The Need Met', theRef: 'The Reference', theMission: 'The Mission', iAm: 'I AM the' },
	invitations: [
		{ id: 1, title: 'The Call to the Exhausted', quote: 'Come to me, all who labor and are heavy laden, and I will give you rest.', reference: 'Matthew 11:28', icon: '🕊️', insight: 'Jesus does not demand more religious striving. He identifies the exhaustion of trying to earn worth and offers Himself as the antidote.' },
		{ id: 2, title: 'The Call to the Thirsty', quote: 'If anyone thirsts, let him come to me and drink.', reference: 'John 7:37-38', icon: '💧', insight: 'Addressed to human dissatisfaction. Jesus promises a qualitative kind of life that provides an internal, eternal satisfaction.' },
		{ id: 3, title: 'The Call to Intimacy', quote: 'Behold, I stand at the door and knock.', reference: 'Revelation 3:20', icon: '🚪', insight: 'A picture of divine pursuit. God does not force His way in; He knocks and offers friendship and reconciliation.' }
	],
	iamData: [
		{ label: 'Bread of Life', need: 'Spiritual Hunger', verse: 'John 6:35', description: 'Just as physical bread sustains the body, Jesus is the essential nutrient for the soul. Without Him, the spirit starves; with Him, there is enduring life.', color: '#f472b6', icon: '🍞' },
		{ label: 'Light of the World', need: 'Guidance in Darkness', verse: 'John 8:12', description: 'In a world of confusion, Jesus provides absolute clarity. Following Him guarantees you will walk in the light of life.', color: '#facce1', icon: '🕯️' },
		{ label: 'Door of the Sheep', need: 'Security & Access', verse: 'John 10:9', description: 'Jesus is the singular entry point to safety. Through Him, one finds protection from spiritual predators and the freedom of abundant life.', color: '#2dd4bf', icon: '🚪' },
		{ label: 'Good Shepherd', need: 'Care & Protection', verse: 'John 10:11', description: 'Unlike a hired hand, the Good Shepherd loves so profoundly that He willingly lays down His life for the vulnerable.', color: '#38bdf8', icon: '🐑' },
		{ label: 'Resurrection & Life', need: 'Victory over Death', verse: 'John 11:25', description: 'Faced with the terror of death, Jesus claims total authority. He is the resurrection; in Him, death is merely a doorway.', color: '#c084fc', icon: '🌱' },
		{ label: 'Way, Truth, Life', need: 'Direction & Reality', verse: 'John 14:6', description: 'The embodiment of ultimate reality and the source of all existence. All human searching ends in Him.', color: '#60a5fa', icon: '🧭' },
		{ label: 'True Vine', need: 'Purpose & Fruitfulness', verse: 'John 15:1', description: 'By abiding in and remaining attached to Jesus, believers draw on His endless grace, mercy, and strength to produce true biblical fruit.', color: '#34d399', icon: '🍇' }
	],
	workData: [
		{ id: 'incarnation', title: 'The Incarnation', subtitle: 'God With Us', summary: 'The Creator took on human flesh, experiencing our pains and limitations without sin.', hope: 'God knows exactly what it feels like to be human. You are deeply understood.' },
		{ id: 'crucifixion', title: 'The Crucifixion', subtitle: 'The Atonement', summary: 'On the cross, Jesus absorbed the debt of sin and guilt, declaring "It is finished."', hope: 'Your failures are paid for. There is no condemnation left for those who trust Him.' },
		{ id: 'resurrection', title: 'The Resurrection', subtitle: 'Victory Over Death', summary: 'Three days later, Jesus rose, defeating the finality of death and inaugurating a new creation.', hope: 'Death is not the end. The worst things are never the last things.' },
		{ id: 'ascension', title: 'Ascension', subtitle: 'The Eternal Advocate', summary: 'Jesus ascended to the Father, where He currently reigns and intercedes for His people.', hope: 'You have a perfect representative in the highest court of reality.' }
	]
};

function outreachScrollToSection(sectionId) {
	const target = document.getElementById(sectionId);
	if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function outreachApplyContent() {
	const t = outreachContent;

	const writeText = (id, value) => {
		const el = document.getElementById(id);
		if (el) el.textContent = value;
	};
	const writeHtml = (id, value) => {
		const el = document.getElementById(id);
		if (el) el.innerHTML = value;
	};

	writeText('outreach-page-title', t.pageTitle);
	writeHtml('outreach-header-title', t.headerTitle);
	writeText('outreach-header-desc', t.headerDesc);
	writeText('outreach-banner-title', t.bannerTitle);
	writeText('outreach-banner-desc', t.bannerDesc);
	writeText('outreach-banner-tag', t.bannerTag);
	writeText('outreach-btn-explore', t.btnExplore);
	writeText('outreach-sec1-title', t.sec1Title);
	writeText('outreach-sec1-desc', t.sec1Desc);
	writeText('outreach-sec2-title', t.sec2Title);
	writeText('outreach-sec2-desc', t.sec2Desc);
	writeText('outreach-sec3-title', t.sec3Title);
	writeText('outreach-sec3-desc', t.sec3Desc);
	writeText('outreach-map-title', t.mapTitle);
	writeText('outreach-map-desc', t.mapDesc);
	writeText('outreach-map-church', t.mapChurch);
	writeText('outreach-map-address', t.mapAddress);
	writeText('outreach-map-time', t.mapTime);
	writeText('outreach-btn-directions', t.btnDirections);
	writeText('outreach-footer-title', t.footerTitle);
	writeText('outreach-footer-quote', t.footerQuote);

	const dirLink = document.getElementById('outreach-btn-directions');
	if (dirLink) dirLink.href = OUTREACH_DIRECTIONS_URL;

	outreachRenderInvitations();
	outreachRenderIAMCarousel();
	outreachRenderTimeline();
}

function outreachRenderInvitations() {
	const container = document.getElementById('outreach-invitation-grid');
	if (!container) return;

	container.innerHTML = '';
	const t = outreachContent;

	t.invitations.forEach(item => {
		const card = document.createElement('div');
		card.className = 'rounded-2xl p-8 shadow-[0_20px_45px_rgba(8,47,73,0.35)] border cursor-pointer transition-all duration-300 group bg-gradient-to-br from-sky-500/10 via-fuchsia-500/8 to-cyan-500/10 border-cyan-300/25 hover:border-cyan-300/55 hover:-translate-y-1';
		card.innerHTML = `
			<div class="text-4xl mb-6">${item.icon}</div>
			<h3 class="font-serif text-xl font-bold mb-3 text-white group-hover:text-neon-teal transition-colors">${item.title}</h3>
			<p class="text-slate-300 italic mb-4 font-serif text-sm">"${item.quote}"</p>
			<p class="text-xs font-bold text-slate-400 mb-6 uppercase tracking-wider font-mono">${item.reference}</p>
			<div class="outreach-insight hidden pt-6 border-t border-glass-border text-sm leading-relaxed text-muted-text fade-in">
				<strong class="text-neon-blue block mb-2 uppercase tracking-widest text-[10px]">${t.labels.theHope}</strong>
				${item.insight}
			</div>
			<div class="text-center mt-6 outreach-toggle text-slate-500 group-hover:text-neon-teal">
				<span class="text-2xl font-light">+</span>
			</div>
		`;

		card.onclick = () => {
			const insight = card.querySelector('.outreach-insight');
			const icon = card.querySelector('.outreach-toggle span');
			const isHidden = insight.classList.contains('hidden');

			document.querySelectorAll('#outreach-invitation-grid .outreach-insight').forEach(el => el.classList.add('hidden'));
			document.querySelectorAll('#outreach-invitation-grid .outreach-toggle span').forEach(el => { el.textContent = '+'; });

			if (isHidden) {
				insight.classList.remove('hidden');
				icon.textContent = '-';
			}
		};

		container.appendChild(card);
	});
}

function outreachRenderIAMCarousel() {
	const navList = document.getElementById('outreach-iam-nav-list');
	if (!navList) return;

	navList.innerHTML = '';
	const t = outreachContent;

	t.iamData.forEach((item, index) => {
		const btn = document.createElement('div');
		btn.className = `iam-nav-item px-5 py-4 cursor-pointer rounded-r-xl text-sm font-medium ${index === 0 ? 'active text-white' : 'text-slate-500'}`;
		btn.innerHTML = `<span class="mr-4">${item.icon}</span> ${item.label}`;
		btn.onclick = () => outreachShowIAM(index);
		btn.id = `outreach-iam-nav-${index}`;
		navList.appendChild(btn);
	});

	outreachShowIAM(0);
}

function outreachShowIAM(index) {
	const t = outreachContent;
	const data = t.iamData[index];
	const contentArea = document.getElementById('outreach-iam-content-area');
	if (!contentArea || !data) return;

	document.querySelectorAll('#outreach-iam-nav-list .iam-nav-item').forEach((el, i) => {
		el.classList.toggle('active', i === index);
		el.classList.toggle('text-white', i === index);
		el.classList.toggle('text-slate-500', i !== index);
	});

	contentArea.innerHTML = `
		<div class="fade-in">
			<div class="mb-8 inline-block px-4 py-1 rounded-full border border-glass-border bg-white/5 text-[10px] font-bold tracking-[0.3em] text-neon-blue uppercase">${t.labels.theDecl}</div>
			<h3 class="font-serif text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">${t.labels.iAm} <br><span style="color: ${data.color}" class="text-glow">${data.label}</span></h3>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-10 mt-12 border-t border-glass-border pt-10">
				<div>
					<p class="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">${t.labels.needMet}</p>
					<p class="text-xl text-white font-serif italic">${data.need}</p>
				</div>
				<div>
					<p class="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">${t.labels.theRef}</p>
					<p class="text-sm text-neon-teal font-mono">${data.verse}</p>
				</div>
			</div>
			<p class="mt-10 text-lg text-muted-text leading-relaxed max-w-xl">${data.description}</p>
		</div>
	`;
}

function outreachRenderTimeline() {
	const nav = document.getElementById('outreach-timeline-nav');
	if (!nav) return;

	nav.innerHTML = '';
	const t = outreachContent;

	t.workData.forEach((item, index) => {
		const navItem = document.createElement('div');
		navItem.className = `pl-6 py-5 border-l-4 -ml-[3px] cursor-pointer transition-all duration-300 outreach-nav-link-item ${index === 0 ? 'active-tab border-neon-purple' : 'border-transparent hover:border-glass-border'}`;
		navItem.innerHTML = `<h4 class="font-serif font-bold text-lg ${index === 0 ? 'text-white' : 'text-slate-400'}">${item.title}</h4><p class="text-[10px] uppercase tracking-widest text-slate-500 mt-1">${item.subtitle}</p>`;
		navItem.onclick = () => {
			document.querySelectorAll('#outreach-timeline-nav .outreach-nav-link-item').forEach(el => {
				el.classList.remove('active-tab', 'border-neon-purple');
				el.classList.add('border-transparent');
				const titleEl = el.querySelector('h4');
				if (titleEl) titleEl.className = 'font-serif font-bold text-lg text-slate-400';
			});
			navItem.classList.add('active-tab', 'border-neon-purple');
			const titleEl = navItem.querySelector('h4');
			if (titleEl) titleEl.className = 'font-serif font-bold text-lg text-white';
			outreachRenderTimelineContent(item);
		};
		nav.appendChild(navItem);
	});

	outreachRenderTimelineContent(t.workData[0]);
}

function outreachRenderTimelineContent(item) {
	const t = outreachContent;
	const target = document.getElementById('outreach-timeline-content');
	if (!target || !item) return;

	target.innerHTML = `
		<div class="fade-in bg-glass-hover p-10 rounded-2xl h-full border border-glass-border flex flex-col justify-center">
			<h3 class="font-serif text-4xl font-bold text-white mb-2">${item.title}</h3>
			<p class="text-neon-purple font-bold uppercase tracking-[0.2em] text-xs mb-8">${item.subtitle}</p>
			<div class="mb-10">
				<h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-glass-border pb-2">${t.labels.theMission}</h4>
				<p class="text-muted-text leading-relaxed text-lg">${item.summary}</p>
			</div>
			<div class="bg-glass p-6 rounded-xl border border-neon-blue/30 relative overflow-hidden">
				<div class="absolute top-0 left-0 w-1.5 h-full bg-neon-blue"></div>
				<h4 class="text-[10px] font-bold text-neon-blue uppercase tracking-widest mb-2">${t.labels.theHope}</h4>
				<p class="text-white font-medium leading-relaxed italic text-lg">"${item.hope}"</p>
			</div>
		</div>
	`;
}

function openOutreachApp() {
	const t = outreachContent;
	document.getElementById('modal-back-text').innerText = 'CLEAR';
	document.getElementById('modal-back-btn').onclick = () => closeModal();
	document.getElementById('modal-title').innerHTML = `<span style="filter:none !important; text-shadow:none !important; margin-right:8px;">🌸</span>INVITATION`;
	document.getElementById('modal-subtitle').innerText = 'SHARE THE HOPE - INVITE A FRIEND';

	const container = document.getElementById('modal-body-container');
	container.innerHTML = `
		<div id="outreach-app" class="fade-in" style="position:relative; margin:0; color:#f8fafc; background:radial-gradient(circle at 10% 10%, rgba(34,211,238,0.12), transparent 35%), radial-gradient(circle at 90% 20%, rgba(244,114,182,0.12), transparent 38%), radial-gradient(circle at 50% 100%, rgba(96,165,250,0.1), transparent 42%); border-radius:20px; padding:10px;">
			<style>
				#outreach-app .outreach-sheen { position:absolute; inset:0; pointer-events:none; background: linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.05) 46%, transparent 70%); opacity:0.35; }
			</style>

			<div class="outreach-sheen"></div>

			<div id="outreach-page-title" style="display:none;">${t.pageTitle}</div>

			<header style="padding:16px 4px 24px; max-width:1000px; margin:0 auto; text-align:center; position:relative;">
				<div style="display:inline-flex; align-items:center; gap:10px; padding:6px 14px; border:1px solid rgba(56,189,248,0.35); border-radius:999px; background:rgba(15,23,42,0.72); color:#67e8f9; font-family:'JetBrains Mono', monospace; font-size:0.7rem; letter-spacing:1.4px; text-transform:uppercase; margin-bottom:16px;">Outreach Card | Indio Residents</div>
				<h1 class="font-serif text-5xl md:text-7xl font-bold mb-8 text-white leading-tight drop-shadow-md" id="outreach-header-title">${t.headerTitle}</h1>
				<p class="text-lg md:text-xl text-muted-text mb-10 leading-relaxed font-light" id="outreach-header-desc">${t.headerDesc}</p>
			</header>

			<section style="max-width:1000px; margin:0 auto 48px;" class="fade-in">
				<div class="border rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden text-center" style="background:linear-gradient(145deg, rgba(12,22,51,0.78), rgba(36,16,54,0.7)); border-color:rgba(56,189,248,0.35);">
					<div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink"></div>
					<div style="position:absolute; width:180px; height:180px; border-radius:50%; background:radial-gradient(circle, rgba(45,212,191,0.2), transparent 70%); top:-40px; left:-30px;"></div>
					<div style="position:absolute; width:220px; height:220px; border-radius:50%; background:radial-gradient(circle, rgba(192,132,252,0.2), transparent 70%); bottom:-80px; right:-50px;"></div>
					<h2 class="font-serif text-2xl md:text-3xl font-bold mb-4 text-white" id="outreach-banner-title">${t.bannerTitle}</h2>
					<p class="text-slate-300 font-light leading-relaxed mb-6 max-w-2xl mx-auto" id="outreach-banner-desc">${t.bannerDesc}</p>
					<p class="text-neon-teal font-mono text-sm uppercase tracking-widest font-bold mb-8" id="outreach-banner-tag">${t.bannerTag}</p>
					<button type="button" onclick="outreachScrollToSection('outreach-invitations')" class="inline-block text-white px-10 py-4 rounded-full hover:scale-105 transition-all shadow-xl font-medium tracking-wide" style="background:linear-gradient(90deg, rgba(14,165,233,0.35), rgba(168,85,247,0.35)); border:1px solid rgba(125,211,252,0.35);" id="outreach-btn-explore">${t.btnExplore}</button>
				</div>
			</section>

			<main style="max-width:1200px; margin:0 auto; padding:0 0 24px;">
				<section id="outreach-invitations" style="margin-bottom:88px; padding-top:16px;">
					<div class="mb-12">
						<h2 class="font-serif text-3xl md:text-4xl font-bold mb-4 text-white" id="outreach-sec1-title">${t.sec1Title}</h2>
						<p class="text-muted-text max-w-3xl leading-relaxed" id="outreach-sec1-desc">${t.sec1Desc}</p>
					</div>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-8" id="outreach-invitation-grid"></div>
				</section>

				<section id="outreach-identity" style="margin-bottom:88px; padding-top:16px;">
					<div class="mb-12">
						<h2 class="font-serif text-3xl md:text-4xl font-bold mb-4 text-white" id="outreach-sec2-title">${t.sec2Title}</h2>
						<p class="text-muted-text max-w-3xl leading-relaxed" id="outreach-sec2-desc">${t.sec2Desc}</p>
					</div>
					<div class="relative backdrop-blur-2xl rounded-3xl shadow-2xl border overflow-hidden min-h-[550px] flex items-stretch" style="background:linear-gradient(140deg, rgba(15,23,42,0.9), rgba(46,16,68,0.72)); border-color:rgba(125,211,252,0.24);">
						<div class="w-full grid grid-cols-1 lg:grid-cols-12">
							<div class="lg:col-span-4 border-r p-8 flex flex-col justify-center gap-2" style="border-color:rgba(125,211,252,0.2); background:linear-gradient(180deg, rgba(2,6,23,0.5), rgba(30,41,59,0.32));">
								<div id="outreach-iam-nav-list" class="space-y-2"></div>
							</div>
							<div class="lg:col-span-8 p-10 md:p-20 flex flex-col justify-center relative" id="outreach-iam-content-area"></div>
						</div>
					</div>
				</section>

				<section id="outreach-work" style="margin-bottom:88px; padding-top:16px;">
					<div class="mb-12">
						<h2 class="font-serif text-3xl md:text-4xl font-bold mb-4 text-white" id="outreach-sec3-title">${t.sec3Title}</h2>
						<p class="text-muted-text max-w-3xl leading-relaxed" id="outreach-sec3-desc">${t.sec3Desc}</p>
					</div>
					<div class="flex flex-col md:flex-row gap-8 backdrop-blur-xl p-6 md:p-10 rounded-2xl shadow-2xl border" style="background:linear-gradient(130deg, rgba(15,23,42,0.86), rgba(30,58,138,0.34)); border-color:rgba(94,234,212,0.26);">
						<div class="w-full md:w-1/3 border-l-2 border-glass-border" id="outreach-timeline-nav"></div>
						<div class="w-full md:w-2/3 pl-0 md:pl-8" id="outreach-timeline-content"></div>
					</div>
				</section>

				<section id="outreach-location" style="padding-top:10px;">
					<div class="mb-12 text-center md:text-left">
						<h2 class="font-serif text-3xl md:text-4xl font-bold mb-4 text-white" id="outreach-map-title">${t.mapTitle}</h2>
						<p class="text-muted-text max-w-3xl leading-relaxed mx-auto md:mx-0" id="outreach-map-desc">${t.mapDesc}</p>
					</div>

					<div class="p-2 sm:p-4 rounded-3xl border shadow-2xl relative overflow-hidden flex flex-col" style="background:linear-gradient(145deg, rgba(10,18,44,0.82), rgba(17,24,39,0.82)); border-color:rgba(56,189,248,0.28);">
						<div class="w-full h-[350px] md:h-[450px] rounded-2xl overflow-hidden bg-black/50">
							<iframe
								src="${OUTREACH_MAP_EMBED_URL}"
								width="100%"
								height="100%"
								style="border:0;"
								allowfullscreen=""
								loading="lazy"
								title="Map to Trinity Baptist Church">
							</iframe>
						</div>
						<div class="mt-6 flex flex-col md:flex-row items-center justify-between px-4 pb-4 gap-6">
							<div class="text-center md:text-left">
								<h3 class="text-white font-bold text-xl font-serif" id="outreach-map-church">${t.mapChurch}</h3>
								<p class="text-slate-400 font-mono text-sm mt-1" id="outreach-map-address">${t.mapAddress}</p>
								<p class="text-neon-purple text-xs font-bold tracking-widest uppercase mt-2" id="outreach-map-time">${t.mapTime}</p>
							</div>
							<a id="outreach-btn-directions" href="${OUTREACH_DIRECTIONS_URL}" target="_blank" rel="noopener noreferrer" class="bg-neon-blue/10 text-neon-blue hover:bg-neon-blue hover:text-white border border-neon-blue/50 hover:border-neon-blue px-6 py-3 rounded-full transition-all duration-300 font-medium tracking-wide shadow-[0_0_15px_rgba(56,189,248,0.15)] text-center w-full md:w-auto">${t.btnDirections}</a>
						</div>
					</div>
				</section>
			</main>

			<footer class="bg-transparent border-t border-glass-border text-white py-20 text-center mt-10">
				<div class="max-w-3xl mx-auto px-4">
					<h2 class="font-serif text-3xl font-bold mb-6 text-neon-blue" id="outreach-footer-title">${t.footerTitle}</h2>
					<p class="text-slate-300 font-light text-lg leading-relaxed mb-10 italic" id="outreach-footer-quote">${t.footerQuote}</p>
					<p class="text-sm text-slate-500 uppercase tracking-widest font-mono">Soli Deo Gloria</p>
				</div>
			</footer>
		</div>
	`;

	document.getElementById('data-modal').classList.add('active');
	bounceModalBodyToTop();
	try {
		outreachApplyContent();
	} catch (error) {
		console.error('Outreach content render error:', error);
	}
}

function renderInvitationsGrid() {
	const grid = document.getElementById('invitation-grid');
	if (!grid || !Array.isArray(window.invitationData)) return;
	grid.innerHTML = '';
	window.invitationData.forEach((item) => {
		grid.innerHTML += `<div class="invitation-card" onclick="toggleInsight(this)"><div class="invitation-icon">${item.icon}</div><div style="font-family:'Merriweather', serif; font-size:1.3rem; font-weight:800; color:white; margin-bottom:10px;">${item.title}</div><div style="font-style:italic; color:var(--text-muted); font-size:1.05rem; margin-bottom:15px; line-height:1.72;">"${item.quote}"</div><div style="font-family:'JetBrains Mono'; font-size:0.8rem; font-weight:800; color:var(--accent-cyan); text-transform:uppercase;">${item.reference}</div><div class="insight-content fade-in" style="display:none; margin-top:20px; padding-top:20px; border-top:1px solid rgba(255,255,255,0.1); color:var(--text-muted); line-height:1.8; font-size:1.05rem;"><strong style="color:var(--accent-cyan); display:block; font-size:0.75rem; font-family:'JetBrains Mono'; text-transform:uppercase; letter-spacing:1px; margin-bottom:5px;">The Hope</strong>${item.insight}</div><div class="toggle-icon" style="text-align:center; margin-top:20px; color:var(--text-muted); font-size:1.5rem; font-weight:300;">+</div></div>`;
	});
}

window.toggleInsight = function(card) {
	if (!card) return;
	const content = card.querySelector('.insight-content');
	const icon = card.querySelector('.toggle-icon');
	if (!content || !icon) return;
	if (content.style.display === 'none' || !content.style.display) {
		content.style.display = 'block';
		icon.innerText = '−';
	} else {
		content.style.display = 'none';
		icon.innerText = '+';
	}
};

function initIAMCarousel() {
	const navList = document.getElementById('iam-nav-list');
	if (!navList || !Array.isArray(window.iamData)) return;
	navList.innerHTML = '';
	window.iamData.forEach((item, index) => {
		navList.innerHTML += `<div class="iam-nav-item ${index === 0 ? 'active' : ''}" onclick="showIAM(${index}, this)"><span style="font-size:1.2rem; filter:none!important; text-shadow:none!important;">${item.icon}</span> ${item.label}</div>`;
	});
	window.showIAM(0, navList.firstElementChild);
}

window.showIAM = function(index, element) {
	if (!Array.isArray(window.iamData)) return;
	if (element) {
		document.querySelectorAll('.iam-nav-item').forEach((el) => el.classList.remove('active'));
		element.classList.add('active');
	}
	const data = window.iamData[index];
	const content = document.getElementById('iam-content-area');
	if (!data || !content) return;
	content.innerHTML = `<div class="fade-in"><div style="display:inline-block; padding:5px 15px; border:1px solid var(--accent-cyan); color:var(--accent-cyan); background:rgba(0,255,255,0.05); border-radius:50px; font-size:0.75rem; font-family:'JetBrains Mono'; font-weight:800; text-transform:uppercase; margin-bottom:20px;">The Declaration</div><h3 style="font-family:'Merriweather', serif; font-size:clamp(2rem, 5vw, 3.5rem); font-weight:800; color:white; margin:0 0 30px 0; line-height:1.2;">I AM the <br><span style="color:${data.color}; text-shadow:0 0 20px ${data.color}80;">${data.label}</span></h3><div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; border-top:1px solid rgba(255,255,255,0.1); padding-top:25px; margin-bottom:25px;"><div><div style="font-size:0.75rem; font-family:'JetBrains Mono'; color:var(--text-muted); text-transform:uppercase; margin-bottom:5px;">The Need Met</div><div style="font-family:'Merriweather', serif; font-style:italic; font-size:1.18rem; color:white;">${data.need}</div></div><div><div style="font-size:0.75rem; font-family:'JetBrains Mono'; color:var(--text-muted); text-transform:uppercase; margin-bottom:5px;">The Reference</div><div style="font-family:'JetBrains Mono'; font-size:1rem; color:var(--accent-cyan);">${data.verse}</div></div></div><p style="color:var(--text-muted); font-size:1.18rem; line-height:1.78;">${data.description}</p></div>`;
};

function initTimeline() {
	const nav = document.getElementById('timeline-nav');
	if (!nav || !Array.isArray(window.workData)) return;
	nav.innerHTML = '';
	window.workData.forEach((item, index) => {
		nav.innerHTML += `<div class="timeline-nav-item ${index === 0 ? 'active' : ''}" onclick="showTimeline(${index}, this)"><h4>${item.title}</h4><div style="font-family:'JetBrains Mono'; font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; margin-top:5px; letter-spacing:1px;">${item.subtitle}</div></div>`;
	});
	window.showTimeline(0, nav.firstElementChild);
}

window.showTimeline = function(index, element) {
	if (!Array.isArray(window.workData)) return;
	if (element) {
		document.querySelectorAll('.timeline-nav-item').forEach((el) => el.classList.remove('active'));
		element.classList.add('active');
	}
	const item = window.workData[index];
	const content = document.getElementById('timeline-content');
	if (!item || !content) return;
	content.innerHTML = `<div class="fade-in"><h3 style="font-family:'Merriweather', serif; font-size:2.5rem; font-weight:800; color:white; margin:0 0 5px 0;">${item.title}</h3><p style="color:var(--accent-magenta); font-family:'JetBrains Mono'; font-size:0.85rem; font-weight:800; text-transform:uppercase; letter-spacing:2px; margin-bottom:30px;">${item.subtitle}</p><div style="margin-bottom:30px;"><h4 style="font-family:'JetBrains Mono'; font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px; margin-bottom:15px; letter-spacing:1px;">The Mission</h4><p style="color:var(--text-muted); font-size:1.15rem; line-height:1.8; margin:0;">${item.summary}</p></div><div style="background:rgba(0,255,255,0.05); border:1px solid var(--accent-cyan); border-left:4px solid var(--accent-cyan); padding:20px; border-radius:12px;"><h4 style="font-family:'JetBrains Mono'; font-size:0.8rem; color:var(--accent-cyan); text-transform:uppercase; margin:0 0 10px 0; letter-spacing:1px;">The Hope</h4><p style="color:white; font-size:1.15rem; font-style:italic; line-height:1.68; margin:0;">"${item.hope}"</p></div></div>`;
};

window.outreachScrollToSection = outreachScrollToSection;
window.openOutreachApp = openOutreachApp;
window.openInvitationApp = openOutreachApp;
window.renderInvitationsGrid = renderInvitationsGrid;
window.initIAMCarousel = initIAMCarousel;
window.initTimeline = initTimeline;

if (typeof window.installAppAnchorSync === 'function') {
	window.installAppAnchorSync();
}
