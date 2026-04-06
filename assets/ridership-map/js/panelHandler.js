export class PanelHandler {
  #mapContainer;
  #toolbarPanel;
  #chartsPanel;
  #onCloseCharts = null;
  #onChange = null;

  constructor(mapContainerId, toolbarPanelId, chartsPanelId) {
    this.#mapContainer = document.getElementById(mapContainerId);
    this.#toolbarPanel = document.getElementById(toolbarPanelId);
    this.#chartsPanel = document.getElementById(chartsPanelId);
  }

  setOnChange(cb) { this.#onChange = cb; }

  openToolbar() {
    this.#toolbarPanel.classList.add('open');
    this.#mapContainer.classList.add('toolbar-open');
    this.#onChange?.();
  }

  closeToolbar() {
    this.#toolbarPanel.classList.remove('open');
    this.#mapContainer.classList.remove('toolbar-open');
    this.#onChange?.();
  }

  get toolbarOpen() { return this.#toolbarPanel.classList.contains('open'); }

  toggleToolbar() {
    this.#toolbarPanel.classList.contains('open') ? this.closeToolbar() : this.openToolbar();
  }

  openCharts() {
    this.#chartsPanel.classList.add('open');
    this.#mapContainer.classList.add('charts-open');
    this.#onChange?.();
    setTimeout(() => window.dispatchEvent(new Event('resize')), 260);
  }

  setOnCloseCharts(cb) {
    this.#onCloseCharts = cb;
  }

  closeCharts() {
    this.#chartsPanel.classList.remove('open');
    this.#mapContainer.classList.remove('charts-open');
    this.#onChange?.();
    setTimeout(() => this.#onCloseCharts?.(), 250);
  }

  get chartsOpen() { return this.#chartsPanel.classList.contains('open'); }

  toggleCharts() {
    this.#chartsPanel.classList.contains('open') ? this.closeCharts() : this.openCharts();
  }
}
