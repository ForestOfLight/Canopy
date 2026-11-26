import { describe, it, expect, beforeEach } from 'vitest';
import { PresetV1 } from '../../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/preset/PresetV1';
import { InvalidPresetError } from '../../../../../../../../Canopy[BP]/scripts/src/classes/errors/InvalidPresetError';
import { Timeline } from '../../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/Timeline';

function paint(timeline, track, offsets) {
    for (const offset of offsets)
        track.setActive(offset, true, timeline.loopLength);
    return track;
}

function range(start, end) {
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function reasonOf(body) {
    try {
        PresetV1.decode(body);
    } catch (error) {
        expect(error).toBeInstanceOf(InvalidPresetError);
        return error.reason;
    }
    throw new Error(`Expected ${body} to be rejected`);
}

describe('PresetV1', () => {
    let timeline;
    const block = { dimension: { id: 'minecraft:overworld' }, location: { x: 10, y: 64, z: -3 }, isValid: false };
    const entity = { id: '-12884901887', typeId: 'minecraft:zombie', isValid: false };

    beforeEach(() => {
        timeline = new Timeline();
    });

    describe('encode', () => {
        it('encodes the shared loop length and tracks in timeline order', () => {
            paint(timeline, timeline.getOrCreate('attack'), [0, 10]);
            paint(timeline, timeline.getOrCreate('sneak'), range(0, 9));
            paint(timeline, timeline.getOrCreate('select', { slot: 2 }), [5]);
            expect(PresetV1.encode(timeline)).toBe('20;attack:0,10;sneak:0-9;select/3:5');
        });

        it("writes a track's own length after @", () => {
            timeline.setLooping('move', { direction: 'forward' }, { length: 40, ticks: range(0, 19) });
            expect(PresetV1.encode(timeline)).toContain('move/forward@40:0-19');
        });

        it('writes an empty tick list for a track with no ticks', () => {
            timeline.getOrCreate('jump');
            expect(PresetV1.encode(timeline)).toBe('20;jump:');
        });

        it('leaves out one-shot tracks', () => {
            timeline.addOneShot('jump', void 0, { delay: 5 });
            expect(PresetV1.encode(timeline)).toBe('20');
        });

        it('writes every look and moveto target kind', () => {
            paint(timeline, timeline.getOrCreate('look', { target: { kind: 'cardinal', direction: 'north' } }), [0]);
            paint(timeline, timeline.getOrCreate('look', { target: { kind: 'rotation', rotation: { x: 90, y: -12.34567 } } }), [0]);
            paint(timeline, timeline.getOrCreate('look', { target: { kind: 'location', location: { x: 1.5, y: 64, z: -3.25 } } }), [0]);
            paint(timeline, timeline.getOrCreate('moveto', { target: { kind: 'block', block } }), [0]);
            paint(timeline, timeline.getOrCreate('moveto', { target: { kind: 'entity', entity } }), [0]);
            expect(PresetV1.encode(timeline)).toBe('20;look/north:0;look/rot/90,-12.346:0;look/pos/1.5,64,-3.25:0;moveto/block/overworld/10,64,-3:0;moveto/entity/-12884901887:0');
        });

        it('encodes invalid blocks and entities from their stored ids', () => {
            timeline.getOrCreate('moveto', { target: { kind: 'block', block } });
            timeline.getOrCreate('look', { target: { kind: 'entity', entity } });
            expect(() => PresetV1.encode(timeline)).not.toThrow();
        });
    });

    describe('decode', () => {
        it('decodes the spec example', () => {
            const decoded = PresetV1.decode('20;attack:0,10;sneak:0-9;select/3:5;move/forward@40:0-19;look/rot/90,0:0;moveto/block/overworld/10,64,-3:0');
            expect(decoded.loopLength).toBe(20);
            expect(decoded.tracks).toEqual([
                { source: 'attack:0,10', type: 'attack', params: void 0, length: null, ticks: [0, 10] },
                { source: 'sneak:0-9', type: 'sneak', params: void 0, length: null, ticks: range(0, 9) },
                { source: 'select/3:5', type: 'select', params: { slot: 2 }, length: null, ticks: [5] },
                { source: 'move/forward@40:0-19', type: 'move', params: { direction: 'forward' }, length: 40, ticks: range(0, 19) },
                { source: 'look/rot/90,0:0', type: 'look', params: { target: { kind: 'rotation', rotation: { x: 90, y: 0 } } }, length: null, ticks: [0] },
                { source: 'moveto/block/overworld/10,64,-3:0', type: 'moveto', params: { target: { kind: 'block', dimension: 'overworld', location: { x: 10, y: 64, z: -3 } } }, length: null, ticks: [0] }
            ]);
        });

        it('decodes entity, location and cardinal targets', () => {
            const targets = PresetV1.decode('20;look/entity/-12884901887:0;look/pos/1.5,64,-3.25:0;look/up:0').tracks.map(track => track.params.target);
            expect(targets).toEqual([
                { kind: 'entity', id: '-12884901887' },
                { kind: 'location', location: { x: 1.5, y: 64, z: -3.25 } },
                { kind: 'cardinal', direction: 'up' }
            ]);
        });

        it('round-trips what it encodes', () => {
            paint(timeline, timeline.getOrCreate('attack'), [0, 3, 4, 5, 19]);
            paint(timeline, timeline.getOrCreate('select', { slot: 8 }), [1]);
            timeline.setLooping('move', { direction: 'left' }, { length: 7, ticks: [0, 6] });
            paint(timeline, timeline.getOrCreate('look', { target: { kind: 'rotation', rotation: { x: -45.5, y: 180 } } }), [2]);
            timeline.getOrCreate('usehold');
            const decoded = PresetV1.decode(PresetV1.encode(timeline));
            expect(decoded.loopLength).toBe(20);
            expect(decoded.tracks.map(({ type, params, length, ticks }) => ({ type, params, length, ticks }))).toEqual(
                timeline.tracks.map(track => ({ type: track.type, params: track.params, length: track.length, ticks: track.activeOffsets() }))
            );
        });

        it('merges overlapping ranges and sorts ticks', () => {
            expect(PresetV1.decode('20;attack:5,0-3,2').tracks[0].ticks).toEqual([0, 1, 2, 3, 5]);
        });

        it('ignores empty segments', () => {
            expect(PresetV1.decode('20;attack:0;;jump:1;').tracks.map(track => track.type)).toEqual(['attack', 'jump']);
        });

        it('rejects a bad loop length', () => {
            for (const body of ['0', '801', 'abc', '12.5', '', '20.0;attack:0', '20;attack@0:0', '20;attack@801:0'])
                expect(reasonOf(body)).toEqual({ translate: 'simplayer.timeline.preset.error.looplength' });
        });

        it('rejects unreadable tracks naming the segment', () => {
            const segments = ['Attack:0', 'attack', 'attack:a', 'attack:5-2', 'attack:-1', 'attack/1:0', 'select/0:0', 'select/10:0',
                'move/up:0', 'look/rot/1:0', 'look/pos/1,2:0', 'look/pos/1e3,2,3:0', 'moveto/north:0', 'moveto/block/overworld/1.5,2,3:0', 'look/entity/abc:0'];
            for (const segment of segments)
                expect(reasonOf(`20;${segment}`)).toEqual({ translate: 'simplayer.timeline.preset.error.track', with: [segment] });
        });

        it("rejects ticks past the track's loop", () => {
            expect(reasonOf('10;attack:15')).toEqual({ translate: 'simplayer.timeline.preset.error.tick', with: ['attack:15'] });
            expect(reasonOf('20;attack@5:5')).toEqual({ translate: 'simplayer.timeline.preset.error.tick', with: ['attack@5:5'] });
            expect(PresetV1.decode('20;attack@5:4').tracks[0].ticks).toEqual([4]);
        });
    });
});
