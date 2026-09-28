const BLACK = new Set([1, 3, 6, 8, 10]);
export const isBlack = (p) => BLACK.has(p % 12);

const WHITE_FROM_C = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];

export function whiteIndex(pitch) {
  const oct = Math.floor(pitch / 12);
  return oct * 7 + WHITE_FROM_C[pitch % 12];
}

export function whitesBetween(lo, hi) {
  return whiteIndex(hi) - whiteIndex(lo) + (isBlack(hi) ? 0 : 1);
}

export function fitRange(notes, pad = 2) {
  if (!notes.length) return { lo: 48, hi: 72 };
  let lo = Math.min(...notes.map((n) => n.pitch));
  let hi = Math.max(...notes.map((n) => n.pitch));
  lo = Math.max(21, lo - pad);
  hi = Math.min(108, hi + pad);
  while (isBlack(lo) && lo > 21) lo--;
  while (isBlack(hi) && hi < 108) hi++;
  return { lo, hi };
}

export const TRACK_COLORS = ["#4ea3ff", "#3dd68c", "#ffb020", "#ff6b4a", "#c084fc"];

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, w, h, rr);
  else {
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
  }
  ctx.closePath();
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function withAlpha(hex, a) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.gutter = 44;
    this.keyboardH = 160;
    this.layout = null;
    this.w = 0;
    this.h = 0;
  }

  size(width, height) {
    const dpr = window.devicePixelRatio || 1;
    this.w = width;
    this.h = height;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  layoutKeys(lo, hi, width, keyboardH) {
    this.w = width;
    this.keyboardH = keyboardH;
    const nWhite = whitesBetween(lo, hi);
    const inner = width - this.gutter;
    const ww = inner / nWhite;
    const keys = [];
    const whites = [];
    for (let p = lo; p <= hi; p++) {
      if (isBlack(p)) continue;
      const wi = whiteIndex(p) - whiteIndex(lo);
      const x = this.gutter + wi * ww;
      whites.push({ pitch: p, x, w: ww });
      keys.push({ pitch: p, black: false, x, w: ww, h: keyboardH });
    }
    for (let p = lo; p <= hi; p++) {
      if (!isBlack(p)) continue;
      const wkey = whites.find((k) => k.pitch === p - 1);
      if (!wkey) continue;
      const bw = ww * 0.62;
      keys.push({
        pitch: p,
        black: true,
        x: wkey.x + wkey.w - bw / 2,
        w: bw,
        h: keyboardH * 0.62,
      });
    }
    this.layout = { lo, hi, ww, keys, whites, nWhite };
    return this.layout;
  }

  noteBox(note) {
    const k = this.layout.keys.find((x) => x.pitch === note.pitch);
    if (!k) return null;
    const inset = k.black ? 1.5 : 3;
    return { x: k.x + inset, w: Math.max(4, k.w - inset * 2), key: k };
  }

  /** Full song, beat 0 at the BOTTOM of the canvas. */
  drawSheet(state, { px, padTop, durationBeats }) {
    const ctx = this.ctx;
    const { w, h } = this;
    ctx.fillStyle = "#07080b";
    ctx.fillRect(0, 0, w, h);
    if (!this.layout) return;

    const yAt = (beat) => padTop + (durationBeats - beat) * px;

    for (const k of this.layout.keys) {
      if (k.black) {
        ctx.fillStyle = "rgba(255,255,255,0.035)";
        ctx.fillRect(k.x, 0, k.w, h);
      }
    }
    ctx.fillStyle = "#0c0e12";
    ctx.fillRect(0, 0, this.gutter, h);

    const beatsPerBar = (state.ts.num * 4) / state.ts.den;
    ctx.font = "12px 'IBM Plex Mono', ui-monospace, monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    const last = Math.ceil(durationBeats);
    for (let b = 0; b <= last; b++) {
      const y = yAt(b);
      const barStart = b % beatsPerBar === 0;
      ctx.strokeStyle = barStart ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.05)";
      ctx.lineWidth = barStart ? 1.2 : 1;
      ctx.beginPath();
      ctx.moveTo(this.gutter, y);
      ctx.lineTo(w, y);
      ctx.stroke();
      if (barStart) {
        ctx.fillStyle = "rgba(232,238,247,0.55)";
        ctx.fillText(String(Math.floor(b / beatsPerBar) + 1), this.gutter - 8, y);
      }
    }

    for (const note of state.notes) {
      const box = this.noteBox(note);
      if (!box) continue;
      const bot = yAt(note.startBeat);
      const top = yAt(note.endBeat);
      const nh = Math.max(3, bot - top);
      const color =
        note.color ||
        (state.multiTrack
          ? TRACK_COLORS[note.track % TRACK_COLORS.length]
          : state.color || TRACK_COLORS[0]);
      ctx.fillStyle = withAlpha(color, 0.88);
      roundRect(ctx, box.x, top, box.w, nh, Math.min(5, box.w / 2));
      ctx.fill();
      ctx.fillStyle = withAlpha("#ffffff", 0.12);
      roundRect(ctx, box.x, top, box.w, Math.min(10, nh), Math.min(5, box.w / 2));
      ctx.fill();
    }
  }
}
