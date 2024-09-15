let ATTACK_FORMATIONS = [
  [ [  1.71,  27.54], [ 12.04,  15.85], [  4.02,   3.75], [ 19.38,  39.64], [ 27.28,  29.72], [ 49.30,  31.48], [ 28.23,  10.00], [ 48.08,  51.33], [ 64.26,  31.21] ],
  [ [  3.00,  34.00], [ 22.52,  33.25], [ 24.50,  11.60], [ 24.42,  55.82], [ 42.64,  21.97], [ 64.67,  21.83], [ 48.50,   4.00], [ 50.39,  38.92], [ 75.96,  33.66] ],
  [ [  3.00,  34.00], [ 47.78,  33.85], [ 53.43,   8.69], [ 61.94,  50.65], [ 69.83,  21.46], [ 80.84,   3.89], [100.25,   3.80], [101.57,  40.63], [ 90.49,  17.69] ],
  [ [  3.00,  34.00], [  7.84,  34.15], [  6.60,  22.70], [  6.53,  44.22], [ 19.99,  34.00], [ 37.87,  33.85], [ 28.36,  10.55], [ 28.49,  56.36], [ 66.57,  33.66] ],
  [ [  3.00,  34.00], [ 21.50,  34.00], [ 24.50,  11.60], [ 24.50,  56.40], [ 40.50,  34.00], [ 64.50,  34.00], [ 48.75,  11.64], [ 48.07,  55.14], [ 77.32,  34.07] ],
  [ [  3.07,  34.34], [ 46.85,  33.85], [ 56.77,  13.13], [ 56.64,  53.10], [ 67.20,  33.85], [ 84.09,  33.30], [ 98.70,  18.60], [ 99.16,  48.94], [ 99.78,  33.22] ],
  [ [  2.12,  39.37], [ 12.45,  50.11], [ 19.11,  23.60], [  4.70,  61.80], [ 27.28,  37.47], [ 49.17,  35.56], [ 47.54,  15.85], [ 29.17,  57.32], [ 63.85,  34.07] ],
  [ [  3.00,  34.00], [ 21.50,  34.00], [ 24.50,  11.60], [ 24.50,  56.40], [ 42.64,  47.12], [ 64.94,  45.90], [ 50.23,  27.06], [ 48.50,  64.00], [ 76.50,  34.00] ],
  [ [  3.07,  34.34], [ 47.16,  33.92], [ 61.67,   9.46], [ 53.43,  56.60], [ 69.60,  45.22], [ 81.38,  60.85], [102.04,  26.90], [100.95,  62.25], [ 90.26,  49.29] ],
];

let DEFENSE_FORMATIONS = [
  [ [3.00, 34.00], [21.50, 34.00], [24.50, 11.60], [24.50, 56.40], [40.50, 34.00], [64.50, 34.00], [48.50, 4.00], [48.50, 64.00], [76.50, 34.00] ],
  [ [3.00, 34.00], [21.50, 34.00], [24.50, 11.60], [24.50, 56.40], [40.50, 34.00], [64.50, 34.00], [48.50, 4.00], [48.50, 64.00], [76.50, 34.00] ],
  [ [3.00, 34.00], [21.50, 34.00], [24.50, 11.60], [24.50, 56.40], [40.50, 34.00], [64.50, 34.00], [48.50, 4.00], [48.50, 64.00], [76.50, 34.00] ],
  [ [3.00, 34.00], [21.50, 34.00], [24.50, 11.60], [24.50, 56.40], [40.50, 34.00], [64.50, 34.00], [48.50, 4.00], [48.50, 64.00], [76.50, 34.00] ],
  [ [3.00, 34.00], [21.50, 34.00], [24.50, 11.60], [24.50, 56.40], [40.50, 34.00], [64.50, 34.00], [48.50, 4.00], [48.50, 64.00], [76.50, 34.00] ],
  [ [3.00, 34.00], [21.50, 34.00], [24.50, 11.60], [24.50, 56.40], [40.50, 34.00], [64.50, 34.00], [48.50, 4.00], [48.50, 64.00], [76.50, 34.00] ],
  [ [3.00, 34.00], [21.50, 34.00], [24.50, 11.60], [24.50, 56.40], [40.50, 34.00], [64.50, 34.00], [48.50, 4.00], [48.50, 64.00], [76.50, 34.00] ],
  [ [3.00, 34.00], [21.50, 34.00], [24.50, 11.60], [24.50, 56.40], [40.50, 34.00], [64.50, 34.00], [48.50, 4.00], [48.50, 64.00], [76.50, 34.00] ],
  [ [3.00, 34.00], [21.50, 34.00], [24.50, 11.60], [24.50, 56.40], [40.50, 34.00], [64.50, 34.00], [48.50, 4.00], [48.50, 64.00], [76.50, 34.00] ],
];

let DEFAULT_FORMATION = [
  // Goalkeeper.
  [3, PITCH_MID[1]],

  // Defenders.
  [AREA_DIMS[0] + 5, PITCH_MID[1]],
  [AREA_DIMS[0] + 8, PITCH_MID[1] - AREA_DIMS[1] / 1.8],
  [AREA_DIMS[0] + 8, PITCH_MID[1] + AREA_DIMS[1] / 1.8],

  // Center-midfielders.
  [PITCH_MID[0] - 12, PITCH_MID[1]],
  [PITCH_MID[0] + 12, PITCH_MID[1]],

  // Wingers.
  [PITCH_MID[0] - 4, 4],
  [PITCH_MID[0] - 4, PITCH_DIMS[1] - 4],

  // Center-forward.
  [PITCH_DIMS[0] - AREA_DIMS[0] - 12, PITCH_MID[1]],
];

