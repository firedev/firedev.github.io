/** Standard MIDI file → notes in seconds and beats. No extra libraries. */

function readStr(view, offset, n) {
  let s = "";
  for (let i = 0; i < n; i++) s += String.fromCharCode(view.getUint8(offset + i));
  return s;
}

function vlq(view, pos) {
  let value = 0;
  for (let i = 0; i < 4; i++) {
    const b = view.getUint8(pos.i++);
    value = (value << 7) | (b & 0x7f);
    if ((b & 0x80) === 0) break;
  }
  return value;
}

function tickToSec(tick, tempos, ppq) {
  let sec = 0;
  let last = 0;
  let uspq = 500000;
  for (const tp of tempos) {
    if (tp.tick >= tick) break;
    sec += ((tp.tick - last) * uspq) / 1e6 / ppq;
    last = tp.tick;
    uspq = tp.uspq;
  }
  sec += ((tick - last) * uspq) / 1e6 / ppq;
  return sec;
}

function secToTick(sec, tempos, ppq, maxTick) {
  let lo = 0;
  let hi = Math.max(maxTick, 1);
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2;
    if (tickToSec(mid, tempos, ppq) < sec) lo = mid;
    else hi = mid;
  }
  return hi;
}

/**
 * @param {ArrayBuffer} buffer
 * @returns {{
 *   notes: {pitch:number, velocity:number, track:number, channel:number,
 *           startTick:number, endTick:number, startBeat:number, endBeat:number,
 *           startSec:number, endSec:number}[],
 *   ppq: number,
 *   tempos: {tick:number, uspq:number, bpm:number}[],
 *   timeSignature: {num:number, den:number},
 *   bpm: number,
 *   durationSec: number,
 *   durationBeats: number,
 *   durationTicks: number,
 *   tracks: {index:number, name:string}[],
 *   name: string
 * }}
 */
export function parseMidi(buffer) {
  const view = new DataView(buffer);
  if (readStr(view, 0, 4) !== "MThd") throw new Error("Not a MIDI file");
  const headerLen = view.getUint32(4);
  const format = view.getUint16(8);
  const ntrks = view.getUint16(10);
  const division = view.getUint16(12);
  if (division & 0x8000) throw new Error("SMPTE MIDI timing is not supported");
  const ppq = division;
  let offset = 8 + headerLen;

  const tempos = [];
  let timeSignature = { num: 4, den: 4 };
  const tracks = [];
  const notes = [];
  let name = "";

  for (let tr = 0; tr < ntrks; tr++) {
    if (readStr(view, offset, 4) !== "MTrk") throw new Error("Broken MIDI track");
    const len = view.getUint32(offset + 4);
    offset += 8;
    const end = offset + len;
    const pos = { i: offset };
    let tick = 0;
    let running = 0;
    let trackName = "";
    const ons = new Map(); // key: pitch|channel → [{tick, velocity}]

    const close = (pitch, channel, endTick) => {
      const key = pitch | (channel << 8);
      const stack = ons.get(key);
      if (!stack || !stack.length) return;
      const on = stack.pop();
      const startTick = on.tick;
      if (endTick <= startTick) return;
      notes.push({
        pitch,
        velocity: on.velocity,
        track: tr,
        channel,
        startTick,
        endTick,
      });
    };

    while (pos.i < end) {
      tick += vlq(view, pos);
      if (pos.i >= end) break;
      let status = view.getUint8(pos.i);
      if (status < 0x80) {
        status = running;
      } else {
        pos.i++;
        running = status < 0xf0 ? status : 0;
      }

      if (status === 0xff) {
        const type = view.getUint8(pos.i++);
        const n = vlq(view, pos);
        const start = pos.i;
        pos.i += n;
        if (type === 0x2f) break;
        if (type === 0x51 && n === 3) {
          const uspq =
            (view.getUint8(start) << 16) |
            (view.getUint8(start + 1) << 8) |
            view.getUint8(start + 2);
          tempos.push({ tick, uspq, bpm: 60_000_000 / uspq });
        } else if (type === 0x58 && n >= 2) {
          timeSignature = {
            num: view.getUint8(start),
            den: 2 ** view.getUint8(start + 1),
          };
        } else if (type === 0x03) {
          let s = "";
          for (let i = 0; i < n; i++) s += String.fromCharCode(view.getUint8(start + i));
          trackName = s;
          if (!name) name = s;
        }
        continue;
      }

      if (status === 0xf0 || status === 0xf7) {
        const n = vlq(view, pos);
        pos.i += n;
        continue;
      }

      const cmd = status & 0xf0;
      const channel = status & 0x0f;
      if (cmd === 0xc0 || cmd === 0xd0) {
        pos.i += 1;
        continue;
      }
      const a = view.getUint8(pos.i++);
      const b = view.getUint8(pos.i++);
      if (cmd === 0x90 && b > 0) {
        const key = a | (channel << 8);
        if (!ons.has(key)) ons.set(key, []);
        ons.get(key).push({ tick, velocity: b });
      } else if (cmd === 0x80 || (cmd === 0x90 && b === 0)) {
        close(a, channel, tick);
      }
    }

    for (const [key, stack] of ons) {
      const pitch = key & 0xff;
      const channel = key >> 8;
      while (stack.length) close(pitch, channel, tick);
    }

    tracks.push({ index: tr, name: trackName });
    offset = end;
  }

  if (!tempos.length) tempos.push({ tick: 0, uspq: 500000, bpm: 120 });
  tempos.sort((a, b) => a.tick - b.tick);

  for (const n of notes) {
    n.startBeat = n.startTick / ppq;
    n.endBeat = n.endTick / ppq;
    n.startSec = tickToSec(n.startTick, tempos, ppq);
    n.endSec = tickToSec(n.endTick, tempos, ppq);
  }
  notes.sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);

  const durationTicks = notes.reduce((m, n) => Math.max(m, n.endTick), 0);
  const durationSec = tickToSec(durationTicks, tempos, ppq);

  return {
    notes,
    ppq,
    format,
    tempos,
    timeSignature,
    bpm: tempos[0].bpm,
    durationSec,
    durationBeats: durationTicks / ppq,
    durationTicks,
    tracks,
    name,
    tickToSec: (tick) => tickToSec(tick, tempos, ppq),
    secToTick: (sec) => secToTick(sec, tempos, ppq, durationTicks),
    secToBeat(sec) {
      return secToTick(sec, tempos, ppq, durationTicks) / ppq;
    },
    beatToSec(beat) {
      return tickToSec(beat * ppq, tempos, ppq);
    },
  };
}

export async function parseMidiResponse(res) {
  if (!res.ok) throw new Error(`Could not load MIDI (${res.status})`);
  return parseMidi(await res.arrayBuffer());
}

/** Stack several parsed files on one timeline. Tempo/meter from the first. */
export function mergeSongs(parts) {
  if (!parts.length) throw new Error("No MIDI parts");
  const base = parts[0];
  const notes = [];
  const tracks = [];
  let durationBeats = 0;
  let durationSec = 0;
  parts.forEach((part, i) => {
    tracks.push({ index: i, name: part.name || `part ${i + 1}` });
    for (const n of part.notes) notes.push({ ...n, track: i });
    durationBeats = Math.max(durationBeats, part.durationBeats);
    durationSec = Math.max(durationSec, part.durationSec);
  });
  notes.sort((a, b) => a.startBeat - b.startBeat || a.pitch - b.pitch);
  return {
    ...base,
    notes,
    durationBeats,
    durationSec,
    durationTicks: durationBeats * base.ppq,
    tracks,
    name: parts.map((p) => p.name).filter(Boolean).join(" + ") || base.name,
  };
}
