import * as d3 from "d3";
import { Metric, RidershipType } from "./toolbarOptions.js";

export class StopData {
  #stops;
  #toolbarOptions;
  #riderData;
  #stopRiderData;

  get stops() { return this.#stops; }

  constructor(stopData, riderData, toolbarOptions) {
    this.#toolbarOptions = toolbarOptions;
    this.#init(stopData, riderData);
  }

  #init(stopData, riderData) {
    this.#stops = stopData;
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
      if (!this.#toolbarOptions.hasRoute(d.SERVICE_RTE_NUM)) {
        this.#toolbarOptions.setRoute(d.SERVICE_RTE_NUM, false);
      }

      // Default: show routes whose peak midday stop sees 5+ observed trips
      if (d.DAY_PART_CD === 'MID' && d.OBSERVED_TRIPS_IDS >= 11) {
        this.#toolbarOptions.setRoute(d.SERVICE_RTE_NUM, true);
      }

      // Use the sequence number plus inbound/outbound as a unique identifier
      const dataId = `${d.STOP_SEQUENCE_NUM}${d.INBD_OUTBD_CD}`;
      const curRoute = routes[d.SERVICE_RTE_NUM];
      if (!(dataId in curRoute)) {
        curRoute[dataId] = {};
      }
      curRoute[dataId][d.DAY_PART_CD] = d;
    }
  }

  static async createInstance(toolbarOptions) {
    const dataFolder = `/assets/ridership-map/data/${toolbarOptions.dataset}`;
    const stopData = d3.csvParse(await this.getFileData(`${dataFolder}/stops.txt`), d3.autoType)
    const riderData = d3.csvParse(await this.getFileData(`${dataFolder}/stopdata.csv`), d3.autoType);
    return new StopData(stopData, riderData, toolbarOptions);
  }

  async reload() {
    const dataFolder = `/assets/ridership-map/data/${this.#toolbarOptions.dataset}`;
    const stopData = d3.csvParse(await StopData.getFileData(`${dataFolder}/stops.txt`), d3.autoType);
    const riderData = d3.csvParse(await StopData.getFileData(`${dataFolder}/stopdata.csv`), d3.autoType);
    this.#init(stopData, riderData);
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
      if (!this.#toolbarOptions.isRouteActive(routeId)) {
        continue;
      }
      for (const dataId of Object.values(route)) {
        for (const [period, timeOfDay] of Object.entries(dataId)) {
          if (!this.#toolbarOptions.isTimePeriodActive(period)) continue;
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
      if (!this.#toolbarOptions.isRouteActive(routeId)) {
        continue;
      }
      for (const dataId of Object.values(route)) {
        for (const [period, timeOfDay] of Object.entries(dataId)) {
          if (!this.#toolbarOptions.isTimePeriodActive(period)) continue;
          if (this.#toolbarOptions.isRidershipTypeActive(RidershipType.Boardings)) totalRiders += timeOfDay.AVG_TOTAL_BOARDINGS;
          if (this.#toolbarOptions.isRidershipTypeActive(RidershipType.Alightings)) totalRiders += timeOfDay.AVG_TOTAL_ALIGHTINGS;
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
    671: "A",
    672: "B",
    673: "C",
    674: "D",
    675: "E",
    676: "F",
    677: "G",
    678: "H"
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
