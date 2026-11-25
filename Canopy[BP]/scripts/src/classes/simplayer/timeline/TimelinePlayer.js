import { RepeatableAction } from "../RepeatableAction";
import { TIMELINE_TRACKS } from "./TimelineTracks";

export class TimelinePlayer {
    #understudy;
    #timeline;
    #actions = new Map();
    #isHolding = false;

    constructor(understudy, timeline) {
        this.#understudy = understudy;
        this.#timeline = timeline;
        for (const track of TIMELINE_TRACKS) {
            if (track.action)
                this.#actions.set(track.id, new RepeatableAction(understudy, track.action));
        }
    }

    get isHolding() {
        return this.#isHolding;
    }

    onTick(currentTick) {
        if (this.#timeline.isEmpty() && !this.#isHolding)
            return;
        const tick = this.#timeline.getTick(currentTick);
        for (const track of TIMELINE_TRACKS) {
            const isActive = this.#timeline.isActive(track.id, tick);
            if (track.hold)
                this.#updateHold(isActive);
            else if (isActive)
                this.#actions.get(track.id).perform();
        }
    }

    stop() {
        if (this.#isHolding)
            this.#understudy.simulatedPlayer.stopUsingItem();
        this.#isHolding = false;
    }

    #updateHold(isActive) {
        if (isActive && !this.#isHolding) {
            const simulatedPlayer = this.#understudy.simulatedPlayer;
            simulatedPlayer.useItemInSlot(simulatedPlayer.selectedSlotIndex);
            this.#isHolding = true;
        } else if (!isActive && this.#isHolding) {
            this.stop();
        }
    }
}
