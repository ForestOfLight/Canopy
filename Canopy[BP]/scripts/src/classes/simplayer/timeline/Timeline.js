import { TIMELINE_TRACKS } from "./TimelineTracks";

export class Timeline {
    static MIN_LOOP_LENGTH = 1;
    static MAX_LOOP_LENGTH = 1200;
    static DEFAULT_LOOP_LENGTH = 40;
    static PAGE_WIDTH = 40;

    #loopLength = Timeline.DEFAULT_LOOP_LENGTH;
    #tracks = new Map(TIMELINE_TRACKS.map(track => [track.id, new Set()]));

    static isValidLoopLength(value) {
        return Number.isInteger(value) && value >= Timeline.MIN_LOOP_LENGTH && value <= Timeline.MAX_LOOP_LENGTH;
    }

    get loopLength() {
        return this.#loopLength;
    }

    get pageCount() {
        return Math.ceil(this.#loopLength / Timeline.PAGE_WIDTH);
    }

    setLoopLength(value) {
        if (!Timeline.isValidLoopLength(value))
            return false;
        this.#loopLength = value;
        for (const ticks of this.#tracks.values()) {
            for (const tick of ticks) {
                if (tick >= value)
                    ticks.delete(tick);
            }
        }
        return true;
    }

    isActive(trackId, tick) {
        return this.#tracks.get(trackId)?.has(tick) === true;
    }

    setActive(trackId, tick, active) {
        const ticks = this.#tracks.get(trackId);
        if (ticks === void 0 || !Number.isInteger(tick) || tick < 0 || tick >= this.#loopLength)
            return;
        if (active)
            ticks.add(tick);
        else
            ticks.delete(tick);
    }

    fillTrack(trackId) {
        for (let tick = 0; tick < this.#loopLength; tick++)
            this.setActive(trackId, tick, true);
    }

    clearTrack(trackId) {
        this.#tracks.get(trackId)?.clear();
    }

    isTrackFull(trackId) {
        return this.#tracks.get(trackId)?.size === this.#loopLength;
    }

    isEmpty() {
        for (const ticks of this.#tracks.values()) {
            if (ticks.size > 0)
                return false;
        }
        return true;
    }

    getTick(currentTick) {
        return currentTick % this.#loopLength;
    }

    reset() {
        for (const ticks of this.#tracks.values())
            ticks.clear();
        this.#loopLength = Timeline.DEFAULT_LOOP_LENGTH;
    }
}
