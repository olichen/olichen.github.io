---
layout: page
title: Project
permalink: /project/
---

# Bus Ridership Near You
## How Your Neighborhood Gets Around

Seattle is a city on the move. Link light rail is slowly expanding, but the bus network still forms the backbone of the public transportation network. Every day, [hundreds of thousands of residents](https://www.transit.dot.gov/ntd/data-product/monthly-module-raw-data-release) rely on King County Metro's bus system to get them to where they need to go. Whether or not you are a regular rider, understanding how your neighbors get around can offer insight into how buses shape the transportation network in our city.

### Why Take The Bus? The Benefits Of Public Transit

Taking the bus doesn't just take you from point A to point B. It saves you money, improves your health, makes your city more livable, and cuts down on carbon emissions. Public transit plays a crucial role in affordability, sustainability, and urban mobility.

- **Save Money**: The average American spends [more than $1,000 a month](https://www.ramseysolutions.com/budgeting/american-average-monthly-expenses) on transportation. This is the second biggest line item for most household budgets behind housing, and doesn't even include often-overlooked cost of parking. A single parking space costs [tens of thousands of dollars](https://www.thestranger.com/features/2015/07/29/22612207/the-hidden-reason-behind-seattles-skyrocketing-housing-costs) to build. This expense is passed on to renters and homeowners in the form of increased rent or mortgage. Reloading an ORCA card is far cheaper than the costs of owning, parking, and maintaining a car.

- **Improve Your Health**: By taking public transportation, you not only [boost your physical activity](https://www.sciencedirect.com/science/article/pii/S2214140522000305) but also reduce your risk of being involved in a serious car crash. Driving is the most dangerous thing we do on a regular basis, and public transit is a staggering [17-66 times safer per mile](https://www.sciencedirect.com/science/article/abs/pii/S000145751930644X) than driving.

<p class="d-flex flex-column align-items-center">
  <img src="/assets/img/bus-car-geometry.jpg" width=400>
  <i>A bus can move many more people with much less space than cars</i>
</p>

- **Perserve Green Space**: Public transit reduces the need for extensive roads and parking lots. [Roughly 10-20%](https://www.sightline.org/2013/08/08/park-place/) of our cities are paved over for parking alone. We could easily cover our cities in trees if we [converted some of that parking into green space](https://www.theurbanist.org/2025/02/22/op-ed-convert-street-parking-to-trees-seattle/).

- **Reduce Emissions**: [Almost 30%](https://css.umich.edu/publications/factsheets/sustainability-indicators/carbon-footprint-factsheet) of our carbon emissions come from transportation. Every person on the bus is another car off the road, helping cut emissions and ease congestion.

- **Equitable & Accessible**: [Around one in four](https://leg.wa.gov/media/41gegl2v/nondriversstudyfinalreportsummaryreport.pdf) Washington State residents do not drive (and many more perhaps should not drive). Buses provide transportation to people who don't or can't drive, ensuring access to mobility for everyone.

### How To Use This Tool

This interactive tool lets you explore bus ridership near you - revealing which stops see the most boardings, how ridership varies across neighborhoods, and how accessible transit is near you.

- **Each circle on the map** represents a bus stop, with circle size reflecting the number of people that board at that stop every day.

- **Hover over a stop** to see route details and ridership statistics for that stop.

- **Click on the map** to place a starting location and view aggregated data on ridership within walking distance from that location.

- **Adjust the walk distance slider** to set a walk radius from the selected starting location.

- **Select specific routes** using the route selector to drill down to specific bus routes.

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

### Data

Data is from [King County Metro](https://kingcounty.gov/en/dept/metro)'s spring 2024 service, roughly June to September of 2024. Special thanks to [Seattle Transit Blog](https://seattletransitblog.com/) for helping me get the data.

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
</script>

<script>
// Bind the walk time slider
const walkTimeInput = document.getElementById("walkTimeInput");
const walkTimeLabel = document.getElementById("walkTimeLabel");
walkTimeInput.oninput = function() {
  walkTimeLabel.innerHTML = `Walk Distance (${this.value} minutes)`;
  clickHandler.setWalkTime(this.value);
}
</script>

<script>
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
