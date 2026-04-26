import { debugDrawer, debugBox } from "@minecraft/debug-utilities"
import { system, world } from "@minecraft/server";

export class EndGatewayExitFinder {
    gatewayExits = [];
    runner = void 0;

    constructor() {
        this.start();
    }

    destroy() {
        this.stop();
        this.gatewayExits.length = 0;
    }

    start() {
        if (this.runner)
            return;
        this.runner = system.runInterval(this.onTick.bind(this));
    }

    onTick() {
        const players = world.getPlayers();
        for (const player of players) {
            const dimension = player.dimension;
            if (this.isStandingInGateway(player, dimension)) {
                const exitRender = debugDrawer.createRender();
            }
        }
    }

    isStandingInGateway(player, dimension) {
        return dimension.getBlock(player.location).id === "minecraft:end_gateway";
    }
}