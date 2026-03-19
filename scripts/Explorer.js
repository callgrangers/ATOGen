// ==========================================
// APP: EXPLORER (Books of the Bible)
// ==========================================

async function openExplorer() {
    document.getElementById('modal-back-text').innerText = "CLEAR";
    document.getElementById('modal-back-btn').onclick = () => closeModal();
    
    document.getElementById('modal-title').innerHTML = `<span style="filter:none !important; text-shadow:none !important; margin-right:8px;">📚</span><span class="explorer-title-desktop">Books of The Bible</span><span class="explorer-title-mobile">Books of<br>The Bible</span>`;
    document.getElementById('modal-subtitle').innerText = "BIBLICAL CONTEXT & APPLICATION";
    
    const container = document.getElementById('modal-body-container');
    container.innerHTML = `<div class="loader"> </div>`;
    document.getElementById('data-modal').classList.add('active');

    if (explorerData.length === 0) {
        try {
            // Assumes MASTER_API_URL is defined globally in Main.js
            console.log('Explorer: Fetching from', `${MASTER_API_URL}?tab=Books`);
            const response = await fetch(`${MASTER_API_URL}?tab=Books`);
            const rawData = await response.json();
            
            console.log('Explorer: Raw data received:', rawData);
            
            if (rawData.error) throw new Error(rawData.error);
            if (!Array.isArray(rawData)) throw new Error('Expected array, got: ' + typeof rawData);
            if (rawData.length === 0) throw new Error('Books API returned empty array');

            explorerData = rawData.map(row => {
                const getVal = (keyStr) => {
                    const foundKey = Object.keys(row).find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === keyStr.toLowerCase());
                    return foundKey ? String(row[foundKey]).trim() : '';
                };
                return {
                    id: String(getVal('id') || getVal('book') || Math.random()),
                    name: getVal('bookname') || getVal('name') || getVal('book') || 'Unknown Book',
                    testament: getVal('testament') || 'Unknown',
                    genre: getVal('genre') || 'Uncategorized',
                    summary: getVal('summary') || '',
                    theology: getVal('coretheology') || getVal('theology') || '',
                    application: getVal('practicalapplication') || getVal('application') || ''
                };
            }).filter(b => b.name !== 'Unknown Book');

            console.log('Explorer: Processed data:', explorerData);

        } catch (e) {
            console.error('Explorer error:', e);
            container.innerHTML = `<div class="loader" style="color:var(--accent-magenta); animation:none;">STARLINK SYNC ERROR:<br><span style="font-size:0.9rem;">${e.message}</span></div>`;
            return;
        }
    }

    renderExplorerUI(container);
    populateExplorerFilters();
    renderExplorerList();
}

function getExplorerDetailPlaceholderHtml() {
    return `
        <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; opacity: 0.5;">
            <div style="font-size: 4rem; filter:none !important; text-shadow:none !important; margin-bottom: 20px;">📖</div>
            <h3 style="font-family: 'Merriweather', serif; font-size: 2rem; color: white; margin: 0 0 10px 0;">Select a Book</h3>
            <p style="font-family: 'JetBrains Mono'; color: var(--accent-cyan); text-transform: uppercase;">Awaiting Selection from Directory</p>
        </div>
    `;
}

function bounceToExplorerDetailStart() {
    const detail = document.getElementById('exp-detail');
    const modalBody = document.querySelector('#data-modal .modal-body');
    if (!detail || !modalBody) return;

    const bodyRect = modalBody.getBoundingClientRect();
    const detailRect = detail.getBoundingClientRect();
    const targetTop = Math.max(0, modalBody.scrollTop + (detailRect.top - bodyRect.top) - 8);

    modalBody.scrollTo({ top: targetTop, behavior: 'smooth' });
    setTimeout(() => {
        modalBody.scrollTo({ top: targetTop + 18, behavior: 'smooth' });
    }, 250);
    setTimeout(() => {
        modalBody.scrollTo({ top: targetTop, behavior: 'smooth' });
    }, 430);
}

window.closeExplorerWindow = function() {
    explorerState.selectedId = null;
    renderExplorerList();

    const detail = document.getElementById('exp-detail');
    if (detail) {
        detail.innerHTML = getExplorerDetailPlaceholderHtml();
        detail.scrollTop = 0;
    }

    const modalBody = document.querySelector('#data-modal .modal-body');
    if (modalBody) {
        modalBody.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function renderExplorerUI(container) {
    container.innerHTML = `
        <div class="explorer-top-grid">
            <div>
                <h2 style="font-size: 2rem; font-family: 'Merriweather', serif; font-weight: 800; color: var(--accent-cyan); margin: 0 0 15px 0;">The Literary Landscape</h2>
                <p style="color: var(--text-muted); line-height: 1.6; font-size: 1.1rem; margin-bottom: 20px;">
                    <span style="color: var(--accent-cyan); font-weight: 700;">Beloved</span>, the Bible is not a single book, but a curated library spanning thousands of years, multiple authors, and diverse literary styles. Understanding the genre is key to proper theological interpretation.
                </p>
                <div class="stats-grid" style="padding: 0;">
                    <div class="stat-box"><div class="stat-label">Total Books</div><div class="stat-value" style="color: var(--accent-cyan);">${explorerData.length}</div></div>
                    <div class="stat-box"><div class="stat-label">Old Testament</div><div class="stat-value">${explorerData.filter(b => b.testament.toLowerCase().includes('old')).length}</div></div>
                    <div class="stat-box"><div class="stat-label">New Testament</div><div class="stat-value">${explorerData.filter(b => b.testament.toLowerCase().includes('new')).length}</div></div>
                </div>
            </div>
        </div>

        <div class="explorer-layout">
            <div class="explorer-sidebar">
                <div class="explorer-filters">
                    <div class="filter-group">
                        <label>Testament</label>
                        <select id="exp-testament" onchange="filterExplorer()">
                            <option value="All">All</option>
                            <option value="Old Testament">Old Testament</option>
                            <option value="New Testament">New Testament</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Genre</label>
                        <select id="exp-genre" onchange="filterExplorer()"><option value="All">All</option></select>
                    </div>
                </div>
                <div class="explorer-list custom-scrollbar" id="exp-list"></div>
            </div>
            
            <div class="explorer-main" id="exp-detail">${getExplorerDetailPlaceholderHtml()}</div>
        </div>
    `;
}

function populateExplorerFilters() {
    const genres = [...new Set(explorerData.map(b => b.genre))].filter(Boolean).sort();
    const genreSelect = document.getElementById('exp-genre');
    genreSelect.innerHTML = '<option value="All">All</option>';
    genres.forEach(g => genreSelect.innerHTML += `<option value="${g}">${g}</option>`);
}

window.filterExplorer = function() {
    explorerState.testament = document.getElementById('exp-testament').value;
    explorerState.genre = document.getElementById('exp-genre').value;
    renderExplorerList();
}

function renderExplorerList() {
    const list = document.getElementById('exp-list');
    const filtered = explorerData.filter(b => {
        const matchT = explorerState.testament === 'All' || b.testament === explorerState.testament;
        const matchG = explorerState.genre === 'All' || b.genre === explorerState.genre;
        return matchT && matchG;
    });

    if (filtered.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-muted); font-style: italic;">No records found.</div>`;
        return;
    }

    list.innerHTML = filtered.map(b => {
        const isActive = String(b.id) === String(explorerState.selectedId) ? 'active' : '';
        const dot = b.testament.toLowerCase().includes('old') ? '#ff0055' : '#ffcc00';
        return `
            <button class="book-btn ${isActive}" onclick="selectExplorerBook('${b.id}')">
                <span class="book-title">${b.name || 'Unknown'}</span>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span class="book-genre-badge hide-mobile">${b.genre || ''}</span>
                    <div style="width:10px; height:10px; border-radius:50%; background:${dot}; box-shadow: 0 0 8px ${dot};"></div>
                </div>
            </button>
        `;
    }).join('');
}

window.selectExplorerBook = function(id) {
    explorerState.selectedId = id;
    renderExplorerList(); 
    
    const book = explorerData.find(b => String(b.id) === String(id));
    if (!book) return;

    const detail = document.getElementById('exp-detail');
    detail.innerHTML = `
        <div class="fade-in">
            <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:15px; margin-bottom:20px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:14px;">
                <h2 style="font-size: 3rem; font-family: 'Merriweather', serif; font-weight: 900; color: white; margin: 0; line-height:1.1;">${book.name}</h2>
                <button class="clear-btn" onclick="closeExplorerWindow()" style="padding: 8px 14px; font-size: 0.72rem; white-space: nowrap;">CLOSE</button>
            </div>
            <div style="margin-bottom: 20px;">
                <span class="detail-badge" style="background: rgba(var(--accent-magenta-rgb, 255,0,85),0.12); color: var(--accent-magenta); border: 1px solid var(--accent-magenta);">${book.testament}</span>
                <span class="detail-badge" style="background: rgba(0,255,255,0.08); color: var(--accent-cyan); border: 1px solid var(--accent-cyan);">${book.genre}</span>
            </div>

            <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:14px 16px; margin-bottom:14px;">
                <div style="font-family:'JetBrains Mono'; font-size:0.7rem; color:var(--accent-cyan); text-transform:uppercase; letter-spacing:2px; margin-bottom:10px;">Summary</div>
                <p style="color: #e2e8f0; font-size: 1.05rem; line-height: 1.8; margin: 0; font-weight: 300;">${book.summary || 'No data available.'}</p>
            </div>

            <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:14px 16px; margin-bottom:14px;">
                <div style="font-family:'JetBrains Mono'; font-size:0.7rem; color:var(--accent-gold); text-transform:uppercase; letter-spacing:2px; margin-bottom:10px;">Core Theology</div>
                <p style="color: #e2e8f0; font-size: 1.05rem; line-height: 1.8; margin: 0; font-weight: 300;">${book.theology || 'No data available.'}</p>
            </div>

            <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:14px 16px; margin-bottom:0;">
                <div style="font-family:'JetBrains Mono'; font-size:0.7rem; color:var(--accent-magenta); text-transform:uppercase; letter-spacing:2px; margin-bottom:10px;">Practical Application</div>
                <p style="color: white; font-size: 1.05rem; line-height: 1.78; margin: 0; font-style: italic;">${book.application || 'No data available.'}</p>
            </div>
        </div>
    `;
    detail.scrollTop = 0;
    bounceToExplorerDetailStart();
}

window.openExplorer = openExplorer;

if (typeof installAppAnchorSync === 'function') {
    installAppAnchorSync();
}