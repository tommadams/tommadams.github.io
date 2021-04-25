import * as owp from '../third_party/Open-Web-Piano/OpenWebPiano.js';


const MAJOR_ROOT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const MINOR_ROOT_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const ROOT_PITCHES     = [ 60,   61,  62,   63,  64,  65,   66,  67,   68,  57,   58,  59];
const SCALE_NOTES = {
  'C' : ['C' , 'D' , 'E' , 'F' , 'G' , 'A' , 'B' ],
  'C#': ['C#', 'D#', 'E#', 'F#', 'G#', 'A#', 'B#'],
  'Db': ['Db', 'Eb', 'F' , 'Gb', 'Ab', 'Bb', 'C' ],
  'D' : ['D' , 'E' , 'F#', 'G' , 'A' , 'B' , 'C#'],
  'Eb': ['Eb', 'F' , 'G' , 'Ab', 'Bb', 'C' , 'D' ],
  'E' : ['E' , 'F#', 'G#', 'A' , 'B' , 'C#', 'D#'],
  'F' : ['F' , 'G' , 'A' , 'Bb', 'C' , 'D' , 'E' ],
  'F#': ['F#', 'G#', 'A#', 'B' , 'C#', 'D#', 'E#'],
  'Gb': ['Gb', 'Ab', 'Bb', 'Cb', 'Db', 'Eb', 'F' ],
  'G' : ['G' , 'A' , 'B' , 'C' , 'D' , 'E' , 'F#'],
  'Ab': ['Ab', 'Bb', 'C' , 'Db', 'Eb', 'F' , 'G' ],
  'A' : ['A' , 'B' , 'C#', 'D' , 'E' , 'F#', 'G#'],
  'Bb': ['Bb', 'C' , 'D' , 'Eb', 'F' , 'G' , 'A' ],
  'B' : ['B' , 'C#', 'D#', 'E' , 'F#', 'G#', 'A#'],
};
const VELOCITY = 117;
const EXTENSION_VELOCITY = 127;
const NOTE_NORMALS = new Map([['Cb', 'B'], ['B#', 'C'], ['E#', 'F'], ['Fb', 'E']]);
const SHARP_ENHARMONICS = new Map([['Db', 'C#'], ['Eb', 'D#'], ['Gb', 'F#'], ['Ab', 'G#'], ['Bb', 'A#']]);
const FLAT_ENHARMONICS  = new Map([['C#', 'Db'], ['D#', 'Eb'], ['F#', 'Gb'], ['G#', 'Ab'], ['A#', 'Bb']]);
const NOTE_INDICES = new Map([
  ['C', 0],
  ['C#', 1], ['Db', 1],
  ['D', 2],
  ['D#', 3], ['Eb', 3],
  ['E', 4],
  ['F', 5],
  ['F#', 6], ['Gb', 6],
  ['G', 7],
  ['G#', 8], ['Ab', 8],
  ['A', 9],
  ['A#', 10], ['Bb', 10],
  ['B', 11],
]);
const SHARP_NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const CHORD_QUALITIES = new Map([
  ['maj7', {
    pitches: [4, 7, 11],
    nine: 14,
    rootNames: MAJOR_ROOT_NAMES,
    scales: [
      { root: 0, name: 'major bebop', notes: [1, 2, 3, 4, 5, ['#', -5], 6, 7] },
    ],
  }],
  ['7', {
    pitches: [4, 7, 10],
    nine: 14,
    rootNames: MAJOR_ROOT_NAMES,
    scales: [
      { root: 0, name: 'dominant bebop', notes: [1, 2, 3, 4, 5, 6, ['b', 7], -7] },
    ],
  }],
  ['min7', {
    pitches: [3, 7, 10],
    nine: 14,
    rootNames: MINOR_ROOT_NAMES,
    scales: [
      { root: 0, name: 'dorian', notes: [1, 2, ['b', 3], -3, 4, 5, 6, ['b', 7]] },
    ],
  }],
  ['min7b5', {
    pitches: [3, 6, 10],
    nine: 14,
    rootNames: MINOR_ROOT_NAMES,
    scales: [
      { root: -2, name: 'harmonic minor', notes: [1, ['b', 2], ['b', 3], 4, ['b', 5], 6, ['b', 7]],
        constraint: () => !E('nine').checked },
      { root: 3, name: 'melodic minor', notes: [1, 2, ['b', 3], 4, ['b', 5], ['b', 6], ['b', 7]],
        constraint: () => E('nine').checked },
    ],
  }],
  ['dim', {
    pitches: [3, 6, 9],
    nine: 14,
    rootNames: MINOR_ROOT_NAMES,
    scales: [
      { root: 0, name: 'diminished', notes: [1, 2, ['b', 3], 4, ['b', 5], ['b', 6], 6, 7] },
    ],
  }],
]);
for (let [name, quality] of CHORD_QUALITIES) { quality.name = name; }


// ID for the Interval timer that triggers notes.
let playIntervalId = undefined;

// Current playing state: root, chord quality, speed, etc.
let state = null;

// Audio context time at which the current arpeggio (if any) will finish.
// Used to prevent notes retriggering in the interval callback if an arpeggio
// hasn't yet finished.
let arpeggioEndTime = 0;

// The audio context used by OpenWebPiano, from which we get the current time.
let audioCtx = null;

// List of pending chord roots, managed by the nextRoot function.
let pendingRoots = [];

// List of pending qualities, managed by the nextQuality function.
let pendingQualities = [];

let AC = window.AudioContext || window.webkitAudioContext;
if (AC === undefined) {
  let container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'center';
  container.style.backgroundColor = '#fff';
  let content = document.createElement('div');
  content.innerHTML = 'Your browser does\'t support Web Audio.<br>Please check supported browsers <a href="https://caniuse.com/?search=Web%20Audio%20API">here</a>.';
  container.appendChild(content);
  document.body.appendChild(container);
  throw new Error('AudioContext not defined');
}



function parseCookies() {
  let cookies = new Map();
  for (let cookie of document.cookie.split(';')) {
    let idx = cookie.indexOf('=');
    let key = cookie.substring(0, idx).trim();
    let val = cookie.substring(idx + 1);
    cookies.set(key, val);
  }
  return cookies;
}


function saveSettings() {
  let existingCookies = parseCookies();
  let updatedCookies = new Set();
  for (let elem of document.querySelectorAll('input')) {
    if (!elem.id) { continue; }
    if (elem.type == 'range') {
      let cookie = `${elem.id}=${elem.value}`;
      document.cookie = cookie;
      updatedCookies.add(elem.id);
    } else if (elem.type == 'checkbox') {
      let cookie = `${elem.id}=${elem.checked}`;
      document.cookie = cookie;
      updatedCookies.add(elem.id);
    }
  }

  for (let [k, v] of existingCookies) {
    if (!updatedCookies.has(k)) {
      console.log(`deleting cookie ${k}`);
      document.cookie = `${k}=; Max-Age=0`;
    }
  }
}


function loadSettings() {
  let existingCookies = parseCookies();
  for (let elem of document.querySelectorAll('input')) {
    if (!elem.id) { continue; }
    if (elem.type == 'range') {
      let val = existingCookies.get(elem.id);
      if (val) {
        elem.value = val;
        updateRangeValue(elem);
      }
      elem.addEventListener('change', saveSettings);
    } else if (elem.type == 'checkbox') {
      let val = existingCookies.get(elem.id);
      if (val) {
        elem.checked = val == 'true';
      }
      elem.addEventListener('change', saveSettings);
    }
  }
}


function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}


function nextRoot() {
  if (pendingRoots.length == 0) {
    for (let i = 0; i < 12; ++i) { pendingRoots.push(i); }
    shuffleArray(pendingRoots);
  }
  return pendingRoots.pop();
}


function nextQuality() {
  let qualityElems = document.querySelectorAll('#qualities-container input');
  if (qualityElems.length == 0) { throw new Error('couldn\'t find any quality elements'); }

  let anyChecked = false;
  for (let elem of qualityElems) {
    if (elem.checked) {
      anyChecked = true;
      break;
    }
  }
  if (!anyChecked) { return null; }

  for (let i = 0; i < 1000; ++i) {
    if (pendingQualities.length == 0) {
      for (let elem of qualityElems) {
        pendingQualities.push(elem);
      }
      shuffleArray(pendingQualities);
    }
    let elem = pendingQualities.pop();
    if (elem.checked) {
      let name = elem.id.split('-')[1];
      let quality = CHORD_QUALITIES.get(name);
      if (quality == undefined) { throw new Error(`couldn't find chord quality named "${name}"`); }
      return quality;
    }
  }

  throw new Error('something went badly wrong while trying to choose the next chord quality');
}


function E(id) { return document.getElementById(id); }



function normalizeNote(noteName) {
  if (noteName.length == 1) { return noteName; }

  let idx = NOTE_INDICES.get(noteName[0]);
  for (let i = 1; i < noteName.length; ++i) {
    let accidental = noteName[i];
    if (accidental == '#') {
      idx = (idx + 1) % 12;
    } else {
      idx = (idx + 11) % 12;
    }
  }

  if (noteName[1] == 'b') {
    return FLAT_NOTE_NAMES[idx];
  } else {
    return SHARP_NOTE_NAMES[idx];
  }
}


function flatNote(noteName) {
  return normalizeNote(noteName + 'b');
}


function sharpNote(noteName) {
  return normalizeNote(noteName + '#');
}


function randInt(max) {
  return Math.floor(Math.random() * max);
}


function playChord() {
  owp.allNotesOff();

  let rootPitch = ROOT_PITCHES[state.root] - 12;

  let notes = [];
  if (E('root-hint').checked) {
    notes.push([rootPitch - 12, VELOCITY]);
  } else {
    notes.push([rootPitch, VELOCITY]);
  }

  for (let pitchOfs of state.quality.pitches) {
    notes.push([rootPitch + pitchOfs, VELOCITY]);
  }

  if (E('nine').checked) {
    notes.push([rootPitch + state.quality.nine, EXTENSION_VELOCITY]);
  }

  let delay = 0;
  let arpDelay = parseInt(E('arpeggio').value) / 10;
  for (let [pitch, vel] of notes) {
    owp.noteOn(pitch, vel, delay);
    delay += arpDelay;
  }

  if (arpDelay > 0) {
    arpeggioEndTime = audioCtx.currentTime + arpDelay * (notes.length + 1);
  } else {
    arpeggioEndTime = 0;
  }
}


function playIntervalHandler() {
  if (arpeggioEndTime > 0 && audioCtx.currentTime < arpeggioEndTime) {
    return;
  }

  let userBpm = parseInt(E('bpm').value);
  if (state.bpm != userBpm) {
    state.bpm = userBpm;
    play();
  } else {
    playChord();
  }
}


function chooseNext() {
  let quality = nextQuality();
  let root = nextRoot();
  if (quality == null || root == null) { return; }

  state = {
    bpm: parseInt(E('bpm').value),
    quality: quality,
    root: root,
  };
}


function isPlaying() {
  return state != null;
}


function play() {
  pause();
  let playElem = E('pause');
  playElem.classList.remove('play');
  playElem.classList.add('pause');

  playIntervalId = window.setInterval(playIntervalHandler, 1000 * 60 / state.bpm);
  updateVolume();
  playChord();
}


function pause() {
  let playElem = E('pause');
  playElem.classList.remove('pause');
  playElem.classList.add('play');

  owp.allNotesOff();
  if (playIntervalId !== undefined) {
    window.clearInterval(playIntervalId);
    playIntervalId = undefined;
  }
}

function updateVolume() {
  if (owp.directGain != null) {
    let volume = parseInt(E('volume').value)
    let gain = volume / 100;
    gain = Math.max(gain, 0);
    gain = Math.min(gain, 1);
    owp.directGain.gain.value = gain;
  }
}


E('begin').addEventListener('click', () => {
  E('begin').classList.add('display-none');
  E('next').classList.remove('display-none');
  E('pause').classList.remove('display-none');

  audioCtx = new AC();
  owp.init(audioCtx, '../third_party/Open-Web-Piano').then(() => {
    chooseNext();
    play();
  });
});


E('pause').addEventListener('click', (e) => {
  if (e.target.classList.contains('play')) {
    play();
  } else {
    pause();
  }
});


function updateAnswer() {
  let createLine = (type, value) => {
    let typeElem = document.createElement('span');
    typeElem.className = 'answer-type';
    typeElem.innerText = type + ': ';
    let valueElem = document.createElement('span');
    valueElem.className = 'answer-value';
    valueElem.innerText = value;
    let lineElem = document.createElement('div');
    lineElem.appendChild(typeElem);
    lineElem.appendChild(valueElem);
    return lineElem;
  };

  let answerElem = E('answer');
  if (answerElem.style.opacity != '1') { return; }

  let rootIdx = ((state.root % 12) + 12) % 12;
  let rootName = state.quality.rootNames[rootIdx];
  answerElem.innerText = '';
  answerElem.appendChild(
    createLine('Chord', `${rootName} ${state.quality.name}`));

  for (let scale of state.quality.scales) {
    if (scale.constraint && !scale.constraint()) { continue; }

    let scaleNotes = [];
    let scaleRootIdx = (((rootIdx + scale.root) % 12) + 12) % 12;
    let scaleRootName = state.quality.rootNames[scaleRootIdx];
    for (let note of scale.notes) {
      let noteName;
      let passing = false;
      let accidental = '';
      if (Array.isArray(note)) {
        accidental = note[0];
        note = note[1];
      }
      if (note < 0) {
        passing = true;
        note = -note;
      }
      noteName = SCALE_NOTES[rootName][note - 1];
      if (accidental == '#') {
        noteName = sharpNote(noteName);
      } else if (accidental == 'b') {
        noteName = flatNote(noteName);
      }
      if (passing) {
        noteName = `(${noteName})`;
      }
      scaleNotes.push(noteName);
    }
    answerElem.appendChild(
      createLine('Scale', `${scaleRootName} ${scale.name} - ${scaleNotes.join(' ')}`));
  }
}


E('next').addEventListener('click', () => {
  let nextElem = E('next');
  let answerElem = E('answer');
  if (nextElem.innerText != 'Answer') {
    nextElem.innerText = 'Answer';
    answerElem.style.opacity = 0;
    chooseNext();
    play();
  } else {
    nextElem.innerText = 'Next';
    answerElem.style.opacity = 1;
    updateAnswer();
  }
});


E('volume').addEventListener('input', updateVolume);


E('bpm').addEventListener('change', (e) => {
  if (isPlaying()) {
    state.bpm = e.target.value;
    play();
  }
});


E('nine').addEventListener('change', updateAnswer);


function updateRangeValue(rangeElem) {
  E(rangeElem.id + '-val').innerText = `${rangeElem.value}`;
}


for (let id of ['volume', 'bpm', 'arpeggio']) {
  E(id).addEventListener('input', (e) => updateRangeValue(e.target));
  E(id).addEventListener('change', (e) => updateRangeValue(e.target));
  updateRangeValue(E(id));
}


let qualitiesElem = E('qualities-container');
for (let [name, quality] of CHORD_QUALITIES) {
  let elem = document.createElement('div');
  let id = 'quality-' + name;

  let input = document.createElement('input');
  input.id = id;
  input.type = 'checkbox';
  input.name = id;
  input.checked = true;

  let label = document.createElement('label');
  label.innerText = name;
  label.htmlFor = id;
  label.className = 'pointer';

  elem.appendChild(label);
  elem.appendChild(input);

  qualitiesElem.appendChild(elem);
}


loadSettings();
saveSettings();
