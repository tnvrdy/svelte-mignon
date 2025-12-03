<script>
  import {onMount} from 'svelte';
  import * as C from './lib/constants.js';
  import './app.css';
  import {loadMidi, parseComposition, initAudio, playAction} from './lib/midiEngine.js';

  let keys = [];
  let composition = [];
  let audioC = null;
  let bufferToMIDI = {};
  
  // migrated layKeys()
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
      }
      else {
        leftX = numWhite * C.WHITE_KEY_WIDTH * C.GAP_FACTOR;
        lastWhiteX = leftX;
        numWhite++;
      }

      keys.push({note, midi, isBlack, leftX});
    }

    return keys;
  }

  // migrated main()
  onMount(async () => {
    keys = createKeys();
    const midiFile = "/brahmsUngarischerTanzNo1.mid";
    const midiData = await loadMidi(midiFile);
    composition = parseComposition(midiData);
    
    const audioEngine = await initAudio(keys);
    audioC = audioEngine.audioC;
    bufferToMIDI = audioEngine.bufferToMIDI;
  });

  // migrated click event listening
  function onClickPlay() {
    playAction(audioC, composition, bufferToMIDI);
  }
</script>

<!-- migrated piano div -->
<main class="app-root">
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