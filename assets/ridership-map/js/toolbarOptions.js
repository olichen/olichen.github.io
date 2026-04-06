export const VizType = {
  Scatterplot: "scatterplot",
  Heatmap: "heatmap"
};

export const Dataset = {
  Spring2024: "24-spring",
  Fall2024: "24-fall"
};

export const Metric = {
  Total: "total",
  PerBus: "perBus"
};

export const RidershipType = {
  Boardings: "boardings",
  Alightings: "alightings"
};

export const TimePeriod = {
  MorningPeak: "AM",
  Daytime: "MID",
  AfternoonPeak: "PM",
  Evening: "XEV",
  Night: "XNT"
};

export class ToolbarOptions {
  #activeRoutes = {};
  #metric = Metric.Total;
  #timePeriods = new Set(Object.values(TimePeriod));
  #ridershipTypes = new Set([RidershipType.Boardings]);
  #dataset = Dataset.Fall2024;
  #vizType = VizType.Scatterplot;

  get dataset() { return this.#dataset; }
  setDataset(dataset) { this.#dataset = dataset; }

  get vizType() { return this.#vizType; }
  setVizType(vizType) { this.#vizType = vizType; }

  get metric() { return this.#metric; }
  setMetric(metric) { this.#metric = metric; }

  get timePeriods() { return this.#timePeriods; }
  isTimePeriodActive(period) { return this.#timePeriods.has(period); }
  setTimePeriodActive(period, active) { active ? this.#timePeriods.add(period) : this.#timePeriods.delete(period); }

  get ridershipTypes() { return this.#ridershipTypes; }
  isRidershipTypeActive(type) { return this.#ridershipTypes.has(type); }
  setRidershipTypeActive(type, active) { active ? this.#ridershipTypes.add(type) : this.#ridershipTypes.delete(type); }

  clearRoutes() { this.#activeRoutes = {}; }
  setRoute(routeNum, active) { this.#activeRoutes[routeNum] = active; }
  isRouteActive(routeNum) { return this.#activeRoutes[routeNum]; }
  hasRoute(routeNum) { return routeNum in this.#activeRoutes; }
  routeEntries() { return Object.entries(this.#activeRoutes); }
  routeKeys() { return Object.keys(this.#activeRoutes); }
}
