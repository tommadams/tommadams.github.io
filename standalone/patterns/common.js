const BORDER = 6;
const PITCH_DIMS = [105, 68];
const PITCH_MID = [PITCH_DIMS[0]/2, PITCH_DIMS[1]/2];
const AREA_DIMS = [16.5, 40.32];
const SIX_YARD_DIMS = [5.5, 18.32];
const PENALTY_SPOT_OFS = 11;
const CIRCLE_RADIUS = 9.15;
const GOAL_WIDTH = 7.32;
const SPOT_SIZE = 0.3;
const LINE_WIDTH = 3;
const JERSEY_SIZE = 5;
const BALL_SIZE = 3.5;
const PIXEL_RATIO = window.devicePixelRatio | 1;

let IMGS = {
  blue:   'jersey_blue.png',
  orange: 'jersey_orange.png',
  ball:   'ball.png',
};


let S = 0;

let canvas = null;
let ctx = null;
let mouseDown = false;


// Convert from HTML coords to pitch coord
function transformHtmlCoords(x, y) {
  x = x * PIXEL_RATIO / S - BORDER;
  y = y * PIXEL_RATIO / S - BORDER;
  return [x, y];
}

function transformCoords(x, y) {
  x = (BORDER + x) * S;
  y = (BORDER + y) * S;
  return [x, y];
}

function transformSize(w, h) {
  w = w * S;
  h = h * S;
  return [w, h];
}

function moveTo(x, y) {
  [x, y] = transformCoords(x, y);
  ctx.moveTo(x, y);
}

function lineTo(x, y) {
  [x, y] = transformCoords(x, y);
  ctx.lineTo(x, y);
}

function drawRect(x, y, w, h) {
  let cw = canvas.width;
  let ch = canvas.height;

  [x, y] = transformCoords(x, y);
  [w, h] = transformSize(w, h);

  ctx.moveTo(x, y);     ctx.lineTo(x+w, y);
  ctx.moveTo(x+w, y);   ctx.lineTo(x+w, y+h);
  ctx.moveTo(x+w, y+h); ctx.lineTo(x, y+h);
  ctx.moveTo(x, y+h);   ctx.lineTo(x, y);
}

function fillRect(x, y, w, h) {
  let cw = canvas.width;
  let ch = canvas.height;

  [x, y] = transformCoords(x, y);
  [w, h] = transformSize(w, h);

  ctx.fillRect(x, y, w, h);
}

function drawCircle(x, y, r) {
  [x, y] = transformCoords(x, y);
  r *= S;
  ctx.moveTo(x + r, y);
  ctx.arc(x, y, r, 0, 2 * Math.PI);
}

function arc(x, y, r, begin=0, end=2*Math.PI, anticlockwise=false) {
  [x, y] = transformCoords(x, y);
  r *= S;
  ctx.arc(x, y, r, begin, end, anticlockwise);
}

function beginPath() { ctx.beginPath() }
function stroke() { ctx.stroke() }
function fill() { ctx.fill() }

function drawImage(img, x, y, s) {
  [x, y] = transformCoords(x, y);
  s *= S;
  ctx.drawImage(img, x - 0.5*s, y - 0.5*s, s, s);
}

function drawText(str, x, y, s) {
  [x, y] = transformCoords(x, y);
  s *= S;
  ctx.font = `${s}px sans-serif`;
  ctx.fillText(str, x, y);
}

function drawPitch() {
  let contentWidth = document.body.offsetWidth;
  let contentHeight = document.body.offsetHeight;

  let scale = contentWidth / (BORDER * 2 + PITCH_DIMS[0]);

  let canvasRatio = (BORDER * 2 + PITCH_DIMS[0]) / (BORDER * 2 + PITCH_DIMS[1]);
  let contentRatio = contentWidth / contentHeight;

  let canvasWidth, canvasHeight;
  if (canvasRatio > contentRatio) {
    canvasWidth = contentWidth;
    canvasHeight = canvasWidth / canvasRatio;
  } else {
    canvasHeight = contentHeight;
    canvasWidth = canvasHeight * canvasRatio;
  }
  canvasWidth = canvasWidth | 0;
  canvasHeight = canvasHeight | 0;

  canvas.style.width = `${canvasWidth}px`;
  canvas.style.height = `${canvasHeight}px`;
  canvas.width = canvasWidth * PIXEL_RATIO;
  canvas.height = canvasHeight * PIXEL_RATIO;
  ctx = canvas.getContext('2d');

  S = canvas.width / (BORDER * 2 + PITCH_DIMS[0]);
  S = canvas.height / (BORDER * 2 + PITCH_DIMS[1]);

  ctx.lineCap = 'round';

  // Draw grass.
  ctx.fillStyle = '#8cb441';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let PITCH_COLS = ['#8cb441', '#83ad3d', '#7ea83a', '#77a237'];
  let PATTERN_SIZE = 8;
  let bx = -Math.ceil((PITCH_MID[0] + BORDER) / PATTERN_SIZE);
  let by = -Math.ceil((PITCH_MID[1] + BORDER) / PATTERN_SIZE);
  let ex = bx + PITCH_DIMS[0] + 2*BORDER;
  let ey = by + PITCH_DIMS[1] + 2*BORDER;
  for (let y = by; y < ey; ++y) {
    for (let x = bx; x < ex; ++x) {
      ctx.fillStyle = PITCH_COLS[((x - bx) & 1) + ((y - by) & 1) * 2];
      fillRect(PITCH_MID[0] + x * PATTERN_SIZE, PITCH_MID[1] + y * PATTERN_SIZE, PATTERN_SIZE, PATTERN_SIZE);
    }
  }

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = LINE_WIDTH * PIXEL_RATIO;

  beginPath();
  // Pitch boundary.
  drawRect(0, 0, PITCH_DIMS[0], PITCH_DIMS[1]);

  // Half-way line.
  moveTo(PITCH_MID[0], 0);
  lineTo(PITCH_MID[0], PITCH_DIMS[1]);

  // Center circle.
  drawCircle(PITCH_MID[0], PITCH_MID[1], CIRCLE_RADIUS);

  // 6 yard boxes.
  drawRect(0, PITCH_MID[1] - SIX_YARD_DIMS[1] / 2, SIX_YARD_DIMS[0], SIX_YARD_DIMS[1]);
  drawRect(PITCH_DIMS[0] - SIX_YARD_DIMS[0], PITCH_MID[1] - SIX_YARD_DIMS[1] / 2, SIX_YARD_DIMS[0], SIX_YARD_DIMS[1]);

  // Penalty areas.
  drawRect(0, PITCH_MID[1] - AREA_DIMS[1] / 2, AREA_DIMS[0], AREA_DIMS[1]);
  drawRect(PITCH_DIMS[0] - AREA_DIMS[0], PITCH_MID[1] - AREA_DIMS[1] / 2, AREA_DIMS[0], AREA_DIMS[1]);
  stroke();

  // Goals.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  beginPath();
  drawRect(0, PITCH_MID[1] - GOAL_WIDTH/2, -2, GOAL_WIDTH);
  drawRect(PITCH_DIMS[0], PITCH_MID[1] - GOAL_WIDTH/2, 2, GOAL_WIDTH);
  stroke();
  fillRect(0, PITCH_MID[1] - GOAL_WIDTH/2, -2, GOAL_WIDTH);
  fillRect(PITCH_DIMS[0], PITCH_MID[1] - GOAL_WIDTH/2, 2, GOAL_WIDTH);

  // Spots.
  ctx.fillStyle = '#fff';
  beginPath();
  drawCircle(PENALTY_SPOT_OFS, PITCH_MID[1], SPOT_SIZE);
  drawCircle(PITCH_DIMS[0] - PENALTY_SPOT_OFS, PITCH_MID[1], SPOT_SIZE);
  drawCircle(PITCH_MID[0], PITCH_MID[1], SPOT_SIZE);
  fill();

  // Penalty spot arc.
  let theta = Math.acos((AREA_DIMS[0] - PENALTY_SPOT_OFS) / CIRCLE_RADIUS);
  beginPath();
  moveTo(AREA_DIMS[0], PITCH_MID[1]);
  arc(PENALTY_SPOT_OFS, PITCH_MID[1], CIRCLE_RADIUS, -theta, theta);

  moveTo(PITCH_DIMS[0] - AREA_DIMS[0], PITCH_MID[1]);
  arc(PITCH_DIMS[0] - PENALTY_SPOT_OFS, PITCH_MID[1], CIRCLE_RADIUS, Math.PI - theta, Math.PI + theta);
  stroke();
}

function getClosestObj(objs, x, y) {
  let closest = null;
  let closestDisSqr = 1.0e10;
  for (let obj of objs) {
    let dx = obj.x - x;
    let dy = obj.y - y;
    let disSqr = dx * dx + dy * dy;
    if (disSqr < closestDisSqr) {
      closest = obj;
      closestDisSqr = disSqr;
    }
  }
  return closest;
}

function distance(a, b) {
  let dx = a.x - b.x;
  let dy = a.y - b.y;
  return Math.sqrt(dx*dx + dy*dy);
}

function getEventPos(e) {
  if (e.changedTouches) e = e.changedTouches[0];
  return transformHtmlCoords(e.clientX, e.clientY);
}

