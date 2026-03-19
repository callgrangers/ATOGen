// ==========================================
// SETTINGS — Profile, Themes & System
// ==========================================

// ── THEME PRESETS ─────────────────────────────────────────────────────────────

const THEME_COLOR_PRESETS = Object.freeze({
	Default: {
		accentCyan: '#38bdf8',
		accentGreen: '#2dd4bf',
		accentGold: '#c084fc',
		accentMagenta: '#f472b6',
		panelBg: 'rgba(255,255,255,0.05)',
		textMain: '#f8fafc',
		textMuted: '#cbd5e1'
	},
	Ember: {
		accentCyan: '#fb7185',
		accentGreen: '#f97316',
		accentGold: '#f59e0b',
		accentMagenta: '#ef4444',
		panelBg: 'rgba(255,255,255,0.06)',
		textMain: '#fff4ef',
		textMuted: '#fecaca'
	},
	Emerald: {
		accentCyan: '#34d399',
		accentGreen: '#10b981',
		accentGold: '#22c55e',
		accentMagenta: '#6ee7b7',
		panelBg: 'rgba(255,255,255,0.05)',
		textMain: '#ecfdf5',
		textMuted: '#d1fae5'
	},
	Rose: {
		accentCyan: '#f472b6',
		accentGreen: '#fb7185',
		accentGold: '#f9a8d4',
		accentMagenta: '#ec4899',
		panelBg: 'rgba(255,255,255,0.055)',
		textMain: '#fff1f8',
		textMuted: '#fbcfe8'
	},
	Monochrome: {
		accentCyan: '#e2e8f0',
		accentGreen: '#cbd5e1',
		accentGold: '#94a3b8',
		accentMagenta: '#f8fafc',
		panelBg: 'rgba(255,255,255,0.04)',
		textMain: '#f8fafc',
		textMuted: '#cbd5e1'
	}
});

const THEME_BACKGROUND_PRESETS = Object.freeze({
	Aurora: 'radial-gradient(circle at top center, #1e1b4b, #020617, #0f172a)',
	Midnight: 'radial-gradient(circle at top center, #0f172a, #020617, #000000)',
	Dawn: 'radial-gradient(circle at top center, #3b0764, #1d4ed8, #082f49)',
	Ember: 'radial-gradient(circle at top center, #7c2d12, #431407, #111827)',
	Forest: 'radial-gradient(circle at top center, #14532d, #052e16, #020617)',
	Slate: 'radial-gradient(circle at top center, #334155, #0f172a, #020617)'
});

// ── THEME CORE ────────────────────────────────────────────────────────────────

function applyThemeRootVars(preset) {
	const root = document.documentElement;
	root.style.setProperty('--accent-cyan', preset.accentCyan);
	root.style.setProperty('--accent-green', preset.accentGreen);
	root.style.setProperty('--accent-gold', preset.accentGold);
	root.style.setProperty('--accent-magenta', preset.accentMagenta);
	root.style.setProperty('--panel-bg', preset.panelBg);
	root.style.setProperty('--text-main', preset.textMain || '#f8fafc');
	root.style.setProperty('--text-muted', preset.textMuted);
}

function reflectThemeSelection() {
	const selectedColor = localStorage.getItem('colorScheme') || 'Default';
	const selectedBg = localStorage.getItem('bgScheme') || 'Aurora';

	document.querySelectorAll('[data-theme-color]').forEach((button) => {
		button.classList.toggle('is-active', button.dataset.themeColor === selectedColor);
	});

	document.querySelectorAll('[data-theme-bg]').forEach((button) => {
		button.classList.toggle('is-active', button.dataset.themeBg === selectedBg);
	});

	const colorValue = document.getElementById('themes-current-color');
	const bgValue = document.getElementById('themes-current-bg');
	if (colorValue) colorValue.textContent = selectedColor;
	if (bgValue) bgValue.textContent = selectedBg;

	const stgColor = document.getElementById('stg-active-color');
	const stgBg = document.getElementById('stg-active-bg');
	if (stgColor) stgColor.textContent = selectedColor;
	if (stgBg) stgBg.textContent = selectedBg;
}

window.changeColorScheme = function changeColorScheme(name) {
	const preset = THEME_COLOR_PRESETS[name] || THEME_COLOR_PRESETS.Default;
	applyThemeRootVars(preset);
	localStorage.setItem('colorScheme', name);
	reflectThemeSelection();
	_stgAutoSaveTheme();
};

window.changeBackgroundScheme = function changeBackgroundScheme(name) {
	const background = THEME_BACKGROUND_PRESETS[name] || THEME_BACKGROUND_PRESETS.Aurora;
	document.documentElement.style.setProperty('--bg-gradient', background);
	localStorage.setItem('bgScheme', name);
	reflectThemeSelection();
	_stgAutoSaveTheme();
};

window.resetAppToDefaults = async function resetAppToDefaults() {
	const confirmed = window.confirm('Defaults will clear local settings, session data, cached files, and reload the app. Continue?');
	if (!confirmed) return;

	const defaultsBtn = document.getElementById('stg-defaults-btn');
	const defaultsStatus = document.getElementById('stg-defaults-status');
	if (defaultsBtn) {
		defaultsBtn.disabled = true;
		defaultsBtn.textContent = 'RESETTING...';
	}
	if (defaultsStatus) defaultsStatus.textContent = 'Clearing storage and cache...';

	try { localStorage.clear(); } catch (err) { /* Ignore restricted storage contexts. */ }
	try { sessionStorage.clear(); } catch (err) { /* Ignore restricted storage contexts. */ }

	try {
		if (typeof document !== 'undefined' && typeof document.cookie === 'string' && document.cookie) {
			document.cookie.split(';').forEach((cookiePart) => {
				const eqIndex = cookiePart.indexOf('=');
				const rawName = eqIndex === -1 ? cookiePart : cookiePart.slice(0, eqIndex);
				const name = rawName.trim();
				if (!name) return;
				document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
			});
		}
	} catch (err) {
		// Ignore cookie clear failures.
	}

	try {
		if (typeof indexedDB !== 'undefined') {
			if (typeof indexedDB.databases === 'function') {
				const dbList = await indexedDB.databases();
				await Promise.all((dbList || []).map((dbInfo) => {
					const dbName = dbInfo && dbInfo.name ? String(dbInfo.name) : '';
					if (!dbName) return Promise.resolve();
					return new Promise((resolve) => {
						const req = indexedDB.deleteDatabase(dbName);
						req.onsuccess = () => resolve();
						req.onerror = () => resolve();
						req.onblocked = () => resolve();
					});
				}));
			}
		}
	} catch (err) {
		// Ignore indexedDB clear failures.
	}

	try {
		if (typeof caches !== 'undefined' && typeof caches.keys === 'function') {
			const cacheNames = await caches.keys();
			await Promise.all(cacheNames.map((name) => caches.delete(name)));
		}
	} catch (err) {
		// Ignore cache API failures in unsupported or restricted browsers.
	}

	try {
		if (typeof navigator !== 'undefined' && navigator.serviceWorker && typeof navigator.serviceWorker.getRegistrations === 'function') {
			const registrations = await navigator.serviceWorker.getRegistrations();
			await Promise.all(registrations.map((registration) => registration.unregister()));
		}
	} catch (err) {
		// Ignore service worker API failures.
	}

	if (defaultsStatus) defaultsStatus.textContent = 'Reloading...';
	if (window.top !== window) {
		window.top.location.reload();
	} else {
		window.location.replace(window.location.pathname.replace(/\/[^/]*$/, '/') + '?_defaults=' + Date.now());
	}
};

// ── THEME SYNC ────────────────────────────────────────────────────────────────

function _stgApplySavedTheme(profile) {
	if (!profile || typeof profile !== 'object') return;
	const savedColor = String(profile.colorScheme || '').trim();
	const savedBg = String(profile.bgScheme || '').trim();
	const currentColor = localStorage.getItem('colorScheme') || 'Default';
	const currentBg = localStorage.getItem('bgScheme') || 'Aurora';

	if (savedColor && THEME_COLOR_PRESETS[savedColor] && savedColor !== currentColor) {
		changeColorScheme(savedColor);
	}
	if (savedBg && THEME_BACKGROUND_PRESETS[savedBg] && savedBg !== currentBg) {
		changeBackgroundScheme(savedBg);
	}
}

let _stgThemeSaveTimer = null;

function _stgAutoSaveTheme() {
	const auth = _stgGetSessionInfo();
	if (!auth || !_stg.profile) return;

	clearTimeout(_stgThemeSaveTimer);
	_stgThemeSaveTimer = setTimeout(function() {
		const endpoint = String(window.PASTORAL_DB_V2_ENDPOINT || '').trim();
		if (!endpoint) return;

		const params = new URLSearchParams({
			action: 'members.update',
			token: auth.token,
			email: auth.email,
			rowIndex: String(_stg.profile.index || ''),
			colorScheme: localStorage.getItem('colorScheme') || 'Default',
			bgScheme: localStorage.getItem('bgScheme') || 'Aurora',
			_: String(Date.now())
		});

		fetch(endpoint + '?' + params.toString(), {
			method: 'GET',
			cache: 'no-store',
			credentials: 'omit',
			referrerPolicy: 'no-referrer'
		}).catch(function() { /* silent */ });
	}, 1500);
}

// ── SETTINGS STATE ────────────────────────────────────────────────────────────

const _stg = {
	profile: null,
	email: '',
	role: '',
	loading: false,
	editing: false,
	saving: false,
	error: null
};

// ── HELPERS ───────────────────────────────────────────────────────────────────

function _stgEsc(value) {
	return String(value == null ? '' : value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function _stgInitials(first, last) {
	return ((first || '').charAt(0) + (last || '').charAt(0)).toUpperCase() || '?';
}

function _stgGetSessionInfo() {
	// Settings auth session in localStorage (does NOT grant vault access)
	try {
		const authKey = (typeof AUTH_SESSION_KEY !== 'undefined' && AUTH_SESSION_KEY)
			? AUTH_SESSION_KEY
			: 'aos_auth_session_v1';
		const authRaw = localStorage.getItem(authKey);
		if (authRaw && authRaw !== 'null') {
			const authParsed = JSON.parse(authRaw);
			if (authParsed && typeof authParsed === 'object') {
				const token = String(authParsed.token || '').trim();
				const email = String(authParsed.email || '').trim().toLowerCase();
				const role = String(authParsed.role || '').trim().toLowerCase();
				if (token && email) return { token, email, role };
			}
		}
	} catch { /* ignore */ }

	// Fallback: secure vault session in localStorage
	try {
		const key = (typeof SECURE_SESSION_KEY !== 'undefined' && SECURE_SESSION_KEY)
			? SECURE_SESSION_KEY
			: 'atogen_secure_vault_v1';
		const raw = localStorage.getItem(key);
		if (!raw || raw === '1') return null;
		const parsed = JSON.parse(raw);
		if (!parsed || typeof parsed !== 'object') return null;
		const token = String(parsed.token || '').trim();
		const email = String(parsed.email || '').trim().toLowerCase();
		const role = String(parsed.role || '').trim().toLowerCase();
		if (!token || !email) return null;
		return { token, email, role };
	} catch { return null; }
}

// ── STYLES ────────────────────────────────────────────────────────────────────

function settingsEnsureStyles() {
	if (document.getElementById('settings-app-style')) return;
	const s = document.createElement('style');
	s.id = 'settings-app-style';
	s.textContent = `
		.stg-shell { max-width: 720px; margin: 0 auto; display: grid; gap: 20px; padding: 4px 0; }
		.stg-section { border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); padding: 18px; }
		.stg-section-head { margin-bottom: 14px; }
		.stg-section-title { margin: 0; font-size: 1rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent-cyan, #38bdf8); }

		.stg-sign-in-banner { background: linear-gradient(135deg, rgba(56,189,248,0.08), rgba(255,255,255,0.04)); }
		.stg-sign-in-content { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
		.stg-sign-in-icon { font-size: 2rem; filter: none !important; text-shadow: none !important; }
		.stg-sign-in-title { margin: 0 0 4px; color: #fff; font-size: 1.1rem; font-weight: 800; }
		.stg-sign-in-copy { margin: 0; color: var(--text-muted); font-size: 0.9rem; line-height: 1.5; }

		.stg-profile-header { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
		.stg-profile-avatar { width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, var(--accent-cyan, #38bdf8), var(--accent-gold, #c084fc)); display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono', monospace; font-weight: 900; font-size: 1.2rem; color: #fff; flex-shrink: 0; }
		.stg-profile-identity { flex: 1; min-width: 0; }
		.stg-profile-name { font-size: 1.2rem; font-weight: 900; color: #fff; line-height: 1.2; }
		.stg-profile-meta { display: flex; gap: 8px; margin-top: 4px; flex-wrap: wrap; }
		.stg-role-badge { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; padding: 2px 8px; border-radius: 6px; background: rgba(56,189,248,0.15); color: var(--accent-cyan, #38bdf8); border: 1px solid rgba(56,189,248,0.25); }
		.stg-status-badge { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 2px 8px; border-radius: 6px; background: rgba(45,212,191,0.12); color: var(--accent-green, #2dd4bf); border: 1px solid rgba(45,212,191,0.2); }
		.stg-profile-email { font-size: 0.85rem; color: var(--text-muted); margin-top: 2px; }
		.stg-edit-btn { margin-left: auto; white-space: nowrap; }

		.stg-profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 20px; }
		.stg-field-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 2px; }
		.stg-field-value { font-size: 0.92rem; color: #fff; white-space: pre-line; }
		.stg-empty { color: rgba(255,255,255,0.2); }

		.stg-themes-block { display: grid; gap: 16px; }
		.stg-theme-group-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 10px; }
		.stg-theme-label { font-size: 0.85rem; font-weight: 800; color: #fff; text-transform: uppercase; letter-spacing: 0.06em; }
		.stg-theme-active { font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; color: var(--accent-cyan, #38bdf8); letter-spacing: 0.06em; }
		.stg-swatches { display: flex; gap: 10px; flex-wrap: wrap; }
		.stg-swatch { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 4px; border: 2px solid transparent; border-radius: 16px; background: transparent; cursor: pointer; transition: border-color 0.2s, transform 0.15s; color: var(--text-muted); }
		.stg-swatch:hover { transform: translateY(-1px); border-color: rgba(255,255,255,0.15); }
		.stg-swatch.is-active { border-color: var(--accent-cyan, #38bdf8); }
		.stg-swatch-preview { width: 44px; height: 44px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15); box-shadow: inset 0 1px 0 rgba(255,255,255,0.15); }
		.stg-swatch-name { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }

		.stg-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px; }
		.stg-form-group { display: flex; flex-direction: column; gap: 4px; }
		.stg-form-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); }
		.stg-input { padding: 8px 10px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.15); background: rgba(2,6,23,0.5); color: #fff; font-size: 0.9rem; font-family: inherit; outline: none; transition: border-color 0.2s; }
		.stg-input:focus { border-color: var(--accent-cyan, #38bdf8); }
		.stg-form-actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; align-items: center; gap: 10px; margin-top: 6px; }

		.stg-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 10px; font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; cursor: pointer; transition: background 0.2s, transform 0.15s; border: 1px solid transparent; white-space: nowrap; }
		.stg-btn:disabled { opacity: 0.5; cursor: not-allowed; }
		.stg-btn-primary { background: var(--accent-cyan, #38bdf8); color: #020617; }
		.stg-btn-primary:hover:not(:disabled) { filter: brightness(1.15); transform: translateY(-1px); }
		.stg-btn-ghost { background: transparent; color: var(--accent-cyan, #38bdf8); border-color: rgba(56,189,248,0.3); }
		.stg-btn-ghost:hover:not(:disabled) { background: rgba(56,189,248,0.1); }
		.stg-btn-danger { background: rgba(239,68,68,0.15); color: #f87171; border-color: rgba(239,68,68,0.3); }
		.stg-btn-danger:hover:not(:disabled) { background: rgba(239,68,68,0.25); }

		.stg-status { font-size: 0.8rem; font-weight: 600; }
		.stg-status-info { color: var(--accent-cyan, #38bdf8); }
		.stg-status-error { color: #f87171; }
		.stg-status-success { color: #4ade80; }

		.stg-system-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
		.stg-system-info { flex: 1; }
		.stg-system-info p { margin: 4px 0 0; font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; }

		.stg-loading { display: flex; align-items: center; gap: 12px; padding: 12px 0; color: var(--text-muted); }
		.stg-spinner { width: 20px; height: 20px; border: 2px solid rgba(56,189,248,0.2); border-top-color: var(--accent-cyan, #38bdf8); border-radius: 50%; animation: stg-spin 0.7s linear infinite; }
		@keyframes stg-spin { to { transform: rotate(360deg); } }

		.stg-error-banner { display: flex; align-items: center; gap: 12px; color: #f87171; }
		.stg-notice { display: flex; gap: 12px; align-items: flex-start; color: var(--text-muted); }
		.stg-notice span:first-child { font-size: 1.5rem; filter: none !important; text-shadow: none !important; }
		.stg-notice strong { color: #fff; }
		.stg-notice p { margin: 4px 0 0; font-size: 0.88rem; line-height: 1.5; }

		@media (max-width: 640px) {
			.stg-profile-grid { grid-template-columns: 1fr; }
			.stg-form-grid { grid-template-columns: 1fr; }
			.stg-sign-in-content { flex-direction: column; align-items: flex-start; }
			.stg-system-row { flex-direction: column; align-items: flex-start; }
			.stg-profile-header { flex-wrap: wrap; }
		}
	`;
	document.head.appendChild(s);
}

// ── PROFILE FETCH ─────────────────────────────────────────────────────────────

async function settingsFetchProfile(auth) {
	const endpoint = String(window.PASTORAL_DB_V2_ENDPOINT || '').trim();
	if (!endpoint) throw new Error('Endpoint not configured');

	const params = new URLSearchParams({
		action: 'members.search',
		token: auth.token,
		email: auth.email,
		q: auth.email,
		_: String(Date.now())
	});

	const resp = await fetch(endpoint + '?' + params.toString(), {
		method: 'GET',
		cache: 'no-store',
		credentials: 'omit',
		referrerPolicy: 'no-referrer'
	});

	if (!resp.ok) throw new Error('HTTP ' + resp.status);
	const data = await resp.json();
	if (!data || !data.ok) throw new Error(data.message || 'Search failed');

	const rows = Array.isArray(data.rows) ? data.rows : [];
	const emailLower = auth.email.toLowerCase();
	const match = rows.find(function(r) {
		return String(r.primaryEmail || '').toLowerCase() === emailLower ||
			String(r.secondaryEmail || '').toLowerCase() === emailLower;
	});

	return match || null;
}

// ── PROFILE SAVE ──────────────────────────────────────────────────────────────

async function settingsSaveProfile() {
	if (_stg.saving || !_stg.profile) return;

	const form = document.getElementById('stg-profile-form');
	if (!form) return;

	const auth = _stgGetSessionInfo();
	if (!auth) {
		_stg.editing = false;
		settingsRender();
		return;
	}

	_stg.saving = true;
	const statusEl = document.getElementById('stg-save-status');
	if (statusEl) { statusEl.textContent = 'Saving...'; statusEl.className = 'stg-status stg-status-info'; }

	const endpoint = String(window.PASTORAL_DB_V2_ENDPOINT || '').trim();
	if (!endpoint) {
		if (statusEl) { statusEl.textContent = 'Endpoint not configured'; statusEl.className = 'stg-status stg-status-error'; }
		_stg.saving = false;
		return;
	}

	const fd = new FormData(form);
	const params = new URLSearchParams({
		action: 'members.update',
		token: auth.token,
		email: auth.email,
		rowIndex: String(_stg.profile.index || ''),
		firstName: fd.get('firstName') || '',
		lastName: fd.get('lastName') || '',
		preferredName: fd.get('preferredName') || '',
		suffix: fd.get('suffix') || '',
		secondaryEmail: fd.get('secondaryEmail') || '',
		cellPhone: fd.get('cellPhone') || '',
		homePhone: fd.get('homePhone') || '',
		workPhone: fd.get('workPhone') || '',
		preferredContact: fd.get('preferredContact') || '',
		address1: fd.get('address1') || '',
		address2: fd.get('address2') || '',
		city: fd.get('city') || '',
		state: fd.get('state') || '',
		zip: fd.get('zip') || '',
		country: fd.get('country') || '',
		emergencyContact: fd.get('emergencyContact') || '',
		emergencyPhone: fd.get('emergencyPhone') || '',
		colorScheme: localStorage.getItem('colorScheme') || 'Default',
		bgScheme: localStorage.getItem('bgScheme') || 'Aurora',
		_: String(Date.now())
	});

	try {
		const resp = await fetch(endpoint + '?' + params.toString(), {
			method: 'GET',
			cache: 'no-store',
			credentials: 'omit',
			referrerPolicy: 'no-referrer'
		});

		if (!resp.ok) throw new Error('HTTP ' + resp.status);
		const data = await resp.json();
		if (!data || !data.ok) throw new Error(data.message || 'Update failed');

		_stg.profile = data.row || _stg.profile;
		_stg.editing = false;
		_stg.saving = false;
		settingsRender();
	} catch (err) {
		_stg.saving = false;
		if (statusEl) { statusEl.textContent = err.message; statusEl.className = 'stg-status stg-status-error'; }
	}
}

// ── RENDER: PROFILE ───────────────────────────────────────────────────────────

function settingsRenderProfileSection() {
	const auth = _stgGetSessionInfo();

	if (!auth) {
		return `
			<section class="stg-section stg-sign-in-banner">
				<div class="stg-section-head"><h3 class="stg-section-title">Profile</h3></div>
				<div style="display:flex; align-items:center; gap:12px; margin-bottom:14px;">
					<div class="stg-sign-in-icon">🔒</div>
					<div>
						<h3 class="stg-sign-in-title">Sign In for Profile Access</h3>
						<p class="stg-sign-in-copy">Enter your credentials to view and manage your profile.</p>
					</div>
				</div>
				<form id="stg-login-form" autocomplete="on">
					<div style="display:grid; gap:10px; max-width:360px;">
						<input class="stg-input" type="email" id="stg-login-email" placeholder="Email address" autocomplete="username">
						<input class="stg-input" type="password" id="stg-login-passcode" placeholder="Passcode" autocomplete="current-password">
						<div style="display:flex; align-items:center; gap:10px;">
							<button type="submit" class="stg-btn stg-btn-primary" id="stg-login-btn">Sign In</button>
							<span class="stg-status" id="stg-login-status"></span>
						</div>
					</div>
				</form>
			</section>`;
	}

	if (_stg.loading) {
		return `
			<section class="stg-section">
				<div class="stg-loading"><div class="stg-spinner"></div><span>Loading profile...</span></div>
			</section>`;
	}

	if (_stg.error && !_stg.profile) {
		return `
			<section class="stg-section">
				<div class="stg-error-banner">
					<span>\u26a0\ufe0f ${_stgEsc(_stg.error)}</span>
					<button type="button" class="stg-btn stg-btn-ghost" onclick="window._stgRetryFetch()">Retry</button>
				</div>
			</section>`;
	}

	if (!_stg.profile) {
		return `
			<section class="stg-section">
				<div class="stg-notice">
					<span>\ud83d\udccb</span>
					<div>
						<strong>No member profile found</strong>
						<p>Your login email (${_stgEsc(auth.email)}) doesn't match a member record. Contact an administrator to be added to the system.</p>
					</div>
				</div>
			</section>`;
	}

	if (_stg.editing) return settingsRenderProfileForm();
	return settingsRenderProfileCard();
}

function settingsRenderProfileCard() {
	const p = _stg.profile;
	const auth = _stgGetSessionInfo();
	const role = auth ? auth.role : '';
	const canEdit = !!auth;

	const displayName = [p.preferredName || p.firstName, p.lastName].filter(Boolean).join(' ') || 'Unknown';
	const initials = _stgInitials(p.firstName, p.lastName);
	const roleBadge = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Member';

	function field(label, value) {
		const v = String(value || '').trim();
		return '<div class="stg-field"><div class="stg-field-label">' + _stgEsc(label) + '</div><div class="stg-field-value">' + (v ? _stgEsc(v) : '<span class="stg-empty">\u2014</span>') + '</div></div>';
	}

	const address = [p.address1, p.address2].filter(Boolean).join(', ');
	const cityStateZip = [p.city, p.state, p.zip].filter(Boolean).join(', ');
	const fullAddress = [address, cityStateZip, p.country].filter(Boolean).join('\n');

	return `
		<section class="stg-section">
			<div class="stg-profile-header">
				<div class="stg-profile-avatar" style="background:none;font-size:2.2rem;">⛪</div>
				<div class="stg-profile-identity">
					<div class="stg-profile-name">${_stgEsc(displayName)}</div>
					<div class="stg-profile-meta">
						<span class="stg-role-badge">${_stgEsc(roleBadge)}</span>
						${p.membershipStatus ? '<span class="stg-status-badge">' + _stgEsc(p.membershipStatus) + '</span>' : ''}
					</div>
					<div class="stg-profile-email">${_stgEsc(p.primaryEmail || _stg.email)}</div>
				</div>
				<div style="margin-left:auto; display:flex; gap:8px; align-items:center; flex-shrink:0;">
					<button type="button" class="stg-btn stg-btn-ghost" onclick="window._stgSignOut()" style="font-size:0.78rem;">Sign Out</button>
				</div>
			</div>

			<div class="stg-change-passcode-toggle" style="margin-top:14px;">
				<button type="button" class="stg-btn stg-btn-ghost" id="stg-toggle-passcode-btn" onclick="window._stgToggleChangePasscode()" style="font-size:0.82rem;">🔑 Change Passcode</button>
			</div>
			<div id="stg-change-passcode-wrap" style="display:none; margin-top:10px; max-width:360px;">
				<form id="stg-change-passcode-form" autocomplete="off" style="display:grid; gap:10px;">
					<input class="stg-input" type="password" id="stg-current-passcode" placeholder="Current passcode" autocomplete="current-password">
					<input class="stg-input" type="password" id="stg-new-passcode" placeholder="New passcode (min 6 characters)" autocomplete="new-password">
					<input class="stg-input" type="password" id="stg-confirm-passcode" placeholder="Confirm new passcode" autocomplete="new-password">
					<div style="display:flex; align-items:center; gap:10px;">
						<button type="submit" class="stg-btn stg-btn-primary" id="stg-change-passcode-btn">Update Passcode</button>
						<button type="button" class="stg-btn stg-btn-ghost" onclick="window._stgToggleChangePasscode()">Cancel</button>
						<span class="stg-status" id="stg-change-passcode-status"></span>
					</div>
				</form>
			</div>
		</section>`;
}

function settingsRenderProfileForm() {
	const p = _stg.profile;
	const initials = _stgInitials(p.firstName, p.lastName);
	const disabledAttr = _stg.saving ? ' disabled' : '';

	function inp(label, name, value, type) {
		type = type || 'text';
		return '<div class="stg-form-group"><label class="stg-form-label">' + _stgEsc(label) + '</label><input class="stg-input" type="' + type + '" name="' + name + '" value="' + _stgEsc(value || '') + '"' + disabledAttr + '></div>';
	}

	const prefOptions = ['', 'Cell', 'Home', 'Work', 'Email', 'Text'].map(function(c) {
		const sel = (p.preferredContact || '').toLowerCase() === c.toLowerCase() && c ? ' selected' : (!c && !p.preferredContact ? ' selected' : '');
		return '<option value="' + c + '"' + sel + '>' + (c || '\u2014') + '</option>';
	}).join('');

	return `
		<section class="stg-section">
			<div class="stg-profile-header">
				<div class="stg-profile-avatar">${_stgEsc(initials)}</div>
				<div class="stg-profile-identity">
					<div class="stg-profile-name">Edit Profile</div>
				</div>
			</div>
			<form class="stg-form-grid" id="stg-profile-form">
				${inp('First Name', 'firstName', p.firstName)}
				${inp('Last Name', 'lastName', p.lastName)}
				${inp('Preferred Name', 'preferredName', p.preferredName)}
				${inp('Suffix', 'suffix', p.suffix)}
				${inp('Cell Phone', 'cellPhone', p.cellPhone, 'tel')}
				${inp('Home Phone', 'homePhone', p.homePhone, 'tel')}
				${inp('Work Phone', 'workPhone', p.workPhone, 'tel')}
				<div class="stg-form-group">
					<label class="stg-form-label">Preferred Contact</label>
					<select class="stg-input" name="preferredContact"${disabledAttr}>${prefOptions}</select>
				</div>
				${inp('Secondary Email', 'secondaryEmail', p.secondaryEmail, 'email')}
				${inp('Address Line 1', 'address1', p.address1)}
				${inp('Address Line 2', 'address2', p.address2)}
				${inp('City', 'city', p.city)}
				${inp('State', 'state', p.state)}
				${inp('ZIP', 'zip', p.zip)}
				${inp('Country', 'country', p.country)}
				${inp('Emergency Contact', 'emergencyContact', p.emergencyContact)}
				${inp('Emergency Phone', 'emergencyPhone', p.emergencyPhone, 'tel')}
				<div class="stg-form-actions">
					<span class="stg-status" id="stg-save-status"></span>
					<button type="button" class="stg-btn stg-btn-ghost" onclick="window._stgCancelEdit()"${disabledAttr}>Cancel</button>
					<button type="button" class="stg-btn stg-btn-primary" onclick="window._stgSaveProfile()"${disabledAttr}>${_stg.saving ? 'Saving...' : 'Save'}</button>
				</div>
			</form>
		</section>`;
}

// ── RENDER: COMPACT THEMES ────────────────────────────────────────────────────

function settingsRenderCompactThemes() {
	const selectedColor = localStorage.getItem('colorScheme') || 'Default';
	const selectedBg = localStorage.getItem('bgScheme') || 'Aurora';

	const colorSwatches = Object.entries(THEME_COLOR_PRESETS).map(function(entry) {
		const name = entry[0];
		const preset = entry[1];
		const active = name === selectedColor ? ' is-active' : '';
		const gradient = 'linear-gradient(135deg, ' + preset.accentCyan + ', ' + preset.accentGold + ', ' + preset.accentMagenta + ')';
		return '<button type="button" class="stg-swatch' + active + '" data-theme-color="' + name + '" onclick="changeColorScheme(\'' + name + '\')" title="' + name + '"><span class="stg-swatch-preview" style="background:' + gradient + '"></span><span class="stg-swatch-name">' + name + '</span></button>';
	}).join('');

	const bgSwatches = Object.entries(THEME_BACKGROUND_PRESETS).map(function(entry) {
		const name = entry[0];
		const gradient = entry[1];
		const active = name === selectedBg ? ' is-active' : '';
		return '<button type="button" class="stg-swatch' + active + '" data-theme-bg="' + name + '" onclick="changeBackgroundScheme(\'' + name + '\')" title="' + name + '"><span class="stg-swatch-preview" style="background:' + gradient + '"></span><span class="stg-swatch-name">' + name + '</span></button>';
	}).join('');

	return `
		<section class="stg-section">
			<div class="stg-section-head"><h3 class="stg-section-title">Appearance</h3></div>
			<div class="stg-themes-block">
				<div class="stg-theme-group">
					<div class="stg-theme-group-head">
						<span class="stg-theme-label">Color Palette</span>
						<span class="stg-theme-active" id="stg-active-color">${_stgEsc(selectedColor)}</span>
					</div>
					<div class="stg-swatches">${colorSwatches}</div>
				</div>
				<div class="stg-theme-group">
					<div class="stg-theme-group-head">
						<span class="stg-theme-label">Background</span>
						<span class="stg-theme-active" id="stg-active-bg">${_stgEsc(selectedBg)}</span>
					</div>
					<div class="stg-swatches">${bgSwatches}</div>
				</div>
			</div>
		</section>`;
}

// ── RENDER: SYSTEM ────────────────────────────────────────────────────────────

function settingsRenderSystemSection() {
	return `
		<section class="stg-section">
			<div class="stg-section-head"><h3 class="stg-section-title">System</h3></div>
			<div class="stg-system-row">
				<div class="stg-system-info">
					<strong style="color:#fff;">Factory Reset</strong>
					<p>Clear all cached data, local preferences, and session storage. The app will reload with defaults.</p>
				</div>
				<button type="button" class="stg-btn stg-btn-danger" id="stg-defaults-btn" onclick="resetAppToDefaults()">RESET</button>
			</div>
			<span class="stg-status" id="stg-defaults-status"></span>
		</section>`;
}

// ── RENDER: MAIN ──────────────────────────────────────────────────────────────

function settingsRender() {
	const container = document.getElementById('stg-content');
	if (!container) return;

	container.innerHTML =
		'<div class="stg-shell">' +
			settingsRenderProfileSection() +
			settingsRenderCompactThemes() +
			settingsRenderSystemSection() +
		'</div>';

	reflectThemeSelection();
	_stgInstallLoginKeyHandler();
	_stgAutoFillFromCredential();
	_stgInstallPasscodeFormHandler();
}

// ── SETTINGS AUTH ─────────────────────────────────────────────────────────────

async function _stgAttemptLogin(email, passcode) {
	const endpoint = String(
		window.AUTH_PRIMARY_ENDPOINT ||
		(window.AUTH_ENDPOINTS && window.AUTH_ENDPOINTS.login) ||
		''
	).trim();
	if (!endpoint) throw new Error('Auth endpoint not configured.');

	const tabs = window.AUTH_SHEET_TABS || { users: 'AuthUsers_v1', profiles: 'UserProfiles_v1', audit: 'AuthAudit_v1' };
	const url = endpoint + (endpoint.includes('?') ? '&' : '?') + 'action=auth.login';

	const resp = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
		body: 'payload=' + encodeURIComponent(JSON.stringify({ email, passcode, tabs })),
		credentials: 'omit',
		referrerPolicy: 'no-referrer'
	});

	if (!resp.ok) throw new Error('HTTP ' + resp.status);
	return await resp.json();
}

function _stgWriteAuthSession(result, email) {
	const authKey = (typeof AUTH_SESSION_KEY !== 'undefined' && AUTH_SESSION_KEY)
		? AUTH_SESSION_KEY
		: 'aos_auth_session_v1';
	const session = {
		token: String(
			(result.session && (result.session.token || result.session.accessToken || result.session.authToken || result.session.jwt)) ||
			result.token || result.accessToken || ''
		).trim(),
		email: email,
		role: String((result.session && result.session.role) || '').trim(),
		source: 'settings',
		at: Date.now()
	};
	localStorage.setItem(authKey, JSON.stringify(session));
}

function _stgInstallLoginKeyHandler() {
	const loginForm = document.getElementById('stg-login-form');
	if (loginForm) {
		loginForm.addEventListener('submit', function(e) {
			e.preventDefault();
			window._stgHandleLogin();
		});
	}
}

function _stgAutoFillFromCredential() {
	var emailEl = document.getElementById('stg-login-email');
	if (!emailEl || !navigator.credentials || !window.PasswordCredential) return;
	navigator.credentials.get({ password: true, mediation: 'optional' }).then(function(cred) {
		if (cred && cred.type === 'password') {
			var e = document.getElementById('stg-login-email');
			var p = document.getElementById('stg-login-passcode');
			if (e) e.value = cred.id;
			if (p) p.value = cred.password;
		}
	}).catch(function() { /* silently ignore */ });
}

function _stgInstallPasscodeFormHandler() {
	var form = document.getElementById('stg-change-passcode-form');
	if (!form) return;
	form.addEventListener('submit', function(e) {
		e.preventDefault();
		window._stgHandleChangePasscode();
	});
}

// ── WINDOW ACTIONS ────────────────────────────────────────────────────────────

window._stgToggleChangePasscode = function() {
	var wrap = document.getElementById('stg-change-passcode-wrap');
	if (!wrap) return;
	var isOpen = wrap.style.display !== 'none';
	wrap.style.display = isOpen ? 'none' : '';
	if (!isOpen) {
		var el = document.getElementById('stg-current-passcode');
		if (el) el.focus();
	} else {
		// Clear fields on close
		['stg-current-passcode', 'stg-new-passcode', 'stg-confirm-passcode'].forEach(function(id) {
			var el = document.getElementById(id);
			if (el) el.value = '';
		});
		var s = document.getElementById('stg-change-passcode-status');
		if (s) { s.textContent = ''; s.className = 'stg-status'; }
	}
};

window._stgHandleChangePasscode = async function() {
	var currentEl = document.getElementById('stg-current-passcode');
	var newEl = document.getElementById('stg-new-passcode');
	var confirmEl = document.getElementById('stg-confirm-passcode');
	var statusEl = document.getElementById('stg-change-passcode-status');
	var submitBtn = document.getElementById('stg-change-passcode-btn');

	var currentPasscode = String(currentEl ? currentEl.value : '').trim();
	var newPasscode = String(newEl ? newEl.value : '').trim();
	var confirmPasscode = String(confirmEl ? confirmEl.value : '').trim();

	function setStatus(msg, kind) {
		if (!statusEl) return;
		statusEl.textContent = msg;
		statusEl.className = 'stg-status ' + (kind === 'err' ? 'stg-status-error' : kind === 'ok' ? 'stg-status-success' : 'stg-status-info');
	}

	if (!currentPasscode) { setStatus('Current passcode is required.', 'err'); return; }
	if (!newPasscode) { setStatus('New passcode is required.', 'err'); return; }
	if (newPasscode.length < 6) { setStatus('New passcode must be at least 6 characters.', 'err'); return; }
	if (newPasscode !== confirmPasscode) { setStatus('New passcodes do not match.', 'err'); return; }
	if (newPasscode === currentPasscode) { setStatus('New passcode must differ from current.', 'err'); return; }

	var auth = _stgGetSessionInfo();
	if (!auth || !auth.token) { setStatus('You must be logged in.', 'err'); return; }

	if (submitBtn) submitBtn.disabled = true;
	setStatus('Updating...', '');

	try {
		var endpoint = String(
			window.AUTH_PRIMARY_ENDPOINT ||
			(window.AUTH_ENDPOINTS && window.AUTH_ENDPOINTS.login) ||
			''
		).trim();
		if (!endpoint) throw new Error('Auth endpoint not configured.');

		var tabs = window.AUTH_SHEET_TABS || { users: 'AuthUsers_v1', profiles: 'UserProfiles_v1', audit: 'AuthAudit_v1' };
		var url = endpoint + (endpoint.includes('?') ? '&' : '?') + 'action=auth.changePasscode';

		var resp = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
			body: 'payload=' + encodeURIComponent(JSON.stringify({
				token: auth.token,
				currentPasscode: currentPasscode,
				newPasscode: newPasscode,
				tabs: tabs
			})),
			credentials: 'omit',
			referrerPolicy: 'no-referrer'
		});

		if (!resp.ok) throw new Error('HTTP ' + resp.status);
		var result = await resp.json();

		if (result && result.ok) {
			setStatus('Passcode updated.', 'ok');
			if (currentEl) currentEl.value = '';
			if (newEl) newEl.value = '';
			if (confirmEl) confirmEl.value = '';

			// Update saved browser credential with new passcode
			if (window.PasswordCredential && auth.email) {
				try {
					var cred = new PasswordCredential({ id: auth.email, password: newPasscode, name: auth.email });
					navigator.credentials.store(cred);
				} catch (_) { /* optional */ }
			}

			setTimeout(function() { window._stgToggleChangePasscode(); }, 2000);
		} else {
			setStatus(String(result && result.error ? result.error : 'Failed to update passcode.'), 'err');
		}
	} catch (err) {
		setStatus(String(err && err.message ? err.message : 'Could not reach auth service.'), 'err');
	} finally {
		if (submitBtn) submitBtn.disabled = false;
	}
};

window._stgStartEdit = function() {
	_stg.editing = true;
	settingsRender();
	const modal = document.querySelector('#data-modal .modal-body');
	if (modal) modal.scrollTo({ top: 0, behavior: 'smooth' });
};

window._stgCancelEdit = function() {
	_stg.editing = false;
	settingsRender();
};

window._stgSaveProfile = settingsSaveProfile;

window._stgHandleLogin = async function() {
	const emailEl = document.getElementById('stg-login-email');
	const passcodeEl = document.getElementById('stg-login-passcode');
	const statusEl = document.getElementById('stg-login-status');
	const loginBtn = document.getElementById('stg-login-btn');

	const email = String(emailEl ? emailEl.value : '').trim().toLowerCase();
	const passcode = String(passcodeEl ? passcodeEl.value : '').trim();

	if (!email) { if (statusEl) { statusEl.textContent = 'Email is required.'; statusEl.className = 'stg-status stg-status-error'; } return; }
	if (!passcode) { if (statusEl) { statusEl.textContent = 'Passcode is required.'; statusEl.className = 'stg-status stg-status-error'; } return; }

	if (loginBtn) loginBtn.disabled = true;
	if (statusEl) { statusEl.textContent = 'Verifying...'; statusEl.className = 'stg-status stg-status-info'; }

	try {
		const result = await _stgAttemptLogin(email, passcode);
		const authenticated = result && result.ok === true && result.session;

		if (authenticated) {
			_stgWriteAuthSession(result, email);

			// Prompt browser to save credentials
			if (window.PasswordCredential) {
				try {
					var cred = new PasswordCredential({ id: email, password: passcode, name: email });
					navigator.credentials.store(cred);
				} catch (_) { /* optional — silently ignore */ }
			}

			_stg.email = email;
			_stg.role = String((result.session && result.session.role) || '').trim().toLowerCase();
			_stg.loading = true;
			_stg.error = null;
			_stg.profile = null;
			settingsRender();

			try {
				const auth = _stgGetSessionInfo();
				_stg.profile = auth ? await settingsFetchProfile(auth) : null;
				_stgApplySavedTheme(_stg.profile);
			} catch (err) {
				_stg.error = err.message;
			}
			_stg.loading = false;
			settingsRender();
			if (typeof syncPreLoginAppVisibility === 'function') syncPreLoginAppVisibility();
		} else {
			const msg = (result && result.error) ? String(result.error) : 'Access denied. Check credentials.';
			if (statusEl) { statusEl.textContent = msg; statusEl.className = 'stg-status stg-status-error'; }
		}
	} catch (err) {
		if (statusEl) { statusEl.textContent = 'Could not reach the auth service. Please try again.'; statusEl.className = 'stg-status stg-status-error'; }
	} finally {
		if (loginBtn) loginBtn.disabled = false;
	}
};

window._stgSignOut = function() {
	try {
		const authKey = (typeof AUTH_SESSION_KEY !== 'undefined' && AUTH_SESSION_KEY)
			? AUTH_SESSION_KEY
			: 'aos_auth_session_v1';
		localStorage.removeItem(authKey);
	} catch { /* ignore */ }
	_stg.profile = null;
	_stg.email = '';
	_stg.role = '';
	_stg.editing = false;
	_stg.error = null;
	settingsRender();
	if (typeof syncPreLoginAppVisibility === 'function') syncPreLoginAppVisibility();
};

window._stgRetryFetch = async function() {
	const auth = _stgGetSessionInfo();
	if (!auth) return;
	_stg.loading = true;
	_stg.error = null;
	settingsRender();
	try {
		_stg.profile = await settingsFetchProfile(auth);
	} catch (err) {
		_stg.error = err.message;
	}
	_stg.loading = false;
	settingsRender();
};

// ── ENTRY POINTS ──────────────────────────────────────────────────────────────

async function openSettingsApp() {
	settingsEnsureStyles();

	const backText = document.getElementById('modal-back-text');
	const backBtn = document.getElementById('modal-back-btn');
	const title = document.getElementById('modal-title');
	const subtitle = document.getElementById('modal-subtitle');
	const container = document.getElementById('modal-body-container');
	const modal = document.getElementById('data-modal');
	if (!modal || !container) return;

	backText.innerText = 'BACK';
	backBtn.onclick = function() { closeModal(); };
	title.innerHTML = '<span style="filter:none !important; text-shadow:none !important; margin-right:8px;">\u2699\ufe0f</span>SETTINGS';
	subtitle.innerText = 'PROFILE & PREFERENCES';

	container.innerHTML = '<div id="stg-content"></div>';
	modal.classList.add('active');

	const auth = _stgGetSessionInfo();
	_stg.editing = false;
	_stg.saving = false;

	if (auth) {
		_stg.email = auth.email;
		_stg.role = auth.role;
		_stg.loading = true;
		_stg.error = null;
		_stg.profile = null;
		settingsRender();

		try {
			_stg.profile = await settingsFetchProfile(auth);
			_stgApplySavedTheme(_stg.profile);
		} catch (err) {
			_stg.error = err.message;
		}
		_stg.loading = false;
	} else {
		_stg.email = '';
		_stg.role = '';
		_stg.profile = null;
		_stg.loading = false;
		_stg.error = null;
	}

	settingsRender();
	if (typeof bounceModalBodyToTop === 'function') bounceModalBodyToTop();
}

function openThemesApp() {
	openSettingsApp();
}

window.openSettingsApp = openSettingsApp;
window.openThemesApp = openThemesApp;

if (typeof installAppAnchorSync === 'function') {
	installAppAnchorSync();
}
