import { describe, it, expect, beforeEach } from 'vitest';
import { Timeline } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/Timeline';
import { Track } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/Track';

const lookNorth = { target: { kind: 'cardinal', direction: 'north' } };

describe('Timeline', () => {
    let timeline;

    beforeEach(() => {
        timeline = new Timeline();
    });

    it('starts with no tracks', () => {
        expect(timeline.tracks).toEqual([]);
        expect(timeline.isEmpty()).toBe(true);
    });

    it('starts with a one page default loop', () => {
        expect(timeline.loopLength).toBe(20);
        expect(timeline.pageCount).toBe(1);
    });

    it('validates loop lengths', () => {
        expect(Timeline.isValidLoopLength(1)).toBe(true);
        expect(Timeline.isValidLoopLength(200)).toBe(true);
        expect(Timeline.isValidLoopLength(0)).toBe(false);
        expect(Timeline.isValidLoopLength(201)).toBe(false);
        expect(Timeline.isValidLoopLength(2.5)).toBe(false);
        expect(timeline.setLoopLength(0)).toBe(false);
        expect(timeline.loopLength).toBe(20);
    });

    it('finds a track by key', () => {
        const jump = timeline.getOrCreate('jump');
        expect(timeline.getTrack('jump')).toBe(jump);
        expect(timeline.getTrack('select:2')).toBeUndefined();
    });

    describe('getOrCreate', () => {
        it('appends one looping shared track with origin 0', () => {
            const track = timeline.getOrCreate('select', { slot: 2 });
            expect(timeline.tracks).toEqual([track]);
            expect(track.key).toBe('select:2');
            expect(track.length).toBe(Track.SHARED);
            expect(track.loops).toBe(true);
            expect(track.originTick).toBe(0);
        });

        it('creates tracks without params too', () => {
            expect(timeline.getOrCreate('jump').key).toBe('jump');
        });

        it('returns the existing track for the same params', () => {
            const track = timeline.getOrCreate('select', { slot: 2 });
            expect(timeline.getOrCreate('select', { slot: 2 })).toBe(track);
            expect(timeline.tracks).toHaveLength(1);
        });

        it('keeps tracks in the order they were added', () => {
            timeline.getOrCreate('jump');
            timeline.getOrCreate('attack');
            timeline.getOrCreate('select', { slot: 0 });
            expect(timeline.tracks.map(track => track.key)).toEqual(['jump', 'attack', 'select:0']);
        });
    });

    describe('setLooping', () => {
        it('adds a fresh looping track with a lazy origin', () => {
            const track = timeline.setLooping('jump', void 0, { length: 7, ticks: [0] });
            expect(timeline.tracks).toEqual([track]);
            expect(track.length).toBe(7);
            expect(track.originTick).toBeUndefined();
            expect(track.activeOffsets()).toEqual([0]);
        });

        it('replaces a track with the same key and moves it to the end', () => {
            const before = timeline.getOrCreate('jump');
            timeline.getOrCreate('attack');
            const track = timeline.setLooping('jump', void 0, { length: 7, ticks: [0] });
            expect(track).not.toBe(before);
            expect(timeline.tracks.map(entry => entry.key)).toEqual(['attack', 'jump']);
        });

        it('lets the latest move direction come last', () => {
            timeline.setLooping('move', { direction: 'forward' }, { length: 1, ticks: [0] });
            timeline.setLooping('move', { direction: 'backward' }, { length: 1, ticks: [0] });
            timeline.setLooping('move', { direction: 'forward' }, { length: 1, ticks: [0] });
            expect(timeline.tracks.map(track => track.key)).toEqual(['move:backward', 'move:forward']);
        });
    });

    describe('addOneShot', () => {
        it('appends a separate one-shot track each time', () => {
            const looping = timeline.getOrCreate('jump');
            const first = timeline.addOneShot('jump', void 0, { delay: 40 });
            const second = timeline.addOneShot('jump', void 0, { delay: 40 });
            expect(first.key).not.toBe(second.key);
            expect(first.key.startsWith('jump#')).toBe(true);
            for (const track of [first, second]) {
                expect(track.loops).toBe(false);
                expect(track.length).toBe(41);
                expect(track.activeOffsets()).toEqual([40]);
                expect(track.originTick).toBeUndefined();
            }
            expect(looping.isEmpty()).toBe(true);
            expect(timeline.isEmpty()).toBe(false);
        });
    });

    describe('removal', () => {
        it('clears a track by removing it', () => {
            timeline.setLooping('jump', void 0, { length: 7, ticks: [0] });
            timeline.getOrCreate('select', { slot: 2 });
            timeline.clearTrack('jump');
            timeline.clearTrack('select', { slot: 2 });
            expect(timeline.tracks).toEqual([]);
        });

        it('removes every track of a type', () => {
            timeline.setLooping('look', lookNorth, { length: 5, ticks: [0] });
            timeline.addOneShot('look', lookNorth, { delay: 0 });
            timeline.getOrCreate('select', { slot: 1 });
            timeline.removeType('look');
            expect(timeline.tracks.map(track => track.key)).toEqual(['select:1']);
        });

        it('removes a track by key', () => {
            const track = timeline.addOneShot('attack', void 0, { delay: 0 });
            timeline.getOrCreate('jump');
            timeline.remove(track.key);
            timeline.remove('jump');
            expect(timeline.tracks).toEqual([]);
        });
    });

    describe('loop length', () => {
        it('drops offsets past a shortened loop from shared tracks only', () => {
            const attack = timeline.getOrCreate('attack');
            attack.setActive(15, true, 20);
            const fixed = timeline.setLooping('jump', void 0, { length: 30, ticks: [15] });
            timeline.setLoopLength(10);
            expect(attack.isEmpty()).toBe(true);
            expect(fixed.activeOffsets()).toEqual([15]);
        });
    });

    describe('setTrackLength', () => {
        it('gives a shared track its own length and drops offsets past it', () => {
            const attack = timeline.getOrCreate('attack');
            attack.setActive(3, true, 20);
            attack.setActive(10, true, 20);
            expect(timeline.setTrackLength('attack', 7)).toBe(true);
            expect(attack.length).toBe(7);
            expect(attack.activeOffsets()).toEqual([3]);
            expect(timeline.getTrack('attack')).toBe(attack);
        });

        it('returns a track to the shared loop aligned to the world tick', () => {
            const jump = timeline.setLooping('jump', void 0, { length: 30, ticks: [0, 25] });
            jump.originTick = 107;
            expect(timeline.setTrackLength('jump', Track.SHARED)).toBe(true);
            expect(jump.length).toBe(Track.SHARED);
            expect(jump.originTick).toBe(0);
            expect(jump.activeOffsets()).toEqual([0]);
        });

        it('keeps the origin of a track given a new fixed length', () => {
            const jump = timeline.setLooping('jump', void 0, { length: 30, ticks: [0] });
            jump.originTick = 107;
            timeline.setTrackLength('jump', 12);
            expect(jump.originTick).toBe(107);
        });

        it.each([0, -3, 2.5, '7', undefined])('rejects a length of %j', (length) => {
            timeline.getOrCreate('attack');
            expect(timeline.setTrackLength('attack', length)).toBe(false);
            expect(timeline.getTrack('attack').length).toBe(Track.SHARED);
        });

        it('rejects a missing or one-shot track', () => {
            const once = timeline.addOneShot('jump', void 0, { delay: 4 });
            expect(timeline.setTrackLength('select:1', 5)).toBe(false);
            expect(timeline.setTrackLength(once.key, 5)).toBe(false);
            expect(once.length).toBe(5);
        });
    });

    describe('pageCount', () => {
        it('covers the longest track', () => {
            timeline.setLooping('jump', void 0, { length: 41, ticks: [0] });
            expect(timeline.pageCount).toBe(3);
        });

        it('covers the shared loop even with no tracks', () => {
            timeline.setLoopLength(200);
            expect(timeline.pageCount).toBe(10);
        });

        it('ignores tracks shorter than the shared loop', () => {
            timeline.setLoopLength(60);
            timeline.setLooping('jump', void 0, { length: 7, ticks: [0] });
            expect(timeline.pageCount).toBe(3);
        });
    });

    it('resets to no tracks and the default loop', () => {
        timeline.setLoopLength(50);
        timeline.getOrCreate('select', { slot: 1 });
        timeline.setLooping('jump', void 0, { length: 7, ticks: [0] });
        timeline.reset();
        expect(timeline.tracks).toEqual([]);
        expect(timeline.loopLength).toBe(20);
    });
});
