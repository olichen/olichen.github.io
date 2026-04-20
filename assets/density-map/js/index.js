import 'bootstrap/dist/css/bootstrap.min.css';
import 'leaflet/dist/leaflet.css';
import '../css/layout.css';
import '../css/toolbar.css';
import * as L from 'leaflet';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

const mapUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const mapAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
  + ' | &copy; <a href="https://carto.com/attributions">CARTO</a>';

const mapContainer = document.getElementById('map-container');
const toolbarPanel = document.getElementById('toolbarPanel');
const toolbar      = document.getElementById('toolbar');

const map = new L.Map('map', { center: [47.61, -122.33], zoom: 12 })
  .addLayer(L.tileLayer(mapUrl, { attribution: mapAttr, subdomains: 'abcd', minZoom: 8, maxZoom: 18 }));

// Settings button — toggles the toolbar panel
const settingsBtn = L.control({ position: 'topright' });
settingsBtn.onAdd = () => {
  const btn = L.DomUtil.create('a', 'leaflet-bar leaflet-control');
  btn.innerHTML = '⚙';
  btn.title = 'Settings';
  btn.href = '#';
  btn.style.cssText = 'cursor:pointer;font-size:1.2rem;width:30px;height:30px;display:flex;align-items:center;justify-content:center;';
  btn.onclick = (e) => {
    e.preventDefault();
    const opening = !toolbarPanel.classList.contains('open');
    toolbarPanel.classList.toggle('open');
    mapContainer.classList.toggle('toolbar-open', opening);
  };
  L.DomEvent.disableClickPropagation(btn);
  return btn;
};
settingsBtn.addTo(map);

mapContainer.classList.add('toolbar-open');

new ResizeObserver(([entry]) => {
  mapContainer.classList.remove('animate');
  mapContainer.style.setProperty('--toolbar-actual-height', entry.contentRect.height + 12 + 'px');
  setTimeout(() => mapContainer.classList.add('animate'), 0);
}).observe(toolbar);

const topoData = await d3.json('/assets/density-map/data/tract20.json');
const features = topojson.feature(topoData, topoData.objects.tract20).features;

function getDensity(f, year) {
  const p = f.properties;
  const area = p.ALANDMI ?? 0;
  return area > 0 ? (p[`POP${year}`] ?? 0) / area : 0;
}

// Color scales
const colorDensity = d3.scaleSequentialLog(d3.interpolateRgb('#ffffff', '#1a3a6b')).base(2)
  .domain([5000, 50000])
  .clamp(true);

const colorChange = (min, max) => d3.scaleDiverging(
  t => t < 0.5 ? d3.interpolateRgb('#d73027', '#ffffff')(t * 2)
               : d3.interpolateRgb('#ffffff', '#1a3a6b')((t - 0.5) * 2)
).domain([min, 0, max]).clamp(true);

// State
let currentMetricType = 'popDensity';
let baseYear = 2020;
let endYear = 2025;

function getPctChange(f, year, endYear) {
  const p = f.properties;
  const popYear = p[`POP${year}`] ?? 0;
  return popYear > 0 ? ((p[`POP${endYear}`] ?? 0) - popYear) / popYear * 100 : 0;
}

function makeChangeScale(year) {
  return colorChange(-20, 200);
}

function getNumChange(f, year, endYear) {
  return getDensity(f, endYear) - getDensity(f, year);
}

const colorNumChange = d3.scaleDivergingSymlog(
  t => t < 0.5 ? d3.interpolateRgb('#d73027', '#ffffff')(t * 2)
               : d3.interpolateRgb('#ffffff', '#1a3a6b')((t - 0.5) * 2)
).domain([-5000, 0, 50000]).constant(5000).clamp(true);

let currentChangeScale = makeChangeScale(baseYear);

function getFill(f) {
  if (currentMetricType === 'popDensity') { const d = getDensity(f, baseYear); return d > 0 ? colorDensity(d) : '#ccc'; }
  if (currentMetricType === 'pctChange')  return currentChangeScale(getPctChange(f, baseYear, endYear));
  if (currentMetricType === 'numChange')  return colorNumChange(getNumChange(f, baseYear, endYear));
  return '#ccc';
}

function getTooltipValue(f) {
  if (currentMetricType === 'popDensity') return `${d3.format(',.0f')(getDensity(f, baseYear))} per mi²`;
  if (currentMetricType === 'pctChange')  return `${d3.format('+.1f')(getPctChange(f, baseYear, endYear))}% (${baseYear}→${endYear})`;
  if (currentMetricType === 'numChange')  return `${d3.format('+,.0f')(getNumChange(f, baseYear, endYear))} per mi² (${baseYear}→${endYear})`;
  return '';
}

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

const leafletContainer = map.getContainer();

const tracts = g.selectAll('path')
  .data(features)
  .join('path')
  .attr('fill', f => getFill(f))
  .attr('fill-opacity', 0.75)
  .attr('stroke', '#fff')
  .attr('stroke-width', 0.4)
  .style('pointer-events', 'visiblePainted')
  .on('mouseover', function(event, f) {
    d3.select(this).attr('stroke', '#333').attr('stroke-width', 1.5);
    tooltip
      .html(`${f.properties.NAMELSAD ?? f.properties.NAME20}<br><span style="color:#888">${getTooltipValue(f)}</span>`)
      .style('display', 'block');
  })
  .on('mousemove', function(event) {
    const rect = leafletContainer.getBoundingClientRect();
    tooltip
      .style('left', (event.clientX - rect.left + 12) + 'px')
      .style('top',  (event.clientY - rect.top  - 28) + 'px');
  })
  .on('mouseout', function() {
    d3.select(this).attr('stroke', '#fff').attr('stroke-width', 0.4);
    tooltip.style('display', 'none');
  });

// Metric type dropdown (Population Density / Percent Change / Numerical Change)
const metricTypeTrigger = document.getElementById('metricTypeTrigger');
const metricTypePanel   = document.getElementById('metricTypePanel');
const metricTypeLabel   = document.getElementById('metricTypeLabel');

metricTypeTrigger.addEventListener('click', () => {
  metricTypeTrigger.classList.toggle('open');
  metricTypePanel.classList.toggle('open');
});

metricTypePanel.querySelectorAll('.svc-option').forEach(opt => {
  opt.addEventListener('click', () => {
    metricTypePanel.querySelectorAll('.svc-option').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    metricTypeLabel.textContent = opt.textContent;
    metricTypeTrigger.classList.remove('open');
    metricTypePanel.classList.remove('open');
    currentMetricType = opt.dataset.value;
    endYearInput.disabled = currentMetricType === 'popDensity';
    tracts.attr('fill', f => getFill(f));
  });
});

document.addEventListener('click', e => {
  if (!document.getElementById('metricTypeDropdown').contains(e.target)) {
    metricTypeTrigger.classList.remove('open');
    metricTypePanel.classList.remove('open');
  }
});


// Year sliders
const yearInput    = document.getElementById('yearInput');
const yearLabel    = document.getElementById('yearLabel');
const endYearInput = document.getElementById('endYearInput');
const endYearLabel = document.getElementById('endYearLabel');
endYearInput.disabled = true; // disabled by default (Population Density selected)

yearInput.addEventListener('input', () => {
  yearLabel.textContent = yearInput.value;
  baseYear = +yearInput.value;
  if (currentMetricType === 'pctChange') currentChangeScale = makeChangeScale(baseYear);
  tracts.attr('fill', f => getFill(f));
});

endYearInput.addEventListener('input', () => {
  endYearLabel.textContent = endYearInput.value;
  endYear = +endYearInput.value;
  if (currentMetricType === 'pctChange' || currentMetricType === 'numChange') {
    tracts.attr('fill', f => getFill(f));
  }
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
