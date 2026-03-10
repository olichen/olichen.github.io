---
layout: post
title: "Ridership"
date: 2026-01-01
categories: placeholder
---

<!-- packages -->
<link rel="stylesheet" href="/assets/dist/index.css" />

<!-- walk distance slider and route selector -->
<div class="d-flex justify-content-between">
  <div>
    <label id="walkTimeLabel" for="walkTimeInput" class="fw-bold form-label">Walk Distance (10 minutes)</label>
    <input id="walkTimeInput" type="range" class="form-range" min="1" max="20" value="10" oninput="clickHandler.setWalkTime()">
  </div>
  <div class="d-flex gap-2">
    <div class="dropdown">
      <button class="btn btn-outline-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" id="metricButton">
        Metric
      </button>
      <div class="dropdown-menu shadow-sm" id="metricDropdown" style="z-index:10000">
        <button class="dropdown-item active" id="metricTotal">Total Per Day</button>
        <button class="dropdown-item" id="metricPerBus">Average Per Bus</button>
      </div>
    </div>
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
<div id="map-container" class="mt-2">
  <div id="map"></div>
</div>

<!-- bar charts -->
<div id="viz" class="row mt-3">
  <div id="viz1" class="col-12 col-xl-6 viz"></div>
  <div id="viz2" class="col-12 col-xl-6 viz"></div>
</div>

<!-- some whitespace -->
<div style="height:20px"></div>

<script type="module" src="/assets/dist/index.js"></script>