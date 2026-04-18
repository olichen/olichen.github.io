import { render } from "./vega-lite.js";
import { Metric } from "./toolbarOptions.js";

export class ChartsHandler {
  #stopData;
  #toolbarOptions;
  #panelHandler;
  #isTouchDevice;

  constructor(stopData, toolbarOptions, panelHandler, isTouchDevice) {
    this.#stopData = stopData;
    this.#toolbarOptions = toolbarOptions;
    this.#panelHandler = panelHandler;
    this.#isTouchDevice = isTouchDevice;
  }

  update(stopIds) {
    if (stopIds && stopIds.size > 0) {
      this.#panelHandler.openCharts();
    }
    this.updateStats(this.#stopData, stopIds);
    this.drawCharts(this.#stopData, stopIds, this.#toolbarOptions.metric);
  }

  updateStats(stopData, stopIds) {
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
        routeBuses[routeId] = (routeBuses[routeId] ?? 0) + buses;
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

  async drawCharts(stopData, stopIds, metric) {
    const CHART_HEIGHT = 190;

    const chart1Html = document.getElementById("chart1");
    const chart2Html = document.getElementById("chart2");

    if (!stopIds || stopIds.size === 0) {
      chart1Html.innerHTML = `<div class="border h-100 text-center align-content-center">${this.#isTouchDevice ? 'Press and hold' : 'Click'} a location on the map to see more information about nearby stops</div>`;
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

    const BAR_STEP = 12;
    const BASE_WIDTH = 400;

    const chart1Width = Math.max(BASE_WIDTH, new Set(stopValues.map(d => d.routeName)).size * BAR_STEP);
    const chart2Width = Math.max(BASE_WIDTH, new Set(stopValues.map(d => d.stopLabel)).size * BAR_STEP);

    const chart1 = {
      mark: "bar",
      data: { values: stopValues },
      transform: [
        {
          aggregate: [
            { op: "sum", field: "riders", type: "Q", as: "riders" },
            { op: "sum", field: "numBuses", type: "Q", as: "numBuses" },
          ],
          groupby: ["routeName"]
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
          title: metric === Metric.PerBus ? "Riders Per Bus" : "Riders Per Day",
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
            title: "Riders Per Day",
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
            title: "Riders Per Bus",
            format: ".1f",
          },
        ],
      },
      width: chart1Width,
      height: CHART_HEIGHT,
      title: "Daily Riders By Route"
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
          groupby: ["stopLabel"]
        },
        { calculate: "datum.riders / datum.numBuses", as: "ridersPerBus" },
      ],
      encoding: {
        x: {
          field: "stopLabel",
          type: "N",
          sort: { field: metric === Metric.PerBus ? "ridersPerBus" : "riders", order: "descending" },
          title: "Stop",
          axis: {
            labelExpr: [
              "lastindexof(datum.label, ' (') >= 0",
              "  ? (length(slice(datum.label, 0, lastindexof(datum.label, ' ('))) > 10",
              "     ? slice(datum.label, 0, 10) + '…' + slice(datum.label, lastindexof(datum.label, ' ('))",
              "     : datum.label)",
              "  : (length(datum.label) > 10",
              "     ? slice(datum.label, 0, 10) + '…'",
              "     : datum.label)",
            ].join(" "),
          },
        },
        y: {
          field: metric === Metric.PerBus ? "ridersPerBus" : "riders",
          type: "Q",
          title: metric === Metric.PerBus ? "Riders Per Bus" : "Riders Per Day",
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
            title: "Riders Per Day",
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
            title: "Riders Per Bus",
            format: ".1f",
          },
        ]
      },
      width: chart2Width,
      height: CHART_HEIGHT,
      title: "Daily Riders By Stop",
    };

    const PANE_PADDING = 16; // 8px each side
    chart1Html.parentElement.style.width = `${chart1Width + PANE_PADDING}px`;
    chart2Html.parentElement.style.width = `${chart2Width + PANE_PADDING}px`;

    chart1Html.innerHTML = null;
    await render(chart1, chart1Html);
    chart2Html.innerHTML = null;
    await render(chart2, chart2Html);
    window.dispatchEvent(new Event("resize"));
  }
}
