import { Track } from "./Track";
import { ALWAYS_PRESENT_TYPES, trackKey } from "./TrackTypes";

function alwaysPresentTrack(type) {
    return new Track({ type, key: type });
}

export class Timeline {
    static MIN_LOOP_LENGTH = 1;
    static MAX_LOOP_LENGTH = 200;
    static DEFAULT_LOOP_LENGTH = 20;
    static PAGE_WIDTH = 20;

    #loopLength = Timeline.DEFAULT_LOOP_LENGTH;
    #alwaysPresent = ALWAYS_PRESENT_TYPES.map(alwaysPresentTrack);
    #extras = [];
    #oneShotCount = 0;

    static isValidLoopLength(value) {
        return Number.isInteger(value) && value >= Timeline.MIN_LOOP_LENGTH && value <= Timeline.MAX_LOOP_LENGTH;
    }

    get loopLength() {
        return this.#loopLength;
    }

    get tracks() {
        return [...this.#alwaysPresent, ...this.#extras];
    }

    get pageCount() {
        const longest = Math.max(...this.tracks.map(track => track.effectiveLength(this.#loopLength)));
        return Math.max(1, Math.ceil(longest / Timeline.PAGE_WIDTH));
    }

    setLoopLength(value) {
        if (!Timeline.isValidLoopLength(value))
            return false;
        this.#loopLength = value;
        for (const track of this.tracks) {
            if (track.length === Track.SHARED)
                track.dropOffsetsFrom(value);
        }
        return true;
    }

    getTrack(key) {
        return this.tracks.find(track => track.key === key);
    }

    getOrCreate(type, params) {
        const existing = this.getTrack(trackKey(type, params));
        if (existing)
            return existing;
        const track = new Track({ type, params, key: trackKey(type, params) });
        this.#extras.push(track);
        return track;
    }

    setLooping(type, params, { length, ticks }) {
        const key = trackKey(type, params);
        const track = new Track({ type, params, key, length, ticks, originTick: void 0 });
        const slot = this.#alwaysPresentSlot(key);
        if (slot === -1) {
            this.remove(key);
            this.#extras.push(track);
        } else {
            this.#alwaysPresent[slot] = track;
        }
        return track;
    }

    addOneShot(type, params, { delay }) {
        const key = `${trackKey(type, params)}#${this.#oneShotCount++}`;
        const track = new Track({ type, params, key, length: delay + 1, loops: false, ticks: [delay], originTick: void 0 });
        this.#extras.push(track);
        return track;
    }

    clearTrack(type, params) {
        const key = trackKey(type, params);
        const slot = this.#alwaysPresentSlot(key);
        if (slot === -1)
            this.remove(key);
        else
            this.#alwaysPresent[slot] = alwaysPresentTrack(type);
    }

    removeType(type) {
        this.#extras = this.#extras.filter(track => track.type !== type);
    }

    remove(key) {
        this.#extras = this.#extras.filter(track => track.key !== key);
    }

    isEmpty() {
        return this.tracks.every(track => track.isEmpty());
    }

    reset() {
        this.#alwaysPresent = ALWAYS_PRESENT_TYPES.map(alwaysPresentTrack);
        this.#extras = [];
        this.#loopLength = Timeline.DEFAULT_LOOP_LENGTH;
    }

    #alwaysPresentSlot(key) {
        return ALWAYS_PRESENT_TYPES.indexOf(key);
    }
}
