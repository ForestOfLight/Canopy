import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { EntityTntLog } from "../../../../../Canopy [BP]/scripts/src/classes/EntityTntLog";

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
        })
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
        }
    }
}));

vi.mock("@minecraft/server-ui", () => ({
    ModalFormData: vi.fn()
}));

describe('EntityTntLog', () => {
    let entityTntLog;
    beforeAll(() => {
        entityTntLog = new EntityTntLog('testType', { main: 'main', secondary: 'secondary', tertiary: 'tertiary' });
    });

    describe('constructor', () => {
        it('should initialize properties correctly', () => {
            entityTntLog.initEvents = vi.fn();
            expect(entityTntLog.type).toBe('testType');
            expect(entityTntLog.colors).toEqual({ main: 'main', secondary: 'secondary', tertiary: 'tertiary' });
            expect(entityTntLog.tntSpawnLocations).toEqual({});
            expect(entityTntLog.removedTntThisTick).toEqual([]);
        });
    });

    describe('onSpawn', () => {
        beforeEach(() => {
            entityTntLog.tntSpawnLocations = {};
        });

        it('should add tnt spawn location to tntSpawnLocations', () => {
            const mockEntity = { typeId: 'minecraft:tnt', id: 'tnt1', location: { x: 1, y: 2, z: 3 } };
            entityTntLog.onSpawn(mockEntity);
            expect(entityTntLog.tntSpawnLocations['tnt1']).toEqual({ x: 1, y: 2, z: 3 });
        });

        it('should not add non-tnt entities to tntSpawnLocations', () => {
            const mockEntity = { typeId: 'minecraft:other', id: 'other1', location: { x: 4, y: 5, z: 6 } };
            entityTntLog.onSpawn(mockEntity);
            expect(entityTntLog.tntSpawnLocations).toEqual({});
        });
    });

    describe('onRemove', () => {
        beforeEach(() => {
            entityTntLog.removedTntThisTick = [];
        });

        it('should add removed tnt entity to removedTntThisTick', () => {
            const mockEntity = { typeId: 'minecraft:tnt', id: 'tnt1', location: { x: 1, y: 2, z: 3 } };
            entityTntLog.subscribedPlayers = [{ id: 'player1' }];
            entityTntLog.onRemove(mockEntity);
            expect(entityTntLog.removedTntThisTick).toEqual([{ id: 'tnt1', location: { x: 1, y: 2, z: 3 } }]);
        });

        it('should not add non-tnt entities', () => {
            const mockEntity = { typeId: 'minecraft:other', id: 'other1', location: { x: 4, y: 5, z: 6 } };
            entityTntLog.onRemove(mockEntity);
            expect(entityTntLog.removedTntThisTick).toEqual([]);
        });
    });

    describe('onTick', () => {
        vi.mock("player", () => ({
            getDynamicPropererty: vi.fn(),
            sendMessage: vi.fn()
        }));

        it('should send messages to subscribed players', () => {
            const mockPlayer = {
                getDynamicProperty: vi.fn(() => 2),
                sendMessage: vi.fn()
            };
            entityTntLog.subscribedPlayers = [mockPlayer];
            entityTntLog.tntSpawnLocations = { 'tnt1': { x: 1, y: 2, z: 3 }, 'tnt2': { x: 4, y: 5, z: 6 } };
            entityTntLog.removedTntThisTick = [{ id: 'tnt1', location: { x: 1, y: 2, z: 3}}, { id: 'tnt2', location: { x: 4, y: 5, z: 6 }}];
            entityTntLog.onTick();
            expect(mockPlayer.sendMessage).toHaveBeenCalled();
        });
    });
});