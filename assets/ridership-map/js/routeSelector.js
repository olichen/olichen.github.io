import { keepInViewport } from "./util.js";

export function initRouteSelector(mapOptions, stopData, vizDrawer, clickHandler, chartsHandler) {
  const rtTrigger = document.getElementById("rtTrigger");
  const rtPanel = document.getElementById("rtPanel");
  const rtSearch = document.getElementById("rtSearch");
  const rtCount = document.getElementById("rtCount");
  const routeList = document.getElementById("routeList");

  function rtUpdateCount() {
    const keys = [...mapOptions.routeKeys()];
    const active = keys.filter(r => mapOptions.isRouteActive(r)).length;
    rtCount.textContent = active === keys.length ? 'All' : active === 0 ? 'No' : active;
  }

  rtTrigger.addEventListener('click', () => {
    rtTrigger.classList.toggle('open');
    rtPanel.classList.toggle('open');
    if (rtPanel.classList.contains('open')) {
      keepInViewport(rtPanel);
      rtSearch.focus();
    }
  });

  const rtSearchClear = document.getElementById("rtSearchClear");
  rtSearch.addEventListener('input', () => {
    const q = rtSearch.value.toLowerCase();
    routeList.querySelectorAll('.rt-item').forEach(item => {
      item.classList.toggle('hidden', !item.dataset.label.includes(q));
    });
    rtSearchClear.classList.toggle('visible', rtSearch.value.length > 0);
  });
  rtSearchClear.addEventListener('click', () => {
    rtSearch.value = '';
    routeList.querySelectorAll('.rt-item').forEach(item => item.classList.remove('hidden'));
    rtSearchClear.classList.remove('visible');
    rtSearch.focus();
  });

  document.addEventListener('click', e => {
    if (!document.getElementById('rtDropdown').contains(e.target)) {
      rtTrigger.classList.remove('open');
      rtPanel.classList.remove('open');
    }
  });

  let frequentRoutes, localRoutes;

  function rebuildRouteGroups() {
    const maxTripsByRoute = new Map();
    for (const stop of stopData.stops)
      for (const [routeNum, route] of Object.entries(stopData.getRoutes(stop.stop_id)))
        for (const dataId of Object.values(route)) {
          const t = dataId['MID']?.OBSERVED_TRIPS_IDS;
          if (t != null)
            maxTripsByRoute.set(routeNum, Math.max(maxTripsByRoute.get(routeNum) ?? 0, t));
        }
    frequentRoutes = new Set([...maxTripsByRoute.entries()].filter(([, t]) => t >= 23).map(([r]) => r));
    localRoutes = new Set([...maxTripsByRoute.entries()].filter(([, t]) => t >= 11 && t <= 22).map(([r]) => r));
  }

  function rebuildRouteDropdown() {
    rebuildRouteGroups();
    routeList.innerHTML = '';
    for (const [routeNum, active] of mapOptions.routeEntries()) {
      const name = stopData.getRouteName(routeNum);
      const item = document.createElement('div');
      item.className = `rt-item${active ? ' active' : ''}`;
      item.dataset.label = name.toLowerCase();
      item.dataset.routeNum = routeNum;
      item.innerHTML = `<div class="rt-check"><svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5l2.5 2.5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>${name}`;
      item.addEventListener('click', () => {
        const nowActive = item.classList.toggle('active');
        mapOptions.setRoute(routeNum, nowActive);
        rtUpdateCount();
        updateGroupHighlights();
        vizDrawer.updateStops();
        clickHandler.getStops();
        chartsHandler.update(clickHandler.clickStops);
      });
      routeList.appendChild(item);
    }
    rtUpdateCount();
    updateGroupHighlights();
  }

  const btnAll = document.getElementById("routeAll");
  const btnFrequent = document.getElementById("routeFrequent");
  const btnLocal = document.getElementById("routeLocal");

  function allActive(group) {
    return [...group].every(r => mapOptions.isRouteActive(r));
  }

  function updateGroupHighlights() {
    btnAll.classList.toggle('active', allActive(new Set(mapOptions.routeKeys())));
    btnFrequent.classList.toggle('active', allActive(frequentRoutes));
    btnLocal.classList.toggle('active', allActive(localRoutes));
  }

  function setRouteGroup(group, active) {
    for (const routeNum of group) mapOptions.setRoute(routeNum, active);
    routeList.querySelectorAll('.rt-item').forEach(i => {
      if (group.has(i.dataset.routeNum)) i.classList.toggle('active', active);
    });
    rtUpdateCount();
    updateGroupHighlights();
    vizDrawer.updateStops();
    clickHandler.getStops();
    chartsHandler.update(clickHandler.clickStops);
  }

  function toggleRouteGroup(group) {
    setRouteGroup(group, !allActive(group));
  }

  btnAll.addEventListener('click', () => toggleRouteGroup(new Set(mapOptions.routeKeys())));
  btnFrequent.addEventListener('click', () => toggleRouteGroup(frequentRoutes));
  btnLocal.addEventListener('click', () => toggleRouteGroup(localRoutes));
  document.getElementById("routeNone").addEventListener('click', () => setRouteGroup(new Set(mapOptions.routeKeys()), false));

  rebuildRouteDropdown();

  return { rebuildRouteDropdown };
}
