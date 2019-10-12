/*jshint esversion: 6 */

// set input (linked from external source)
const WHIP_IT_SEQUENCE = whipIt;
const FREEDOM_OF_CHOICE_SEQUENCE = freedomOfChoice;
const BEAUTIFUL_WORLD_SEQUENCE = beautifulWorld;
const GUT_FEELING_SEQUENCE = gutFeeling;

// array of original note sequences
const originals = [
  WHIP_IT_SEQUENCE,
  FREEDOM_OF_CHOICE_SEQUENCE,
  BEAUTIFUL_WORLD_SEQUENCE,
  GUT_FEELING_SEQUENCE
];

// Initialize the machine learning model.
initModel();

function initModel() {
  showLoading();
  // https://tensorflow.github.io/magenta-js/music/modules/_music_vae_model_.html
  music_vae = new mm.MusicVAE(
    "https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/mel_4bar_small_q2"
  );
  music_vae.initialize();
  // https://tensorflow.github.io/magenta-js/music/modules/_music_rnn_model_.html
  music_rnn = new mm.MusicRNN(
    "https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/melody_rnn"
  );
  music_rnn.initialize();
  hideLoading();
}


// load default player
// https://tensorflow.github.io/magenta-js/music/modules/_core_player_.html
let viz;
let player = new mm.Player(false, {
  run: note => viz.redraw(note, true),
  stop: () => {}
});

// configure visualization for canvas
const config = {
  noteHeight: 6,
  pixelsPerTimeStep: 30,
  noteSpacing: 1,
  noteRGB: "8, 41, 64",
  activeNoteRGB: "240, 84, 119"
};

// show loading animation
function showLoading() {
  // let loader = document.querySelector('#loader');
  // loader.style.display = "inline-block";
  $('#loader').modal('show');
}
// hide loading animation
function hideLoading() {
  // let loader = document.querySelector('#loader');
  // loader.style.display = "none";
  $('#loader').modal('hide');
}

toggleSoundFont();
// inits new music player and adjusts UI to reflect current UI player
function toggleSoundFont() {
  showLoading();
  if (player.isPlaying()) {
    player.stop();
  }
  // adjust UI
  let playerInputs = document.querySelectorAll('input[name="player"]');
  // for (let input of playerInputs) {
  //   input.parentElement.style.backgroundColor = "black";
  //   input.parentElement.style.color = "#a5ff9b";
  // }
  let checkedInput = document.querySelector('input[name="player"]:checked');
  // checkedInput.parentElement.style.color = "black";
  // checkedInput.parentElement.style.backgroundColor = "#a5ff9b";

  if (checkedInput) {
    // use soundfont player
    // https://tensorflow.github.io/magenta-js/music/classes/_core_player_.soundfontplayer.html
    player = new mm.SoundFontPlayer(
      "https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus",
      undefined,
      undefined,
      undefined, {
        run: note => viz.redraw(note, true),
        stop: () => {}
      }
    );
  } else {
    // use soundfont player
    // https://tensorflow.github.io/magenta-js/music/classes/_core_player_.player.html
    player = new mm.Player(false, {
      run: note => viz.redraw(note, true),
      stop: () => {}
    });
  }
  hideLoading();
}
// initialize UI slider values
let sliders = document.querySelectorAll(".slider");
sliders.forEach(slider => {
  let setVal = function() {
    let textElement = slider.nextElementSibling.querySelector(".sliderValue");
    // data-multiplier is used for sliders where value should be a scale of a multiple
    let m = slider.getAttribute("data-multiplier");
    if (m == "" || m == null) {
      m = 1;
    }
    // data-exponent is used for sliders where value should be on exponential scale
    let e = slider.getAttribute("data-exponent");
    // adjust slider value displayed on UI
    if (e != "" && e != null) {
      textElement.innerHTML = Math.pow(e, slider.value * m);
    } else {
      textElement.innerHTML = Math.round(slider.value * m * 10) / 10;
    }
  };

  setVal();
  slider.oninput = setVal;
});

// splits an input note sequence into and array of note sequences based on instrument type
function sequenceInstrumentSplit(seq) {

  let sequenceArray = [];
  let instrumentNotes = new Map();

  let instrumentIndex = 0;
  seq.notes.forEach(note => {
    if (!instrumentNotes.has(note.instrument)) {
      instrumentNotes.set(note.instrument, []);
    }
    instrumentNotes.get(note.instrument).push(note);
  });

  instrumentNotes.forEach((instrumentNotes, key) => {
    // perform a deepcopy of seq
    let instrumentSeq = mm.sequences.clone(seq);
    instrumentSeq.notes = instrumentNotes;
    sequenceArray.push(instrumentSeq);
  });

  return sequenceArray;
}

// funtion to combine array note sequences into one note sequence
// basically the reverse of mm.sequences.split()
function sequenceArrayCombine(sequenceArray) {
  let combinedSequence = sequenceArray[0];
  for (let i = 1; i < sequenceArray.length; i++) {
    combinedSequence.notes = combinedSequence.notes.concat(
      sequenceArray[i].notes
    );
  }
  return combinedSequence;
}

// trims from start of input sequences based on the UI "trim" slider values
function trimSequences(sequences) {

  let trimmedSequences = [];
  let startTrim = document.querySelector("#trimStart").value;
  sequences.forEach(seq => {
    trimmedSequences.push(mm.sequences.trim(seq, startTrim, seq.totalTime));
  });

  return trimmedSequences;
}

// function to stop audio playing
function stop() {
  // let canvas = document.getElementById("originalCanvas");
  // resetCanvas(canvas);
  if (player.isPlaying()) {
    player.stop();
    return;
  }
}

function resetCanvas(canvas) {
  console.log('here');
  canvas.width = 0;
  canvas.height = 0;
  canvas.style = '';
  return;
}

function playOriginal() {

  if (player.isPlaying()) {
    player.stop();
    return;
  }

  showLoading();
  let songIndex = document.querySelector("#originalSelect select").value;
  let seq = originals[songIndex];
  // https://tensorflow.github.io/magenta-js/music/modules/_core_sequences_.html#trim
  seq = mm.sequences.trim(seq, 0, seq.totalTime);
  // https://tensorflow.github.io/magenta-js/music/modules/_core_sequences_.html#quantizenotesequence
  seq = mm.sequences.quantizeNoteSequence(seq, 4);

  let canvas = document.getElementById("originalCanvas");
  resetCanvas(canvas);
  setTimeout(() => {
    viz = new mm.PianoRollCanvasVisualizer(
      seq,
      canvas,
      config
    );
  }, 200); // spin

  player.start(seq);
  hideLoading();
}
