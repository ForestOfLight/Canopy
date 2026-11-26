import { describe, it, expect } from 'vitest';
import { Track } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/Track';

function makeTrack(overrides = {}) {
    return new Track({ type: 'jump', key: 'jump', ...overrides });
}

describe('Track', () => {
    it('defaults to an empty looping track on the shared length with origin 0', () => {
        const track = makeTrack();
        expect(track.length).toBe(Track.SHARED);
        expect(track.loops).toBe(true);
        expect(track.originTick).toBe(0);
        expect(track.isEmpty()).toBe(true);
    });

    it('uses the shared length when it has no length of its own', () => {
        expect(makeTrack().effectiveLength(20)).toBe(20);
        expect(makeTrack({ length: 7 }).effectiveLength(20)).toBe(7);
    });

    it('wraps a looping offset around its own length from its origin', () => {
        const track = makeTrack({ length: 7, originTick: 100 });
        expect(track.offsetAt(107, 20)).toBe(0);
        expect(track.offsetAt(110, 20)).toBe(3);
        expect(track.offsetAt(99, 20)).toBe(6);
    });

    it('wraps a shared looping offset around the shared length', () => {
        expect(makeTrack().offsetAt(45, 40)).toBe(5);
    });

    it('counts a one-shot offset from its origin without wrapping', () => {
        const track = makeTrack({ length: 41, loops: false, originTick: 50, ticks: [40] });
        expect(track.offsetAt(90, 20)).toBe(40);
        expect(track.isFinished(90, 20)).toBe(false);
        expect(track.isFinished(91, 20)).toBe(true);
    });

    it('never finishes a looping track', () => {
        expect(makeTrack({ length: 1 }).isFinished(1000, 20)).toBe(false);
    });

    it('sets and clears active offsets inside its length', () => {
        const track = makeTrack();
        track.setActive(3, true, 20);
        expect(track.isActive(3)).toBe(true);
        track.setActive(3, false, 20);
        expect(track.isActive(3)).toBe(false);
    });

    it('ignores offsets outside its length', () => {
        const track = makeTrack();
        track.setActive(25, true, 20);
        track.setActive(-1, true, 20);
        track.setActive(1.5, true, 20);
        expect(track.isEmpty()).toBe(true);
    });

    it('lists active offsets in order', () => {
        const track = makeTrack({ ticks: [9, 2, 5] });
        expect(track.activeOffsets()).toEqual([2, 5, 9]);
    });

    it('drops offsets at or past a length', () => {
        const track = makeTrack({ ticks: [2, 10, 15] });
        track.dropOffsetsFrom(10);
        expect(track.activeOffsets()).toEqual([2]);
    });

    it('clears every offset', () => {
        const track = makeTrack({ ticks: [1, 2] });
        track.clear();
        expect(track.isEmpty()).toBe(true);
    });

    it('knows whether its type is always present', () => {
        expect(makeTrack().isAlwaysPresent()).toBe(true);
        expect(new Track({ type: 'select', params: { slot: 1 }, key: 'select:1' }).isAlwaysPresent()).toBe(false);
        expect(makeTrack({ key: 'jump#1', loops: false }).isAlwaysPresent()).toBe(false);
    });

    describe('label', () => {
        it('keeps its label after an entity target becomes invalid', () => {
            const entity = { id: '3', typeId: 'minecraft:zombie', isValid: true };
            let alive = true;
            Object.defineProperty(entity, 'nameTag', { get() { if (!alive) throw new Error('InvalidEntityError'); return 'Zed'; } });
            const track = new Track({ type: 'look', params: { target: { kind: 'entity', entity } }, key: 'look:entity:3' });
            alive = false;
            entity.isValid = false;
            expect(() => track.labelParts()).not.toThrow();
            expect(track.labelParts()).toEqual([{ translate: 'simplayer.timeline.track.look' }, { text: ' Zed' }]);
        });


        it('is the bare track label on the shared length', () => {
            expect(makeTrack().labelParts()).toEqual([{ translate: 'simplayer.action.jump' }]);
        });

        it('shows a fixed length', () => {
            expect(makeTrack({ length: 7 }).labelParts()).toEqual([{ translate: 'simplayer.action.jump' }, { text: ' §7(7t)' }]);
        });

        it('marks a one-shot track', () => {
            expect(makeTrack({ length: 1, loops: false }).labelParts()).toEqual([{ translate: 'simplayer.action.jump' }, { text: ' §7(' }, { translate: 'simplayer.action.track.once' }, { text: ')' }]);
        });
    });
});
