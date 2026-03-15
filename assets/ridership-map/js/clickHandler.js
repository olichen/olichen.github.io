export class ClickHandler {
  #map;
  #stopData;
  #stopGroup;
  #clickCallback;

  #clickLatLon = { lat: 0, lon: 0 };
  #walkTime = 10;
  #clickCircle;
  #clickPoint;
  clickData;
  clickStops;

  constructor(map, stopData, stopGroup, clickCallback = null) {
    this.#map = map;
    this.#stopData = stopData;
    this.#stopGroup = stopGroup;
    this.#clickCallback = clickCallback ?? (() => null);

    const clickGroup = map.createGroup();
    this.#clickCircle = clickGroup.append("circle")
      .attr("stroke", "red")
      .attr("fill", "red")
      .attr("fill-opacity", 0.1);

    this.#clickPoint = clickGroup.append("circle")
      .attr("fill", "black")
      .attr("r", 3);

    this.placeClick();

    this.#map.on("click", (e) => {
      this.#clickLatLon.lat = e.latlng.lat;
      this.#clickLatLon.lon = e.latlng.lng;
      this.placeClick();
      this.setClickRadius();
      this.getStops();
      this.#clickCallback();
    });

    this.#map.on("zoomend", () => {
      this.placeClick();
      this.setClickRadius();
    });
  }

  setStopData(stopData, stopGroup) {
    this.#stopData = stopData;
    this.#stopGroup = stopGroup;
  }

  setWalkTime(walkTime) {
    this.#walkTime = walkTime;
    this.setClickRadius();
    this.getStops();
    this.#clickCallback();
  }

  setClickRadius() {
    // Calculate 600m (very roughly a 10 minute walk with a street grid) and set the radius
    const start = this.#map.latLngToPoint(47.62, -122.2893);
    const end = this.#map.latLngToPoint(47.62, -122.30);
    const radius = this.calculateDistance(start.x - end.x, start.y - end.y) * this.#walkTime * .75 / 10;
    this.#clickCircle
      .attr("r", radius);
  }

  placeClick() {
    const point = this.#map.latLngToPoint(this.#clickLatLon.lat, this.#clickLatLon.lon);
    this.#clickCircle.attr("cx", point.x).attr("cy", point.y);
    this.#clickPoint.attr("cx", point.x).attr("cy", point.y);
  }

  calculateDistance(deltaX, deltaY) {
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  }

  getStops() {
    this.clickData = {};
    this.clickStops = new Set();

    for (const stop of this.#stopData.stops) {
      const stopDistance = this.#map.getDistance(this.#clickLatLon.lat, this.#clickLatLon.lon, stop.stop_lat, stop.stop_lon)
      if (stopDistance < this.#walkTime * 600 / 10) {
        const additionalRiders = this.#stopData.getTotalRiders(stop.stop_id);
        if (additionalRiders > 0) {
          this.clickStops.add(stop.stop_id);
          for (const route_id of Object.keys(this.#stopData.getRoutes(stop.stop_id))) {
            if (!(route_id in this.clickData)) {
              this.clickData[route_id] = { numBuses: 0, riders: 0 };
            }
            this.clickData[route_id].numBuses = Math.max(this.#stopData.getNumBuses(stop.stop_id, route_id), this.clickData[route_id].numBuses);
            this.clickData[route_id].riders += this.#stopData.getTotalRiders(stop.stop_id, route_id);
          }
        }
      }
    }
    this.#stopGroup.selectAll("circle").data(this.#stopData.stops, d => d.stop_id)
      .attr("fill", d => this.clickStops.has(d.stop_id) ? "red" : "steelblue");
  }
}