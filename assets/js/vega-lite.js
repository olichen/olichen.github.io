import * as vega from 'vega';
import * as vegalite from 'vega-lite';
import * as tooltip from 'vega-tooltip';

const config = {
  view: { continuousWidth: 400, continuousHeight: 300 },
  mark: { tooltip: null }
};

/**
 * Render a Vega-Lite JSON specification.
 * @returns The rendered HTML element.
 */
export async function render(spec) {
  const compiled = vegalite.compile({ ...spec, config });
  const div = document.createElement('div');
  div.style['overflow-x'] = 'auto';
  const view = new vega.View(vega.parse(compiled.spec), {
    renderer: 'svg',
    container: div,
    logLevel: vega.Warn,
  });
  view.tooltip(new tooltip.Handler().call);
  await view.runAsync();
  return div;
}
