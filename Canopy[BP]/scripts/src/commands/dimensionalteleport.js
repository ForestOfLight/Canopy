import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, world, system, Entity } from "@minecraft/server";
import { VanillaCommand } from "../../lib/canopy/Canopy";
import { stringifyLocation, getColoredDimensionName, getAllDimensionIds } from "../../include/utils";

export class DimensionalTeleport extends VanillaCommand {
    constructor() {
        super({
            name: 'canopy:dtp',
            description: 'commands.dimensionalteleport',
            mandatoryParameters: [{ name: 'canopy:dimension', type: CustomCommandParamType.Enum }],
            optionalParameters: [
                { name: 'destination', type: CustomCommandParamType.Location },
                { name: 'victim', type: CustomCommandParamType.EntitySelector }
            ],
            permissionLevel: CommandPermissionLevel.GameDirectors,
            cheatsRequired: true,
            callback: (origin, ...args) => this.dimensionalTeleportCommand(origin, ...args),
            wikiDescription: 'Teleports entities to the specified dimension. If you include coordinates, the victim will be teleported to those coordinates in the specified dimension, otherwise coordinates will keep your current coordinates in the new dimension. Coordinates are converted like a nether portal when changing between the nether and the overworld. When the victim argument is empty, the command sender is assumed.'
        });
    }

    dimensionalTeleportCommand(origin, dimension, destination, victims) {
        const toDimensionId = getAllDimensionIds().includes(dimension.toLowerCase());
        if (!toDimensionId)
            return { status: CustomCommandStatus.Failure, message: 'commands.dimensionalteleport.notfound' };
        const source = origin.getSource();
        victims = this.resolveVictims(source, victims);
        if (!victims)
            return { status: CustomCommandStatus.Failure, message: 'generic.entity.notfound' };
        const toDimension = world.getDimension(toDimensionId);
        if (destination) {
            this.teleport(victims, toDimension, destination);
            origin.sendMessage({ translate: 'commands.dimensionalteleport.success.coords', with: [stringifyLocation(destination, 2), getColoredDimensionName(toDimensionId)] });
        } else {
            const fromDimensionId = source.dimension.id.replace('minecraft:', '');
            this.teleport(victims, toDimension, this.convertCoords(fromDimensionId, toDimensionId, source.location));
            origin.sendMessage({ translate: 'commands.dimensionalteleport.success', with: [getColoredDimensionName(toDimensionId)] });
        }
    }

    resolveVictims(source, victims) {
        if (victims)
            return victims;
        if (source instanceof Entity)
            return [source];
        return void 0;
    }

    convertCoords(fromDimension, toDimension, location) {
        if (fromDimension === "overworld" && toDimension === "nether")
            return { x: location.x / 8, y: location.y, z: location.z / 8 };
        else if (fromDimension === "nether" && toDimension === "overworld")
            return { x: location.x * 8, y: location.y, z: location.z * 8 };
        return location;
    }

    teleport(victims, dimension, destination) {
        system.run(() => {
            victims.forEach(entity => entity.teleport(destination, { dimension }));
        });
    }
}

export const dimensionalTeleportCommand = new DimensionalTeleport();
