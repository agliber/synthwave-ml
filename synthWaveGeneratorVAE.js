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
function initModel(){
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
let player = new mm.Player(false, {
  run: note => viz.redraw(note,true),
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
function showLoading(){
  // let loader = document.querySelector('#loader');
  // loader.style.display = "inline-block";
  $('#loader').modal('show');
}
// hide loading animation
function hideLoading(){
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
      undefined,
      {
        run: note => viz.redraw(note,true),
        stop: () => {}
      }
    );
  } else {
    // use soundfont player
    // https://tensorflow.github.io/magenta-js/music/classes/_core_player_.player.html
    player = new mm.Player(false, {
      run: note => viz.redraw(note,true),
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
      instrumentNotes.set(note.instrument, new Array() );
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

// helper function to interpolates 2 instrument note sequences by chunking sequences into sections then
// interpolating between the pairwise sections and returns a single sequence
function interpolateInstrumentTracks(seq1, seq2) {

  // input parameters driven by UI
  let vae_temp = Number(document.querySelector("#rnnTemp").value * 0.1);
  let chunkDuration = Number(document.querySelector("#chunkDuration").value);
  let chunkSize = Math.pow(2, document.querySelector("#chunkSize").value);

  // https://tensorflow.github.io/magenta-js/music/modules/_core_sequences_.html#quantizenotesequence
  let quantizedSeq1 = mm.sequences.quantizeNoteSequence(seq1, 4);
  let quantizedSeq2 = mm.sequences.quantizeNoteSequence(seq2, 4);
  // https://tensorflow.github.io/magenta-js/music/modules/_core_sequences_.html#split
  let seq1Chunks = mm.sequences.split(quantizedSeq1, chunkSize);
  let seq2Chunks = mm.sequences.split(quantizedSeq2, chunkSize);
  let minNumChunks = Math.min(seq1Chunks.length, seq2Chunks.length);

  let promises = [];
  for (let i = 0; i < minNumChunks; i++) {
    promises.push(
      music_vae.interpolate([seq1Chunks[i], seq2Chunks[i]], 3, vae_temp)
    );
  }

  return Promise.all(promises).then(interpolatedArrays => {
    let interpolatedSequences = [];
    let durations = [];
    interpolatedArrays.forEach(interpolatedArray => {
      interpolatedSequences.push(interpolatedArray[1]);
      durations.push(chunkDuration);
    });
    return mm.sequences.concatenate(interpolatedSequences, durations);
  });
}

// Main function to interpolate 2 sequences and output a single sequence
function interpolateSequencePair(seq1, seq2) {
  let seq1DeepCopy = mm.sequences.clone(seq1);
  let seq2DeepCopy = mm.sequences.clone(seq2);

  // seq1DeepCopy = mm.sequences.mergeInstruments(seq1DeepCopy);
  // seq2DeepCopy = mm.sequences.mergeInstruments(seq2DeepCopy);

  let instrumentSeqArray1 = sequenceInstrumentSplit(seq1DeepCopy);
  let instrumentSeqArray2 = sequenceInstrumentSplit(seq2DeepCopy);

  let minInstrumentSeq = Math.min(
    instrumentSeqArray1.length,
    instrumentSeqArray2.length
  );

  let promises = [];
  for (let i = 0; i < minInstrumentSeq; i++) {
    promises.push(
      Promise.resolve(
        interpolateInstrumentTracks(
          instrumentSeqArray1[i],
          instrumentSeqArray2[i]
        )
      )
    );
  }

    return Promise.all(promises).then(interpolatedSequences => {
    return Promise.resolve(sequenceArrayCombine(interpolatedSequences));
  });
}

// function to stop audio playing
function stop() {
  if (player.isPlaying()) {
    player.stop();
    return;
  }
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

  viz = new mm.PianoRollCanvasVisualizer(
    seq,
    document.getElementById("originalCanvas"),
    config
  );
  player.start(seq);
  hideLoading();
}

let interpolatedNoteSequence;

function interpolate() {
  showLoading();
  // setTimeout is only to allow showLoading() time to display properyly
  setTimeout(function(){
    let song1Index = document.querySelector("#interpolateSelect1 select").value;
    let song2Index = document.querySelector("#interpolateSelect2 select").value;

    interpolateSequencePair(originals[song1Index], originals[song2Index]).then(
      seq => {
        viz = new mm.PianoRollCanvasVisualizer(
          seq,
          document.getElementById("interpolatedCanvas"),
          config
        );
        interpolatedNoteSequence = seq;
        hideLoading();
      }
    );
  },100);
}

function playInterpolation() {
  showLoading();
  if (player.isPlaying()) {
    player.stop();
    return;
  }

  player.start(interpolatedNoteSequence);
  hideLoading();
}

let generatedNoteSequence;

function generate() {

  // if(interpolatedNoteSequence === undefined){
  //   alert("Needs interpolated input, to genrate from.");
  //   return;
  // }
  showLoading();
  setTimeout(function(){

    let songIndex = document.querySelector("#originalSelect select").value;
    let seq = originals[songIndex];
    // https://tensorflow.github.io/magenta-js/music/modules/_core_sequences_.html#trim
    seq = mm.sequences.trim(seq, 0, seq.totalTime);
    // https://tensorflow.github.io/magenta-js/music/modules/_core_sequences_.html#quantizenotesequence
    seq = mm.sequences.quantizeNoteSequence(seq, 4);

    rnn_steps = Number(document.querySelector("#rnnSteps").value);
    rnn_temperature = Number(document.querySelector("#rnnTemp").value * 0.1);
    music_rnn
      .continueSequence(seq, rnn_steps, rnn_temperature)
      .then(sample => {
        viz = new mm.PianoRollCanvasVisualizer(
          sample,
          document.getElementById("generatedCanvas"),
          config
        );
        generatedNoteSequence = sample;
        hideLoading();
      });
   },100);
}

// Plays audio of generated note sequence in the browser
function playGenerated() {
  // if(generatedNoteSequence === undefined){
  //   alert("Needs have generated input to play.");
  //   return;
  // }

  showLoading();
  if (player.isPlaying()) {
    player.stop();
    return;
  }
  player.start(generatedNoteSequence);
  hideLoading();
}
