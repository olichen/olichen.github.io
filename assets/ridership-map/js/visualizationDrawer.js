import { ScatterplotDrawer } from "./scatterplotDrawer.js";
import { HeatmapDrawer } from "./heatmapDrawer.js";
import { VizType } from "./toolbarOptions.js";

export class VisualizationDrawer {
  #map;
  #stopData;
  #toolbarOptions;
  #drawer;

  constructor(map, stopData, toolbarOptions) {
    this.#map = map;
    this.#stopData = stopData;
    this.#toolbarOptions = toolbarOptions;
    this.#drawer = this.#createDrawer();

    map.on("zoomend", e => this.#drawer.onZoom(e.target.getZoom()));
  }

  #createDrawer() {
    if (this.#toolbarOptions.vizType === VizType.Heatmap) {
      return new HeatmapDrawer(this.#map, this.#stopData, this.#toolbarOptions);
    }
    return new ScatterplotDrawer(this.#map, this.#stopData, this.#toolbarOptions);
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
