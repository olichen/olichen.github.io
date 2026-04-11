export class ClickHandler {
  #map;
  #stopData;
  #vizDrawer;
  #chartsHandler;

  #toolbarOptions;
  #clickCircle;
  #clickPoint;
  clickData;
  clickStops;

  #onUpdate;

  constructor(map, stopData, vizDrawer, chartsHandler, toolbarOptions, onUpdate) {
    this.#map = map;
    this.#stopData = stopData;
    this.#vizDrawer = vizDrawer;
    this.#chartsHandler = chartsHandler;
    this.#toolbarOptions = toolbarOptions;
    this.#onUpdate = onUpdate;

    const clickGroup = map.createGroup();
    this.#clickCircle = clickGroup.append("circle")
      .attr("stroke", "red")
      .attr("fill", "red")
      .attr("fill-opacity", 0.1)
      .style("pointer-events", "none");

    this.#clickPoint = clickGroup.append("circle")
      .attr("fill", "black")
      .attr("r", 3)
      .style("pointer-events", "none");

    this.placeClick();

    this.#map.on("click", (e) => {
      this.#toolbarOptions.setClickLatLon(e.latlng.lat, e.latlng.lng);
      this.placeClick();
      this.setClickRadius();
      this.getStops();
      this.#onUpdate?.();
    });

    this.#map.on("zoomend", () => {
      this.placeClick();
      this.setClickRadius();
    });
  }


  setClickRadius() {
    // Calculate pixel-per-meter scale using a ~800m reference segment, then scale to distance
    const start = this.#map.latLngToPoint(47.62, -122.2893);
    const end = this.#map.latLngToPoint(47.62, -122.30);
    const radius = this.calculateDistance(start.x - end.x, start.y - end.y) * this.#toolbarOptions.distance / 800;
    this.#clickCircle
      .attr("r", radius);
  }

  placeClick() {
    const point = this.#map.latLngToPoint(this.#toolbarOptions.clickLatLon.lat, this.#toolbarOptions.clickLatLon.lon);
    this.#clickCircle.attr("cx", point.x).attr("cy", point.y);
    this.#clickPoint.attr("cx", point.x).attr("cy", point.y);
  }

  calculateDistance(deltaX, deltaY) {
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  }

  reset() {
    this.#toolbarOptions.setClickLatLon(0, 0);
    this.placeClick();
    this.getStops();
    this.#onUpdate?.();
  }

  getStops() {
    this.clickData = {};
    this.clickStops = new Set();

    for (const stop of this.#stopData.stops) {
      const stopDistance = this.#map.getDistance(this.#toolbarOptions.clickLatLon.lat, this.#toolbarOptions.clickLatLon.lon, stop.stop_lat, stop.stop_lon)
      if (stopDistance < this.#toolbarOptions.distance) {
        const additionalRiders = this.#stopData.getTotalRiders(stop.stop_id);
        if (additionalRiders > 0) {
          this.clickStops.add(stop.stop_id);
          for (const route_id of Object.keys(this.#stopData.getRoutes(stop.stop_id))) {
            if (!(route_id in this.clickData)) {
              this.clickData[route_id] = { numBuses: 0, riders: 0 };
            }
            this.clickData[route_id].numBuses += this.#stopData.getNumBuses(stop.stop_id, route_id);
            this.clickData[route_id].riders += this.#stopData.getTotalRiders(stop.stop_id, route_id);
          }
        }
      }
    }
    this.#vizDrawer.highlightStops(this.clickStops);
    this.#chartsHandler.update(this.clickStops);
  }
}