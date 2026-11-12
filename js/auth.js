/**
 * Chronicle Authentication & Session Management
 * Handles guest state, clean authentication, session sync, dropdown clicks, and logout.
 */
var ChronicleAuth = (function () {
  const STORAGE_KEY = 'chronicle_active_session_v3';
  const THEME_KEY = 'chronicle_theme_v2';

  // Get current session or null (requires valid signed JWT token)
  function getUser() {
    try {
      const token = getToken();
      if (!token) return null;

      const stored = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.isLoggedIn) return parsed;
      }
    } catch (e) {
      console.warn('Session retrieval error', e);
    }
    return null;
  }

  // Generate initials avatar SVG or URL
  function generateAvatar(name) {
    const cleanName = (name || 'User').trim();
    const initials = cleanName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=c95123&color=fff&size=128&bold=true`;
  }

  // HTML entity escaper to protect template string rendering from XSS/injection
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  const ALLOWED_TAGS = new Set([
    'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'strong', 'b', 'em', 'i', 'u', 's', 'strike',
    'blockquote', 'pre', 'code', 'ul', 'ol', 'li',
    'a', 'img', 'hr', 'br', 'table', 'thead', 'tbody',
    'tr', 'th', 'td', 'span', 'div'
  ]);

  // Strict HTML allowlist sanitizer for rich article content
  function sanitizeHtml(html) {
    if (!html || typeof html !== 'string') return '';
    let clean = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '');

    clean = clean.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (match, tagName, attrs) => {
      const tag = tagName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) return '';
      if (match.startsWith('</')) return `</${tag}>`;

      let sanitizedAttrs = '';
      const attrRegex = /([a-zA-Z0-9_-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
      let attrMatch;

      while ((attrMatch = attrRegex.exec(attrs)) !== null) {
        const attrName = attrMatch[1].toLowerCase();
        const attrValue = attrMatch[2] !== undefined ? attrMatch[2] : (attrMatch[3] !== undefined ? attrMatch[3] : (attrMatch[4] || ''));

        if (attrName.startsWith('on')) continue;

        if (attrName === 'href' && tag === 'a') {
          const val = attrValue.trim().toLowerCase();
          if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('mailto:') || val.startsWith('#') || val.startsWith('/')) {
            sanitizedAttrs += ` href="${encodeURI(attrValue.trim())}" rel="noopener noreferrer"`;
          }
        } else if (attrName === 'src' && tag === 'img') {
          const val = attrValue.trim().toLowerCase();
          if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/')) {
            sanitizedAttrs += ` src="${encodeURI(attrValue.trim())}"`;
          }
        } else if (attrName === 'alt' || attrName === 'title') {
          sanitizedAttrs += ` ${attrName}="${attrValue.replace(/"/g, '&quot;')}"`;
        } else if (attrName === 'class') {
          const safeClass = attrValue.replace(/[^a-zA-Z0-9-_\s]/g, '').trim();
          if (safeClass) sanitizedAttrs += ` class="${safeClass}"`;
        }
      }

      const isSelfClosing = match.endsWith('/>') || tag === 'br' || tag === 'hr' || tag === 'img';
      return `<${tag}${sanitizedAttrs}${isSelfClosing ? ' /' : ''}>`;
    });

    return clean;
  }

  const TOKEN_KEY = 'chronicle_token';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  }

  // Generic API helper; throws Error(message) on non-2xx responses.
  async function apiFetch(path, options = {}) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers);
    const token = getToken();
    if (token) headers.Authorization = 'Bearer ' + token;
    const res = await fetch('/api' + path, Object.assign({}, options, { headers }));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Request failed (' + res.status + ')');
    return data;
  }

  function saveSession(data, remember) {
    const store = remember ? localStorage : sessionStorage;
    store.setItem(STORAGE_KEY, JSON.stringify(data.user));
    store.setItem(TOKEN_KEY, data.token);
    updateNavUI();
    updatePageAuthElements();
    return data.user;
  }

  async function loginApi(email, password, remember = true) {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    return saveSession(data, remember);
  }

  async function registerApi(name, email, password) {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    return saveSession(data, true);
  }

  function login(email, password, remember = true) {
    return loginApi(email, password, remember);
  }

  function register(name, email, password) {
    return registerApi(name, email, password);
  }

  function showToastNotification(message, type = 'info') {
    if (typeof window.showToast === 'function') {
      window.showToast(message, type);
      return;
    }
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    const color = type === 'success' ? 'bg-emerald-600 text-white' : type === 'error' ? 'bg-rose-600 text-white' : 'bg-[var(--text-primary)] text-[var(--bg-primary)]';
    toast.className = `px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0 ${color}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.remove('translate-y-2', 'opacity-0'));
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function logout() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.warn('Error clearing session', e);
    }
    updateNavUI();

    showToastNotification('Signing out of workspace... 👋', 'info');

    if (document.body) {
      document.body.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
      document.body.style.opacity = '0.35';
      document.body.style.transform = 'scale(0.995)';
    }

    setTimeout(() => {
      window.location.href = 'login.html?logged_out=1';
    }, 400);
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved ? saved === 'dark' : prefersDark;

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    
    // Update all theme icons across the page
    const icons = document.querySelectorAll('[data-theme-icon], #themeIcon');
    icons.forEach(ic => {
      ic.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
    });
    
    if (window.lucide) window.lucide.createIcons();

    if (typeof showToast === 'function') {
      showToast(isDark ? 'Switched to Dark mode 🌙' : 'Switched to Light mode ☀️', 'info');
    }

    return isDark;
  }

  function updateNavUI() {
    const user = getUser();
    const navUserSlots = document.querySelectorAll('.chronicle-nav-user-slot');

    navUserSlots.forEach(slot => {
      if (user && user.isLoggedIn) {
        const isClient = (user.role || '').toLowerCase().includes('client') || (user.role || '').toLowerCase().includes('reader');
        const safeName = escapeHtml(user.name || 'User');
        const safeFirstName = escapeHtml((user.name || 'User').split(' ')[0]);
        const safeEmail = escapeHtml(user.email || '');
        const safeRole = escapeHtml(user.role || 'Member');
        const safeAvatar = escapeHtml(user.avatar || generateAvatar(user.name));

        // Authenticated State in Navbar with responsive click-toggle dropdown
        slot.innerHTML = `
          <div class="flex items-center gap-2.5">
            <a href="dashboard.html" class="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-xs font-bold transition-all shadow-xs">
              <i data-lucide="layout-dashboard" class="w-3.5 h-3.5"></i>
              <span class="hidden sm:inline">${isClient ? 'Client Portal' : 'Dashboard'}</span>
            </a>
            <div class="relative auth-dropdown-container">
              <button type="button" class="auth-profile-trigger flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-[var(--accent-primary)] transition-all cursor-pointer">
                <img src="${safeAvatar}" alt="${safeName}" class="w-8 h-8 rounded-full object-cover border border-[var(--border-subtle)] pointer-events-none">
                <span class="hidden md:block text-xs font-semibold text-[var(--text-primary)] max-w-[120px] truncate pointer-events-none">${safeFirstName}</span>
                <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-[var(--text-muted)] hidden md:block pointer-events-none"></i>
              </button>
              <div class="auth-profile-dropdown hidden absolute right-0 mt-2 w-56 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xl py-2 z-50">
                <div class="px-4 py-2.5 border-b border-[var(--border-subtle)]">
                  <p class="text-xs font-bold text-[var(--text-primary)] truncate">${safeName}</p>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <span class="text-[10px] px-2 py-0.2 rounded font-semibold ${isClient ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200' : 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200'}">${safeRole}</span>
                  </div>
                  <p class="text-[11px] text-[var(--text-muted)] truncate mt-0.5">${safeEmail}</p>
                </div>
                <a href="dashboard.html" class="flex items-center gap-2 px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]">
                  <i data-lucide="layout-dashboard" class="w-4 h-4 text-[var(--accent-primary)]"></i>
                  <span>${isClient ? 'Client Portal' : 'Author Studio'}</span>
                </a>
                ${!isClient ? `
                <a href="create-blog.html" class="flex items-center gap-2 px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]">
                  <i data-lucide="square-pen" class="w-4 h-4 text-[var(--accent-primary)]"></i>
                  <span>Write New Story</span>
                </a>` : ''}
                <a href="index.html#stories" class="flex items-center gap-2 px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]">
                  <i data-lucide="newspaper" class="w-4 h-4"></i>
                  <span>Browse Articles Feed</span>
                </a>
                <div class="my-1 border-t border-[var(--border-subtle)]"></div>
                <button type="button" data-auth-logout class="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left cursor-pointer transition-colors">
                  <i data-lucide="log-out" class="w-4 h-4"></i>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        `;
      } else {
        // Guest State in Navbar: prominent Log In and Get Started
        slot.innerHTML = `
          <div class="flex items-center gap-2 sm:gap-3">
            <a href="login.html" class="px-3.5 py-1.5 rounded-full text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors">
              Log In
            </a>
            <a href="login.html?tab=register" class="px-4 py-2 rounded-full text-xs font-bold bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white shadow-sm hover:shadow transition-all flex items-center gap-1.5">
              <span>Get Started</span>
              <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </a>
          </div>
        `;
      }
    });

    if (window.lucide) window.lucide.createIcons();
  }

  // Update hero & banners on index.html if user is logged in
  function updatePageAuthElements() {
    const user = getUser();
    const heroActionGroup = document.getElementById('heroActionGroup');
    const bottomCtaGroup = document.getElementById('bottomCtaGroup');
    const bottomCtaText = document.getElementById('bottomCtaText');

    if (user && user.isLoggedIn) {
      if (heroActionGroup) {
        heroActionGroup.innerHTML = `
          <a href="dashboard.html" class="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-xs font-bold uppercase tracking-wider shadow-lg hover:shadow-orange-500/25 transition-all flex items-center justify-center gap-2">
            <i data-lucide="layout-dashboard" class="w-4 h-4"></i>
            <span>Go to My Dashboard</span>
          </a>
          <a href="create-blog.html" class="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] border border-[var(--border-medium)] text-[var(--text-primary)] text-xs font-bold transition-all flex items-center justify-center gap-2">
            <i data-lucide="square-pen" class="w-4 h-4 text-[var(--accent-primary)]"></i>
            <span>Write New Story</span>
          </a>
        `;
      }

      if (bottomCtaText) {
        bottomCtaText.textContent = `Welcome back, ${user.name}! Your author studio and publications are ready.`;
      }

      if (bottomCtaGroup) {
        bottomCtaGroup.innerHTML = `
          <a href="dashboard.html" class="w-full sm:w-auto px-7 py-3 rounded-full bg-white text-orange-950 font-bold text-xs uppercase tracking-wider hover:bg-orange-50 transition-colors shadow-md flex items-center justify-center gap-2">
            <i data-lucide="layout-dashboard" class="w-4 h-4"></i>
            <span>Open Author Dashboard</span>
          </a>
          <a href="create-blog.html" class="w-full sm:w-auto px-7 py-3 rounded-full bg-black/25 hover:bg-black/40 text-white font-bold text-xs uppercase tracking-wider transition-colors border border-white/20 flex items-center justify-center gap-2">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>Compose New Story</span>
          </a>
        `;
      }

      if (window.lucide) window.lucide.createIcons();
    }
  }

  // Setup click listeners for dropdown toggle & outside click
  function setupDropdownListeners() {
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('.auth-profile-trigger');
      const logoutBtn = e.target.closest('[data-auth-logout]');

      // Handle Logout click
      if (logoutBtn) {
        e.preventDefault();
        e.stopPropagation();
        logout();
        return;
      }

      // Handle Profile dropdown toggle
      if (trigger) {
        e.preventDefault();
        e.stopPropagation();
        const container = trigger.closest('.auth-dropdown-container');
        const dropdown = container ? container.querySelector('.auth-profile-dropdown') : null;
        if (dropdown) {
          dropdown.classList.toggle('hidden');
        }
        return;
      }

      // Close open dropdowns if clicked outside
      if (!e.target.closest('.auth-dropdown-container')) {
        document.querySelectorAll('.auth-profile-dropdown').forEach(dd => dd.classList.add('hidden'));
      }
    });
  }

  // Auto-run setup
  initTheme();
  document.addEventListener('DOMContentLoaded', () => {
    updateNavUI();
    updatePageAuthElements();
    setupDropdownListeners();
    const toggleBtns = document.querySelectorAll('[data-theme-toggle]');
    toggleBtns.forEach(btn => btn.addEventListener('click', toggleTheme));
  });

  const api = {
    getUser,
    login,
    register,
    loginApi,
    registerApi,
    apiFetch,
    getToken,
    logout,
    toggleTheme,
    updateNavUI,
    updatePageAuthElements,
    escapeHtml,
    sanitizeHtml
  };

  // Explicitly attach to global window
  if (typeof window !== 'undefined') {
    window.ChronicleAuth = api;
  }

  return api;
})();
