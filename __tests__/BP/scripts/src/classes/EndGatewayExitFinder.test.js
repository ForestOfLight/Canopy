import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EndGatewayExitFinder } from '../../../../../Canopy[BP]/scripts/src/classes/EndGatewayExitFinder';
import { world, system, UnloadedChunksError } from '@minecraft/server';
import { scheduler } from '@forestoflight/minecraft-vitest-mocks';
import { EndGatewayExits } from '../../../../../Canopy[BP]/scripts/src/classes/EndGatewayExits';
import { Vector } from '../../../../../Canopy[BP]/scripts/lib/Vector';

vi.mock('@minecraft/server', async () => {
    const serverModule = await import('@forestoflight/minecraft-vitest-mocks/server');
    class MockUnloadedChunksError extends Error {}
    return { ...serverModule, UnloadedChunksError: MockUnloadedChunksError };
});

describe('EndGatewayExitFinder', () => {
    let finder;
    let mockDimension;
    let mockPlayer;

    beforeEach(() => {
        mockDimension = {
            id: 'minecraft:the_end',
            heightRange: { min: -64, max: 320 },
            getBlocks: vi.fn(() => ({ getCapacity: () => 0 })),
            getBlock: vi.fn(() => ({ id: 'minecraft:end_stone' })),
        };
        mockPlayer = {
            location: { x: 0, y: 64, z: 0 },
            dimension: mockDimension,
        };
        world.getDimension.mockReturnValue(mockDimension);
        world.getPlayers.mockReturnValue([mockPlayer]);
        system.runInterval.mockImplementation((callback, interval) => scheduler.scheduleInterval(callback, interval));
        system.runTimeout.mockImplementation((callback, delay) => scheduler.scheduleDelay(callback, delay));
        system.clearRun.mockImplementation((id) => scheduler.delete(id));
        EndGatewayExits.setLocations([]);
        finder = new EndGatewayExitFinder();
    });

    afterEach(() => {
        finder.stop();
        finder.destroy();
    });

    describe('constructor', () => {
        it('initializes with empty gatewayExits', () => {
            expect(finder.gatewayExits).toEqual([]);
        });

        it('populates known exits from storage', () => {
            EndGatewayExits.setLocations([
                { dimension: { id: 'minecraft:the_end' }, x: 1, y: 64, z: 1 }
            ]);
            const finder2 = new EndGatewayExitFinder();
            expect(finder2.gatewayExits).toHaveLength(1);
            finder2.stop();
            finder2.destroy();
        });
    });

    describe('destroy', () => {
        it('clears all gateway exits', () => {
            finder.addGatewayExit(mockDimension, Vector.from({ x: 0, y: 64, z: 0 }));
            finder.destroy();
            expect(finder.gatewayExits).toHaveLength(0);
        });

        it('calls destroy on each render', () => {
            finder.addGatewayExit(mockDimension, Vector.from({ x: 0, y: 64, z: 0 }));
            const renderSpy = vi.spyOn(finder.gatewayExits[0].render, 'destroy');
            finder.destroy();
            expect(renderSpy).toHaveBeenCalled();
        });
    });

    describe('start', () => {
        it('registers an interval', () => {
            finder.start();
            expect(scheduler.scheduled.size).toBeGreaterThan(0);
        });

        it('does not register a second interval when already running', () => {
            finder.start();
            const countAfterFirstStart = scheduler.scheduled.size;
            finder.start();
            expect(scheduler.scheduled.size).toBe(countAfterFirstStart);
        });
    });

    describe('stop', () => {
        it('cancels the interval so onTick no longer fires', () => {
            finder.start();
            const onTickSpy = vi.spyOn(finder, 'onTick');
            finder.stop();
            scheduler.advanceTicks(1);
            expect(onTickSpy).not.toHaveBeenCalled();
        });

        it('does not throw when not running', () => {
            expect(() => finder.stop()).not.toThrow();
        });
    });

    describe('onTick', () => {
        it('calls onTickPlayer for each player', () => {
            const spy = vi.spyOn(finder, 'onTickPlayer');
            finder.onTick();
            expect(spy).toHaveBeenCalledWith(mockPlayer);
        });
    });

    describe('onTickPlayer', () => {
        it('schedules tryAddEndGatewayExit when the player is near a gateway', () => {
            mockDimension.getBlocks.mockReturnValue({ getCapacity: () => 1 });
            const spy = vi.spyOn(finder, 'tryAddEndGatewayExit');
            finder.onTickPlayer(mockPlayer);
            scheduler.advanceTicks(1);
            expect(spy).toHaveBeenCalled();
        });

        it('does not schedule tryAddEndGatewayExit when not near a gateway', () => {
            mockDimension.getBlocks.mockReturnValue({ getCapacity: () => 0 });
            const spy = vi.spyOn(finder, 'tryAddEndGatewayExit');
            finder.onTickPlayer(mockPlayer);
            scheduler.advanceTicks(1);
            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe('isNearEndGateway', () => {
        it('returns true when a gateway block is present', () => {
            mockDimension.getBlocks.mockReturnValue({ getCapacity: () => 1 });
            expect(finder.isNearEndGateway(mockDimension, { x: 0, y: 64, z: 0 })).toBe(true);
        });

        it('returns false when no gateway block is present', () => {
            mockDimension.getBlocks.mockReturnValue({ getCapacity: () => 0 });
            expect(finder.isNearEndGateway(mockDimension, { x: 0, y: 64, z: 0 })).toBe(false);
        });

        it('returns false when chunks are unloaded', () => {
            mockDimension.getBlocks.mockImplementation(() => { throw new UnloadedChunksError(); });
            expect(finder.isNearEndGateway(mockDimension, { x: 0, y: 64, z: 0 })).toBe(false);
        });

        it('rethrows unknown errors', () => {
            mockDimension.getBlocks.mockImplementation(() => { throw new Error('unexpected'); });
            expect(() => finder.isNearEndGateway(mockDimension, { x: 0, y: 64, z: 0 })).toThrow('unexpected');
        });
    });

    describe('tryAddEndGatewayExit', () => {
        it('does nothing when the player has not traveled far and exit is unknown', () => {
            const spy = vi.spyOn(finder, 'addGatewayExit');
            finder.tryAddEndGatewayExit(mockDimension, { x: 0, y: 64, z: 0 }, { x: 0, y: 64, z: 0 });
            expect(spy).not.toHaveBeenCalled();
        });

        it('adds a gateway exit when the player has traveled far', () => {
            const spy = vi.spyOn(finder, 'addGatewayExit');
            finder.tryAddEndGatewayExit(mockDimension, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 200 });
            expect(spy).toHaveBeenCalled();
        });

        it('adds a gateway exit when the exit location is already known', () => {
            finder.addGatewayExit(mockDimension, Vector.from({ x: 0, y: 64, z: 0 }));
            const spy = vi.spyOn(finder, 'addGatewayExit');
            finder.tryAddEndGatewayExit(mockDimension, { x: 0, y: 64, z: 0 }, { x: 0, y: 64, z: 0 });
            expect(spy).toHaveBeenCalled();
        });
    });

    describe('hasTraveledFar', () => {
        it('returns true when distance exceeds 100', () => {
            expect(finder.hasTraveledFar({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 200 })).toBe(true);
        });

        it('returns false when distance is 100 or less', () => {
            expect(finder.hasTraveledFar({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 50 })).toBe(false);
        });
    });

    describe('exitIsKnown', () => {
        it('returns true when a matching exit exists', () => {
            finder.addGatewayExit(mockDimension, Vector.from({ x: 1, y: 64, z: 1 }));
            expect(finder.exitIsKnown({ x: 1, y: 64, z: 1 })).toBe(true);
        });

        it('returns false when no matching exit exists', () => {
            expect(finder.exitIsKnown({ x: 1, y: 64, z: 1 })).toBe(false);
        });
    });

    describe('removeNearbyInvalidExits', () => {
        it('removes exits that lack end_stone below them', () => {
            finder.addGatewayExit(mockDimension, Vector.from({ x: 0, y: 64, z: 0 }));
            mockDimension.getBlock.mockReturnValue({ id: 'minecraft:air' });
            finder.removeNearbyInvalidExits(mockDimension, { x: 0, y: 64, z: 0 });
            expect(finder.gatewayExits).toHaveLength(0);
        });

        it('keeps exits that have end_stone below them', () => {
            finder.addGatewayExit(mockDimension, Vector.from({ x: 0, y: 64, z: 0 }));
            mockDimension.getBlock.mockReturnValue({ id: 'minecraft:end_stone' });
            finder.removeNearbyInvalidExits(mockDimension, { x: 0, y: 64, z: 0 });
            expect(finder.gatewayExits).toHaveLength(1);
        });

        it('removes exits when the block below is undefined', () => {
            finder.addGatewayExit(mockDimension, Vector.from({ x: 0, y: 64, z: 0 }));
            mockDimension.getBlock.mockReturnValue(undefined);
            finder.removeNearbyInvalidExits(mockDimension, { x: 0, y: 64, z: 0 });
            expect(finder.gatewayExits).toHaveLength(0);
        });

        it('skips exits when getBlock throws UnloadedChunksError', () => {
            finder.addGatewayExit(mockDimension, Vector.from({ x: 0, y: 64, z: 0 }));
            mockDimension.getBlock.mockImplementation(() => { throw new UnloadedChunksError(); });
            expect(() => finder.removeNearbyInvalidExits(mockDimension, { x: 0, y: 64, z: 0 })).not.toThrow();
            expect(finder.gatewayExits).toHaveLength(1);
        });

        it('rethrows unknown errors from getBlock', () => {
            finder.addGatewayExit(mockDimension, Vector.from({ x: 0, y: 64, z: 0 }));
            mockDimension.getBlock.mockImplementation(() => { throw new Error('unexpected'); });
            expect(() => finder.removeNearbyInvalidExits(mockDimension, { x: 0, y: 64, z: 0 })).toThrow('unexpected');
        });

        it('does not check exits outside the search area', () => {
            finder.addGatewayExit(mockDimension, Vector.from({ x: 100, y: 64, z: 100 }));
            mockDimension.getBlock.mockReturnValue({ id: 'minecraft:air' });
            finder.removeNearbyInvalidExits(mockDimension, { x: 0, y: 64, z: 0 });
            expect(finder.gatewayExits).toHaveLength(1);
        });
    });

    describe('addGatewayExit', () => {
        it('adds the exit to gatewayExits', () => {
            finder.addGatewayExit(mockDimension, Vector.from({ x: 1, y: 64, z: 1 }));
            expect(finder.gatewayExits).toHaveLength(1);
        });

        it('persists the exit to storage', () => {
            finder.addGatewayExit(mockDimension, Vector.from({ x: 1, y: 64, z: 1 }));
            expect(EndGatewayExits.getLocations()).toHaveLength(1);
        });
    });

    describe('removeGatewayExit', () => {
        it('removes the exit from gatewayExits and storage', () => {
            finder.addGatewayExit(mockDimension, Vector.from({ x: 1, y: 64, z: 1 }));
            const exit = finder.gatewayExits[0];
            finder.removeGatewayExit(exit);
            expect(finder.gatewayExits).toHaveLength(0);
            expect(EndGatewayExits.getLocations()).toHaveLength(0);
        });
    });
});
