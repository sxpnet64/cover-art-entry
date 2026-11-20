// Fixed scenes for screenshots: ?shot=editor shows the editor with sample photos
// loaded; ?shot=cover shows the cover alone, full-bleed. `photo` picks the first
// sample (samples/<photo>.jpg), `caption` the title and `sub` the subtitle.
// window.__shotReady is set once painted.
export async function runShot(shot, query, load) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await load(
    query.get('photo') ?? 'pier',
    query.get('caption') ?? 'Vice City',
    query.get('sub') ?? 'One Last Score',
  );
  const size = query.get('size');
  if (size) {
    const canvas = document.getElementById('cover');
    const [w, h] = size.split('x').map(Number);
    if (w && h) {
      canvas.width = w;
      canvas.height = h;
      window.__vice.redraw();
    }
  }
  const layout = query.get('layout');
  if (layout && window.__vice.state) {
    window.__vice.state.layout = layout;
    window.__vice.redraw();
  }
  const theme = query.get('theme');
  if (theme && window.__vice.state) {
    window.__vice.state.theme = theme;
    window.__vice.redraw();
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
