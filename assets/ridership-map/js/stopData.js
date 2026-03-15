import * as d3 from "d3";
import { Metric, RidershipType } from "./mapOptions.js";

export class StopData {
  #stops;
  #mapOptions;
  #riderData;
  #stopRiderData;

  get stops() { return this.#stops; }

  constructor(stopData, riderData, mapOptions) {
    this.#stops = stopData;
    this.#mapOptions = mapOptions;
    this.#riderData = riderData;
    this.#stopRiderData = {};

    // First map the stops to the object by id
    Object.values(this.#stops).filter(d => d.stop_id).forEach(d => this.#stopRiderData[d.stop_id] = d);

    // Next iterate through rider data and map it to a dictionary
    // Nested by: stop_id => route_id => data_id => time_of_day
    for (const d of Object.values(this.#riderData).filter(d => d.STOP_ID in this.#stopRiderData)) {
      const stop = this.#stopRiderData[d.STOP_ID];
      if (!('routes' in stop)) {
        stop['routes'] = {};
      }
      const routes = stop['routes'];
      if (!(d.SERVICE_RTE_NUM in routes)) {
        routes[d.SERVICE_RTE_NUM] = {};
      }
      if (!this.#mapOptions.hasRoute(d.SERVICE_RTE_NUM)) {
        this.#mapOptions.setRoute(d.SERVICE_RTE_NUM, true);
        if (parseInt(d.SERVICE_RTE_NUM) > 800) {
          this.#mapOptions.setRoute(d.SERVICE_RTE_NUM, false);
        }
      }
      const curRoute = routes[d.SERVICE_RTE_NUM];
      // Use the sequence number plus inbound/outbound as a unique identifier
      const dataId = `${d.STOP_SEQUENCE_NUM}${d.INBD_OUTBD_CD}`;
      if (!(dataId in curRoute)) {
        curRoute[dataId] = {};
      }
      curRoute[dataId][d.DAY_PART_CD] = d;
    }
  }

  static async createInstance(mapOptions) {
    const dataFolder = `/assets/ridership-map/data/${mapOptions.dataset}`;
    const stopData = d3.csvParse(await this.getFileData(`${dataFolder}/stops.txt`), d3.autoType)
    const riderData = d3.csvParse(await this.getFileData(`${dataFolder}/stopdata.csv`), d3.autoType);
    return new StopData(stopData, riderData, mapOptions);
  }

  static async getFileData(fileName) {
    const data = await fetch(fileName);
    return await data.text();
  }

  getRidersPerBus(stop_id) {
    return this.getTotalRiders(stop_id) / this.getNumBuses(stop_id);
  }

  getStop(stop_id) {
    if (!(stop_id in this.#stopRiderData)) return null;
    return this.#stopRiderData[stop_id];
  }

  getRoutes(stop_id) {
    if (!(stop_id in this.#stopRiderData)) return null;
    const d = this.#stopRiderData[stop_id];
    return d.routes || {};
  }

  getNumBuses(stop_id, route_id = null) {
    const routes = this.getRoutes(stop_id);
    let numBuses = 0;
    for (const [routeId, route] of Object.entries(routes)) {
      if (route_id && routeId !== route_id) {
        continue;
      }
      if (!this.#mapOptions.isRouteActive(routeId)) {
        continue;
      }
      for (const dataId of Object.values(route)) {
        for (const [period, timeOfDay] of Object.entries(dataId)) {
          if (!this.#mapOptions.isTimePeriodActive(period)) continue;
          numBuses += timeOfDay.OBSERVED_TRIPS_IDS;
        }
      }
    }
    if (numBuses === 0) {
      numBuses = 1; // Avoid division by zero for stops with riders but no observed buses (e.g. due to data issues)
    }
    return numBuses;
  }

  getTotalRiders(stop_id, route_id = null) {
    const routes = this.getRoutes(stop_id);
    let totalRiders = 0;
    for (const [routeId, route] of Object.entries(routes)) {
      if (route_id && routeId !== route_id) {
        continue;
      }
      if (!this.#mapOptions.isRouteActive(routeId)) {
        continue;
      }
      for (const dataId of Object.values(route)) {
        for (const [period, timeOfDay] of Object.entries(dataId)) {
          if (!this.#mapOptions.isTimePeriodActive(period)) continue;
          if (this.#mapOptions.isRidershipTypeActive(RidershipType.Boardings)) totalRiders += timeOfDay.AVG_TOTAL_BOARDINGS;
          if (this.#mapOptions.isRidershipTypeActive(RidershipType.Alightings)) totalRiders += timeOfDay.AVG_TOTAL_ALIGHTINGS;
        }
      }
    }
    return totalRiders;
  }

  getUsageExtent(metric) {
    return d3.extent(this.#stops.map(d => this.getStopUsage(d.stop_id, metric)));
  }

  getStopUsage(stop_id, metric) {
    return metric === Metric.PerBus ? this.getRidersPerBus(stop_id) : this.getTotalRiders(stop_id);
  }

  // Map RapidRide route names
  #routeNameMap = {
    671: "A Line",
    672: "B Line",
    673: "C Line",
    674: "D Line",
    675: "E Line",
    676: "F Line",
    677: "G Line",
    678: "H Line"
  };
  getCompassDir(stop_id) {
    const routes = this.getRoutes(stop_id);
    for (const route of Object.values(routes)) {
      for (const dataId of Object.values(route)) {
        for (const record of Object.values(dataId)) {
          return record.TRIP_COMPASS_DIR_CD;
        }
      }
    }
    return null;
  }

  getRouteName(route_id) {
    if (route_id in this.#routeNameMap) {
      return this.#routeNameMap[route_id];
    }
    return route_id;
  }
}
