import { TRACK_TYPES, trackLabel } from "./TrackTypes";

export class Track {
    static SHARED = null;

    #type;
    #params;
    #key;
    #baseLabel;
    length;
    loops;
    originTick;
    #ticks;

    constructor(options) {
        const { type, params = void 0, key, length = Track.SHARED, loops = true, ticks = [] } = options;
        this.#type = type;
        this.#params = params;
        this.#key = key;
        this.#baseLabel = trackLabel(type, params);
        this.length = length;
        this.loops = loops;
        this.originTick = 'originTick' in options ? options.originTick : 0;
        this.#ticks = new Set(ticks);
    }

    get type() {
        return this.#type;
    }

    get params() {
        return this.#params;
    }

    get key() {
        return this.#key;
    }

    effectiveLength(sharedLength) {
        return this.length === Track.SHARED ? sharedLength : this.length;
    }

    offsetAt(currentTick, sharedLength) {
        const elapsed = currentTick - this.originTick;
        if (!this.loops)
            return elapsed;
        const length = this.effectiveLength(sharedLength);
        return ((elapsed % length) + length) % length;
    }

    isActive(offset) {
        return this.#ticks.has(offset);
    }

    setActive(offset, active, sharedLength) {
        if (!Number.isInteger(offset) || offset < 0 || offset >= this.effectiveLength(sharedLength))
            return;
        if (active)
            this.#ticks.add(offset);
        else
            this.#ticks.delete(offset);
    }

    activeOffsets() {
        return [...this.#ticks].sort((a, b) => a - b);
    }

    isEmpty() {
        return this.#ticks.size === 0;
    }

    clear() {
        this.#ticks.clear();
    }

    dropOffsetsFrom(length) {
        for (const offset of this.#ticks) {
            if (offset >= length)
                this.#ticks.delete(offset);
        }
    }

    isFinished(currentTick, sharedLength) {
        if (this.loops)
            return false;
        return this.offsetAt(currentTick, sharedLength) >= this.effectiveLength(sharedLength);
    }

    isAlwaysPresent() {
        return !TRACK_TYPES[this.#type].parameterised && this.#key === this.#type;
    }

    baseLabel() {
        return [...this.#baseLabel];
    }

    labelParts() {
        if (!this.loops)
            return [...this.#baseLabel, { text: ' §7(' }, { translate: 'simplayer.action.track.once' }, { text: ')' }];
        if (this.length !== Track.SHARED)
            return [...this.#baseLabel, { text: ' §7(' }, { translate: 'simplayer.timeline.track.loop', with: [String(this.length)] }, { text: ')' }];
        return [...this.#baseLabel];
    }
}
