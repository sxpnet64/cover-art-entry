// Vice Cover Studio renderer: draws a multi-panel GTA-style poster cover on any
// canvas. Everything is drawn in code (sunset gradients, neon title lettering)
// — no Rockstar logo, artwork or font is used;
// lettering uses only the system font stack (Arial Black / Impact / sans-serif).
// Photos are drawn cover-fit inside each panel with a per-photo crop transform
// (zoom + pan), so one photo can fill every panel or each panel can hold its own.

export const LAYOUTS = {
  // Three panels: one tall hero on the left, two stacked on the right.
  hero: [
    { x: 0, y: 0, w: 0.62, h: 1 },
    { x: 0.62, y: 0, w: 0.38, h: 0.5 },
    { x: 0.62, y: 0.5, w: 0.38, h: 0.5 },
  ],
  // Four panels: a 2x2 grid with a wide hero strip across the top.
  grid: [
    { x: 0, y: 0, w: 1, h: 0.46 },
    { x: 0, y: 0.46, w: 0.34, h: 0.54 },
    { x: 0.34, y: 0.46, w: 0.33, h: 0.54 },
    { x: 0.67, y: 0.46, w: 0.33, h: 0.54 },
  ],
  // Three vertical strips, poster-column style.
  strips: [
    { x: 0, y: 0, w: 0.34, h: 1 },
    { x: 0.34, y: 0, w: 0.33, h: 1 },
    { x: 0.67, y: 0, w: 0.33, h: 1 },
  ],
};

export const THEMES = {
  sunset: {
    name: 'Vice Sunset',
    sky: ['#2b1055', '#ff5e62', '#ff9966', '#ffd194'],
    sun: '#ffe259',
    title: '#ffffff',
    titleEdge: '#ff2e88',
    subtitle: '#ffe259',
    band: 'rgba(43, 16, 85, 0.88)',
    grade: ['rgba(255, 94, 98, 0)', 'rgba(255, 46, 136, 0.38)'],
  },
  neon: {
    name: 'Neon Nights',
    sky: ['#0f0522', '#3b0f6e', '#ff2e88', '#00e5ff'],
    sun: '#00e5ff',
    title: '#ffffff',
    titleEdge: '#00e5ff',
    subtitle: '#ff5ef1',
    band: 'rgba(15, 5, 34, 0.9)',
    grade: ['rgba(0, 229, 255, 0)', 'rgba(255, 46, 136, 0.42)'],
  },
  dusk: {
    name: 'Palm Dusk',
    sky: ['#1a1a40', '#7b2f8b', '#ff7e5f', '#feb47b'],
    sun: '#ffb347',
    title: '#fff7e6',
    titleEdge: '#7b2f8b',
    subtitle: '#ffb347',
    band: 'rgba(26, 26, 64, 0.88)',
    grade: ['rgba(255, 126, 95, 0)', 'rgba(123, 47, 139, 0.4)'],
  },
};

/** Fresh default state for the editor. */
export function defaultState() {
  return {
    layout: 'hero',
    theme: 'sunset',
    title: 'VICE CITY',
    subtitle: 'ONE LAST SCORE',
    titleSize: 1, // multiplier on the fitted size
    fillMode: 'one', // 'one': photo 0 fills every panel; 'each': per-panel photos
    panelPhoto: [0, 0, 0, 0],
    // Per-photo crop: zoom >= 1, pan in fractions of the drawn photo (-0.5..0.5).
    crops: [
      { zoom: 1, ox: 0, oy: 0 },
      { zoom: 1, ox: 0, oy: 0 },
      { zoom: 1, ox: 0, oy: 0 },
    ],
  };
}

/** Panels (in pixels) for a layout on a canvas of size w x h. */
export function panelRects(layout, w, h) {
  const gap = Math.max(4, Math.round(Math.min(w, h) * 0.008));
  return LAYOUTS[layout].map((p) => ({
    x: Math.round(p.x * w) + (p.x > 0 ? gap / 2 : 0),
    y: Math.round(p.y * h) + (p.y > 0 ? gap / 2 : 0),
    w: Math.round(p.w * w) - gap,
    h: Math.round(p.h * h) - gap,
  }));
}

/** Which photo index fills panel i under the current state. */
export function photoForPanel(state, i) {
  return state.fillMode === 'one' ? 0 : (state.panelPhoto[i] ?? 0);
}

// Draws one photo cover-fit into rect, applying its crop transform.
function drawPhotoIn(ctx, photo, crop, rect) {
  const iw = photo.naturalWidth || photo.width;
  const ih = photo.naturalHeight || photo.height;
  const scale = Math.max(rect.w / iw, rect.h / ih) * crop.zoom;
  const pw = iw * scale;
  const ph = ih * scale;
  const dx = rect.x + (rect.w - pw) / 2 + crop.ox * pw;
  const dy = rect.y + (rect.h - ph) / 2 + crop.oy * ph;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(photo, dx, dy, pw, ph);
  ctx.restore();
}

/** Draws the whole cover: panels with their sunset grade, title band and lettering. */
export function drawCover(canvas, photos, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const theme = THEMES[state.theme] || THEMES.sunset;

  // Sky backdrop behind the panels (visible in the gaps between them).
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  theme.sky.forEach((c, i) => sky.addColorStop(i / (theme.sky.length - 1), c));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Panels with their photos.
  const rects = panelRects(state.layout, w, h);
  rects.forEach((rect, i) => {
    const photo = photos[photoForPanel(state, i)];
    if (photo) {
      drawPhotoIn(ctx, photo, state.crops[photoForPanel(state, i)], rect);
    } else {
      const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
      g.addColorStop(0, '#3a1c5e');
      g.addColorStop(1, '#12081f');
      ctx.fillStyle = g;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = `bold ${Math.max(14, rect.w * 0.045)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
    }
    // Neon frame + sunset grade over each panel.
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.004);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    const grade = ctx.createLinearGradient(0, rect.y + rect.h * 0.45, 0, rect.y + rect.h);
    grade.addColorStop(0, theme.grade[0]);
    grade.addColorStop(1, theme.grade[1]);
    ctx.fillStyle = grade;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  });

  // Title band across the bottom.
  const bandH = h * 0.17;
  ctx.fillStyle = theme.band;
  ctx.fillRect(0, h - bandH, w, bandH);
  ctx.fillStyle = theme.titleEdge;
  ctx.fillRect(0, h - bandH, w, Math.max(3, h * 0.006));

  // Bold title lettering, fitted to the width, with a neon edge.
  const title = (state.title || '').trim().toUpperCase();
  if (title) {
    let size = h * 0.085 * state.titleSize;
    const stack = '"Arial Black", Impact, "Helvetica Neue", sans-serif';
    ctx.font = `900 ${size}px ${stack}`;
    while (ctx.measureText(title).width > w * 0.92 && size > 14) {
      size -= 2;
      ctx.font = `900 ${size}px ${stack}`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, size * 0.09);
    ctx.strokeStyle = theme.titleEdge;
    ctx.fillStyle = theme.title;
    const ty = h - bandH / 2 - (state.subtitle.trim() ? h * 0.018 : 0);
    ctx.strokeText(title, w / 2, ty);
    ctx.fillText(title, w / 2, ty);
  }

  // Subtitle in spaced capitals under the title.
  const sub = (state.subtitle || '').trim().toUpperCase();
  if (sub) {
    const size = Math.max(12, h * 0.026);
    ctx.font = `700 ${size}px "Helvetica Neue", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = theme.subtitle;
    const spaced = sub.split('').join('\u2009');
    ctx.fillText(spaced, w / 2, h - bandH * 0.22);
  }
  ctx.textBaseline = 'alphabetic';
}
