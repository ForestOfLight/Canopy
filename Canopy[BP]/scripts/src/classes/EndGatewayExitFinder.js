import { LocationInUnloadedChunkError, LocationOutOfWorldBoundariesError, system, world } from "@minecraft/server";
import { Vector } from "../../lib/Vector";
import { EndGatewayExitRender } from "./EndGatewayExitRender";

export class EndGatewayExitFinder {
    gatewayExits = [];
    runner = void 0;

    destroy() {
        this.stop();
        for (const exit of this.gatewayExits)
            exit.render.destroy();
        this.gatewayExits.length = 0;
    }

    start() {
        if (this.runner !== void 0)
            return;
        this.runner = system.runInterval(this.onTick.bind(this));
    }

    stop() {
        if (this.runner === void 0)
            return;
        system.clearRun(this.runner);
        this.runner = void 0;
    }

    onTick() {
        const players = world.getPlayers();
        for (const player of players) {
            const dimension = player.dimension;
            if (this.isEndGateway(dimension, player.location))
                system.runTimeout(() => this.addEndGatewayExit(dimension, player.location), 1);
        }
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
        const render = new EndGatewayExitRender(dimension, location);
        this.gatewayExits.push({ location: Vector.from(location), dimension, render });
    }

    exitIsKnown(location) {
        return this.gatewayExits.some(exit => exit.location.equals(Vector.from(location)));
    }
}