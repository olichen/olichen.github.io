import * as d3 from "d3";
import { hexbin as d3Hexbin } from "d3-hexbin";
import { Metric } from "./mapOptions.js";

export class HeatmapDrawer {
  #map;
  #stopData;
  #mapOptions;
  #group;
  #bins;  // [{ nx, ny, contributions: [{stopId, weight}] }]
  #paths; // D3 selection of fixed <path> elements

  // Geographic hex radius in meters
  static #HEX_RADIUS_METERS = 200;

  // Gaussian blur sigma in meters
  static #GAUSSIAN_METERS = 200;

  // Fixed geographic anchor — the hexbin lattice is always relative to this point,
  // so bin centers stay geographically stable across zoom levels.
  static #ANCHOR_LAT = 47.0;
  static #ANCHOR_LON = -123.0;

  constructor(map, stopData, mapOptions) {
    this.#map = map;
    this.#stopData = stopData;
    this.#mapOptions = mapOptions;

    this.#initStops();
    this.#updatePositions();
    this.#updateColors();

    map.on("zoomend", () => this.#updatePositions());
  }

  // Convert the geographic radius to pixels using the map's current projection.
  #hexRadius() {
    const refA = this.#map.latLngToPoint(HeatmapDrawer.#ANCHOR_LAT, HeatmapDrawer.#ANCHOR_LON);
    const refB = this.#map.latLngToPoint(HeatmapDrawer.#ANCHOR_LAT, HeatmapDrawer.#ANCHOR_LON + 0.1);
    const refPixels = Math.sqrt((refA.x - refB.x) ** 2 + (refA.y - refB.y) ** 2);
    const refMeters = this.#map.getDistance(HeatmapDrawer.#ANCHOR_LAT, HeatmapDrawer.#ANCHOR_LON, HeatmapDrawer.#ANCHOR_LAT, HeatmapDrawer.#ANCHOR_LON + 0.1);
    return (refPixels / refMeters) * HeatmapDrawer.#HEX_RADIUS_METERS;
  }

  // Returns normalized Gaussian offsets (weights summing to 1) for a given sigma.
  // Computed once and reused for every stop.
  #gaussianOffsets(sigma) {
    const range = Math.ceil(2 * sigma);
    const step = sigma * 0.5;
    const offsets = [];
    let totalWeight = 0;

    for (let dx = -range; dx <= range; dx += step) {
      for (let dy = -range; dy <= range; dy += step) {
        const w = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
        offsets.push({ dx, dy, w });
        totalWeight += w;
      }
    }

    for (const o of offsets) o.w /= totalWeight;
    return offsets;
  }

  // Runs once: generates the hexbin grid and precomputes per-bin stop contributions.
  // Bin centers are stored normalized (in units of the reference radius) so they
  // can be rescaled to any zoom level in updateStops() without re-binning.
  #initStops() {
    this.#group = this.#map.createGroup();

    const radius = this.#hexRadius();
    const sigma = radius * HeatmapDrawer.#GAUSSIAN_METERS / HeatmapDrawer.#HEX_RADIUS_METERS;
    const anchor = this.#map.latLngToPoint(HeatmapDrawer.#ANCHOR_LAT, HeatmapDrawer.#ANCHOR_LON);

    const hexbinGenerator = d3Hexbin()
      .radius(radius)
      .x(d => d.x)
      .y(d => d.y);

    const offsets = this.#gaussianOffsets(sigma);

    const samples = [];
    for (const stop of this.#stopData.stops) {
      const point = this.#map.latLngToPoint(stop.stop_lat, stop.stop_lon);
      const relX = point.x - anchor.x;
      const relY = point.y - anchor.y;
      for (const { dx, dy, w } of offsets) {
        samples.push({ x: relX + dx, y: relY + dy, stopId: stop.stop_id, weight: w });
      }
    }

    const rawBins = hexbinGenerator(samples);

    // Aggregate normalized Gaussian weights per stop per bin
    this.#bins = rawBins.map(bin => {
      const stopWeights = {};
      for (const s of bin) {
        stopWeights[s.stopId] = (stopWeights[s.stopId] || 0) + s.weight;
      }
      return {
        nx: bin.x / radius,
        ny: bin.y / radius,
        contributions: Object.entries(stopWeights).map(([stopId, weight]) => ({ stopId, weight }))
      };
    });

    this.#paths = this.#group.selectAll("path")
      .data(this.#bins)
      .join("path")
      .attr("stroke", "white")
      .attr("stroke-width", 0.5)
      .attr("opacity", 0.7);
  }

  #updatePositions() {
    if (!this.#bins) return;
    const radius = this.#hexRadius();
    const anchor = this.#map.latLngToPoint(HeatmapDrawer.#ANCHOR_LAT, HeatmapDrawer.#ANCHOR_LON);
    this.#paths
      .attr("d", d3Hexbin().hexagon(radius))
      .attr("transform", d => `translate(${d.nx * radius + anchor.x}, ${d.ny * radius + anchor.y})`);
  }

  #updateColors() {
    if (!this.#bins) return;
    const metric = this.#mapOptions.metric;
    const getBinUsage = bin => d3.sum(bin.contributions, c =>
      c.weight * this.#stopData.getStopUsage(c.stopId, metric)
    );
    const usages = this.#bins.map(getBinUsage);
    const p99 = d3.quantile(usages.filter(v => v > 0).sort(d3.ascending), 0.99) || 1;
    const colorScale = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, p99]);
    this.#paths
      .attr("fill", (d, i) => colorScale(usages[i]))
      .attr("display", (d, i) => usages[i] < 0.01 ? "none" : null);
  }

  updateStops() {
    this.#updateColors();
  }

  highlightStops(stopIds) {
    // No per-stop highlight for heatmap
  }

  destroy() {
    this.#group.remove();
  }
}
