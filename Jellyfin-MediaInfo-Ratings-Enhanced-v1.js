(function () {
  'use strict';

   // ============================================================
  // CONFIG START
  // ============================================================
  // ============================================================
  // ACCESS CONTROL
  // ============================================================
  // Only runs the script on the OS platforms listed below.
  // Values: 'windows' | 'android' | 'ios' | 'macos' | 'linux' | 'chromeos'
  const ALLOWED_PLATFORMS = ['windows'];
  function detectPlatform() {
    const ua = (navigator.userAgent || '').toLowerCase();
    if (ua.includes('android')) return 'android';
    if (ua.includes('windows')) return 'windows';
    if (ua.includes('iphone') || ua.includes('ipad')) return 'ios';
    if (ua.includes('mac os')) return 'macos';
    if (ua.includes('cros')) return 'chromeos';
    if (ua.includes('linux')) return 'linux';
    return 'unknown';
  }
  if (!ALLOWED_PLATFORMS.includes(detectPlatform())) return;
 // ============================================================
  // CONFIG GLOBAL
  // ============================================================
  const CONFIG_GLOBAL = {
    // Network mode used for all API calls:
    // - "basic": uses window.fetch() (default; what the Injector path always used)
    // - "user": uses GM_xmlhttpRequest - only in a userscript manager that grants it
    //   (@grant GM_xmlhttpRequest + @connect api.mdblist.com); this file has no
    //   metadata block, so without one it falls back to fetch() with a warning
    MODE: 'basic', // basic | user
    // MDBList API key (required to query mdblist.com for ratings)
    API_KEY: '',
    // Enable/disable debug logging (when true, extra logs will be printed to the browser console)
    DEBUG: false,
    // Room for the extra ratings line (only when an extra line is configured below):
    // - "reserve": the detail header is drawn with the line's room from the start; the room
    //   is taken away again only if no ratings come (nothing grows while ratings load)
    // - "grow": the room is added once the ratings have arrived
    EXTRA_ROW_SPACE: 'reserve', // reserve | grow
    // Polling triggers for detecting and processing newly inserted TMDB links in the page
    TRIGGERS: {
      pollMs: 1000,
      linkSelectors: ['a.emby-button[href*="themoviedb.org/"]', 'a[href*="themoviedb.org/"]'],
    },
    // Response cache settings (in memory, and in localStorage so other tabs and reloads
    // reuse an answer within the same TTL; reduces API calls and speeds up repeated views)
    CACHE: {
      enabled: true,
      ttlMinutes: 360,
    },
    // Shared logo assets used when rendering external rating sources in the UI
    LOGO_URLS: {
      imdb: 'https://cdn.jsdelivr.net/gh/Druidblack/jellyfin_ratings@main/logo/IMDb.png',
      tmdb: 'https://cdn.jsdelivr.net/gh/Druidblack/jellyfin_ratings@main/logo/TMDB.png',
      tomatoes: 'https://cdn.jsdelivr.net/gh/Druidblack/jellyfin_ratings@main/logo/Rotten_Tomatoes.png',
      tomatoes_rotten: 'https://cdn.jsdelivr.net/gh/Druidblack/jellyfin_ratings@main/logo/Rotten_Tomatoes_rotten.png',
      audience: 'https://cdn.jsdelivr.net/gh/Druidblack/jellyfin_ratings@main/logo/Rotten_Tomatoes_positive_audience.png',
      audience_rotten:
        'https://cdn.jsdelivr.net/gh/Druidblack/jellyfin_ratings@main/logo/Rotten_Tomatoes_negative_audience.png',
      metacritic: 'https://cdn.jsdelivr.net/gh/Druidblack/jellyfin_ratings@main/logo/Metacritic.png',
      metacriticus: 'https://cdn.jsdelivr.net/gh/Druidblack/jellyfin_ratings@main/logo/mus2.png',
      trakt: 'https://cdn.jsdelivr.net/gh/Druidblack/jellyfin_ratings@main/logo/Trakt.png',
      letterboxd: 'https://cdn.jsdelivr.net/gh/Druidblack/jellyfin_ratings@main/logo/letterboxd.png',
      rogerebert: 'https://cdn.jsdelivr.net/gh/Druidblack/jellyfin_ratings@main/logo/Roger_Ebert.png',
      kinopoisk: 'https://cdn.jsdelivr.net/gh/Druidblack/jellyfin_ratings@main/logo/kinopoisk.png',
      myanimelist: 'https://cdn.jsdelivr.net/gh/Druidblack/jellyfin_ratings@main/logo/mal.png',
      rt_certified: 'https://cdn.jsdelivr.net/gh/Druidblack/jellyfin_ratings@main/logo/rotten-tomatoes-certified.png',
    },
  };
  // ============================================================
  // CONFIG MOVIES
  // ============================================================
  const CONFIG_MOVIE = {
    // Jellyfin built-in ratings visibility (internal star rating + critic rating):
    // - "both": show star + critic rating
    // - "rating_only": show only the star rating
    // - "critics_only": show only the critic rating
    // - "hide": hide both built-in ratings
    UI_JELLYFIN_DB_RATINGS_MODE: 'rating_only', // both | rating_only | critics_only | hide
    // Disable ALL external ratings fetching/rendering from MDBList (keeps only Jellyfin built-in ratings)
    UI_DEACTIVATE_JELLYFIN_EXTRA_RATINGS: false, // true | false
    // Move Jellyfin internal ratings (star/critic) into the extra row (second line) instead of the main row
    UI_INTERNAL_RATINGS_NEW_LINE_MOVE: true, // true | false
    // Render external MDBList ratings in the extra row (second line) instead of the main row
    UI_EXTERNAL_RATINGS_NEW_LINE: true, // true | false
    // Show/hide "Ends at" (movies only; used when Jellyfin provides that info)
    ENDING_AT_MODE: true, // true | false
    // Position of "Ends at" within its chosen line:
    // - "vanilla": keep Jellyfin default ordering
    // - "begin": place before internal ratings on that line
    // - "end": place at the end of that line (after ratings)
    ENDING_AT_POSITION_MODE: 'vanilla', // vanilla | begin | end
    // Which line "Ends at" should appear on:
    // - "main": stay on main line with internal/external (depending on other settings)
    // - "after_main": move to its own line right after the main line
    // - "after_external": move to its own line after the external ratings line
    // - "same_external": move into the external ratings line (extra row)
    ENDING_AT_LINE_MODE: 'main', // main | after_main | after_external | same_external
    // Replace Jellyfin indernal DB critic icon with "Fresh" / "Certified" icons based on Jellyfin critic score (0.0–10.0)
    UI_CRITICSRATING_ICON_FRESH: true, // true | false
    UI_CRITICSRATING_ICON_FRESH_SCORE: 6.0,
    UI_CRITICSRATING_ICON_CERTIFIED: true, // true | false
    UI_CRITICSRATING_ICON_CERTIFIED_SCORE: 9.0,
    // Rotten Tomatoes "Certified" logic based on MDBList RT critics rating normalized to 0.0–10.0
    UI_RT_ICON_CERTIFIED: true, // true | false
    UI_RT_ICON_CERTIFIED_SCORE: 9.0,
    // Sources toggles + ids (each source has an internal id used for ordering + an enabled flag)
    SOURCES: {
      imdb: { id: 1, enabled: true },
      tmdb: { id: 2, enabled: true },
      rt_critics: { id: 3, enabled: true },
      rt_audience: { id: 4, enabled: true },
      metacritic: { id: 5, enabled: true },
      metacritic_user: { id: 6, enabled: true },
      trakt: { id: 7, enabled: true },
      letterboxd: { id: 8, enabled: true },
      roger_ebert: { id: 9, enabled: true },
      kinopoisk: { id: 10, enabled: true },
      myanimelist: { id: 11, enabled: true },
    },
    // Display order (array order = display order, missing id = disabled)
    SOURCE_ORDER: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    // Limit for how many EXTERNAL ratings are rendered (<=0 means no limit; max possible is 11; max=0=11)
    LIMIT_MAX_RATINGS: 6, // 0|1..11
  };
  // ============================================================
  // CONFIG TV SHOWS (only Main Level, not on Season or Episode Level)
  // ============================================================
  const CONFIG_SHOW = {
    // Jellyfin built-in ratings visibility (internal star rating + critic rating):
    // - "both": show star + critic rating
    // - "rating_only": show only the star rating
    // - "critics_only": show only the critic rating
    // - "hide": hide both built-in ratings
    UI_JELLYFIN_DB_RATINGS_MODE: 'rating_only', // both | rating_only | critics_only | hide
    // Disable ALL external ratings fetching/rendering from MDBList (keeps only Jellyfin built-in ratings)
    UI_DEACTIVATE_JELLYFIN_EXTRA_RATINGS: false, // true | false
    // Move Jellyfin internal ratings (star/critic) into the extra row (second line) instead of the main row
    UI_INTERNAL_RATINGS_NEW_LINE_MOVE: true, // true | false
    // Render external MDBList ratings in the extra row (second line) instead of the main row
    UI_EXTERNAL_RATINGS_NEW_LINE: true, // true | false
    // Replace Jellyfin internal DB critic icon with "Fresh" / "Certified" icons based on Jellyfin critic score (0.0–10.0)
    UI_CRITICSRATING_ICON_FRESH: true, // true | false
    UI_CRITICSRATING_ICON_FRESH_SCORE: 6.0,
    UI_CRITICSRATING_ICON_CERTIFIED: true, // true | false
    UI_CRITICSRATING_ICON_CERTIFIED_SCORE: 9.0,
    // Rotten Tomatoes "Certified" logic based on MDBList RT critics rating normalized to 0.0–10.0
    UI_RT_ICON_CERTIFIED: true, // true | false
    UI_RT_ICON_CERTIFIED_SCORE: 9.0,
    // Sources toggles + ids (each source has an internal id used for ordering + an enabled flag)
    SOURCES: {
      imdb: { id: 1, enabled: true },
      tmdb: { id: 2, enabled: true },
      rt_critics: { id: 3, enabled: true },
      rt_audience: { id: 4, enabled: true },
      metacritic: { id: 5, enabled: true },
      metacritic_user: { id: 6, enabled: true },
      trakt: { id: 7, enabled: true },
      letterboxd: { id: 8, enabled: true },
      roger_ebert: { id: 9, enabled: true },
      kinopoisk: { id: 10, enabled: true },
      myanimelist: { id: 11, enabled: true },
    },
    // Display order (array order = display order, missing id = disabled)
    SOURCE_ORDER: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    // Limit for how many EXTERNAL ratings are rendered (<=0 means no limit; max possible is 11; max=0=11)
    LIMIT_MAX_RATINGS: 6, // 0|1..11
  };
  // ============================================================
  // CONFIG END
  // ============================================================
  // ============================================================
  // Logging
  // ============================================================
  const TAG = '[MDBListRatings]';
  const log = (...a) => CONFIG_GLOBAL.DEBUG && console.log(TAG, ...a);
  const warn = (...a) => console.warn(TAG, ...a);
  // ============================================================
  // CSS
  // ============================================================
  (function injectUiCss() {
    const css =
      '.mediaInfoItem.mediaInfoCriticRating.__uiNoCriticIcon::before{display:none!important;content:none!important;}';
    const s = document.createElement('style');
    s.textContent = css;
    document.head.appendChild(s);
  })();
  // ============================================================
  // Source/Order Helpers
  // ============================================================
  function isEnabledByKey(CFG, key) {
    const SOURCES = CFG.SOURCES;
    if (key === 'imdb') return SOURCES.imdb.enabled;
    if (key === 'tmdb') return SOURCES.tmdb.enabled;
    if (key === 'tomatoes' || key === 'tomatoes_rotten' || key === 'rt_certified') return SOURCES.rt_critics.enabled;
    if (key === 'audience' || key === 'audience_rotten') return SOURCES.rt_audience.enabled;
    if (key === 'metacritic') return SOURCES.metacritic.enabled;
    if (key === 'metacriticus') return SOURCES.metacritic_user.enabled;
    if (key === 'trakt') return SOURCES.trakt.enabled;
    if (key === 'letterboxd') return SOURCES.letterboxd.enabled;
    if (key === 'rogerebert') return SOURCES.roger_ebert.enabled;
    if (key === 'kinopoisk') return SOURCES.kinopoisk.enabled;
    if (key === 'myanimelist') return SOURCES.myanimelist.enabled;
    return true;
  }
  function keyToSourceId(CFG, key) {
    const SOURCES = CFG.SOURCES;
    if (key === 'imdb') return SOURCES.imdb.id;
    if (key === 'tmdb') return SOURCES.tmdb.id;
    if (key === 'tomatoes' || key === 'tomatoes_rotten' || key === 'rt_certified') return SOURCES.rt_critics.id;
    if (key === 'audience' || key === 'audience_rotten') return SOURCES.rt_audience.id;
    if (key === 'metacritic') return SOURCES.metacritic.id;
    if (key === 'metacriticus') return SOURCES.metacritic_user.id;
    if (key === 'trakt') return SOURCES.trakt.id;
    if (key === 'letterboxd') return SOURCES.letterboxd.id;
    if (key === 'rogerebert') return SOURCES.roger_ebert.id;
    if (key === 'kinopoisk') return SOURCES.kinopoisk.id;
    if (key === 'myanimelist') return SOURCES.myanimelist.id;
    return 0;
  }
  function getOrderForKey(CFG, key) {
    const id = keyToSourceId(CFG, key);
    const i = CFG.SOURCE_ORDER.indexOf(id);
    return i === -1 ? 0 : i + 1;
  }
  function anyExternalSourceActive(CFG) {
    const SOURCES = CFG.SOURCES;
    for (const k of Object.keys(SOURCES)) {
      const src = SOURCES[k];
      if (!src || !src.enabled) continue;
      if (!CFG.SOURCE_ORDER.includes(src.id)) continue;
      return true;
    }
    return false;
  }
  function shouldLoadExternalRatings(CFG) {
    if (CFG.UI_DEACTIVATE_JELLYFIN_EXTRA_RATINGS) return false;
    if (!anyExternalSourceActive(CFG)) return false;
    return true;
  }
  // ============================================================
  // DOM Helpers
  // ============================================================
  function findEndingAtEl(parent) {
    // Jellyfin marks this item with the class "endsAt" (mediainfo.js, 10.10.x
    // and 12.x), whatever the UI language; the text is only a fallback.
    return (
      parent.querySelector('div.mediaInfoItem.endsAt') ||
      Array.from(parent.querySelectorAll('div.mediaInfoItem')).find((el) =>
        /Ends at|Endet um/i.test((el.textContent || '').trim())
      ) || null
    );
  }
  function getInternalEls(parent) {
    const star = parent.querySelector('div.starRatingContainer.mediaInfoItem');
    const critic = parent.querySelector('div.mediaInfoItem.mediaInfoCriticRating');
    return { star, critic };
  }
  function insertAfter(parent, target, node) {
    if (!target || target.parentElement !== parent) {
      parent.appendChild(node);
      return;
    }
    const next = target.nextSibling;
    if (next) parent.insertBefore(node, next);
    else parent.appendChild(node);
  }
  function makeRow(parent, cls) {
    const row = document.createElement('div');
    row.className = cls;
    const disp = getComputedStyle(parent).display || '';
    const isFlex = disp.includes('flex');
    if (isFlex) {
      row.style.cssText =
        'flex:0 0 100%;max-width:100%;width:100%;display:flex;align-items:center;flex-wrap:wrap;margin-top:6px;';
    } else {
      row.style.cssText = 'display:block;width:100%;margin-top:6px;';
    }
    return row;
  }
  function makeInlineRow() {
    const inner = document.createElement('div');
    inner.style.cssText = 'display:inline-flex;align-items:center;flex-wrap:wrap;';
    return inner;
  }
  function ensurePlaceholder(el) {
    if (!el || !el.parentElement) return null;
    if (el.__mdblistPh && el.__mdblistPh.isConnected) return el.__mdblistPh;
    const ph = document.createElement('span');
    ph.className = '__mdblist_placeholder';
    ph.style.display = 'none';
    el.parentElement.insertBefore(ph, el);
    el.__mdblistPh = ph;
    return ph;
  }
  function moveWithPlaceholder(el, newParent) {
    if (!el || !newParent) return;
    if (el.parentElement === newParent) return;
    ensurePlaceholder(el);
    newParent.appendChild(el);
  }
  function restoreMovedElements(parent) {
    const moved = Array.from(parent.querySelectorAll('div.mediaInfoItem')).filter((el) => el.__mdblistPh);
    moved.forEach((el) => {
      const ph = el.__mdblistPh;
      if (ph && ph.parentElement) ph.parentElement.insertBefore(el, ph.nextSibling);
    });
    parent.querySelectorAll('span.__mdblist_placeholder').forEach((ph) => ph.remove());
  }
  function saveOrigOrderOnce(el) {
    if (!el) return;
    if (!('__mdblistOrigOrder' in el.dataset)) el.dataset.__mdblistOrigOrder = el.style.order || '';
  }
  function setFlexOrder(el, v) {
    if (!el) return;
    saveOrigOrderOnce(el);
    el.style.order = String(v);
  }
  function resetFlexOrder(el) {
    if (!el) return;
    if ('__mdblistOrigOrder' in el.dataset) {
      el.style.order = el.dataset.__mdblistOrigOrder;
      delete el.dataset.__mdblistOrigOrder;
    } else {
      el.style.order = '';
    }
  }

  // ============================================================
  // Local dock: keep existing media info visually stiff
  // ============================================================
  const LOCAL_EXTRA_ROW_SPACE_PX = 34;

  function saveStyleOnce(el, key, prop) {
    if (!el || !el.dataset) return;
    if (!(key in el.dataset)) el.dataset[key] = el.style[prop] || '';
  }

  function restoreStyle(el, key, prop) {
    if (!el || !el.dataset) return;
    if (key in el.dataset) {
      el.style[prop] = el.dataset[key];
      delete el.dataset[key];
    }
  }

  function findInfoWrapper(parent) {
    return parent && parent.closest ? parent.closest('.infoWrapper') : null;
  }

  function getBelowInfoTargets(parent) {
    const infoWrapper = findInfoWrapper(parent);
    if (!infoWrapper) return [];
    const kids = Array.from(infoWrapper.children).filter((el) => el && el.nodeType === 1);
    const start = kids.indexOf(parent);
    if (start >= 0) return kids.slice(start + 1).filter((el) => !el.classList.contains('mdblist-local-dock-spacer'));

    // Fallback for Jellyfin skins where itemMiscInfo is nested one level deeper.
    return kids.filter((el) => {
      if (el.contains(parent)) return false;
      if (parent.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) return true;
      return false;
    });
  }

  // ============================================================
  // Ratings line inside the detail header
  // ============================================================
  // The ratings row behaves like a second media-info line that Jellyfin
  // itself would render: it follows the year / runtime / rating line with the
  // same spacing Jellyfin puts between its info lines (that line's own
  // bottom margin), and the header band (.detailRibbon, fixed height, own
  // background) grows by exactly that one line, so the room Jellyfin leaves
  // under its last info line stays the same under the ratings. Title and
  // buttons stay where they are; the page below moves down by that line.
  // A spacer right after the ribbon, in the ribbon's own background, does
  // this. The room is there from the first frame (one line is reserved while
  // the ratings load) and only goes away if no ratings come. No custom CSS
  // needed; the shading follows the theme. Works for 10.10.x (ribbon =
  // .detailPagePrimaryContainer) and 12.x (ribbon = its own element above the
  // primary container).
  const RIBBON_SPACER_CLASS = 'mdblist-ribbon-spacer';

  function findRibbon(parent) {
    return parent && parent.closest ? parent.closest('.detailRibbon') : null;
  }

  // ArtworkPlus 3D case, layer "Behind the text" (M-C3). ArtworkPlus moves the
  // page's tints onto a ::before at z-index -2, below its case canvas (-1), by
  // marking each tint element with this attribute and the tint in this custom
  // property (Jellyfin-ArtworkPlus-Posters-v1.js markTints + the
  // '[data-artworkplus-threejs-tint]' rule). It marks once, when the case
  // mounts; a spacer made or grown later is not marked and would paint its
  // copied tint in normal flow, i.e. above the case. So the spacer carries the
  // same mark as its ribbon and ArtworkPlus's own rule puts it on the same
  // layer. A mark ArtworkPlus set on the spacer itself is left alone; ours goes
  // when the ribbon loses its mark (case removed). Without ArtworkPlus the
  // ribbon never has the attribute and nothing changes.
  const AP_TINT_ATTR = 'data-artworkplus-threejs-tint';
  const AP_TINT_VAR = '--artworkplus-threejs-tint';
  const TINT_MIRROR_ATTR = 'data-mdblist-tint-mirror';

  function mirrorCaseTint(ribbon, spacer) {
    if (ribbon.hasAttribute(AP_TINT_ATTR)) {
      if (spacer.hasAttribute(AP_TINT_ATTR) && !spacer.hasAttribute(TINT_MIRROR_ATTR)) return;
      const tint = ribbon.style.getPropertyValue(AP_TINT_VAR);
      if (tint) spacer.style.setProperty(AP_TINT_VAR, tint);
      spacer.setAttribute(TINT_MIRROR_ATTR, '');
      spacer.setAttribute(AP_TINT_ATTR, '');
    } else if (spacer.hasAttribute(TINT_MIRROR_ATTR)) {
      spacer.removeAttribute(AP_TINT_ATTR);
      spacer.removeAttribute(TINT_MIRROR_ATTR);
      spacer.style.removeProperty(AP_TINT_VAR);
    }
  }

  function updateRibbonBand(parent, extraRow) {
    const ribbon = findRibbon(parent);
    if (!ribbon || !extraRow || !extraRow.isConnected) return;
    let spacer = ribbon.nextElementSibling;
    if (!spacer || !spacer.classList.contains(RIBBON_SPACER_CLASS)) {
      spacer = document.createElement('div');
      spacer.className = RIBBON_SPACER_CLASS;
      spacer.setAttribute('aria-hidden', 'true');
      ribbon.insertAdjacentElement('afterend', spacer);
    }
    const cs = getComputedStyle(ribbon);
    spacer.style.backgroundColor = cs.backgroundColor;
    spacer.style.backgroundImage = cs.backgroundImage;
    mirrorCaseTint(ribbon, spacer);
    const rib = ribbon.getBoundingClientRect();
    const line = parent.getBoundingClientRect();
    // Next line where Jellyfin would put one: after this line's bottom margin.
    const lineGap = parseFloat(getComputedStyle(parent).marginBottom) || 0;
    const rowTop = line.bottom + lineGap;
    extraRow.style.top = Math.round(rowTop - line.top) + 'px';
    // Ratings still loading: reserve one line of them now (their logos are
    // 1.5em high). The room only shrinks if the row stays empty.
    let rowHeight = extraRow.getBoundingClientRect().height;
    if (extraRow.querySelector('[data-mdblist-pending]')) {
      rowHeight = Math.max(rowHeight, 1.5 * parseFloat(getComputedStyle(extraRow).fontSize || '0'));
    }
    // Jellyfin's own room between its last info line and the band's bottom
    // edge (the spacer sits after the ribbon, so this does not move).
    const bottomRoom = Math.max(lineGap, rib.bottom - line.bottom);
    const need = rowHeight > 0 ? Math.ceil(rowTop + rowHeight + bottomRoom - rib.bottom) : 0;
    spacer.style.height = Math.max(0, need) + 'px';
    spacer.style.display = need > 0 ? 'block' : 'none';
  }

  // Every band observer, so one whose row Jellyfin threw away (it refilled the
  // media info line) is disconnected by the next prune instead of watching
  // the ribbon for the rest of the page's life.
  const bandObservers = new Set();

  function disconnectBand(obs) {
    obs.disconnect();
    if (obs._mdblistTintObs) obs._mdblistTintObs.disconnect();
    bandObservers.delete(obs);
  }

  function dropBandObserver(row) {
    if (row._mdblistBandObs) disconnectBand(row._mdblistBandObs);
    delete row._mdblistBandObs;
  }

  function watchRibbonBand(parent, extraRow) {
    dropBandObserver(extraRow);
    const update = () => updateRibbonBand(parent, extraRow);
    update();
    if (typeof ResizeObserver !== 'function') return;
    // Ratings arrive later and may wrap; the window may change width.
    const obs = new ResizeObserver(update);
    obs.observe(extraRow);
    const ribbon = findRibbon(parent);
    if (ribbon) obs.observe(ribbon);
    // The case mounts (or goes) after the band was drawn: follow the ribbon's
    // ArtworkPlus tint mark at once instead of at the next poll (M-C3).
    if (ribbon && typeof MutationObserver === 'function') {
      obs._mdblistTintObs = new MutationObserver(update);
      obs._mdblistTintObs.observe(ribbon, { attributes: true, attributeFilter: [AP_TINT_ATTR] });
    }
    obs._mdblistRow = extraRow;
    extraRow._mdblistBandObs = obs;
    bandObservers.add(obs);
  }

  function removeRibbonBand(parent) {
    parent.querySelectorAll('div.mdblist-extra-row').forEach(dropBandObserver);
    const ribbon = findRibbon(parent);
    const spacer = ribbon && ribbon.nextElementSibling;
    if (spacer && spacer.classList.contains(RIBBON_SPACER_CLASS)) spacer.remove();
  }

  // Runs with every scan: a spacer whose header no longer holds a docked row
  // (Jellyfin re-rendered the media info, or the page shows another item)
  // goes away; the others are re-measured, because ResizeObserver stays
  // silent while the tab is hidden (the page may first be laid out there).
  // A cached detail view that Jellyfin keeps hidden has no layout: it is
  // not measured (its ResizeObserver re-measures it when it is shown again).
  function pruneRibbonSpacers() {
    bandObservers.forEach((obs) => {
      if (!obs._mdblistRow || !obs._mdblistRow.isConnected) disconnectBand(obs);
    });
    document.querySelectorAll('.' + RIBBON_SPACER_CLASS).forEach((spacer) => {
      const ribbon = spacer.previousElementSibling;
      const row = ribbon && ribbon.classList.contains('detailRibbon')
        ? ribbon.querySelector('div.mdblist-extra-row') : null;
      if (!row) spacer.remove();
      else if (ribbon.getClientRects().length > 0) updateRibbonBand(row.parentElement, row);
    });
  }

  function restoreLocalDock(parent) {
    if (!parent) return;
    removeRibbonBand(parent);
    restoreStyle(parent, '__mdblistOrigPosition', 'position');
    restoreStyle(parent, '__mdblistOrigOverflow', 'overflow');

    getBelowInfoTargets(parent).forEach((el) => {
      restoreStyle(el, '__mdblistOrigTransform', 'transform');
      restoreStyle(el, '__mdblistOrigWillChange', 'willChange');
    });
  }

  // The header is a fixed-height flex band only in the desktop layout
  // (.layout-desktop .detailRibbon, librarybrowser.scss 10.10.7:780-814,
  // 12.1:752-781). In the mobile and tv layouts it is a block that grows with
  // its content and the buttons follow below the info line, so a docked row
  // would cover them: there the row stays in flow. No ribbon (foreign skin):
  // dock as before.
  function isBandLayout(parent) {
    const ribbon = findRibbon(parent);
    if (!ribbon) return true;
    return (getComputedStyle(ribbon).display || '').indexOf('flex') >= 0;
  }

  // In-flow row (mobile/tv): centred like Jellyfin's own info line; while the
  // ratings load it keeps one line (1.5em, the logo height) reserved, and it
  // takes no room at all when it ends up empty.
  function rowHasContent(row) {
    const inner = row.firstElementChild;
    if (!inner) return false;
    return Array.from(inner.children).some((el) => {
      if (el.style.display === 'none') return false;
      if (!el.classList.contains('mdblist-rating-container')) return true;
      return el.childElementCount > 0 || 'mdblistPending' in el.dataset;
    });
  }

  function refreshFlowRow(row) {
    if (!row || row.classList.contains('mdblist-local-docked-row')) return;
    const pending = !!row.querySelector('[data-mdblist-pending]');
    row.style.minHeight = pending ? '1.5em' : '';
    row.style.marginTop = pending || rowHasContent(row) ? '6px' : '0';
  }

  function refreshFlowRowOf(el) {
    refreshFlowRow(el && el.closest ? el.closest('div.mdblist-extra-row') : null);
  }

  function applyLocalDock(parent, extraRow) {
    if (!parent || !extraRow) return;
    if (!isBandLayout(parent)) {
      extraRow.style.justifyContent = getComputedStyle(parent).justifyContent || '';
      return;
    }

    // The injected row must not add height to itemMiscInfo; otherwise Jellyfin recenters
    // the whole header area and everything above creeps upward.
    saveStyleOnce(parent, '__mdblistOrigPosition', 'position');
    saveStyleOnce(parent, '__mdblistOrigOverflow', 'overflow');
    if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
    parent.style.overflow = 'visible';

    extraRow.classList.add('mdblist-local-docked-row');
    extraRow.style.position = 'absolute';
    extraRow.style.left = '0';
    extraRow.style.right = '0';
    extraRow.style.top = 'calc(100% + 6px)';
    extraRow.style.width = '100%';
    extraRow.style.zIndex = '3';
    extraRow.style.marginTop = '0';
    extraRow.style.pointerEvents = 'auto';

    // Only content BELOW the media info gets visually lowered. Title, year, buttons,
    // and the original media info line stay untouched.
    const shift = LOCAL_EXTRA_ROW_SPACE_PX;
    getBelowInfoTargets(parent).forEach((el) => {
      saveStyleOnce(el, '__mdblistOrigTransform', 'transform');
      saveStyleOnce(el, '__mdblistOrigWillChange', 'willChange');
      const orig = el.dataset.__mdblistOrigTransform || '';
      el.style.transform = `${orig}${orig ? ' ' : ''}translateY(${shift}px)`;
      el.style.willChange = 'transform';
    });

    watchRibbonBand(parent, extraRow);
  }
  // ============================================================
  // Cleanup Injected Elements
  // ============================================================
  function cleanupInjected(parent) {
    restoreLocalDock(parent);
    const rows = Array.from(parent.querySelectorAll('div.mdblist-extra-row,div.mdblist-ends-row'));
    parent.querySelectorAll('div.mdblist-rating-container').forEach((el) => {
      resetFlexOrder(el);
      el.remove();
    });
    rows.forEach((row) => {
      resetFlexOrder(row);
      row.remove();
    });
    restoreMovedElements(parent);
    const endsAtEl = findEndingAtEl(parent);
    if (endsAtEl) resetFlexOrder(endsAtEl);
  }
  // ============================================================
  // UI Tweaks
  // ============================================================
  function ensureDirectChild(parent, el) {
    if (!el) return;
    if (el.parentElement === parent) return;
    parent.appendChild(el);
  }
  function applyVisibilityStyle(el, hide) {
    if (!el) return;
    if (hide) {
      if (!('origDisplay' in el.dataset)) el.dataset.origDisplay = el.style.display || '';
      el.style.display = 'none';
    } else {
      if ('origDisplay' in el.dataset) {
        el.style.display = el.dataset.origDisplay;
        delete el.dataset.origDisplay;
      } else {
        el.style.display = '';
      }
    }
  }
  function getInternalRatingsVisibility(CFG) {
    const mode = String(CFG.UI_JELLYFIN_DB_RATINGS_MODE || 'both').toLowerCase();
    if (mode === 'hide') return { showStar: false, showCritic: false };
    if (mode === 'rating_only') return { showStar: true, showCritic: false };
    if (mode === 'critics_only') return { showStar: false, showCritic: true };
    return { showStar: true, showCritic: true };
  }
  function setBuiltInRatingsVisibility(CFG, parent) {
    const { star, critic } = getInternalEls(parent);
    const vis = getInternalRatingsVisibility(CFG);
    applyVisibilityStyle(star, !vis.showStar);
    applyVisibilityStyle(critic, !vis.showCritic);
  }
  function parseCriticsScore10(parent) {
    const el = parent.querySelector('div.mediaInfoItem.mediaInfoCriticRating');
    if (!el) return null;
    const txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
    const m = txt.match(/(\d+(?:[.,]\d+)?)/);
    if (!m) return null;
    const raw = parseFloat(m[1].replace(',', '.'));
    if (!isFinite(raw)) return null;
    return raw > 10 ? raw / 10 : raw;
  }
  function disableCriticsCssIcon(criticEl) {
    if (!criticEl) return;
    criticEl.style.backgroundImage = 'none';
    criticEl.style.paddingLeft = '0';
    criticEl.classList.add('__uiNoCriticIcon');
  }
  function replaceCriticsIcon(CFG, parent) {
    if (!CFG.UI_CRITICSRATING_ICON_FRESH && !CFG.UI_CRITICSRATING_ICON_CERTIFIED) return;
    const score10 = parseCriticsScore10(parent);
    if (score10 == null) return;
    const criticEl = parent.querySelector('div.mediaInfoItem.mediaInfoCriticRating');
    if (!criticEl) return;
    const wantCertified = CFG.UI_CRITICSRATING_ICON_CERTIFIED && score10 >= CFG.UI_CRITICSRATING_ICON_CERTIFIED_SCORE;
    const wantFresh =
      !wantCertified && CFG.UI_CRITICSRATING_ICON_FRESH && score10 >= CFG.UI_CRITICSRATING_ICON_FRESH_SCORE;
    const src = wantCertified
      ? CONFIG_GLOBAL.LOGO_URLS.rt_certified
      : wantFresh
        ? CONFIG_GLOBAL.LOGO_URLS.tomatoes
        : null;
    if (!src) return;
    disableCriticsCssIcon(criticEl);
    let img = criticEl.querySelector('img.__uiCriticsIcon');
    if (!img) {
      img = document.createElement('img');
      img.className = '__uiCriticsIcon';
      img.style.cssText = 'height:1.5em;margin-right:4px;vertical-align:middle;';
      criticEl.insertAdjacentElement('afterbegin', img);
    }
    img.src = src;
  }
  function applyUi(CFG, parent) {
    setBuiltInRatingsVisibility(CFG, parent);
    replaceCriticsIcon(CFG, parent);
  }
  // ============================================================
  // Row Builders
  // ============================================================
  function buildEndsRow(parent, endsAtEl) {
    const endsRow = makeRow(parent, 'mdblist-ends-row');
    const endsInner = makeInlineRow();
    endsRow.appendChild(endsInner);
    endsInner.appendChild(endsAtEl);
    return { endsRow, endsInner };
  }
  function buildExtraRow(parent) {
    const extraRow = makeRow(parent, 'mdblist-extra-row');
    const extraInner = makeInlineRow();
    extraRow.appendChild(extraInner);
    return { extraRow, extraInner };
  }
  // ============================================================
  // Ends-at Positioning (movies only via supportsEndingAt)
  // ============================================================
  function getInternalAnchorInLine(lineEl, starEl, criticEl) {
    const starIn = starEl && starEl.parentElement === lineEl ? starEl : null;
    const criticIn = criticEl && criticEl.parentElement === lineEl ? criticEl : null;
    return starIn || criticIn || null;
  }
  function getLastInternalInLine(lineEl, starEl, criticEl) {
    const starIn = starEl && starEl.parentElement === lineEl ? starEl : null;
    const criticIn = criticEl && criticEl.parentElement === lineEl ? criticEl : null;
    return criticIn || starIn || null;
  }
  function applyEndsAtPositionWithinLine(CFG, lineEl, endsAtEl, starEl, criticEl, externalContainerEl) {
    if (!CFG.ENDING_AT_MODE || !endsAtEl || !lineEl) return;
    const pos = (CFG.ENDING_AT_POSITION_MODE || 'vanilla').toLowerCase();
    if (pos === 'vanilla') return;
    if (pos === 'begin') {
      const anchor = getInternalAnchorInLine(lineEl, starEl, criticEl);
      if (!anchor) return;
      if (endsAtEl.parentElement === lineEl) lineEl.insertBefore(endsAtEl, anchor);
      return;
    }
    if (pos === 'end') {
      if (externalContainerEl && externalContainerEl.parentElement === lineEl) {
        insertAfter(lineEl, externalContainerEl, endsAtEl);
      } else {
        if (endsAtEl.parentElement === lineEl) lineEl.appendChild(endsAtEl);
      }
    }
  }
  // ============================================================
  // Networking + Cache
  // ============================================================
  const ratingsCache = new Map();
  function makeCacheKey(type, tmdbId) {
    return `${type}:${tmdbId}`;
  }
  function cacheTtlMs() {
    return Math.max(0, CONFIG_GLOBAL.CACHE.ttlMinutes) * 60 * 1000;
  }
  function isExpired(e) {
    const ttlMs = cacheTtlMs();
    return !e || typeof e.t !== 'number' || (ttlMs > 0 && Date.now() - e.t > ttlMs);
  }
  // Second level shared by all tabs of this origin (M-C2): one MDBList key serves
  // every user and device, so an answer one tab already has is not asked for
  // again. Same TTL as the memory cache. Every access is guarded: storage can be
  // blocked (private mode, policy) or full - then only the memory cache is used.
  const LS_PREFIX = 'mdblistRatings:v1:';
  function lsGet(key) {
    try {
      const raw = localStorage.getItem(LS_PREFIX + key);
      if (!raw) return null;
      const e = JSON.parse(raw);
      if (isExpired(e)) {
        localStorage.removeItem(LS_PREFIX + key);
        return null;
      }
      return e;
    } catch (e) {
      return null;
    }
  }
  // Removes expired entries (all of ours when `all`), e.g. when storage is full.
  function lsPrune(all) {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.indexOf(LS_PREFIX) === 0) keys.push(k);
      }
      keys.forEach((k) => {
        let drop = all;
        if (!drop) {
          try {
            drop = isExpired(JSON.parse(localStorage.getItem(k) || 'null'));
          } catch (e) {
            drop = true;
          }
        }
        if (drop) localStorage.removeItem(k);
      });
    } catch (e) {
      /* storage not available */
    }
  }
  function lsSet(key, entry) {
    let text;
    try {
      text = JSON.stringify(entry);
    } catch (e) {
      return;
    }
    try {
      localStorage.setItem(LS_PREFIX + key, text);
      return;
    } catch (e) {
      /* full or blocked: make room below */
    }
    lsPrune(false);
    try {
      localStorage.setItem(LS_PREFIX + key, text);
      return;
    } catch (e) {
      /* still full */
    }
    lsPrune(true);
    try {
      localStorage.setItem(LS_PREFIX + key, text);
    } catch (e) {
      /* give up: memory cache only */
    }
  }
  function cacheGet(key) {
    if (!CONFIG_GLOBAL.CACHE.enabled) return null;
    let e = ratingsCache.get(key);
    if (e && isExpired(e)) {
      ratingsCache.delete(key);
      e = null;
    }
    if (!e) {
      e = lsGet(key);
      if (!e) return null;
      ratingsCache.set(key, e);
    }
    return e.data;
  }
  function cacheSet(key, data) {
    if (!CONFIG_GLOBAL.CACHE.enabled) return;
    const e = { t: Date.now(), data };
    ratingsCache.set(key, e);
    lsSet(key, e);
  }
  // A request that hangs must not keep the reserved line forever.
  const HTTP_TIMEOUT_MS = 10000;
  // onDone runs exactly once when the request is over, with or without data
  // (also after a timeout, an abort or an error inside onOk).
  function httpGet(url, onOk, onDone) {
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      if (onDone) onDone();
    };
    if (CONFIG_GLOBAL.MODE === 'user' && typeof GM_xmlhttpRequest === 'function') {
      GM_xmlhttpRequest({
        method: 'GET',
        url,
        timeout: HTTP_TIMEOUT_MS,
        onload(res) {
          if (res.status !== 200) return done();
          let data;
          try {
            data = JSON.parse(res.responseText);
          } catch (e) {
            return done();
          }
          try {
            onOk(data);
          } catch (e) {
            warn('Error rendering ratings:', e);
          }
          done();
        },
        onerror: done,
        ontimeout: done,
        onabort: done,
      });
      return;
    }
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = setTimeout(() => {
      if (ctrl) ctrl.abort();
      done();
    }, HTTP_TIMEOUT_MS);
    fetch(url, ctrl ? { signal: ctrl.signal } : undefined)
      .then((r) => {
        if (!r.ok) throw new Error('Network response was not ok');
        return r.json();
      })
      .then((data) => {
        if (!finished) onOk(data);
      })
      .catch((err) => console.error('MDBList fetch error:', err))
      .finally(() => {
        clearTimeout(timer);
        done();
      });
  }
  // One request per item at a time: a re-render while the request is still
  // running (10.10.x reload paths, 12.x version switch) joins it instead of
  // sending a second identical one (all users share one MDBList quota).
  const ratingsInflight = new Map();
  function requestRatings(key, url, onOk, onDone) {
    const waiting = ratingsInflight.get(key);
    if (waiting) {
      waiting.push({ onOk, onDone });
      return;
    }
    const list = [{ onOk, onDone }];
    ratingsInflight.set(key, list);
    httpGet(url, (data) => {
      cacheSet(key, data);
      list.forEach((w) => {
        try {
          w.onOk(data);
        } catch (e) {
          warn('Error rendering ratings:', e);
        }
      });
    }, () => {
      ratingsInflight.delete(key);
      list.forEach((w) => {
        if (w.onDone) w.onDone();
      });
    });
  }
  function isPercentKey(key) {
    return (
      key === 'tmdb' ||
      key === 'trakt' ||
      key === 'metacritic' ||
      key === 'tomatoes' ||
      key === 'tomatoes_rotten' ||
      key === 'audience' ||
      key === 'audience_rotten' ||
      key === 'rt_certified'
    );
  }
  function formatExternalValue(key, val) {
    const n = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
    if (!isFinite(n)) return String(val);
    if (isPercentKey(key)) return String(Math.round(n));
    return n.toFixed(1);
  }
  function getEffectiveExternalLimit(CFG) {
    const raw = Number(CFG.LIMIT_MAX_RATINGS);
    if (!isFinite(raw)) return 11;
    if (raw <= 0) return 11;
    if (raw >= 11) return 11;
    return Math.max(1, Math.floor(raw));
  }
  function renderRatingsFromData(CFG, data, container) {
    if (!data || !Array.isArray(data.ratings)) return;
    while (container.firstChild) container.removeChild(container.firstChild);
    const items = [];
    data.ratings.forEach((r) => {
      if (r.value == null) return;
      const srcStr = String(r.source || '');
      const srcLower = srcStr.toLowerCase();
      let key = srcLower.replace(/\s+/g, '_');
      let displayVal = r.value;
      const isRtCritics =
        key === 'tomatoes' ||
        key === 'tomatometer' ||
        key === 'rottentomatoes' ||
        key === 'rotten_tomatoes' ||
        (srcLower.includes('tomato') && !srcLower.includes('popcorn') && !srcLower.includes('audience'));
      if (isRtCritics) {
        const rtLogic10 = r.value > 10 ? r.value / 10 : r.value;
        displayVal = r.value > 10 ? r.value : r.value * 10;
        if (CFG.UI_RT_ICON_CERTIFIED && rtLogic10 >= CFG.UI_RT_ICON_CERTIFIED_SCORE) key = 'rt_certified';
        else key = rtLogic10 < 6.0 ? 'tomatoes_rotten' : 'tomatoes';
      } else if (key.includes('popcorn') || srcLower.includes('audience')) {
        const audiencePct = r.value <= 10 ? r.value * 10 : r.value;
        displayVal = audiencePct;
        key = audiencePct < 60 ? 'audience_rotten' : 'audience';
      } else if (key.includes('metacritic') && key.includes('user')) {
        key = 'metacriticus';
      } else if (key.includes('metacritic') && !key.includes('user')) {
        key = 'metacritic';
      } else if (key.includes('roger_ebert') || key === 'rogerebert') {
        key = 'rogerebert';
      } else if (key.includes('myanimelist')) {
        key = 'myanimelist';
      } else if (key.includes('letterboxd')) {
        key = 'letterboxd';
      } else if (key.includes('trakt')) {
        key = 'trakt';
      }
      if (!isEnabledByKey(CFG, key)) return;
      const order = getOrderForKey(CFG, key);
      if (!order) return;
      const logoUrl = CONFIG_GLOBAL.LOGO_URLS[key];
      items.push({ key, order, displayVal, logoUrl, source: r.source });
    });
    items.sort((a, b) => a.order - b.order);
    const limit = getEffectiveExternalLimit(CFG);
    const limitedItems = limit >= 11 ? items : items.slice(0, limit);
    limitedItems.forEach((it) => {
      if (it.logoUrl) {
        const img = document.createElement('img');
        img.src = it.logoUrl;
        img.alt = it.source || it.key;
        img.title = `${it.source || it.key}: ${it.displayVal}`;
        img.style.height = '1.5em';
        img.style.marginRight = '4px';
        img.style.verticalAlign = 'middle';
        container.appendChild(img);
      }
      const span = document.createElement('span');
      span.textContent = formatExternalValue(it.key, it.displayVal);
      span.style.marginRight = '8px';
      span.style.fontSize = '1em';
      span.style.verticalAlign = 'middle';
      container.appendChild(span);
    });
  }
  function fetchRatings(CFG, apiType, tmdbId, container) {
    const key = makeCacheKey(apiType, tmdbId);
    const cached = cacheGet(key);
    if (cached) {
      renderRatingsFromData(CFG, cached, container);
      return;
    }
    const url = `https://api.mdblist.com/tmdb/${apiType}/${tmdbId}?apikey=${CONFIG_GLOBAL.API_KEY}`;
    // EXTRA_ROW_SPACE "reserve": while the request runs, the header keeps a
    // full line reserved for the ratings (see updateRibbonBand), so nothing
    // grows when they arrive. "grow": the room follows the ratings.
    if (CONFIG_GLOBAL.EXTRA_ROW_SPACE === 'grow') {
      requestRatings(key, url, (data) => {
        renderRatingsFromData(CFG, data, container);
      }, () => {
        pruneRibbonSpacers();
        refreshFlowRowOf(container);
      });
      return;
    }
    container.dataset.mdblistPending = '1';
    container.style.visibility = 'hidden';
    requestRatings(key, url, (data) => {
      renderRatingsFromData(CFG, data, container);
    }, () => {
      // Show the ratings only once their logos have loaded: before that their
      // width is unknown, so a narrow header would wrap a second later and
      // the band would grow again. Now ratings and final band come together.
      const imgs = Array.from(container.querySelectorAll('img')).filter((img) => !img.complete);
      const settle = () => {
        if (!('mdblistPending' in container.dataset)) return;
        delete container.dataset.mdblistPending;
        container.style.visibility = '';
        pruneRibbonSpacers();
        refreshFlowRowOf(container);
      };
      if (!imgs.length) return settle();
      let left = imgs.length;
      const one = () => { if (--left === 0) settle(); };
      imgs.forEach((img) => {
        img.addEventListener('load', one, { once: true });
        img.addEventListener('error', one, { once: true });
      });
      setTimeout(settle, 3000);
    });
  }
  function createExternalContainer(CFG, apiType, tmdbId) {
    const container = document.createElement('div');
    container.className = 'mdblist-rating-container';
    container.style.cssText = 'display:inline-flex;align-items:center;margin-left:6px;flex-wrap:wrap;';
    fetchRatings(CFG, apiType, tmdbId, container);
    return container;
  }
  // ============================================================
  // Parent Selection Near Link
  // ============================================================
  function chooseParentNearLink(link) {
    let el = link;
    while (el && el !== document.body) {
      if (el.querySelector && el.querySelector('div.mediaInfoItem')) {
        const mi = el.querySelector('div.mediaInfoItem');
        return mi && mi.parentElement ? mi.parentElement : null;
      }
      el = el.parentElement;
    }
    const mediaItems = document.querySelectorAll('div.mediaInfoItem');
    if (mediaItems.length) return mediaItems[0].parentElement || document.body;
    return null;
  }
  // ============================================================
  // Layout Orchestration
  // ============================================================
  function getLineMode(CFG) {
    return (CFG.ENDING_AT_LINE_MODE || 'main').toLowerCase();
  }
  function isAnyInternalVisible(CFG) {
    const v = getInternalRatingsVisibility(CFG);
    return !!(v.showStar || v.showCritic);
  }
  function needsExtraRow(CFG, externalAllowed, supportsEndingAt) {
    const internalVisible = isAnyInternalVisible(CFG);
    if (CFG.UI_INTERNAL_RATINGS_NEW_LINE_MOVE && internalVisible) return true;
    if (CFG.UI_EXTERNAL_RATINGS_NEW_LINE && externalAllowed) return true;
    if (supportsEndingAt) {
      const lineMode = getLineMode(CFG);
      if (CFG.ENDING_AT_MODE && lineMode === 'same_external') return true;
    }
    return false;
  }
  function ensureExtraRow(parent) {
    let extraRow = parent.querySelector('div.mdblist-extra-row');
    let extraInner = extraRow ? extraRow.firstElementChild : null;
    if (!extraRow || !extraInner) {
      const built = buildExtraRow(parent);
      extraRow = built.extraRow;
      extraInner = built.extraInner;
      const disp = getComputedStyle(parent).display || '';
      const isFlex = disp.includes('flex');
      if (isFlex) setFlexOrder(extraRow, 10000);
      parent.appendChild(extraRow);
    } else {
      const disp = getComputedStyle(parent).display || '';
      const isFlex = disp.includes('flex');
      if (isFlex) setFlexOrder(extraRow, 10000);
    }
    applyLocalDock(parent, extraRow);
    return { extraRow, extraInner };
  }
  function ensureEndsRowAfter(parent, whereOrder, endsAtEl) {
    const built = buildEndsRow(parent, endsAtEl);
    const endsRow = built.endsRow;
    const disp = getComputedStyle(parent).display || '';
    const isFlex = disp.includes('flex');
    if (isFlex) setFlexOrder(endsRow, whereOrder);
    // Mobile/tv header: centred like the info line (desktop unchanged).
    if (!isBandLayout(parent)) endsRow.style.justifyContent = getComputedStyle(parent).justifyContent || '';
    parent.appendChild(endsRow);
    return built;
  }
  function applySameExternalVanillaBaseline(extraInner, endsAtEl, starEl, criticEl, externalExtraEl) {
    if (!extraInner || !endsAtEl || endsAtEl.parentElement !== extraInner) return;
    const lastInternal = getLastInternalInLine(extraInner, starEl, criticEl);
    if (lastInternal && lastInternal.parentElement === extraInner) {
      insertAfter(extraInner, lastInternal, endsAtEl);
    }
    if (externalExtraEl && externalExtraEl.parentElement === extraInner) {
      extraInner.insertBefore(endsAtEl, externalExtraEl);
    }
  }
  // Hidden marker as the first child of the media info line (first, so that
  // Jellyfin's .mediaInfoItem:last-child margin rule is not affected).
  // 10.10.x refills that line on a version switch (updateMiscInfo,
  // itemDetails/index.js:2132-2139) but keeps the links; a line without the
  // marker is redone by the next scan.
  const MARKER_CLASS = '__mdblist_marker';
  function hasMarker(parent) {
    return Array.from(parent.children).some((el) => el.classList.contains(MARKER_CLASS));
  }
  function reconcile(CFG, parent, apiType, tmdbId, externalAllowed, supportsEndingAt) {
    try {
      reconcileRows(CFG, parent, apiType, tmdbId, externalAllowed, supportsEndingAt);
    } finally {
      // Set even after an error, so a failing line is not redone every scan.
      if (!hasMarker(parent)) {
        const marker = document.createElement('span');
        marker.className = MARKER_CLASS;
        marker.style.display = 'none';
        parent.insertBefore(marker, parent.firstChild);
      }
      refreshFlowRow(parent.querySelector('div.mdblist-extra-row'));
    }
  }
  function reconcileRows(CFG, parent, apiType, tmdbId, externalAllowed, supportsEndingAt) {
    const internalVisible = isAnyInternalVisible(CFG);
    cleanupInjected(parent);
    const { star: starEl, critic: criticEl } = getInternalEls(parent);
    // TV shows: no ends-at mechanics at all
    const endsAtEl = supportsEndingAt ? findEndingAtEl(parent) : null;
    if (starEl) ensureDirectChild(parent, starEl);
    if (criticEl) ensureDirectChild(parent, criticEl);
    if (endsAtEl) ensureDirectChild(parent, endsAtEl);
    if (supportsEndingAt && endsAtEl) {
      endsAtEl.style.display = CFG.ENDING_AT_MODE ? '' : 'none';
    }
    applyUi(CFG, parent);
    const needExtra = needsExtraRow(CFG, externalAllowed, supportsEndingAt);
    let externalMain = null;
    let externalExtra = null;
    let extra = null;
    if (needExtra) {
      extra = ensureExtraRow(parent);
      if (CFG.UI_INTERNAL_RATINGS_NEW_LINE_MOVE && internalVisible) {
        if (starEl && starEl.parentElement === parent) moveWithPlaceholder(starEl, extra.extraInner);
        if (criticEl && criticEl.parentElement === parent) moveWithPlaceholder(criticEl, extra.extraInner);
      }
      if (externalAllowed) {
        if (CFG.UI_EXTERNAL_RATINGS_NEW_LINE) {
          externalExtra = createExternalContainer(CFG, apiType, tmdbId);
          externalExtra.style.marginLeft = '0';
          extra.extraInner.appendChild(externalExtra);
        } else {
          externalMain = createExternalContainer(CFG, apiType, tmdbId);
          parent.appendChild(externalMain);
        }
      }
      if (supportsEndingAt && CFG.ENDING_AT_MODE && endsAtEl) {
        const lineMode = getLineMode(CFG);
        const posMode = (CFG.ENDING_AT_POSITION_MODE || 'vanilla').toLowerCase();
        if (lineMode === 'after_main') {
          ensureEndsRowAfter(parent, 9000, endsAtEl);
        } else if (lineMode === 'after_external') {
          ensureEndsRowAfter(parent, 11000, endsAtEl);
        } else if (lineMode === 'same_external') {
          if (endsAtEl.parentElement === parent) moveWithPlaceholder(endsAtEl, extra.extraInner);
          if (posMode === 'end') {
            if (externalExtra) extra.extraInner.appendChild(externalExtra);
            if (endsAtEl.parentElement === extra.extraInner) extra.extraInner.appendChild(endsAtEl);
          } else if (posMode === 'begin') {
            if (externalExtra) extra.extraInner.appendChild(externalExtra);
            applyEndsAtPositionWithinLine(CFG, extra.extraInner, endsAtEl, starEl, criticEl, externalExtra);
          } else {
            if (externalExtra) extra.extraInner.appendChild(externalExtra);
            applySameExternalVanillaBaseline(extra.extraInner, endsAtEl, starEl, criticEl, externalExtra);
          }
        } else {
          applyEndsAtPositionWithinLine(CFG, parent, endsAtEl, starEl, criticEl, externalMain);
        }
      }
      return;
    }
    if (externalAllowed) {
      externalMain = createExternalContainer(CFG, apiType, tmdbId);
      parent.appendChild(externalMain);
    }
    if (supportsEndingAt && CFG.ENDING_AT_MODE && endsAtEl) {
      const lineMode = getLineMode(CFG);
      if (lineMode === 'after_main' || lineMode === 'after_external') {
        ensureEndsRowAfter(parent, 10000, endsAtEl);
      } else {
        applyEndsAtPositionWithinLine(CFG, parent, endsAtEl, starEl, criticEl, externalMain);
      }
    }
  }
  // ============================================================
  // Core Link Processing
  // ============================================================
  function processLink(link) {
    // Movie or series link only: 12.x also links seasons and episodes
    // (themoviedb.org/tv/<id>/season/<n>...), which never had ratings here.
    const m = link.href.match(/themoviedb\.org\/(movie|tv)\/(\d+)\/?(?:[?#]|$)/);
    if (!m) return;
    const kind = m[1]; // movie | tv
    const tmdbId = m[2];
    const isShow = kind === 'tv';
    const CFG = isShow ? CONFIG_SHOW : CONFIG_MOVIE;
    // MDBList endpoint type
    const apiType = isShow ? 'show' : 'movie';
    // TV shows: disable ends-at completely
    const supportsEndingAt = !isShow;
    const parent = chooseParentNearLink(link);
    if (!parent) return;
    link._mdblistParent = parent;
    const externalAllowed = shouldLoadExternalRatings(CFG);
    const injectKey = `${apiType}:${tmdbId}`;
    if (parent.dataset.mdblistInjected === injectKey) {
      reconcile(CFG, parent, apiType, tmdbId, externalAllowed, supportsEndingAt);
      return;
    }
    parent.dataset.mdblistInjected = injectKey;
    reconcile(CFG, parent, apiType, tmdbId, externalAllowed, supportsEndingAt);
  }
  // ============================================================
  // Scan + Boot
  // ============================================================
  function scanAndProcessLinks() {
    pruneRibbonSpacers();
    for (const sel of CONFIG_GLOBAL.TRIGGERS.linkSelectors) {
      document.querySelectorAll(sel).forEach((link) => {
        if (link._mdblistProcessed) {
          // Done once; redo only when Jellyfin refilled its line (marker gone).
          const p = link._mdblistParent;
          if (!p || !p.isConnected || hasMarker(p)) return;
        }
        link._mdblistProcessed = true;
        try {
          processLink(link);
        } catch (e) {
          warn('Error in processLink:', e);
        }
      });
    }
  }
  if (CONFIG_GLOBAL.MODE === 'user' && typeof GM_xmlhttpRequest !== 'function') {
    warn('MODE=user but GM_xmlhttpRequest is missing; falling back to fetch().');
  }
  // Expired shared cache entries of earlier visits go once per page load (M-C2).
  if (CONFIG_GLOBAL.CACHE.enabled) lsPrune(false);
  scanAndProcessLinks();
  if (CONFIG_GLOBAL.TRIGGERS.pollMs > 0) setInterval(scanAndProcessLinks, CONFIG_GLOBAL.TRIGGERS.pollMs);
  // Scan as soon as Jellyfin renders the detail page: a MutationObserver
  // callback runs before the browser paints, so the rating row and the
  // header space are in place in the very first frame (the poll alone left
  // up to a second in which the header was drawn without them).
  // Only changes that matter start a scan: a TMDb link appears, or a ratings
  // row is removed (Jellyfin refilled the media info line: the band shrinks
  // and the line is redone in the same frame). Everything else (clock,
  // "Ends at" refresh, lazy images, other pages) is left to the poll.
  const LINK_SELECTOR = CONFIG_GLOBAL.TRIGGERS.linkSelectors.join(',');
  function nodeHas(node, sel) {
    if (!node || node.nodeType !== 1) return false;
    return node.matches(sel) || !!node.querySelector(sel);
  }
  function mutationsMatter(records) {
    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      for (let j = 0; j < r.addedNodes.length; j++) {
        if (nodeHas(r.addedNodes[j], LINK_SELECTOR)) return true;
      }
      for (let j = 0; j < r.removedNodes.length; j++) {
        if (nodeHas(r.removedNodes[j], 'div.mdblist-extra-row')) return true;
      }
    }
    return false;
  }
  new MutationObserver((records) => {
    if (mutationsMatter(records)) scanAndProcessLinks();
  }).observe(document.body, { childList: true, subtree: true });
  log('Boot complete.');
})();