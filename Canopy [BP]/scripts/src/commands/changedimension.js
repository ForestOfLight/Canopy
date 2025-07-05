import { VanillaCommand } from "../../lib/canopy/Canopy";
import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, world, system, Entity } from "@minecraft/server";
import { stringifyLocation, getColoredDimensionName } from "../../include/utils";
import { Dimension } from "./commandEnums";

const validDimensions = {
    'o': 'overworld',
    'overworld': 'overworld',
    'n': 'nether',
    'nether': 'nether',
    'e': 'the_end',
    'end': 'the_end',
    'the_end': 'the_end',
};

new VanillaCommand({
    name: 'canopy:dtp',
    description: 'commands.changedimension',
    mandatoryParameters: [{ name: 'canopy:dimension', type: CustomCommandParamType.Enum }],
    optionalParameters: [
        { name: 'destination', type: CustomCommandParamType.Location },
        { name: 'victim', type: CustomCommandParamType.EntitySelector }
    ],
    permissionLevel: CommandPermissionLevel.GameDirectors,
    cheatsRequired: true,
    callback: changeDimensionCommand
});

function changeDimensionCommand(source, dimension, destination, victim) {
    const toDimensionId = validDimensions[dimension.toLowerCase()];
    if (!toDimensionId)
        return { status: CustomCommandStatus.Failure, message: 'commands.changedimension.notfound' };
    victim = resolveVictim(source, victim);
    if (victim.status === CustomCommandStatus.Failure)
        return victim;
    const fromDimensionId = source.dimension.id.replace('minecraft:', '');
    const toDimension = world.getDimension(toDimensionId);
    if (destination) {
        teleport(victim, toDimension, destination);
        source.sendMessage({ translate: 'commands.changedimension.success.coords', with: [stringifyLocation(destination, 2), getColoredDimensionName(toDimensionId)] });
    } else {
        system.run(() => teleport(victim, toDimension, convertCoords(fromDimensionId, toDimensionId, source.location)));
        source.sendMessage({ translate: 'commands.changedimension.success', with: [getColoredDimensionName(toDimensionId)] });
    }
}

function resolveVictim(source, victim) {
    if (!victim && !(source instanceof Entity))
        return { status: CustomCommandStatus.Failure, message: 'generic.entity.notfound' };
    else if (!victim)
        victim = source;
    return victim;
}

function convertCoords(fromDimension, toDimension, destination) {
    if (fromDimension === Dimension.Overworld && toDimension === Dimension.Nether)
        return { x: destination.x / 8, y: destination.y, z: destination.z / 8 };
    else if (fromDimension === Dimension.Nether && toDimension === Dimension.Overworld)
        return { x: destination.x * 8, y: destination.y, z: destination.z * 8 };
    return destination;
}

function teleport(victim, dimension, destination) {
    system.run(() => {
        if (victim.length > 0) {
            victim.forEach(entity => {
                entity.teleport(destination, { dimension: dimension });
            });
        } else {
            victim.teleport(destination, { dimension: dimension });
        }
    });
}
