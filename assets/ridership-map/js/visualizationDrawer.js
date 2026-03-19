import { ScatterplotDrawer } from "./scatterplotDrawer.js";
import { HeatmapDrawer } from "./heatmapDrawer.js";
import { VizType } from "./mapOptions.js";

export class VisualizationDrawer {
  #map;
  #stopData;
  #mapOptions;
  #drawer;

  constructor(map, stopData, mapOptions) {
    this.#map = map;
    this.#stopData = stopData;
    this.#mapOptions = mapOptions;
    this.#drawer = this.#createDrawer();
  }

  #createDrawer() {
    if (this.#mapOptions.vizType === VizType.Heatmap) {
      return new HeatmapDrawer(this.#map, this.#stopData, this.#mapOptions);
    }
    return new ScatterplotDrawer(this.#map, this.#stopData, this.#mapOptions);
  }

  setVizType(vizType) {
    this.#drawer.destroy();
    this.#drawer = this.#createDrawer();
  }

  reload() {
    this.#drawer.destroy();
    this.#drawer = this.#createDrawer();
  }

  updateStops() {
    this.#drawer.updateStops();
  }

  highlightStops(stopIds) {
    this.#drawer.highlightStops(stopIds);
  }

  destroy() {
    this.#drawer.destroy();
  }
}
