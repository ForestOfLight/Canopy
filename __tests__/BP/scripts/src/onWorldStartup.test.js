import { describe, it, expect, beforeAll } from 'vitest';
import { world, resetWorldState } from '@minecraft/server';
import { startWorldSystems } from '../../../../Canopy[BP]/scripts/src/onWorldStartup';
import { simplayerRejoining } from '../../../../Canopy[BP]/scripts/src/rules/simplayer/simplayerRejoining';
import { playerStartLookingAtUnderstudy } from '../../../../Canopy[BP]/scripts/src/classes/simplayer/events/PlayerStartLookingAtUnderstudyEvent';
import { playerStopLookingAtUnderstudy } from '../../../../Canopy[BP]/scripts/src/classes/simplayer/events/PlayerStopLookingAtUnderstudyEvent';

function spawnOrphan(dimensionId, typeId, family) {
    const dimension = world.getDimension(dimensionId);
    const entity = dimension.spawnEntity(typeId, { x: 0, y: 64, z: 0 });
    entity.typeFamilies = [family];
    return entity;
}

function proxyEntitiesIn(dimensionId, family) {
    return world.getDimension(dimensionId).getEntities({ families: [family] });
}

describe('onWorldStartup', () => {
    beforeAll(() => {
        resetWorldState();
        spawnOrphan('minecraft:overworld', 'canopy:inventory_proxy', 'canopy:inventory_proxy');
        spawnOrphan('minecraft:nether', 'canopy:inventory_proxy_hopper', 'canopy:inventory_proxy');
        spawnOrphan('minecraft:the_end', 'canopy:peek_capture', 'canopy:peek_capture');
        startWorldSystems();
    });

    it('starts tracking players looking at understudies', () => {
        expect(playerStartLookingAtUnderstudy.isTracking()).toBeTruthy();
    });

    it('starts tracking when players stop looking at understudies', () => {
        expect(playerStopLookingAtUnderstudy.isTracking()).toBeTruthy();
    });

    it('removes orphaned inventory proxies from the overworld', () => {
        expect(proxyEntitiesIn('minecraft:overworld', 'canopy:inventory_proxy')).toHaveLength(0);
    });

    it('removes orphaned inventory proxies from the nether', () => {
        expect(proxyEntitiesIn('minecraft:nether', 'canopy:inventory_proxy')).toHaveLength(0);
    });

    it('removes orphaned peek captures from the end', () => {
        expect(proxyEntitiesIn('minecraft:the_end', 'canopy:peek_capture')).toHaveLength(0);
    });

    it('does not sweep entities after the first startup', () => {
        const orphan = spawnOrphan('minecraft:overworld', 'canopy:inventory_proxy', 'canopy:inventory_proxy');
        startWorldSystems();
        expect(orphan.remove).toHaveBeenCalledTimes(0);
    });
});

