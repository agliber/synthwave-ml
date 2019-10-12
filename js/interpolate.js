/*jshint esversion: 6 */

// helper function to interpolates 2 instrument note sequences by
// chunking sequences into sections then
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

let interpolatedNoteSequence;

function interpolate() {
  showLoading();
  // setTimeout is only to allow showLoading() time to display properyly
  setTimeout(function() {
    let song1Index = document.querySelector("#interpolateSelect1 select").value;
    let song2Index = document.querySelector("#interpolateSelect2 select").value;


    interpolateSequencePair(originals[song1Index], originals[song2Index]).then(
      seq => {
        let canvas = document.getElementById("interpolatedCanvas");
        viz = new mm.PianoRollCanvasVisualizer(
          seq,
          canvas,
          config
        );
        interpolatedNoteSequence = seq;
        hideLoading();
      }
    );
  }, 100);
}

function playInterpolation() {

  showLoading();
  if (player.isPlaying()) {
    player.stop();
    return;
  }

  let canvas = document.getElementById("interpolatedCanvas");
  resetCanvas(canvas);
  setTimeout(() => {
    viz = new mm.PianoRollCanvasVisualizer(
      interpolatedNoteSequence,
      canvas,
      config
    );
  }, 200); // spin

  player.start(interpolatedNoteSequence);
  hideLoading();
}
