import * as vega from 'vega';
import * as vegalite from 'vega-lite';
import * as tooltip from 'vega-tooltip';

const config = {
  view: { continuousWidth: 400, continuousHeight: 300 },
  mark: { tooltip: null }
};

/**
 * Render a Vega-Lite JSON specification into a container element.
 * Pass an in-DOM element as `container` so that height:"container" in the
 * spec reads the correct computed size instead of 0 from a detached node.
 * @returns The container element.
 */
export async function render(spec, container) {
  const compiled = vegalite.compile({ ...spec, config });
  if (!container) {
    container = document.createElement('div');
    container.style['overflow-x'] = 'auto';
  }
  const view = new vega.View(vega.parse(compiled.spec), {
    renderer: 'svg',
    container,
    logLevel: vega.Warn,
  });
  view.tooltip(new tooltip.Handler().call);
  await view.runAsync();
  return container;
}
