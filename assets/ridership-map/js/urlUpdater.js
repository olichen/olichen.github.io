export class UrlUpdater {
  #mapOptions;
  #toolbarOptions;

  constructor(mapOptions, toolbarOptions) {
    this.#mapOptions = mapOptions;
    this.#toolbarOptions = toolbarOptions;
  }
}
