import { describe, it, expect, vi, beforeEach } from 'vitest';
import { spawnedEntitiesThisTick, handleTntDuplication } from '../../../../../Canopy [BP]/scripts/src/rules/dupeTnt';
import { system, world } from '@minecraft/server';
import { Rule, Rules } from '../../../../../Canopy [BP]/scripts/lib/canopy/Canopy';

vi.mock("@minecraft/server", () => ({
    system: {
        runInterval: vi.fn((callback, interval) => {
            const intervalId = setInterval(() => {
                callback();
            }, interval * 50);
            return {
                clear: () => clearInterval(intervalId)
            };
        }),
        runTimeout: vi.fn((callback, timeout) => {
            const timeoutId = setTimeout(() => {
                callback();
            }, timeout * 50);
            return {
                clear: () => clearTimeout(timeoutId)
            };
        }),
        afterEvents: {
            scriptEventReceive: {
                subscribe: vi.fn(),
                unsubscribe: vi.fn()
            }
        }
    },
    world: {
        afterEvents: {
            entitySpawn: {
                subscribe: vi.fn()
            },
            pistonActivate: {
                subscribe: vi.fn()
            }
        }
    }
}));

vi.mock('../../../../../Canopy [BP]/scripts/lib/canopy/Canopy', () => ({
    Rule: vi.fn(),
    Rules: {
        getNativeValue: vi.fn()
    }
}));

vi.mock("@minecraft/server-ui", () => ({
    ModalFormData: vi.fn()
}));

describe('dupeTnt Rule', () => {
    beforeEach(() => {
        spawnedEntitiesThisTick.length = 0;
    });

    it('should create a new rule', () => {
        expect(Rule).toHaveBeenCalledWith({
            category: 'Rules',
            identifier: 'dupeTnt',
            description: { translate: 'rules.dupeTnt' }
        });
    });

    it('should clear spawnedEntitiesThisTick every tick', () => {
        const runIntervalCallback = system.runInterval.mock.calls[0][0];
        const runTimeoutCallback = vi.fn();
        system.runTimeout.mockImplementation((callback) => {
            runTimeoutCallback.mockImplementation(callback);
        });

        runIntervalCallback();
        runTimeoutCallback();

        expect(system.runTimeout).toHaveBeenCalledWith(expect.any(Function), 0);
    });

    it('should subscribe to entitySpawn event', () => {
        expect(world.afterEvents.entitySpawn.subscribe).toHaveBeenCalled();
    });

    it('should subscribe to pistonActivate event', () => {
        expect(world.afterEvents.pistonActivate.subscribe).toHaveBeenCalled();
    });

    it('should handle entitySpawn event correctly', () => {
        const entitySpawnCallback = world.afterEvents.entitySpawn.subscribe.mock.calls[0][0];
        const event = {
            entity: {
                typeId: 'minecraft:tnt',
                location: { x: 0, y: 0, z: 0 }
            }
        };

        Rules.getNativeValue.mockReturnValue(true);
        entitySpawnCallback(event);

        expect(spawnedEntitiesThisTick).toContain(event.entity);
    });

    it('should handle pistonActivate event correctly', () => {
        const pistonActivateCallback = world.afterEvents.pistonActivate.subscribe.mock.calls[0][0];
        const event = {
            block: {
                permutation: {
                    getState: vi.fn().mockReturnValue(0)
                }
            },
            piston: {
                state: 'Retracting',
                getAttachedBlocksLocations: vi.fn().mockReturnValue([{ x: 0, y: 0, z: 0 }])
            },
            dimension: {
                getBlock: vi.fn().mockReturnValue({ typeId: 'minecraft:tnt' })
            }
        };

        Rules.getNativeValue.mockReturnValue(true);
        pistonActivateCallback(event);

        expect(system.runTimeout).toHaveBeenCalledWith(expect.any(Function), 4);
    });

    it('should not throw an error if the piston is removed', () => {
        const pistonActivateCallback = world.afterEvents.pistonActivate.subscribe.mock.calls[0][0];
        const event = {
            block: {
                permutation: {
                    getState: vi.fn().mockReturnValue(0)
                }
            },
            piston: {
                state: 'Retracting',
                getAttachedBlocksLocations: vi.fn().mockReturnValue([{ x: 0, y: 0, z: 0 }])
            },
            dimension: {
                getBlock: vi.fn().mockReturnValue({ typeId: 'minecraft:tnt' })
            }
        };

        Rules.getNativeValue.mockReturnValue(true);
        event.piston = undefined; // Simulate piston removal
        expect(() => pistonActivateCallback(event)).not.toThrow();
    });

    it('tnt should dupe when conditions are right', () => {
        const tntBlockMock = {
            typeId: 'minecraft:tnt',
            offset: (location) => ({
                typeId: 'minecraft:noteblock',
                x: location.x,
                y: location.y,
                z: location.z
            }),
            setType: vi.fn()
        };
        const tntEntityMock = {
            typeId: 'minecraft:tnt',
            location: { x: 0, y: 0, z: 0 },
            getVelocity: vi.fn().mockReturnValue({ x: 0, y: 0, z: 0 }),
            teleport: vi.fn(),
            applyImpulse: vi.fn()
        };
        const event = {
            block: {
                permutation: {
                    getState: vi.fn().mockReturnValue(0)
                }
            },
            piston: {
                state: 'Retracting',
                getAttachedBlocksLocations: vi.fn().mockReturnValue([{ x: 0, y: 0, z: 0 }])
            },
            dimension: {
                getBlock: vi.fn().mockReturnValue(tntBlockMock)
            }
        };
        spawnedEntitiesThisTick.push(tntEntityMock);
        handleTntDuplication([{ x: 0, y: 0, z: 0 }], event);
        expect(tntBlockMock.setType).toHaveBeenCalledWith('minecraft:tnt');
    });

    it('should not dupe tnt if there is no adjacent noteblock', () => {
        const tntBlockMock = {
            typeId: 'minecraft:tnt',
            offset: (location) => ({
                typeId: 'minecraft:air',
                x: location.x,
                y: location.y,
                z: location.z
            }),
            setType: vi.fn()
        };
        const tntEntityMock = {
            typeId: 'minecraft:tnt',
            location: { x: 0, y: 0, z: 0 },
            getVelocity: vi.fn().mockReturnValue({ x: 0, y: 0, z: 0 }),
            teleport: vi.fn(),
            applyImpulse: vi.fn()
        };
        const event = {
            block: {
                permutation: {
                    getState: vi.fn().mockReturnValue(0)
                }
            },
            piston: {
                state: 'Retracting',
                getAttachedBlocksLocations: vi.fn().mockReturnValue([{ x: 0, y: 0, z: 0 }])
            },
            dimension: {
                getBlock: vi.fn().mockReturnValue(tntBlockMock)
            }
        };
        spawnedEntitiesThisTick.push(tntEntityMock);
        handleTntDuplication([{ x: 0, y: 0, z: 0 }], event);
        expect(tntBlockMock.setType).not.toHaveBeenCalled();
    });
});