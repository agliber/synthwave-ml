# synthwave-ml

See the project live: https://synthwaveml.netlify.com/

### Music/Machine Learning experimental research project inspired by [Prof. Scott Easley](https://viterbi.usc.edu/directory/faculty/Easley/Scott)
![CodePen Project Preview Screen Shot](https://github.com/adamliber/synthwave-ml/blob/master/media/CodePenPreview.PNG)

# Table of Contents
1. [Intro](#intro)
2. [Demos](#CodePen-Demos)
3. [Background](#Background-Info)
4. [Project Overview](#Project-Overview)
5. [Helpful-Resources](#Helpful-Resources)

## Intro
This research project's goal is to experiment with machine learning to generate new music  mimicing a musical style. This experiment focuses on the synthwave style of the band [Devo](https://www.youtube.com/watch?v=j_QLzthSkfM). This project is primarily built and based on the tools and frameworks created by the [Magenta Project](https://magenta.tensorflow.org/). Magenta is a creative research project started by Google and contributed to by other non-affiliated hobbyists, creatives, artists, and programmers.

## CodePen Demos:
- [SynthWaveGeneratorRNN](https://codepen.io/adamliber/full/jdvPJx)
- [SynthWaveGeneratorVAE](https://codepen.io/adamliber/pen/NmNgYp)
- [NightCall note sequence](https://codepen.io/adamliber/pen/bzxEzV)


## Background Info
### [Magenta]( https://github.com/tensorflow/magenta-js)

Magenta uses machine learning based on [TensorFlow](https://www.tensorflow.org/) which also has a javascript based version for working in the browser. Magenta.js naturally is built with Tensorflow.js and that is what this project uses.

Magenta is for both **music** and **graphic art** but for this project we focus only on the
music components, primarily two Magenta subprojects: MusicRNN and
[MusicVAE](https://magenta.tensorflow.org/music-vae)

#### MusicRNN (Recurrent Neural Network)  overview:
MusicRNN's current primary feature and function is generation of monophonic output given a single midi input (formatted as a quantized note sequence). This is the key tool used in our project to generate new musical tracks. The output is non-deterministic, so it can produce new sounds each time it generates even if the input is the same. It's algorithm is based on the model checkpoint used for initializing the MusicRNN model.

#### MusicVAE (Variational Auto Encoder) overview:  
MusicVAE's main feature is interpolation of 2 individual midi inputs (also
formatted as quantized note sequences). Interpolation essentially forms
a combination of the 2 inputs and produces an array of outputs which are
a range of monophonic music from most similar to input 1 to most similar to
input 2. This naturally means the middle element of the array is the most evenly
similar to both input tracks. MusicVAE interpolation is deterministic, meaning
the same inputs will always generate the same output.

## Project Overview:
In this project we attempt to use a combination of methods of manipulating the input midi note sequences such as separating and combining instruments, chunking the song into sections and interpolating the sections, and recombining interpolations of multiple songs to then feed the interpolated output as input for new music generation using MusicRNN.  


## Helpful Resources:
* [TensorFlow.js] (https://magenta.tensorflow.org/)
* [p5.js] (https://p5js.org/)
* [Tone.js] (https://tonejs.github.io/)

##### Magenta/Music
sequences: https://tensorflow.github.io/magenta-js/music/modules/_core_sequences_   
initialization checkpoints:    
https://github.com/tensorflow/magenta-js/tree/master/music/checkpoints
https://github.com/tensorflow/magenta-js/blob/master/music/checkpoints/checkpoints.json

MIDI: https://en.wikipedia.org/wiki/MIDI  
CORS (Cross Origin Resource Sharing) https://en.wikipedia.org/wiki/Cross-origin_resource_sharing  
url to midi: https://tensorflow.github.io/magenta-js/music/modules/_core_midi_io_.html#urltonotesequence  

#### Melpful links/ articles:

https://hello-magenta.glitch.me/ <---- Very nice way to get started with magenta  
https://magenta.tensorflow.org/music-vae  
https://magenta.tensorflow.org/music-transformer  
https://magenta.tensorflow.org/multitrack  
https://magenta.tensorflow.org/2016/06/10/recurrent-neural-network-generation-tutorial  
https://github.com/tensorflow/magenta-js/tree/master/music  
https://tensorflow.github.io/magenta-js/music  
https://magenta.tensorflow.org/nsynth  
