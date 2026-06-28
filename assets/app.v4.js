(() => {
  'use strict';

  const QUALITY = 'best quality, amazing quality, very aesthetic, absurdres';
  const STORAGE_KEY = 'nai_artist_chain_custom_v1';
  const THEME_KEY = 'nai_artist_chain_theme_v1';
  const META_KEY = 'nai_artist_chain_artist_meta_v4';
  const CATEGORY_KEY = 'nai_artist_chain_categories_v1';
  const ACTIVE_CATEGORY_KEY = 'nai_artist_chain_active_category_v1';
  const CATEGORY_ONLY_KEY = 'nai_artist_chain_category_only_v1';
  const ICON_MAX = 360;

  const baseData = window.ARTIST_DATA || { artists: [], presets: [] };
  let customArtists = loadCustomArtists();
  let artistMeta = loadArtistMeta();
  let categories = loadCategories();
  let activeCategoryId = loadActiveCategoryId();
  let artists = mergeArtists(baseData.artists, customArtists);
  let filtered = [...artists];
  let selected = new Map();
  let page = 1;
  let editingKey = null;
  let editingIconData = '';
  let creatingArtist = false;

  const $ = (id) => document.getElementById(id);
  const els = {
    artistTotal: $('artistTotal'),
    randomCount: $('randomCount'),
    weightMode: $('weightMode'),
    randomScope: $('randomScope'),
    includeQuality: $('includeQuality'),
    output: $('output'),
    generateBtn: $('generateBtn'),
    shuffleBtn: $('shuffleBtn'),
    copyOutputBtn: $('copyOutputBtn'),
    clearOutputBtn: $('clearOutputBtn'),
    presetList: $('presetList'),
    selectedCount: $('selectedCount'),
    selectedList: $('selectedList'),
    buildSelectedBtn: $('buildSelectedBtn'),
    copySelectedBtn: $('copySelectedBtn'),
    clearSelectedBtn: $('clearSelectedBtn'),
    categoryStats: $('categoryStats'),
    categorySelect: $('categorySelect'),
    categoryNameInput: $('categoryNameInput'),
    categoryOnly: $('categoryOnly'),
    createCategoryBtn: $('createCategoryBtn'),
    renameCategoryBtn: $('renameCategoryBtn'),
    deleteCategoryBtn: $('deleteCategoryBtn'),
    addSelectedToCategoryBtn: $('addSelectedToCategoryBtn'),
    copyCategoryBtn: $('copyCategoryBtn'),
    clearCategoryBtn: $('clearCategoryBtn'),
    categoryArtistList: $('categoryArtistList'),
    browserStats: $('browserStats'),
    searchInput: $('searchInput'),
    gridN: $('gridN'),
    sortMode: $('sortMode'),
    resetSearchBtn: $('resetSearchBtn'),
    addArtistBtn: $('addArtistBtn'),
    clearLocalMetaBtn: $('clearLocalMetaBtn'),
    prevPageBtn: $('prevPageBtn'),
    nextPageBtn: $('nextPageBtn'),
    pageInfo: $('pageInfo'),
    cards: $('cards'),
    customInput: $('customInput'),
    importBtn: $('importBtn'),
    exportBtn: $('exportBtn'),
    resetCustomBtn: $('resetCustomBtn'),
    themeBtn: $('themeBtn'),
    toast: $('toast'),
    editModal: $('editModal'),
    closeEditBtn: $('closeEditBtn'),
    editIconPreview: $('editIconPreview'),
    editIconFile: $('editIconFile'),
    removeIconBtn: $('removeIconBtn'),
    editDisplay: $('editDisplay'),
    editTag: $('editTag'),
    editIconUrl: $('editIconUrl'),
    editNote: $('editNote'),
    editUrls: $('editUrls'),
    editUrlPreview: $('editUrlPreview'),
    copyEditedTagBtn: $('copyEditedTagBtn'),
    addDanbooruUrlBtn: $('addDanbooruUrlBtn'),
    openDanbooruUrlBtn: $('openDanbooruUrlBtn'),
    resetArtistEditBtn: $('resetArtistEditBtn'),
    saveArtistEditBtn: $('saveArtistEditBtn'),
  };

  init();

  function init() {
    restoreTheme();
    els.artistTotal.textContent = artists.length.toString();
    renderPresets();
    bindEvents();
    renderCategories();
    applyFilter();
    renderSelected();
  }

  function bindEvents() {
    els.generateBtn.addEventListener('click', generateRandom);
    els.shuffleBtn.addEventListener('click', shuffleOutput);
    els.copyOutputBtn.addEventListener('click', () => copyText(els.output.value, '已複製輸出'));
    els.clearOutputBtn.addEventListener('click', () => { els.output.value = ''; showToast('已清空輸出'); });
    els.searchInput.addEventListener('input', () => { page = 1; applyFilter(); });
    els.gridN.addEventListener('input', () => { page = 1; renderCards(); });
    els.sortMode.addEventListener('change', () => { page = 1; applyFilter(); });
    els.resetSearchBtn.addEventListener('click', resetSearch);
    els.addArtistBtn.addEventListener('click', openNewArtistModal);
    els.clearLocalMetaBtn.addEventListener('click', clearAllArtistEdits);
    els.categorySelect.addEventListener('change', handleCategoryChange);
    els.categoryOnly.addEventListener('change', handleCategoryOnlyChange);
    els.createCategoryBtn.addEventListener('click', createCategory);
    els.renameCategoryBtn.addEventListener('click', renameActiveCategory);
    els.deleteCategoryBtn.addEventListener('click', deleteActiveCategory);
    els.addSelectedToCategoryBtn.addEventListener('click', addSelectedToCategory);
    els.copyCategoryBtn.addEventListener('click', copyActiveCategoryChain);
    els.clearCategoryBtn.addEventListener('click', clearActiveCategory);
    els.prevPageBtn.addEventListener('click', () => changePage(-1));
    els.nextPageBtn.addEventListener('click', () => changePage(1));
    els.buildSelectedBtn.addEventListener('click', buildSelectedOutput);
    els.copySelectedBtn.addEventListener('click', () => copyText(buildChain([...selected.values()].map(a => a.tag)), '已複製已選畫師串'));
    els.clearSelectedBtn.addEventListener('click', () => { selected.clear(); renderSelected(); renderCards(); showToast('已清除已選畫師'); });
    els.importBtn.addEventListener('click', importCustomArtists);
    els.exportBtn.addEventListener('click', exportJson);
    els.resetCustomBtn.addEventListener('click', resetCustomArtists);
    els.themeBtn.addEventListener('click', toggleTheme);

    els.closeEditBtn.addEventListener('click', closeEditModal);
    els.editModal.querySelectorAll('[data-close-modal]').forEach(el => el.addEventListener('click', closeEditModal));
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && els.editModal.classList.contains('is-open')) closeEditModal();
    });
    els.editIconFile.addEventListener('change', handleIconFileChange);
    els.removeIconBtn.addEventListener('click', removeEditingIcon);
    els.editIconUrl.addEventListener('input', () => updateIconPreview());
    els.editDisplay.addEventListener('input', updateIconPreview);
    els.editTag.addEventListener('input', () => { updateIconPreview(); });
    els.editUrls.addEventListener('input', renderEditUrlPreview);
    els.saveArtistEditBtn.addEventListener('click', saveArtistEdit);
    els.resetArtistEditBtn.addEventListener('click', resetCurrentArtistEdit);
    els.copyEditedTagBtn.addEventListener('click', () => copyText(normalizeTag(els.editTag.value), '已複製編輯中的 tag'));
    els.addDanbooruUrlBtn.addEventListener('click', addDanbooruUrlToEditor);
    els.openDanbooruUrlBtn.addEventListener('click', openDanbooruFromEditor);
  }

  function loadCustomArtists() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function saveCustomArtists() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customArtists));
  }

  function loadArtistMeta() {
    try {
      const raw = localStorage.getItem(META_KEY) || localStorage.getItem('nai_artist_chain_artist_meta_v3') || '{}';
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function saveArtistMeta() {
    try {
      localStorage.setItem(META_KEY, JSON.stringify(artistMeta));
    } catch (err) {
      showToast('儲存失敗：圖片可能太大，請換較小圖片或只使用圖片 URL');
      throw err;
    }
  }

  function loadCategories() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CATEGORY_KEY) || '[]');
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(cat => cat && typeof cat === 'object' && String(cat.name || '').trim())
        .map((cat, index) => ({
          id: String(cat.id || `cat_${Date.now()}_${index}`),
          name: String(cat.name || `分類 ${index + 1}`).trim(),
          keys: uniqueStrings([...(Array.isArray(cat.keys) ? cat.keys : []), ...(Array.isArray(cat.tags) ? cat.tags.map(keyOf) : [])]),
          createdAt: cat.createdAt || new Date().toISOString(),
        }));
    } catch (_) {
      return [];
    }
  }

  function saveCategories() {
    localStorage.setItem(CATEGORY_KEY, JSON.stringify(categories));
  }

  function loadActiveCategoryId() {
    return localStorage.getItem(ACTIVE_CATEGORY_KEY) || 'all';
  }

  function saveActiveCategoryId() {
    localStorage.setItem(ACTIVE_CATEGORY_KEY, activeCategoryId || 'all');
  }

  function mergeArtists(base, custom) {
    const result = [];
    const seen = new Set();
    [...base, ...custom].forEach((item) => {
      const baseTag = normalizeTag(item.tag || item.name || '');
      if (!baseTag) return;
      const baseKey = keyOf(baseTag);
      const meta = artistMeta[baseKey] || {};
      const tag = normalizeTag(meta.tag || item.tag || item.name || '');
      if (!tag || seen.has(tag.toLowerCase())) return;
      seen.add(tag.toLowerCase());
      const name = tag.split(':', 2)[1];
      const savedUrls = Array.isArray(meta.urls) ? meta.urls.filter(Boolean) : [];
      const itemUrls = Array.isArray(item.urls) ? item.urls.filter(Boolean) : [];
      const urls = uniqueUrls([...savedUrls, ...itemUrls, buildDanbooruPostsUrl(tag)]);
      result.push({
        id: result.length + 1,
        key: baseKey,
        name,
        display: (meta.display || item.display || name).replaceAll('_', ' '),
        tag,
        note: meta.note || item.note || '',
        urls,
        icon: meta.icon || item.icon || '',
        iconUrl: meta.iconUrl || item.iconUrl || '',
        sourceLine: item.sourceLine || null,
        custom: !!item.custom,
        edited: !!artistMeta[baseKey],
      });
    });
    return result;
  }

  function normalizeTag(input) {
    let tag = String(input || '').trim().replace(/,$/, '').replaceAll('\\xa0', ' ');
    tag = tag.replace(/^\[+|\]+$/g, '').replace(/^\{+|\}+$/g, '').trim();
    if (!tag) return '';
    if (!/^artist\s*:/i.test(tag)) tag = `artist:${tag}`;
    return tag.replace(/^artist\s*:\s*/i, 'artist:');
  }

  function keyOf(tag) {
    return normalizeTag(tag).toLowerCase();
  }

  function renderPresets() {
    els.presetList.innerHTML = '';
    baseData.presets.forEach((preset) => {
      const card = document.createElement('article');
      card.className = 'preset-card';
      card.tabIndex = 0;
      card.innerHTML = `
        <h3>${escapeHtml(preset.name)}</h3>
        <p>${escapeHtml(preset.note || '')}</p>
        <code>${escapeHtml(preset.tags.join(', '))}</code>
      `;
      const usePreset = () => {
        els.output.value = buildChain(preset.tags, false);
        showToast(`已套用：${preset.name}`);
      };
      card.addEventListener('click', usePreset);
      card.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          usePreset();
        }
      });
      els.presetList.appendChild(card);
    });
  }

  function applyFilter() {
    const q = els.searchInput.value.trim().toLowerCase();
    const activeCategory = getActiveCategory();
    const onlyCategory = !!(activeCategory && els.categoryOnly && els.categoryOnly.checked);
    filtered = artists.filter((a) => {
      if (onlyCategory && !categoryHasArtist(activeCategory, a)) return false;
      if (!q) return true;
      const urlText = a.urls.join(' ').toLowerCase();
      return a.name.toLowerCase().includes(q)
        || a.display.toLowerCase().includes(q)
        || a.tag.toLowerCase().includes(q)
        || a.note.toLowerCase().includes(q)
        || urlText.includes(q);
    });

    const sort = els.sortMode.value;
    const byName = (a, b) => a.name.localeCompare(b.name, 'en');
    if (sort === 'az') filtered.sort(byName);
    if (sort === 'za') filtered.sort((a, b) => byName(b, a));
    if (sort === 'short') filtered.sort((a, b) => a.tag.length - b.tag.length || byName(a, b));
    if (sort === 'long') filtered.sort((a, b) => b.tag.length - a.tag.length || byName(a, b));
    if (sort === 'id') filtered.sort((a, b) => a.id - b.id);
    renderCards();
  }

  function renderCards() {
    const n = clamp(parseInt(els.gridN.value, 10) || 4, 2, 8);
    els.gridN.value = n;
    document.documentElement.style.setProperty('--grid-n', n);
    const perPage = n * n;
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    page = clamp(page, 1, totalPages);
    const start = (page - 1) * perPage;
    const visible = filtered.slice(start, start + perPage);

    const editedCount = artists.filter(a => a.edited).length;
    const activeCategory = getActiveCategory();
    const categoryText = activeCategory ? `｜目前分類：${activeCategory.name} (${getCategoryArtists(activeCategory).length})` : '';
    els.browserStats.textContent = `共 ${artists.length} 個 tag｜符合 ${filtered.length} 個｜已編輯 ${editedCount} 個${categoryText}｜每頁 ${n}×${n} = ${perPage} 張卡`;
    els.pageInfo.textContent = `${page} / ${totalPages}`;
    els.prevPageBtn.disabled = page <= 1;
    els.nextPageBtn.disabled = page >= totalPages;
    els.cards.innerHTML = '';

    if (!visible.length) {
      els.cards.innerHTML = '<p class="empty">找不到符合條件的畫師。</p>';
      return;
    }

    const frag = document.createDocumentFragment();
    visible.forEach((artist) => {
      const card = document.createElement('article');
      const isSelected = selected.has(artist.tag);
      const activeCategory = getActiveCategory();
      const inCategory = activeCategory ? categoryHasArtist(activeCategory, artist) : false;
      card.className = `artist-card${isSelected ? ' is-selected' : ''}${artist.edited ? ' is-edited' : ''}${inCategory ? ' is-in-category' : ''}`;
      const urlBadges = artist.urls.slice(0, 4).map(urlBadgeHtml).join('');
      const moreUrls = artist.urls.length > 4 ? `<span class="url-more">+${artist.urls.length - 4}</span>` : '';
      const categoryButton = activeCategory ? `<button type="button" data-action="categoryToggle">${inCategory ? '移出分類' : '加入分類'}</button>` : '';
      card.innerHTML = `
        <div class="artist-card__top">
          ${artistIconHtml(artist)}
          <div class="artist-card__meta">
            <span class="artist-card__num">#${String(artist.id).padStart(3, '0')}${artist.custom ? ' · 自訂' : ''}${artist.edited ? ' · 已編輯' : ''}${inCategory ? ' · 分類內' : ''}</span>
            <button class="mini-edit" type="button" data-action="edit">編輯</button>
          </div>
        </div>
        <h3>${escapeHtml(artist.display)}</h3>
        <code>${escapeHtml(artist.tag)}</code>
        ${artist.note ? `<p class="artist-note">${escapeHtml(artist.note)}</p>` : ''}
        <div class="url-strip ${artist.urls.length ? '' : 'is-empty'}">${urlBadges}${moreUrls || (artist.urls.length ? '' : '<span>未加入 URL</span>')}</div>
        <div class="card-actions ${activeCategory ? 'has-category-action' : ''}">
          <button type="button" data-action="select">${isSelected ? '移除' : '加入'}</button>
          <button type="button" data-action="copy">複製</button>
          ${categoryButton}
          <button type="button" data-action="openDanbooru">Danbooru</button>
        </div>
      `;
      card.querySelector('[data-action="select"]').addEventListener('click', () => toggleSelected(artist));
      card.querySelector('[data-action="copy"]').addEventListener('click', () => copyText(artist.tag, '已複製 tag'));
      card.querySelector('[data-action="edit"]').addEventListener('click', () => openEditModal(artist));
      const categoryToggleBtn = card.querySelector('[data-action="categoryToggle"]');
      if (categoryToggleBtn) categoryToggleBtn.addEventListener('click', () => toggleArtistInActiveCategory(artist));
      card.querySelector('[data-action="openDanbooru"]').addEventListener('click', () => window.open(buildDanbooruPostsUrl(artist.tag), '_blank', 'noopener,noreferrer'));
      frag.appendChild(card);
    });
    els.cards.appendChild(frag);
  }

  function artistIconHtml(artist) {
    const src = artist.icon || artist.iconUrl;
    if (src) {
      return `<div class="artist-avatar has-image"><img src="${escapeAttr(src)}" alt="${escapeAttr(artist.display)} icon" loading="lazy" onerror="this.closest('.artist-avatar').classList.add('image-error')"></div>`;
    }
    const initials = getInitials(artist.display || artist.name);
    return `<div class="artist-avatar"><span>${escapeHtml(initials)}</span></div>`;
  }

  function urlBadgeHtml(url) {
    const info = detectUrlType(url);
    return `<a class="url-badge url-badge--${info.key}" href="${escapeAttr(url)}" title="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(info.label)}</a>`;
  }

  function detectUrlType(rawUrl) {
    const value = String(rawUrl || '').trim();
    let host = '';
    try { host = new URL(value).hostname.toLowerCase(); } catch (_) { host = value.toLowerCase(); }
    if (host.includes('danbooru.donmai.us')) return { key: 'danbooru', label: 'DB' };
    if (host.includes('pixiv.net')) return { key: 'pixiv', label: 'P' };
    if (host.includes('x.com') || host.includes('twitter.com')) return { key: 'x', label: '𝕏' };
    if (host.includes('fanbox')) return { key: 'fanbox', label: 'F' };
    if (host.includes('sketch.pixiv')) return { key: 'sketch', label: 'S' };
    if (host.includes('bsky.app')) return { key: 'bsky', label: '🦋' };
    if (host.includes('patreon')) return { key: 'patreon', label: 'P' };
    if (host.includes('subscribestar')) return { key: 'subscribestar', label: 'S' };
    if (host.includes('youtube')) return { key: 'youtube', label: '▶' };
    if (host.includes('instagram')) return { key: 'instagram', label: '◎' };
    return { key: 'link', label: '↗' };
  }

  function getInitials(display) {
    const cleaned = String(display || '?').replace(/^artist:/i, '').replace(/[()_\-]+/g, ' ').trim();
    const parts = cleaned.split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }


  function getDanbooruTagName(tag) {
    return normalizeTag(tag)
      .replace(/^artist:/i, '')
      .replace(/\xa0/g, ' ')
      .trim();
  }

  function buildDanbooruPostsUrl(tag) {
    const name = getDanbooruTagName(tag);
    return `https://danbooru.donmai.us/posts?tags=${encodeURIComponent(name)}`;
  }

  function uniqueUrls(urls) {
    const seen = new Set();
    return urls
      .map(url => String(url || '').trim())
      .filter(Boolean)
      .map(url => (/^https?:\/\//i.test(url) ? url : `https://${url}`))
      .filter((url) => {
        const key = url.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  function addDanbooruUrlToEditor() {
    const tag = normalizeTag(els.editTag.value);
    if (!tag) {
      showToast('請先輸入 NovelAI tag');
      return;
    }
    const current = parseUrlLines(els.editUrls.value);
    const danbooru = buildDanbooruPostsUrl(tag);
    const merged = uniqueUrls([...current, danbooru]);
    els.editUrls.value = merged.join('\n');
    renderEditUrlPreview();
    showToast('已加入 Danbooru posts URL');
  }

  function openDanbooruFromEditor() {
    const tag = normalizeTag(els.editTag.value);
    if (!tag) {
      showToast('請先輸入 NovelAI tag');
      return;
    }
    window.open(buildDanbooruPostsUrl(tag), '_blank', 'noopener,noreferrer');
  }

  function toggleSelected(artist) {
    if (selected.has(artist.tag)) {
      selected.delete(artist.tag);
    } else {
      selected.set(artist.tag, artist);
    }
    renderSelected();
    renderCards();
  }

  function renderSelected() {
    els.selectedCount.textContent = selected.size.toString();
    els.selectedList.innerHTML = '';
    if (!selected.size) {
      els.selectedList.className = 'selected-list empty';
      els.selectedList.textContent = '尚未選擇畫師。點擊下方畫師卡片即可加入。';
      return;
    }
    els.selectedList.className = 'selected-list';
    [...selected.values()].forEach((artist) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.innerHTML = `<span>${escapeHtml(artist.tag)}</span><button type="button" aria-label="移除 ${escapeAttr(artist.name)}">×</button>`;
      chip.querySelector('button').addEventListener('click', () => toggleSelected(artist));
      els.selectedList.appendChild(chip);
    });
  }

  function getActiveCategory() {
    return categories.find(cat => cat.id === activeCategoryId) || null;
  }

  function categoryHasArtist(category, artist) {
    if (!category || !artist) return false;
    const keys = Array.isArray(category.keys) ? category.keys : [];
    return keys.includes(artist.key);
  }

  function getCategoryArtists(category) {
    if (!category) return [];
    return artists.filter(artist => categoryHasArtist(category, artist));
  }

  function renderCategories() {
    const initialOnly = localStorage.getItem(CATEGORY_ONLY_KEY) === '1';
    if (!els.categoryOnly.dataset.ready) {
      els.categoryOnly.checked = initialOnly;
      els.categoryOnly.dataset.ready = '1';
    }

    if (activeCategoryId !== 'all' && !categories.some(cat => cat.id === activeCategoryId)) {
      activeCategoryId = 'all';
      saveActiveCategoryId();
    }

    els.categorySelect.innerHTML = '<option value="all">全部畫師 / 不使用分類</option>';
    categories.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = `${cat.name} (${getCategoryArtists(cat).length})`;
      els.categorySelect.appendChild(opt);
    });
    els.categorySelect.value = activeCategoryId;

    const active = getActiveCategory();
    const disabled = !active;
    els.categoryOnly.disabled = disabled;
    els.renameCategoryBtn.disabled = disabled;
    els.deleteCategoryBtn.disabled = disabled;
    els.addSelectedToCategoryBtn.disabled = disabled;
    els.copyCategoryBtn.disabled = disabled;
    els.clearCategoryBtn.disabled = disabled;

    els.categoryArtistList.innerHTML = '';
    if (!active) {
      els.categoryStats.textContent = categories.length ? `已建立 ${categories.length} 個分類` : '未建立分類';
      els.categoryArtistList.className = 'selected-list empty';
      els.categoryArtistList.textContent = '請新增或選擇分類；之後可在畫師方格加入指定畫師。';
      return;
    }

    const categoryArtists = getCategoryArtists(active);
    els.categoryStats.textContent = `目前分類「${active.name}」有 ${categoryArtists.length} 個畫師 tag`;
    if (!categoryArtists.length) {
      els.categoryArtistList.className = 'selected-list empty';
      els.categoryArtistList.textContent = '此分類尚未加入畫師。取消「只顯示此分類內畫師」後，可搜尋全部畫師並按「加入分類」。';
      return;
    }

    els.categoryArtistList.className = 'selected-list';
    categoryArtists.forEach((artist) => {
      const chip = document.createElement('span');
      chip.className = 'chip chip--category';
      chip.innerHTML = `<span>${escapeHtml(artist.tag)}</span><button type="button" aria-label="從分類移除 ${escapeAttr(artist.name)}">×</button>`;
      chip.querySelector('button').addEventListener('click', () => {
        removeArtistFromCategory(active, artist);
        saveCategories();
        renderCategories();
        applyFilter();
        showToast('已從分類移除');
      });
      els.categoryArtistList.appendChild(chip);
    });
  }

  function handleCategoryChange() {
    activeCategoryId = els.categorySelect.value || 'all';
    saveActiveCategoryId();
    page = 1;
    renderCategories();
    applyFilter();
  }

  function handleCategoryOnlyChange() {
    localStorage.setItem(CATEGORY_ONLY_KEY, els.categoryOnly.checked ? '1' : '0');
    page = 1;
    applyFilter();
  }

  function createCategory() {
    const name = els.categoryNameInput.value.trim() || `分類 ${categories.length + 1}`;
    const id = `cat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    categories.push({ id, name, keys: [], createdAt: new Date().toISOString() });
    activeCategoryId = id;
    saveCategories();
    saveActiveCategoryId();
    els.categoryNameInput.value = '';
    els.categoryOnly.checked = false;
    localStorage.setItem(CATEGORY_ONLY_KEY, '0');
    renderCategories();
    applyFilter();
    showToast(`已新增分類：${name}`);
  }

  function renameActiveCategory() {
    const active = getActiveCategory();
    if (!active) {
      showToast('請先選擇分類');
      return;
    }
    const name = els.categoryNameInput.value.trim();
    if (!name) {
      showToast('請在「分類名稱」輸入新名稱');
      return;
    }
    active.name = name;
    saveCategories();
    els.categoryNameInput.value = '';
    renderCategories();
    showToast('已重新命名分類');
  }

  function deleteActiveCategory() {
    const active = getActiveCategory();
    if (!active) {
      showToast('請先選擇分類');
      return;
    }
    if (!confirm(`是否刪除分類「${active.name}」？不會刪除畫師方格，只會刪除此分類。`)) return;
    categories = categories.filter(cat => cat.id !== active.id);
    activeCategoryId = 'all';
    saveCategories();
    saveActiveCategoryId();
    page = 1;
    renderCategories();
    applyFilter();
    showToast('已刪除分類');
  }

  function addSelectedToCategory() {
    const active = getActiveCategory();
    if (!active) {
      showToast('請先選擇分類');
      return;
    }
    if (!selected.size) {
      showToast('尚未選擇畫師');
      return;
    }
    let added = 0;
    [...selected.values()].forEach((artist) => {
      if (!categoryHasArtist(active, artist)) {
        active.keys.push(artist.key);
        added += 1;
      }
    });
    active.keys = uniqueStrings(active.keys);
    saveCategories();
    renderCategories();
    applyFilter();
    showToast(`已加入 ${added} 個畫師到分類`);
  }

  function toggleArtistInActiveCategory(artist) {
    const active = getActiveCategory();
    if (!active) {
      showToast('請先選擇分類');
      return;
    }
    if (categoryHasArtist(active, artist)) {
      removeArtistFromCategory(active, artist);
      showToast('已移出分類');
    } else {
      active.keys.push(artist.key);
      active.keys = uniqueStrings(active.keys);
      showToast('已加入分類');
    }
    saveCategories();
    renderCategories();
    applyFilter();
  }

  function removeArtistFromCategory(category, artist) {
    category.keys = (category.keys || []).filter(key => key !== artist.key);
  }

  function copyActiveCategoryChain() {
    const active = getActiveCategory();
    if (!active) {
      showToast('請先選擇分類');
      return;
    }
    const tags = getCategoryArtists(active).map(artist => applyWeight(artist.tag));
    if (!tags.length) {
      showToast('此分類沒有畫師');
      return;
    }
    const chain = buildChain(tags, false);
    els.output.value = chain;
    copyText(chain, '已複製分類畫師串');
  }

  function clearActiveCategory() {
    const active = getActiveCategory();
    if (!active) {
      showToast('請先選擇分類');
      return;
    }
    if (!confirm(`是否清空分類「${active.name}」內的所有畫師？`)) return;
    active.keys = [];
    saveCategories();
    renderCategories();
    applyFilter();
    showToast('已清空分類');
  }

  function openNewArtistModal() {
    creatingArtist = true;
    editingKey = null;
    editingIconData = '';
    $('editModalTitle').textContent = '新增畫師方格';
    els.editDisplay.value = '';
    els.editTag.value = '';
    els.editIconUrl.value = '';
    els.editNote.value = '';
    els.editUrls.value = '';
    els.editIconFile.value = '';
    updateIconPreview();
    renderEditUrlPreview();
    els.editModal.classList.add('is-open');
    els.editModal.setAttribute('aria-hidden', 'false');
    setTimeout(() => els.editTag.focus(), 20);
  }

  function openEditModal(artist) {
    creatingArtist = false;
    editingKey = artist.key;
    $('editModalTitle').textContent = '編輯畫師方格';
    editingIconData = artist.icon || '';
    els.editDisplay.value = artist.display || '';
    els.editTag.value = artist.tag || '';
    els.editIconUrl.value = artist.iconUrl || '';
    els.editNote.value = artist.note || '';
    els.editUrls.value = (artist.urls || []).join('\n');
    els.editIconFile.value = '';
    updateIconPreview();
    renderEditUrlPreview();
    els.editModal.classList.add('is-open');
    els.editModal.setAttribute('aria-hidden', 'false');
    setTimeout(() => els.editDisplay.focus(), 20);
  }

  function closeEditModal() {
    els.editModal.classList.remove('is-open');
    els.editModal.setAttribute('aria-hidden', 'true');
    $('editModalTitle').textContent = '編輯畫師方格';
    editingKey = null;
    editingIconData = '';
    creatingArtist = false;
  }

  async function handleIconFileChange() {
    const file = els.editIconFile.files && els.editIconFile.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('請選擇圖片檔');
      els.editIconFile.value = '';
      return;
    }
    try {
      editingIconData = await resizeImageFile(file, ICON_MAX);
      els.editIconUrl.value = '';
      updateIconPreview();
      showToast('已載入圖片 icon');
    } catch (err) {
      console.error(err);
      showToast('圖片讀取失敗');
    }
  }

  function resizeImageFile(file, size) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('file read failed'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('image load failed'));
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#101936';
          ctx.fillRect(0, 0, size, size);
          const scale = Math.max(size / img.width, size / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          const x = (size - w) / 2;
          const y = (size - h) / 2;
          ctx.drawImage(img, x, y, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function removeEditingIcon() {
    editingIconData = '';
    els.editIconUrl.value = '';
    els.editIconFile.value = '';
    updateIconPreview();
    showToast('已移除圖片 icon');
  }

  function updateIconPreview() {
    const display = els.editDisplay.value || els.editTag.value || 'artist';
    const src = editingIconData || els.editIconUrl.value.trim();
    if (src) {
      els.editIconPreview.className = 'icon-preview has-image';
      els.editIconPreview.innerHTML = `<img src="${escapeAttr(src)}" alt="icon preview" onerror="this.parentElement.classList.add('image-error')">`;
    } else {
      els.editIconPreview.className = 'icon-preview';
      els.editIconPreview.innerHTML = `<span>${escapeHtml(getInitials(display))}</span>`;
    }
  }

  function renderEditUrlPreview() {
    const urls = parseUrlLines(els.editUrls.value);
    els.editUrlPreview.innerHTML = '';
    if (!urls.length) {
      els.editUrlPreview.className = 'url-preview empty';
      els.editUrlPreview.textContent = '尚未加入 URL。';
      return;
    }
    els.editUrlPreview.className = 'url-preview';
    urls.forEach((url) => {
      const row = document.createElement('a');
      const info = detectUrlType(url);
      row.href = url;
      row.target = '_blank';
      row.rel = 'noopener noreferrer';
      row.className = 'url-row';
      row.innerHTML = `<span class="url-badge url-badge--${info.key}">${escapeHtml(info.label)}</span><span>${escapeHtml(url)}</span>`;
      els.editUrlPreview.appendChild(row);
    });
  }

  function parseUrlLines(text) {
    return uniqueUrls(String(text || '').split(/\r?\n/));
  }

  function saveArtistEdit() {
    const tag = normalizeTag(els.editTag.value);
    if (!tag) {
      showToast('請輸入有效 tag');
      return;
    }

    let targetKey = editingKey;
    if (creatingArtist) {
      const duplicate = artists.some(artist => artist.tag.toLowerCase() === tag.toLowerCase());
      if (duplicate) {
        showToast('這個畫師 tag 已存在');
        return;
      }
      customArtists.push({ tag, custom: true });
      saveCustomArtists();
      targetKey = keyOf(tag);
    }
    if (!targetKey) return;

    const display = els.editDisplay.value.trim() || tag.split(':', 2)[1];
    const meta = {
      display,
      tag,
      note: els.editNote.value.trim(),
      urls: parseUrlLines(els.editUrls.value),
      icon: editingIconData,
      iconUrl: els.editIconUrl.value.trim(),
    };
    Object.keys(meta).forEach((k) => {
      if (Array.isArray(meta[k]) && !meta[k].length) delete meta[k];
      if (typeof meta[k] === 'string' && !meta[k]) delete meta[k];
    });
    artistMeta[targetKey] = meta;
    try {
      saveArtistMeta();
    } catch (_) {
      return;
    }
    refreshArtistsPreservingSelection();

    if (creatingArtist) {
      const active = getActiveCategory();
      const newArtist = artists.find(artist => artist.key === targetKey);
      if (active && newArtist && !categoryHasArtist(active, newArtist)) {
        active.keys.push(newArtist.key);
        active.keys = uniqueStrings(active.keys);
        saveCategories();
      }
    }

    const wasCreatingArtist = creatingArtist;
    renderCategories();
    applyFilter();
    renderSelected();
    closeEditModal();
    showToast(wasCreatingArtist ? '已新增畫師方格' : '已儲存方格資料');
  }

  function resetCurrentArtistEdit() {
    if (creatingArtist) {
      els.editDisplay.value = '';
      els.editTag.value = '';
      els.editIconUrl.value = '';
      els.editNote.value = '';
      els.editUrls.value = '';
      els.editIconFile.value = '';
      editingIconData = '';
      updateIconPreview();
      renderEditUrlPreview();
      showToast('已清空新增表單');
      return;
    }
    if (!editingKey) return;
    delete artistMeta[editingKey];
    try { saveArtistMeta(); } catch (_) { return; }
    refreshArtistsPreservingSelection();
    renderCategories();
    applyFilter();
    renderSelected();
    closeEditModal();
    showToast('已還原此畫師方格');
  }

  function clearAllArtistEdits() {
    const ok = confirm('是否清除所有畫師方格編輯資料？包括圖片 icon、URL、備註與名稱修改。');
    if (!ok) return;
    artistMeta = {};
    try { saveArtistMeta(); } catch (_) { return; }
    artists = mergeArtists(baseData.artists, customArtists);
    selected.clear();
    page = 1;
    renderCategories();
    applyFilter();
    renderSelected();
    showToast('已清除所有方格編輯');
  }


  function refreshArtistsPreservingSelection() {
    const oldSelected = [...selected.values()].map(a => a.key);
    artists = mergeArtists(baseData.artists, customArtists);
    selected.clear();
    artists.forEach((artist) => {
      if (oldSelected.includes(artist.key)) selected.set(artist.tag, artist);
    });
    els.artistTotal.textContent = artists.length.toString();
  }

  function generateRandom() {
    const count = clamp(parseInt(els.randomCount.value, 10) || 1, 1, 30);
    els.randomCount.value = count;
    let pool = artists;
    if (els.randomScope.value === 'filtered') pool = filtered;
    if (els.randomScope.value === 'selected') pool = [...selected.values()];
    if (els.randomScope.value === 'category') {
      const active = getActiveCategory();
      pool = active ? getCategoryArtists(active) : [];
    }
    if (!pool.length) {
      showToast('抽取範圍沒有可用畫師');
      return;
    }
    const picks = sample(pool, Math.min(count, pool.length)).map(a => applyWeight(a.tag));
    els.output.value = buildChain(picks, false);
    showToast('已生成隨機畫師串');
  }

  function buildSelectedOutput() {
    if (!selected.size) {
      showToast('尚未選擇畫師');
      return;
    }
    els.output.value = buildChain([...selected.values()].map(a => applyWeight(a.tag)), false);
    showToast('已生成已選畫師串');
  }

  function buildChain(tags, applyMode = true) {
    const body = tags.map(tag => applyMode ? applyWeight(tag) : tag).join(', ');
    if (els.includeQuality && els.includeQuality.checked) {
      return `${QUALITY}, ${body}`;
    }
    return body;
  }

  function applyWeight(tag) {
    const mode = els.weightMode.value;
    if (mode === 'normal') return stripWeight(tag);
    if (mode === 'up') return `{${stripWeight(tag)}}`;
    if (mode === 'down') return `[${stripWeight(tag)}]`;
    if (mode === 'mixed') {
      const styles = [stripWeight(tag), `{${stripWeight(tag)}}`, `[${stripWeight(tag)}]`];
      return styles[Math.floor(Math.random() * styles.length)];
    }
    if (mode === 'strongMixed') {
      const styles = [stripWeight(tag), `{${stripWeight(tag)}}`, `{{${stripWeight(tag)}}}`, `[${stripWeight(tag)}]`, `[[${stripWeight(tag)}]]`];
      return styles[Math.floor(Math.random() * styles.length)];
    }
    return stripWeight(tag);
  }

  function stripWeight(tag) {
    return String(tag).trim().replace(/^\{+|\}+$/g, '').replace(/^\[+|\]+$/g, '');
  }

  function shuffleOutput() {
    const raw = els.output.value.trim();
    if (!raw) {
      showToast('輸出格沒有內容');
      return;
    }
    const tokens = raw.split(',').map(s => s.trim()).filter(Boolean);
    for (let i = tokens.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tokens[i], tokens[j]] = [tokens[j], tokens[i]];
    }
    els.output.value = tokens.join(', ');
    showToast('已重排輸出');
  }

  function importCustomArtists() {
    const lines = els.customInput.value.split(/\r?\n/).map(normalizeTag).filter(Boolean);
    if (!lines.length) {
      showToast('請先輸入 tag');
      return;
    }
    const existing = new Set(artists.map(a => a.tag.toLowerCase()));
    let added = 0;
    lines.forEach((tag) => {
      if (existing.has(tag.toLowerCase())) return;
      existing.add(tag.toLowerCase());
      customArtists.push({ tag, custom: true });
      added += 1;
    });
    saveCustomArtists();
    artists = mergeArtists(baseData.artists, customArtists);
    els.artistTotal.textContent = artists.length.toString();
    renderCategories();
    els.customInput.value = '';
    page = 1;
    applyFilter();
    showToast(`已加入 ${added} 個自訂 tag`);
  }

  function resetCustomArtists() {
    customArtists = [];
    saveCustomArtists();
    artists = mergeArtists(baseData.artists, customArtists);
    selected.clear();
    els.artistTotal.textContent = artists.length.toString();
    renderCategories();
    page = 1;
    applyFilter();
    renderSelected();
    showToast('已清除自訂資料');
  }

  function exportJson() {
    const payload = JSON.stringify({
      artists,
      selected: [...selected.keys()],
      artistMeta,
      customArtists,
      categories,
      exportedAt: new Date().toISOString(),
    }, null, 2);
    const blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'novelai-artist-chain-data.json';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(a.href);
    a.remove();
    showToast('已下載 JSON');
  }

  function changePage(delta) {
    page += delta;
    renderCards();
  }

  function resetSearch() {
    els.searchInput.value = '';
    els.sortMode.value = 'id';
    page = 1;
    applyFilter();
    showToast('已重設搜尋');
  }

  function sample(list, count) {
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, count);
  }

  async function copyText(text, message) {
    if (!text) {
      showToast('沒有可複製內容');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      const temp = document.createElement('textarea');
      temp.value = text;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      temp.remove();
    }
    showToast(message || '已複製');
  }

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    localStorage.setItem(THEME_KEY, next);
    showToast(next === 'light' ? '已切換淺色主題' : '已切換深色主題');
  }

  function restoreTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) {
      document.documentElement.dataset.theme = saved;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      document.documentElement.dataset.theme = 'light';
    }
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => els.toast.classList.remove('show'), 1800);
  }

  function uniqueStrings(values) {
    const seen = new Set();
    const result = [];
    values.forEach((value) => {
      const text = String(value || '').trim();
      const key = text.toLowerCase();
      if (!text || seen.has(key)) return;
      seen.add(key);
      result.push(text);
    });
    return result;
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function escapeAttr(value) {
    return escapeHtml(value).replaceAll('`', '&#096;');
  }
})();
