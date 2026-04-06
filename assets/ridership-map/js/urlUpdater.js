import { TimePeriod, RidershipType } from "./toolbarOptions.js";

export class UrlUpdater {
  #mapOptions;
  #toolbarOptions;

  constructor(mapOptions, toolbarOptions) {
    this.#mapOptions = mapOptions;
    this.#toolbarOptions = toolbarOptions;
  }

  update() {
    const p = new URLSearchParams();
    const t = this.#toolbarOptions;

    p.set('lat', this.#mapOptions.center.lat.toFixed(4));
    p.set('lon', this.#mapOptions.center.lon.toFixed(4));
    p.set('zoom', this.#mapOptions.zoom);

    p.set('metric', t.metric);
    p.set('dataset', t.dataset);
    p.set('viz', t.vizType);

    const allPeriods = Object.values(TimePeriod);
    p.set('periods', allPeriods.filter(period => t.isTimePeriodActive(period)).join('-'));

    const allTypes = Object.values(RidershipType);
    p.set('types', allTypes.filter(type => t.isRidershipTypeActive(type)).join('-'));

    p.set('walkTime', t.walkTime);

    const { lat, lon } = t.clickLatLon;
    p.set('clickLat', lat.toFixed(4));
    p.set('clickLon', lon.toFixed(4));

    const routeKeys = [...t.routeKeys()].sort();
    let mask = 0n;
    routeKeys.forEach((r, i) => { if (t.isRouteActive(r)) mask |= (1n << BigInt(i)); });
    p.set('routes', mask.toString(16));

    history.replaceState(null, '', '?' + p.toString());
  }

  applyFromUrl() {
    const p = new URLSearchParams(location.search);
    const t = this.#toolbarOptions;

    if (p.has('lat') && p.has('lon'))
      this.#mapOptions.setCenter(parseFloat(p.get('lat')), parseFloat(p.get('lon')));
    if (p.has('zoom'))
      this.#mapOptions.setZoom(parseInt(p.get('zoom')));
    if (p.has('metric')) t.setMetric(p.get('metric'));
    if (p.has('dataset')) t.setDataset(p.get('dataset'));
    if (p.has('viz')) t.setVizType(p.get('viz'));
    if (p.has('periods')) {
      const active = new Set(p.get('periods').split('-'));
      for (const period of Object.values(TimePeriod))
        t.setTimePeriodActive(period, active.has(period));
    }
    if (p.has('types')) {
      const active = new Set(p.get('types').split('-'));
      for (const type of Object.values(RidershipType))
        t.setRidershipTypeActive(type, active.has(type));
    }
    if (p.has('walkTime')) t.setWalkTime(parseInt(p.get('walkTime')));
    if (p.has('clickLat') && p.has('clickLon'))
      t.setClickLatLon(parseFloat(p.get('clickLat')), parseFloat(p.get('clickLon')));
  }

  applyRoutesFromUrl(rebuildRouteDropdown) {
    const p = new URLSearchParams(location.search);
    if (!p.has('routes')) return;
    const routeKeys = [...this.#toolbarOptions.routeKeys()].sort();
    const mask = BigInt('0x' + p.get('routes'));
    routeKeys.forEach((r, i) => {
      this.#toolbarOptions.setRoute(r, Boolean(mask & (1n << BigInt(i))));
    });
    rebuildRouteDropdown();
  }
}
