import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Container, Entity, EntityComponentTypes, Player } from '@minecraft/server';
import { ProxyInventoryEntity } from '../../../../../../Canopy[BP]/scripts/src/classes/proxy/ProxyInventoryEntity';
import { ProxyLayout } from '../../../../../../Canopy[BP]/scripts/src/classes/proxy/ProxyLayout';

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
        it('spawns the dedicated proxy entity type at the player head location', () => {
            ProxyInventoryEntity.spawnFor(player);
            expect(player.dimension.spawnEntity).toHaveBeenCalledWith(
                'canopy:inventory_proxy',
                { x: 1, y: 66, z: 2 },
                { initialPersistence: true }
            );
        });

        it('leans on the dedicated entity type instead of tagging the entity', () => {
            ProxyInventoryEntity.spawnFor(player);
            expect(spawnedEntity.addTag).not.toHaveBeenCalled();
        });

        it('never mutates the entity after spawning so the client hitbox is right immediately', () => {
            ProxyInventoryEntity.spawnFor(player);
            expect(spawnedEntity.triggerEvent).not.toHaveBeenCalled();
        });

        it('exposes the entity container', () => {
            const proxy = ProxyInventoryEntity.spawnFor(player);
            expect(proxy.container).toBe(container);
        });
    });

    describe('layouts', () => {
        it('spawns the plain chest proxy by default', () => {
            ProxyInventoryEntity.spawnFor(player);
            expect(player.dimension.spawnEntity).toHaveBeenCalledWith(
                'canopy:inventory_proxy',
                expect.anything(),
                expect.anything()
            );
        });

        it('spawns a dedicated entity type per layout rather than mutating one after spawn', () => {
            ProxyInventoryEntity.spawnFor(player, ProxyLayout.Hopper);
            ProxyInventoryEntity.spawnFor(player, ProxyLayout.Chest);

            const spawnedTypes = player.dimension.spawnEntity.mock.calls.map(([typeId]) => typeId);
            expect(spawnedTypes).toEqual(['canopy:inventory_proxy_hopper', 'canopy:inventory_proxy']);
            expect(spawnedEntity.triggerEvent).not.toHaveBeenCalled();
        });

        it('falls back to the chest layout for an unknown layout', () => {
            expect(ProxyInventoryEntity.entityTypeIdFor('nonsense')).toBe('canopy:inventory_proxy');
        });
    });

    describe('isProxyEntity', () => {
        it('recognises every proxy variant so raycasts can skip the parked proxy', () => {
            expect(ProxyInventoryEntity.isProxyEntity({ typeId: 'canopy:inventory_proxy' })).toBe(true);
            expect(ProxyInventoryEntity.isProxyEntity({ typeId: 'canopy:inventory_proxy_hopper' })).toBe(true);
        });

        it('does not mistake a real container entity for a proxy', () => {
            expect(ProxyInventoryEntity.isProxyEntity({ typeId: 'minecraft:chest_minecart' })).toBe(false);
            expect(ProxyInventoryEntity.isProxyEntity(void 0)).toBe(false);
        });
    });

    describe('entityTypeId', () => {
        it('exposes the spawned entity type so subscribers cannot drift from it', () => {
            expect(ProxyInventoryEntity.entityTypeId).toBe('canopy:inventory_proxy');
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

    describe('dropItem', () => {
        it('spawns the item at the entity location', () => {
            const proxy = ProxyInventoryEntity.spawnFor(player);
            const itemStack = { typeId: 'minecraft:emerald' };
            proxy.dropItem(itemStack);
            expect(spawnedEntity.dimension.spawnItem).toHaveBeenCalledWith(itemStack, spawnedEntity.location);
        });

        it('reports that the item was dropped', () => {
            const proxy = ProxyInventoryEntity.spawnFor(player);
            expect(proxy.dropItem({ typeId: 'minecraft:emerald' })).toBe(true);
        });

        it('reports failure without spawning when the entity is no longer valid', () => {
            const proxy = ProxyInventoryEntity.spawnFor(player);
            spawnedEntity.isValid = false;
            expect(proxy.dropItem({ typeId: 'minecraft:emerald' })).toBe(false);
            expect(spawnedEntity.dimension.spawnItem).not.toHaveBeenCalled();
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
        it('removes every sized proxy variant left in the dimension', () => {
            const orphanA = new Entity();
            const orphanB = new Entity();
            const dimension = { getEntities: vi.fn(() => [orphanA, orphanB]) };

            ProxyInventoryEntity.sweepOrphans(dimension);

            expect(dimension.getEntities).toHaveBeenCalledWith({
                families: ['canopy:inventory_proxy']
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
