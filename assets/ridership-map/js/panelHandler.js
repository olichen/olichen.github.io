export class PanelHandler {
  #mapContainer;
  #toolbarPanel;
  #chartsPanel;

  constructor(mapContainerId, toolbarPanelId, chartsPanelId) {
    this.#mapContainer = document.getElementById(mapContainerId);
    this.#toolbarPanel = document.getElementById(toolbarPanelId);
    this.#chartsPanel = document.getElementById(chartsPanelId);
  }

  openToolbar() {
    this.#toolbarPanel.classList.add('open');
    this.#mapContainer.classList.add('toolbar-open');
  }

  closeToolbar() {
    this.#toolbarPanel.classList.remove('open');
    this.#mapContainer.classList.remove('toolbar-open');
  }

  toggleToolbar() {
    this.#toolbarPanel.classList.contains('open') ? this.closeToolbar() : this.openToolbar();
  }

  openCharts() {
    this.#chartsPanel.classList.add('open');
    this.#mapContainer.classList.add('charts-open');
    setTimeout(() => window.dispatchEvent(new Event('resize')), 260);
  }

  closeCharts() {
    this.#chartsPanel.classList.remove('open');
    this.#mapContainer.classList.remove('charts-open');
  }

  toggleCharts() {
    this.#chartsPanel.classList.contains('open') ? this.closeCharts() : this.openCharts();
  }
}
