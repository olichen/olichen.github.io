import { keepInViewport } from "./util.js";

export function initRouteSelector(toolbarOptions, stopData, vizDrawer, clickHandler, chartsHandler, onUpdate) {
  const rtTrigger = document.getElementById("rtTrigger");
  const rtPanel = document.getElementById("rtPanel");
  const rtSearch = document.getElementById("rtSearch");
  const rtCount = document.getElementById("rtCount");
  const routeList = document.getElementById("routeList");

  function rtUpdateCount() {
    const keys = [...toolbarOptions.routeKeys()];
    const active = keys.filter(r => toolbarOptions.isRouteActive(r)).length;
    rtCount.textContent = active === keys.length ? 'All' : active === 0 ? 'No' : active;
  }

  const rtSearchClear = document.getElementById("rtSearchClear");

  function clearSearch() {
    rtSearch.value = '';
    routeList.querySelectorAll('.rt-item').forEach(item => item.classList.remove('hidden'));
    rtSearchClear.classList.remove('visible');
  }

  function closeRtPanel() {
    rtTrigger.classList.remove('open');
    rtPanel.classList.remove('open');
    clearSearch();
    setFocusedItem(null);
  }

  rtTrigger.addEventListener('click', () => {
    const opening = !rtPanel.classList.contains('open');
    if (opening) {
      rtTrigger.classList.add('open');
      rtPanel.classList.add('open');
      keepInViewport(rtPanel);
      rtSearch.focus();
    } else {
      closeRtPanel();
    }
  });

  let focusedItem = null;

  function setFocusedItem(item) {
    focusedItem?.classList.remove('focused');
    focusedItem = item;
    focusedItem?.classList.add('focused');
    focusedItem?.scrollIntoView({ block: 'nearest' });
  }

  function visibleItems() {
    return [...routeList.querySelectorAll('.rt-item:not(.hidden)')];
  }

  rtPanel.addEventListener('keydown', e => {
    const items = visibleItems();
    const currentIndex = items.indexOf(focusedItem);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedItem(items[currentIndex + 1] ?? items[0]);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedItem(items[currentIndex - 1] ?? items[items.length - 1]);
    } else if ((e.key === 'Enter' || e.key === ' ') && focusedItem) {
      e.preventDefault();
      focusedItem.click();
    } else if (e.key === ' ') {
      e.preventDefault();
    } else if (e.target !== rtSearch && /^[a-z0-9]$/i.test(e.key)) {
      rtSearch.focus();
    }
  });

  rtSearch.addEventListener('keydown', e => {
    if (e.key === 'Escape') rtSearch.value ? clearSearch() : closeRtPanel();
    else if (e.key.length === 1 && !/^[a-z0-9]$/i.test(e.key)) { e.preventDefault(); }
  });
  rtSearch.addEventListener('input', () => {
    rtSearch.value = rtSearch.value.replace(/[^a-z0-9]/gi, '');
    const q = rtSearch.value.toLowerCase();
    routeList.querySelectorAll('.rt-item').forEach(item => {
      item.classList.toggle('hidden', !item.dataset.label.includes(q));
    });
    rtSearchClear.classList.toggle('visible', rtSearch.value.length > 0);
    setFocusedItem(rtSearch.value.length > 0 ? visibleItems()[0] ?? null : null);
  });
  rtSearchClear.addEventListener('click', () => {
    rtSearch.value = '';
    routeList.querySelectorAll('.rt-item').forEach(item => item.classList.remove('hidden'));
    rtSearchClear.classList.remove('visible');
    rtSearch.focus();
  });

  document.addEventListener('click', e => {
    if (!document.getElementById('rtDropdown').contains(e.target)) closeRtPanel();
  });

  let frequentRoutes, localRoutes, allDayRoutes, peakRoutes;

  function rebuildRouteGroups() {
    const maxTripsByRoute = new Map();
    for (const stop of stopData.stops) {
      for (const [routeNum, route] of Object.entries(stopData.getRoutes(stop.stop_id))) {
        if (!maxTripsByRoute.has(routeNum)) {
          maxTripsByRoute.set(routeNum, 0); 
        }
        for (const dataId of Object.values(route)) {
          const t = dataId['MID']?.OBSERVED_TRIPS_IDS;
          if (t != null)
            maxTripsByRoute.set(routeNum, Math.max(maxTripsByRoute.get(routeNum), t));
        }
      }
    }
    frequentRoutes = new Set([...maxTripsByRoute.entries()].filter(([, t]) => t >= 23).map(([r]) => r));
    localRoutes = new Set([...maxTripsByRoute.entries()].filter(([, t]) => t >= 11 && t <= 22).map(([r]) => r));
    allDayRoutes = new Set([...maxTripsByRoute.entries()].filter(([, t]) => t >= 3 && t <= 10).map(([r]) => r));
    peakRoutes = new Set([...maxTripsByRoute.entries()].filter(([, t]) => t <= 2).map(([r]) => r));
  }

  function rebuildRouteDropdown() {
    rebuildRouteGroups();
    routeList.innerHTML = '';
    for (const [routeNum, active] of toolbarOptions.routeEntries()) {
      const name = stopData.getRouteName(routeNum);
      const item = document.createElement('div');
      item.className = `rt-item${active ? ' active' : ''}`;
      item.dataset.label = name.toLowerCase();
      item.dataset.routeNum = routeNum;
      item.innerHTML = `<div class="rt-check"><svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5l2.5 2.5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>${name}`;
      item.addEventListener('click', () => {
        const nowActive = item.classList.toggle('active');
        toolbarOptions.setRoute(routeNum, nowActive);
        rtUpdateCount();
        updateGroupHighlights();
        vizDrawer.updateStops();
        clickHandler.getStops();
        chartsHandler.update(clickHandler.clickStops);
        onUpdate?.();
      });
      routeList.appendChild(item);
    }
    rtUpdateCount();
    updateGroupHighlights();
  }

  const btnFrequent = document.getElementById("routeFrequent");
  const btnLocal = document.getElementById("routeLocal");
  const btnAllDay = document.getElementById("routeAllDay");
  const btnPeak = document.getElementById("routePeak");

  function allActive(group) {
    return [...group].every(r => toolbarOptions.isRouteActive(r));
  }

  function updateGroupHighlights() {
    btnFrequent.classList.toggle('active', allActive(frequentRoutes));
    btnLocal.classList.toggle('active', allActive(localRoutes));
    btnAllDay.classList.toggle('active', allActive(allDayRoutes));
    btnPeak.classList.toggle('active', allActive(peakRoutes));
  }

  function setRouteGroup(group, active) {
    for (const routeNum of group) toolbarOptions.setRoute(routeNum, active);
    routeList.querySelectorAll('.rt-item').forEach(i => {
      if (group.has(i.dataset.routeNum)) i.classList.toggle('active', active);
    });
    rtUpdateCount();
    updateGroupHighlights();
    vizDrawer.updateStops();
    clickHandler.getStops();
    chartsHandler.update(clickHandler.clickStops);
    onUpdate?.();
  }

  function toggleRouteGroup(group) {
    setRouteGroup(group, !allActive(group));
  }

  document.getElementById("routeAll").addEventListener('click', () => setRouteGroup(new Set(toolbarOptions.routeKeys()), true));
  btnFrequent.addEventListener('click', () => toggleRouteGroup(frequentRoutes));
  btnLocal.addEventListener('click', () => toggleRouteGroup(localRoutes));
  btnAllDay.addEventListener('click', () => toggleRouteGroup(allDayRoutes));
  btnPeak.addEventListener('click', () => toggleRouteGroup(peakRoutes));
  document.getElementById("routeNone").addEventListener('click', () => setRouteGroup(new Set(toolbarOptions.routeKeys()), false));

  rebuildRouteDropdown();

  return { rebuildRouteDropdown };
}
