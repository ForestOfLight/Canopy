import { TRACK_KINDS, TRACK_TYPES } from "./TrackTypes";
import { performEvent, startHold, stopHold } from "./TrackHandlers";

const HOLD_TYPES = Object.freeze(Object.values(TRACK_TYPES).filter(info => info.kind === TRACK_KINDS.HOLD).map(info => info.type));

export class TimelinePlayer {
    #understudy;
    #timeline;
    #held = new Map();

    constructor(understudy, timeline) {
        this.#understudy = understudy;
        this.#timeline = timeline;
    }

    get isHolding() {
        return this.#held.size > 0;
    }

    onTick(currentTick) {
        if (this.#timeline.isEmpty() && !this.isHolding)
            return;
        const tracks = this.#timeline.tracks;
        const loopLength = this.#timeline.loopLength;
        const winners = new Map();
        for (const track of tracks) {
            if (track.originTick === void 0)
                track.originTick = currentTick;
            if (track.isActive(track.offsetAt(currentTick, loopLength)))
                winners.set(track.type, track);
        }
        for (const track of tracks) {
            if (TRACK_TYPES[track.type].kind === TRACK_KINDS.EVENT && winners.get(track.type) === track)
                performEvent(this.#understudy, track.type, track.params);
        }
        for (const type of HOLD_TYPES)
            this.#updateHold(type, winners.get(type));
        for (const track of tracks) {
            if (track.isFinished(currentTick + 1, loopLength))
                this.#timeline.remove(track.key);
        }
    }

    stop() {
        for (const type of this.#held.keys())
            stopHold(this.#understudy, type);
        this.#held.clear();
    }

    #updateHold(type, winner) {
        const held = this.#held.get(type);
        if (winner === void 0) {
            if (held !== void 0) {
                stopHold(this.#understudy, type);
                this.#held.delete(type);
            }
            return;
        }
        if (held !== winner) {
            if (held !== void 0)
                stopHold(this.#understudy, type);
            startHold(this.#understudy, type, winner.params);
            this.#held.set(type, winner);
        } else if (TRACK_TYPES[type].reassert) {
            startHold(this.#understudy, type, winner.params);
        }
    }
}
