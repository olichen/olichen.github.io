import * as d3 from "d3";
import { Metric } from "./toolbarOptions.js";

export class ScatterplotDrawer {
  #map;
  #stopData;
  #toolbarOptions;

  stopGroup;
  #circles;
  #legend;
  #zoom;
  #usageScale;

  constructor(map, stopData, toolbarOptions) {
    this.#map = map;
    this.#stopData = stopData;
    this.#toolbarOptions = toolbarOptions;

    this.#initStops();

    this.#zoom = 14;
    this.updateStops();
  }

  #initStops() {
    const stopData = this.#stopData;
    const toolbarOptions = this.#toolbarOptions;

    const mapContainer = this.#map.getContainer();
    const tooltip = d3.select(mapContainer)
      .append("div")
      .attr("class", "stop-tooltip")
      .style("display", "none");

    this.stopGroup = this.#map.createGroup();
    this.#circles = this.stopGroup.selectAll("circle").data(stopData.stops, d => d.stop_id).join("circle")
      .attr("fill", "steelblue")
      .attr("opacity", 0.7)
      .on("mouseover", function(event, d) {
        d3.select(this).attr("stroke", "black");
        const metric = toolbarOptions.metric;
        const usage = stopData.getStopUsage(d.stop_id, metric);
        const usageStr = metric === Metric.PerBus ? usage.toFixed(1) + " riders per bus" : Math.round(usage) + " riders per day";
        tooltip.html(`${d.stop_name}<br><span style="color:#888">${usageStr}</span>`).style("display", "block");
      })
      .on("mousemove", function(event) {
        const rect = mapContainer.getBoundingClientRect();
        tooltip
          .style("left", (event.clientX - rect.left + 12) + "px")
          .style("top", (event.clientY - rect.top - 28) + "px");
      })
      .on("mouseout", function(event, d) {
        d3.select(this).attr("stroke", null);
        tooltip.style("display", "none");
      });
  }

  destroy() {
    this.stopGroup.remove();
  }

  highlightStops(stopIds) {
    this.#circles
      .attr("fill", d => stopIds.has(d.stop_id) ? "red" : "steelblue");
  }

  onZoom(zoom) {
    this.#zoom = zoom;
    this.updateStops();
  }

  updateStops() {
    this.#updateStopRadius();
    this.#circles
      .attr("cx", d => this.#getStopCx(d))
      .attr("cy", d => this.#getStopCy(d));
  }

  #updateStopRadius() {
    // Update the usage scale
    const usageExtent = this.#stopData.getUsageExtent(this.#toolbarOptions.metric);
    const maxUsage = Math.max(0.1, usageExtent[1]);
    const minRadius = 1 + (this.#zoom - 10) / 4;
    const maxRadius = (this.#zoom - 10) * 3 + 8;
    this.#usageScale = d3.scaleSqrt().domain([0, maxUsage]).range([minRadius, maxRadius]);

    // Update stop radius
    this.#circles.attr("r", d => this.#getStopRadius(d));

    // Update the legend
    const metric = this.#toolbarOptions.metric;
    let count = maxUsage / 81;
    let legendData = [];
    let offset = 0;
    for (let i = 0; i < 5; i++) {
      const radius = this.#usageScale(count);
      legendData.push({ count, r: radius, offset, i });
      count = count * 3;
      offset += Math.max(Math.ceil(radius * 2) + 4, 20);
    }
    this.#drawLegend(legendData, metric);
  }

  #getStopRadius(d) {
    const usage = this.#stopData.getStopUsage(d.stop_id, this.#toolbarOptions.metric);
    if (this.#toolbarOptions.metric === Metric.Total && usage < 0.05) return 0;
    if (this.#toolbarOptions.metric === Metric.PerBus && usage < 0.01) return 0;
    return this.#usageScale(usage);
  }

  #getStopCx(d) {
    const point = this.#map.latLngToPoint(d.stop_lat, d.stop_lon);
    return point.x;
  }

  #getStopCy(d) {
    const point = this.#map.latLngToPoint(d.stop_lat, d.stop_lon);
    return point.y;
  }

  #drawLegend(legendData, metric) {
    const formatCount = metric === Metric.PerBus
      ? d => d.count.toFixed(1)
      : d => Math.round(d.count);
    const maxRadius = legendData[legendData.length - 1].r;
    const totalHeight = legendData[legendData.length - 1].offset + Math.max(maxRadius * 2, 16) + 4;
    const width = maxRadius * 2 + 35;
    this.#legend = d3.select(document.getElementById("legendSvg"));
    this.#legend
      .attr("height", totalHeight)
      .attr("width", width)
      .selectAll("svg").data(legendData).join(
        enter => {
          const legendEntry = enter.append("svg")
            .attr("height", d => Math.max(d.r * 2 + 4, 20))
            .attr("width", width)
            .attr("y", d => d.offset);
          legendEntry.append("circle")
            .attr("fill", "steelblue")
            .attr("opacity", 0.7)
            .attr("cx", maxRadius + "px")
            .attr("cy", d => Math.max(d.r + 2, 8) + "px")
            .attr("r", d => d.r);
          legendEntry.append("text")
            .attr("text-anchor", "end")
            .attr("x", maxRadius * 2 + 35)
            .attr("y", d => Math.max(d.r + 2, 8) + 4)
            .text(d => formatCount(d));
        },
        update => {
          update
            .attr("height", d => Math.max(d.r * 2 + 4, 20))
            .attr("width", width)
            .attr("y", d => d.offset);
          update.select("circle")
            .attr("cx", maxRadius + "px")
            .attr("cy", d => Math.max(d.r + 2, 8) + "px")
            .attr("r", d => d.r);
          update.select("text")
            .attr("x", maxRadius * 2 + 35)
            .attr("y", d => Math.max(d.r + 2, 8) + 4)
            .text(d => formatCount(d));
        },
        exit => exit.remove()
      );
  }
}
