export const Metric = {
  Total: "total",
  PerBus: "perBus"
};

export class MapOptions {
  #activeRoutes = {};
  #metric = Metric.Total;

  get metric() { return this.#metric; }
  setMetric(metric) { this.#metric = metric; }

  setRoute(routeNum, active) { this.#activeRoutes[routeNum] = active; }
  isRouteActive(routeNum) { return this.#activeRoutes[routeNum]; }
  hasRoute(routeNum) { return routeNum in this.#activeRoutes; }
  routeEntries() { return Object.entries(this.#activeRoutes); }
  routeKeys() { return Object.keys(this.#activeRoutes); }
}
