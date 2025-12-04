<script>
  import {onMount} from 'svelte';
  import * as C from './lib/constants.js';
  import './app.css';
  import {loadMidi, parseNotes, initAudio, playAction} from './lib/midiEngine.js';
  import Roll from './lib/Roll.svelte';

  let keys = [];
  let notes = [];
  let audioC = null;
  let bufferToMIDI = {};
  let keyToMIDI = {};

  let songStartTime = null;
  let songProgress = null;
  let isPlaying = false;
  
  /*
   * Function: createKeys
   * --------------------
   * Creates array of piano key objects with note, 
   * midi no., black/white, and left mark in pixels.
   */
  function createKeys() {
    let numWhite = 0;
    let lastWhiteX = 0;
    let keys = [];

    for (let n = 0; n < C.NOTES.length; n++) {
      const note = C.NOTES[n];
      const midi = C.MIDI_N[n];
      const isBlack = note.includes("b");

      let leftX = null;
      if (isBlack) {               // "b" indicates a flat.
        leftX = lastWhiteX + C.WHITE_KEY_WIDTH - C.BLACK_KEY_OVERLAP;
      } else {
        leftX = numWhite * C.WHITE_KEY_WIDTH * C.GAP_FACTOR;
        lastWhiteX = leftX;
        numWhite++;
      }

      keys.push({note, midi, isBlack, leftX});
    }

    return keys;
  }

  onMount(async () => {
    keys = createKeys();
    const midiData = await loadMidi("/brahmsUngarischerTanzNo1.mid");
    notes = parseNotes(midiData);
    
    const audioEngine = await initAudio(keys);
    audioC = audioEngine.audioC;
    bufferToMIDI = audioEngine.bufferToMIDI;
    keyToMIDI = audioEngine.keyToMIDI;
  });

  function onClickPlay() {
    songStartTime = playAction(audioC, notes, bufferToMIDI);
    isPlaying = true;
    requestAnimationFrame(time);
  }

  function time() {
    if (!isPlaying) return;
    songProgress = audioC.currentTime - songStartTime;
    requestAnimationFrame(time);
  }

</script>

<main class="app-root">
  <Roll {notes} {keyToMIDI} {songProgress} />
  <div id="piano">
    {#each keys as key}
      <div
        class={`key ${key.isBlack ? 'black-key' : 'white-key'}`}
        style={`left: ${key.leftX}px;`}
      ></div>
    {/each}
  </div>

  <button id="play-button" on:click={onClickPlay}>Play</button>
</main>