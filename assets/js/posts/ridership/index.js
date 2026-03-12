import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import 'leaflet/dist/leaflet.css';
import '../../../css/style.css';
import { LMap } from "./map.js";
import { StopData } from "./stopData.js";
import { StopHandler } from "./stopHandler.js";
import { ClickHandler } from "./clickHandler.js";
import { drawViz } from "./vizHandler.js";
import { Metric, TimePeriod, RidershipType, MapOptions } from "./mapOptions.js";

// Initialize everything
const mapOptions = new MapOptions();
const map = new LMap("map");
const stopData = await StopData.createInstance(mapOptions);
const stopHandler = new StopHandler(map, stopData, mapOptions);
const stopGroup = stopHandler.stopGroup;
const clickHandler = new ClickHandler(map, stopData, stopGroup, clickCallback);

function clickCallback() {
  drawViz(stopData, clickHandler.clickStops, mapOptions.metric);
}

drawViz(stopData, new Set(), mapOptions.metric);

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
  stopHandler.updateStopRadius();
  clickCallback();
};
metricPerBus.onclick = () => {
  mapOptions.setMetric(Metric.PerBus);
  metricPerBus.classList.add("active");
  metricTotal.classList.remove("active");
  stopHandler.updateStopRadius();
  clickCallback();
};

// Bind the time period checkboxes
for (const [name, value] of Object.entries(TimePeriod)) {
  const checkbox = document.getElementById(`tp${value}`);
  checkbox.onchange = (e) => {
    mapOptions.setTimePeriodActive(value, e.target.checked);
    stopHandler.updateStopRadius();
    clickHandler.getStops();
    clickCallback();
  };
}

// Bind the ridership type checkboxes
for (const [name, value] of Object.entries(RidershipType)) {
  const checkbox = document.getElementById(`rt${name}`);
  checkbox.onchange = (e) => {
    mapOptions.setRidershipTypeActive(value, e.target.checked);
    stopHandler.updateStopRadius();
    clickHandler.getStops();
    clickCallback();
  };
}

// Create the route selectors
let dropdownHtml = "";
const routeDropdown = document.getElementById("routeDropdown");
for (const [routeNum, active] of mapOptions.routeEntries()) {
  dropdownHtml += `<div class="btn-group btn-sm d-flex" role="group">`;
  dropdownHtml += `<input type="checkbox" class="btn-check" id="route${routeNum}" autocomplete="off" ${active ? "checked" : ""}>`;
  dropdownHtml += `<label class="btn btn-outline-info btn-sm no-radius" for="route${routeNum}">${stopData.getRouteName(routeNum)}</label>`;
  dropdownHtml += `</div>`;
}
routeDropdown.innerHTML += dropdownHtml;

// Bind the route selectors
for (const routeNum of mapOptions.routeKeys()) {
  const checkbox = document.getElementById(`route${routeNum}`);
  checkbox.onchange = (e) => {
    mapOptions.setRoute(routeNum, e.target.checked);
    stopHandler.updateStopRadius();
    clickHandler.getStops();
    clickCallback();
  }
  /*
  const label = document.querySelector(`label[for="route${routeNum}"]`);
  label.onclick = (e) => {
    e.stopPropagation();
  }
    */
}

// Bind the all/none buttons
const routeAllButton = document.getElementById("routeAll");
routeAllButton.onclick = e => {
  e.stopPropagation();
  for (const routeNum of mapOptions.routeKeys()) {
    mapOptions.setRoute(routeNum, true);
    const checkbox = document.getElementById(`route${routeNum}`);
    checkbox.checked = true;
  }
  stopHandler.updateStopRadius();
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
  stopHandler.updateStopRadius();
  clickHandler.getStops();
  clickCallback();
}
