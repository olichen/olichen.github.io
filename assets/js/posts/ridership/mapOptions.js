export const Metric = {
  Total: "total",
  PerBus: "perBus"
};

export const TimePeriod = {
  MorningPeak: "AM",
  Daytime: "MID",
  AfternoonPeak: "PM",
  Evening: "XEV",
  Night: "XNT"
};

export class MapOptions {
  #activeRoutes = {};
  #metric = Metric.Total;
  #timePeriods = new Set(Object.values(TimePeriod));

  get metric() { return this.#metric; }
  setMetric(metric) { this.#metric = metric; }

  get timePeriods() { return this.#timePeriods; }
  isTimePeriodActive(period) { return this.#timePeriods.has(period); }
  setTimePeriodActive(period, active) { active ? this.#timePeriods.add(period) : this.#timePeriods.delete(period); }

  setRoute(routeNum, active) { this.#activeRoutes[routeNum] = active; }
  isRouteActive(routeNum) { return this.#activeRoutes[routeNum]; }
  hasRoute(routeNum) { return routeNum in this.#activeRoutes; }
  routeEntries() { return Object.entries(this.#activeRoutes); }
  routeKeys() { return Object.keys(this.#activeRoutes); }
}
