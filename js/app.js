/**
 * Chronicle Blog Application - Core Logic & State Management
 */

(function () {
  'use strict';

  // ============================================================
  // APP STATE
  // ============================================================
  const STORAGE_KEYS = {
    ARTICLES: 'chronicle_articles_v2',
    BOOKMARKS: 'chronicle_bookmarks_v2',
    LIKES: 'chronicle_likes_v2',
    THEME: 'chronicle_theme_v2',
    AUTHORS_FOLLOWED: 'chronicle_followed_v2'
  };

  let articles = loadStoredArticles();
  let bookmarks = loadFromStorage(STORAGE_KEYS.BOOKMARKS, []);
  let likedArticles = loadFromStorage(STORAGE_KEYS.LIKES, []);
  let followedAuthors = loadFromStorage(STORAGE_KEYS.AUTHORS_FOLLOWED, []);
  let currentCategory = 'All Stories';
  let currentTag = 'All';
  let currentReadingTime = 'all';
  let currentSearchQuery = '';
  let currentSort = 'latest';
  let viewMode = 'grid'; // 'grid' | 'list' | 'manage'
  let pendingDeleteId = null;
  let currentArticle = null;
  let isAudioPlaying = false;

  // Preset Unsplash cover images for the Write modal
  const PRESET_COVERS = [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80'
  ];

  // ============================================================
  // DOM ELEMENTS
  // ============================================================
  const el = {
    // Nav & Theme
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeIcon: document.getElementById('themeIcon'),
    brandLogoBtn: document.getElementById('brandLogoBtn'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    mobileDrawerBackdrop: document.getElementById('mobileDrawerBackdrop'),
    mobileDrawerPanel: document.getElementById('mobileDrawerPanel'),
    closeMobileDrawerBtn: document.getElementById('closeMobileDrawerBtn'),
    mobileCategoriesList: document.getElementById('mobileCategoriesList'),
    mobileBookmarksLink: document.getElementById('mobileBookmarksLink'),
    mobileBookmarkCount: document.getElementById('mobileBookmarkCount'),
    mobileWriteBtn: document.getElementById('mobileWriteBtn'),
    headerSearchInput: document.getElementById('headerSearchInput'),

    // Bookmarks Drawer
    openBookmarksBtn: document.getElementById('openBookmarksBtn'),
    closeBookmarksBtn: document.getElementById('closeBookmarksBtn'),
    bookmarksBackdrop: document.getElementById('bookmarksBackdrop'),
    bookmarksPanel: document.getElementById('bookmarksPanel'),
    bookmarksList: document.getElementById('bookmarksList'),
    bookmarkBadge: document.getElementById('bookmarkBadge'),
    bookmarksDrawerCount: document.getElementById('bookmarksDrawerCount'),
    mobileBottomBookmarkBadge: document.getElementById('mobileBottomBookmarkBadge'),

    // Search Modal
    quickSearchBtn: document.getElementById('quickSearchBtn'),
    mobileSearchBtn: document.getElementById('mobileSearchBtn'),
    searchModal: document.getElementById('searchModal'),
    closeSearchModalBtn: document.getElementById('closeSearchModalBtn'),
    searchInput: document.getElementById('searchInput'),
    searchResultsList: document.getElementById('searchResultsList'),

    // Write / Edit Modal
    openWriteModalBtn: document.getElementById('openWriteModalBtn'),
    writeStoryModal: document.getElementById('writeStoryModal'),
    closeWriteModalBtn: document.getElementById('closeWriteModalBtn'),
    cancelWriteModalBtn: document.getElementById('cancelWriteModalBtn'),
    writeStoryForm: document.getElementById('writeStoryForm'),
    randomCoverBtn: document.getElementById('randomCoverBtn'),
    newPostCover: document.getElementById('newPostCover'),
    writeModalHeading: document.getElementById('writeModalHeading'),
    writeModalSubheading: document.getElementById('writeModalSubheading'),
    writeModalSubmitBtn: document.getElementById('writeModalSubmitBtn'),
    writeModalSubmitLabel: document.getElementById('writeModalSubmitLabel'),
    editPostId: document.getElementById('editPostId'),
    writeWordCount: document.getElementById('writeWordCount'),
    writeReadTime: document.getElementById('writeReadTime'),

    // Delete Confirmation Modal
    deleteConfirmModal: document.getElementById('deleteConfirmModal'),
    deleteConfirmMessage: document.getElementById('deleteConfirmMessage'),
    cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),

    // Feed Controls, Filters & Layout
    heroSection: document.getElementById('heroSection'),
    categoriesRail: document.getElementById('categoriesRail'),
    tagsRail: document.getElementById('tagsRail'),
    feedSearchInput: document.getElementById('feedSearchInput'),
    clearFeedSearchBtn: document.getElementById('clearFeedSearchBtn'),
    readTimeFilter: document.getElementById('readTimeFilter'),
    sortSelect: document.getElementById('sortSelect'),
    viewGridBtn: document.getElementById('viewGridBtn'),
    viewListBtn: document.getElementById('viewListBtn'),
    viewManageBtn: document.getElementById('viewManageBtn'),
    feedComposeBtn: document.getElementById('feedComposeBtn'),
    managerNewPostBtn: document.getElementById('managerNewPostBtn'),
    activeFiltersSummaryBar: document.getElementById('activeFiltersSummaryBar'),
    feedResultCount: document.getElementById('feedResultCount'),
    activeFilterChips: document.getElementById('activeFilterChips'),
    clearAllFiltersBtn: document.getElementById('clearAllFiltersBtn'),
    articlesFeed: document.getElementById('articlesFeed'),
    blogManagerView: document.getElementById('blogManagerView'),
    blogManagerTableBody: document.getElementById('blogManagerTableBody'),
    emptyFeedState: document.getElementById('emptyFeedState'),
    resetFiltersBtn: document.getElementById('resetFiltersBtn'),
    loadMoreBtn: document.getElementById('loadMoreBtn'),

    // Sidebar
    trendingWidgetList: document.getElementById('trendingWidgetList'),
    topicsCloud: document.getElementById('topicsCloud'),
    topAuthorsList: document.getElementById('topAuthorsList'),
    newsletterForm: document.getElementById('newsletterForm'),
    newsletterSuccess: document.getElementById('newsletterSuccess'),

    // Reader View
    readerModal: document.getElementById('readerModal'),
    closeReaderBtn: document.getElementById('closeReaderBtn'),
    readingProgressBar: document.getElementById('readingProgressBar'),
    readerCategory: document.getElementById('readerCategory'),
    readerReadTime: document.getElementById('readerReadTime'),
    readerDate: document.getElementById('readerDate'),
    readerTitle: document.getElementById('readerTitle'),
    readerAuthorAvatar: document.getElementById('readerAuthorAvatar'),
    readerAuthorName: document.getElementById('readerAuthorName'),
    readerAuthorRole: document.getElementById('readerAuthorRole'),
    readerFollowBtn: document.getElementById('readerFollowBtn'),
    readerCoverImage: document.getElementById('readerCoverImage'),
    readerContent: document.getElementById('readerContent'),
    readerTags: document.getElementById('readerTags'),
    readerClapBtn: document.getElementById('readerClapBtn'),
    readerHeartIcon: document.getElementById('readerHeartIcon'),
    readerClapsCount: document.getElementById('readerClapsCount'),
    readerCommentsCount: document.getElementById('readerCommentsCount'),
    scrollToCommentsBtn: document.getElementById('scrollToCommentsBtn'),
    readerBookmarkBtn: document.getElementById('readerBookmarkBtn'),
    readerBookmarkFloatingBtn: document.getElementById('readerBookmarkFloatingBtn'),
    readerShareBtn: document.getElementById('readerShareBtn'),
    readerShareFloatingBtn: document.getElementById('readerShareFloatingBtn'),
    readerAudioToggleBtn: document.getElementById('readerAudioToggleBtn'),
    relatedArticlesGrid: document.getElementById('relatedArticlesGrid'),

    // Comments
    commentForm: document.getElementById('commentForm'),
    commentInput: document.getElementById('commentInput'),
    commentsContainer: document.getElementById('commentsContainer'),
    commentsTotalBadge: document.getElementById('commentsTotalBadge'),

    // Mobile Bottom Nav
    mobileNavHome: document.getElementById('mobileNavHome'),
    mobileNavSearch: document.getElementById('mobileNavSearch'),
    mobileNavWrite: document.getElementById('mobileNavWrite'),
    mobileNavBookmarks: document.getElementById('mobileNavBookmarks'),

    // Toast
    toastContainer: document.getElementById('toastContainer')
  };

  // ============================================================
  // INITIALIZATION
  // ============================================================
  function applyViewModeFromHash() {
    const isStoriesFeedOnly = window.location.hash === '#stories';
    const landingSections = [
      document.getElementById('landingHero'),
      document.getElementById('features'),
      document.getElementById('why-chronicle'),
      document.getElementById('bottomCtaSection')
    ];
    landingSections.forEach(sec => {
      if (sec) sec.classList.toggle('hidden', isStoriesFeedOnly);
    });
    if (isStoriesFeedOnly) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  function init() {
    initTheme();
    applyViewModeFromHash();
    window.addEventListener('hashchange', applyViewModeFromHash);
    renderHero();
    renderCategories();
    renderTagsRail();
    renderArticles();
    renderTrendingWidget();
    renderTopicsCloud();
    renderAuthors();
    updateBookmarkBadges();
    setupEventListeners();
    refreshIcons();
    syncArticlesFromServer();
  }

  // Pull published blogs from the backend and merge them with the local cache
  async function syncArticlesFromServer() {
    try {
      const res = await fetch('/api/blogs');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.blogs) && data.blogs.length > 0) {
        const remote = data.blogs.map(b => ({
          ...b,
          coverImage: b.coverImage || PRESET_COVERS[0]
        }));
        articles = remote;
        saveArticles();
        renderHero();
        renderCategories();
        renderTagsRail();
        renderArticles();
        renderTrendingWidget();
        renderAuthors();
        refreshIcons();
      }
    } catch (e) {
      console.warn('Backend unavailable, using local articles', e);
    }
  }

  // ============================================================
  // LOCAL STORAGE HELPERS
  // ============================================================
  function loadStoredArticles() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ARTICLES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not load stored articles', e);
    }
    return (typeof INITIAL_ARTICLES !== 'undefined' && Array.isArray(INITIAL_ARTICLES) && INITIAL_ARTICLES.length > 0)
      ? [...INITIAL_ARTICLES]
      : [];
  }

  function saveArticles() {
    try {
      localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(articles));
    } catch (e) {
      console.warn('Failed to save articles to localStorage', e);
    }
  }

  function loadFromStorage(key, fallback) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function saveToStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn(`Failed to save ${key}`, e);
    }
  }

  // ============================================================
  // THEME MANAGEMENT
  // ============================================================
  function initTheme() {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved ? saved === 'dark' : prefersDark;

    applyTheme(isDark);
  }

  function applyTheme(isDark) {
    if (isDark) {
      document.documentElement.classList.add('dark');
      if (el.themeIcon) el.themeIcon.setAttribute('data-lucide', 'sun');
    } else {
      document.documentElement.classList.remove('dark');
      if (el.themeIcon) el.themeIcon.setAttribute('data-lucide', 'moon');
    }
    localStorage.setItem(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
    refreshIcons();
  }

  function toggleTheme() {
    const isCurrentlyDark = document.documentElement.classList.contains('dark');
    applyTheme(!isCurrentlyDark);
    showToast(isCurrentlyDark ? 'Switched to Light mode' : 'Switched to Dark mode', 'info');
  }

  // ============================================================
  // HERO RENDERING
  // ============================================================
  function renderHero() {
    if (!el.heroSection) return;

    if (articles.length === 0) {
      el.heroSection.innerHTML = `
        <div class="p-8 sm:p-12 rounded-3xl bg-[var(--bg-surface)] border-2 border-dashed border-[var(--border-subtle)] text-center max-w-2xl mx-auto my-4 shadow-xs">
          <div class="w-12 h-12 mx-auto rounded-2xl bg-[var(--accent-surface)] text-[var(--accent-primary)] flex items-center justify-center mb-4">
            <i data-lucide="feather" class="w-6 h-6"></i>
          </div>
          <h3 class="text-xl sm:text-2xl font-bold font-serif-reading text-[var(--text-primary)] mb-2">No dispatches published yet</h3>
          <p class="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-6">
            The publication is fresh. Be the first author to share an engineering breakdown or architectural thesis.
          </p>
          <a href="create-blog.html" class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-xs font-bold uppercase tracking-wider shadow-md transition-all">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>Publish the First Story</span>
          </a>
        </div>
      `;
      refreshIcons();
      return;
    }

    const leadArticle = articles.find(a => a.featured) || articles[0];
    const secondaryArticles = articles.filter(a => a.id !== leadArticle.id).slice(0, 2);

    el.heroSection.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        <!-- Main Lead Feature (8 Cols) -->
        <div class="lg:col-span-8 group cursor-pointer relative overflow-hidden rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between" data-article-id="${leadArticle.id}">
          <div class="relative w-full h-64 sm:h-80 lg:h-96 overflow-hidden">
            <img src="${leadArticle.coverImage || PRESET_COVERS[0]}" alt="${leadArticle.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
            
            <div class="absolute top-4 left-4 flex items-center gap-2">
              <span class="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-orange-600 text-white shadow-md">Featured Dispatch</span>
              <span class="px-3 py-1 rounded-full text-xs font-semibold bg-black/40 backdrop-blur-md text-white border border-white/20">${leadArticle.category}</span>
            </div>

            <div class="absolute bottom-4 left-4 right-4 text-white">
              <div class="flex items-center gap-2 text-xs text-orange-200/90 mb-2">
                <span>${leadArticle.publishedAt}</span>
                <span>•</span>
                <span>${leadArticle.readingTime} min read</span>
              </div>
              <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight font-serif-reading leading-snug group-hover:text-orange-200 transition-colors">
                ${leadArticle.title}
              </h2>
            </div>
          </div>

          <div class="p-6 bg-[var(--bg-surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[var(--border-subtle)]">
            <div class="flex items-center gap-3">
              <img src="${leadArticle.author.avatar}" alt="${leadArticle.author.name}" class="w-10 h-10 rounded-full object-cover border border-[var(--border-subtle)]">
              <div>
                <p class="font-bold text-sm text-[var(--text-primary)]">${leadArticle.author.name}</p>
                <p class="text-xs text-[var(--text-muted)]">${leadArticle.author.role}</p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <span class="text-xs font-semibold text-[var(--accent-primary)] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                Read Dispatch <i data-lucide="arrow-right" class="w-4 h-4"></i>
              </span>
            </div>
          </div>
        </div>

        <!-- Secondary Spotlights (4 Cols) -->
        <div class="lg:col-span-4 flex flex-col gap-6 justify-between">
          ${secondaryArticles.map(art => `
            <div class="flex-1 p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group" data-article-id="${art.id}">
              <div>
                <div class="flex items-center justify-between text-xs mb-3">
                  <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[var(--accent-surface)] text-[var(--accent-primary)]">${art.category}</span>
                  <span class="text-[var(--text-muted)]">${art.readingTime} min read</span>
                </div>
                <h3 class="text-lg font-bold font-serif-reading leading-snug text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors line-clamp-3">
                  ${art.title}
                </h3>
                <p class="mt-2 text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                  ${art.excerpt}
                </p>
              </div>
              <div class="mt-4 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <span class="text-xs font-medium text-[var(--text-secondary)]">${art.author.name}</span>
                <span class="text-xs font-semibold text-[var(--text-muted)] group-hover:text-[var(--text-primary)]">Read story →</span>
              </div>
            </div>
          `).join('')}
        </div>

      </div>
    `;

    // Attach click listeners to hero articles
    el.heroSection.querySelectorAll('[data-article-id]').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-article-id');
        window.location.href = 'blog.html?id=' + encodeURIComponent(id);
      });
    });
  }

  // ============================================================
  // CATEGORIES & FILTERS
  // ============================================================
  function renderCategories() {
    if (!el.categoriesRail) return;

    el.categoriesRail.innerHTML = CATEGORIES.map(cat => {
      const count = cat === 'All Stories'
        ? articles.length
        : articles.filter(a => (a.category || '').toLowerCase() === cat.toLowerCase()).length;

      const isActive = cat.toLowerCase() === currentCategory.toLowerCase();
      return `
        <button class="category-pill px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${isActive ? 'active bg-[var(--text-primary)] text-[var(--bg-surface)] border-[var(--text-primary)] shadow-xs' : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--text-primary)]'}" data-category="${cat}">
          <span>${cat}</span>
          <span class="ml-1 text-[10px] opacity-75">(${count})</span>
        </button>
      `;
    }).join('');

    // Attach click handlers
    el.categoriesRail.querySelectorAll('.category-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        currentCategory = btn.getAttribute('data-category');
        renderCategories();
        renderArticles();
      });
    });

    // Also populate mobile drawer categories
    if (el.mobileCategoriesList) {
      el.mobileCategoriesList.innerHTML = CATEGORIES.filter(c => c !== 'All Stories').map(c => `
        <button class="text-left px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] transition-colors cursor-pointer" data-mobile-cat="${c}">
          ${c}
        </button>
      `).join('');

      el.mobileCategoriesList.querySelectorAll('[data-mobile-cat]').forEach(btn => {
        btn.addEventListener('click', () => {
          currentCategory = btn.getAttribute('data-mobile-cat');
          closeMobileDrawer();
          renderCategories();
          renderArticles();
        });
      });
    }
  }

  function renderTagsRail() {
    if (!el.tagsRail) return;
    const tagSet = new Set();
    articles.forEach(a => {
      if (Array.isArray(a.tags)) {
        a.tags.forEach(t => {
          if (t && String(t).trim()) tagSet.add(String(t).trim().replace(/^#/, ''));
        });
      }
    });

    const tags = Array.from(tagSet);
    const isAll = currentTag === 'All';

    const allBtn = `
      <button class="px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${isAll ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-xs' : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--text-primary)]'}" data-tag="All">
        All
      </button>
    `;

    const tagButtons = tags.map(t => {
      const active = currentTag.toLowerCase() === t.toLowerCase();
      return `
        <button class="px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer whitespace-nowrap ${active ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-xs' : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--text-primary)]'}" data-tag="${t}">
          #${t}
        </button>
      `;
    }).join('');

    el.tagsRail.innerHTML = allBtn + tagButtons;

    el.tagsRail.querySelectorAll('[data-tag]').forEach(btn => {
      btn.addEventListener('click', () => {
        currentTag = btn.getAttribute('data-tag');
        renderTagsRail();
        renderArticles();
      });
    });
  }

  function renderActiveFilters(filteredCount, totalCount) {
    if (el.feedResultCount) {
      if (currentSearchQuery || currentCategory !== 'All Stories' || currentTag !== 'All' || currentReadingTime !== 'all') {
        el.feedResultCount.textContent = `Showing ${filteredCount} of ${totalCount} stories`;
      } else {
        el.feedResultCount.textContent = `${totalCount} dispatches published`;
      }
    }

    if (!el.activeFilterChips) return;
    const chips = [];

    if (currentCategory !== 'All Stories') {
      chips.push(`
        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--accent-surface)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 shadow-xs">
          <span>Topic: ${currentCategory}</span>
          <button type="button" class="cursor-pointer hover:opacity-75 font-bold" data-clear="category" title="Clear category filter">✕</button>
        </span>
      `);
    }

    if (currentTag !== 'All') {
      chips.push(`
        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--accent-surface)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 shadow-xs">
          <span>Tag: #${currentTag}</span>
          <button type="button" class="cursor-pointer hover:opacity-75 font-bold" data-clear="tag" title="Clear tag filter">✕</button>
        </span>
      `);
    }

    if (currentReadingTime !== 'all') {
      const label = currentReadingTime === 'quick' ? '< 4 min' : currentReadingTime === 'medium' ? '4-6 min' : '7+ min';
      chips.push(`
        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--accent-surface)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 shadow-xs">
          <span>Length: ${label}</span>
          <button type="button" class="cursor-pointer hover:opacity-75 font-bold" data-clear="readTime" title="Clear read time filter">✕</button>
        </span>
      `);
    }

    if (currentSearchQuery && currentSearchQuery.trim()) {
      chips.push(`
        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--accent-surface)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 shadow-xs">
          <span>Search: "${currentSearchQuery.trim()}"</span>
          <button type="button" class="cursor-pointer hover:opacity-75 font-bold" data-clear="search" title="Clear search query">✕</button>
        </span>
      `);
    }

    el.activeFilterChips.innerHTML = chips.join('');

    const hasActiveFilters = chips.length > 0;
    if (el.clearAllFiltersBtn) {
      el.clearAllFiltersBtn.classList.toggle('hidden', !hasActiveFilters);
    }

    el.activeFilterChips.querySelectorAll('[data-clear]').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-clear');
        if (type === 'category') currentCategory = 'All Stories';
        if (type === 'tag') currentTag = 'All';
        if (type === 'readTime') {
          currentReadingTime = 'all';
          if (el.readTimeFilter) el.readTimeFilter.value = 'all';
        }
        if (type === 'search') {
          currentSearchQuery = '';
          if (el.feedSearchInput) el.feedSearchInput.value = '';
          if (el.headerSearchInput) el.headerSearchInput.value = '';
          if (el.clearFeedSearchBtn) el.clearFeedSearchBtn.classList.add('hidden');
        }
        renderCategories();
        renderTagsRail();
        renderArticles();
      });
    });
  }

  // ============================================================
  // FEED RENDERING
  // ============================================================
  function getFilteredAndSortedArticles() {
    let result = [...articles];

    // Category filter
    if (currentCategory !== 'All Stories') {
      result = result.filter(a => (a.category || '').toLowerCase() === currentCategory.toLowerCase());
    }

    // Tag filter
    if (currentTag !== 'All') {
      const cleanTag = currentTag.toLowerCase().replace(/^#/, '');
      result = result.filter(a =>
        Array.isArray(a.tags) && a.tags.some(t => String(t).toLowerCase().replace(/^#/, '') === cleanTag)
      );
    }

    // Reading time filter
    if (currentReadingTime === 'quick') {
      result = result.filter(a => (a.readingTime || 1) < 4);
    } else if (currentReadingTime === 'medium') {
      result = result.filter(a => (a.readingTime || 1) >= 4 && (a.readingTime || 1) <= 6);
    } else if (currentReadingTime === 'long') {
      result = result.filter(a => (a.readingTime || 1) >= 7);
    }

    // Inline Search filter
    if (currentSearchQuery && currentSearchQuery.trim()) {
      const q = currentSearchQuery.trim().toLowerCase();
      result = result.filter(a =>
        (a.title && a.title.toLowerCase().includes(q)) ||
        (a.excerpt && a.excerpt.toLowerCase().includes(q)) ||
        (a.content && a.content.toLowerCase().includes(q)) ||
        (a.category && a.category.toLowerCase().includes(q)) ||
        (a.author && a.author.name && a.author.name.toLowerCase().includes(q)) ||
        (Array.isArray(a.tags) && a.tags.some(t => String(t).toLowerCase().includes(q)))
      );
    }

    // Sort order
    if (currentSort === 'latest') {
      // By default order
    } else if (currentSort === 'popular') {
      result.sort((a, b) => (b.claps || 0) - (a.claps || 0));
    } else if (currentSort === 'readTime') {
      result.sort((a, b) => (a.readingTime || 1) - (b.readingTime || 1));
    } else if (currentSort === 'readTimeLong') {
      result.sort((a, b) => (b.readingTime || 1) - (a.readingTime || 1));
    } else if (currentSort === 'titleAZ') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return result;
  }

  function renderBlogManagerTable(items) {
    if (!el.blogManagerTableBody) return;
    if (items.length === 0) {
      el.blogManagerTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="py-12 text-center text-xs text-[var(--text-muted)]">
            <div class="max-w-xs mx-auto space-y-2">
              <p class="font-bold text-[var(--text-primary)]">No dispatches match criteria</p>
              <p>Adjust your search filters or create a new blog post.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    el.blogManagerTableBody.innerHTML = items.map(art => `
      <tr class="hover:bg-[var(--bg-subtle)]/50 transition-colors group">
        <td class="py-3 px-4">
          <div class="flex items-center gap-3">
            <img src="${art.coverImage || PRESET_COVERS[0]}" alt="${art.title}" class="w-12 h-12 rounded-lg object-cover shrink-0 bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
            <div class="min-w-0">
              <a href="blog.html?id=${art.id}" class="font-bold font-serif-reading text-sm text-[var(--text-primary)] hover:text-[var(--accent-primary)] line-clamp-1 transition-colors">
                ${art.title}
              </a>
              <p class="text-[11px] text-[var(--text-muted)] line-clamp-1 mt-0.5">${art.excerpt}</p>
            </div>
          </div>
        </td>
        <td class="py-3 px-4 whitespace-nowrap">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--accent-surface)] text-[var(--accent-primary)]">
            ${art.category}
          </span>
        </td>
        <td class="py-3 px-4 whitespace-nowrap">
          <div class="flex items-center gap-2">
            <img src="${art.author.avatar}" alt="${art.author.name}" class="w-5 h-5 rounded-full object-cover">
            <span class="font-medium text-xs text-[var(--text-secondary)]">${art.author.name}</span>
          </div>
        </td>
        <td class="py-3 px-4 whitespace-nowrap text-[var(--text-muted)]">
          <div class="font-medium">${art.readingTime} min read</div>
          <div class="text-[10px] text-[var(--text-muted)]">${art.publishedAt}</div>
        </td>
        <td class="py-3 px-4 whitespace-nowrap text-[var(--text-muted)]">
          <span class="inline-flex items-center gap-1">
            <i data-lucide="heart" class="w-3.5 h-3.5 text-rose-500 fill-rose-500"></i>
            <span class="font-semibold text-xs">${art.claps || 0}</span>
          </span>
        </td>
        <td class="py-3 px-4 text-right whitespace-nowrap">
          <div class="flex items-center justify-end gap-1.5">
            <a href="blog.html?id=${art.id}" class="p-1.5 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" title="Read story">
              <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
            </a>
            <button class="table-edit-btn p-1.5 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer" data-id="${art.id}" title="Edit dispatch">
              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
            </button>
            <button class="table-delete-btn p-1.5 rounded-lg bg-[var(--bg-subtle)] hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[var(--text-muted)] hover:text-rose-500 transition-colors cursor-pointer" data-id="${art.id}" title="Delete dispatch">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    el.blogManagerTableBody.querySelectorAll('.table-edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal(btn.getAttribute('data-id'));
      });
    });

    el.blogManagerTableBody.querySelectorAll('.table-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        promptDeleteArticle(btn.getAttribute('data-id'));
      });
    });
  }

  function renderArticles() {
    const items = getFilteredAndSortedArticles();
    renderActiveFilters(items.length, articles.length);

    if (viewMode === 'manage') {
      if (el.articlesFeed) el.articlesFeed.classList.add('hidden');
      if (el.blogManagerView) el.blogManagerView.classList.remove('hidden');
      if (el.emptyFeedState) el.emptyFeedState.classList.add('hidden');
      renderBlogManagerTable(items);
      refreshIcons();
      return;
    }

    if (el.blogManagerView) el.blogManagerView.classList.add('hidden');
    if (el.articlesFeed) el.articlesFeed.classList.remove('hidden');

    if (!el.articlesFeed) return;

    if (items.length === 0) {
      el.articlesFeed.innerHTML = '';
      if (el.emptyFeedState) el.emptyFeedState.classList.remove('hidden');
      return;
    }

    if (el.emptyFeedState) el.emptyFeedState.classList.add('hidden');

    // Layout configuration
    if (viewMode === 'grid') {
      el.articlesFeed.className = 'grid grid-cols-1 md:grid-cols-2 gap-6';
    } else {
      el.articlesFeed.className = 'flex flex-col gap-5';
    }

    el.articlesFeed.innerHTML = items.map(art => {
      const isSaved = bookmarks.includes(art.id);
      const isLiked = likedArticles.includes(art.id);
      const tagsList = Array.isArray(art.tags) ? art.tags.slice(0, 3) : [];

      if (viewMode === 'grid') {
        return `
          <div class="story-card rounded-2xl overflow-hidden flex flex-col justify-between group cursor-pointer border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-medium)] transition-all shadow-xs" data-id="${art.id}">
            <!-- Card Image -->
            <div class="story-card-image-wrap relative h-48 w-full bg-[var(--bg-subtle)] overflow-hidden">
              <img src="${art.coverImage || PRESET_COVERS[0]}" alt="${art.title}" class="story-card-image w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
              <span class="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[var(--bg-surface)]/90 backdrop-blur-md text-[var(--accent-primary)] shadow-sm">
                ${art.category}
              </span>
              <button class="bookmark-btn absolute top-3 right-3 w-8 h-8 rounded-full bg-[var(--bg-surface)]/90 backdrop-blur-md flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent-primary)] shadow-sm transition-colors cursor-pointer" data-id="${art.id}" aria-label="Bookmark">
                <i data-lucide="bookmark" class="w-4 h-4 ${isSaved ? 'fill-[var(--accent-primary)] text-[var(--accent-primary)]' : ''}"></i>
              </button>
            </div>

            <!-- Card Body -->
            <div class="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div class="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-2">
                  <span>${art.publishedAt}</span>
                  <span>•</span>
                  <span>${art.readingTime} min read</span>
                </div>
                <h3 class="text-xl font-bold font-serif-reading leading-snug text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors mb-2 line-clamp-2">
                  ${art.title}
                </h3>
                <p class="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed mb-3">
                  ${art.excerpt}
                </p>

                <!-- Card Tag Chips -->
                <div class="flex flex-wrap gap-1 mb-2">
                  ${tagsList.map(t => `<button type="button" class="card-tag-btn px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] border border-transparent transition-colors" data-tag="${t}">#${t}</button>`).join('')}
                </div>
              </div>

              <!-- Author & Action Footer -->
              <div class="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <img src="${art.author.avatar}" alt="${art.author.name}" class="w-6 h-6 rounded-full object-cover border border-[var(--border-subtle)]">
                  <span class="text-xs font-semibold text-[var(--text-primary)] truncate max-w-[90px] sm:max-w-[120px]">${art.author.name}</span>
                </div>
                
                <div class="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <button class="card-clap-btn flex items-center gap-1 hover:text-[var(--accent-primary)] transition-colors cursor-pointer p-1" data-id="${art.id}" title="Appreciate Story">
                    <i data-lucide="heart" class="w-3.5 h-3.5 ${isLiked ? 'fill-red-500 text-red-500' : ''}"></i>
                    <span>${art.claps || 0}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
      } else {
        // List View Mode
        return `
          <div class="story-card rounded-2xl p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-5 group cursor-pointer border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-medium)] transition-all shadow-xs" data-id="${art.id}">
            <div class="flex-1">
              <div class="flex items-center gap-3 text-xs mb-2">
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[var(--accent-surface)] text-[var(--accent-primary)]">${art.category}</span>
                <span class="text-[var(--text-muted)]">${art.publishedAt}</span>
                <span class="text-[var(--text-muted)]">•</span>
                <span class="text-[var(--text-muted)]">${art.readingTime} min read</span>
              </div>
              <h3 class="text-lg sm:text-xl font-bold font-serif-reading text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors mb-2">
                ${art.title}
              </h3>
              <p class="text-xs text-[var(--text-secondary)] line-clamp-2 max-w-xl mb-3">
                ${art.excerpt}
              </p>

              <!-- List Tag Chips -->
              <div class="flex flex-wrap gap-1 mb-3">
                ${tagsList.map(t => `<button type="button" class="card-tag-btn px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] border border-transparent transition-colors" data-tag="${t}">#${t}</button>`).join('')}
              </div>
              
              <div class="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                <div class="flex items-center gap-2">
                  <img src="${art.author.avatar}" alt="${art.author.name}" class="w-5 h-5 rounded-full object-cover">
                  <span class="font-medium text-[var(--text-primary)]">${art.author.name}</span>
                </div>
                <span>•</span>
                <button class="card-clap-btn flex items-center gap-1 hover:text-[var(--accent-primary)] cursor-pointer" data-id="${art.id}" title="Appreciate Story">
                  <i data-lucide="heart" class="w-3.5 h-3.5 ${isLiked ? 'fill-red-500 text-red-500' : ''}"></i>
                  <span>${art.claps || 0} claps</span>
                </button>
              </div>
            </div>

            <!-- List Thumbnail -->
            <div class="w-full sm:w-44 h-36 rounded-xl overflow-hidden shrink-0 bg-[var(--bg-subtle)] relative border border-[var(--border-subtle)]">
              <img src="${art.coverImage || PRESET_COVERS[0]}" alt="${art.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
              <button class="bookmark-btn absolute top-2 right-2 w-7 h-7 rounded-full bg-[var(--bg-surface)]/90 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent-primary)] shadow-sm cursor-pointer" data-id="${art.id}">
                <i data-lucide="bookmark" class="w-3.5 h-3.5 ${isSaved ? 'fill-[var(--accent-primary)] text-[var(--accent-primary)]' : ''}"></i>
              </button>
            </div>
          </div>
        `;
      }
    }).join('');

    // Attach card event listeners
    el.articlesFeed.querySelectorAll('.story-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Prevent opening reader if bookmark, clap, or tag was clicked
        if (
          e.target.closest('.bookmark-btn') ||
          e.target.closest('.card-clap-btn') ||
          e.target.closest('.card-tag-btn')
        ) return;
        const id = card.getAttribute('data-id');
        window.location.href = 'blog.html?id=' + encodeURIComponent(id);
      });
    });

    // Tag button click listeners inside cards
    el.articlesFeed.querySelectorAll('.card-tag-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentTag = btn.getAttribute('data-tag');
        renderTagsRail();
        renderArticles();
      });
    });

    // Bookmark buttons inside feed
    el.articlesFeed.querySelectorAll('.bookmark-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        toggleBookmark(id);
      });
    });

    // Clap buttons inside feed
    el.articlesFeed.querySelectorAll('.card-clap-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        triggerClap(id);
      });
    });

    refreshIcons();
  }

  // ============================================================
  // SIDEBAR WIDGETS
  // ============================================================
  function renderTrendingWidget() {
    if (!el.trendingWidgetList) return;

    const trending = articles.slice(0, 4);
    if (trending.length === 0) {
      el.trendingWidgetList.innerHTML = `
        <div class="py-4 text-center text-xs text-[var(--text-muted)]">
          Stories will appear here once published.
        </div>
      `;
      return;
    }

    el.trendingWidgetList.innerHTML = trending.map((art, idx) => `
      <div class="flex items-start gap-4 cursor-pointer group py-2 border-b border-[var(--border-subtle)] last:border-0" data-trend-id="${art.id}">
        <span class="text-2xl font-black font-serif-reading text-[var(--border-medium)] group-hover:text-[var(--accent-primary)] transition-colors w-7">
          0${idx + 1}
        </span>
        <div class="flex-1">
          <div class="flex items-center gap-2 text-[11px] text-[var(--text-muted)] mb-1">
            <span class="font-semibold text-[var(--text-secondary)]">${art.author.name}</span>
            <span>•</span>
            <span>${art.readingTime} min</span>
          </div>
          <h4 class="text-sm font-bold font-serif-reading text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors leading-snug">
            ${art.title}
          </h4>
        </div>
      </div>
    `).join('');

    el.trendingWidgetList.querySelectorAll('[data-trend-id]').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-trend-id');
        openArticleReader(id);
      });
    });
  }

  function renderTopicsCloud() {
    if (!el.topicsCloud) return;

    el.topicsCloud.innerHTML = FEATURED_TOPICS.map(t => {
      const topicName = typeof t === 'string' ? t : t.name;
      return `
        <button class="topic-chip px-3 py-1.5 rounded-xl text-xs font-medium bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)] transition-colors" data-topic="${topicName}">
          #${topicName}
        </button>
      `;
    }).join('');

    el.topicsCloud.querySelectorAll('[data-topic]').forEach(chip => {
      chip.addEventListener('click', () => {
        const topic = chip.getAttribute('data-topic');
        showToast(`Filtered for #${topic}`, 'info');
        openSearchModal(topic);
      });
    });
  }

  function renderAuthors() {
    if (!el.topAuthorsList) return;

    // Collect distinct authors from actual published articles
    const uniqueAuthorsMap = {};
    articles.forEach(a => {
      if (a.author && a.author.name && !uniqueAuthorsMap[a.author.name]) {
        uniqueAuthorsMap[a.author.name] = a.author;
      }
    });
    const authors = Object.values(uniqueAuthorsMap);

    if (authors.length === 0) {
      el.topAuthorsList.innerHTML = `
        <div class="py-4 text-center text-xs text-[var(--text-muted)]">
          Authors will appear here as dispatches are published.
        </div>
      `;
      return;
    }

    el.topAuthorsList.innerHTML = authors.map(author => {
      const isFollowing = followedAuthors.includes(author.name);
      return `
        <div class="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
          <div class="flex items-center gap-3">
            <img src="${author.avatar}" alt="${author.name}" class="w-10 h-10 rounded-full object-cover border border-[var(--border-subtle)]">
            <div>
              <h5 class="text-xs font-bold text-[var(--text-primary)]">${author.name}</h5>
              <p class="text-[11px] text-[var(--text-muted)] line-clamp-1">${author.role || 'Contributor'}</p>
            </div>
          </div>
          <button class="follow-author-btn px-3 py-1 rounded-full text-xs font-semibold border transition-all ${isFollowing ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)]' : 'border-[var(--border-medium)] text-[var(--text-primary)] hover:border-[var(--text-primary)]'}" data-author="${author.name}">
            ${isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>
      `;
    }).join('');

    el.topAuthorsList.querySelectorAll('.follow-author-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-author');
        toggleFollowAuthor(name);
      });
    });
  }

  function toggleFollowAuthor(name) {
    if (followedAuthors.includes(name)) {
      followedAuthors = followedAuthors.filter(n => n !== name);
      showToast(`Unfollowed ${name}`, 'info');
    } else {
      followedAuthors.push(name);
      showToast(`Now following ${name}!`, 'success');
    }
    saveToStorage(STORAGE_KEYS.AUTHORS_FOLLOWED, followedAuthors);
    renderAuthors();
  }

  // ============================================================
  // ARTICLE READER VIEW
  // ============================================================
  function openArticleReader(articleId) {
    const art = articles.find(a => a.id === articleId);
    if (!art) return;

    currentArticle = art;

    // Reset scroll & audio
    window.scrollTo({ top: 0, behavior: 'instant' });
    isAudioPlaying = false;

    // Populate Reader Fields
    el.readerCategory.textContent = art.category;
    el.readerReadTime.textContent = `${art.readingTime} min read`;
    el.readerDate.textContent = art.publishedAt;
    el.readerTitle.textContent = art.title;
    el.readerAuthorAvatar.src = art.author.avatar;
    el.readerAuthorName.textContent = art.author.name;
    el.readerAuthorRole.textContent = art.author.role;
    el.readerCoverImage.src = art.coverImage;
    el.readerContent.innerHTML = art.content;

    // Follow Button
    const isFollowing = followedAuthors.includes(art.author.name);
    el.readerFollowBtn.textContent = isFollowing ? 'Following' : 'Follow';
    el.readerFollowBtn.className = `px-4 py-1.5 rounded-full border text-xs font-semibold transition-all ${isFollowing ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)]' : 'border-[var(--border-medium)] hover:border-[var(--text-primary)] text-[var(--text-primary)]'}`;
    el.readerFollowBtn.onclick = () => {
      toggleFollowAuthor(art.author.name);
      openArticleReader(art.id);
    };

    // Claps & Likes
    updateReaderClapsUI();

    // Bookmarks
    updateReaderBookmarkUI();

    // Tags
    if (el.readerTags) {
      el.readerTags.innerHTML = (art.tags || []).map(t => `
        <span class="px-3 py-1 rounded-lg text-xs bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
          #${t}
        </span>
      `).join('');
    }

    // Comments
    renderComments();

    // Related Stories
    renderRelatedStories(art);

    // Show Reader Overlay
    el.readerModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Hook scroll listener to readerModal
    el.readerModal.onscroll = updateReadingProgress;

    refreshIcons();
  }

  function closeArticleReader() {
    el.readerModal.classList.add('hidden');
    document.body.style.overflow = '';
    currentArticle = null;
    if (el.readingProgressBar) el.readingProgressBar.style.width = '0%';
  }

  function updateReadingProgress() {
    if (!el.readingProgressBar || !el.readerModal) return;
    const scrollTop = el.readerModal.scrollTop;
    const scrollHeight = el.readerModal.scrollHeight - el.readerModal.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    el.readingProgressBar.style.width = `${progress}%`;
  }

  function updateReaderClapsUI() {
    if (!currentArticle) return;
    const isLiked = likedArticles.includes(currentArticle.id);
    el.readerClapsCount.textContent = currentArticle.claps || 0;

    if (isLiked) {
      el.readerHeartIcon.classList.add('fill-red-500', 'text-red-500');
    } else {
      el.readerHeartIcon.classList.remove('fill-red-500', 'text-red-500');
    }
  }

  function updateReaderBookmarkUI() {
    if (!currentArticle) return;
    const isSaved = bookmarks.includes(currentArticle.id);

    const updateBtn = (btn) => {
      if (!btn) return;
      const icon = btn.querySelector('svg') || btn.querySelector('i');
      if (icon) {
        if (isSaved) {
          icon.classList.add('fill-[var(--accent-primary)]', 'text-[var(--accent-primary)]');
        } else {
          icon.classList.remove('fill-[var(--accent-primary)]', 'text-[var(--accent-primary)]');
        }
      }
    };

    updateBtn(el.readerBookmarkBtn);
    updateBtn(el.readerBookmarkFloatingBtn);
  }

  function triggerClap(articleId) {
    const art = articles.find(a => a.id === articleId);
    if (!art) return;

    if (!art.claps) art.claps = 0;

    const isLiked = likedArticles.includes(articleId);

    if (isLiked) {
      art.claps = Math.max(0, art.claps - 1);
      likedArticles = likedArticles.filter(id => id !== articleId);
      showToast('Removed like', 'info');
    } else {
      art.claps += 1;
      likedArticles.push(articleId);
      showToast('Clapped for story! 👏', 'success');
    }

    saveArticles();
    saveToStorage(STORAGE_KEYS.LIKES, likedArticles);

    if (currentArticle && currentArticle.id === articleId) {
      updateReaderClapsUI();
      if (el.readerClapBtn) {
        el.readerClapBtn.classList.add('animate-clap');
        setTimeout(() => el.readerClapBtn.classList.remove('animate-clap'), 300);
      }
    }

    renderArticles();
  }

  function renderRelatedStories(currentArt) {
    if (!el.relatedArticlesGrid) return;

    const related = articles.filter(a => a.id !== currentArt.id && a.category === currentArt.category).slice(0, 2);
    const fallback = related.length ? related : articles.filter(a => a.id !== currentArt.id).slice(0, 2);

    el.relatedArticlesGrid.innerHTML = fallback.map(art => `
      <div class="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:shadow-md transition-all cursor-pointer group" data-related-id="${art.id}">
        <span class="text-[11px] font-bold uppercase tracking-wider text-[var(--accent-primary)]">${art.category}</span>
        <h5 class="text-base font-bold font-serif-reading text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors mt-1 mb-2 leading-snug">
          ${art.title}
        </h5>
        <div class="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <span>${art.author.name}</span>
          <span>•</span>
          <span>${art.readingTime} min read</span>
        </div>
      </div>
    `).join('');

    el.relatedArticlesGrid.querySelectorAll('[data-related-id]').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-related-id');
        openArticleReader(id);
      });
    });
  }

  // ============================================================
  // COMMENTS INTERACTION
  // ============================================================
  function renderComments() {
    if (!currentArticle || !el.commentsContainer) return;

    const comments = currentArticle.comments || [];
    el.commentsTotalBadge.textContent = comments.length;
    el.readerCommentsCount.textContent = comments.length;

    if (comments.length === 0) {
      el.commentsContainer.innerHTML = `
        <div class="p-6 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-subtle)] rounded-xl">
          No comments yet. Start the conversation!
        </div>
      `;
      return;
    }

    el.commentsContainer.innerHTML = comments.map(c => `
      <div class="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <img src="${c.avatar}" alt="${c.author}" class="w-7 h-7 rounded-full object-cover">
            <div>
              <span class="text-xs font-bold text-[var(--text-primary)]">${c.author}</span>
              <span class="text-[11px] text-[var(--text-muted)] ml-2">${c.date}</span>
            </div>
          </div>
        </div>
        <p class="text-xs text-[var(--text-secondary)] leading-relaxed pl-9">
          ${c.text}
        </p>
      </div>
    `).join('');
  }

  function handleAddComment(e) {
    e.preventDefault();
    if (!currentArticle) return;

    const text = el.commentInput.value.trim();
    if (!text) return;

    if (!currentArticle.comments) currentArticle.comments = [];

    const user = (typeof ChronicleAuth !== 'undefined' && ChronicleAuth.getUser()) ? ChronicleAuth.getUser() : null;
    const authorName = user ? user.name : 'Guest Reader';
    const authorAvatar = user ? user.avatar : 'https://ui-avatars.com/api/?name=Guest+Reader&background=c95123&color=fff';

    const newComment = {
      id: 'c-' + Date.now(),
      author: authorName,
      avatar: authorAvatar,
      date: 'Just now',
      text: text
    };

    currentArticle.comments.unshift(newComment);
    saveArticles();

    el.commentInput.value = '';
    renderComments();
    renderArticles();
    showToast('Your comment was published!', 'success');
  }

  // ============================================================
  // BOOKMARKS MANAGEMENT
  // ============================================================
  function toggleBookmark(articleId) {
    const isSaved = bookmarks.includes(articleId);

    if (isSaved) {
      bookmarks = bookmarks.filter(id => id !== articleId);
      showToast('Removed from reading list', 'info');
    } else {
      bookmarks.push(articleId);
      showToast('Saved to your reading list!', 'success');
    }

    saveToStorage(STORAGE_KEYS.BOOKMARKS, bookmarks);
    updateBookmarkBadges();
    renderBookmarksDrawerList();
    renderArticles();

    if (currentArticle && currentArticle.id === articleId) {
      updateReaderBookmarkUI();
    }
  }

  function updateBookmarkBadges() {
    const count = bookmarks.length;

    if (el.bookmarkBadge) {
      el.bookmarkBadge.textContent = count;
      if (count > 0) el.bookmarkBadge.classList.remove('hidden');
      else el.bookmarkBadge.classList.add('hidden');
    }

    if (el.mobileBookmarkCount) {
      el.mobileBookmarkCount.textContent = count;
    }

    if (el.bookmarksDrawerCount) {
      el.bookmarksDrawerCount.textContent = count;
    }

    if (el.mobileBottomBookmarkBadge) {
      if (count > 0) el.mobileBottomBookmarkBadge.classList.remove('hidden');
      else el.mobileBottomBookmarkBadge.classList.add('hidden');
    }
  }

  function openBookmarksDrawer() {
    renderBookmarksDrawerList();
    el.bookmarksBackdrop.classList.add('active');
    el.bookmarksPanel.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeBookmarksDrawer() {
    el.bookmarksBackdrop.classList.remove('active');
    el.bookmarksPanel.classList.remove('active');
    if (!el.readerModal.classList.contains('hidden')) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  function renderBookmarksDrawerList() {
    if (!el.bookmarksList) return;

    const savedArticles = articles.filter(a => bookmarks.includes(a.id));

    if (savedArticles.length === 0) {
      el.bookmarksList.innerHTML = `
        <div class="py-16 text-center">
          <div class="w-12 h-12 mx-auto rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-[var(--text-muted)] mb-3">
            <i data-lucide="bookmark" class="w-6 h-6"></i>
          </div>
          <p class="font-bold text-sm text-[var(--text-primary)]">Your reading list is empty</p>
          <p class="text-xs text-[var(--text-muted)] mt-1">Tap the bookmark icon on any article to save it for later.</p>
        </div>
      `;
      refreshIcons();
      return;
    }

    el.bookmarksList.innerHTML = savedArticles.map(art => `
      <div class="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-start gap-3 group">
        <img src="${art.coverImage}" alt="${art.title}" class="w-16 h-16 rounded-lg object-cover shrink-0 cursor-pointer" data-read-id="${art.id}">
        <div class="flex-1 min-w-0">
          <span class="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-primary)]">${art.category}</span>
          <h4 class="text-xs font-bold font-serif-reading text-[var(--text-primary)] line-clamp-2 cursor-pointer hover:text-[var(--accent-primary)]" data-read-id="${art.id}">
            ${art.title}
          </h4>
          <span class="text-[10px] text-[var(--text-muted)]">${art.readingTime} min read</span>
        </div>
        <button class="remove-bookmark-btn p-1 rounded text-[var(--text-muted)] hover:text-red-500 transition-colors" data-remove-id="${art.id}" aria-label="Remove">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </div>
    `).join('');

    el.bookmarksList.querySelectorAll('[data-read-id]').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-read-id');
        closeBookmarksDrawer();
        openArticleReader(id);
      });
    });

    el.bookmarksList.querySelectorAll('[data-remove-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-remove-id');
        toggleBookmark(id);
      });
    });

    refreshIcons();
  }

  // ============================================================
  // SEARCH MODAL / COMMAND PALETTE
  // ============================================================
  function openSearchModal(prefill = '') {
    el.searchModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    el.searchInput.value = prefill;
    setTimeout(() => el.searchInput.focus(), 50);
    handleSearch(prefill);
  }

  function closeSearchModal() {
    el.searchModal.classList.remove('active');
    if (el.readerModal.classList.contains('hidden')) {
      document.body.style.overflow = '';
    }
  }

  function handleSearch(query) {
    const q = (query || '').trim().toLowerCase();

    if (!q) {
      el.searchResultsList.innerHTML = `
        <div class="p-8 text-center text-xs text-[var(--text-muted)]">
          Type keywords, tags, or author names to instantly discover dispatches.
        </div>
      `;
      return;
    }

    const matches = articles.filter(art => {
      return (
        art.title.toLowerCase().includes(q) ||
        art.excerpt.toLowerCase().includes(q) ||
        art.category.toLowerCase().includes(q) ||
        art.author.name.toLowerCase().includes(q) ||
        (art.tags || []).some(t => t.toLowerCase().includes(q))
      );
    });

    if (matches.length === 0) {
      el.searchResultsList.innerHTML = `
        <div class="p-8 text-center text-xs text-[var(--text-muted)]">
          No dispatches matching "<span class="font-bold text-[var(--text-primary)]">${query}</span>".
        </div>
      `;
      return;
    }

    el.searchResultsList.innerHTML = matches.map(art => `
      <div class="p-3.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] cursor-pointer flex items-center justify-between group transition-colors" data-search-result-id="${art.id}">
        <div class="flex items-center gap-3">
          <img src="${art.coverImage}" alt="${art.title}" class="w-12 h-12 rounded-lg object-cover">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-primary)]">${art.category}</span>
            <h4 class="text-xs sm:text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] line-clamp-1">
              ${art.title}
            </h4>
            <p class="text-[11px] text-[var(--text-muted)]">${art.author.name} • ${art.readingTime} min read</p>
          </div>
        </div>
        <i data-lucide="chevron-right" class="w-4 h-4 text-[var(--text-muted)] group-hover:translate-x-1 transition-transform"></i>
      </div>
    `).join('');

    el.searchResultsList.querySelectorAll('[data-search-result-id]').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-search-result-id');
        closeSearchModal();
        openArticleReader(id);
      });
    });

    refreshIcons();
  }

  // ============================================================
  // WRITE & EDIT STORY / CRUD OPERATIONS
  // ============================================================
  function updateWriteStats() {
    const title = (document.getElementById('newPostTitle')?.value || '');
    const excerpt = (document.getElementById('newPostExcerpt')?.value || '');
    const body = (document.getElementById('newPostContent')?.value || '');
    const words = (title + ' ' + excerpt + ' ' + body).trim() ? (title + ' ' + excerpt + ' ' + body).trim().split(/\s+/).length : 0;
    const readTime = Math.max(1, Math.round(words / 180));
    if (el.writeWordCount) el.writeWordCount.textContent = `${words} words`;
    if (el.writeReadTime) el.writeReadTime.textContent = `${readTime} min read`;
  }

  function openWriteModal() {
    if (el.editPostId) el.editPostId.value = '';
    if (el.writeModalHeading) el.writeModalHeading.textContent = 'Compose New Dispatch';
    if (el.writeModalSubheading) el.writeModalSubheading.textContent = 'Share your insights with the Chronicle community';
    if (el.writeModalSubmitLabel) el.writeModalSubmitLabel.textContent = 'Publish Story';
    if (el.writeStoryForm) el.writeStoryForm.reset();
    pickPresetCover();
    updateWriteStats();
    el.writeStoryModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function openEditModal(id) {
    const article = articles.find(a => a.id === id);
    if (!article) return;

    if (el.editPostId) el.editPostId.value = article.id;
    if (el.writeModalHeading) el.writeModalHeading.textContent = 'Edit Dispatch';
    if (el.writeModalSubheading) el.writeModalSubheading.textContent = 'Update headline, category, tags, or content';
    if (el.writeModalSubmitLabel) el.writeModalSubmitLabel.textContent = 'Save Changes';

    const titleInput = document.getElementById('newPostTitle');
    const catInput = document.getElementById('newPostCategory');
    const tagsInput = document.getElementById('newPostTags');
    const excerptInput = document.getElementById('newPostExcerpt');
    const contentInput = document.getElementById('newPostContent');

    if (titleInput) titleInput.value = article.title || '';
    if (catInput) catInput.value = article.category || 'Engineering';
    if (el.newPostCover) el.newPostCover.value = article.coverImage || '';
    if (tagsInput) tagsInput.value = Array.isArray(article.tags) ? article.tags.join(', ') : (article.tags || '');
    if (excerptInput) excerptInput.value = article.excerpt || '';

    // Strip lead wrapper if present
    const rawContent = (article.content || '').replace(/^<p class="lead">[\s\S]*?<\/p>\s*/i, '').trim();
    if (contentInput) contentInput.value = rawContent || article.content || '';

    updateWriteStats();
    el.writeStoryModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeWriteModal() {
    el.writeStoryModal.classList.remove('active');
    if (el.readerModal.classList.contains('hidden') && (!el.deleteConfirmModal || el.deleteConfirmModal.classList.contains('hidden'))) {
      document.body.style.overflow = '';
    }
  }

  function pickPresetCover() {
    const random = PRESET_COVERS[Math.floor(Math.random() * PRESET_COVERS.length)];
    if (el.newPostCover) el.newPostCover.value = random;
  }

  // DELETE MODAL HELPERS
  function promptDeleteArticle(id) {
    const article = articles.find(a => a.id === id);
    if (!article) return;
    pendingDeleteId = id;
    if (el.deleteConfirmMessage) {
      el.deleteConfirmMessage.innerHTML = `Are you sure you want to permanently delete <strong class="text-[var(--text-primary)]">"${article.title}"</strong>? This will remove the story from the publication.`;
    }
    if (el.deleteConfirmModal) {
      el.deleteConfirmModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeDeleteModal() {
    pendingDeleteId = null;
    if (el.deleteConfirmModal) {
      el.deleteConfirmModal.classList.add('hidden');
      if (el.readerModal.classList.contains('hidden') && !el.writeStoryModal.classList.contains('active')) {
        document.body.style.overflow = '';
      }
    }
  }

  async function confirmDeleteArticle() {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;

    if (el.confirmDeleteBtn) {
      el.confirmDeleteBtn.disabled = true;
      el.confirmDeleteBtn.textContent = 'Deleting...';
    }

    try {
      const token = typeof ChronicleAuth !== 'undefined' ? ChronicleAuth.getToken() : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = 'Bearer ' + token;

      await fetch('/api/blogs/' + encodeURIComponent(id), {
        method: 'DELETE',
        headers
      });
    } catch (err) {
      console.warn('Backend delete notification:', err.message);
    }

    articles = articles.filter(a => a.id !== id);
    saveArticles();

    if (el.confirmDeleteBtn) {
      el.confirmDeleteBtn.disabled = false;
      el.confirmDeleteBtn.textContent = 'Yes, Delete Story';
    }

    closeDeleteModal();
    renderHero();
    renderCategories();
    renderTagsRail();
    renderArticles();
    renderTrendingWidget();
    renderBlogManagerTable();
    refreshIcons();
    showToast('Dispatch was permanently deleted from publication.', 'info');
  }

  async function handleCreateOrUpdateStory(e) {
    e.preventDefault();

    const editId = el.editPostId ? el.editPostId.value.trim() : '';
    const title = document.getElementById('newPostTitle').value.trim();
    const category = document.getElementById('newPostCategory').value;
    const coverImage = (el.newPostCover ? el.newPostCover.value.trim() : '') || PRESET_COVERS[0];
    const rawTags = document.getElementById('newPostTags').value.trim();
    const excerpt = document.getElementById('newPostExcerpt').value.trim();
    const content = document.getElementById('newPostContent').value.trim();

    if (!title || !content) {
      showToast('Please fill in title and content.', 'error');
      return;
    }

    const tags = rawTags ? rawTags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean) : [category];
    const wordCount = (title + ' ' + excerpt + ' ' + content).split(/\s+/).length;
    const readingTime = Math.max(1, Math.round(wordCount / 180));

    const user = (typeof ChronicleAuth !== 'undefined' && ChronicleAuth.getUser()) || {
      name: 'Sarah Jenkins',
      role: 'Principal Systems Architect',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'
    };

    let formattedContent = '';
    if (excerpt) formattedContent += `<p class="lead">${excerpt}</p>`;
    if (content.startsWith('<')) formattedContent += content;
    else formattedContent += `<p>${content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;

    let savedBlog = null;

    if (typeof ChronicleAuth !== 'undefined') {
      try {
        const payload = {
          title,
          excerpt: excerpt || title,
          content: formattedContent,
          category,
          coverImage,
          tags: tags.length ? tags : [category]
        };

        const res = await ChronicleAuth.apiFetch(
          editId ? '/blogs/' + encodeURIComponent(editId) : '/blogs',
          {
            method: editId ? 'PUT' : 'POST',
            body: JSON.stringify(payload)
          }
        );
        if (res && res.blog) savedBlog = res.blog;
      } catch (err) {
        console.warn('Backend API notification, falling back to local storage:', err.message);
      }
    }

    if (editId) {
      // Update existing article
      const idx = articles.findIndex(a => a.id === editId);
      if (idx !== -1) {
        articles[idx] = savedBlog || {
          ...articles[idx],
          title,
          excerpt: excerpt || title,
          content: formattedContent,
          category,
          coverImage,
          tags: tags.length ? tags : [category],
          readingTime
        };
      }
      showToast('Dispatch updated successfully! ✨', 'success');
    } else {
      // Create new article
      const newPost = savedBlog || {
        id: 'post-' + Date.now(),
        title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        excerpt: excerpt || title,
        content: formattedContent,
        category,
        coverImage,
        tags: tags.length ? tags : [category],
        readingTime,
        publishedAt: 'Just now',
        likes: 0,
        claps: 0,
        featured: false,
        trending: true,
        author: {
          name: user.name,
          role: user.role,
          avatar: user.avatar
        },
        comments: []
      };
      articles.unshift(newPost);
      showToast('Your dispatch was published live! 🎉', 'success');
    }

    saveArticles();
    if (el.writeStoryForm) el.writeStoryForm.reset();
    closeWriteModal();

    // Re-render views
    renderHero();
    renderCategories();
    renderTagsRail();
    renderArticles();
    renderTrendingWidget();
    refreshIcons();
  }

  // ============================================================
  // MOBILE NAVIGATION DRAWER
  // ============================================================
  function openMobileDrawer() {
    el.mobileDrawerBackdrop.classList.add('active');
    el.mobileDrawerPanel.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileDrawer() {
    el.mobileDrawerBackdrop.classList.remove('active');
    el.mobileDrawerPanel.classList.remove('active');
    if (el.readerModal.classList.contains('hidden')) {
      document.body.style.overflow = '';
    }
  }

  // ============================================================
  // AUDIO NARRATION SIMULATOR
  // ============================================================
  function toggleAudioNarration() {
    isAudioPlaying = !isAudioPlaying;
    if (isAudioPlaying) {
      el.readerAudioToggleBtn.innerHTML = '<i data-lucide="pause" class="w-4 h-4"></i>';
      showToast('Playing audio narration...', 'info');
    } else {
      el.readerAudioToggleBtn.innerHTML = '<i data-lucide="volume-2" class="w-4 h-4"></i>';
      showToast('Audio paused', 'info');
    }
    refreshIcons();
  }

  // ============================================================
  // SHARE STORY HELPER
  // ============================================================
  function shareCurrentArticle() {
    if (!currentArticle) return;
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        showToast('Article link copied to clipboard! 📋', 'success');
      }).catch(() => {
        showToast('Link ready to share: ' + url, 'info');
      });
    } else {
      showToast('Article ready to share', 'info');
    }
  }

  // ============================================================
  // TOAST NOTIFICATIONS
  // ============================================================
  function showToast(message, type = 'info') {
    if (!el.toastContainer) return;

    const toast = document.createElement('div');
    const colorClass = type === 'success' 
      ? 'bg-emerald-600 text-white' 
      : type === 'error' 
      ? 'bg-rose-600 text-white' 
      : 'bg-[var(--text-primary)] text-[var(--bg-primary)]';

    toast.className = `px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0 ${colorClass}`;
    toast.innerHTML = `
      <i data-lucide="${type === 'success' ? 'check' : type === 'error' ? 'alert-triangle' : 'info'}" class="w-4 h-4"></i>
      <span>${message}</span>
    `;

    el.toastContainer.appendChild(toast);
    refreshIcons();

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    // Auto dismiss
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function refreshIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // ============================================================
  // EVENT LISTENERS SETUP
  // ============================================================
  function setupEventListeners() {
    // Theme toggle is handled globally by ChronicleAuth (avoids duplicate event listeners)

    // Mobile drawer
    if (el.mobileMenuBtn) el.mobileMenuBtn.addEventListener('click', openMobileDrawer);
    if (el.closeMobileDrawerBtn) el.closeMobileDrawerBtn.addEventListener('click', closeMobileDrawer);
    if (el.mobileDrawerBackdrop) {
      el.mobileDrawerBackdrop.addEventListener('click', (e) => {
        if (e.target === el.mobileDrawerBackdrop) closeMobileDrawer();
      });
    }

    // Bookmarks drawer
    if (el.openBookmarksBtn) el.openBookmarksBtn.addEventListener('click', openBookmarksDrawer);
    if (el.closeBookmarksBtn) el.closeBookmarksBtn.addEventListener('click', closeBookmarksDrawer);
    if (el.mobileBookmarksLink) {
      el.mobileBookmarksLink.addEventListener('click', () => {
        closeMobileDrawer();
        openBookmarksDrawer();
      });
    }
    if (el.bookmarksBackdrop) {
      el.bookmarksBackdrop.addEventListener('click', (e) => {
        if (e.target === el.bookmarksBackdrop) closeBookmarksDrawer();
      });
    }

    // Search modal
    if (el.quickSearchBtn) el.quickSearchBtn.addEventListener('click', () => openSearchModal());
    if (el.mobileSearchBtn) el.mobileSearchBtn.addEventListener('click', () => openSearchModal());
    if (el.closeSearchModalBtn) el.closeSearchModalBtn.addEventListener('click', closeSearchModal);
    if (el.searchModal) {
      el.searchModal.addEventListener('click', (e) => {
        if (e.target === el.searchModal) closeSearchModal();
      });
    }
    if (el.searchInput) {
      el.searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
    }
    document.querySelectorAll('.search-tag-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const cat = chip.textContent.trim();
        el.searchInput.value = cat === 'All' ? '' : cat;
        handleSearch(el.searchInput.value);
      });
    });

    // Write story modal
    if (el.openWriteModalBtn) el.openWriteModalBtn.addEventListener('click', openWriteModal);
    if (el.mobileWriteBtn) {
      el.mobileWriteBtn.addEventListener('click', () => {
        closeMobileDrawer();
        openWriteModal();
      });
    }
    if (el.closeWriteModalBtn) el.closeWriteModalBtn.addEventListener('click', closeWriteModal);
    if (el.cancelWriteModalBtn) el.cancelWriteModalBtn.addEventListener('click', closeWriteModal);
    if (el.writeStoryModal) {
      el.writeStoryModal.addEventListener('click', (e) => {
        if (e.target === el.writeStoryModal) closeWriteModal();
      });
    }
    if (el.randomCoverBtn) el.randomCoverBtn.addEventListener('click', pickPresetCover);
    if (el.writeStoryForm) el.writeStoryForm.addEventListener('submit', handleCreateOrUpdateStory);

    // Live word count & reading time calculation in write modal
    ['newPostTitle', 'newPostExcerpt', 'newPostContent'].forEach(id => {
      const input = document.getElementById(id);
      if (input) input.addEventListener('input', updateWriteStats);
    });

    // Delete confirmation modal listeners
    if (el.cancelDeleteBtn) el.cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    if (el.confirmDeleteBtn) el.confirmDeleteBtn.addEventListener('click', confirmDeleteArticle);
    if (el.deleteConfirmModal) {
      el.deleteConfirmModal.addEventListener('click', (e) => {
        if (e.target === el.deleteConfirmModal) closeDeleteModal();
      });
    }

    // Quick compose buttons in feed & manager table
    if (el.feedComposeBtn) el.feedComposeBtn.addEventListener('click', openWriteModal);
    if (el.managerNewPostBtn) el.managerNewPostBtn.addEventListener('click', openWriteModal);

    // Header Search Input (synced with Feed Search)
    if (el.headerSearchInput) {
      el.headerSearchInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value;
        if (el.feedSearchInput) el.feedSearchInput.value = e.target.value;
        if (el.clearFeedSearchBtn) {
          el.clearFeedSearchBtn.classList.toggle('hidden', !currentSearchQuery);
        }
        renderArticles();
      });

      el.headerSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const storiesEl = document.getElementById('stories');
          if (storiesEl) storiesEl.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    // Read Time Filter
    if (el.readTimeFilter) {
      el.readTimeFilter.addEventListener('change', (e) => {
        currentReadingTime = e.target.value;
        renderArticles();
      });
    }

    // Reader View
    if (el.closeReaderBtn) el.closeReaderBtn.addEventListener('click', closeArticleReader);
    if (el.readerClapBtn) {
      el.readerClapBtn.addEventListener('click', () => {
        if (currentArticle) triggerClap(currentArticle.id);
      });
    }
    if (el.readerBookmarkBtn) {
      el.readerBookmarkBtn.addEventListener('click', () => {
        if (currentArticle) toggleBookmark(currentArticle.id);
      });
    }
    if (el.readerBookmarkFloatingBtn) {
      el.readerBookmarkFloatingBtn.addEventListener('click', () => {
        if (currentArticle) toggleBookmark(currentArticle.id);
      });
    }
    if (el.readerShareBtn) el.readerShareBtn.addEventListener('click', shareCurrentArticle);
    if (el.readerShareFloatingBtn) el.readerShareFloatingBtn.addEventListener('click', shareCurrentArticle);
    if (el.readerAudioToggleBtn) el.readerAudioToggleBtn.addEventListener('click', toggleAudioNarration);
    if (el.scrollToCommentsBtn) {
      el.scrollToCommentsBtn.addEventListener('click', () => {
        const commentsSec = document.getElementById('commentsSection');
        if (commentsSec) commentsSec.scrollIntoView({ behavior: 'smooth' });
      });
    }
    if (el.commentForm) el.commentForm.addEventListener('submit', handleAddComment);

    // Sorting & View Toggles
    if (el.sortSelect) {
      el.sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderArticles();
      });
    }

    function updateViewModeButtons() {
      const activeClass = 'p-1.5 rounded-md bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs transition-colors cursor-pointer';
      const inactiveClass = 'p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer';
      if (el.viewGridBtn) el.viewGridBtn.className = viewMode === 'grid' ? activeClass : inactiveClass;
      if (el.viewListBtn) el.viewListBtn.className = viewMode === 'list' ? activeClass : inactiveClass;
      if (el.viewManageBtn) el.viewManageBtn.className = viewMode === 'manage' ? activeClass : inactiveClass;
    }

    if (el.viewGridBtn) {
      el.viewGridBtn.addEventListener('click', () => {
        viewMode = 'grid';
        updateViewModeButtons();
        renderArticles();
      });
    }

    if (el.viewListBtn) {
      el.viewListBtn.addEventListener('click', () => {
        viewMode = 'list';
        updateViewModeButtons();
        renderArticles();
      });
    }

    if (el.viewManageBtn) {
      el.viewManageBtn.addEventListener('click', () => {
        viewMode = 'manage';
        updateViewModeButtons();
        renderArticles();
      });
    }

    // Inline Feed Search listener
    if (el.feedSearchInput) {
      el.feedSearchInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value;
        if (el.headerSearchInput) el.headerSearchInput.value = e.target.value;
        if (el.clearFeedSearchBtn) {
          el.clearFeedSearchBtn.classList.toggle('hidden', !currentSearchQuery);
        }
        renderArticles();
      });
    }

    if (el.clearFeedSearchBtn) {
      el.clearFeedSearchBtn.addEventListener('click', () => {
        currentSearchQuery = '';
        if (el.feedSearchInput) el.feedSearchInput.value = '';
        if (el.headerSearchInput) el.headerSearchInput.value = '';
        el.clearFeedSearchBtn.classList.add('hidden');
        renderArticles();
        if (el.feedSearchInput) el.feedSearchInput.focus();
      });
    }

    function resetAllFilters() {
      currentCategory = 'All Stories';
      currentTag = 'All';
      currentReadingTime = 'all';
      currentSearchQuery = '';
      currentSort = 'latest';
      if (el.feedSearchInput) el.feedSearchInput.value = '';
      if (el.headerSearchInput) el.headerSearchInput.value = '';
      if (el.clearFeedSearchBtn) el.clearFeedSearchBtn.classList.add('hidden');
      if (el.sortSelect) el.sortSelect.value = 'latest';
      if (el.readTimeFilter) el.readTimeFilter.value = 'all';
      renderCategories();
      renderTagsRail();
      renderArticles();
    }

    // Reset Filters in empty state and summary bar
    if (el.resetFiltersBtn) el.resetFiltersBtn.addEventListener('click', resetAllFilters);
    if (el.clearAllFiltersBtn) el.clearAllFiltersBtn.addEventListener('click', resetAllFilters);

    // Load More Simulation
    if (el.loadMoreBtn) {
      el.loadMoreBtn.addEventListener('click', () => {
        showToast('All published archives loaded.', 'info');
      });
    }

    // Newsletter Form
    if (el.newsletterForm) {
      el.newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        el.newsletterForm.classList.add('hidden');
        if (el.newsletterSuccess) el.newsletterSuccess.classList.remove('hidden');
        showToast('Subscribed to Chronicle Gazette!', 'success');
      });
    }

    // Mobile Bottom Navigation
    if (el.mobileNavHome) {
      el.mobileNavHome.addEventListener('click', () => {
        if (!el.readerModal.classList.contains('hidden')) {
          closeArticleReader();
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
    if (el.mobileNavSearch) el.mobileNavSearch.addEventListener('click', () => openSearchModal());
    if (el.mobileNavWrite && el.mobileNavWrite.tagName !== 'A') {
      el.mobileNavWrite.addEventListener('click', openWriteModal);
    }
    if (el.mobileNavBookmarks) el.mobileNavBookmarks.addEventListener('click', openBookmarksDrawer);

    // Keyboard Shortcuts (Ctrl/Cmd + K for search, ESC to close modals)
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearchModal();
      }
      if (e.key === 'Escape') {
        closeSearchModal();
        closeWriteModal();
        closeBookmarksDrawer();
        if (!el.readerModal.classList.contains('hidden')) {
          closeArticleReader();
        }
      }
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
