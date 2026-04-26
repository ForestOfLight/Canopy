import { LocationInUnloadedChunkError, LocationOutOfWorldBoundariesError, system } from "@minecraft/server";
import { Vector } from "../../lib/Vector";
import { EndGatewayExitRender } from "./EndGatewayExitRender";

export class EndGatewayExitFinder {
    gatewayExits = [];

    constructor(player) {
        this.player = player;
    }

    destroy() {
        for (const exit of this.gatewayExits)
            exit.render.destroy();
        this.gatewayExits.length = 0;
    }

    onTickTryFind() {
        const dimension = this.player.dimension;
        if (this.isEndGateway(dimension, this.player.location))
            system.runTimeout(() => this.addEndGatewayExit(dimension, this.player.location), 1);
    }

    isEndGateway(dimension, location) {
        try {
            return dimension.getBlock(location)?.id === "minecraft:end_gateway";
        } catch (error) {
            if (error instanceof LocationOutOfWorldBoundariesError || error instanceof LocationInUnloadedChunkError)
                return false;
            throw error;
        }
    }

    addEndGatewayExit(dimension, location) {
        if (this.exitIsKnown(location))
            return;
        const render = new EndGatewayExitRender(this.player, dimension, location);
        this.gatewayExits.push({ location: Vector.from(location), dimension, render });
    }

    exitIsKnown(location) {
        return this.gatewayExits.some(exit => exit.location.equals(Vector.from(location)));
    }
}