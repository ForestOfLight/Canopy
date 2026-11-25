import { RepeatableAction } from "../RepeatableAction";
import { TIMELINE_TRACKS } from "./TimelineTracks";

const HOLD_HANDLERS = Object.freeze({
    usehold: {
        reassert: false,
        start: understudy => understudy.simulatedPlayer.useItemInSlot(understudy.simulatedPlayer.selectedSlotIndex),
        stop: understudy => understudy.simulatedPlayer.stopUsingItem()
    },
    sneak: {
        reassert: true,
        start: understudy => understudy.sneak(true),
        stop: understudy => understudy.sneak(false)
    },
    sprint: {
        reassert: true,
        start: understudy => understudy.sprint(true),
        stop: understudy => understudy.sprint(false)
    },
    glide: {
        reassert: false,
        start: understudy => understudy.glide(true),
        stop: understudy => understudy.glide(false)
    }
});

export class TimelinePlayer {
    #understudy;
    #timeline;
    #actions = new Map();
    #heldTracks = new Set();

    constructor(understudy, timeline) {
        this.#understudy = understudy;
        this.#timeline = timeline;
        for (const track of TIMELINE_TRACKS) {
            if (track.action)
                this.#actions.set(track.id, new RepeatableAction(understudy, track.action));
        }
    }

    get isHolding() {
        return this.#heldTracks.size > 0;
    }

    onTick(currentTick) {
        if (this.#timeline.isEmpty() && !this.isHolding)
            return;
        const tick = this.#timeline.getTick(currentTick);
        for (const track of TIMELINE_TRACKS) {
            const isActive = this.#timeline.isActive(track.id, tick);
            if (track.hold)
                this.#updateHold(track.id, isActive);
            else if (isActive)
                this.#actions.get(track.id).perform();
        }
    }

    stop() {
        for (const trackId of this.#heldTracks)
            HOLD_HANDLERS[trackId].stop(this.#understudy);
        this.#heldTracks.clear();
    }

    #updateHold(trackId, isActive) {
        const handler = HOLD_HANDLERS[trackId];
        const isHeld = this.#heldTracks.has(trackId);
        if (isActive && (!isHeld || handler.reassert)) {
            handler.start(this.#understudy);
            this.#heldTracks.add(trackId);
        } else if (!isActive && isHeld) {
            handler.stop(this.#understudy);
            this.#heldTracks.delete(trackId);
        }
    }
}
