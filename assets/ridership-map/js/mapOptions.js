export class MapOptions {
  #center = { lat: 47.65, lon: -122.3 };
  #zoom = 14;

  get center() { return this.#center; }
  setCenter(lat, lon) { this.#center = { lat, lon }; }

  get zoom() { return this.#zoom; }
  setZoom(zoom) { this.#zoom = zoom; }
}
