/**
 * WISDOM / COUNSELING APP
 */

async function openCounseling() {
    document.getElementById('modal-back-text').innerText = "CLEAR";
    document.getElementById('modal-back-btn').onclick = () => closeModal();
    document.getElementById('modal-title').innerHTML = `<span style="filter:none !important; text-shadow:none !important; margin-right:8px;">🛡️</span>WISDOM`;
    document.getElementById('modal-subtitle').innerText = "CLINICAL DATABASE SECURED";

    document.getElementById('modal-body-container').innerHTML = `<div class="region-grid" id="modal-body-grid"><div class="loader" style="grid-column:1/-1;"> </div></div>`;
    document.getElementById('data-modal').classList.add('active');

    fetch(`${MASTER_API_URL}?tab=Counseling`)
        .then(async r => {
            if (!r.ok) {
                throw new Error(`HTTP ${r.status}: ${r.statusText}`);
            }
            try {
                return await r.json();
            } catch (e) {
                throw new Error('Invalid JSON: ' + e.message);
            }
        })
        .then(data => {
            const container = document.getElementById('modal-body-grid');
            container.innerHTML = '';

            data.forEach((row) => {
                const getVal = (keyStr) => row[Object.keys(row).find(k => k.toLowerCase() === keyStr.toLowerCase())] || '';
                const id = getVal('id') || 'CLASSIFIED';
                const title = getVal('title') || 'Unknown Protocol';
                const icon = getVal('icon') || '🛡️';
                const color = getVal('color') || '#00ffff';
                const definition = getVal('definition');
                const scriptures = getVal('scriptures');
                const steps = getVal('steps');
                const detailCards = buildProtocolCardStack([
                    definition ? buildProtocolDetailCard({ label: 'Definition', content: definition, variant: 'protocol-detail-definition' }) : '',
                    scriptures ? buildProtocolDetailCard({ label: 'Scripture References', content: scriptures, variant: 'protocol-detail-scripture' }) : '',
                    steps ? buildProtocolDetailCard({ label: 'Tactical Steps', content: steps, variant: 'protocol-detail-steps' }) : ''
                ]);

                container.innerHTML += `<div class=\"region-card\" style=\"border-top: 6px solid ${color};\"><div class=\"accordion-header\" onclick=\"toggleAccordion(this)\"><div style=\"display:flex; align-items:center; gap:10px;\"><div style=\"font-size: 2.1rem; filter:none !important; text-shadow:none !important; line-height: 1;\">${icon}</div><div><div class=\"region-title\" style=\"color: ${color};\">${title}</div><div class=\"region-coords\">File Id: ${id}</div></div></div><i data-lucide=\"chevron-down\" class=\"chevron-icon\" size=\"22\"></i></div><div class=\"card-content\" style=\"padding: 0 12px 12px 12px;\">${detailCards}</div></div>`;
            });

            lucide.createIcons();
        })
        .catch((e) => {
            document.getElementById('modal-body-container').innerHTML = `<div class="loader" style="color:var(--accent-magenta);">ERROR:<br><span style='font-size:0.9rem;'>${e.message}</span></div>`;
        });
}

window.openCounseling = openCounseling;

if (typeof installAppAnchorSync === 'function') {
    installAppAnchorSync('wisdom', openCounseling);
}