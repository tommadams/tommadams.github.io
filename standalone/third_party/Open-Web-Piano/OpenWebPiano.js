let ctx;
let convolver;
let directGain;
let convGain;
let convGainAfter;
let buffers;
let damper;
let sus = 0;
let sustained = [];
let notes = new Map();


async function loadBuffers(audioDir, urls) {
  let promises = [];
  for (let url of urls) {
    promises.push(
      fetch(`${audioDir}/${url}`)
        .then(response => response.arrayBuffer())
        .then(buf => ctx.decodeAudioData(buf)))
  }
  return Promise.all(promises);
}


function equalGain(val) {
  return Math.cos((1.0 - val) * 0.5 * Math.PI);
}


class Note {
  constructor(val) {
    this.noteA        = ctx.createBufferSource();
    this.noteB        = ctx.createBufferSource();
    this.gainA        = ctx.createGain();
    this.gainB        = ctx.createGain();
    this.gain         = ctx.createGain();
    this.biquadFilter = ctx.createBiquadFilter();
    this.biquadFilter.type = 'lowpass';

    this.biquadFilter.connect(directGain);
    this.gain.connect(this.biquadFilter);
    this.gainA.connect(this.gain);
    this.noteA.connect(this.gainA);
    this.gainB.connect(this.gain);
    this.noteB.connect(this.gainB);

    if (val < 90) {
      this.damp = ctx.createBufferSource();
      this.damp.buffer = damper;
      this.damp.connect(directGain);
    }
  }

  on(bufA, bufB, rateA, rateB, filtFreq, gain_A, gain_B, gain_, delay) {
    let when = delay > 0 ? ctx.currentTime + delay : 0;
    this.noteA.buffer = buffers[bufA];
    this.noteA.playbackRate.value = rateA;
    this.biquadFilter.frequency.value = filtFreq;
    this.gainA.gain.value = gain_A;
    this.gain.gain.value = gain_;

    if (buffers[bufB]) {
      this.noteB.buffer = buffers[bufB];
      this.noteB.playbackRate.value = rateB;
      this.gainB.gain.value = gain_B;
      this.noteB.start(when);
    } else {
      this.noteB = null;
    }
    this.noteA.start(when);
  }

  off(noteNumber) {
    this.noteA.stop(0);
    this.noteB.stop(0);
  }
}


function isValidNote(noteNumber) {
  return noteNumber > 20 && noteNumber < 109;
}


export function noteOn(noteNumber, velocity, delay=0) {
  if (!isValidNote(noteNumber)) { return; }

  let note = notes.get(noteNumber);
  if (note) {
    note.gain.gain.setTargetAtTime(0, 0, 1.1);
    note.noteA.stop(ctx.currentTime + 2);
    note.noteB.stop(ctx.currentTime + 2);
    note.damp = null;
    sustained.splice(sustained.indexOf(noteNumber), 1);
  }

  let bufNumA = Math.floor((noteNumber - 21) / 12);
  let bufNumB = bufNumA + 1;
  let noteNum = bufNumA * 12 + 21;

  let freq = 2 ** ((noteNumber - 69) / 12) * 440;
  let velo = velocity / 127;
  let harmQuant = 20000 / freq;
  let filtFreq = freq * (2 - (noteNumber - 21) / 50) + freq * harmQuant * Math.pow(velo, 4);

  let gain_A = equalGain( 1 - ((noteNumber - 21) % 12) / 11);
  let rate_A = Math.pow(2, (noteNumber - noteNum)/12);
  let rate_B = 0;
  let gain_B = 0;
  let gain_ = velo ** 1.4;
  if (bufNumB < 8) {
    rate_B = Math.pow(2, (noteNumber-(noteNum+12))/12);
    gain_B = 1 - gain_A;
  }

  note = new Note(noteNumber)
  note.on(bufNumA, bufNumB, rate_A, rate_B, filtFreq, gain_A, gain_B, gain_, delay);
  notes.set(noteNumber, note);
}


export function noteOff(noteNumber) {
  if (!isValidNote(noteNumber)) { return; }

  if (!sus) {
    const DELAY = 0.03;
    const DECAY = 0.08;
    let note = notes.get(noteNumber);
    if (note) {
      notes.delete(noteNumber);
      note.gain.gain.setTargetAtTime(0, ctx.currentTime + DELAY, DECAY);
      note.noteA.stop(ctx.currentTime + DELAY + 5 * DECAY);
      note.noteB.stop(ctx.currentTime + DELAY + 5 * DECAY);
      note.damp.start(0);
    }
  } else {
    sustained.push(noteNumber);
  }
}


export function allNotesOff() {
  for (let noteNumber of Array.from(notes.keys())) {
    noteOff(noteNumber);
  }
}


export function sustain(val) {
  if (val == 127) {
    sus = true;
    convGain.gain.value = 1;
    convGainAfter.gain.value = 1;
  } else if (val == 0) {
    sus = false;
    convGain.gain.value = 0.0;
    convGainAfter.gain.value = 0;
    for (let noteNumber of sustained) {
      noteOff(noteNumber);
    }
    sustained = [];
  }
}


export async function init(audioCtx, owpDir) {
  ctx = audioCtx;
  convolver = ctx.createConvolver();
  directGain = ctx.createGain();
  convGain = ctx.createGain();
  convGainAfter = ctx.createGain();

  convGain.connect(convolver);
  convolver.connect(convGainAfter);
  convGainAfter.connect(ctx.destination);
  directGain.connect(ctx.destination);
  directGain.connect(convGain);
  directGain.gain.value = 0.5;
  convGain.gain.value = 0;
  convGainAfter.gain.value = 0;

  buffers = await loadBuffers(`${owpDir}/audio`, [
      'piano/21.mp3', 'piano/33.mp3', 'piano/45.mp3', 'piano/57.mp3',
      'piano/69.mp3', 'piano/81.mp3', 'piano/93.mp3', 'piano/105.mp3',
      'damper.mp3', 'piano_impulse.mp3',
  ]);
  damper = buffers[8];
  convolver.buffer = buffers[9];
}

export {directGain}

