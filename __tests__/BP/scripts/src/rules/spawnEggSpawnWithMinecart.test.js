import { spawnEggSpawnWithMinecart } from "../../../../../Canopy [BP]/scripts/src/rules/spawnEggSpawnWithMinecart";
import { expect, describe, vi, afterEach, it } from "vitest";

const mockMinecart = {
    id: 'minecart123',
    location: { x: 10, y: 64, z: 10 },
    typeId: 'minecraft:minecart',
    getComponent: vi.fn(() => ({
        addRider: vi.fn((entity) => {
            entity.getComponent = vi.fn(() => ({
                id: 'riding',
                entityRidingOn: mockMinecart
            }));
        })
    }))
};

vi.mock("@minecraft/server", () => ({
    system: {
        afterEvents: {
            scriptEventReceive: {
                subscribe: vi.fn()
            },
            playerPlaceBlock: {
                subscribe: vi.fn()
            }
        },
        runJob: vi.fn(),
        run: vi.fn((callback) => callback()),
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
            playerInteractWithBlock: {
                subscribe: vi.fn(),
                unsubscribe: vi.fn()
            },
            entitySpawn: {
                subscribe: vi.fn(),
                unsubscribe: vi.fn()
            }
        },
        getDynamicProperty: vi.fn(),
        setDynamicProperty: vi.fn(),
        structureManager: {
            place: vi.fn()
        }
    },
    EntityComponentTypes: {
        Rideable: 'rideable',
        Riding: 'riding'
    }
}));

vi.mock("@minecraft/server-ui", () => ({
    ModalFormData: vi.fn()
}));

describe('spawnEggSpawnWithMinecart', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should subscribe to spawn egg spawn events when enabled', () => {
        const subscribeSpy = vi.spyOn(spawnEggSpawnWithMinecart, 'subscribeToEvent');
        spawnEggSpawnWithMinecart.onEnable();
        expect(subscribeSpy).toHaveBeenCalled();
        subscribeSpy.mockRestore();
    });

    it('should unsubscribe from spawn egg spawn events when disabled', () => {
        const unsubscribeSpy = vi.spyOn(spawnEggSpawnWithMinecart, 'unsubscribeFromEvent');
        spawnEggSpawnWithMinecart.onDisable();
        expect(unsubscribeSpy).toHaveBeenCalled();
        unsubscribeSpy.mockRestore();
    });

    it('should put the spawned entity in a minecart when an entity is spawned by spawn egg on a rail', () => {
        const mockEvent = {
            entity: {
                id: 'entity123',
                location: { x: 10, y: 64, z: 10 },
                typeId: 'minecraft:cow',
                getComponent: vi.fn(),
                dimension: {
                    spawnEntity: vi.fn(() => mockMinecart)
                }
            },
            player: {
                name: 'TestPlayer'
            },
            block: {
                location: { x: 10, y: 64, z: 10 },
                typeId: 'minecraft:rail'
            }
        };
        spawnEggSpawnWithMinecart.onSpawnEggSpawn(mockEvent);
        expect(mockEvent.entity.getComponent('riding')?.entityRidingOn).toBe(mockMinecart);
    });

    it('should do nothing if the entity is not spawned on a rail', () => {
        const mockEvent = {
            entity: {
                id: 'entity123',
                location: { x: 10, y: 64, z: 10 },
                typeId: 'minecraft:cow',
                getComponent: vi.fn(),
            },
            player: {
                name: 'TestPlayer'
            },
            block: {
                location: { x: 10, y: 64, z: 10 },
                typeId: 'minecraft:dirt'
            }
        };
        spawnEggSpawnWithMinecart.onSpawnEggSpawn(mockEvent);
        expect(mockEvent.entity.getComponent('riding')?.entityRidingOn).not.toBe(mockMinecart);
    });
});