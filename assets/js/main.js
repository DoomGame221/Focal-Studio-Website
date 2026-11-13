/**
 * Focal Studio - Cyber/Pixel Works & Projects Showcase for GitHub Pages.
 * Loads entries from ./data/mods.json and handles multi-category filtering
 * (All, Game Translation, GitHub Project, Developing), search, pagination,
 * detail modal, content protection, and mobile-optimized canvas particles.
 */
(() => {
  'use strict';

  const MODS_JSON_URL = './data/mods.json';
  const PAGE_SIZE = 12;

  const CATEGORY_META = {
    translation: {
      label: 'แปลภาษาเกม',
      sideTabLabel: 'เปิดหน้า Steam',
      spec1Label: 'เกม',
      spec2Label: 'แพตช์',
      installTitle: 'วิธีติดตั้งแพตช์ (Windows Installer)',
    },
    github: {
      label: 'GitHub Project',
      sideTabLabel: 'เปิด GitHub',
      spec1Label: 'เทคโนโลยี',
      spec2Label: 'เวอร์ชัน',
      installTitle: 'รายละเอียด / วิธีใช้งานโปรเจกต์',
    },
  };

  // Fallback used only if opened directly via file:// where browser CORS blocks fetch().
  const FILE_PROTOCOL_FALLBACK = [
    {
      id: 'clannad-patch-th',
      category: 'translation',
      title: 'Clannad Patch ไทย',
      status: 'published',
      badge: 'NEW',
      coverImage: './assets/images/games/clannad/cover.png',
      screenshots: [],
      highlights: ['แปลภาษาเกม', 'Windows Installer'],
      updatedAgo: 'ล่าสุด',
      updatedDate: '12 พ.ย. 2569',
      gameVersion: 'Steam (CLANNAD)',
      modVersion: '10.5',
      steamUrl: 'https://store.steampowered.com/app/324160/CLANNAD/',
      downloadUrl:
        'https://drive.google.com/file/d/11gmKyocUw5IPfuRswFFJWySMFn-KMv4F/view?usp=sharing',
      installGuide:
        'วิธีการติดตั้ง Patch นี้จะเหมือนกับการติดตั้งแอปบน Windows เลย (ต้องมีตัวเกม Clannad ในเครื่องโดยการ Download ผ่าน Steam ก่อน)',
      updates: [
        {
          notes:
            '- แพตช์แปลภาษาไทยสำหรับเกม Clannad (เวอร์ชัน Steam)\n- ติดตั้งผ่านตัวติดตั้งบน Windows ได้ทันที',
        },
      ],
    },
    {
      id: 'focal-studio-showcase',
      category: 'github',
      title: 'Focal Studio Web & Cover Maker',
      status: 'published',
      badge: 'PROJECT',
      coverImage: '',
      coverFallbackTag: 'GITHUB PROJECT',
      screenshots: [],
      highlights: ['GitHub Project', 'HTML / CSS / JS'],
      updatedAgo: 'ล่าสุด',
      updatedDate: '13 พ.ย. 2569',
      techStack: 'HTML / CSS / Vanilla JS',
      modVersion: '1.0',
      repoUrl: 'https://github.com/',
      demoUrl: './tools/cover-maker.html',
      installGuide:
        'แก้ไขลิงก์ repoUrl ใน data/mods.json เป็นลิงก์ GitHub Repository ของโปรเจกต์คุณ หรือเพิ่มโปรเจกต์ GitHub อื่นๆ ต่อท้ายในไฟล์เดียวกันได้เลย',
      updates: [
        {
          notes:
            '- เว็บไซต์แสดงผลงาน Focal Studio ธีม Cyber / Pixel (Blue Miku / White / Black)\n- มาพร้อมเครื่องมือ Cover Maker (920×430) และระบบโหลดข้อมูลจาก data/mods.json',
        },
      ],
    },
  ];

  const state = {
    mods: [],
    category: 'all', // 'all' | 'translation' | 'github' | 'developing'
    query: '',
    page: 1,
    usedFallback: false,
  };

  const els = {
    rootHtml: document.documentElement,
    modGrid: document.querySelector('.mod-grid'),
    searchInput: document.querySelector('.search-field input'),
    clearBtn: document.querySelector('.filter-bar .icon-text-button'),
    categoryTabs: Array.from(document.querySelectorAll('.mod-view-tab[data-category]')),
    pagination: document.querySelector('.mod-pagination'),
    pageList: document.querySelector('.mod-page-list'),
    pagePrev: document.querySelector('.mod-pagination .mod-page-nav:first-of-type'),
    pageNext: document.querySelector('.mod-pagination .mod-page-nav:last-of-type'),
    showingCountText: document.querySelector('#mods .section-heading p'),
    statTotal: document.querySelector('.core-stats > div:first-child dd'),
    statUpdated: document.querySelector('.core-stats > div:nth-child(2) dd'),
    statDev: document.querySelector('.core-stat-development dd'),
    statDevLink: document.querySelector('.core-stat-link'),
    worldCanvas: document.querySelector('.world-canvas'),
  };

  async function init() {
    initContentProtection();
    bindEvents();
    initCursorAura();
    initHeroCanvas();
    await loadMods();
  }

  /** Disable right-click context menu and common DevTools shortcuts. */
  function initContentProtection() {
    els.rootHtml.classList.add('content-protection-active');

    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    document.addEventListener('keydown', (e) => {
      const key = String(e.key || '').toUpperCase();
      const ctrlOrCmd = e.ctrlKey || e.metaKey;

      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        return;
      }

      if (
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C', 'K'].includes(key)) ||
        (e.metaKey && e.altKey && ['I', 'J', 'C'].includes(key)) ||
        (ctrlOrCmd && key === 'U')
      ) {
        e.preventDefault();
      }
    });
  }

  /** Fetch ./data/mods.json and render cards into .mod-grid. */
  async function loadMods() {
    if (els.modGrid) {
      els.modGrid.setAttribute('aria-busy', 'true');
    }

    try {
      const response = await fetch(MODS_JSON_URL, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      state.mods = Array.isArray(data) ? data : [];
      state.usedFallback = false;
    } catch (_err) {
      state.mods = FILE_PROTOCOL_FALLBACK;
      state.usedFallback = true;
    }

    if (els.modGrid) {
      els.modGrid.setAttribute('aria-busy', 'false');
    }

    updateCounts();
    applyFilters();
  }

  function getItemCategory(item) {
    return item.category || 'translation';
  }

  /** Update hero and category tab counters based on loaded JSON entries. */
  function updateCounts() {
    const total = state.mods.length;
    const devCount = state.mods.filter((m) => m.status === 'developing').length;
    const latestDate = state.mods[state.mods.length - 1]?.updatedDate || state.mods[0]?.updatedDate;

    if (els.statTotal) els.statTotal.textContent = String(total);
    if (els.statUpdated && latestDate) {
      els.statUpdated.textContent = latestDate;
    }
    if (els.statDev) {
      const textNode = Array.from(els.statDev.childNodes).find(
        (n) => n.nodeType === Node.TEXT_NODE
      );
      if (textNode) {
        textNode.textContent = String(devCount);
      }
    }
    if (els.statDevLink) {
      els.statDevLink.setAttribute(
        'aria-label',
        `ดูผลงานที่กำลังพัฒนา ${devCount} รายการ`
      );
    }

    els.categoryTabs.forEach((tabBtn) => {
      const cat = tabBtn.dataset.category;
      const countEl = tabBtn.querySelector('.mod-view-tab-count');
      if (!countEl) return;

      let count = total;
      if (cat === 'developing') {
        count = devCount;
      } else if (cat !== 'all') {
        count = state.mods.filter((m) => getItemCategory(m) === cat).length;
      }
      countEl.textContent = String(count);
    });
  }

  /** Filter items by active category and search query, then render current page. */
  function applyFilters() {
    if (!els.modGrid) return;

    const query = state.query.trim().toLowerCase();
    const matched = state.mods.filter((item) => {
      const itemCat = getItemCategory(item);
      if (state.category === 'developing' && item.status !== 'developing') {
        return false;
      }
      if (
        state.category !== 'all' &&
        state.category !== 'developing' &&
        itemCat !== state.category
      ) {
        return false;
      }

      if (query) {
        const meta = CATEGORY_META[itemCat] || CATEGORY_META.translation;
        const haystack = [
          item.title,
          meta.label,
          item.gameVersion,
          item.techStack,
          item.modVersion,
          item.installGuide,
          ...(item.highlights || []),
          ...(item.updates || []).map((u) => `${u.version || ''} ${u.notes || ''}`),
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      return true;
    });

    const totalPages = Math.max(1, Math.ceil(matched.length / PAGE_SIZE));
    if (state.page > totalPages) state.page = totalPages;

    const start = (state.page - 1) * PAGE_SIZE;
    const pageItems = matched.slice(start, start + PAGE_SIZE);

    els.modGrid.innerHTML = '';

    if (pageItems.length === 0) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'focal-empty-state';
      emptyEl.style.cssText =
        'grid-column:1/-1;padding:48px 20px;text-align:center;border:1px dashed rgba(57,197,187,0.45);color:#94a8b8;background:#0b1017;';
      emptyEl.innerHTML =
        '<p style="margin:0 0 8px;font-size:18px;color:#ffffff;font-weight:700;">ไม่พบผลงานที่ตรงกับเงื่อนไข</p><p style="margin:0;font-size:14px;">ลองเปลี่ยนหมวดหมู่หรือคำค้นหา</p>';
      els.modGrid.appendChild(emptyEl);
    } else {
      pageItems.forEach((item, index) => {
        els.modGrid.appendChild(createWorkCard(item, index));
      });
    }

    renderPagination(matched.length, totalPages);

    if (els.showingCountText) {
      els.showingCountText.textContent = `${matched.length} รายการในหมวดนี้`;
    }
  }

  /** Resolve update entry version: uses modVersion as single source of truth when omitted or 'auto'. */
  function resolveUpdateVersion(item, updateEntry, idx) {
    const raw = typeof updateEntry?.version === 'string' ? updateEntry.version.trim() : '';
    if (!raw || raw.toLowerCase() === 'auto') {
      return idx === 0 ? `เวอร์ชั่น ${item.modVersion || '1.0'}` : '';
    }
    return raw;
  }

  /** Build a .mod-card element for either a game translation or GitHub project. */
  function createWorkCard(item, index) {
    const article = document.createElement('article');
    const itemCat = getItemCategory(item);
    const meta = CATEGORY_META[itemCat] || CATEGORY_META.translation;
    const isGithub = itemCat === 'github';
    const sideUrl = isGithub ? item.repoUrl || item.githubUrl : item.steamUrl;
    const hasSideTab = Boolean(sideUrl);

    article.className = [
      'mod-card',
      hasSideTab ? 'has-steam-tab' : '',
      'has-freshness-badge',
    ]
      .filter(Boolean)
      .join(' ');
    article.tabIndex = 0;
    article.dataset.modId = item.id || `work-${index}`;
    article.dataset.category = itemCat;
    article.style.setProperty('--card-i', String(index));
    article.setAttribute('aria-label', `เปิดรายละเอียด ${item.title || 'ผลงาน'}`);

    const coverHtml = item.coverImage
      ? `<span class="mod-cover mod-cover-card mod-cover-image is-loaded"><img loading="lazy" decoding="async" alt="ภาพปก ${escapeHtml(item.title)}" src="${escapeHtml(item.coverImage)}"></span>`
      : `<span class="mod-cover mod-cover-card mod-cover-fallback"><span>${escapeHtml(item.coverFallbackTag || meta.label)}</span><strong>${escapeHtml(item.title)}</strong></span>`;

    const badgeType = String(item.badge || '').toUpperCase();
    const badgeHtml =
      badgeType === 'UPDATE'
        ? `<span class="mod-status-ribbon mod-status-ribbon-update new-update-badge" title="อัปเดตใหม่"><span class="mod-status-ribbon-label">UPDATE</span></span>`
        : badgeType === 'PROJECT'
          ? `<span class="mod-status-ribbon mod-status-ribbon-project new-update-badge" title="GitHub Project"><span class="mod-status-ribbon-label">PROJECT</span></span>`
          : badgeType === 'NEW'
            ? `<span class="mod-status-ribbon mod-status-ribbon-new new-update-badge" title="ผลงานใหม่"><span class="mod-status-ribbon-label">NEW</span></span>`
            : '';

    const tagsHtml = (item.highlights || [])
      .map(
        (tag) =>
          `<span><b class="mod-highlight-label">${escapeHtml(tag)}</b></span>`
      )
      .join('');

    const updatesHtml = (item.updates || [])
      .map(
        (u, idx) =>
          `<li><strong>${escapeHtml(resolveUpdateVersion(item, u, idx))}</strong><p>${escapeHtml(u.notes)}</p></li>`
      )
      .join('');

    const installPreviewHtml = item.installGuide
      ? `<div class="focal-install-box" style="margin-top:10px;"><strong>${isGithub ? 'รายละเอียด' : 'วิธีติดตั้ง'}</strong>${escapeHtml(item.installGuide)}</div>`
      : '';

    const sideTabHtml = hasSideTab
      ? `<a class="mod-steam-tab${isGithub ? ' mod-github-tab' : ''}" href="${escapeHtml(sideUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(meta.sideTabLabel)}: ${escapeHtml(item.title)}" title="${escapeHtml(meta.sideTabLabel)}: ${escapeHtml(item.title)}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3h7v7"></path><path d="m10 14 11-11"></path><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"></path></svg><span>${escapeHtml(meta.sideTabLabel)}</span></a>`
      : '';

    const spec1Val = isGithub ? item.techStack || item.gameVersion || '-' : item.gameVersion || '-';
    const spec2Val = item.modVersion || '-';

    article.innerHTML = `
      <div class="mod-card-face">
        <div class="mod-card-media">
          ${coverHtml}
          ${badgeHtml}
        </div>
        <div class="mod-card-body">
          <span class="focal-category-pill${isGithub ? ' is-github' : ''}">${escapeHtml(meta.label)}</span>
          <div class="mod-card-title"><h3>${escapeHtml(item.title)}</h3></div>
          <div class="tag-list" aria-label="คำไฮไลต์">${tagsHtml}</div>
          <div class="mod-card-freshness" aria-label="เวลาอัปเดตล่าสุด">
            <span>${escapeHtml(item.updatedAgo || 'อัปเดตล่าสุด')}</span>
            <span>${escapeHtml(item.updatedDate || '')}</span>
          </div>
          <div class="mod-card-content">
            ${updatesHtml ? `<section class="mod-update-timeline" aria-label="บันทึกเวอร์ชัน"><span class="mod-update-timeline-heading">บันทึกเวอร์ชัน</span><ol>${updatesHtml}</ol></section>` : ''}
            ${installPreviewHtml}
          </div>
          <div class="mod-card-footer">
            <dl class="mod-card-version-list" aria-label="ข้อมูลรุ่น">
              <div><dt>${escapeHtml(meta.spec1Label)}</dt><dd title="${escapeHtml(spec1Val)}">${escapeHtml(spec1Val)}</dd></div>
              <div><dt>${escapeHtml(meta.spec2Label)}</dt><dd title="${escapeHtml(spec2Val)}">${escapeHtml(spec2Val)}</dd></div>
            </dl>
          </div>
        </div>
      </div>
      ${sideTabHtml}
    `;

    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      article.addEventListener('pointermove', (e) => {
        const rect = article.getBoundingClientRect();
        const x = (((e.clientX - rect.left) / rect.width) * 100).toFixed(2);
        const y = (((e.clientY - rect.top) / rect.height) * 100).toFixed(2);
        article.style.setProperty('--glare-on', '1');
        article.style.setProperty('--glare-x', `${x}%`);
        article.style.setProperty('--glare-y', `${y}%`);
      });
      article.addEventListener('pointerleave', () => {
        article.style.setProperty('--glare-on', '0');
      });
    }

    article.addEventListener('click', (e) => {
      if (e.target.closest('.mod-steam-tab')) return;
      openWorkModal(item);
    });

    article.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.target.closest('a, button')) return;
        e.preventDefault();
        openWorkModal(item);
      }
    });

    return article;
  }

  /** Rebuild pagination buttons dynamically. */
  function renderPagination(totalMatched, totalPages) {
    if (!els.pagination || !els.pageList) return;

    els.pagination.style.display = totalMatched === 0 ? 'none' : 'flex';
    els.pageList.innerHTML = '';

    for (let i = 1; i <= totalPages; i += 1) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `mod-page-button${i === state.page ? ' active' : ''}`;
      btn.textContent = String(i);
      btn.setAttribute('aria-label', `ไปหน้าที่ ${i}`);
      if (i === state.page) btn.setAttribute('aria-current', 'page');

      btn.addEventListener('click', () => {
        state.page = i;
        applyFilters();
        document.getElementById('mods')?.scrollIntoView({ behavior: 'smooth' });
      });
      els.pageList.appendChild(btn);
    }

    if (els.pagePrev) els.pagePrev.disabled = state.page <= 1;
    if (els.pageNext) els.pageNext.disabled = state.page >= totalPages;
  }

  function setCategory(nextCategory) {
    state.category = nextCategory;
    state.page = 1;

    els.categoryTabs.forEach((tabBtn) => {
      const active = tabBtn.dataset.category === nextCategory;
      tabBtn.classList.toggle('active', active);
      tabBtn.setAttribute('aria-pressed', String(active));
    });

    applyFilters();
  }

  function bindEvents() {
    els.searchInput?.addEventListener('input', (e) => {
      state.query = e.target.value || '';
      state.page = 1;
      applyFilters();
    });

    els.clearBtn?.addEventListener('click', () => {
      state.query = '';
      state.page = 1;
      if (els.searchInput) els.searchInput.value = '';
      setCategory('all');
    });

    els.categoryTabs.forEach((tabBtn) => {
      tabBtn.addEventListener('click', () => {
        setCategory(tabBtn.dataset.category || 'all');
      });
    });

    els.statDevLink?.addEventListener('click', () => {
      setCategory('developing');
      document.getElementById('mods')?.scrollIntoView({ behavior: 'smooth' });
    });

    els.pagePrev?.addEventListener('click', () => {
      if (state.page > 1) {
        state.page -= 1;
        applyFilters();
        document.getElementById('mods')?.scrollIntoView({ behavior: 'smooth' });
      }
    });

    els.pageNext?.addEventListener('click', () => {
      state.page += 1;
      applyFilters();
      document.getElementById('mods')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  function openWorkModal(item) {
    const itemCat = getItemCategory(item);
    const meta = CATEGORY_META[itemCat] || CATEGORY_META.translation;
    const isGithub = itemCat === 'github';

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.setAttribute('aria-label', item.title || 'รายละเอียดผลงาน');

    const highlightsHtml = (item.highlights || [])
      .map(
        (h) =>
          `<span style="display:inline-block;padding:4px 10px;border:1px solid rgba(57,197,187,0.45);background:rgba(57,197,187,0.12);color:#7af2ec;font-size:12px;">${escapeHtml(h)}</span>`
      )
      .join(' ');

    const updatesHtml = (item.updates || [])
      .map(
        (u, idx) =>
          `<div style="margin-bottom:10px;"><strong style="color:#39c5bb;">${escapeHtml(resolveUpdateVersion(item, u, idx))}</strong><p style="margin:4px 0 0;white-space:pre-line;color:#d6e6ea;font-size:14px;">${escapeHtml(u.notes)}</p></div>`
      )
      .join('');

    const screenshotsHtml =
      Array.isArray(item.screenshots) && item.screenshots.length > 0
        ? `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;">${item.screenshots
            .map(
              (src) =>
                `<img src="${escapeHtml(src)}" alt="ภาพตัวอย่าง ${escapeHtml(item.title)}" style="width:100%;aspect-ratio:16/9;object-fit:cover;border:1px solid rgba(57,197,187,0.35);">`
            )
            .join('')}</div>`
        : '';

    const installHtml = item.installGuide
      ? `<div class="focal-install-box"><strong>${escapeHtml(meta.installTitle)}</strong>${escapeHtml(item.installGuide)}</div>`
      : '';

    let actionsHtml = '';
    if (isGithub) {
      const repoUrl = item.repoUrl || item.githubUrl;
      const demoUrl = item.demoUrl || item.downloadUrl;
      actionsHtml = `
        ${repoUrl ? `<a class="primary-action" href="${escapeHtml(repoUrl)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;padding:12px 20px;display:inline-flex;align-items:center;font-weight:700;">เปิด Repository บน GitHub ↗</a>` : ''}
        ${demoUrl ? `<a class="action-secondary" href="${escapeHtml(demoUrl)}" target="_blank" rel="noopener noreferrer" style="padding:12px 18px;text-decoration:none;border:1px solid rgba(57,197,187,0.45);">เปิดใช้งาน / Demo ↗</a>` : ''}
      `;
    } else {
      const isGoogleDrive =
        typeof item.downloadUrl === 'string' &&
        item.downloadUrl.includes('drive.google.com');
      const downloadLabel = isGoogleDrive
        ? 'ดาวน์โหลดแพตช์ (Google Drive) ↗'
        : 'ดาวน์โหลดแพตช์ ↗';
      const downloadBtn = item.downloadUrl
        ? `<a class="primary-action" href="${escapeHtml(item.downloadUrl)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;padding:12px 20px;display:inline-flex;align-items:center;font-weight:700;">${downloadLabel}</a>`
        : `<button type="button" class="primary-action" disabled style="opacity:0.65;cursor:not-allowed;padding:12px 20px;">ยังไม่ได้ใส่ลิงก์ดาวน์โหลด</button>`;
      const steamBtn = item.steamUrl
        ? `<a class="action-secondary" href="${escapeHtml(item.steamUrl)}" target="_blank" rel="noopener noreferrer" style="padding:12px 18px;text-decoration:none;border:1px solid rgba(57,197,187,0.45);">เปิดหน้า Steam ↗</a>`
        : '';
      actionsHtml = `${downloadBtn}${steamBtn}`;
    }

    const spec1Val = isGithub ? item.techStack || item.gameVersion || '-' : item.gameVersion || '-';
    const spec2Val = item.modVersion || '-';

    backdrop.innerHTML = `
      <div class="modal-panel" style="padding:24px;max-width:760px;">
        <button type="button" class="icon-text-button modal-close" aria-label="ปิดหน้าต่าง">ปิด ✕</button>
        <div class="modal-content" style="display:grid;gap:16px;">
          ${item.coverImage ? `<img src="${escapeHtml(item.coverImage)}" alt="${escapeHtml(item.title)}" style="width:100%;aspect-ratio:460/215;object-fit:cover;border:1px solid rgba(57,197,187,0.4);">` : ''}
          <div>
            <span class="focal-category-pill${isGithub ? ' is-github' : ''}">${escapeHtml(meta.label)}</span>
            <h2 style="margin:0 0 10px;font-size:24px;color:#ffffff;">${escapeHtml(item.title)}</h2>
            <div style="display:flex;flex-wrap:wrap;gap:8px;">${highlightsHtml}</div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;">
            <div style="padding:8px 12px;border:1px solid rgba(255,255,255,0.14);background:#05070a;"><small style="display:block;color:#94a8b8;font-size:11px;">${escapeHtml(meta.spec1Label)}</small><strong style="color:#ffffff;font-size:13px;">${escapeHtml(spec1Val)}</strong></div>
            <div style="padding:8px 12px;border:1px solid rgba(255,255,255,0.14);background:#05070a;"><small style="display:block;color:#94a8b8;font-size:11px;">${escapeHtml(meta.spec2Label)}</small><strong style="color:#39c5bb;font-size:13px;">${escapeHtml(spec2Val)}</strong></div>
          </div>
          ${installHtml}
          ${updatesHtml ? `<div style="padding:14px;border:1px solid rgba(57,197,187,0.28);background:#05070a;">${updatesHtml}</div>` : ''}
          ${screenshotsHtml}
          <div class="modal-action-row" style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;">
            ${actionsHtml}
          </div>
        </div>
      </div>
    `;

    const closeModal = () => {
      document.removeEventListener('keydown', onKeyDown);
      backdrop.remove();
    };
    const onKeyDown = (ev) => {
      if (ev.key === 'Escape') closeModal();
    };

    backdrop.addEventListener('click', (ev) => {
      if (ev.target === backdrop || ev.target.closest('.modal-close')) {
        closeModal();
      }
    });
    document.addEventListener('keydown', onKeyDown);
    document.body.appendChild(backdrop);
  }

  function initCursorAura() {
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!canHover || reducedMotion) return;

    window.addEventListener(
      'pointermove',
      (e) => {
        els.rootHtml.style.setProperty('--cursor-x', `${e.clientX}px`);
        els.rootHtml.style.setProperty('--cursor-y', `${e.clientY}px`);
        els.rootHtml.style.setProperty('--aura-on', '1');
        els.rootHtml.style.setProperty('--mx', (e.clientX / window.innerWidth).toFixed(3));
        els.rootHtml.style.setProperty('--my', (e.clientY / window.innerHeight).toFixed(3));
      },
      { passive: true }
    );
  }

  /** Miku Blue + Cyan + White animated particles on the hero background canvas (mobile-optimized). */
  function initHeroCanvas() {
    const canvas = els.worldCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const maxDist = 135;
    const maxDistSq = maxDist * maxDist;
    let width = 0;
    let height = 0;
    let lastSeedWidth = 0;
    let particles = [];
    let rafId = 0;
    let isVisible = true;

    function seedParticles() {
      const count = width < 640 ? 22 : Math.min(56, Math.max(24, Math.floor(width / 32)));
      particles = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.8 + 0.8,
        color:
          i % 4 === 0
            ? 'rgba(255, 255, 255, 0.5)'
            : i % 2 === 0
              ? 'rgba(57, 197, 187, 0.65)'
              : 'rgba(0, 216, 255, 0.5)',
      }));
      lastSeedWidth = width;
    }

    function resize() {
      const parent = canvas.parentElement;
      const nextWidth = parent ? parent.clientWidth : window.innerWidth;
      const nextHeight = parent ? parent.clientHeight : 700;
      width = nextWidth;
      height = nextHeight;
      canvas.width = width;
      canvas.height = height;

      if (particles.length === 0 || Math.abs(width - lastSeedWidth) > 24) {
        seedParticles();
      }
    }

    function draw() {
      rafId = 0;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        if (!reducedMotion) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j += 1) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < maxDistSq) {
            const alpha = (1 - Math.sqrt(distSq) / maxDist) * 0.16;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(57, 197, 187, ${alpha.toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      if (!reducedMotion && isVisible && !document.hidden) {
        rafId = window.requestAnimationFrame(draw);
      }
    }

    function startLoop() {
      if (!rafId && !reducedMotion && isVisible && !document.hidden) {
        rafId = window.requestAnimationFrame(draw);
      }
    }

    function stopLoop() {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }

    resize();
    draw();
    window.addEventListener('resize', resize, { passive: true });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(
        (entries) => {
          isVisible = entries[0]?.isIntersecting ?? true;
          if (isVisible) startLoop();
          else stopLoop();
        },
        { threshold: 0.02 }
      ).observe(canvas);
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopLoop();
      else startLoop();
    });
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
