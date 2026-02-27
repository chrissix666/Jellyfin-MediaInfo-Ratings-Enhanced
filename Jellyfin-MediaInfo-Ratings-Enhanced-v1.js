(function () {
  'use strict';
   // ============================================================
  // CONFIG START
  // ============================================================
 // ============================================================
  // CONFIG GLOBAL
  // ============================================================
  const CONFIG_GLOBAL = {
    // Network mode used for all API calls:
    // - "basic": uses window.fetch()
    // - "user": uses GM_xmlhttpRequest
    MODE: 'user', // basic | user
    // MDBList API key (required to query mdblist.com for ratings)
    API_KEY: '',
    // Enable/disable debug logging (when true, extra logs will be printed to the browser console)
    DEBUG: false,
    // Polling triggers for detecting and processing newly inserted TMDB links in the page
    TRIGGERS: {
      pollMs: 1000,
      linkSelectors: ['a.emby-button[href*="themoviedb.org/"]', 'a[href*="themoviedb.org/"]'],
    },
    // Response cache settings (in-memory; reduces API calls and speeds up repeated views)
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
    // Disable ALL external ratings fetching/rendering from MDBList (keeps only Jellyfin built-in ratings & UI settings)
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
  // CONFIG TV SHOWS (only Main Level, not on Season or Episode Level)
  // ============================================================
  const CONFIG_SHOW = {
    // Jellyfin built-in ratings visibility (internal star rating + critic rating):
    // - "both": show star + critic rating
    // - "rating_only": show only the star rating
    // - "critics_only": show only the critic rating
    // - "hide": hide both built-in ratings
    UI_JELLYFIN_DB_RATINGS_MODE: 'rating_only', // both | rating_only | critics_only | hide
    // Disable ALL external ratings fetching/rendering from MDBList (keeps only Jellyfin built-in ratings & UI settings)
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
    return (
      Array.from(parent.querySelectorAll('div.mediaInfoItem')).find((el) =>
        /Ends at|Endet am/i.test((el.textContent || '').trim())
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
  // Cleanup Injected Elements
  // ============================================================
  function cleanupInjected(parent) {
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
  function cacheGet(key) {
    if (!CONFIG_GLOBAL.CACHE.enabled) return null;
    const e = ratingsCache.get(key);
    if (!e) return null;
    const ttlMs = Math.max(0, CONFIG_GLOBAL.CACHE.ttlMinutes) * 60 * 1000;
    if (ttlMs > 0 && Date.now() - e.t > ttlMs) {
      ratingsCache.delete(key);
      return null;
    }
    return e.data;
  }
  function cacheSet(key, data) {
    if (!CONFIG_GLOBAL.CACHE.enabled) return;
    ratingsCache.set(key, { t: Date.now(), data });
  }
  function httpGet(url, onOk) {
    if (CONFIG_GLOBAL.MODE === 'user' && typeof GM_xmlhttpRequest === 'function') {
      GM_xmlhttpRequest({
        method: 'GET',
        url,
        onload(res) {
          if (res.status !== 200) return;
          let data;
          try {
            data = JSON.parse(res.responseText);
          } catch {
            return;
          }
          onOk(data);
        },
        onerror() {},
      });
      return;
    }
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error('Network response was not ok');
        return r.json();
      })
      .then(onOk)
      .catch((err) => console.error('MDBList fetch error:', err));
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
    if (!Array.isArray(data?.ratings)) return;
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
    httpGet(url, (data) => {
      cacheSet(key, data);
      renderRatingsFromData(CFG, data, container);
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
    return { extraRow, extraInner };
  }
  function ensureEndsRowAfter(parent, whereOrder, endsAtEl) {
    const built = buildEndsRow(parent, endsAtEl);
    const endsRow = built.endsRow;
    const disp = getComputedStyle(parent).display || '';
    const isFlex = disp.includes('flex');
    if (isFlex) setFlexOrder(endsRow, whereOrder);
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
  function reconcile(CFG, parent, apiType, tmdbId, externalAllowed, supportsEndingAt) {
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
    const m = link.href.match(/themoviedb\.org\/(movie|tv)\/(\d+)/);
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
    for (const sel of CONFIG_GLOBAL.TRIGGERS.linkSelectors) {
      document.querySelectorAll(sel).forEach((link) => {
        if (link._mdblistProcessed) return;
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
  scanAndProcessLinks();
  if (CONFIG_GLOBAL.TRIGGERS.pollMs > 0) setInterval(scanAndProcessLinks, CONFIG_GLOBAL.TRIGGERS.pollMs);
  log('Boot complete.');

})();

