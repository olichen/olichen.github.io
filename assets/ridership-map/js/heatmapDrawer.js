import * as d3 from "d3";
import { Metric } from "./mapOptions.js";

export class HeatmapDrawer {
  #map;
  #stopData;
  #mapOptions;

  stopGroup;
  #circles;
  #legend;
  #zoom;
  #usageScale;

  constructor(map, stopData, mapOptions) {
    this.#map = map;
    this.#stopData = stopData;
    this.#mapOptions = mapOptions;

    this.#initStops();

    this.#zoom = 14;
    this.updateStops();

    map.on("zoomend", e => {
      this.#zoom = e.target.getZoom();
      this.updateStops()
    });
  }

  #initStops() {
    // TODO
  }

  highlightStops(stopIds) {
    // TODO
  }

  destroy() {
    // TODO
  }

  updateStops() {
    // TODO
  }
}
