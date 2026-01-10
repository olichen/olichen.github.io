export class StopHandler {
  #map;
  #stopData;

  stopGroup;
  #circles;
  #legend;
  #zoom;
  #usageScale;

  constructor(map, stopData) {
    this.#map = map;
    this.#stopData = stopData;

    this.createStops();

    this.#zoom = 14;
    this.updateStops();

    map.on("zoomend", e => {
      this.#zoom = e.target.getZoom();
      this.updateStops()
    });
  }

  createStops() {
    const map = this.#map;
    const stopData = this.#stopData;

    this.stopGroup = this.#map.createGroup();
    this.#circles = this.stopGroup.selectAll("circle").data(stopData.stops, d => d.stop_id).join("circle")
      .attr("fill", "steelblue")
      .attr("opacity", 0.7)
      .on("mouseover", function(event, d) { 
        let riderCount = stopData.getTotalRiders(d.stop_id);
        riderCount = riderCount < 10 ? Math.round(riderCount * 10) / 10 : Math.round(riderCount);
        const routes = stopData.getRoutes(d.stop_id);
        const routeCount = Object.keys(routes).length;
        let overlayText = `<div>`
          + `<div><b>${d.stop_name}</b></div>`
          + `<div>- Every day, <b>${riderCount}</b> people board at this stop</div>`
          + `<div>- <b>${routeCount}</b> ${routeCount > 1 ? "different routes serve" : "route serves"} this stop</div>`
          + `<div class="infobox-sm">Routes (daily boardings): `;
        for (const [routeId, data] of Object.entries(routes)) {
          let routeRiders = stopData.getTotalRiders(d.stop_id, routeId);
          if (routeRiders === 0) continue;
          routeRiders = routeRiders < 10 ? Math.round(routeRiders * 10) / 10 : Math.round(routeRiders);
          overlayText += `<b>${stopData.getRouteName(routeId)}</b>`
            + ` (${routeRiders}), `
        }
        overlayText = overlayText.slice(0, -2);
        overlayText += `</div>`;
        map.overlayInfobox(overlayText);
        d3.select(this).attr("stroke", "black")
      })
      .on("mouseout", function(event, d) {
        map.overlayInfobox(null);
        d3.select(this).attr("stroke", null)
      });
  }

  updateStops() {
    this.updateStopRadius();
    this.#circles
      .attr("cx", d => this.getStopCx(d))
      .attr("cy", d => this.getStopCy(d));
  }

  updateStopRadius() {
    // First update the usage scale
    const usageExtent = this.#stopData.getUsageExtent();
    const maxUsage = Math.max(0.1, usageExtent[1]);
    const minRadius = 1 + (this.#zoom - 10) / 4;
    const maxRadius = (this.#zoom - 10) * 3 + 8;
    this.#usageScale = d3.scaleSqrt().domain([0, maxUsage]).range([minRadius, maxRadius]);

    // Update stop radius
    this.#circles
      .attr("r", d => this.getStopRadius(d));

    // Update the legend
    let count = Math.floor(maxUsage / 81)
    let legendData = [];
    let offset = 0;
    for (let i = 0; i < 5; i++) {
      const radius = this.#usageScale(count);
      legendData.push({
        count: count,
        r: radius,
        offset: offset,
        i: i
      });
      count = count * 3;
      offset += Math.max(Math.ceil(radius * 2) + 4, 20);
    }
    this.drawLegend(legendData);
  }

  getStopRadius(d) {
    const usage = this.#stopData.getStopUsage(d.stop_id);
    if (usage < 0.05) return 0;
    return this.#usageScale(usage);
  }

  getStopCx(d) {
    const point = this.#map.latLngToPoint(d.stop_lat, d.stop_lon);
    return point.x;
  }

  getStopCy(d) {
    const point = this.#map.latLngToPoint(d.stop_lat, d.stop_lon);
    return point.y;
  }

  drawLegend(legendData) {
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
            .text(d => d.count);
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
            .text(d => d.count);
        },
        exit => exit.remove()
      );
  }
}
