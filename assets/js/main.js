/**
 * Focal Studio - Dynamic JSON catalog & UI interactions for GitHub Pages.
 * Loads entries from ./data/mods.json and handles search, tabs, pagination,
 * detail modal with installGuide + Google Drive download, and cyber canvas.
 */
(() => {
  'use strict';

  const MODS_JSON_URL = './data/mods.json';
  const PAGE_SIZE = 12;

  // Fallback used only if opened directly via file:// where browser CORS blocks fetch().
  const FILE_PROTOCOL_FALLBACK = [
    {
      id: 'clannad-patch-th',
      title: 'Clannad Patch ไทย',
      status: 'published',
      badge: 'NEW',
      coverImage: './assets/images/games/clannad/cover.png',
      screenshots: [],
      highlights: ['Focal Studio', 'Windows Installer'],
      updatedAgo: 'ล่าสุด',
      updatedDate: '12 พ.ย. 2569',
      gameVersion: 'Steam (CLANNAD)',
      modVersion: '1.0',
      steamUrl: 'https://store.steampowered.com/app/324160/CLANNAD/',
      downloadUrl:
        'https://drive.google.com/file/d/11gmKyocUw5IPfuRswFFJWySMFn-KMv4F/view?usp=sharing',
      installGuide:
        'วิธีการติดตั้ง Patch นี้จะเหมือนกับการติดตั้งแอปบน Windows เลย (ต้องมีตัวเกม Clannad ในเครื่องที่ download บน Steam ก่อน)',
      updates: [
        {
          version: 'เวอร์ชั่น 1.0',
          notes:
            '- แพตช์แปลภาษาไทยสำหรับเกม Clannad (เวอร์ชัน Steam)\n- ติดตั้งผ่านตัวติดตั้งบน Windows ได้ทันที',
        },
      ],
    },
  ];

  const state = {
    mods: [],
    tab: 'all', // 'all' | 'development'
    query: '',
    page: 1,
    usedFallback: false,
  };

  const els = {
    rootHtml: document.documentElement,
    modGrid: document.querySelector('.mod-grid'),
    searchInput: document.querySelector('.search-field input'),
    clearBtn: document.querySelector('.filter-bar .icon-text-button'),
    tabAll: document.querySelector('.mod-view-tab-all'),
    tabDev: document.querySelector('.mod-view-tab-development'),
    pagination: document.querySelector('.mod-pagination'),
    pageList: document.querySelector('.mod-page-list'),
    pagePrev: document.querySelector('.mod-pagination .mod-page-nav:first-of-type'),
    pageNext: document.querySelector('.mod-pagination .mod-page-nav:last-of-type'),
    showingCountText: document.querySelector('#mods .section-heading p'),
    statTotal: document.querySelector('.core-stats > div:first-child dd'),
    statDev: document.querySelector('.core-stat-development dd'),
    statDevLink: document.querySelector('.core-stat-link'),
    tabAllCount: document.querySelector('.mod-view-tab-all .mod-view-tab-count'),
    tabDevCount: document.querySelector('.mod-view-tab-development .mod-view-tab-count'),
    worldCanvas: document.querySelector('.world-canvas'),
  };

  async function init() {
    bindEvents();
    initCursorAura();
    initHeroCanvas();
    await loadMods();
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

  /** Update hero and tab counters based on loaded JSON entries. */
  function updateCounts() {
    const total = state.mods.length;
    const devCount = state.mods.filter((m) => m.status === 'developing').length;

    if (els.statTotal) els.statTotal.textContent = String(total);
    if (els.tabAllCount) els.tabAllCount.textContent = String(total);
    if (els.tabDevCount) els.tabDevCount.textContent = String(devCount);
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
        `ดูเกมที่กำลังพัฒนา ${devCount} รายการ`
      );
    }
  }

  /** Filter mods from JSON and render current page cards. */
  function applyFilters() {
    if (!els.modGrid) return;

    const query = state.query.trim().toLowerCase();
    const matched = state.mods.filter((mod) => {
      const isDev = mod.status === 'developing';
      if (state.tab === 'development' && !isDev) return false;

      if (query) {
        const haystack = [
          mod.title,
          mod.gameVersion,
          mod.modVersion,
          mod.installGuide,
          ...(mod.highlights || []),
          ...(mod.updates || []).map((u) => `${u.version} ${u.notes}`),
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
        '<p style="margin:0 0 8px;font-size:18px;color:#ffffff;font-weight:700;">ไม่พบแพตช์ที่ตรงกับเงื่อนไข</p><p style="margin:0;font-size:14px;">ลองเปลี่ยนคำค้นหา หรือเพิ่มรายการเกมใน <code>data/mods.json</code></p>';
      els.modGrid.appendChild(emptyEl);
    } else {
      pageItems.forEach((mod, index) => {
        els.modGrid.appendChild(createModCard(mod, index));
      });
    }

    if (state.usedFallback && window.location.protocol === 'file:') {
      const note = document.createElement('p');
      note.style.cssText =
        'grid-column:1/-1;margin:8px 0 0;padding:10px 14px;border:1px solid rgba(57,197,187,0.35);background:#0b1017;color:#94a8b8;font-size:12px;';
      note.innerHTML =
        'หมายเหตุ: เปิดผ่าน <code>file://</code> เบราว์เซอร์จะบล็อกการอ่าน <code>data/mods.json</code> ชั่วคราว — เมื่ออัปขึ้น GitHub Pages หรือรันผ่าน Local Server จะโหลดจาก <code>data/mods.json</code> โดยตรง';
      els.modGrid.appendChild(note);
    }

    renderPagination(matched.length, totalPages);

    if (els.showingCountText) {
      els.showingCountText.textContent = `${matched.length} รายการในคลัง`;
    }
  }

  /** Build a .mod-card element from a JSON entry. */
  function createModCard(mod, index) {
    const article = document.createElement('article');
    const hasSteam = Boolean(mod.steamUrl);
    article.className = [
      'mod-card',
      hasSteam ? 'has-steam-tab' : '',
      'has-freshness-badge',
    ]
      .filter(Boolean)
      .join(' ');
    article.tabIndex = 0;
    article.dataset.modId = mod.id || `mod-${index}`;
    article.style.setProperty('--card-i', String(index));
    article.setAttribute('aria-label', `เปิดรายละเอียด ${mod.title || 'แพตช์'}`);

    const coverHtml = mod.coverImage
      ? `<span class="mod-cover mod-cover-card mod-cover-image is-loaded"><img loading="lazy" decoding="async" alt="ภาพปก ${escapeHtml(mod.title)}" src="${escapeHtml(mod.coverImage)}"></span>`
      : `<span class="mod-cover mod-cover-card mod-cover-fallback"><span>${escapeHtml(mod.coverFallbackTag || 'FOCAL TH')}</span><strong>${escapeHtml(mod.title)}</strong></span>`;

    const badgeType = String(mod.badge || '').toUpperCase();
    const badgeHtml =
      badgeType === 'UPDATE'
        ? `<span class="mod-status-ribbon mod-status-ribbon-update new-update-badge" title="อัปเดตใหม่"><span class="mod-status-ribbon-label">UPDATE</span></span>`
        : badgeType === 'NEW'
          ? `<span class="mod-status-ribbon mod-status-ribbon-new new-update-badge" title="แพตช์ใหม่"><span class="mod-status-ribbon-label">NEW</span></span>`
          : '';

    const tagsHtml = (mod.highlights || [])
      .map(
        (tag) =>
          `<span><b class="mod-highlight-label">${escapeHtml(tag)}</b></span>`
      )
      .join('');

    const updatesHtml = (mod.updates || [])
      .map(
        (u) =>
          `<li><strong>${escapeHtml(u.version)}</strong><p>${escapeHtml(u.notes)}</p></li>`
      )
      .join('');

    const installPreviewHtml = mod.installGuide
      ? `<div class="focal-install-box" style="margin-top:10px;"><strong>วิธีติดตั้ง</strong>${escapeHtml(mod.installGuide)}</div>`
      : '';

    const steamHtml = hasSteam
      ? `<a class="mod-steam-tab" href="${escapeHtml(mod.steamUrl)}" target="_blank" rel="noopener noreferrer" aria-label="เปิด ${escapeHtml(mod.title)} บน Steam ในแท็บใหม่" title="เปิดหน้า Steam: ${escapeHtml(mod.title)}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3h7v7"></path><path d="m10 14 11-11"></path><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"></path></svg><span>เปิดหน้า Steam</span></a>`
      : '';

    article.innerHTML = `
      <div class="mod-card-face">
        <div class="mod-card-media">
          ${coverHtml}
          ${badgeHtml}
        </div>
        <div class="mod-card-body">
          <div class="mod-card-title"><h3>${escapeHtml(mod.title)}</h3></div>
          <div class="tag-list" aria-label="คำไฮไลต์">${tagsHtml}</div>
          <div class="mod-card-freshness" aria-label="เวลาอัปเดตล่าสุด">
            <span>${escapeHtml(mod.updatedAgo || 'อัปเดตล่าสุด')}</span>
            <span>${escapeHtml(mod.updatedDate || '')}</span>
          </div>
          <div class="mod-card-content">
            ${updatesHtml ? `<section class="mod-update-timeline" aria-label="อัปเดตแพตช์"><span class="mod-update-timeline-heading">บันทึกเวอร์ชัน</span><ol>${updatesHtml}</ol></section>` : ''}
            ${installPreviewHtml}
          </div>
          <div class="mod-card-footer">
            <dl class="mod-card-version-list" aria-label="เวอร์ชันที่รองรับ">
              <div><dt>เกม</dt><dd title="${escapeHtml(mod.gameVersion || '-')}">${escapeHtml(mod.gameVersion || '-')}</dd></div>
              <div><dt>แพตช์</dt><dd title="${escapeHtml(mod.modVersion || '-')}">${escapeHtml(mod.modVersion || '-')}</dd></div>
            </dl>
          </div>
        </div>
      </div>
      ${steamHtml}
    `;

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

    article.addEventListener('click', (e) => {
      if (e.target.closest('.mod-steam-tab')) return;
      openModModal(mod);
    });

    article.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.target.closest('a, button')) return;
        e.preventDefault();
        openModModal(mod);
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

  function setTab(nextTab) {
    state.tab = nextTab;
    state.page = 1;

    if (els.tabAll) {
      const active = nextTab === 'all';
      els.tabAll.classList.toggle('active', active);
      els.tabAll.setAttribute('aria-pressed', String(active));
    }
    if (els.tabDev) {
      const active = nextTab === 'development';
      els.tabDev.classList.toggle('active', active);
      els.tabDev.setAttribute('aria-pressed', String(active));
    }
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
      setTab('all');
    });

    els.tabAll?.addEventListener('click', () => setTab('all'));
    els.tabDev?.addEventListener('click', () => setTab('development'));

    els.statDevLink?.addEventListener('click', () => {
      setTab('development');
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

  function openModModal(mod) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.setAttribute('aria-label', mod.title || 'รายละเอียดแพตช์');

    const highlightsHtml = (mod.highlights || [])
      .map(
        (h) =>
          `<span style="display:inline-block;padding:4px 10px;border:1px solid rgba(57,197,187,0.45);background:rgba(57,197,187,0.12);color:#7af2ec;font-size:12px;">${escapeHtml(h)}</span>`
      )
      .join(' ');

    const updatesHtml = (mod.updates || [])
      .map(
        (u) =>
          `<div style="margin-bottom:10px;"><strong style="color:#39c5bb;">${escapeHtml(u.version)}</strong><p style="margin:4px 0 0;white-space:pre-line;color:#d6e6ea;font-size:14px;">${escapeHtml(u.notes)}</p></div>`
      )
      .join('');

    const screenshotsHtml =
      Array.isArray(mod.screenshots) && mod.screenshots.length > 0
        ? `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;">${mod.screenshots
            .map(
              (src) =>
                `<img src="${escapeHtml(src)}" alt="ภาพตัวอย่าง ${escapeHtml(mod.title)}" style="width:100%;aspect-ratio:16/9;object-fit:cover;border:1px solid rgba(57,197,187,0.35);">`
            )
            .join('')}</div>`
        : '';

    const installHtml = mod.installGuide
      ? `<div class="focal-install-box"><strong>วิธีติดตั้งแพตช์ (Windows Installer)</strong>${escapeHtml(mod.installGuide)}</div>`
      : '';

    const isGoogleDrive =
      typeof mod.downloadUrl === 'string' &&
      mod.downloadUrl.includes('drive.google.com');
    const downloadLabel = isGoogleDrive
      ? 'ดาวน์โหลดแพตช์ (Google Drive) ↗'
      : 'ดาวน์โหลดแพตช์ ↗';

    const downloadActionHtml = mod.downloadUrl
      ? `<a class="primary-action" href="${escapeHtml(mod.downloadUrl)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;padding:12px 20px;display:inline-flex;align-items:center;font-weight:700;">${downloadLabel}</a>`
      : `<button type="button" class="primary-action" disabled style="opacity:0.65;cursor:not-allowed;padding:12px 20px;">ยังไม่ได้ใส่ลิงก์ดาวน์โหลด (แก้ที่ data/mods.json)</button>`;

    backdrop.innerHTML = `
      <div class="modal-panel" style="padding:24px;max-width:760px;">
        <button type="button" class="icon-text-button modal-close" aria-label="ปิดหน้าต่าง">ปิด ✕</button>
        <div class="modal-content" style="display:grid;gap:16px;">
          ${mod.coverImage ? `<img src="${escapeHtml(mod.coverImage)}" alt="${escapeHtml(mod.title)}" style="width:100%;aspect-ratio:460/215;object-fit:cover;border:1px solid rgba(57,197,187,0.4);">` : ''}
          <div>
            <h2 style="margin:0 0 10px;font-size:24px;color:#ffffff;">${escapeHtml(mod.title)}</h2>
            <div style="display:flex;flex-wrap:wrap;gap:8px;">${highlightsHtml}</div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;">
            <div style="padding:8px 12px;border:1px solid rgba(255,255,255,0.14);background:#05070a;"><small style="display:block;color:#94a8b8;font-size:11px;">เวอร์ชันเกมที่รองรับ</small><strong style="color:#ffffff;font-size:13px;">${escapeHtml(mod.gameVersion || '-')}</strong></div>
            <div style="padding:8px 12px;border:1px solid rgba(255,255,255,0.14);background:#05070a;"><small style="display:block;color:#94a8b8;font-size:11px;">เวอร์ชันแพตช์</small><strong style="color:#39c5bb;font-size:13px;">${escapeHtml(mod.modVersion || '-')}</strong></div>
          </div>
          ${installHtml}
          ${updatesHtml ? `<div style="padding:14px;border:1px solid rgba(57,197,187,0.28);background:#05070a;">${updatesHtml}</div>` : ''}
          ${screenshotsHtml}
          <div class="modal-action-row" style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;">
            ${downloadActionHtml}
            ${mod.steamUrl ? `<a class="action-secondary" href="${escapeHtml(mod.steamUrl)}" target="_blank" rel="noopener noreferrer" style="padding:12px 18px;text-decoration:none;border:1px solid rgba(57,197,187,0.45);">เปิดหน้า Steam ↗</a>` : ''}
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

  /** Miku Blue + Cyan + White animated particles on the hero background canvas. */
  function initHeroCanvas() {
    const canvas = els.worldCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let particles = [];

    function resize() {
      const parent = canvas.parentElement;
      width = parent ? parent.clientWidth : window.innerWidth;
      height = parent ? parent.clientHeight : 700;
      canvas.width = width;
      canvas.height = height;
      const count = Math.min(60, Math.max(22, Math.floor(width / 30)));
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
    }

    function draw() {
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
          const dist = Math.hypot(p.x - q.x, p.y - q.y);
          if (dist < 135) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(57, 197, 187, ${(1 - dist / 135) * 0.16})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      if (!reducedMotion) {
        window.requestAnimationFrame(draw);
      }
    }

    resize();
    draw();
    window.addEventListener('resize', resize);
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
