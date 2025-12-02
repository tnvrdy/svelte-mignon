/*
 * File: midiEngine.js
 * -------------------
 */

import MidiParser from "midi-parser-js";
import * as C from './constants.js';

/*
 * Function: loadComposition
 * -------------------------
 * Fetches MIDI file and parses composition into JSON.
 */
export async function loadComposition(mf) {
    const response = await fetch(mf);
    const arrayBuffer = await response.arrayBuffer();

    return MidiParser.parse(new Uint8Array(arrayBuffer));
}

/*
 * Function: parseComposition
 * --------------------------
 * Accepts composition object and parses, using MIDI
 * events, the actions necessary to play the piece.
 */
export function parseComposition(obj) {             
    const song = [];
    const events = obj.track[0].event;              // Assumes type 0 MIDI file.
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

    return {
        midi, 
        gain: Math.pow(velocity / 127, 2),          // Normalize and square velocity of note.
        startTime: absTime, 
        type
    };
}

/*
 * Function: audioEngine
 * ---------------------
 * Creates audio buffers for notes to be played,
 * and builds objects that map MIDI numbers 
 * to their respective keys and audio buffers.
 */
export async function initAudio(keys) {
    const audioC = new AudioContext();
    const keyToMIDI = {};
    const bufferToMIDI = {};

    const getKeyByMidi = midi => keys.find(k => k.midi == midi);

    for (const midi of C.MIDI_N) {
        const key = getKeyByMidi(midi);
        keyToMIDI[midi] = key;
        
        const response = await fetch(`/notes/${key.note}.mp3`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioC.decodeAudioData(arrayBuffer);
        bufferToMIDI[midi] = audioBuffer;
    }

    return {audioC, keyToMIDI, bufferToMIDI};
}

/*
 * Function: playAction
 * --------------------
 * Event handler to play song from MIDI-like 
 * dictionary object when the user clicks play.
 */
export function playAction(audioC, song, bufferToMIDI) {
    const beginning = audioC.currentTime + 0.1;

    for (let [index, action] of song.entries()) {
        if (action.type !== "on") continue;
        const buffer = bufferToMIDI[action.midi];
        if (!buffer) continue;

        const src = audioC.createBufferSource();
        const gainNode = audioC.createGain();

        src.buffer = buffer;
        gainNode.gain.value = action.gain;
        
        src.connect(gainNode);
        gainNode.connect(audioC.destination);
        src.start(beginning + action.startTime);

        const offIdxRel = song.slice(index).findIndex(
            a => a.type === "off" && a.midi === action.midi
        );
        if (offIdxRel === -1) continue;
        
        action.endTime = song[index + offIdxRel].startTime;
        action.duration = action.endTime - action.startTime;
    }
}