import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Entity, Player } from '@minecraft/server';
import { PeekCaptureEntity } from '../../../../../../Canopy[BP]/scripts/src/classes/peek/PeekCaptureEntity';

describe('PeekCaptureEntity', () => {
    let player;
    let spawnedEntity;

    beforeEach(() => {
        spawnedEntity = new Entity();
        spawnedEntity.typeId = 'canopy:peek_capture';
        spawnedEntity.teleport = vi.fn();
        player = new Player();
        player.getHeadLocation.mockReturnValue({ x: 1, y: 66, z: 2 });
        player.dimension.spawnEntity = vi.fn(() => spawnedEntity);
    });

    describe('spawnFor', () => {
        it('spawns the capture entity at the player head location', () => {
            PeekCaptureEntity.spawnFor(player);

            expect(player.dimension.spawnEntity).toHaveBeenCalledWith(
                'canopy:peek_capture',
                { x: 1, y: 66, z: 2 },
                { initialPersistence: true }
            );
        });

        it('never mutates the entity after spawning so the client hitbox is right immediately', () => {
            PeekCaptureEntity.spawnFor(player);

            expect(spawnedEntity.triggerEvent).not.toHaveBeenCalled();
            expect(spawnedEntity.addTag).not.toHaveBeenCalled();
        });
    });

    describe('identification', () => {
        it('recognises the capture entity so raycasts can skip it', () => {
            expect(PeekCaptureEntity.isCaptureEntity(spawnedEntity)).toBe(true);
        });

        it('does not mistake another entity for a capture entity', () => {
            expect(PeekCaptureEntity.isCaptureEntity(new Entity())).toBe(false);
            expect(PeekCaptureEntity.isCaptureEntity(void 0)).toBe(false);
        });

        it('drops capture entities out of a raycast result', () => {
            const chestMinecart = new Entity();
            chestMinecart.typeId = 'minecraft:chest_minecart';

            const hits = PeekCaptureEntity.excludeFrom([{ entity: spawnedEntity }, { entity: chestMinecart }]);

            expect(hits).toEqual([{ entity: chestMinecart }]);
        });

        it('matches only the entity it wraps', () => {
            const capture = PeekCaptureEntity.spawnFor(player);

            expect(capture.matches(spawnedEntity)).toBe(true);
            expect(capture.matches(new Entity())).toBe(false);
            expect(capture.matches(void 0)).toBe(false);
        });
    });

    describe('removal', () => {
        it('removes the entity', () => {
            const capture = PeekCaptureEntity.spawnFor(player);

            capture.remove();

            expect(spawnedEntity.remove).toHaveBeenCalled();
            expect(capture.isValid).toBe(false);
        });

        it('swallows a removal failure', () => {
            spawnedEntity.remove.mockImplementation(() => { throw new Error('gone'); });
            vi.spyOn(console, 'warn').mockImplementation(() => void 0);
            const capture = PeekCaptureEntity.spawnFor(player);

            expect(() => capture.remove()).not.toThrow();
        });
    });

    describe('sweepOrphans', () => {
        it('removes capture entities left behind in the dimension', () => {
            const orphan = new Entity();
            const dimension = { getEntities: vi.fn(() => [orphan]) };

            PeekCaptureEntity.sweepOrphans(dimension);

            expect(dimension.getEntities).toHaveBeenCalledWith({ families: ['canopy:peek_capture'] });
            expect(orphan.remove).toHaveBeenCalled();
        });

        it('keeps sweeping after one removal throws', () => {
            const failing = new Entity();
            failing.remove.mockImplementation(() => { throw new Error('gone'); });
            const survivor = new Entity();
            vi.spyOn(console, 'warn').mockImplementation(() => void 0);
            const dimension = { getEntities: vi.fn(() => [failing, survivor]) };

            PeekCaptureEntity.sweepOrphans(dimension);

            expect(survivor.remove).toHaveBeenCalled();
        });
    });

    describe('teleportTo', () => {
        it('teleports the underlying entity into the given dimension', () => {
            const capture = PeekCaptureEntity.spawnFor(player);
            const location = { x: 3, y: 70, z: 4 };

            capture.teleportTo(location, player.dimension);

            expect(spawnedEntity.teleport).toHaveBeenCalledWith(location, { dimension: player.dimension });
        });

        it('does nothing when the entity is no longer valid', () => {
            const capture = PeekCaptureEntity.spawnFor(player);
            spawnedEntity.isValid = false;

            capture.teleportTo({ x: 0, y: 0, z: 0 }, player.dimension);

            expect(spawnedEntity.teleport).not.toHaveBeenCalled();
        });
    });
});
