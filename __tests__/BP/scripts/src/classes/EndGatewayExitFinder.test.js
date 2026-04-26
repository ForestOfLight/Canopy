import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { EndGatewayExitFinder } from "../../../../../Canopy[BP]/scripts/src/classes/EndGatewayExitFinder";
import { LocationInUnloadedChunkError, LocationOutOfWorldBoundariesError, Player } from "@minecraft/server";
import { scheduler } from "@forestoflight/minecraft-vitest-mocks";
import { EndGatewayExitRender } from "../../../../../Canopy[BP]/scripts/src/classes/EndGatewayExitRender";

describe('EndGatewayExitFinder', () => {
    let gatewayFinder;
    beforeAll(() => {
        const player = new Player();
        gatewayFinder = new EndGatewayExitFinder(player);
    });

    describe('constructor', () => {
        it('should initialize properties correctly', () => {
            expect(gatewayFinder.gatewayExits).toEqual([]);
            expect(gatewayFinder.player).toBeDefined();
        });
    });

    describe('destroy', () => {
        let mockRender;
        beforeAll(() => {
            const player = new Player();
            mockRender = { location: { x: 1, y: 2, z: 3 }, render: new EndGatewayExitRender(player, { id: "minecraft:the_end" }, { x: 1, y: 2, z: 3 }) };
        });

        it('should clear gateway exits', () => {
            gatewayFinder.gatewayExits.push(mockRender);
            gatewayFinder.destroy();
            expect(gatewayFinder.gatewayExits).toEqual([]);
        });

        it('should destroy all gateway exit renders', () => {
            vi.spyOn(mockRender.render, "destroy");
            gatewayFinder.gatewayExits.push(mockRender);
            gatewayFinder.destroy();
            expect(mockRender.render.destroy).toHaveBeenCalled();
        });
    });

    describe('onTickTryFindTryFind', () => {
        let mockPlayer;
        beforeEach(() => {
            vi.resetAllMocks();
            gatewayFinder.destroy();
            mockPlayer = {
                location: { x: 0, y: 0, z: 0 },
                dimension: {
                    id: "minecraft:the_end",
                    getBlock: vi.fn(() => ({ id: "minecraft:end_gateway" }))
                }
            };
            gatewayFinder = new EndGatewayExitFinder(mockPlayer);
        });

        describe('when player is standing in gateway', () => {
            it('should create an end gateway exit render at the player position one tick later', () => {
                gatewayFinder.onTickTryFind();
                scheduler.advanceTicks(1);
                expect(gatewayFinder.gatewayExits).toEqual([expect.objectContaining({ location: { x: 0, y: 0, z: 0 } })]);
            });

            it('should not create duplicate entries for the same gateway exit', () => {
                gatewayFinder.onTickTryFind();
                scheduler.advanceTicks(1);
                gatewayFinder.onTickTryFind();
                scheduler.advanceTicks(1);
                expect(gatewayFinder.gatewayExits).toEqual([expect.objectContaining({ location: { x: 0, y: 0, z: 0 } })]);
            });
        });

        describe('when player is not standing in gateway', () => {
            it('should not create an end gateway exit render', () => {
                mockPlayer.dimension.getBlock.mockReturnValue({ id: "minecraft:stone" });
                gatewayFinder.onTickTryFind();
                scheduler.advanceTicks(1);
                expect(gatewayFinder.gatewayExits).toEqual([]);
            });
        });

        it('should throw unknown errors from getBlock', () => {
            mockPlayer.dimension.getBlock.mockImplementation(() => { throw new Error("Test error"); });
            expect(() => gatewayFinder.onTickTryFind()).toThrow();
        });

        it('should ignore LocationOutOfWorldBoundariesError from getBlock', () => {
            mockPlayer.dimension.getBlock.mockImplementation(() => { throw new LocationOutOfWorldBoundariesError(); });
            expect(() => gatewayFinder.onTickTryFind()).not.toThrow();
        });

        it('should ignore LocationInUnloadedChunkError from getBlock', () => {
            mockPlayer.dimension.getBlock.mockImplementation(() => { throw new LocationInUnloadedChunkError(); });
            expect(() => gatewayFinder.onTickTryFind()).not.toThrow();
        });
    });
});