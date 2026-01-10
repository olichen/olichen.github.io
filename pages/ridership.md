---
layout: page
title: Ridership
permalink: /ridership/
---

<!-- packages -->
<link rel="stylesheet" href="/assets/pkg/leaflet/leaflet.css" />
<link rel="stylesheet" href="/assets/css/style.css" />
<script src="/assets/pkg/leaflet/leaflet.js"></script>
<script src="/assets/pkg/d3/d3.v7.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.17/d3.js" charset="utf-8"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/vega/2.6.5/vega.js" charset="utf-8"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/vega-lite/1.3.1/vega-lite.js" charset="utf-8"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/vega-embed/2.2.0/vega-embed.js" charset="utf-8"></script>

<!-- walk distance slider and route selector -->
<div class="d-flex justify-content-between">
  <div>
    <label id="walkTimeLabel" for="walkTimeInput" class="fw-bold form-label">Walk Distance (10 minutes)</label>
    <input id="walkTimeInput" type="range" class="form-range" min="1" max="20" value="10" oninput="clickHandler.setWalkTime()">
  </div>
  <div>
    <div class="dropdown">
      <button class="btn btn-outline-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
        Select Routes
      </button>
      <div class="dropdown-menu shadow-sm" id="routeDropdown" style="max-height: 500px; overflow-y: scroll; opacity: 0.9; z-index: 10000">
        <div class="d-flex">
          <button id="routeAll" class="w-50 btn btn-outline-secondary btn-sm no-radius">
            All
          </button>
          <button id="routeNone" class="w-50 btn btn-outline-secondary btn-sm no-radius">
            None
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- map -->
<div id="map" class="mt-2"></div>

<!-- bar charts -->
<div id="viz" class="row mt-3">
  <div id="viz1" class="col-12 col-xl-6 viz"></div>
  <div id="viz2" class="col-12 col-xl-6 viz"></div>
</div>

<!-- some whitespace -->
<div style="height:20px"></div>


<script type="module">
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7";
import { LMap } from "/assets/js/map.js";
import { StopData } from "/assets/js/stopData.js";
import { StopHandler } from "/assets/js/stopHandler.js";
import { ClickHandler } from "/assets/js/clickHandler.js";
import { drawViz } from "/assets/js/vizHandler.js";

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
</script>
