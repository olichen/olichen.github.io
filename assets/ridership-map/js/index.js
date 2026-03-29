import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import 'leaflet/dist/leaflet.css';
import '../css/layout.css';
import '../css/toolbar-panel.css';
import '../css/charts-panel.css';
import '../css/leaflet.css';
import { LMap } from "./map.js";
import { StopData } from "./stopData.js";
import { VisualizationDrawer } from "./visualizationDrawer.js";
import { ClickHandler } from "./clickHandler.js";
import { ChartsHandler } from "./chartsHandler.js";
import { PanelHandler } from "./panelHandler.js";
import { Dataset, Metric, TimePeriod, RidershipType, VizType, MapOptions } from "./mapOptions.js";

// Initialize everything
const mapOptions = new MapOptions();
const panelHandler = new PanelHandler('map-container', 'toolbarPanel', 'chartsPanel');
const map = new LMap("map", panelHandler);
let stopData = await StopData.createInstance(mapOptions);
let chartsHandler = new ChartsHandler(stopData, mapOptions, panelHandler);
let vizDrawer = new VisualizationDrawer(map, stopData, mapOptions);
const clickHandler = new ClickHandler(map, stopData, vizDrawer, chartsHandler);

panelHandler.setOnCloseCharts(() => {
  clickHandler.reset();
  chartsHandler.update(new Set());
});

chartsHandler.update(new Set());

async function reloadDataset() {
  mapOptions.clearRoutes();
  await stopData.reload();
  vizDrawer.reload();
  rebuildRouteDropdown();
  clickHandler.getStops();
  chartsHandler.update(clickHandler.clickStops);
}

// Bind the charts close button
document.getElementById('chartsCloseBtn').addEventListener('click', () => panelHandler.closeCharts());

// Bind the walk time slider
const walkTimeInput = document.getElementById("walkTimeInput");
const walkTimeLabel = document.getElementById("walkTimeLabel");
walkTimeInput.oninput = function() {
  walkTimeLabel.textContent = `${this.value} min`;
  clickHandler.setWalkTime(this.value);
}

// Bind the metric seg-control
const metricTotal = document.getElementById("metricTotal");
const metricPerBus = document.getElementById("metricPerBus");
metricTotal.onclick = () => {
  mapOptions.setMetric(Metric.Total);
  metricTotal.classList.add("active");
  metricPerBus.classList.remove("active");
  vizDrawer.updateStops();
  chartsHandler.update(clickHandler.clickStops);
};
metricPerBus.onclick = () => {
  mapOptions.setMetric(Metric.PerBus);
  metricPerBus.classList.add("active");
  metricTotal.classList.remove("active");
  vizDrawer.updateStops();
  chartsHandler.update(clickHandler.clickStops);
};

// Bind the time period pills
for (const [name, value] of Object.entries(TimePeriod)) {
  const pill = document.getElementById(`tp${value}`);
  pill.onclick = () => {
    const active = pill.classList.toggle('active');
    mapOptions.setTimePeriodActive(value, active);
    vizDrawer.updateStops();
    clickHandler.getStops();
    chartsHandler.update(clickHandler.clickStops);
  };
}

// Bind the ridership type pills
for (const [name, value] of Object.entries(RidershipType)) {
  const pill = document.getElementById(`rt${name}`);
  pill.onclick = () => {
    const active = pill.classList.toggle('active');
    mapOptions.setRidershipTypeActive(value, active);
    vizDrawer.updateStops();
    clickHandler.getStops();
    chartsHandler.update(clickHandler.clickStops);
  };
}

// Route dropdown
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

function keepInViewport(panel) {
  panel.style.left = '0';
  panel.style.right = 'auto';
  const rect = panel.getBoundingClientRect();
  if (rect.right > window.innerWidth - 8) {
    panel.style.left = 'auto';
    panel.style.right = '0';
  }
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

rebuildRouteDropdown();

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
document.getElementById("routeAllDay").addEventListener('click', () => toggleRouteGroup(routesByMidTrips(5, 10)));

// Bind the visualization type dropdown
const vizTypeScatterplot = document.getElementById("vizTypeScatterplot");
const vizTypeHeatmap = document.getElementById("vizTypeHeatmap");
vizTypeScatterplot.onclick = () => {
  mapOptions.setVizType(VizType.Scatterplot);
  vizTypeScatterplot.classList.add("active");
  vizTypeHeatmap.classList.remove("active");
  vizDrawer.setVizType(VizType.Scatterplot);
  clickHandler.getStops();
  chartsHandler.update(clickHandler.clickStops);
};
vizTypeHeatmap.onclick = () => {
  mapOptions.setVizType(VizType.Heatmap);
  vizTypeHeatmap.classList.add("active");
  vizTypeScatterplot.classList.remove("active");
  vizDrawer.setVizType(VizType.Heatmap);
  clickHandler.getStops();
  chartsHandler.update(clickHandler.clickStops);
};

// Service dropdown
const svcTrigger = document.getElementById("svcTrigger");
const svcPanel = document.getElementById("svcPanel");
const svcLabel = document.getElementById("svcLabel");
svcTrigger.addEventListener('click', () => {
  svcTrigger.classList.toggle('open');
  svcPanel.classList.toggle('open');
  if (svcPanel.classList.contains('open')) keepInViewport(svcPanel);
});
svcPanel.querySelectorAll('.svc-option').forEach(opt => {
  opt.addEventListener('click', async () => {
    svcPanel.querySelectorAll('.svc-option').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    svcLabel.textContent = opt.dataset.value === 'spring2024' ? 'Spring 2024' : 'Fall 2024';
    svcTrigger.classList.remove('open');
    svcPanel.classList.remove('open');
    mapOptions.setDataset(opt.dataset.value === "spring2024" ? Dataset.Spring2024 : Dataset.Fall2024);
    await reloadDataset();
  });
});
document.addEventListener('click', e => {
  if (!document.getElementById('svcDropdown').contains(e.target)) {
    svcTrigger.classList.remove('open');
    svcPanel.classList.remove('open');
  }
});