import { BlockVolume, system, UnloadedChunksError, world } from "@minecraft/server";
import { Vector } from "../../lib/Vector";
import { EndGatewayExitRender } from "./EndGatewayExitRender";
import { EndGatewayExits } from "./EndGatewayExits";

export class EndGatewayExitFinder {
    gatewayExits = [];
    VANILLA_EXIT_SEARCH_AREA_SIZE = 32;
    #runner = void 0;

    constructor() {
        this.populateKnownExits();
    }

    destroy() {
        for (const exit of this.gatewayExits)
            exit.render.destroy();
        this.gatewayExits.length = 0;
    }

    start() {
        if (this.#runner)
            return;
        this.#runner = system.runInterval(() => this.onTick());
    }

    stop() {
        if (this.#runner) {
            system.clearRun(this.#runner);
            this.#runner = void 0;
        }
    }

    onTick() {
        for (const player of world.getPlayers())
            this.onTickPlayer(player);
    }

    onTickPlayer(player) {
        const dimension = player.dimension;
        const previousLocation = player.location;
        if (this.isNearEndGateway(dimension, previousLocation))
            system.runTimeout(() => this.tryAddEndGatewayExit(dimension, previousLocation, player.location), 1);
    }

    isNearEndGateway(dimension, location) {
        const min = Vector.add(location, new Vector(-1, -1, -1));
        const max = Vector.add(location, new Vector(1, 2, 1));
        const blockVolume = new BlockVolume(min, max);
        try {
            return dimension?.getBlocks(blockVolume, { includeTypes: ['minecraft:end_gateway'] })?.getCapacity() > 0;
        } catch (error) {
            if (error instanceof UnloadedChunksError)
                return false;
            throw error;
        }
    }

    tryAddEndGatewayExit(dimension, previousLocation, location) {
        const flooredLocation = Vector.from(location).floor();
        if (!this.hasTraveledFar(previousLocation, flooredLocation) && !this.exitIsKnown(flooredLocation))
            return;
        this.removeNearbyInvalidExits(dimension, flooredLocation);
        this.addGatewayExit(dimension, flooredLocation);
    }

    hasTraveledFar(previousLocation, location) {
        const minDistance = 100;
        const distance = Vector.distance(previousLocation, location);
        return distance > minDistance;
    }

    exitIsKnown(location) {
        return this.gatewayExits.some(exit => exit.location.equals(Vector.from(location)));
    }

    removeNearbyInvalidExits(dimension, location) {
        const nearbyExits = this.gatewayExits.filter(exit =>
            exit.dimension.id === dimension.id
            && Math.abs(exit.location.x - location.x) <= this.VANILLA_EXIT_SEARCH_AREA_SIZE / 2
            && Math.abs(exit.location.y - location.y) <= exit.dimension.heightRange.max
            && Math.abs(exit.location.z - location.z) <= this.VANILLA_EXIT_SEARCH_AREA_SIZE / 2
        );
        for (const exit of nearbyExits) {
            let blockBelowExit;
            try {
                blockBelowExit = dimension.getBlock({ x: exit.location.x, y: exit.location.y - 1, z: exit.location.z });
            } catch (error) {
                if (error instanceof UnloadedChunksError)
                    continue;
                throw error;
            }
            if (blockBelowExit?.id !== 'minecraft:end_stone') {
                exit.render.destroy();
                this.removeGatewayExit(exit);
            }
        }
    }

    addGatewayExit(dimension, location) {
        const render = new EndGatewayExitRender(dimension, location, this.VANILLA_EXIT_SEARCH_AREA_SIZE);
        this.gatewayExits.push({ location: location, dimension, render });
        EndGatewayExits.addLocation(dimension, location);
    }

    removeGatewayExit(exit) {
        this.gatewayExits.splice(this.gatewayExits.indexOf(exit), 1);
        EndGatewayExits.removeLocation(exit.dimension, exit.location);
    }

    populateKnownExits() {
        const knownExits = EndGatewayExits.getLocations();
        for (const { dimension, ...location } of knownExits) {
            const dimensionObj = world.getDimension(dimension.id);
            if (dimensionObj)
                this.gatewayExits.push({ location: Vector.from(location), dimension: dimensionObj, render: new EndGatewayExitRender(dimensionObj, location, this.VANILLA_EXIT_SEARCH_AREA_SIZE) });
        }
    }
}