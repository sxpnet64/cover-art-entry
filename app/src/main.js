// Vice Cover Studio — wires the editor: upload photos (read locally with
// FileReader, never uploaded), crop and position each photo, pick a layout and
// theme, edit the caption, and export a PNG in 1080x1080, 1080x1350 or
// 1920x1080. A `?shot=` query sets up a fixed scene for a screenshot instead.
import { drawCover, defaultState, panelRects, photoForPanel, LAYOUTS, THEMES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const status = document.getElementById('status');
const state = defaultState();
// photos[i] is an Image (or null) for slot i; slots 0..2.
const photos = [null, null, null];
let selectedPanel = 0;
let drag = null;

const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 x 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 x 1350' },
  wide: { w: 1920, h: 1080, label: '1920 x 1080' },
};

function redraw() {
  drawCover(canvas, photos, state);
  syncPanelControls();
}

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Reads a File locally and stores it in photo slot i. */
export function loadPhotoFile(file, i) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        photos[i] = await loadImage(reader.result);
        redraw();
        status.textContent = `Photo ${i + 1} loaded — kept on your machine, never uploaded.`;
        resolve(photos[i]);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function syncPanelControls() {
  const idx = photoForPanel(state, selectedPanel);
  document.getElementById('panelPhoto').value = String(idx);
  const crop = state.crops[idx];
  document.getElementById('zoom').value = crop.zoom;
  document.getElementById('panX').value = crop.ox;
  document.getElementById('panY').value = crop.oy;
  document.getElementById('zoomVal').textContent = `${Math.round(crop.zoom * 100)}%`;
  document.getElementById('panelLabel').textContent = `Panel ${selectedPanel + 1} of ${panelRects(state.layout, 1, 1).length}`;
  document.querySelectorAll('.panel-btn').forEach((b) => {
    b.classList.toggle('active', Number(b.dataset.panel) === selectedPanel);
  });
  document.getElementById('fillMode').value = state.fillMode;
}

// Photo slots: file input + sample button each.
for (let i = 0; i < 3; i++) {
  document.getElementById(`photo${i}`).addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) loadPhotoFile(file, i).catch(() => { status.textContent = 'Could not read that image file.'; });
  });
  document.getElementById(`sample${i}`).addEventListener('click', async () => {
    const sample = i === 0 ? 'pier' : 'boulevard';
    photos[i] = await loadImage(`samples/${sample}.jpg`);
    redraw();
    status.textContent = `Sample photo ${i + 1} loaded (${sample}.jpg).`;
  });
}

// Layout, theme, fill mode.
document.getElementById('layout').addEventListener('change', (e) => {
  state.layout = e.target.value;
  if (selectedPanel >= LAYOUTS[state.layout].length) selectedPanel = 0;
  redraw();
});
document.getElementById('theme').addEventListener('change', (e) => {
  state.theme = e.target.value;
  redraw();
});
document.getElementById('fillMode').addEventListener('change', (e) => {
  state.fillMode = e.target.value;
  redraw();
});
document.getElementById('panelPhoto').addEventListener('change', (e) => {
  state.panelPhoto[selectedPanel] = Number(e.target.value);
  redraw();
});

// Panel picker buttons.
document.querySelectorAll('.panel-btn').forEach((b) => {
  b.addEventListener('click', () => {
    selectedPanel = Number(b.dataset.panel);
    syncPanelControls();
  });
});

// Crop controls for the selected panel's photo.
document.getElementById('zoom').addEventListener('input', (e) => {
  state.crops[photoForPanel(state, selectedPanel)].zoom = Number(e.target.value);
  redraw();
});
document.getElementById('panX').addEventListener('input', (e) => {
  state.crops[photoForPanel(state, selectedPanel)].ox = Number(e.target.value);
  redraw();
});
document.getElementById('panY').addEventListener('input', (e) => {
  state.crops[photoForPanel(state, selectedPanel)].oy = Number(e.target.value);
  redraw();
});
document.getElementById('resetCrop').addEventListener('click', () => {
  state.crops[photoForPanel(state, selectedPanel)] = { zoom: 1, ox: 0, oy: 0 };
  redraw();
});

// Drag on the preview to pan the selected panel's photo.
canvas.addEventListener('pointerdown', (e) => {
  const r = canvas.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  const y = (e.clientY - r.top) / r.height;
  const rects = panelRects(state.layout, 1, 1);
  const hit = rects.findIndex((p) => x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h);
  if (hit >= 0) {
    selectedPanel = hit;
    const crop = state.crops[photoForPanel(state, selectedPanel)];
    drag = { x: e.clientX, y: e.clientY, ox: crop.ox, oy: crop.oy, rect: rects[hit] };
    canvas.setPointerCapture(e.pointerId);
    syncPanelControls();
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const r = canvas.getBoundingClientRect();
  const crop = state.crops[photoForPanel(state, selectedPanel)];
  crop.ox = Math.max(-0.5, Math.min(0.5, drag.ox + (e.clientX - drag.x) / r.width / Math.max(0.2, drag.rect.w)));
  crop.oy = Math.max(-0.5, Math.min(0.5, drag.oy + (e.clientY - drag.y) / r.height / Math.max(0.2, drag.rect.h)));
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });

// Caption + title size.
titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
document.getElementById('titleSize').addEventListener('input', (e) => {
  state.titleSize = Number(e.target.value);
  redraw();
});

// Export: render the cover at the exact post size and download it as a PNG.
export function exportCover(sizeKey) {
  const size = SIZES[sizeKey];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off, photos, state);
  return new Promise((resolve) => {
    off.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vice-cover-${size.w}x${size.h}.png`;
      a.click();
      status.textContent = `Saved vice-cover-${size.w}x${size.h}.png`;
      resolve({ w: size.w, h: size.h, bytes: blob.size });
    }, 'image/png');
  });
}
document.getElementById('export').addEventListener('click', () => {
  exportCover(document.getElementById('exportSize').value);
});

// Expose the live state for screenshots and tests.
window.__vice = { state, photos, exportCover, redraw, loadImage, loadPhotoFile, SIZES };

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), async (sample, text, sub) => {
    photos[0] = await loadImage(`samples/${sample}.jpg`);
    photos[1] = await loadImage(`samples/${sample === 'pier' ? 'boulevard' : 'pier'}.jpg`);
    state.fillMode = 'each';
    state.panelPhoto = [0, 1, 0, 1];
    titleInput.value = text;
    subtitleInput.value = sub;
    state.title = text;
    state.subtitle = sub;
    redraw();
  });
} else {
  // Start with both sample photos so the first paint already shows the look.
  Promise.all([loadImage('samples/pier.jpg'), loadImage('samples/boulevard.jpg')])
    .then(([pier, blvd]) => {
      photos[0] = pier;
      photos[1] = blvd;
      state.fillMode = 'each';
      state.panelPhoto = [0, 1, 0, 1];
      redraw();
    })
    .catch(() => redraw());
  redraw();
}
