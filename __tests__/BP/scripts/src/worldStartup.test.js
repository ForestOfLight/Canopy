import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../Canopy[BP]/scripts/src/rules/simplayer/simplayerRejoining', () => ({
    simplayerRejoining: { onStartup: vi.fn() }
}));

let world;
let startWorldSystems;
let simplayerRejoining;
let playerStartLookingAtUnderstudy;
let playerStopLookingAtUnderstudy;

function spawnOrphan(dimensionId, typeId, family) {
    const dimension = world.getDimension(dimensionId);
    const entity = dimension.spawnEntity(typeId, { x: 0, y: 64, z: 0 });
    entity.typeFamilies = [family];
    return entity;
}

function proxyEntitiesIn(dimensionId, family) {
    return world.getDimension(dimensionId).getEntities({ families: [family] });
}

beforeEach(async () => {
    vi.resetModules();
    ({ world } = await import('@minecraft/server'));
    ({ startWorldSystems } = await import('../../../../Canopy[BP]/scripts/src/worldStartup'));
    ({ simplayerRejoining } = await import('../../../../Canopy[BP]/scripts/src/rules/simplayer/simplayerRejoining'));
    ({ playerStartLookingAtUnderstudy } = await import('../../../../Canopy[BP]/scripts/src/classes/simplayer/events/PlayerStartLookingAtUnderstudyEvent'));
    ({ playerStopLookingAtUnderstudy } = await import('../../../../Canopy[BP]/scripts/src/classes/simplayer/events/PlayerStopLookingAtUnderstudyEvent'));
});

describe('startWorldSystems', () => {
    it('watches for players looking at understudies so inventory proxies can open', () => {
        startWorldSystems();
        expect(playerStartLookingAtUnderstudy.isTracking()).toBe(true);
        expect(playerStopLookingAtUnderstudy.isTracking()).toBe(true);
    });

    it('rejoins saved simplayers', () => {
        startWorldSystems();
        expect(simplayerRejoining.onStartup).toHaveBeenCalled();
    });

    it('removes orphaned inventory proxy entities from every dimension', () => {
        spawnOrphan('minecraft:overworld', 'canopy:inventory_proxy', 'canopy:inventory_proxy');
        spawnOrphan('minecraft:nether', 'canopy:inventory_proxy_hopper', 'canopy:inventory_proxy');
        startWorldSystems();
        expect(proxyEntitiesIn('minecraft:overworld', 'canopy:inventory_proxy')).toHaveLength(0);
        expect(proxyEntitiesIn('minecraft:nether', 'canopy:inventory_proxy')).toHaveLength(0);
    });

    it('removes orphaned peek capture entities from every dimension', () => {
        spawnOrphan('minecraft:the_end', 'canopy:peek_capture', 'canopy:peek_capture');
        startWorldSystems();
        expect(proxyEntitiesIn('minecraft:the_end', 'canopy:peek_capture')).toHaveLength(0);
    });

    it('only runs once no matter how many times it is called', () => {
        startWorldSystems();
        const orphan = spawnOrphan('minecraft:overworld', 'canopy:inventory_proxy', 'canopy:inventory_proxy');
        startWorldSystems();
        expect(simplayerRejoining.onStartup).toHaveBeenCalledTimes(1);
        expect(orphan.remove).not.toHaveBeenCalled();
    });
});
