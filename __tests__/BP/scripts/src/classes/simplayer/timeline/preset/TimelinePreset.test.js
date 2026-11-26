import { vi, describe, it, expect, beforeEach } from 'vitest';
import { world } from '@minecraft/server';
import { applyPreset, exportPreset } from '../../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/preset/TimelinePreset';
import { InvalidPresetError } from '../../../../../../../../Canopy[BP]/scripts/src/classes/errors/InvalidPresetError';
import { Timeline } from '../../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/Timeline';

function reasonOf(timeline, text) {
    try {
        applyPreset(timeline, text);
    } catch (error) {
        expect(error).toBeInstanceOf(InvalidPresetError);
        return error.reason;
    }
    throw new Error(`Expected ${text} to be rejected`);
}

function snapshot(timeline) {
    return { loopLength: timeline.loopLength, tracks: timeline.tracks.map(track => ({ key: track.key, ticks: track.activeOffsets() })) };
}

describe('TimelinePreset', () => {
    let timeline;

    beforeEach(() => {
        vi.clearAllMocks();
        world.getEntity.mockReset();
        for (const id of ['minecraft:overworld', 'minecraft:nether'])
            world.getDimension(id).getBlock.mockReset();
        timeline = new Timeline();
    });

    it('exports with the version tag', () => {
        timeline.getOrCreate('attack').setActive(0, true, timeline.loopLength);
        expect(exportPreset(timeline)).toBe('v1;20;attack:0');
    });

    it('applies a preset and replaces the timeline', () => {
        timeline.getOrCreate('jump');
        expect(applyPreset(timeline, 'v1;40;sneak:0-9;select/3:5')).toEqual({ dropped: [] });
        expect(timeline.loopLength).toBe(40);
        expect(timeline.tracks.map(track => track.key)).toEqual(['sneak', 'select:2']);
        expect(timeline.getTrack('sneak').activeOffsets()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('round-trips the export', () => {
        timeline.setLoopLength(30);
        timeline.getOrCreate('look', { target: { kind: 'cardinal', direction: 'west' } }).setActive(3, true, 30);
        timeline.getOrCreate('look', { target: { kind: 'rotation', rotation: { x: 12.5, y: -90 } } }).setActive(0, true, 30);
        timeline.getOrCreate('moveto', { target: { kind: 'location', location: { x: 1, y: 2.25, z: -3 } } });
        timeline.setLooping('move', { direction: 'backward' }, { length: 6, ticks: [1, 2] });
        const preset = exportPreset(timeline);
        const fresh = new Timeline();
        applyPreset(fresh, preset);
        expect(exportPreset(fresh)).toBe(preset);
    });

    it('trims surrounding whitespace', () => {
        applyPreset(timeline, '  v1;20;attack:0\n');
        expect(timeline.tracks.map(track => track.key)).toEqual(['attack']);
    });

    it('rejects an unknown version', () => {
        for (const [text, tag] of [['v9;20;attack:0', 'v9'], ['20;attack:0', '20'], ['', ''], ['toString;20', 'toString']])
            expect(reasonOf(timeline, text)).toEqual({ translate: 'simplayer.timeline.preset.error.version', with: [tag] });
    });

    it('leaves the timeline unchanged when a preset is invalid', () => {
        timeline.setLoopLength(30);
        timeline.getOrCreate('attack').setActive(4, true, 30);
        const before = snapshot(timeline);
        expect(reasonOf(timeline, 'v1;10;attack:15')).toEqual({ translate: 'simplayer.timeline.preset.error.tick', with: ['attack:15'] });
        expect(snapshot(timeline)).toEqual(before);
    });

    it('resolves entity targets by id', () => {
        const entity = { id: '-12884901887', typeId: 'minecraft:zombie' };
        world.getEntity.mockReturnValue(entity);
        applyPreset(timeline, 'v1;20;look/entity/-12884901887:0');
        expect(world.getEntity).toHaveBeenCalledWith('-12884901887');
        expect(timeline.tracks[0].params.target).toEqual({ kind: 'entity', entity });
    });

    it('resolves block targets in their dimension', () => {
        const nether = world.getDimension('minecraft:nether');
        const block = { dimension: nether, location: { x: 10, y: 64, z: -3 } };
        nether.getBlock.mockReturnValue(block);
        applyPreset(timeline, 'v1;20;moveto/block/nether/10,64,-3:0');
        expect(nether.getBlock).toHaveBeenCalledWith({ x: 10, y: 64, z: -3 });
        expect(timeline.tracks[0].params.target).toEqual({ kind: 'block', block });
    });

    describe('drops tracks whose target is missing and applies the rest', () => {
        function expectDropped(segment) {
            expect(applyPreset(timeline, `v1;20;attack:0;${segment}`)).toEqual({ dropped: [segment] });
            expect(timeline.tracks.map(track => track.key)).toEqual(['attack']);
        }

        it('for a missing entity', () => {
            world.getEntity.mockReturnValue(void 0);
            expectDropped('look/entity/5:0');
        });

        it('for a block in an unloaded chunk', () => {
            world.getDimension('minecraft:overworld').getBlock.mockReturnValue(void 0);
            expectDropped('moveto/block/overworld/0,0,0:0');
        });

        it('for a block outside the world', () => {
            world.getDimension('minecraft:overworld').getBlock.mockImplementation(() => { throw new Error('LocationOutOfWorldBoundariesError'); });
            expectDropped('moveto/block/overworld/0,9999,0:0');
        });

        it('for an unknown dimension', () => {
            world.getDimension.mockImplementationOnce(() => { throw new Error('unknown dimension'); });
            expectDropped('moveto/block/nowhere/0,0,0:0');
        });
    });

    it('rejects duplicate tracks', () => {
        timeline.getOrCreate('jump');
        const before = snapshot(timeline);
        expect(reasonOf(timeline, 'v1;20;attack:0;attack:5')).toEqual({ translate: 'simplayer.timeline.preset.error.duplicate', with: ['attack:5'] });
        expect(reasonOf(timeline, 'v1;20;look/pos/1,2,3:0;look/pos/1.0,2,3:5')).toEqual({ translate: 'simplayer.timeline.preset.error.duplicate', with: ['look/pos/1.0,2,3:5'] });
        expect(snapshot(timeline)).toEqual(before);
    });
});
