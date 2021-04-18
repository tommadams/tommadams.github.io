import * as owp from '../third_party/Open-Web-Piano/OpenWebPiano.js';


const MAJOR_ROOT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const MINOR_ROOT_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
const ROOT_PITCHES     = [ 60,   61,  62,   63,  64,  65,   66,  67,   68,  57,   58,  59];


let chordQualities = [
  {
    name: 'maj7',
    pitches: [4, 7, 11],
    rootNames: MAJOR_ROOT_NAMES,
  },
  {
    name: '7',
    pitches: [4, 7, 10],
    rootNames: MAJOR_ROOT_NAMES,
  },
  {
    name: 'min7',
    pitches: [3, 7, 10],
    rootNames: MINOR_ROOT_NAMES,
  },
  {
    name: 'min7b5',
    pitches: [3, 6, 10],
    rootNames: MINOR_ROOT_NAMES,
  },
  {
    name: 'dim',
    pitches: [3, 6, 9],
    rootNames: MINOR_ROOT_NAMES,
  },
];


let playingPitches = [];
let initialized = false;
let playIntervalId = undefined;
let state = null;


function randInt(max) {
  return Math.floor(Math.random() * max);
}


function playChord() {
  for (let pitch of playingPitches) { owp.noteOff(pitch); }

  let rootPitch = ROOT_PITCHES[state.root];
  let bassPitch = rootPitch + parseInt(document.getElementById('root-8ve').value) * 12;

  owp.noteOn(bassPitch, 127);
  playingPitches = [bassPitch];

  for (let pitchOfs of state.quality.pitches) {
    owp.noteOn(rootPitch + pitchOfs, 127);
    playingPitches.push(rootPitch + pitchOfs);
  }
}


function playIntervalHandler() {
  let userBpm = parseInt(document.getElementById('bpm').value);
  if (state.bpm != userBpm) {
    state.bpm = userBpm;
    stopInterval();
    startInterval();
  }
  playChord();
}


async function start() {
  if (!initialized) {
    initialized = true;
    await owp.init(new AudioContext(), '../third_party/Open-Web-Piano');
    chooseNext();
  }

  stop();

  startInterval();
}


function chooseNext() {
  let choices = [];
  let qualitiesElem = document.getElementById('qualities-container');
  for (let i = 0; i < chordQualities.length; ++i) {
    let quality = chordQualities[i];
    let elem = document.getElementById('quality-' + quality.name);
    if (elem.checked) {
      choices.push(quality);
    }
  }
  if (choices.length == 0) {
    return;
  }

  state = {
    bpm: parseInt(document.getElementById('bpm').value),
    quality: choices[randInt(choices.length)],
    root: randInt(12),
  };
  window['state'] = state;
}

function isPlaying() {
  return state != null;
}


function startInterval() {
  stopInterval();
  playIntervalId = window.setInterval(playIntervalHandler, 1000 * 60 / state.bpm);
  updateVolume();
  playChord();
}


function stopInterval() {
  if (playIntervalId !== undefined) {
    window.clearInterval(playIntervalId);
    playIntervalId = undefined;
  }
}

function updateVolume() {
  if (owp.directGain != null) {
    let gain;
    let mute = document.getElementById('mute').checked;
    if (mute) {
      gain = 0;
    } else {
      let volume = parseInt(document.getElementById('volume').value)
      gain = volume / 100;
      gain = Math.max(gain, 0);
      gain = Math.min(gain, 1);
    }
    owp.directGain.gain.value = gain;
  }
}

function onNext() {
  let nextElem = document.getElementById('next');
  let answerElem = document.getElementById('answer');
  if (nextElem.innerText != 'Answer') {
    nextElem.innerText = 'Answer';
    answerElem.style.opacity = 0;
    chooseNext();
    start();
  } else {
    nextElem.innerText = 'Next';
    let rootIdx = ((state.root % 12) + 12) % 12;
    let rootName = state.quality.rootNames[rootIdx];
    answerElem.innerText = `${rootName} ${state.quality.name}`;
    answerElem.style.opacity = 1;
  }
}


document.getElementById('next').addEventListener('click', onNext)
document.getElementById('volume').addEventListener('input', updateVolume);
document.getElementById('mute').addEventListener('change', updateVolume);
document.getElementById('bpm').addEventListener('change', (e) => {
  if (isPlaying()) {
    state.bpm = e.target.value;
    stopInterval();
    startInterval();
  }
});


for (let id of ['volume', 'bpm', 'root-8ve']) {
  let rangeElem = document.getElementById(id);
  let valElem = document.getElementById(id + '-val');
  let suffix = valElem.innerText;
  let update = () => {
    valElem.innerText = `${rangeElem.value}${suffix}`;
  };
  rangeElem.addEventListener('input', update);
  update();
}

let qualitiesElem = document.getElementById('qualities-container');
for (let quality of chordQualities) {
  let elem = document.createElement('div');
  let id = 'quality-' + quality.name;

  let input = document.createElement('input');
  input.id = id;
  input.type = 'checkbox';
  input.name = id;
  input.checked = true;

  let label = document.createElement('label');
  label.innerText = quality.name;
  label.htmlFor = id;

  elem.appendChild(label);
  elem.appendChild(input);

  qualitiesElem.appendChild(elem);
}
