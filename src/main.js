/*
 * File: main.js
 * -------------
 */

import * as C from './constants.js';
import './style.css';

import MidiParser from "midi-parser-js";

async function main() {
    const piano = document.getElementById("piano");
    const playButton = document.getElementById("play-button");

    const keys = [];
    const keyToMIDI = {};
    const audioToMIDI = {};

    layKeys(piano, keys);
    mapMIDI();

    const composition = await loadComposition();
    const song = parseComposition(composition);

    /*
     * Function: mapMIDI
     * -----------------
     * Builds objects that map MIDI
     * numbers to key and audio elements.
     */
    function mapMIDI() {
        const getKeyByMidi = midi => keys.find(k => k.midi == midi);
    
        for (let midi of C.MIDI_N) {
            let key = getKeyByMidi(midi);
            keyToMIDI[midi] = key;
            audioToMIDI[midi] = new Audio(`/notes/${key.note}.mp3`);
        }
    }

    /*
     * Function: playAction
     * --------------------
     * Event handler to play song from MIDI-like 
     * dictionary object when the user clicks play.
     */
    function playAction() {
        for (let action of song) {
            if (action.type !== "on") continue;
            const audio = audioToMIDI[action.midi];
            if (!audio) continue;

            setTimeout(() => audio.play(), action.startTime * 1000);
        }
    }
    playButton.addEventListener("click", playAction);
}

/*
 * Function: loadComposition
 * -------------------------
 * Fetches MIDI file and parses composition into JSON.
 */
async function loadComposition() {
    const response = await fetch("/brahmsUngarischerTanzNo1.mid");
    const arrayBuffer = await response.arrayBuffer();

    return MidiParser.parse(new Uint8Array(arrayBuffer));
}

/*
 * Function: parseComposition
 * --------------------------
 * Accepts composition object and parses, using MIDI
 * events, the actions necessary to play the piece.
 */
function parseComposition(obj) { // Assumes type 0 MIDI file.
    const song = [];
    const events = obj.track[0].event;
    let absTick = 0;

    for (let event of events) {
        absTick += event.deltaTime;
        if (event.data?.length === 2) {
            song.push(getAction(obj, event, absTick));
        }
    }

    return song;
}

/*
 * Function: getAction
 * -------------------
 * Accepts composition object, current event, and
 * absolute time in ticks, and returns information
 * on action to take (start time, note, press/release).
 */
function getAction(obj, event, absTick) {
    const ppq = obj.timeDivision;                   // Pulses per quarter note.
    const absTime = absTick * (C.MPQ / 1e6 / ppq);  // Calculates absolute time in seconds from ticks.

    const [midi, velocity] = event.data;
    const type =
        event.type === 9 && velocity > 0 ? "on" :
        event.type === 8 || velocity === 0 ? "off" :
        null;

    return {startTime: absTime, midi, type};
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