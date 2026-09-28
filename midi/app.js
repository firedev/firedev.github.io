import { parseMidi, mergeSongs } from "./midi.js";
import { Renderer, fitRange, TRACK_COLORS } from "./render.js";
import { INSTRUMENTS, Synth } from "./synth.js";

const INST_COLOR = {
  pad: "#3dd6c6",
  bass: "#ff7a45",
  lead: "#ffd56a",
  pluck: "#5b8cff",
  piano: "#4ea3ff",
};

let SONGS = [];

function prettyName(name) {
  return name
    .replace(/\.midi?$/i, "")
    .replace(/_/g, " ")
    .replace(/-(?=[a-z0-9])/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function guessInstrument(name) {
  const n = name.toLowerCase();
  if (/\bpads?\b/.test(n)) return "pad";
  if (/\bbass\b/.test(n)) return "bass";
  if (/\bpluck\b/.test(n)) return "pluck";
  if (/\blead\b/.test(n)) return "lead";
  return "piano";
}

function groupKey(song) {
  const m = song.label.match(/^(.+?)\s+[-·]\s+/);
  return m ? m[1] : null;
}

function songFromFile(file) {
  const inst = guessInstrument(file.name);
  return {
    id: file.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/g, ""),
    label: prettyName(file.name),
    url: file.url,
    color: INST_COLOR[inst] || TRACK_COLORS[0],
    instrument: inst,
  };
}

async function listMidFiles(dirUrl) {
  const base = new URL(dirUrl.endsWith("/") ? dirUrl : `${dirUrl}/`, window.location.href);
  try {
    const res = await fetch(base.href);
    if (!res.ok) return [];
    const html = await res.text();
    return [...html.matchAll(/href="([^"]+)"/gi)]
      .map((m) => decodeURIComponent(m[1].split("?")[0]).split("/").filter(Boolean).pop())
      .filter((name) => name && /\.midi?$/i.test(name) && !name.startsWith("."))
      .map((name) => ({ name, url: new URL(encodeURIComponent(name), base).href }));
  } catch {
    return [];
  }
}

async function listCatalogJson() {
  const candidates = ["catalog.json", "../midi/catalog.json"];
  for (const rel of candidates) {
    try {
      const res = await fetch(rel);
      if (!res.ok) continue;
      const data = await res.json();
      const names = Array.isArray(data) ? data : data.files;
      if (!names?.length) continue;
      const base = new URL(rel, window.location.href);
      return names
        .filter((name) => typeof name === "string" && /\.midi?$/i.test(name))
        .map((name) => ({ name, url: new URL(encodeURIComponent(name), base).href }));
    } catch {
      /* try next */
    }
  }
  return [];
}

async function loadCatalog() {
  const songs = [];
  const seen = new Set();
  const fromJson = await listCatalogJson();
  const files = fromJson.length ? fromJson : await listMidFiles("../midi/");
  for (const file of files) {
    const song = songFromFile(file);
    if (seen.has(song.id)) continue;
    seen.add(song.id);
    songs.push(song);
  }

  const byGroup = new Map();
  for (const s of songs) {
    const key = groupKey(s);
    if (!key) continue;
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key).push(s);
  }
  const grouped = [];
  for (const [key, parts] of byGroup) {
    if (parts.length < 2) continue;
    grouped.push({
      id: `${key.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-all`,
      label: `${key} · all`,
      layers: parts,
      color: parts[0].color,
    });
    const pad = parts.find((p) => p.instrument === "pad");
    const bass = parts.find((p) => p.instrument === "bass");
    if (pad && bass) {
      grouped.push({
        id: `${key.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-pads-bass`,
        label: `${key} · pads+bass`,
        layers: [pad, bass],
        color: pad.color,
      });
    }
  }

  grouped.sort((a, b) => a.label.localeCompare(b.label));
  songs.sort((a, b) => {
    const ra = rankSong(a);
    const rb = rankSong(b);
    return ra - rb || a.label.localeCompare(b.label);
  });
  return [...grouped, ...songs];
}

function rankSong(s) {
  const l = (s.label || "").toLowerCase();
  if (l.includes("cheyenne")) return 0;
  if (l.includes("werewolf") || l.includes("deep purple")) return 1;
  return 2;
}

const canvas = document.getElementById("roll");
const scroller = document.getElementById("scroller");
const piano = document.getElementById("piano");
const dock = document.getElementById("dock");
const songSel = document.getElementById("song");
const instSel = document.getElementById("inst");
const fileInput = document.getElementById("file");
const playBtn = document.getElementById("play");
const waitBtn = document.getElementById("wait");
const loopBtn = document.getElementById("loop");
const midiEl = document.getElementById("midi");
const timeEl = document.getElementById("time");
const zoomLabel = document.getElementById("zoom-label");
const tempoInput = document.getElementById("tempo");
const tempoLabel = document.getElementById("tempo-label");
const dropEl = document.getElementById("drop");

const BASE_PX_PER_BEAT = 48;

const renderer = new Renderer(canvas);
const synth = new Synth();

const state = {
  song: null,
  notes: [],
  t: 0,
  playing: false,
  wait: false,
  loop: false,
  waiting: null,
  zoom: Number(localStorage.getItem("midi-player-zoom") || "1") || 1,
  tempo: 1,
  held: new Set(),
  color: TRACK_COLORS[0],
  multiTrack: false,
  ts: { num: 4, den: 4 },
  bpm: 123,
  durationSec: 0,
  durationBeats: 0,
  beat: 0,
};

let songData = null;
let midiAccess = null;
let syncingScroll = false;
const keyEls = new Map();
const holdCount = new Map();
const pointerPitches = new Map();
let pianoSig = "";

function pxPerBeat() {
  return BASE_PX_PER_BEAT * state.zoom;
}

function dockH() {
  return dock.offsetHeight || 240;
}

function padTop() {
  return Math.max(80, scroller.clientHeight || 400);
}

function songPx() {
  return (songData ? songData.durationBeats : 0) * pxPerBeat();
}

function barLength() {
  return (state.ts.num * 4) / state.ts.den;
}

function phraseBeats() {
  return barLength() * 8;
}

function loopRange() {
  const span = phraseBeats();
  const b = Math.max(0, state.beat);
  const start = Math.floor(b / span) * span;
  return { start, end: Math.min(start + span, state.durationBeats) };
}

const CHORD_WINDOW = 0.08;

function nextAttack(beat) {
  let start = Infinity;
  for (const n of state.notes) {
    if (n.startBeat >= beat - 1e-6 && n.startBeat < start) start = n.startBeat;
  }
  if (!Number.isFinite(start)) return null;
  const pitches = new Set();
  for (const n of state.notes) {
    if (Math.abs(n.startBeat - start) <= CHORD_WINDOW) pitches.add(n.pitch);
  }
  return pitches.size ? { beat: start, pitches } : null;
}

function waitingSatisfied() {
  const w = state.waiting;
  if (!w) return true;
  for (const p of w.pitches) if (!w.got.has(p)) return false;
  return true;
}

function clearWait() {
  state.waiting = null;
}

function armWait(group) {
  const got = new Set();
  for (const p of group.pitches) if (state.held.has(p)) got.add(p);
  state.waiting = { beat: group.beat, pitches: group.pitches, got };
  if (waitingSatisfied()) {
    state.beat = group.beat + 1e-4;
    clearWait();
    return false;
  }
  return true;
}

function pitchName(p) {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return `${names[p % 12]}${Math.floor(p / 12) - 1}`;
}

function leadInBeats() {
  return 1 / pxPerBeat();
}

function ensureAudio() {
  synth.ensure();
}

for (const ev of ["pointerdown", "pointerup", "mousedown", "keydown", "touchstart", "wheel"]) {
  window.addEventListener(ev, ensureAudio, { capture: true, passive: true });
}

function setInstrument(id, { persist = true } = {}) {
  if (!INSTRUMENTS[id]) return;
  synth.setInstrument(id);
  instSel.value = id;
  if (persist) localStorage.setItem("midi-player-inst", id);
  if (state.playing && songData && synth.ctx && state.beat >= 0) {
    synth.syncFile(state.notes, state.t);
  }
}

function layoutSheet() {
  const width = scroller.clientWidth || window.innerWidth;
  const keyboardH = 160;
  piano.style.height = `${keyboardH}px`;
  const { lo, hi } = fitRange(state.notes);
  renderer.layoutKeys(lo, hi, width, keyboardH);
  buildPiano();
  const height = padTop() + songPx() + leadInBeats() * pxPerBeat();
  renderer.size(width, height);
  renderer.drawSheet(state, {
    px: pxPerBeat(),
    padTop: padTop(),
    durationBeats: songData ? songData.durationBeats : 0,
  });
}

function scrollToBeat(beat) {
  const yOn = padTop() + (state.durationBeats - beat) * pxPerBeat();
  const top = yOn - scroller.clientHeight;
  syncingScroll = true;
  scroller.scrollTop = Math.max(0, top);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      syncingScroll = false;
    });
  });
}

function beatFromScroll() {
  const hitY = scroller.scrollTop + scroller.clientHeight;
  const beat = state.durationBeats - (hitY - padTop()) / pxPerBeat();
  return Math.min(state.durationBeats, beat);
}

const midiFileOn = new Set();

function midiSend(status, note, vel) {
  if (!midiAccess) return;
  for (const out of midiAccess.outputs.values()) {
    try {
      out.send([status, note, vel]);
    } catch {
      /* port closed */
    }
  }
}

function pushMidiFile() {
  const next = new Set();
  if (state.beat >= 0) {
    for (const n of state.notes) {
      if (n.startSec <= state.t && state.t < n.endSec) next.add(n.pitch);
    }
  }
  for (const p of midiFileOn) {
    if (!next.has(p)) midiSend(0x80, p, 0);
  }
  for (const p of next) {
    if (!midiFileOn.has(p)) midiSend(0x90, p, 100);
  }
  midiFileOn.clear();
  for (const p of next) midiFileOn.add(p);
}

function midiFileOff() {
  for (const p of midiFileOn) midiSend(0x80, p, 0);
  midiFileOn.clear();
  if (!midiAccess) return;
  for (const out of midiAccess.outputs.values()) {
    try {
      out.send([0xb0, 123, 0]);
    } catch {
      /* port closed */
    }
  }
}

function applyTime(beat, { sound = true } = {}) {
  if (!songData) return;
  state.beat = beat;
  const hear = sound && beat >= 0;
  if (!hear) {
    state.t = beat < 0 ? 0 : songData.beatToSec(beat);
    synth.silenceFile();
    midiFileOff();
  } else {
    state.t = songData.beatToSec(beat);
    synth.syncFile(state.notes, state.t);
    pushMidiFile();
  }
  updateHud();
  paintKeys();
}

function applySong(data, { color, label, instrument }) {
  songData = data;
  state.notes = data.notes;
  state.ts = data.timeSignature;
  state.bpm = data.bpm;
  state.durationSec = data.durationSec;
  state.durationBeats = data.durationBeats;
  state.t = 0;
  state.beat = -leadInBeats();
  state.playing = false;
  state.color = color;
  state.multiTrack = new Set(data.notes.map((n) => n.track)).size > 1;
  state.song = label;
  clearWait();
  synth.silenceFile();
  if (instrument) setInstrument(instrument, { persist: false });
  playBtn.textContent = "Play";
  playBtn.setAttribute("aria-pressed", "false");
  updateTempoLabel();
  layoutSheet();
  scrollToBeat(-leadInBeats());
  requestAnimationFrame(() => {
    layoutSheet();
    scrollToBeat(-leadInBeats());
  });
  updateHud();
  paintKeys();
}

async function loadUrl(url, meta) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`MIDI ${res.status}: ${url}`);
  applySong(parseMidi(await res.arrayBuffer()), meta);
}

async function loadBuffer(buffer, meta) {
  applySong(parseMidi(buffer), meta);
}

async function loadSong(s) {
  if (s.layers) {
    const parts = [];
    for (const layer of s.layers) {
      const res = await fetch(layer.url);
      if (!res.ok) throw new Error(`MIDI ${res.status}: ${layer.url}`);
      const data = parseMidi(await res.arrayBuffer());
      for (const n of data.notes) {
        n.instrument = layer.instrument;
        n.color = layer.color;
      }
      data.name = layer.instrument;
      parts.push(data);
    }
    applySong(mergeSongs(parts), { color: s.color, label: s.label });
    return;
  }
  await loadUrl(s.url, s);
}

function updateHud() {
  if (!songData) return;
  if (state.waiting) {
    const names = [...state.waiting.pitches]
      .sort((a, b) => a - b)
      .map((p) => (state.waiting.got.has(p) ? "✓" : pitchName(p)))
      .join(" ");
    timeEl.textContent = `${state.song} · wait ${names}`;
    return;
  }
  if (state.beat < 0) {
    timeEl.textContent = `${state.song} · ready`;
    return;
  }
  const beatsPerBar = (state.ts.num * 4) / state.ts.den;
  const bar = Math.floor(state.beat / beatsPerBar) + 1;
  const beatInBar = (state.beat % beatsPerBar) + 1;
  const m = Math.floor(state.t / 60);
  const s = state.t % 60;
  const clock = `${m}:${s.toFixed(1).padStart(4, "0")}`;
  let extra = "";
  if (state.loop) {
    const { start, end } = loopRange();
    extra = ` · loop ${Math.floor(start / beatsPerBar) + 1}–${Math.floor(end / beatsPerBar)}`;
  }
  timeEl.textContent = `${state.song} · bar ${bar} · ${beatInBar.toFixed(1)}/${state.ts.num} · ${clock}${extra}`;
}

function updateTempoLabel() {
  const bpm = Math.round(state.bpm * state.tempo);
  tempoLabel.textContent = `${bpm} BPM`;
}

function setZoom(z) {
  const beat = state.beat;
  state.zoom = Math.max(0.4, Math.min(4, z));
  localStorage.setItem("midi-player-zoom", String(state.zoom));
  zoomLabel.textContent = `${state.zoom.toFixed(1)}×`;
  layoutSheet();
  scrollToBeat(beat);
}

function noteColor(note) {
  if (note.color) return note.color;
  if (state.multiTrack) return TRACK_COLORS[note.track % TRACK_COLORS.length];
  return state.color || TRACK_COLORS[0];
}

function buildPiano() {
  const layout = renderer.layout;
  if (!layout) return;
  const sig = `${layout.lo}:${layout.hi}:${Math.round(renderer.w)}:${renderer.keyboardH}`;
  if (sig === pianoSig && keyEls.size) {
    paintKeys();
    return;
  }
  pianoSig = sig;
  keyEls.clear();
  piano.replaceChildren();
  const whites = layout.keys.filter((k) => !k.black);
  const blacks = layout.keys.filter((k) => k.black);
  for (const k of [...whites, ...blacks]) {
    const el = document.createElement("div");
    el.className = `key ${k.black ? "black" : "white"}`;
    el.dataset.pitch = String(k.pitch);
    el.style.left = `${k.x}px`;
    el.style.width = `${k.w}px`;
    el.setAttribute("role", "button");
    const oct = Math.floor(k.pitch / 12) - 1;
    const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    el.title = `${names[k.pitch % 12]}${oct}`;
    if (!k.black && k.pitch % 12 === 0) {
      const lab = document.createElement("span");
      lab.className = "oct";
      lab.textContent = `C${oct}`;
      el.append(lab);
    }
    piano.append(el);
    keyEls.set(k.pitch, el);
  }
  paintKeys();
}

function paintKeys() {
  const fileHeld = new Map();
  for (const n of state.notes) {
    if (state.beat >= 0 && n.startSec <= state.t && state.t < n.endSec) {
      fileHeld.set(n.pitch, noteColor(n));
    }
  }
  const waiting = state.waiting ? state.waiting.pitches : null;
  for (const [pitch, el] of keyEls) {
    el.classList.toggle("down", state.held.has(pitch));
    const col = fileHeld.get(pitch);
    el.classList.toggle("lit", Boolean(col));
    const need = Boolean(waiting && waiting.has(pitch) && !state.waiting.got.has(pitch));
    el.classList.toggle("wait", need);
    if (col) el.style.setProperty("--lit", col);
    else if (need) {
      const n = state.notes.find(
        (x) => x.pitch === pitch && Math.abs(x.startBeat - state.waiting.beat) <= CHORD_WINDOW,
      );
      el.style.setProperty("--lit", n ? noteColor(n) : "#3dd6c6");
    } else el.style.removeProperty("--lit");
  }
}

function userDown(pitch, vel = 0.7) {
  const n = (holdCount.get(pitch) || 0) + 1;
  holdCount.set(pitch, n);
  if (n !== 1) return;
  state.held.add(pitch);
  ensureAudio();
  synth.noteOn(pitch, vel);
  if (state.waiting && state.waiting.pitches.has(pitch)) {
    state.waiting.got.add(pitch);
    if (waitingSatisfied()) {
      state.beat = state.waiting.beat + 1e-4;
      clearWait();
      if (songData) applyTime(state.beat);
    }
  }
  paintKeys();
}

function userUp(pitch) {
  const n = (holdCount.get(pitch) || 1) - 1;
  if (n > 0) {
    holdCount.set(pitch, n);
    return;
  }
  holdCount.delete(pitch);
  state.held.delete(pitch);
  synth.noteOff(pitch);
  paintKeys();
}

function stopAutoplay() {
  if (!state.playing) return;
  state.playing = false;
  playBtn.textContent = "Play";
  playBtn.setAttribute("aria-pressed", "false");
}

function blurPlay() {
  if (document.activeElement && document.activeElement.matches("button")) {
    document.activeElement.blur();
  }
}

function pausePlay() {
  stopAutoplay();
  clearWait();
  synth.silenceFile();
  midiFileOff();
  blurPlay();
  paintKeys();
  updateHud();
}

function panic() {
  stopAutoplay();
  clearWait();
  state.held.clear();
  holdCount.clear();
  pointerPitches.clear();
  synth.panic();
  midiFileOff();
  blurPlay();
  paintKeys();
  updateHud();
}

function togglePlay() {
  if (!songData) return;
  ensureAudio();
  if (state.playing) {
    pausePlay();
    return;
  }
  state.playing = true;
  playBtn.textContent = "Pause";
  playBtn.setAttribute("aria-pressed", "true");
  applyTime(state.beat, { sound: state.beat >= 0 });
}

function seekTo(beat) {
  if (!songData) return;
  stopAutoplay();
  clearWait();
  const b = Math.min(state.durationBeats, beat);
  applyTime(b);
  scrollToBeat(b);
}

function onScroll() {
  if (!songData) return;
  if (state.playing && !wheelScrub) return;
  if (wheelScrub) {
    wheelScrub = false;
    stopAutoplay();
    clearWait();
  } else if (!syncingScroll) {
    stopAutoplay();
    clearWait();
  }
  applyTime(beatFromScroll());
}

let wheelScrub = false;
scroller.addEventListener("wheel", () => {
  wheelScrub = true;
}, { passive: true });
scroller.addEventListener("scroll", onScroll, { passive: true });

function pitchFromPoint(x, y) {
  const el = document.elementFromPoint(x, y);
  const key = el && el.closest ? el.closest(".key") : null;
  return key ? Number(key.dataset.pitch) : null;
}

piano.addEventListener("pointerdown", (e) => {
  const key = e.target.closest(".key");
  if (!key) return;
  e.preventDefault();
  piano.setPointerCapture(e.pointerId);
  ensureAudio();
  setupMidi();
  const pitch = Number(key.dataset.pitch);
  pointerPitches.set(e.pointerId, pitch);
  userDown(pitch);
});

piano.addEventListener("pointermove", (e) => {
  if (!pointerPitches.has(e.pointerId)) return;
  const pitch = pitchFromPoint(e.clientX, e.clientY);
  const prev = pointerPitches.get(e.pointerId);
  if (pitch === prev) return;
  if (prev != null) userUp(prev);
  if (pitch != null) userDown(pitch);
  pointerPitches.set(e.pointerId, pitch);
});

function endPointer(e) {
  const pitch = pointerPitches.get(e.pointerId);
  pointerPitches.delete(e.pointerId);
  if (pitch != null) userUp(pitch);
}
piano.addEventListener("pointerup", endPointer);
piano.addEventListener("pointercancel", endPointer);

window.addEventListener("keydown", (e) => {
  if (e.code === "Escape") {
    e.preventDefault();
    panic();
    return;
  }
  if (e.target.matches("textarea, input[type='text'], input[type='range']")) return;
  if (e.code === "Enter" || e.code === "NumpadEnter") {
    if (e.target === playBtn) e.preventDefault();
    return;
  }
  if (e.code !== "Space") return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  e.preventDefault();
  togglePlay();
});

playBtn.addEventListener("click", () => {
  setupMidi();
  togglePlay();
  playBtn.blur();
});
waitBtn.addEventListener("click", () => {
  state.wait = !state.wait;
  waitBtn.setAttribute("aria-pressed", state.wait ? "true" : "false");
  if (!state.wait) clearWait();
  updateHud();
  paintKeys();
});
loopBtn.addEventListener("click", () => {
  state.loop = !state.loop;
  loopBtn.setAttribute("aria-pressed", state.loop ? "true" : "false");
  updateHud();
});
instSel.addEventListener("change", () => {
  ensureAudio();
  setInstrument(instSel.value);
});
tempoInput.addEventListener("input", () => {
  state.tempo = Number(tempoInput.value) / 100;
  updateTempoLabel();
});
document.getElementById("to-start").addEventListener("click", () => seekTo(-leadInBeats()));
document.getElementById("to-end").addEventListener("click", () => seekTo(state.durationBeats));
document.getElementById("bar-back").addEventListener("click", () => seekTo(state.beat - barLength()));
document.getElementById("bar-fwd").addEventListener("click", () => seekTo(state.beat + barLength()));
document.getElementById("open").addEventListener("click", () => fileInput.click());
document.getElementById("zoom-in").addEventListener("click", () => setZoom(state.zoom * 1.2));
document.getElementById("zoom-out").addEventListener("click", () => setZoom(state.zoom / 1.2));

fileInput.addEventListener("change", async () => {
  const f = fileInput.files && fileInput.files[0];
  if (!f) return;
  songSel.value = "";
  await loadBuffer(await f.arrayBuffer(), { color: "#4ea3ff", label: f.name });
});

songSel.addEventListener("change", async () => {
  const s = SONGS.find((x) => x.id === songSel.value);
  if (s) await loadSong(s);
});

let dragDepth = 0;
window.addEventListener("dragenter", (e) => {
  e.preventDefault();
  dragDepth++;
  dropEl.hidden = false;
});
window.addEventListener("dragover", (e) => e.preventDefault());
window.addEventListener("dragleave", () => {
  dragDepth = Math.max(0, dragDepth - 1);
  if (!dragDepth) dropEl.hidden = true;
});
window.addEventListener("drop", async (e) => {
  e.preventDefault();
  dragDepth = 0;
  dropEl.hidden = true;
  const f = [...e.dataTransfer.files].find((x) => /\.midi?$/i.test(x.name));
  if (!f) return;
  songSel.value = "";
  await loadBuffer(await f.arrayBuffer(), { color: "#4ea3ff", label: f.name });
});

function midiStatus(text, ok) {
  midiEl.textContent = text;
  midiEl.dataset.ok = ok ? "1" : "0";
}

function onMidiMessage(ev) {
  const data = ev.data;
  if (!data || data.length < 2) return;
  const cmd = data[0] & 0xf0;
  const note = data[1];
  const vel = data.length > 2 ? data[2] : 0;
  if (cmd === 0x90 && vel > 0) userDown(note, vel / 127);
  else if (cmd === 0x80 || cmd === 0x90) userUp(note);
}

function refreshMidi() {
  if (!midiAccess) return;
  const inputs = [...midiAccess.inputs.values()];
  for (const port of inputs) port.onmidimessage = onMidiMessage;
  if (!inputs.length) midiStatus("MIDI · no keyboard — click MIDI", false);
  else midiStatus(`MIDI · ${inputs.map((i) => i.name).join(", ")}`, true);
}

async function setupMidi() {
  if (!navigator.requestMIDIAccess) {
    midiStatus("MIDI · open in Chrome", false);
    return;
  }
  try {
    if (!midiAccess) {
      midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      midiAccess.onstatechange = refreshMidi;
    }
    refreshMidi();
  } catch {
    midiStatus("MIDI · click MIDI and allow access", false);
  }
}

document.getElementById("midi-btn").addEventListener("click", () => {
  ensureAudio();
  setupMidi();
});

let lastTs = 0;
function frame(ts) {
  const dt = lastTs ? (ts - lastTs) / 1000 : 0;
  lastTs = ts;
  if (state.playing && songData) {
    let next = state.beat + dt * state.tempo * (state.bpm / 60);
    let from = state.beat;
    if (state.loop) {
      const { start, end } = loopRange();
      if (end > start && next >= end) {
        next = start + ((next - start) % (end - start));
        from = next;
        clearWait();
      }
    }
    if (state.wait && next >= 0) {
      const group = nextAttack(Math.max(0, from));
      if (group && next >= group.beat) {
        if (!state.waiting || state.waiting.beat !== group.beat) armWait(group);
        if (state.waiting) next = group.beat;
      }
    }
    if (!state.loop && next >= state.durationBeats) {
      applyTime(state.durationBeats, { sound: false });
      pausePlay();
      scrollToBeat(state.durationBeats);
    } else {
      applyTime(next, { sound: next >= 0 });
      scrollToBeat(next);
    }
  }
  requestAnimationFrame(frame);
}

function onResize() {
  const beat = state.beat;
  layoutSheet();
  scrollToBeat(beat);
}

window.addEventListener("resize", onResize);
midiStatus("MIDI · click MIDI", false);
setupMidi();

for (const [id, spec] of Object.entries(INSTRUMENTS)) {
  const opt = document.createElement("option");
  opt.value = id;
  opt.textContent = spec.label;
  instSel.append(opt);
}
instSel.value = "piano";
zoomLabel.textContent = `${state.zoom.toFixed(1)}×`;

requestAnimationFrame(frame);

loadCatalog()
  .then((songs) => {
    SONGS = songs;
    songSel.replaceChildren();
    for (const s of SONGS) {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = s.label;
      songSel.append(opt);
    }
    if (!SONGS.length) {
      timeEl.textContent = "Drop a .mid here or into garageband/midi/";
      return;
    }
    songSel.value = SONGS[0].id;
    return loadSong(SONGS[0]);
  })
  .catch((err) => {
    timeEl.textContent = String(err.message || err);
    console.error(err);
  });
