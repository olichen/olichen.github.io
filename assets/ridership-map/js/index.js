import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import 'leaflet/dist/leaflet.css';
import '../css/layout.css';
import '../css/charts-panel.css';
import '../css/leaflet.css';
import { LMap } from "./map.js";
import { StopData } from "./stopData.js";
import { ScatterplotHandler } from "./scatterplotHandler.js";
import { ClickHandler } from "./clickHandler.js";
import { drawViz } from "./vizHandler.js";
import { Dataset, Metric, TimePeriod, RidershipType, VizType, MapOptions } from "./mapOptions.js";

// Initialize everything
const mapOptions = new MapOptions();
const map = new LMap("map");
let stopData = await StopData.createInstance(mapOptions);
let stopHandler = new ScatterplotHandler(map, stopData, mapOptions);
const clickHandler = new ClickHandler(map, stopData, stopHandler.stopGroup, clickCallback);

function clickCallback() {
  drawViz(stopData, clickHandler.clickStops, mapOptions.metric);
}

drawViz(stopData, new Set(), mapOptions.metric);

async function reloadDataset() {
  stopHandler.destroy();
  mapOptions.clearRoutes();
  stopData = await StopData.createInstance(mapOptions);
  stopHandler = new ScatterplotHandler(map, stopData, mapOptions);
  clickHandler.setStopData(stopData, stopHandler.stopGroup);
  rebuildRouteDropdown();
  clickHandler.getStops();
  clickCallback();
}

// Bind the walk time slider
const walkTimeInput = document.getElementById("walkTimeInput");
const walkTimeLabel = document.getElementById("walkTimeLabel");
walkTimeInput.oninput = function() {
  walkTimeLabel.innerHTML = `Walk Distance (${this.value} minutes)`;
  clickHandler.setWalkTime(this.value);
}

// Bind the metric dropdown
const metricTotal = document.getElementById("metricTotal");
const metricPerBus = document.getElementById("metricPerBus");
metricTotal.onclick = () => {
  mapOptions.setMetric(Metric.Total);
  metricTotal.classList.add("active");
  metricPerBus.classList.remove("active");
  stopHandler.updateStops();
  clickCallback();
};
metricPerBus.onclick = () => {
  mapOptions.setMetric(Metric.PerBus);
  metricPerBus.classList.add("active");
  metricTotal.classList.remove("active");
  stopHandler.updateStops();
  clickCallback();
};

// Bind the time period checkboxes
for (const [name, value] of Object.entries(TimePeriod)) {
  const checkbox = document.getElementById(`tp${value}`);
  checkbox.onchange = (e) => {
    mapOptions.setTimePeriodActive(value, e.target.checked);
    stopHandler.updateStops();
    clickHandler.getStops();
    clickCallback();
  };
}

// Bind the ridership type checkboxes
for (const [name, value] of Object.entries(RidershipType)) {
  const checkbox = document.getElementById(`rt${name}`);
  checkbox.onchange = (e) => {
    mapOptions.setRidershipTypeActive(value, e.target.checked);
    stopHandler.updateStops();
    clickHandler.getStops();
    clickCallback();
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
      stopHandler.updateStops();
      clickHandler.getStops();
      clickCallback();
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
  stopHandler.updateStops();
  clickCallback();
};
vizTypeHeatmap.onclick = () => {
  mapOptions.setVizType(VizType.Heatmap);
  vizTypeHeatmap.classList.add("active");
  vizTypeScatterplot.classList.remove("active");
  stopHandler.updateStops();
  clickCallback();
};

// Bind the dataset dropdown
const datasetSpring2024 = document.getElementById("datasetSpring2024");
const datasetFall2024 = document.getElementById("datasetFall2024");
datasetSpring2024.onclick = async () => {
  mapOptions.setDataset(Dataset.Spring2024);
  datasetSpring2024.classList.add("active");
  datasetFall2024.classList.remove("active");
  await reloadDataset();
};
datasetFall2024.onclick = async () => {
  mapOptions.setDataset(Dataset.Fall2024);
  datasetFall2024.classList.add("active");
  datasetSpring2024.classList.remove("active");
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
  stopHandler.updateStops();
  clickHandler.getStops();
  clickCallback();
}

const routeNoneButton = document.getElementById("routeNone");
routeNoneButton.onclick = e => {
  e.stopPropagation();
  for (const routeNum of mapOptions.routeKeys()) {
    mapOptions.setRoute(routeNum, false);
    const checkbox = document.getElementById(`route${routeNum}`);
    checkbox.checked = false;
  }
  stopHandler.updateStops();
  clickHandler.getStops();
  clickCallback();
}
