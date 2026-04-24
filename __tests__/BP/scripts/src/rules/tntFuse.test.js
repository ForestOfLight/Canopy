import { describe, it, expect, vi, afterEach } from "vitest";
import { tntFuseRule } from "../../../../../Canopy[BP]/scripts/src/rules/tntFuse";

const tntEntity = {
    typeId: 'minecraft:tnt',
    getDynamicProperty: vi.fn(() => this.fuseTicks),
    setDynamicProperty: vi.fn((_, value) => { this.fuseTicks = value; }),
    triggerEvent: vi.fn(),
    isValid: true,
    dimension: {
        isChunkLoaded: vi.fn(() => true)
    }
};
let tntFuseDP = false;

vi.mock('@minecraft/server', async (importOriginal) => {
    const original = await importOriginal();
    return {
        ...original,
        system: {
            ...original.system,
            currentTick: (Date.now() / 50),
            runInterval: vi.fn((callback, interval) => {
                const intervalId = setInterval(callback, interval * 50);
                return { clear: () => clearInterval(intervalId) };
            }),
            clearRun: vi.fn((runner) => { runner.clear(); })
        },
        world: {
            ...original.world,
            afterEvents: {
                ...original.world.afterEvents,
                entityLoad: { subscribe: vi.fn() }
            },
            setDynamicProperty: (identifier, ticks) => { tntFuseDP = ticks },
            getDynamicProperty: () => tntFuseDP
        }
    };
});

describe('tntFuseRule', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should create a new rule', () => {
        expect(tntFuseRule.getID()).toBe('tntFuse');
    });

    it('should use the set ticks', () => {
        const startFuseMock = vi.spyOn(tntFuseRule, 'startFuse');
        tntFuseRule.setValue(10);
        tntFuseRule.onEntitySpawn({ entity: tntEntity, cause: 'Spawned' });
        expect(startFuseMock).toHaveBeenCalledWith(tntEntity, 10);
    });

    it('should not affect the fuse of TNT entities spawned by chain reactions', () => {
        const startFuseMock = vi.spyOn(tntFuseRule, 'startFuse');
        tntFuseRule.setValue(10);
        tntFuseRule.onEntitySpawn({ entity: tntEntity, cause: 'Event' });
        expect(startFuseMock).not.toHaveBeenCalled();
    });

    it('should properly initialize the fuse ticks DP', () => {
        tntFuseDP = void 0;
        expect(tntFuseRule.getGlobalFuseTicks()).toBe(80);
    });

    it('should restart the fuse when the entity loads', () => {
        const startFuseMock = vi.spyOn(tntFuseRule, 'startFuse');
        tntFuseRule.setValue(15);
        tntFuseRule.onEntityLoad({ entity: tntEntity });
        expect(startFuseMock).toHaveBeenCalledWith(tntEntity, 15);
    });
});