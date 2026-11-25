import { describe, it, expect, beforeEach } from 'vitest';
import { Timeline } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/Timeline';
import { TIMELINE_TRACKS } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/TimelineTracks';
import { REPEATABLE_ACTIONS } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/RepeatableAction';

describe('TIMELINE_TRACKS', () => {
    it('lists the tracks in display order', () => {
        expect(TIMELINE_TRACKS.map(track => track.id)).toEqual(['attack', 'interact', 'use', 'usehold', 'build', 'break', 'drop', 'dropstack', 'dropall', 'jump', 'sneak', 'sprint', 'glide']);
    });

    it('marks the held states as hold tracks with no action', () => {
        const holdTracks = TIMELINE_TRACKS.filter(track => track.hold);
        expect(holdTracks.map(track => track.id)).toEqual(['usehold', 'sneak', 'sprint', 'glide']);
        for (const track of holdTracks)
            expect(track.action).toBeUndefined();
    });

    it('labels the new movement tracks', () => {
        expect(TIMELINE_TRACKS.find(t => t.id === 'sneak').labelKey).toBe('simplayer.timeline.track.sneak');
        expect(TIMELINE_TRACKS.find(t => t.id === 'sprint').labelKey).toBe('simplayer.timeline.track.sprint');
        expect(TIMELINE_TRACKS.find(t => t.id === 'glide').labelKey).toBe('simplayer.timeline.track.glide');
    });

    it('maps every other track to its repeatable action', () => {
        for (const track of TIMELINE_TRACKS.filter(t => !t.hold))
            expect(Object.values(REPEATABLE_ACTIONS)).toContain(track.action);
    });

    it('uses distinct label keys for the two use tracks', () => {
        expect(TIMELINE_TRACKS.find(t => t.id === 'use').labelKey).toBe('simplayer.timeline.track.use');
        expect(TIMELINE_TRACKS.find(t => t.id === 'usehold').labelKey).toBe('simplayer.timeline.track.usehold');
        expect(TIMELINE_TRACKS.find(t => t.id === 'attack').labelKey).toBe('simplayer.action.attack');
    });

    it('is frozen', () => {
        expect(Object.isFrozen(TIMELINE_TRACKS)).toBe(true);
        expect(Object.isFrozen(TIMELINE_TRACKS[0])).toBe(true);
    });
});

describe('Timeline', () => {
    let timeline;

    beforeEach(() => {
        timeline = new Timeline();
    });

    it('starts with a one page default loop and nothing active', () => {
        expect(timeline.loopLength).toBe(20);
        expect(timeline.pageCount).toBe(1);
        expect(timeline.isEmpty()).toBe(true);
    });

    it('validates loop lengths', () => {
        expect(Timeline.isValidLoopLength(1)).toBe(true);
        expect(Timeline.isValidLoopLength(200)).toBe(true);
        for (const value of [0, 201, 12.5, '40', NaN, undefined])
            expect(Timeline.isValidLoopLength(value)).toBe(false);
    });

    it('sets and reads active ticks', () => {
        timeline.setActive('attack', 5, true);
        expect(timeline.isActive('attack', 5)).toBe(true);
        expect(timeline.isActive('attack', 6)).toBe(false);
        expect(timeline.isEmpty()).toBe(false);
        timeline.setActive('attack', 5, false);
        expect(timeline.isEmpty()).toBe(true);
    });

    it('ignores ticks outside the loop', () => {
        timeline.setActive('attack', 20, true);
        timeline.setActive('attack', -1, true);
        expect(timeline.isEmpty()).toBe(true);
    });

    it('changes the loop length and page count', () => {
        expect(timeline.setLoopLength(100)).toBe(true);
        expect(timeline.loopLength).toBe(100);
        expect(timeline.pageCount).toBe(5);
    });

    it('rejects an invalid loop length', () => {
        expect(timeline.setLoopLength(0)).toBe(false);
        expect(timeline.loopLength).toBe(20);
    });

    it('drops ticks beyond a shortened loop for good', () => {
        timeline.setLoopLength(40);
        timeline.setActive('attack', 5, true);
        timeline.setActive('attack', 30, true);
        timeline.setLoopLength(20);
        expect(timeline.isActive('attack', 5)).toBe(true);
        timeline.setLoopLength(40);
        expect(timeline.isActive('attack', 30)).toBe(false);
    });

    it('fills and clears a track', () => {
        timeline.fillTrack('jump');
        expect(timeline.isTrackFull('jump')).toBe(true);
        for (let tick = 0; tick < 20; tick++)
            expect(timeline.isActive('jump', tick)).toBe(true);
        timeline.clearTrack('jump');
        expect(timeline.isEmpty()).toBe(true);
    });

    it('is no longer full after the loop grows', () => {
        timeline.fillTrack('jump');
        timeline.setLoopLength(21);
        expect(timeline.isTrackFull('jump')).toBe(false);
    });

    it('maps the world tick onto the loop', () => {
        expect(timeline.getTick(0)).toBe(0);
        expect(timeline.getTick(45)).toBe(5);
        timeline.setLoopLength(1);
        expect(timeline.getTick(1234)).toBe(0);
    });

    it('resets to an empty default loop', () => {
        timeline.setLoopLength(100);
        timeline.setActive('build', 3, true);
        timeline.reset();
        expect(timeline.loopLength).toBe(20);
        expect(timeline.isEmpty()).toBe(true);
    });
});
