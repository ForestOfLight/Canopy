import { describe, it, expect, vi, beforeAll } from "vitest";
import { EntityMovementLog } from "../../../../../Canopy [BP]/scripts/src/classes/EntityMovementLog";

vi.mock("@minecraft/server", () => ({
    system: {
        runInterval: vi.fn((callback, interval) => {
            const intervalId = setInterval(callback, interval * 50);
            return {
                clear: () => clearInterval(intervalId)
            };
        }),
        runTimeout: vi.fn((callback, timeout) => {
            const timeoutId = setTimeout(callback, timeout * 50);
            return {
                clear: () => clearTimeout(timeoutId)
            };
        }),
        clearRun: vi.fn((runner) => {
            runner.clear();
        }),
        currentTick: 0
    },
    world: {
        afterEvents: {
            entitySpawn: {
                subscribe: vi.fn()
            }
        },
        beforeEvents: {
            entityRemove: {
                subscribe: vi.fn()
            }
        },
        getDimension: vi.fn(() => ({
            getEntities: vi.fn(() => [
                { typeId: 'minecraft:falling_block', id: 'entity1', location: { x: 1, y: 2, z: 3 }, dimension: { id: 'overworld' },
                    getComponent: vi.fn(() => ({ })),
                    isValid: vi.fn(() => true)
                },
                { typeId: 'minecraft:projectile', id: 'entity2', location: { x: 4, y: 5, z: 6 }, dimension: { id: 'overworld' },
                    getComponent: vi.fn(() => ({ projectile: { isValid: true } })),
                    isValid: vi.fn(() => true)
                },
                { typeId: 'minecraft:item', id: 'entity3', location: { x: 7, y: 8, z: 9 }, dimension: { id: 'overworld' },
                    getComponent: vi.fn(() => ({ })),
                    isValid: vi.fn(() => false)
                }
            ])
        }))
    }
}));

describe('EntitMovementLog', () => {
    let entityLog;
    beforeAll(() => {
        entityLog = new EntityMovementLog('projectiles', { main: 'main', secondary: 'secondary', tertiary: 'tertiary' });
    });

    describe('constructor', () => {
        it('should initialize properties correctly', () => {
            entityLog.initEvents = vi.fn();
            expect(entityLog.type).toBe('projectiles');
            expect(entityLog.colors).toEqual({ main: 'main', secondary: 'secondary', tertiary: 'tertiary' });
            expect(entityLog.startTick).toBeDefined();
            expect(entityLog.movingEntities).toEqual([]);
            expect(entityLog.thisTickEntities).toEqual([]);
            expect(entityLog.lastTickEntities).toEqual([]);
        });
    });

    describe('onTick', () => {
        vi.mock("player", () => ({
            getDynamicPropererty: vi.fn(),
            sendMessage: vi.fn()
        }));

        it('should not send messages if no subscribed players', () => {
            entityLog.subscribedPlayers = [];
            entityLog.onTick();
            expect(entityLog.movingEntities).toEqual([]);
        });

        it('should not send messages if no moving entities', () => {
            const mockPlayer = {
                getDynamicProperty: vi.fn(() => 2),
                sendMessage: vi.fn()
            };
            entityLog.subscribedPlayers = [mockPlayer];
            entityLog.onTick();
            expect(entityLog.movingEntities).toEqual([]);
        });

        it('should send messages to subscribed players when logging projectiles', () => {
            entityLog = new EntityMovementLog('projectiles', { main: 'main', secondary: 'secondary', tertiary: 'tertiary' });
            const mockPlayer = {
                getDynamicProperty: vi.fn(() => 2),
                sendMessage: vi.fn()
            };
            entityLog.subscribedPlayers = [mockPlayer];
            entityLog.movingEntities = [{ id: 'entity1', location: { x: 1, y: 2, z: 3 } }];
            entityLog.hasMovedSinceLastTick = vi.fn(() => true);
            entityLog.onTick();
            expect(mockPlayer.sendMessage).toHaveBeenCalled();
        });

        it('should send messages to subscribed players when logging falling_blocks', () => {
            entityLog = new EntityMovementLog('falling_blocks', { main: 'main', secondary: 'secondary', tertiary: 'tertiary' });
            const mockPlayer = {
                getDynamicProperty: vi.fn(() => 2),
                sendMessage: vi.fn()
            };
            entityLog.subscribedPlayers = [mockPlayer];
            entityLog.movingEntities = [{ id: 'entity1', location: { x: 1, y: 2, z: 3 } }];
            entityLog.hasMovedSinceLastTick = vi.fn(() => true);
            entityLog.onTick();
            expect(mockPlayer.sendMessage).toHaveBeenCalled();
        });

        it('should throw an error when logging an invalid type', () => {
            entityLog = new EntityMovementLog('invalid_type', { main: 'main', secondary: 'secondary', tertiary: 'tertiary' });
            const mockPlayer = {
                getDynamicProperty: vi.fn(() => 2),
                sendMessage: vi.fn()
            };
            entityLog.subscribedPlayers = [mockPlayer];
            entityLog.movingEntities = [{ id: 'entity1', location: { x: 1, y: 2, z: 3 } }];
            entityLog.hasMovedSinceLastTick = vi.fn(() => true);
            expect(() => entityLog.onTick()).toThrow();
        });
    });
});