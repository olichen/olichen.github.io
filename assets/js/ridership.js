import 'bootstrap/dist/css/bootstrap.min.css';
import 'leaflet/dist/leaflet.css';
import '../css/style.css';
import { LMap } from "./map.js";
import { StopData } from "./stopData.js";
import { StopHandler } from "./stopHandler.js";
import { ClickHandler } from "./clickHandler.js";
import { drawViz } from "./vizHandler.js";

// Initialize everything
const map = new LMap("map");
const stopData = await StopData.createInstance();
const stopHandler = new StopHandler(map, stopData);
const stopGroup = stopHandler.stopGroup;
const clickHandler = new ClickHandler(map, stopData, stopGroup, clickCallback);

function clickCallback() {
  drawViz(stopData, clickHandler.clickStops);
}

drawViz(stopData, new Set());

// Bind the walk time slider
const walkTimeInput = document.getElementById("walkTimeInput");
const walkTimeLabel = document.getElementById("walkTimeLabel");
walkTimeInput.oninput = function() {
  walkTimeLabel.innerHTML = `Walk Distance (${this.value} minutes)`;
  clickHandler.setWalkTime(this.value);
}

// Create the route selectors
let dropdownHtml = "";
const routeDropdown = document.getElementById("routeDropdown");
for (const [routeNum, active] of Object.entries(stopData.activeRoutes)) {
  dropdownHtml += `<div class="btn-group btn-sm d-flex" role="group">`;
  dropdownHtml += `<input type="checkbox" class="btn-check" id="route${routeNum}" autocomplete="off" ${active ? "checked" : ""}>`;
  dropdownHtml += `<label class="btn btn-outline-info btn-sm no-radius" for="route${routeNum}">${stopData.getRouteName(routeNum)}</label>`;
  dropdownHtml += `</div>`;
}
routeDropdown.innerHTML += dropdownHtml;

// Bind the route selectors
for (const routeNum of Object.keys(stopData.activeRoutes)) {
  const checkbox = document.getElementById(`route${routeNum}`);
  checkbox.onchange = (e) => {
    stopData.activeRoutes[routeNum] = e.target.checked;
    stopHandler.updateStopRadius();
    clickHandler.getStops();
    clickCallback();
  }
  const label = document.querySelector(`label[for="route${routeNum}"]`);
  label.onclick = (e) => {
    e.stopPropagation();
  }
}

// Bind the all/none buttons
const routeAllButton = document.getElementById("routeAll");
const routeNoneButton = document.getElementById("routeNone");
routeAllButton.onclick = e => {
  e.stopPropagation();
  for (const routeNum of Object.keys(stopData.activeRoutes)) {
    stopData.activeRoutes[routeNum] = true;
    const checkbox = document.getElementById(`route${routeNum}`);
    checkbox.checked = true;
  }
  stopHandler.updateStopRadius();
  clickHandler.getStops();
  clickCallback();
}
routeNoneButton.onclick = e => {
  e.stopPropagation();
  for (const routeNum of Object.keys(stopData.activeRoutes)) {
    stopData.activeRoutes[routeNum] = false;
    const checkbox = document.getElementById(`route${routeNum}`);
    checkbox.checked = false;
  }
  stopHandler.updateStopRadius();
  clickHandler.getStops();
  clickCallback();
}
