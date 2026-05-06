import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { spawnedEntitiesThisTick, handleTntDuplication } from '../../../../../Canopy[BP]/scripts/src/rules/dupeTnt';
import { system, world } from '@minecraft/server';
import { BooleanRule, Rules } from '../../../../../Canopy[BP]/scripts/lib/canopy/Canopy';

vi.mock('@minecraft/server', async (importOriginal) => {
    const original = await importOriginal();
    return {
        ...original,
        system: {
            ...original.system,
            runInterval: vi.fn((callback, interval) => {
                const intervalId = setInterval(() => { callback(); }, interval * 50);
                return { clear: () => clearInterval(intervalId) };
            }),
            runTimeout: vi.fn((callback, timeout) => {
                const timeoutId = setTimeout(() => { callback(); }, timeout * 50);
                return { clear: () => clearTimeout(timeoutId) };
            })
        }
    };
});

vi.mock('../../../../../Canopy[BP]/scripts/lib/canopy/Canopy', () => ({
    BooleanRule: vi.fn(),
    Rules: {
        getNativeValue: vi.fn()
    }
}));

describe('dupeTnt Rule', () => {
    let booleanRuleArgs;
    let runIntervalCallback;
    let entitySpawnCallback;
    let pistonActivateCallback;

    beforeAll(() => {
        booleanRuleArgs = BooleanRule.mock.calls[0]?.[0];
        runIntervalCallback = system.runInterval.mock.calls[0]?.[0];
        entitySpawnCallback = world.afterEvents.entitySpawn.subscribe.mock.calls[0]?.[0];
        pistonActivateCallback = world.afterEvents.pistonActivate.subscribe.mock.calls[0]?.[0];
    });

    beforeEach(() => {
        spawnedEntitiesThisTick.length = 0;
    });

    it('should create a new rule', () => {
        expect(booleanRuleArgs).toEqual({
            category: 'Rules',
            identifier: 'dupeTnt',
            description: { translate: 'rules.dupeTnt' },
            wikiDescription: 'Enables/disables TNT duping. To dupe a block of TNT, it must be moved by a piston while adjacent to a note block, then ignited.\n\nThe TNT will drop with normal priming momentum in the block below where it was ignited. Note that using this rule alongside `tntPrimeMomentum` will cause a 1-gametick slowdown before the TNT drops.\n\n![Dupe TNT Example](./exampleAssets/dupeTnt.png)'
        });
    });

    it('should clear spawnedEntitiesThisTick every tick', () => {
        const runTimeoutCallback = vi.fn();
        system.runTimeout.mockImplementation((callback) => {
            runTimeoutCallback.mockImplementation(callback);
        });

        runIntervalCallback();
        runTimeoutCallback();

        expect(system.runTimeout).toHaveBeenCalledWith(expect.any(Function), 0);
    });

    it('should subscribe to entitySpawn event', () => {
        expect(entitySpawnCallback).toBeDefined();
    });

    it('should subscribe to pistonActivate event', () => {
        expect(pistonActivateCallback).toBeDefined();
    });

    it('should handle entitySpawn event correctly', () => {
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