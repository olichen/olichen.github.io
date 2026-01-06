import { render } from "../components/vega-lite.js";

export async function drawViz(stopData, stopIds) {
  const viz1Html = document.getElementById("viz1");
  const viz2Html = document.getElementById("viz2");

  if (stopIds.size === 0) {
    viz1Html.innerHTML = '<div class="border h-100 text-center align-content-center">Click a location on the map to see more information</div>';
    viz2Html.innerHTML = viz1Html.innerHTML;
    return;
  }

  const stopValues = [];
  for (const stopId of stopIds) {
    const stopValue = stopData.getStop(stopId);

    for (const routeId of Object.keys(stopData.getRoutes(stopId))) {
      const stopRiders = stopData.getTotalRiders(stopId, routeId);
      if (stopRiders === 0) continue;
      stopValues.push({
        ...stopValue,
        routeName: stopData.getRouteName(routeId),
        numBuses: stopData.getNumBuses(stopId, routeId),
        riders: stopRiders
      });
    }
  }

  const viz1 = {
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
        field: "riders",
        type: "Q",
        title: "Boardings Per Day",
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
    height: 300,
    title: "Daily Boardings By Route"
  };

  const viz2 = {
    mark: "bar",
    data: { values: stopValues },
    transform: [
      {
        aggregate: [
          { op: "sum", field: "riders", type: "Q", as: "riders" },
          { op: "sum", field: "numBuses", type: "Q", as: "numBuses" },
        ],
        groupby: [ "stop_name" ]
      },
      { calculate: "datum.riders / datum.numBuses", as: "ridersPerBus" },
    ],
    encoding: {
      x: {
        field: "stop_name",
        type: "N",
        sort: "-y",
        title: "Stop",
      },
      y: {
        aggregate: "sum",
        field: "riders",
        type: "Q",
        title: "Boardings Per Day",
      },
      tooltip: [
        {
          field: "stop_name",
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
    height: 300,
    title: "Daily Boardings By Stop",
  };

  viz1Html.innerHTML = null;
  viz1Html.appendChild(await render(viz1));
  viz2Html.innerHTML = null;
  viz2Html.appendChild(await render(viz2));
  window.dispatchEvent(new Event("resize"));
}