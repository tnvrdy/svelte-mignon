/*
 * File: main.js
 * -------------
 */

import * as C from './constants.js';
import {loadMidi, parseComposition, initAudio, playAction} from './midiEngine.js';
import './style.css';

import MidiParser from "midi-parser-js";

async function main() {
    const piano = document.getElementById("piano");
    const playButton = document.getElementById("play-button");

    const keys = [];
    layKeys(piano, keys);

    let midiFile = "/brahmsUngarischerTanzNo1.mid";
    const midiData = await loadMidi(midiFile);
    const composition = parseComposition(midiData);
    const {audioC, keyToMIDI, bufferToMIDI} = await initAudio(keys);

    playButton.addEventListener("click", () => {
        playAction(audioC, composition, bufferToMIDI)
    });
}

/*
 * Function: layKeys
 * -----------------
 * Accepts piano div and empty array to hold key elements.
 * Creates and lays piano keys based on white/black, and 
 * populates both the div and the array with these elements.
 */
function layKeys(piano, keys) {
    let numWhite = 0;
    let lastWhiteX = 0;

    for (let n = 0; n < C.NOTES.length; n++) {
        const key = document.createElement("div");  // Using div to avoid pre-made border on img elements.
        key.note = C.NOTES[n];
        key.midi = C.MIDI_N[n];

        key.style.position = "absolute";

        if (key.note.includes("b")) {               // "b" indicates a flat.
            key.classList.add("black-key");
            key.style.left = `${lastWhiteX + C.WHITE_KEY_WIDTH - C.BLACK_KEY_OVERLAP}px`;
            key.style.bottom = `${C.WHITE_KEY_HEIGHT - C.BLACK_KEY_HEIGHT}px`;
        }
        else {
            key.classList.add("white-key");
            lastWhiteX = numWhite * C.WHITE_KEY_WIDTH * C.GAP_FACTOR;
            key.style.left = `${lastWhiteX}px`;
            key.style.bottom = "0px";

            numWhite++;
        }

        keys.push(key);
        piano.appendChild(key);
    }
}

main();