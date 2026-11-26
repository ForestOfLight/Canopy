import { describe, it, expect } from 'vitest';
import { trackKey, trackLabel, trackTypeLabel, TRACK_TYPE_ORDER, PARAMETERISED_TYPES, TRACK_TYPES, TRACK_KINDS, MOVE_DIRECTIONS } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/TrackTypes';

const cardinal = direction => ({ target: { kind: 'cardinal', direction } });

describe('TrackTypes', () => {
    describe('catalogue', () => {
        it('lists every track type in menu order', () => {
            expect(TRACK_TYPE_ORDER).toEqual(['attack', 'interact', 'use', 'usehold', 'build', 'break', 'drop', 'dropstack', 'dropall', 'jump', 'sneak', 'sprint', 'glide', 'select', 'look', 'move', 'moveto']);
        });

        it('names each track type for menus', () => {
            expect(trackTypeLabel('jump')).toEqual({ translate: 'simplayer.action.jump' });
            expect(trackTypeLabel('usehold')).toEqual({ translate: 'simplayer.timeline.track.usehold' });
            expect(trackTypeLabel('select')).toEqual({ translate: 'simplayer.timeline.addtrack.select' });
            expect(trackTypeLabel('moveto')).toEqual({ translate: 'simplayer.timeline.addtrack.moveto' });
        });

        it('lists the parameterised types', () => {
            expect(PARAMETERISED_TYPES).toEqual(['select', 'look', 'move', 'moveto']);
        });

        it('lists the move directions', () => {
            expect(MOVE_DIRECTIONS).toEqual(['forward', 'backward', 'left', 'right']);
        });

        it('marks holds and events', () => {
            expect(TRACK_TYPES.jump.kind).toBe(TRACK_KINDS.EVENT);
            expect(TRACK_TYPES.select.kind).toBe(TRACK_KINDS.EVENT);
            expect(TRACK_TYPES.usehold.kind).toBe(TRACK_KINDS.HOLD);
            expect(TRACK_TYPES.move.kind).toBe(TRACK_KINDS.HOLD);
        });

        it('reasserts only sneak and sprint', () => {
            const reasserting = Object.values(TRACK_TYPES).filter(info => info.reassert).map(info => info.type);
            expect(reasserting).toEqual(['sneak', 'sprint']);
        });

        it('marks only the parameterised types as parameterised', () => {
            const parameterised = Object.values(TRACK_TYPES).filter(info => info.parameterised).map(info => info.type);
            expect(parameterised.sort()).toEqual([...PARAMETERISED_TYPES].sort());
        });
    });

    describe('trackKey', () => {
        it('uses the bare type for a track without params', () => {
            expect(trackKey('jump')).toBe('jump');
        });

        it('keys a select by slot', () => {
            expect(trackKey('select', { slot: 3 })).toBe('select:3');
        });

        it('keys a move by direction', () => {
            expect(trackKey('move', { direction: 'backward' })).toBe('move:backward');
        });

        it('keys a cardinal look', () => {
            expect(trackKey('look', cardinal('north'))).toBe('look:cardinal:north');
        });

        it('keys a rotation look', () => {
            expect(trackKey('look', { target: { kind: 'rotation', rotation: { x: 10, y: 90 } } })).toBe('look:rotation:10,90');
        });

        it('keys a location look', () => {
            expect(trackKey('look', { target: { kind: 'location', location: { x: 1.5, y: 64, z: -3 } } })).toBe('look:location:1.5,64,-3');
        });

        it('keys a block moveto with its dimension', () => {
            const block = { location: { x: 1, y: 64, z: 2 }, dimension: { id: 'minecraft:overworld' } };
            expect(trackKey('moveto', { target: { kind: 'block', block } })).toBe('moveto:block:minecraft:overworld:1,64,2');
        });

        it('keys an entity target by id', () => {
            expect(trackKey('look', { target: { kind: 'entity', entity: { id: '-42' } } })).toBe('look:entity:-42');
        });

        it('returns equal keys for equal params', () => {
            expect(trackKey('look', cardinal('east'))).toBe(trackKey('look', cardinal('east')));
        });
    });

    describe('trackLabel', () => {
        it('uses the action label key for a plain action', () => {
            expect(trackLabel('jump')).toEqual([{ translate: 'simplayer.action.jump' }]);
        });

        it('uses the timeline label key for use and holds', () => {
            expect(trackLabel('use')).toEqual([{ translate: 'simplayer.timeline.track.use' }]);
            expect(trackLabel('usehold')).toEqual([{ translate: 'simplayer.timeline.track.usehold' }]);
            expect(trackLabel('glide')).toEqual([{ translate: 'simplayer.timeline.track.glide' }]);
        });

        it('shows a one-indexed slot for select', () => {
            expect(trackLabel('select', { slot: 3 })).toEqual([{ translate: 'simplayer.timeline.track.select', with: ['4'] }]);
        });

        it('names the move direction', () => {
            expect(trackLabel('move', { direction: 'left' })).toEqual([{ translate: 'simplayer.timeline.track.move.left' }]);
        });

        it('names a cardinal look target', () => {
            expect(trackLabel('look', cardinal('north'))).toEqual([{ translate: 'simplayer.timeline.track.look.north' }]);
        });

        it('rounds location coordinates to one decimal', () => {
            const label = trackLabel('moveto', { target: { kind: 'location', location: { x: 1.26, y: 64, z: -3.04 } } });
            expect(label).toEqual([{ translate: 'simplayer.timeline.track.moveto' }, { text: ' 1.3 64 -3' }]);
        });

        it('shows block coordinates', () => {
            const block = { location: { x: 1, y: 64, z: 2 }, dimension: { id: 'minecraft:overworld' } };
            expect(trackLabel('moveto', { target: { kind: 'block', block } })).toEqual([{ translate: 'simplayer.timeline.track.moveto' }, { text: ' 1 64 2' }]);
        });

        it('shows a rotation', () => {
            expect(trackLabel('look', { target: { kind: 'rotation', rotation: { x: 10, y: 90 } } })).toEqual([{ translate: 'simplayer.timeline.track.look' }, { text: ' 10 90' }]);
        });

        it('uses the entity name tag when present', () => {
            const entity = { id: '1', nameTag: 'Steve', typeId: 'minecraft:player' };
            expect(trackLabel('look', { target: { kind: 'entity', entity } })).toEqual([{ translate: 'simplayer.timeline.track.look' }, { text: ' Steve' }]);
        });

        it('shortens a long entity name tag', () => {
            const entity = { id: '1', nameTag: 'A Very Long Custom Entity Name Tag That Goes On', typeId: 'minecraft:zombie' };
            expect(trackLabel('look', { target: { kind: 'entity', entity } })).toEqual([{ translate: 'simplayer.timeline.track.look' }, { text: ' A Very Long Custom Enti…' }]);
        });

        it('falls back to the entity type without its namespace', () => {
            const entity = { id: '1', nameTag: '', typeId: 'minecraft:cow' };
            expect(trackLabel('look', { target: { kind: 'entity', entity } })).toEqual([{ translate: 'simplayer.timeline.track.look' }, { text: ' cow' }]);
        });
    });
});
