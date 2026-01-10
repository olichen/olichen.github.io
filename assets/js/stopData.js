export class StopData {
  stops;
  activeRoutes;
  #riderData;
  #stopRiderData;

  constructor(stopData, riderData) {
    this.stops = stopData;
    this.activeRoutes = {};
    this.#riderData = riderData;
    this.#stopRiderData = {};

    // First map the stops to the object by id
    Object.values(this.stops).filter(d => d.stop_id).forEach(d => this.#stopRiderData[d.stop_id] = d);

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
      if (!(d.SERVICE_RTE_NUM in this.activeRoutes)) {
        this.activeRoutes[d.SERVICE_RTE_NUM] = true;
        if (parseInt(d.SERVICE_RTE_NUM) > 800) {
          this.activeRoutes[d.SERVICE_RTE_NUM] = false;
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

  static async createInstance() {
    const stopData = d3.csvParse(await this.getFileData("../data/stops.txt"), d3.autoType)
    const riderData = d3.csvParse(await this.getFileData("../data/ridership-spring-2024.csv"), d3.autoType);
    return new StopData(stopData, riderData);
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
      for (const dataId of Object.values(route)) {
        let routeBuses = 0
        for (const timeOfDay of Object.values(dataId)) {
          routeBuses += timeOfDay.OBSERVED_TRIPS_IDS;
        }
        numBuses = Math.max(routeBuses, numBuses);
      }
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
      if (!this.activeRoutes[routeId]) {
        continue;
      }
      for (const dataId of Object.values(route)) {
        for (const timeOfDay of Object.values(dataId)) {
          totalRiders += timeOfDay.AVG_TOTAL_BOARDINGS;
        }
      }
    }
    return totalRiders;
  }

  getUsageExtent() {
    return d3.extent(this.stops.map(d => this.getTotalRiders(d.stop_id)));
  }

  getStopUsage(stop_id) {
    return this.getTotalRiders(stop_id);
  }

  // Map RapidRide route names
  #routeNameMap = {
    671: "A",
    672: "B",
    673: "C",
    674: "D",
    675: "E",
    676: "F",
    678: "H"
  };
  getRouteName(route_id) {
    if (route_id in this.#routeNameMap) {
      return this.#routeNameMap[route_id];
    }
    return route_id;
  }
}
