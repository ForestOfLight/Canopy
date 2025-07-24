import { SpawnEggSpawnEntityEvent, spawnEggSpawnEntityEvent } from "../../../../../Canopy [BP]/scripts/src/events/SpawnEggSpawnEntityEvent";
import { expect, test, describe, vi, beforeEach } from "vitest";

vi.mock("@minecraft/server", () => ({
    system: {
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
        afterEvents: {
            entitySpawn: {
                subscribe: vi.fn(),
                unsubscribe: vi.fn()
            },
            playerInteractWithBlock: {
                subscribe: vi.fn(),
                unsubscribe: vi.fn()
            }
        }
    },
    EntityInitializationCause: {
        Spawned: 'Spawned',
        Loaded: 'Loaded'
    }
}));

describe('SpawnEggSpawnEntityEvent', () => {
    let tracker;
    let mockCallback;

    beforeEach(() => {
        vi.clearAllMocks();
        tracker = new SpawnEggSpawnEntityEvent();
        mockCallback = vi.fn();
    });

    test('should have a method that subscribes a callback to spawn egg events', () => {
        expect(typeof tracker.subscribe).toBe('function');
    });

    test('should subscribe to spawn egg tracking events on first subscribe', () => {
        const subscribeSpy = vi.spyOn(tracker, 'startTrackingEvent');
        tracker.subscribe(mockCallback);
        expect(subscribeSpy).toHaveBeenCalled();
    });

    test('should not subscribe to spawn egg tracking events if already started', () => {
        const subscribeSpy = vi.spyOn(tracker, 'startTrackingEvent');
        tracker.subscribe(mockCallback);
        tracker.subscribe(() => {});
        expect(subscribeSpy).toHaveBeenCalledTimes(1);
    });

    test('should have a method that unsubscribes a callback from spawn egg events', () => {
        tracker.subscribe(mockCallback);
        tracker.unsubscribe(mockCallback);
        expect(tracker.callbacks.length).toBe(0);
    });

    test('should unsubscribe from spawn egg tracking events when all callbacks are unsubscribed', () => {
        const clearRunSpy = vi.spyOn(tracker, 'stopTrackingEvent');
        tracker.subscribe(mockCallback);
        tracker.unsubscribe(mockCallback);
        expect(clearRunSpy).toHaveBeenCalled();
    });

    test('should not unsubscribe from spawn egg tracking events if there are still callbacks subscribed', () => {
        const stopTrackingSpy = vi.spyOn(tracker, 'stopTrackingEvent');
        tracker.subscribe(mockCallback);
        tracker.subscribe(() => {});
        tracker.unsubscribe(mockCallback);
        expect(stopTrackingSpy).not.toHaveBeenCalled();
    });

    test('should send events to all subscribed callbacks when an entity spawns from a spawn egg', () => {
        tracker.subscribe(mockCallback);
        tracker.onEntitySpawn({ 
            entity: { location: { x: 0, y: 0, z: 0 } }, 
            cause: 'Spawned' 
        });
        tracker.onPlayerInteractWithBlock({ 
            beforeItemStack: { typeId: 'minecraft:spawn_egg' }, 
            block: { location: { x: 0, y: 0, z: 0 } }, 
            player: { name: 'TestPlayer' } 
        });
        tracker.onTick();
        expect(mockCallback).toHaveBeenCalledWith({ player: { name: 'TestPlayer' }, entity: { location: { x: 0, y: 0, z: 0 } }, block: { location: { x: 0, y: 0, z: 0 } } });
    });

    test('should not send events if the item used is not a spawn egg', () => {
        tracker.subscribe(mockCallback);
        tracker.onPlayerInteractWithBlock({ beforeItemStack: { typeId: 'minecraft:stone' } });
        tracker.onTick();
        expect(mockCallback).not.toHaveBeenCalled();
    });

    test('should not send events if the player is a SimulatedPlayer', () => {
        tracker.subscribe(mockCallback);
        tracker.onPlayerInteractWithBlock({ player: void 0, beforeItemStack: void 0 });
        tracker.onTick();
        expect(mockCallback).not.toHaveBeenCalled();
    });

    test('should not send events if the entity is undefined', () => {
        tracker.subscribe(mockCallback);
        tracker.onEntitySpawn({ entity: void 0 });
        tracker.onTick();
        expect(mockCallback).not.toHaveBeenCalled();
    });

    test('should not send events if the entity spawn cause is not spawning', () => {
        tracker.subscribe(mockCallback);
        tracker.onEntitySpawn({ cause: 'Loaded' });
        tracker.onTick();
        expect(mockCallback).not.toHaveBeenCalled();
    });

    test('should export an instance of the class', () => {
        expect(spawnEggSpawnEntityEvent).toBeInstanceOf(SpawnEggSpawnEntityEvent);
    });
});