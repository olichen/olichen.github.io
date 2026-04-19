import 'leaflet/dist/leaflet.css';
import '../css/layout.css';
import * as L from 'leaflet';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

const mapUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const mapAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
  + ' | &copy; <a href="https://carto.com/attributions">CARTO</a>';

const map = new L.Map('map', { center: [47.61, -122.33], zoom: 12 })
  .addLayer(L.tileLayer(mapUrl, { attribution: mapAttr, subdomains: 'abcd', minZoom: 8, maxZoom: 18 }));

const topoData = await d3.json('/assets/density-map/data/tract20.json');
const features = topojson.feature(topoData, topoData.objects.tract20).features;

// POP2025 and ALANDMI (mi²) are already embedded in the TopoJSON properties
for (const f of features) {
  const pop  = f.properties.POP2025  ?? 0;
  const area = f.properties.ALANDMI  ?? 0;
  f.properties.density = area > 0 ? pop / area : 0;
}

// Log scale — density spans several orders of magnitude across WA state
const densities = features.map(f => f.properties.density).filter(d => d > 0);
const color = d3.scaleSequentialLog(d3.interpolateRgb('#ffffcc', '#1a3a6b')).base(2)
  .domain([5000, 50000])
  .clamp(true);

// SVG overlay
const svg = d3.select(map.getPanes().overlayPane).append('svg');
const g   = svg.append('g').attr('class', 'leaflet-zoom-hide');

const projection = d3.geoTransform({
  point(lon, lat) {
    const p = map.latLngToLayerPoint(new L.LatLng(lat, lon));
    this.stream.point(p.x, p.y);
  }
});
const path = d3.geoPath(projection);

const tooltip = d3.select(map.getContainer())
  .append('div')
  .attr('class', 'tract-tooltip')
  .style('display', 'none');

const fmt = d3.format(',.0f');
const mapContainer = map.getContainer();

const tracts = g.selectAll('path')
  .data(features)
  .join('path')
  .attr('fill', f => f.properties.density > 0 ? color(f.properties.density) : '#ccc')
  .attr('fill-opacity', 0.75)
  .attr('stroke', '#fff')
  .attr('stroke-width', 0.4)
  .style('pointer-events', 'visiblePainted')
  .on('mouseover', function(event, f) {
    d3.select(this).attr('stroke', '#333').attr('stroke-width', 1.5);
    const density = f.properties.density;
    const p = f.properties;
    tooltip
      .html(`${p.NAMELSAD ?? p.NAME20}<br><span style="color:#888">${fmt(density)} per mi²</span>`)
      .style('display', 'block');
  })
  .on('mousemove', function(event) {
    const rect = mapContainer.getBoundingClientRect();
    tooltip
      .style('left', (event.clientX - rect.left + 12) + 'px')
      .style('top',  (event.clientY - rect.top  - 28) + 'px');
  })
  .on('mouseout', function() {
    d3.select(this).attr('stroke', '#fff').attr('stroke-width', 0.4);
    tooltip.style('display', 'none');
  });

function refit() {
  const topLeft     = map.latLngToLayerPoint(map.getBounds().getNorthWest());
  const bottomRight = map.latLngToLayerPoint(map.getBounds().getSouthEast());
  svg
    .attr('width',  bottomRight.x - topLeft.x)
    .attr('height', bottomRight.y - topLeft.y)
    .style('left',  topLeft.x + 'px')
    .style('top',   topLeft.y + 'px');
  g.attr('transform', `translate(${-topLeft.x},${-topLeft.y})`);
  tracts.attr('d', path);
}

map.on('zoomend moveend', refit);
refit();
