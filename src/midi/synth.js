/** Web Audio instruments. No soundfonts — small and switchable. */

export const INSTRUMENTS = {
  piano: {
    label: "Piano",
    osc: ["triangle", "sine"],
    mix: [1, 0.35],
    attack: 0.006,
    decay: 0.42,
    sustain: 0.16,
    release: 0.28,
    gain: 0.13,
    filter: 2800,
  },
  pad: {
    label: "Pad",
    osc: ["sawtooth", "sawtooth"],
    detune: [0, 9],
    mix: [0.7, 0.7],
    attack: 0.08,
    decay: 0.25,
    sustain: 0.7,
    release: 0.35,
    gain: 0.12,
    filter: 1300,
  },
  bass: {
    label: "Bass",
    osc: ["sine", "square"],
    mix: [1, 0.12],
    attack: 0.01,
    decay: 0.12,
    sustain: 0.75,
    release: 0.14,
    gain: 0.16,
    filter: 520,
  },
  pluck: {
    label: "Pluck",
    osc: ["triangle"],
    mix: [1],
    attack: 0.002,
    decay: 0.32,
    sustain: 0.0,
    release: 0.1,
    gain: 0.14,
    filter: 3400,
  },
  lead: {
    label: "Lead",
    osc: ["sawtooth"],
    mix: [1],
    attack: 0.035,
    decay: 0.12,
    sustain: 0.5,
    release: 0.22,
    gain: 0.07,
    filter: 2100,
    vibrato: 5,
  },
  bell: {
    label: "Bell",
    osc: ["sine", "sine", "sine"],
    ratios: [1, 2.76, 5.4],
    mix: [1, 0.35, 0.12],
    attack: 0.002,
    decay: 1.6,
    sustain: 0.0,
    release: 0.45,
    gain: 0.1,
    filter: 4200,
  },
};

function freqOf(pitch) {
  return 440 * 2 ** ((pitch - 69) / 12);
}

export class Synth {
  constructor() {
    this.ctx = null;
    this.id = "piano";
    this.file = new Map();
    this.live = new Map();
    this.want = null;
    this._pendingLive = new Set();
    this._resuming = false;
  }

  get patch() {
    return INSTRUMENTS[this.id] || INSTRUMENTS.piano;
  }

  get running() {
    return this.ctx && this.ctx.state === "running";
  }

  ensure() {
    if (!this.ctx) {
      const ctx = new AudioContext();
      const master = ctx.createGain();
      master.gain.value = 0.9;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 12;
      comp.ratio.value = 4;
      master.connect(comp);
      comp.connect(ctx.destination);
      this.ctx = ctx;
      this.master = master;
      ctx.onstatechange = () => {
        if (ctx.state === "running" && this.want) {
          const { notes, t } = this.want;
          this._applySync(notes, t);
        }
      };
    }
    if (this.ctx.state === "suspended" && !this._resuming) {
      this._resuming = true;
      this.ctx.resume().finally(() => {
        this._resuming = false;
      });
    }
    return this.ctx;
  }

  setInstrument(id) {
    if (!INSTRUMENTS[id]) return;
    const same = id === this.id;
    this.id = id;
    if (same) return;
    const heldLive = [...this.live.entries()].map(([key, v]) => ({
      key,
      pitch: v.pitch,
      vel: v.vel,
    }));
    for (const key of [...this.live.keys()]) this._release(this.live, key, 0.04);
    for (const n of heldLive) this._start(this.live, n.key, n.pitch, n.vel);
    this.silenceFile();
    if (this.want && this.running) this._applySync(this.want.notes, this.want.t);
  }

  noteOn(pitch, vel = 0.7) {
    const key = `live:${pitch}`;
    this.noteOff(pitch);
    this.ensure();
    this._pendingLive.add(pitch);
    const start = () => {
      if (!this._pendingLive.has(pitch)) return;
      this._pendingLive.delete(pitch);
      this._start(this.live, key, pitch, vel);
    };
    if (this.running) start();
    else this.ctx.resume().then(start);
  }

  noteOff(pitch) {
    this._pendingLive.delete(pitch);
    this._release(this.live, `live:${pitch}`);
  }

  syncFile(notes, t) {
    this.want = { notes, t };
    this.ensure();
    if (this.running) this._applySync(notes, t);
  }

  _applySync(notes, t) {
    const want = new Map();
    for (const n of notes) {
      if (n.startSec <= t && t < n.endSec) {
        want.set(`${n.startTick}:${n.pitch}:${n.track}`, n);
      }
    }
    for (const key of [...this.file.keys()]) {
      if (!want.has(key)) this._release(this.file, key, 0.03);
    }
    for (const [key, n] of want) {
      if (!this.file.has(key)) {
        this._start(this.file, key, n.pitch, n.velocity / 127, {
          skipAttack: t - n.startSec > 0.04,
          instrument: n.instrument,
        });
      }
    }
  }

  silenceFile() {
    this.want = null;
    for (const key of [...this.file.keys()]) this._release(this.file, key, 0.04);
  }

  panic() {
    this.want = null;
    this._pendingLive.clear();
    if (!this.ctx) {
      this.file.clear();
      this.live.clear();
      return;
    }
    const now = this.ctx.currentTime;
    for (const bucket of [this.file, this.live]) {
      for (const key of [...bucket.keys()]) {
        const v = bucket.get(key);
        bucket.delete(key);
        v.gain.gain.cancelScheduledValues(now);
        v.gain.gain.setValueAtTime(0.0008, now);
        for (const osc of v.oscs) {
          try {
            osc.stop(now + 0.01);
          } catch {
            /* already stopped */
          }
        }
      }
    }
  }

  releaseAll(seconds = 0.06) {
    for (const key of [...this.file.keys()]) this._release(this.file, key, seconds);
    for (const key of [...this.live.keys()]) this._release(this.live, key, seconds);
  }

  _start(bucket, key, pitch, vel, { skipAttack = false, instrument } = {}) {
    this.ensure();
    const ctx = this.ctx;
    const p = INSTRUMENTS[instrument] || this.patch;
    const now = ctx.currentTime;
    const freq = freqOf(pitch);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = p.filter;
    filter.Q.value = 0.8;
    const gain = ctx.createGain();
    const peak = p.gain * Math.max(0.12, Math.min(1, vel));
    const sus = Math.max(0.0008, peak * p.sustain);
    if (skipAttack && p.sustain > 0.05) {
      gain.gain.setValueAtTime(sus, now);
    } else {
      gain.gain.setValueAtTime(0.0008, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.001, peak), now + p.attack);
      gain.gain.exponentialRampToValueAtTime(sus, now + p.attack + p.decay);
    }
    filter.connect(gain);
    gain.connect(this.master);

    const oscs = [];
    const types = p.osc;
    for (let i = 0; i < types.length; i++) {
      const osc = ctx.createOscillator();
      osc.type = types[i];
      const ratio = (p.ratios && p.ratios[i]) || 1;
      osc.frequency.value = freq * ratio;
      if (p.detune) osc.detune.value = p.detune[i] || 0;
      const g = ctx.createGain();
      g.gain.value = (p.mix && p.mix[i]) || 1;
      osc.connect(g);
      g.connect(filter);
      if (p.vibrato && i === 0) {
        const lfo = ctx.createOscillator();
        const lg = ctx.createGain();
        lfo.frequency.value = p.vibrato;
        lg.gain.value = freq * 0.0035;
        lfo.connect(lg);
        lg.connect(osc.frequency);
        lfo.start(now);
        oscs.push(lfo);
      }
      osc.start(now);
      oscs.push(osc);
    }
    bucket.set(key, { pitch, vel, oscs, gain, filter, release: p.release });
  }

  _release(bucket, key, seconds) {
    const v = bucket.get(key);
    if (!v) return;
    bucket.delete(key);
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    const rel = seconds != null ? seconds : v.release ?? this.patch.release;
    v.gain.gain.cancelScheduledValues(now);
    v.gain.gain.setValueAtTime(Math.max(0.0008, v.gain.gain.value), now);
    v.gain.gain.exponentialRampToValueAtTime(0.0008, now + rel);
    for (const osc of v.oscs) {
      try {
        osc.stop(now + rel + 0.05);
      } catch {
        /* already stopped */
      }
    }
  }
}
