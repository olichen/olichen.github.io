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

  function rebuildRouteDropdown() {
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
        vizDrawer.updateStops();
        clickHandler.getStops();
        chartsHandler.update(clickHandler.clickStops);
      });
      routeList.appendChild(item);
    }
    rtUpdateCount();
  }

  function routesByMidTrips(min, max = Infinity) {
    const result = new Set();
    for (const stop of stopData.stops)
      for (const [routeNum, route] of Object.entries(stopData.getRoutes(stop.stop_id)))
        for (const dataId of Object.values(route)) {
          const t = dataId['MID']?.OBSERVED_TRIPS_IDS;
          if (t >= min && t <= max) result.add(routeNum);
        }
    return result;
  }

  function toggleRouteGroup(group) {
    const allActive = [...group].every(r => mapOptions.isRouteActive(r));
    const next = !allActive;
    for (const routeNum of group) mapOptions.setRoute(routeNum, next);
    routeList.querySelectorAll('.rt-item').forEach(i => {
      if (group.has(i.dataset.routeNum)) i.classList.toggle('active', next);
    });
    rtUpdateCount();
    vizDrawer.updateStops();
    clickHandler.getStops();
    chartsHandler.update(clickHandler.clickStops);
  }

  document.getElementById("routeAll").addEventListener('click', () => toggleRouteGroup(new Set(mapOptions.routeKeys())));
  document.getElementById("routeFrequent").addEventListener('click', () => toggleRouteGroup(routesByMidTrips(23)));
  document.getElementById("routeLocal").addEventListener('click', () => toggleRouteGroup(routesByMidTrips(11, 22)));
  document.getElementById("routeNone").addEventListener('click', () => {
    for (const routeNum of mapOptions.routeKeys()) mapOptions.setRoute(routeNum, false);
    routeList.querySelectorAll('.rt-item').forEach(i => i.classList.remove('active'));
    rtUpdateCount();
    vizDrawer.updateStops();
    clickHandler.getStops();
    chartsHandler.update(clickHandler.clickStops);
  });

  rebuildRouteDropdown();

  return { rebuildRouteDropdown };
}
