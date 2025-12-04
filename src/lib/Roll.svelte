<script>
    import {ROLL_SPEED, OFFSET} from "./constants";

    export let notes;
    export let keyToMIDI;
    export let songProgress;
    let visibleNotes = [];

    $: visibleNotes = notes.filter(n => {
        const timeTilOn = n.startTime - songProgress;
        const timeSinceOff = songProgress - n.endTime;
        return timeTilOn < 4 && timeSinceOff < 2;
    });

</script>

<main>
    <div id="roll">
        {#each visibleNotes as note}
            <div 
                class="tile"
                style:left={`${(keyToMIDI[note.midi])?.leftX}px`}
                style:height={`${note.duration * ROLL_SPEED}px`}
                style:transform={`translateY(${(songProgress - note.startTime) * ROLL_SPEED + OFFSET}px)`}
            ></div>
        {/each}
    </div>
</main>