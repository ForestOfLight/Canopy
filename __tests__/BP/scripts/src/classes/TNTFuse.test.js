import { describe, it, expect, vi, afterEach, beforeAll, afterAll } from "vitest";
import { TNTFuse } from "../../../../../Canopy [BP]/scripts/src/classes/TNTFuse";

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
                { typeId: 'minecraft:tnt', id: 'entity1', location: { x: 1, y: 2, z: 3 }, dimension: { id: 'overworld' },
                    isValid: vi.fn(() => true)
                },
                { typeId: 'minecraft:tnt', id: 'entity2', location: { x: 4, y: 5, z: 6 }, dimension: { id: 'overworld' },
                    isValid: vi.fn(() => true)
                },
                { typeId: 'minecraft:tnt', id: 'entity3', location: { x: 7, y: 8, z: 9 }, dimension: { id: 'overworld' },
                    isValid: vi.fn(() => false)
                }
            ])
        }))
    }
}));

const tnt = { 
    typeId: 'minecraft:tnt',
    getDynamicProperty: vi.fn(() => tnt.fuseTicks),
    setDynamicProperty: vi.fn((_, value) => { tnt.fuseTicks = value }),
    isValid: true,
    triggerEvent: vi.fn(),
    dimension: {
        getBlock: vi.fn(() => true)
    }
};

describe('TNTFuse', () => {
    beforeAll(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2000, 1, 1, 0, 0,));
    });

    afterEach(() => {
        vi.clearAllMocks();
        tnt.fuseTicks = void 0;
        vi.advanceTimersByTime(10000);
    });

    afterAll(() => {
        vi.useRealTimers();
    });

    it('should create a new instance based on a tnt entity', () => {
        const tntFuse = new TNTFuse(tnt);
        expect(tntFuse).toBeInstanceOf(TNTFuse);
    });

    it('should throw an error if the entity is not a tnt entity', () => {
        const notTnt = { typeId: 'minecraft:notTNT' };
        expect(() => { new TNTFuse(notTnt) }).toThrow();
    });

    it('should take an optional argument for the desired fuse time', () => {
        const tntFuse = new TNTFuse(tnt, 1);
        expect(tntFuse.totalFuseTicks).toEqual(1);
    });

    it('should default to 80 ticks if no fuse time is provided', () => {
        const tntFuse = new TNTFuse(tnt);
        expect(tntFuse.totalFuseTicks).toEqual(80);
    });

    it('should store the number of remaining fuse ticks as a DP on the tnt entity', () => {
        new TNTFuse(tnt);
        expect(tnt.getDynamicProperty('fuseTicks')).toEqual(79);
    });

    it('should start the fuse when the instance is created', () => {
        new TNTFuse(tnt);
        const onTickMock = vi.spyOn(tnt, 'setDynamicProperty');
        vi.advanceTimersByTime(50);
        expect(onTickMock).toHaveBeenCalled();
    });

    it('should explode when the fuse reaches 0', () => {
        const fuseTime = 80;
        const tntFuse = new TNTFuse(tnt, fuseTime);
        const explosionMock = vi.spyOn(tntFuse, 'triggerExplosion');
        vi.advanceTimersByTime(50*fuseTime);
        expect(explosionMock).toHaveBeenCalled();
    });

    it('should not decrease the fuse ticks if the entity is not loaded', () => {
        const invalidTnt = { 
            typeId: 'minecraft:tnt',
            getDynamicProperty: vi.fn(() => invalidTnt.fuseTicks),
            setDynamicProperty: vi.fn((_, value) => { invalidTnt.fuseTicks = value }),
            isValid: true,
            triggerEvent: vi.fn(),
            dimension: {
                getBlock: vi.fn(() => false)
            }
        };
        new TNTFuse(invalidTnt);
        vi.advanceTimersByTime(1000);
        expect(invalidTnt.getDynamicProperty('fuseTicks')).toEqual(79);
    });

    it('should take the fuse time from the entity if it already has a fuse time set', () => {
        tnt.fuseTicks = 10;
        new TNTFuse(tnt);
        expect(tnt.getDynamicProperty('fuseTicks')).toEqual(9);
    });
});