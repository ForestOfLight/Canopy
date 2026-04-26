import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { EndGatewayExitFinder } from "../../../../../Canopy[BP]/scripts/src/classes/EndGatewayExitFinder";
import { world } from "@minecraft/server";
import { scheduler } from "@forestoflight/minecraft-vitest-mocks";

describe('EntitMovementLog', () => {
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

    describe('onTick', () => {
        let mockPlayer;
        beforeEach(() => {
            mockPlayer = {
                location: { x: 0, y: 0, z: 0 },
                dimension: {
                    id: "minecraft:the_end",
                    getBlock: vi.fn(() => ({ id: "minecraft:end_gateway" }))
                }
            };
        });

        describe('when player is standing in gateway', () => {
            it('should create an end gateway exit render at the player position one tick later if theyre in an end gateway', () => {
                vi.spyOn(world, "getPlayers").mockReturnValue([mockPlayer]);
                gatewayFinder.onTick();
                scheduler.advanceTicks(1);
                expect(mockPlayer.dimension.getBlock).toHaveBeenCalledWith({ x: 0, y: 0, z: 0 });
            });

            it('should not create an end gateway exit render if theyre not in an end gateway', () => {
                vi.spyOn(world, "getPlayers").mockReturnValue([mockPlayer]);
                mockPlayer.dimension.getBlock.mockReturnValue({ id: "minecraft:stone" });
                gatewayFinder.onTick();
            });
        });
    });
});