import { describe, it, expect, vi, afterEach } from "vitest";
import { commandTntFuse } from "../../../../../Canopy [BP]/scripts/src/rules/commandTntFuse";

const tntEntity = {
    typeId: 'minecraft:tnt',
    getDynamicProperty: vi.fn(() => this.fuseTicks),
    setDynamicProperty: vi.fn((_, value) => { this.fuseTicks = value; }),
    triggerEvent: vi.fn(),
    isValid: true,
    dimension: {
        getBlock: vi.fn(() => true)
    }
};
let fuseTicks = 80;
let commandTntFuseDP = false;

vi.mock("@minecraft/server", () => ({
    system: {
        afterEvents: {
            scriptEventReceive: {
                subscribe: vi.fn()
            }
        },
        runJob: vi.fn(),
        currentTick: (Date.now() / 50),
        runInterval: vi.fn((callback, interval) => {
            const intervalId = setInterval(callback, interval * 50);
            return {
                clear: () => clearInterval(intervalId)
            };
        }),
        clearRun: vi.fn((runner) => {
            runner.clear();
        })
    },
    world: {
        beforeEvents: {
            chatSend: {
                subscribe: vi.fn()
            }
        },
        afterEvents: {
            worldLoad: {
                subscribe: vi.fn()
            },
            entitySpawn: {
                subscribe: vi.fn()
            }
        },
        setDynamicProperty: (identifier, ticks) => {
            if (identifier === 'commandTntFuse')
                commandTntFuseDP = ticks;
            fuseTicks = ticks; 
        },
        getDynamicProperty: (identifier) => { 
            if (identifier === 'commandTntFuse')
                return commandTntFuseDP;
            return fuseTicks;
        }
    }
}));

vi.mock("@minecraft/server-ui", () => ({
    ModalFormData: vi.fn()
}));

describe('commandTntFuse', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should create a new rule', () => {
        expect(commandTntFuse.getID()).toBe('commandTntFuse');
    });

    it('should use the default fuse when the rule is not enabled', () => {
        const startFuseMock = vi.spyOn(commandTntFuse, 'startFuse');
        commandTntFuse.setValue(false);
        commandTntFuse.setGlobalFuseTicks(10);
        commandTntFuse.onEntitySpawn({ entity: tntEntity, cause: 'Spawned' });
        expect(startFuseMock).toHaveBeenCalledWith(tntEntity, 80);
    });

    it('should use the set fuse when the rule is enabled', () => {
        const startFuseMock = vi.spyOn(commandTntFuse, 'startFuse');
        commandTntFuse.setValue(true);
        commandTntFuse.setGlobalFuseTicks(10);
        commandTntFuse.onEntitySpawn({ entity: tntEntity, cause: 'Spawned' });
        expect(startFuseMock).toHaveBeenCalledWith(tntEntity, 10);
    });

    it('should not affect the fuse of TNT entities spawned by chain reactions', () => {
        const startFuseMock = vi.spyOn(commandTntFuse, 'startFuse');
        commandTntFuse.setValue(true);
        commandTntFuse.setGlobalFuseTicks(10);
        commandTntFuse.onEntitySpawn({ entity: tntEntity, cause: 'Event' });
        expect(startFuseMock).not.toHaveBeenCalled();
    });

    it('should properly initialize the fuse ticks DP', () => {
        commandTntFuse.setValue(true);
        commandTntFuse.setGlobalFuseTicks(undefined);
        expect(commandTntFuse.getGlobalFuseTicks()).toBe(80);
    });
});