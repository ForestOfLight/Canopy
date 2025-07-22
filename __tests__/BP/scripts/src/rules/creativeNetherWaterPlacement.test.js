import { creativeNetherWaterPlacement } from "../../../../../Canopy [BP]/scripts/src/rules/creativeNetherWaterPlacement";
import { expect, test, describe, vi, afterEach } from "vitest";

vi.mock("@minecraft/server", () => ({
    system: {
        afterEvents: {
            scriptEventReceive: {
                subscribe: vi.fn()
            },
            playerInteractWithBlock: {
                subscribe: vi.fn()
            }
        },
        runJob: vi.fn(),
        run: vi.fn((callback) => callback())
    },
    world: {
        beforeEvents: {
            chatSend: {
                subscribe: vi.fn()
            },
            playerInteractWithBlock: {
                subscribe: vi.fn(),
                unsubscribe: vi.fn()
            }
        },
        afterEvents: {
            worldLoad: {
                subscribe: vi.fn()
            }
        },
        getDynamicProperty: vi.fn(),
        setDynamicProperty: vi.fn(),
        structureManager: {
            place: vi.fn()
        }
    },
    GameMode: {
        Creative: 'Creative',
        Survival: 'Survival'
    },
    LiquidType: {
        Water: 'Water'
    },
    Direction: {
        Up: 'Up',
        Down: 'Down',
        North: 'North',
        South: 'South',
        West: 'West',
        East: 'East'
    }
}));

vi.mock("@minecraft/server-ui", () => ({
    ModalFormData: vi.fn()
}));

describe('creativeNetherWaterPlacement', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    test('should subscribe to player block placements when enabled', () => {
        const subscribeSpy = vi.spyOn(creativeNetherWaterPlacement, 'subscribeToEvent');
        creativeNetherWaterPlacement.onEnable();
        expect(subscribeSpy).toHaveBeenCalled();
        subscribeSpy.mockRestore();
    });

    test('should unsubscribe from player block placements when disabled', () => {
        const unsubscribeSpy = vi.spyOn(creativeNetherWaterPlacement, 'unsubscribeFromEvent');
        creativeNetherWaterPlacement.onDisable();
        expect(unsubscribeSpy).toHaveBeenCalled();
        unsubscribeSpy.mockRestore();
    });

    test('should ensure placement when placing water in the nether in creative mode', () => {
        const placeWaterSpy = vi.spyOn(creativeNetherWaterPlacement, 'setWater')
        const aboveBlock = { setType: vi.fn() };
        const event = {
            player: { name: 'MockPlayer', getGameMode: () => 'Creative', dimension: { id: 'minecraft:nether' } },
            itemStack: { typeId: 'minecraft:water_bucket' },
            block: {
                location: { x: 0, y: 0, z: 0 }, 
                setType: vi.fn(),
                canContainLiquid: () => false, 
                above: () => aboveBlock,
                below: vi.fn(),
                north: vi.fn(),
                south: vi.fn(),
                west: vi.fn(),
                east: vi.fn()
            },
            blockFace: "Up"
        };
        creativeNetherWaterPlacement.onPlayerInteractWithBlock(event);
        expect(placeWaterSpy).toHaveBeenCalledWith(aboveBlock);
    });

    test('should do nothing when the player is not in creative mode', () => {
        const placeWaterSpy = vi.spyOn(creativeNetherWaterPlacement, 'setWater')
        const event = {
            player: { name: 'MockPlayer', getGameMode: () => 'Survival' },
            itemStack: { typeId: 'minecraft:water_bucket' },
            block: { location: { x: 0, y: 0, z: 0 }, setType: vi.fn() }
        };
        creativeNetherWaterPlacement.onPlayerInteractWithBlock(event);
        expect(placeWaterSpy).not.toHaveBeenCalled();
    });

    test('should do nothing if placed by a Simulated Player', () => {
        const placeWaterSpy = vi.spyOn(creativeNetherWaterPlacement, 'setWater')
        const event = {
            player: void 0
        };
        creativeNetherWaterPlacement.onPlayerInteractWithBlock(event);
        expect(placeWaterSpy).not.toHaveBeenCalled();
    });

    test('should do nothing when the event is not in the nether', () => {
        const placeWaterSpy = vi.spyOn(creativeNetherWaterPlacement, 'setWater')
        const event = {
            player: { name: 'MockPlayer', getGameMode: () => 'Creative', dimension: { id: 'minecraft:overworld' } },
        };
        creativeNetherWaterPlacement.onPlayerInteractWithBlock(event);
        expect(placeWaterSpy).not.toHaveBeenCalled();
    });

    test('should waterlog the block if it can contain water', () => {
        const waterlogSpy = vi.spyOn(creativeNetherWaterPlacement, 'waterlog');
        const event = {
            player: { name: 'MockPlayer', getGameMode: () => 'Creative', dimension: { id: 'minecraft:nether' } },
            itemStack: { typeId: 'minecraft:water_bucket' },
            block: {
                canContainLiquid: () => true,
                location: { x: 0, y: 0, z: 0 },
                setWaterlogged: vi.fn()
            }
        };
        creativeNetherWaterPlacement.onPlayerInteractWithBlock(event);
        expect(waterlogSpy).toHaveBeenCalledWith(event.block);
    });
});