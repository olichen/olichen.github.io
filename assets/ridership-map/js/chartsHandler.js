import { render } from "./vega-lite.js";
import { Metric } from "./mapOptions.js";

export async function updateChartsPanel(stopData, stopIds, metric = Metric.Total) {
  updateStatsPanel(stopData, stopIds);
  drawCharts(stopData, stopIds, metric);
}

function updateStatsPanel(stopData, stopIds) {
  const statRidership = document.getElementById("statRidership");
  const statPerBus = document.getElementById("statPerBus");
  const statStops = document.getElementById("statStops");
  const statRoutes = document.getElementById("statRoutes");

  if (!stopIds || stopIds.size === 0) {
    statRidership.textContent = "—";
    statPerBus.textContent = "—";
    statStops.textContent = "—";
    statRoutes.textContent = "—";
    return;
  }

  let totalRiders = 0;
  const routeBuses = {};
  const routeSet = new Set();

  for (const stopId of stopIds) {
    totalRiders += stopData.getTotalRiders(stopId);
    for (const routeId of Object.keys(stopData.getRoutes(stopId))) {
      routeSet.add(routeId);
      const buses = stopData.getNumBuses(stopId, routeId);
      routeBuses[routeId] = Math.max(routeBuses[routeId] ?? 0, buses);
    }
  }

  const totalBuses = Object.values(routeBuses).reduce((sum, b) => sum + b, 0);
  const ridersPerBus = totalBuses > 0 ? totalRiders / totalBuses : 0;
  const displayRiders = totalRiders < 10 ? Math.round(totalRiders * 10) / 10 : Math.round(totalRiders);

  statRidership.textContent = displayRiders.toLocaleString();
  statPerBus.textContent = ridersPerBus.toFixed(1);
  statStops.textContent = stopIds.size;
  statRoutes.textContent = routeSet.size;
}

async function drawCharts(stopData, stopIds, metric) {
  const CHART_HEIGHT = 190;

  const chart1Html = document.getElementById("chart1");
  const chart2Html = document.getElementById("chart2");

  if (!stopIds || stopIds.size === 0) {
    chart1Html.innerHTML = '<div class="border h-100 text-center align-content-center">Click a location on the map to see more information</div>';
    chart2Html.innerHTML = chart1Html.innerHTML;
    return;
  }

  const stopValues = [];
  for (const stopId of stopIds) {
    const stopValue = stopData.getStop(stopId);

    const compassDir = stopData.getCompassDir(stopId);
    const stopLabel = compassDir ? `${stopValue.stop_name} (${compassDir}B)` : stopValue.stop_name;
    for (const routeId of Object.keys(stopData.getRoutes(stopId))) {
      const stopRiders = stopData.getTotalRiders(stopId, routeId);
      if (stopRiders === 0) continue;
      stopValues.push({
        ...stopValue,
        stopLabel,
        routeName: stopData.getRouteName(routeId),
        numBuses: stopData.getNumBuses(stopId, routeId),
        riders: stopRiders
      });
    }
  }

  const chart1 = {
    mark: "bar",
    data: { values: stopValues },
    transform: [
      {
        aggregate: [
          { op: "sum", field: "riders", type: "Q", as: "riders" },
          { op: "max", field: "numBuses", type: "Q", as: "numBuses" },
        ],
        groupby: [ "routeName" ]
      },
      { filter: "datum.riders > 0" },
      { calculate: "datum.riders / datum.numBuses", as: "ridersPerBus" },
    ],
    encoding: {
      x: {
        field: "routeName",
        type: "N",
        sort: "-y",
        title: "Route",
      },
      y: {
        field: metric === Metric.PerBus ? "ridersPerBus" : "riders",
        type: "Q",
        title: metric === Metric.PerBus ? "Boardings Per Bus" : "Boardings Per Day",
      },
      tooltip: [
        {
          field: "routeName",
          type: "N",
          title: "Route"
        },
        {
          field: "riders",
          type: "Q",
          title: "Boardings Per Day",
          format: "d",
        },
        {
          field: "numBuses",
          type: "Q",
          title: "Buses Per Day",
        },
        {
          field: "ridersPerBus",
          type: "Q",
          title: "Boardings Per Bus",
          format: ".1f",
        },
      ],
    },
    width: "container",
    height: CHART_HEIGHT,
    title: "Daily Boardings By Route"
  };

  const chart2 = {
    mark: "bar",
    data: { values: stopValues },
    transform: [
      {
        aggregate: [
          { op: "sum", field: "riders", type: "Q", as: "riders" },
          { op: "sum", field: "numBuses", type: "Q", as: "numBuses" },
        ],
        groupby: [ "stopLabel" ]
      },
      { calculate: "datum.riders / datum.numBuses", as: "ridersPerBus" },
      { calculate: [
          "lastindexof(datum.stopLabel, ' (') >= 0",
          "  ? (length(slice(datum.stopLabel, 0, lastindexof(datum.stopLabel, ' ('))) > 10",
          "     ? slice(datum.stopLabel, 0, 10) + '…' + slice(datum.stopLabel, lastindexof(datum.stopLabel, ' ('))",
          "     : datum.stopLabel)",
          "  : (length(datum.stopLabel) > 10",
          "     ? slice(datum.stopLabel, 0, 10) + '…'",
          "     : datum.stopLabel)",
        ].join(" "), as: "stopLabelShort" },
    ],
    encoding: {
      x: {
        field: "stopLabelShort",
        type: "N",
        sort: { field: metric === Metric.PerBus ? "ridersPerBus" : "riders", order: "descending" },
        title: "Stop",
      },
      y: {
        field: metric === Metric.PerBus ? "ridersPerBus" : "riders",
        type: "Q",
        title: metric === Metric.PerBus ? "Boardings Per Bus" : "Boardings Per Day",
      },
      tooltip: [
        {
          field: "stopLabel",
          type: "N",
          title: "Stop"
        },
        {
          field: "riders",
          type: "Q",
          title: "Boardings Per Day",
          format: "d",
        },
        {
          field: "numBuses",
          type: "Q",
          title: "Buses Per Day",
        },
        {
          field: "ridersPerBus",
          type: "Q",
          title: "Boardings Per Bus",
          format: ".1f",
        },
      ]
    },
    width: "container",
    height: CHART_HEIGHT,
    title: "Daily Boardings By Stop",
  };

  chart1Html.innerHTML = null;
  await render(chart1, chart1Html);
  chart2Html.innerHTML = null;
  await render(chart2, chart2Html);
  window.dispatchEvent(new Event("resize"));
}
