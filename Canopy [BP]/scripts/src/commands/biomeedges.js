import { BlockVolume, CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, system } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin } from "../../lib/canopy/Canopy";
import { BiomeEdgeFinder } from "../classes/BiomeEdgeFinder.js";

const BIOMEEDGE_ACTIONS = Object.freeze({
    ADD: 'add',
    REMOVELAST: 'removelast',
    CLEAR: 'clear'
});

export class BiomeEdges extends VanillaCommand {
    maxCapacity = 32767*4;
    biomeEdgeFinders;

    constructor() {
        super({
            name: 'canopy:biomeedges',
            description: 'commands.biomeedges',
            enums: [{ name: 'canopy:biomeEdgeAction', values: Object.values(BIOMEEDGE_ACTIONS) }],
            mandatoryParameters: [ { name: 'canopy:biomeEdgeAction', type: CustomCommandParamType.Enum } ],
            optionalParameters: [
                { name: 'from', type: CustomCommandParamType.Location },
                { name: 'to', type: CustomCommandParamType.Location }
            ],
            permissionLevel: CommandPermissionLevel.GameDirectors,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin],
            callback: (origin, ...args) => this.biomeEdgesCommand(origin, ...args),
        });
        this.biomeEdgeFinders = [];
    }

    biomeEdgesCommand(origin, action, from, to) {
        if (from && !to)
            return { status: CustomCommandStatus.Failure, message: 'commands.biomeedges.missinglocations' };
        switch (action) {
            case BIOMEEDGE_ACTIONS.ADD:
                return this.pushNewBiomeEdgeFinder(origin, from, to);
            case BIOMEEDGE_ACTIONS.REMOVELAST:
                return this.popLastBiomeEdgeFinder();
            case BIOMEEDGE_ACTIONS.CLEAR:
                return this.clearBiomeEdgeFinders();
            default:
                return { status: CustomCommandStatus.Failure, message: 'commands.generic.invalidaction' };
        }
    }

    pushNewBiomeEdgeFinder(origin, fromLocation, toLocation) {
        const currentCapacity = new BlockVolume(fromLocation, toLocation).getCapacity();
        if (currentCapacity > this.maxCapacity) {
            origin.sendMessage({ translate: 'commands.biomeedges.overcapacity', with: [ String(currentCapacity), String(this.maxCapacity) ] });
            return;
        }
        const source = origin.getSource();
        system.run(() => {
            this.biomeEdgeFinders.push(new BiomeEdgeFinder(source.dimension, fromLocation, toLocation));
        });
        return { status: CustomCommandStatus.Success, message: 'commands.biomeedges.finderadded' };
    }

    popLastBiomeEdgeFinder() {
        if (this.biomeEdgeFinders.length === 0)
            return { status: CustomCommandStatus.Failure, message: 'commands.biomeedges.notfinding' };
        const finder = this.biomeEdgeFinders.pop();
        system.run(() => {
            finder.destroy();
        });
        return { status: CustomCommandStatus.Success, message: 'commands.biomeedges.finderremoved' };
    }

    clearBiomeEdgeFinders() {
        if (this.biomeEdgeFinders.length === 0)
            return { status: CustomCommandStatus.Failure, message: 'commands.biomeedges.notfinding' };
        system.run(() => {
            this.biomeEdgeFinders.forEach(finder => finder.destroy());
            this.biomeEdgeFinders = [];
        });
        return { status: CustomCommandStatus.Success, message: 'commands.biomeEdges.findingstopped' };
    }
}

export const biomeEdgesCommand = new BiomeEdges();