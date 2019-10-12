/*jshint esversion: 6 */

let generatedNoteSequence;

function generate() {

  // if(interpolatedNoteSequence === undefined){
  //   alert("Needs interpolated input, to genrate from.");
  //   return;
  // }
  showLoading();
  setTimeout(function() {

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
        let canvas = document.getElementById("generatedCanvas");
        viz = new mm.PianoRollCanvasVisualizer(
          sample,
          canvas,
          config
        );
        generatedNoteSequence = sample;
        hideLoading();
      });
  }, 100);
}

// Plays audio of generated note sequence in the browser
function playGenerated() {
  // if(generatedNoteSequence === undefined){
  //   alert("Needs have generated input to play.");
  //   return;
  // }
  let canvas = document.getElementById("generatedCanvas");
  resetCanvas(canvas);

  showLoading();
  if (player.isPlaying()) {
    player.stop();
    return;
  }
  setTimeout(() => {
    viz = new mm.PianoRollCanvasVisualizer(
      generatedNoteSequence,
      canvas,
      config
    );
  }, 100);

  player.start(generatedNoteSequence);
  hideLoading();
}
