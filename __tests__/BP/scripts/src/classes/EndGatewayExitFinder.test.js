import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { EndGatewayExitFinder } from "../../../../../Canopy[BP]/scripts/src/classes/EndGatewayExitFinder";
import { LocationInUnloadedChunkError, LocationOutOfWorldBoundariesError, world } from "@minecraft/server";
import { scheduler } from "@forestoflight/minecraft-vitest-mocks";
import { EndGatewayExitRender } from "../../../../../Canopy[BP]/scripts/src/classes/EndGatewayExitRender";

describe('EndGatewayExitFinder', () => {
    let gatewayFinder;
    beforeAll(() => {
        gatewayFinder = new EndGatewayExitFinder();
    });

    describe('constructor', () => {
        it('should initialize properties correctly', () => {
            expect(gatewayFinder.gatewayExits).toEqual([]);
            expect(gatewayFinder.runner).toBeUndefined();
        });
    });

    describe('destroy', () => {
        let mockRender;
        beforeAll(() => {
            mockRender = { location: { x: 1, y: 2, z: 3 }, render: new EndGatewayExitRender({ id: "minecraft:the_end" }, { x: 1, y: 2, z: 3 }) };
        });

        it('should clear gateway exits and stop the runner', () => {
            gatewayFinder.gatewayExits.push(mockRender);
            gatewayFinder.start();
            gatewayFinder.destroy();
            expect(gatewayFinder.gatewayExits).toEqual([]);
            expect(gatewayFinder.runner).toBeUndefined();
        });

        it('should destroy all gateway exit renders', () => {
            vi.spyOn(mockRender.render, "destroy");
            gatewayFinder.gatewayExits.push(mockRender);
            gatewayFinder.destroy();
            expect(mockRender.render.destroy).toHaveBeenCalled();
        });
    });

    describe('start', () => {
        it('should start the runner if not already running', () => {
            gatewayFinder.runner = void 0;
            gatewayFinder.start();
            expect(gatewayFinder.runner).toBeDefined();
        });

        it('should not start a new runner if one is already running', () => {
            gatewayFinder.start();
            const existingRunner = gatewayFinder.runner;
            gatewayFinder.start();
            expect(gatewayFinder.runner).toBe(existingRunner);
        });
    });

    describe('stop', () => {
        it('should stop the runner if it is running', () => {
            gatewayFinder.start();
            gatewayFinder.stop();
            expect(gatewayFinder.runner).toBeUndefined();
        });

        it('should not throw if stop is called when no runner is running', () => {
            gatewayFinder.runner = void 0;
            expect(() => gatewayFinder.stop()).not.toThrow();
        });
    });

    describe('onTick', () => {
        let mockPlayer;
        beforeEach(() => {
            vi.resetAllMocks();
            gatewayFinder.destroy();
            gatewayFinder = new EndGatewayExitFinder();
            mockPlayer = {
                location: { x: 0, y: 0, z: 0 },
                dimension: {
                    id: "minecraft:the_end",
                    getBlock: vi.fn(() => ({ id: "minecraft:end_gateway" }))
                }
            };
            vi.spyOn(world, "getPlayers").mockReturnValue([mockPlayer]);
            gatewayFinder.start();
        });

        describe('when player is standing in gateway', () => {
            it('should create an end gateway exit render at the player position one tick later', () => {
                gatewayFinder.onTick();
                scheduler.advanceTicks(1);
                expect(gatewayFinder.gatewayExits).toEqual([expect.objectContaining({ location: { x: 0, y: 0, z: 0 } })]);
            });

            it('should not create duplicate entries for the same gateway exit', () => {
                gatewayFinder.onTick();
                scheduler.advanceTicks(1);
                gatewayFinder.onTick();
                scheduler.advanceTicks(1);
                expect(gatewayFinder.gatewayExits).toEqual([expect.objectContaining({ location: { x: 0, y: 0, z: 0 } })]);
            });
        });

        describe('when player is not standing in gateway', () => {
            it('should not create an end gateway exit render', () => {
                mockPlayer.dimension.getBlock.mockReturnValue({ id: "minecraft:stone" });
                gatewayFinder.onTick();
                scheduler.advanceTicks(1);
                expect(gatewayFinder.gatewayExits).toEqual([]);
            });
        });

        it('should throw unknown errors from getBlock', () => {
            mockPlayer.dimension.getBlock.mockImplementation(() => { throw new Error("Test error"); });
            expect(() => gatewayFinder.onTick()).toThrow();
        });

        it('should ignore LocationOutOfWorldBoundariesError from getBlock', () => {
            mockPlayer.dimension.getBlock.mockImplementation(() => { throw new LocationOutOfWorldBoundariesError(); });
            expect(() => gatewayFinder.onTick()).not.toThrow();
        });

        it('should ignore LocationInUnloadedChunkError from getBlock', () => {
            mockPlayer.dimension.getBlock.mockImplementation(() => { throw new LocationInUnloadedChunkError(); });
            expect(() => gatewayFinder.onTick()).not.toThrow();
        });
    });
});