import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Direction } from '@minecraft/server';
import { VIEW_DISTANCE, CARDINAL_ROTATIONS, getViewedBlockHit, getViewedBlockFaceLocation, getViewedBlock, getViewedEntity } from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/targeting';

describe('targeting', () => {
    let source;
    let block;

    beforeEach(() => {
        block = { location: { x: 1, y: 64, z: 2 } };
        source = {
            getBlockFromViewDirection: vi.fn(() => ({ block, face: Direction.Up, faceLocation: { x: 0.5, y: 1, z: 0.5 } })),
            getEntitiesFromViewDirection: vi.fn(() => [])
        };
    });

    it('views up to 1024 blocks away', () => {
        expect(VIEW_DISTANCE).toBe(1024);
        getViewedBlockHit(source);
        getViewedEntity(source);
        expect(source.getBlockFromViewDirection).toHaveBeenCalledWith({ maxDistance: 1024 });
        expect(source.getEntitiesFromViewDirection).toHaveBeenCalledWith({ maxDistance: 1024 });
    });

    it('keeps the cardinal rotations', () => {
        expect(CARDINAL_ROTATIONS).toEqual({
            up: { x: -90, y: 0 }, down: { x: 90, y: 0 }, north: { x: 0, y: 180 },
            south: { x: 0, y: 0 }, east: { x: 0, y: -90 }, west: { x: 0, y: 90 }
        });
    });

    it('returns the viewed block', () => {
        expect(getViewedBlock(source)).toBe(block);
    });

    it('returns the viewed block face location', () => {
        const location = getViewedBlockFaceLocation(source);
        expect({ x: location.x, y: location.y, z: location.z }).toEqual({ x: 1.5, y: 66, z: 2.5 });
    });

    it('returns undefined when no block is viewed', () => {
        source.getBlockFromViewDirection.mockReturnValue(void 0);
        expect(getViewedBlockHit(source)).toBeUndefined();
        expect(getViewedBlock(source)).toBeUndefined();
        expect(getViewedBlockFaceLocation(source)).toBeUndefined();
    });

    it('returns undefined when no entity is viewed', () => {
        expect(getViewedEntity(source)).toBeUndefined();
    });

    it('skips proxy inventory entities', () => {
        const cow = { typeId: 'minecraft:cow' };
        source.getEntitiesFromViewDirection.mockReturnValue([{ entity: { typeId: 'canopy:inventory_proxy' } }, { entity: cow }]);
        expect(getViewedEntity(source)).toBe(cow);
    });
});
