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

rtTrigger.addEventListener('click', () => {
  rtTrigger.classList.toggle('open');
  rtPanel.classList.toggle('open');
  if (rtPanel.classList.contains('open')) rtSearch.focus();
});

rtSearch.addEventListener('input', () => {
  const q = rtSearch.value.toLowerCase();
  routeList.querySelectorAll('.rt-item').forEach(item => {
    item.classList.toggle('hidden', !item.dataset.label.includes(q));
  });
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

document.getElementById("routeAll").addEventListener('click', () => {
  for (const routeNum of mapOptions.routeKeys()) mapOptions.setRoute(routeNum, true);
  routeList.querySelectorAll('.rt-item').forEach(i => i.classList.add('active'));
  rtUpdateCount();
  vizDrawer.updateStops();
  clickHandler.getStops();
  chartsHandler.update(clickHandler.clickStops);
});

document.getElementById("routeNone").addEventListener('click', () => {
  for (const routeNum of mapOptions.routeKeys()) mapOptions.setRoute(routeNum, false);
  routeList.querySelectorAll('.rt-item').forEach(i => i.classList.remove('active'));
  rtUpdateCount();
  vizDrawer.updateStops();
  clickHandler.getStops();
  chartsHandler.update(clickHandler.clickStops);
});

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

// Bind the all/none buttons
const routeAllButton = document.getElementById("routeAll");
routeAllButton.onclick = e => {
  e.stopPropagation();
  for (const routeNum of mapOptions.routeKeys()) {
    mapOptions.setRoute(routeNum, true);
    const checkbox = document.getElementById(`route${routeNum}`);
    checkbox.checked = true;
  }
  vizDrawer.updateStops();
  clickHandler.getStops();
  chartsHandler.update(clickHandler.clickStops);
}

const routeNoneButton = document.getElementById("routeNone");
routeNoneButton.onclick = e => {
  e.stopPropagation();
  for (const routeNum of mapOptions.routeKeys()) {
    mapOptions.setRoute(routeNum, false);
    const checkbox = document.getElementById(`route${routeNum}`);
    checkbox.checked = false;
  }
  vizDrawer.updateStops();
  clickHandler.getStops();
  chartsHandler.update(clickHandler.clickStops);
}
