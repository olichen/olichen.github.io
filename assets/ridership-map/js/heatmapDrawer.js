import * as d3 from "d3";
import { hexbin as d3Hexbin } from "d3-hexbin";

export class HeatmapDrawer {
  #map;
  #stopData;
  #mapOptions;
  #group;

  // Geographic hex radius in meters
  static #HEX_RADIUS_METERS = 150;

  // Fixed geographic anchor — the hexbin lattice is always relative to this point,
  // so bin centers stay geographically stable across zoom levels.
  static #ANCHOR_LAT = 47.0;
  static #ANCHOR_LON = -123.0;

  constructor(map, stopData, mapOptions) {
    this.#map = map;
    this.#stopData = stopData;
    this.#mapOptions = mapOptions;

    this.#initStops();
    this.updateStops();

    map.on("zoomend", () => this.updateStops());
  }

  #initStops() {
    this.#group = this.#map.createGroup();
  }

  // Convert the geographic radius to pixels using the map's current projection.
  // Projects two reference points a known distance apart and scales accordingly.
  #hexRadius() {
    const refA = this.#map.latLngToPoint(HeatmapDrawer.#ANCHOR_LAT, HeatmapDrawer.#ANCHOR_LON);
    const refB = this.#map.latLngToPoint(HeatmapDrawer.#ANCHOR_LAT, HeatmapDrawer.#ANCHOR_LON + 0.1);
    const refPixels = Math.sqrt((refA.x - refB.x) ** 2 + (refA.y - refB.y) ** 2);
    const refMeters = this.#map.getDistance(HeatmapDrawer.#ANCHOR_LAT, HeatmapDrawer.#ANCHOR_LON, HeatmapDrawer.#ANCHOR_LAT, HeatmapDrawer.#ANCHOR_LON + 0.1);
    return (refPixels / refMeters) * HeatmapDrawer.#HEX_RADIUS_METERS;
  }

  // Spread a stop's usage across a grid of nearby sample points weighted by a
  // 2D Gaussian, normalized so the total contributed usage equals the original.
  #gaussianSamples(cx, cy, usage, sigma) {
    const range = Math.ceil(2 * sigma);
    const step = sigma * 0.5;
    const samples = [];
    let totalWeight = 0;

    for (let dx = -range; dx <= range; dx += step) {
      for (let dy = -range; dy <= range; dy += step) {
        const w = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
        samples.push({ x: cx + dx, y: cy + dy, w });
        totalWeight += w;
      }
    }

    return samples.map(s => ({ x: s.x, y: s.y, usage: usage * s.w / totalWeight }));
  }

  updateStops() {
    const radius = this.#hexRadius();
    const sigma = radius * 1.2;

    // Project the anchor to pixels — all sample coordinates are expressed relative
    // to this so the hexbin lattice stays geographically fixed across zoom levels.
    const anchor = this.#map.latLngToPoint(HeatmapDrawer.#ANCHOR_LAT, HeatmapDrawer.#ANCHOR_LON);

    const hexbinGenerator = d3Hexbin()
      .radius(radius)
      .x(d => d.x)
      .y(d => d.y);

    const samples = [];
    for (const stop of this.#stopData.stops) {
      const point = this.#map.latLngToPoint(stop.stop_lat, stop.stop_lon);
      const usage = this.#stopData.getStopUsage(stop.stop_id, this.#mapOptions.metric);
      if (usage <= 0) continue;
      samples.push(...this.#gaussianSamples(point.x - anchor.x, point.y - anchor.y, usage, sigma));
    }

    const bins = hexbinGenerator(samples);

    const maxValue = d3.max(bins, bin => d3.sum(bin, d => d.usage)) || 1;
    const colorScale = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, maxValue / 2]);

    this.#group.selectAll("path")
      .data(bins)
      .join("path")
      .attr("d", hexbinGenerator.hexagon())
      .attr("transform", d => `translate(${d.x + anchor.x}, ${d.y + anchor.y})`)
      .attr("fill", d => colorScale(d3.sum(d, p => p.usage)))
      .attr("stroke", "white")
      .attr("stroke-width", 0.5)
      .attr("opacity", 0.7);
  }

  highlightStops(stopIds) {
    // No per-stop highlight for heatmap
  }

  destroy() {
    this.#group.remove();
  }
}
