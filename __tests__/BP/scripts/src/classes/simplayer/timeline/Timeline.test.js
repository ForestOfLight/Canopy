import { describe, it, expect, beforeEach } from 'vitest';
import { Timeline } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/Timeline';
import { Track } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/Track';
import { ALWAYS_PRESENT_TYPES } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/TrackTypes';

const JUMP_INDEX = 9;
const lookNorth = { target: { kind: 'cardinal', direction: 'north' } };

describe('Timeline', () => {
    let timeline;

    beforeEach(() => {
        timeline = new Timeline();
    });

    it('starts with an empty always-present track for each type', () => {
        expect(timeline.tracks.map(track => track.type)).toEqual([...ALWAYS_PRESENT_TYPES]);
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
        expect(timeline.getTrack('jump')).toBe(timeline.tracks[JUMP_INDEX]);
        expect(timeline.getTrack('select:2')).toBeUndefined();
    });

    describe('getOrCreate', () => {
        it('appends one looping shared track with origin 0', () => {
            const track = timeline.getOrCreate('select', { slot: 2 });
            expect(timeline.tracks.at(-1)).toBe(track);
            expect(track.key).toBe('select:2');
            expect(track.length).toBe(Track.SHARED);
            expect(track.loops).toBe(true);
            expect(track.originTick).toBe(0);
        });

        it('returns the existing track for the same params', () => {
            const track = timeline.getOrCreate('select', { slot: 2 });
            expect(timeline.getOrCreate('select', { slot: 2 })).toBe(track);
            expect(timeline.tracks).toHaveLength(14);
        });
    });

    describe('setLooping', () => {
        it('replaces an always-present track in its slot with a fresh one', () => {
            const before = timeline.tracks[JUMP_INDEX];
            const track = timeline.setLooping('jump', void 0, { length: 7, ticks: [0] });
            expect(timeline.tracks[JUMP_INDEX]).toBe(track);
            expect(track).not.toBe(before);
            expect(track.length).toBe(7);
            expect(track.originTick).toBeUndefined();
            expect(track.activeOffsets()).toEqual([0]);
            expect(timeline.tracks).toHaveLength(13);
        });

        it('moves a replaced extra track to the end', () => {
            timeline.setLooping('move', { direction: 'forward' }, { length: 1, ticks: [0] });
            timeline.setLooping('move', { direction: 'backward' }, { length: 1, ticks: [0] });
            timeline.setLooping('move', { direction: 'forward' }, { length: 1, ticks: [0] });
            const keys = timeline.tracks.slice(13).map(track => track.key);
            expect(keys).toEqual(['move:backward', 'move:forward']);
        });
    });

    describe('addOneShot', () => {
        it('appends a separate one-shot track each time', () => {
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
            expect(timeline.tracks[JUMP_INDEX].isEmpty()).toBe(true);
            expect(timeline.isEmpty()).toBe(false);
        });
    });

    describe('clearTrack', () => {
        it('resets an always-present track to an empty shared track', () => {
            timeline.setLooping('jump', void 0, { length: 7, ticks: [0] });
            timeline.clearTrack('jump');
            const track = timeline.tracks[JUMP_INDEX];
            expect(track.type).toBe('jump');
            expect(track.isEmpty()).toBe(true);
            expect(track.length).toBe(Track.SHARED);
            expect(track.originTick).toBe(0);
        });

        it('removes an extra track', () => {
            timeline.getOrCreate('select', { slot: 2 });
            timeline.clearTrack('select', { slot: 2 });
            expect(timeline.getTrack('select:2')).toBeUndefined();
        });
    });

    describe('removal', () => {
        it('removes every extra track of a type', () => {
            timeline.setLooping('look', lookNorth, { length: 5, ticks: [0] });
            timeline.addOneShot('look', lookNorth, { delay: 0 });
            timeline.getOrCreate('select', { slot: 1 });
            timeline.removeType('look');
            expect(timeline.tracks.slice(13).map(track => track.key)).toEqual(['select:1']);
        });

        it('removes an extra track by key', () => {
            const track = timeline.addOneShot('attack', void 0, { delay: 0 });
            timeline.remove(track.key);
            expect(timeline.getTrack(track.key)).toBeUndefined();
        });

        it('never removes an always-present track', () => {
            timeline.remove('jump');
            expect(timeline.tracks).toHaveLength(13);
        });
    });

    describe('loop length', () => {
        it('drops offsets past a shortened loop from shared tracks only', () => {
            timeline.tracks[0].setActive(15, true, 20);
            const fixed = timeline.setLooping('jump', void 0, { length: 30, ticks: [15] });
            timeline.setLoopLength(10);
            expect(timeline.tracks[0].isEmpty()).toBe(true);
            expect(fixed.activeOffsets()).toEqual([15]);
        });
    });

    describe('pageCount', () => {
        it('covers the longest track', () => {
            timeline.setLooping('jump', void 0, { length: 41, ticks: [0] });
            expect(timeline.pageCount).toBe(3);
        });

        it('covers the shared loop', () => {
            timeline.setLoopLength(200);
            expect(timeline.pageCount).toBe(10);
        });
    });

    it('resets to the always-present tracks and the default loop', () => {
        timeline.setLoopLength(50);
        timeline.getOrCreate('select', { slot: 1 });
        timeline.setLooping('jump', void 0, { length: 7, ticks: [0] });
        timeline.reset();
        expect(timeline.tracks).toHaveLength(13);
        expect(timeline.isEmpty()).toBe(true);
        expect(timeline.loopLength).toBe(20);
        expect(timeline.tracks[JUMP_INDEX].length).toBe(Track.SHARED);
    });
});
