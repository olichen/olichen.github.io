import * as d3 from "d3";
import * as L from "leaflet";

export class LMap {
  #map;
  #topLeft;
  #bottomRight;

  constructor(element_id, panelHandler) {
    // map found here: https://leaflet-extras.github.io/leaflet-providers/preview/
    const mapUrl = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
    const mapAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
      + ' | &copy; <a href="https://carto.com/attributions">CARTO</a>'
      + ' | Data: <a href="https://kingcounty.gov/en/dept/metro">KCM</a>,'
      + ' <a href="https://seattletransitblog.com/">STB</a>';

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

    // Add a legend
    const legend = L.control({ position: 'bottomleft' });
    legend.onAdd = function(map) {
      const div = L.DomUtil.create('div', 'legend p-2 m-2 shadow-sm rounded');
      div.innerHTML = '<div class="d-flex flex-column align-items-center lh-1 mb-1"><b style="font-size:.85rem">Boardings</b></div>'
        + '<div class="d-flex justify-content-center"><svg id="legendSvg"></svg></div>';
      return div;
    }
    legend.addTo(this.#map);

    // Add a fullscreen button
    const container = document.getElementById(element_id).parentElement;
    const fullscreen = L.control({ position: 'bottomright' });
    fullscreen.onAdd = () => {
      const btn = L.DomUtil.create('a', 'leaflet-bar leaflet-control fullscreen-btn');
      btn.innerHTML = '⛶';
      btn.title = 'Toggle fullscreen';
      btn.href = '#';
      btn.onclick = (e) => {
        e.preventDefault();
        document.fullscreenElement ? document.exitFullscreen() : container.requestFullscreen();
      };
      document.addEventListener('fullscreenchange', () => {
        btn.innerHTML = document.fullscreenElement ? '✕' : '⛶';
        this.#map.invalidateSize();
      });
      L.DomEvent.disableClickPropagation(btn);
      return btn;
    };
    fullscreen.addTo(this.#map);

    // Keep Leaflet top controls flush with the bottom of the toolbar panel
    const toolbar = document.getElementById('toolbar');
    const mapContainer = document.getElementById('map-container');
    new ResizeObserver(([entry]) => {
      // Remove the animate, wait a tick for the height to actually update, then add it back to trigger the transition
      mapContainer.classList.remove('animate');
      mapContainer.style.setProperty('--toolbar-actual-height', entry.contentRect.height + 12 + 'px');
      setTimeout(() => mapContainer.classList.add('animate'), 0);
    }).observe(toolbar);

    // Add a settings button (topright, first = top)
    const settings = L.control({ position: 'topright' });
    settings.onAdd = () => {
      const btn = L.DomUtil.create('a', 'leaflet-bar leaflet-control settings-btn');
      btn.innerHTML = '⚙';
      btn.title = 'Settings';
      btn.href = '#';
      btn.onclick = (e) => { e.preventDefault(); panelHandler.toggleToolbar(); };
      L.DomEvent.disableClickPropagation(btn);
      return btn;
    };
    settings.addTo(this.#map);

    // Add a chart button (topright, second = below settings)
    const chart = L.control({ position: 'topright' });
    chart.onAdd = () => {
      const btn = L.DomUtil.create('a', 'leaflet-bar leaflet-control chart-btn');
      btn.innerHTML = '📊';
      btn.title = 'Chart';
      btn.href = '#';
      btn.onclick = (e) => { e.preventDefault(); panelHandler.toggleCharts(); };
      L.DomEvent.disableClickPropagation(btn);
      return btn;
    };
    chart.addTo(this.#map);
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
}
