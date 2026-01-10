// import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7";
// import * as L from "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.js";

export class LMap {
  #map;
  #topLeft;
  #bottomRight;
  #infobox;

  constructor(element_id) {
    // map found here: https://leaflet-extras.github.io/leaflet-providers/preview/
    const mapUrl = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
    const mapAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
      + ' | &copy; <a href="https://carto.com/attributions">CARTO</a>'
      + ' | Data: <a href="https://kingcounty.gov/en/dept/metro">KCM</a>,'
      + ' <a href="https://seattletransitblog.com/">STB</a>';

    console.log(element_id)
    this.#map = new L.Map(element_id, { center: [47.65, -122.3], zoom: 14 })
      .addLayer(L.tileLayer(mapUrl, { attribution: mapAttr, subdomains: "abcd", minZoom: 10, maxZoom: 18 }));

    // Topleft/bottomright stretch across King County
    this.#topLeft = this.#map.latLngToLayerPoint(new L.LatLng(48, -122.5));
    this.#bottomRight = this.#map.latLngToLayerPoint(new L.LatLng(47, -121));

    // Add an overlay for the map and create an svg on that overlay
    const overlay = d3.select(this.#map.getPanes().overlayPane);
    this.svg = overlay.append("svg")
      .attr("width", this.#bottomRight.x - this.#topLeft.x)
      .attr("height", this.#bottomRight.y - this.#topLeft.y)
      .style("left", this.#topLeft.x + "px")
      .style("top", this.#topLeft.y + "px");

    // Add an infobox
    this.#infobox = L.control({ position: 'topright' });
    this.#infobox.onAdd = () => this._div = L.DomUtil.create('div', 'infobox p-2 m-2 shadow-sm rounded');
    this.#infobox.update = (innerHTML) => {
      if (innerHTML) {
        this._div.innerHTML = innerHTML;
      } else {
        this._div.innerHTML = "Mouse over a bus stop or click a location on the map to see more information";
      }
    }
    this.#infobox.addTo(this.#map);
    this.#infobox.update();

    // Add a legend
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = function(map) {
      const div = L.DomUtil.create('div', 'legend p-2 m-2 shadow-sm rounded');
      div.innerHTML = '<div class="d-flex flex-column align-items-center lh-1 mb-1"><b style="font-size:.85rem">Boardings</b><i>(Per Day)</i></div>'
        + '<div class="d-flex justify-content-center"><svg id="legendSvg"></svg></div>';
      return div;
    }
    legend.addTo(this.#map);
  }

  createGroup() {
    return this.svg.insert("g", ":first-child")
      .attr("class", "leaflet-zoom-hide")
      .attr("transform", "translate(" + -this.#topLeft.x + "," + -this.#topLeft.y + ")");
  }

  latLngToPoint(lat, lon) {
    return this.#map.latLngToLayerPoint(new L.LatLng(lat, lon));
  }

  getDistance(lat1, lon1, lat2, lon2) {
    return this.#map.distance(new L.LatLng(lat1, lon1), new L.LatLng(lat2, lon2));
  }

  on(event, func) {
    return this.#map.on(event, func);
  }

  #infoboxText;
  setInfobox(innerHTML) {
    this.#infoboxText = innerHTML;
    this.#infobox.update(this.#infoboxText);
  }

  overlayInfobox(innerHTML) {
    if (innerHTML) {
      this.#infobox.update(innerHTML);
    } else {
      this.#infobox.update(this.#infoboxText);
    }
  }
}
