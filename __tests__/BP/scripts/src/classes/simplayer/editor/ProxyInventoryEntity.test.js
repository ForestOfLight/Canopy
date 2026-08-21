import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Container, Entity, EntityComponentTypes, Player } from '@minecraft/server';
import { ProxyInventoryEntity } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/editor/ProxyInventoryEntity';

describe('ProxyInventoryEntity', () => {
    let player;
    let spawnedEntity;
    let container;

    beforeEach(() => {
        container = new Container({ size: 54 });
        spawnedEntity = new Entity();
        spawnedEntity.teleport = vi.fn();
        spawnedEntity.getComponent.mockImplementation(componentId => {
            if (componentId === EntityComponentTypes.Inventory)
                return { container };
            return void 0;
        });
        player = new Player();
        player.getHeadLocation.mockReturnValue({ x: 1, y: 66, z: 2 });
        player.dimension.spawnEntity = vi.fn(() => spawnedEntity);
    });

    describe('spawnFor', () => {
        it('spawns the database entity type at the player head location', () => {
            ProxyInventoryEntity.spawnFor(player);
            expect(player.dimension.spawnEntity).toHaveBeenCalledWith(
                'canopy:nbt_item_database',
                { x: 1, y: 66, z: 2 },
                { initialPersistence: true }
            );
        });

        it('tags the entity so it can be told apart from database entities', () => {
            ProxyInventoryEntity.spawnFor(player);
            expect(spawnedEntity.addTag).toHaveBeenCalledWith(ProxyInventoryEntity.PROXY_TAG);
        });

        it('triggers the component group that makes the container openable', () => {
            ProxyInventoryEntity.spawnFor(player);
            expect(spawnedEntity.triggerEvent).toHaveBeenCalledWith('canopy:become_inventory_proxy');
        });

        it('exposes the entity container', () => {
            const proxy = ProxyInventoryEntity.spawnFor(player);
            expect(proxy.container).toBe(container);
        });
    });

    describe('entityTypeId', () => {
        it('exposes the spawned entity type so subscribers cannot drift from it', () => {
            expect(ProxyInventoryEntity.entityTypeId).toBe('canopy:nbt_item_database');
        });
    });

    describe('dimensionId', () => {
        it('reports the dimension the proxy currently lives in', () => {
            const proxy = ProxyInventoryEntity.spawnFor(player);
            expect(proxy.dimensionId).toBe(spawnedEntity.dimension.id);
        });

        it('is undefined once the entity is invalid', () => {
            const proxy = ProxyInventoryEntity.spawnFor(player);
            spawnedEntity.isValid = false;
            expect(proxy.dimensionId).toBeUndefined();
        });
    });

    describe('teleportTo', () => {
        it('teleports the underlying entity into the given dimension', () => {
            const proxy = ProxyInventoryEntity.spawnFor(player);
            const dimension = { id: 'minecraft:nether' };
            proxy.teleportTo({ x: 3, y: 4, z: 5 }, dimension);
            expect(spawnedEntity.teleport).toHaveBeenCalledWith({ x: 3, y: 4, z: 5 }, { dimension });
        });

        it('does nothing when the entity is no longer valid', () => {
            const proxy = ProxyInventoryEntity.spawnFor(player);
            spawnedEntity.isValid = false;
            proxy.teleportTo({ x: 3, y: 4, z: 5 }, player.dimension);
            expect(spawnedEntity.teleport).not.toHaveBeenCalled();
        });
    });

    describe('remove', () => {
        it('removes the entity', () => {
            const proxy = ProxyInventoryEntity.spawnFor(player);
            proxy.remove();
            expect(spawnedEntity.remove).toHaveBeenCalled();
        });

        it('swallows a removal failure', () => {
            const proxy = ProxyInventoryEntity.spawnFor(player);
            spawnedEntity.remove.mockImplementation(() => {
                throw new Error('entity already gone');
            });
            expect(() => proxy.remove()).not.toThrow();
        });
    });

    describe('sweepOrphans', () => {
        it('removes every tagged proxy entity left in the dimension', () => {
            const orphanA = new Entity();
            const orphanB = new Entity();
            const dimension = { getEntities: vi.fn(() => [orphanA, orphanB]) };

            ProxyInventoryEntity.sweepOrphans(dimension);

            expect(dimension.getEntities).toHaveBeenCalledWith({
                type: 'canopy:nbt_item_database',
                tags: [ProxyInventoryEntity.PROXY_TAG]
            });
            expect(orphanA.remove).toHaveBeenCalled();
            expect(orphanB.remove).toHaveBeenCalled();
        });

        it('keeps sweeping after one removal throws', () => {
            const orphanA = new Entity();
            const orphanB = new Entity();
            orphanA.remove.mockImplementation(() => {
                throw new Error('entity already gone');
            });
            const dimension = { getEntities: vi.fn(() => [orphanA, orphanB]) };

            ProxyInventoryEntity.sweepOrphans(dimension);

            expect(orphanB.remove).toHaveBeenCalled();
        });
    });
});
