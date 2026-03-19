// ==========================================
// APP: THEOLOGY
// ==========================================

// Self-contained state and styling for the Theology App
let theologyData = { categories: [] };
const categoryColors = { 
    "core": "var(--accent-gold)", 
    "applied": "var(--accent-cyan)", 
    "marriage_cov": "var(--accent-magenta)" 
};

async function openTheology() {
    document.getElementById('modal-back-text').innerText = "CLEAR";
    document.getElementById('modal-back-btn').onclick = () => closeModal();
    
    document.getElementById('modal-title').innerHTML = `<span style="filter:none !important; text-shadow:none !important; margin-right:8px;">⛪</span>THEOLOGY`;
    document.getElementById('modal-subtitle').innerText = "STATEMENT OF FAITH & DOCTRINE";
    
    const container = document.getElementById('modal-body-container');
    container.innerHTML = `<div class="region-grid" id="modal-body-grid"><div class="loader" style="grid-column:1/-1;"> </div></div>`;
    document.getElementById('data-modal').classList.add('active');

    // Only fetch from the database if we haven't already loaded it
    if (theologyData.categories.length === 0) {
        try {
            // Assumes MASTER_API_URL is globally available via Main.js
            const response = await fetch(`${MASTER_API_URL}?tab=Theology`);
            const rawData = await response.json();
            
            if (rawData.error) throw new Error(rawData.error);

            const categoryMap = {};
            const getVal = (obj, keyStr) => {
                const foundKey = Object.keys(obj).find(k => k.toLowerCase() === keyStr.toLowerCase());
                return foundKey ? obj[foundKey] : '';
            };

            rawData.forEach(row => {
                const catId = getVal(row, 'category_id') || 'general';
                const catTitle = getVal(row, 'category_title') || 'General';
                const catIntro = getVal(row, 'category_intro') || '';
                const secId = getVal(row, 'section_id') || Math.random().toString(36).substr(2, 9);
                const secTitle = getVal(row, 'section_title') || 'Untitled Section';
                const content = getVal(row, 'content') || '';

                if (!categoryMap[catId]) {
                    categoryMap[catId] = {
                        id: catId, 
                        title: catTitle, 
                        color: categoryColors[catId] || "var(--accent-cyan)", 
                        intro: catIntro, 
                        sections: []
                    };
                    theologyData.categories.push(categoryMap[catId]);
                }
                categoryMap[catId].sections.push({ id: secId, title: secTitle, content: content });
            });
        } catch (e) {
            container.innerHTML = `<div class="loader" style="animation:none; color:var(--accent-magenta);">STARLINK SYNC ERROR:<br><span style="font-size:0.9rem;">${e.message}</span></div>`;
            return;
        }
    }

    let html = '';
    theologyData.categories.forEach(cat => {
        cat.sections.forEach((sec, index) => {
            const contentCards = [];
            if (index === 0 && cat.intro) {
                contentCards.push(buildProtocolDetailCard({
                    label: `${cat.title} Overview`,
                    content: cat.intro,
                    variant: 'protocol-detail-scripture'
                }));
            }
            contentCards.push(buildProtocolDetailCard({
                label: 'Study Notes',
                content: sec.content,
                variant: 'protocol-detail-definition',
                contentClass: 'theo-article-body'
            }));

            const theologyStack = buildProtocolCardStack(contentCards);

            html += `<div class="region-card" style="border-top: 6px solid ${cat.color};"><div class="accordion-header" onclick="toggleAccordion(this)"><div style="display:flex; align-items:center; gap:10px;"><div style="font-size: 2rem; filter:none !important; text-shadow:none !important; line-height: 1;">📜</div><div><div class="region-title" style="color: ${cat.color}; font-size: calc(1.4rem - 2px);">${sec.title}</div><div class="region-coords">${cat.title}</div></div></div><i data-lucide="chevron-down" class="chevron-icon" size="22"></i></div><div class="card-content" style="padding: 0 12px 12px 12px;">${theologyStack}</div></div>`;
        });
    });
    
    const grid = document.getElementById('modal-body-grid');
    if (grid) {
        grid.innerHTML = html;
    }
    
    if (window.lucide) {
        lucide.createIcons();
    }
}

window.openTheology = openTheology;

if (typeof installAppAnchorSync === 'function') {
    installAppAnchorSync();
}