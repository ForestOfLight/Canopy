import { Track } from "./Track";
import { trackKey } from "./TrackTypes";

export class Timeline {
    static MIN_LOOP_LENGTH = 1;
    static MAX_LOOP_LENGTH = 800;
    static DEFAULT_LOOP_LENGTH = 20;
    static PAGE_WIDTH = 20;

    #loopLength = Timeline.DEFAULT_LOOP_LENGTH;
    #tracks = [];
    #oneShotCount = 0;

    static isValidLoopLength(value) {
        return Number.isInteger(value) && value >= Timeline.MIN_LOOP_LENGTH && value <= Timeline.MAX_LOOP_LENGTH;
    }

    get loopLength() {
        return this.#loopLength;
    }

    get tracks() {
        return [...this.#tracks];
    }

    get pageCount() {
        const longest = Math.max(this.#loopLength, ...this.#tracks.map(track => track.effectiveLength(this.#loopLength)));
        return Math.max(1, Math.ceil(longest / Timeline.PAGE_WIDTH));
    }

    setLoopLength(value) {
        if (!Timeline.isValidLoopLength(value))
            return false;
        this.#loopLength = value;
        for (const track of this.#tracks) {
            if (track.length === Track.SHARED)
                track.dropOffsetsFrom(value);
        }
        return true;
    }

    getTrack(key) {
        return this.#tracks.find(track => track.key === key);
    }

    getOrCreate(type, params) {
        const existing = this.getTrack(trackKey(type, params));
        if (existing)
            return existing;
        const track = new Track({ type, params, key: trackKey(type, params) });
        this.#tracks.push(track);
        return track;
    }

    setLooping(type, params, { length, ticks }) {
        const key = trackKey(type, params);
        const track = new Track({ type, params, key, length, ticks, originTick: void 0 });
        this.remove(key);
        this.#tracks.push(track);
        return track;
    }

    addOneShot(type, params, { delay }) {
        const key = `${trackKey(type, params)}#${this.#oneShotCount++}`;
        const track = new Track({ type, params, key, length: delay + 1, loops: false, ticks: [delay], originTick: void 0 });
        this.#tracks.push(track);
        return track;
    }

    clearTrack(type, params) {
        this.remove(trackKey(type, params));
    }

    setTrackLength(key, length) {
        const track = this.getTrack(key);
        if (track === void 0 || !track.loops)
            return false;
        if (length === Track.SHARED) {
            track.length = Track.SHARED;
            track.originTick = 0;
            track.dropOffsetsFrom(this.#loopLength);
            return true;
        }
        if (!Number.isInteger(length) || length < 1)
            return false;
        track.length = length;
        track.dropOffsetsFrom(length);
        return true;
    }

    removeType(type) {
        this.#tracks = this.#tracks.filter(track => track.type !== type);
    }

    remove(key) {
        this.#tracks = this.#tracks.filter(track => track.key !== key);
    }

    isEmpty() {
        return this.#tracks.every(track => track.isEmpty());
    }

    reset() {
        this.#tracks = [];
        this.#loopLength = Timeline.DEFAULT_LOOP_LENGTH;
    }
}
