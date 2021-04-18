let context;
let convolver;
let directGain;
let convGain;
let convGainAfter;
let buffers;
let damper;
let sus = 0;
let sustained = [];
let notes;


async function loadBuffers(audioDir, urls) {
  let promises = [];
  for (let url of urls) {
    promises.push(
      fetch(`${audioDir}/${url}`)
        .then(response => response.arrayBuffer())
        .then(buf => context.decodeAudioData(buf)))
  }
  return Promise.all(promises);
}


function equalGain(val) {
  return Math.cos((1.0 - val) * 0.5 * Math.PI);
}


class Note {
  constructor(val) {
    this.noteA        = context.createBufferSource();
    this.noteB        = context.createBufferSource();
    this.gainA        = context.createGain();
    this.gainB        = context.createGain();
    this.gain         = context.createGain();
    this.biquadFilter = context.createBiquadFilter();
    this.biquadFilter.type = 'lowpass';

    this.biquadFilter.connect(directGain);
    this.gain.connect(this.biquadFilter);
    this.gainA.connect(this.gain);
    this.noteA.connect(this.gainA);
    this.gainB.connect(this.gain);
    this.noteB.connect(this.gainB);

    if (val < 90) {
      this.damp = context.createBufferSource();
      this.damp.buffer = damper;
      this.damp.connect(directGain);
    }
  }

  on(bufA, bufB, rateA, rateB, filtFreq, gain_A, gain_B, gain_) {
    this.noteA.buffer = buffers[bufA];
    this.noteA.playbackRate.value = rateA;
    this.biquadFilter.frequency.value = filtFreq;
    this.gainA.gain.value = gain_A;
    this.gain.gain.value = gain_;

    if (buffers[bufB]) {
      this.noteB.buffer = buffers[bufB];
      this.noteB.playbackRate.value = rateB;
      this.gainB.gain.value = gain_B;
      this.noteB.start(0);
    } else {
      this.noteB = null;
    }
    this.noteA.start(0);
  }

  off(noteNumber) {
    this.noteA.stop(0);
    this.noteB.stop(0);
  }
}


function isValidNote(noteNumber) {
  return noteNumber > 20 && noteNumber < 109;
}


export function noteOn(noteNumber, velocity) {
  if (!isValidNote(noteNumber)) { return; }

  if (notes[noteNumber]) {
    notes[noteNumber].gain.gain.setTargetAtTime(0.0, context.currentTime, 1.1);
    notes[noteNumber].noteA.stop(context.currentTime + 2);
    notes[noteNumber].noteB.stop(context.currentTime + 2);
    notes[noteNumber].damp = null;
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
  notes[noteNumber] = new Note(noteNumber);
  notes[noteNumber].on(bufNumA, bufNumB, rate_A, rate_B, filtFreq, gain_A, gain_B, gain_);
}


export function noteOff(noteNumber) {
  if (!isValidNote(noteNumber)) { return; }

  if (!sus) {
    if (noteNumber < 90) {
      notes[noteNumber].gain.gain.setTargetAtTime(0.0, context.currentTime + 0.03, 0.08);
      notes[noteNumber].noteA.stop(context.currentTime + 2);
      notes[noteNumber].noteB.stop(context.currentTime + 2);
      notes[noteNumber].damp.start(0);
    }
    delete notes[noteNumber];
  } else {
    sustained.push(noteNumber);
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
    for (let i = 0; i < sustained.length; i++) {
      if (notes[sustained[i]]) {
        noteOff(sustained[i]);
      }
    }
    sustained = [];
  }
}


export async function init(ctx, owpDir) {
  context = ctx;
  convolver = context.createConvolver();
  directGain = context.createGain();
  convGain = context.createGain();
  convGainAfter = context.createGain();

  convGain.connect(convolver);
  convolver.connect(convGainAfter);
  convGainAfter.connect(context.destination);
  directGain.connect(context.destination);
  directGain.connect(convGain);
  directGain.gain.value = 0.5;
  convGain.gain.value = 0;
  convGainAfter.gain.value = 0;
  notes = new Object();

  buffers = await loadBuffers(`${owpDir}/audio`, [
      'piano/21.mp3', 'piano/33.mp3', 'piano/45.mp3', 'piano/57.mp3',
      'piano/69.mp3', 'piano/81.mp3', 'piano/93.mp3', 'piano/105.mp3',
      'damper.mp3', 'piano_impulse.mp3',
  ]);
  damper = buffers[8];
  convolver.buffer = buffers[9];
}

export {directGain}

