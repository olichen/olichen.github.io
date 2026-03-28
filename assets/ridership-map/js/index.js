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

// Create the route selectors
const routeDropdown = document.getElementById("routeDropdown");

function rebuildRouteDropdown() {
  const firstChild = routeDropdown.firstElementChild;
  routeDropdown.innerHTML = "";
  routeDropdown.appendChild(firstChild);
  let dropdownHtml = "";
  for (const [routeNum, active] of mapOptions.routeEntries()) {
    dropdownHtml += `<div class="btn-group btn-sm d-flex" role="group">`;
    dropdownHtml += `<input type="checkbox" class="btn-check" id="route${routeNum}" autocomplete="off" ${active ? "checked" : ""}>`;
    dropdownHtml += `<label class="btn btn-outline-info btn-sm no-radius" for="route${routeNum}">${stopData.getRouteName(routeNum)}</label>`;
    dropdownHtml += `</div>`;
  }
  routeDropdown.insertAdjacentHTML("beforeend", dropdownHtml);
  for (const routeNum of mapOptions.routeKeys()) {
    const checkbox = document.getElementById(`route${routeNum}`);
    checkbox.onchange = (e) => {
      mapOptions.setRoute(routeNum, e.target.checked);
      vizDrawer.updateStops();
      clickHandler.getStops();
      chartsHandler.update(clickHandler.clickStops);
    }
  }
}

rebuildRouteDropdown();

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

// Bind the dataset select
const datasetSelect = document.getElementById("datasetSelect");
datasetSelect.onchange = async function() {
  mapOptions.setDataset(this.value === "spring2024" ? Dataset.Spring2024 : Dataset.Fall2024);
  await reloadDataset();
};

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
