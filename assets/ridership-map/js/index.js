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
import { Dataset, Metric, TimePeriod, RidershipType, VizType, ToolbarOptions } from "./toolbarOptions.js";
import { initRouteSelector } from "./routeSelector.js";
import { MapOptions } from "./mapOptions.js";
import { UrlUpdater } from "./urlUpdater.js";
import { keepInViewport } from "./util.js";

// Initialize options and restore state from URL before anything renders
const toolbarOptions = new ToolbarOptions();
const mapOptions = new MapOptions();
const panelHandler = new PanelHandler('map-container', 'toolbarPanel', 'chartsPanel');
const urlUpdater = new UrlUpdater(mapOptions, toolbarOptions, panelHandler);
urlUpdater.applyFromUrl();
panelHandler.setOnChange(() => urlUpdater.update());
const map = new LMap("map", panelHandler, mapOptions.center, mapOptions.zoom);
map.on('moveend', e => { mapOptions.setCenter(e.target.getCenter().lat, e.target.getCenter().lng); urlUpdater.update(); });
map.on('zoomend', e => { mapOptions.setZoom(e.target.getZoom()); urlUpdater.update(); });

let stopData = await StopData.createInstance(toolbarOptions);
let chartsHandler = new ChartsHandler(stopData, toolbarOptions, panelHandler);
let vizDrawer = new VisualizationDrawer(map, stopData, toolbarOptions);
const clickHandler = new ClickHandler(map, stopData, vizDrawer, chartsHandler, toolbarOptions, () => urlUpdater.update());
clickHandler.setClickRadius();

panelHandler.setOnCloseCharts(() => {
  clickHandler.reset();
  chartsHandler.update(new Set());
});

chartsHandler.update(new Set());

async function reloadDataset() {
  toolbarOptions.clearRoutes();
  await stopData.reload();
  vizDrawer.reload();
  rebuildRouteDropdown();
  clickHandler.getStops();
  chartsHandler.update(clickHandler.clickStops);
  urlUpdater.update();
}

// Bind the charts close button
document.getElementById('chartsCloseBtn').addEventListener('click', () => panelHandler.closeCharts());

// Bind the distance slider
const distanceInput = document.getElementById("distanceInput");
const distanceLabel = document.getElementById("distanceLabel");
distanceInput.oninput = function() {
  distanceLabel.textContent = `${this.value} m`;
  toolbarOptions.setDistance(this.value);
  clickHandler.setClickRadius();
  clickHandler.getStops();
  urlUpdater.update();
}

// Bind the metric seg-control
const metricTotal = document.getElementById("metricTotal");
const metricPerBus = document.getElementById("metricPerBus");
metricTotal.onclick = () => {
  toolbarOptions.setMetric(Metric.Total);
  metricTotal.classList.add("active");
  metricPerBus.classList.remove("active");
  vizDrawer.updateStops();
  chartsHandler.update(clickHandler.clickStops);
  urlUpdater.update();
};
metricPerBus.onclick = () => {
  toolbarOptions.setMetric(Metric.PerBus);
  metricPerBus.classList.add("active");
  metricTotal.classList.remove("active");
  vizDrawer.updateStops();
  chartsHandler.update(clickHandler.clickStops);
  urlUpdater.update();
};

// Bind the time period pills
for (const [name, value] of Object.entries(TimePeriod)) {
  const pill = document.getElementById(`tp${value}`);
  pill.onclick = () => {
    const active = pill.classList.toggle('active');
    toolbarOptions.setTimePeriodActive(value, active);
    vizDrawer.updateStops();
    clickHandler.getStops();
    chartsHandler.update(clickHandler.clickStops);
    urlUpdater.update();
  };
}

// Bind the ridership type pills
for (const [name, value] of Object.entries(RidershipType)) {
  const pill = document.getElementById(`rt${name}`);
  pill.onclick = () => {
    const active = pill.classList.toggle('active');
    toolbarOptions.setRidershipTypeActive(value, active);
    vizDrawer.updateStops();
    clickHandler.getStops();
    chartsHandler.update(clickHandler.clickStops);
    urlUpdater.update();
  };
}

// Route dropdown
const { rebuildRouteDropdown } = initRouteSelector(toolbarOptions, stopData, vizDrawer, clickHandler, chartsHandler, () => urlUpdater.update());
urlUpdater.applyRoutesFromUrl(rebuildRouteDropdown);

// Bind the visualization type dropdown
const vizTypeScatterplot = document.getElementById("vizTypeScatterplot");
const vizTypeHeatmap = document.getElementById("vizTypeHeatmap");
vizTypeScatterplot.onclick = () => {
  toolbarOptions.setVizType(VizType.Scatterplot);
  vizTypeScatterplot.classList.add("active");
  vizTypeHeatmap.classList.remove("active");
  vizDrawer.setVizType(VizType.Scatterplot);
  clickHandler.getStops();
  chartsHandler.update(clickHandler.clickStops);
  urlUpdater.update();
};
vizTypeHeatmap.onclick = () => {
  toolbarOptions.setVizType(VizType.Heatmap);
  vizTypeHeatmap.classList.add("active");
  vizTypeScatterplot.classList.remove("active");
  vizDrawer.setVizType(VizType.Heatmap);
  clickHandler.getStops();
  chartsHandler.update(clickHandler.clickStops);
  urlUpdater.update();
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
    toolbarOptions.setDataset(opt.dataset.value === "spring2024" ? Dataset.Spring2024 : Dataset.Fall2024);
    await reloadDataset();
  });
});
document.addEventListener('click', e => {
  if (!document.getElementById('svcDropdown').contains(e.target)) {
    svcTrigger.classList.remove('open');
    svcPanel.classList.remove('open');
  }
});

// Sync all UI elements to match options restored from URL
function initUIFromOptions() {
  metricTotal.classList.toggle('active', toolbarOptions.metric === Metric.Total);
  metricPerBus.classList.toggle('active', toolbarOptions.metric === Metric.PerBus);

  for (const [name, value] of Object.entries(TimePeriod))
    document.getElementById(`tp${value}`).classList.toggle('active', toolbarOptions.isTimePeriodActive(value));

  for (const [name, value] of Object.entries(RidershipType))
    document.getElementById(`rt${name}`).classList.toggle('active', toolbarOptions.isRidershipTypeActive(value));

  vizTypeScatterplot.classList.toggle('active', toolbarOptions.vizType === VizType.Scatterplot);
  vizTypeHeatmap.classList.toggle('active', toolbarOptions.vizType === VizType.Heatmap);

  distanceInput.value = toolbarOptions.distance;
  distanceLabel.textContent = `${toolbarOptions.distance} m`;

  const isSpring = toolbarOptions.dataset === Dataset.Spring2024;
  svcLabel.textContent = isSpring ? 'Spring 2024' : 'Fall 2024';
  svcPanel.querySelectorAll('.svc-option').forEach(opt => {
    opt.classList.toggle('selected', (opt.dataset.value === 'spring2024') === isSpring);
  });
}

initUIFromOptions();
urlUpdater.update();
