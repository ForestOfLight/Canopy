import { PlayerCommandOrigin, VanillaCommand } from "../../lib/canopy/Canopy";
import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, system, world } from "@minecraft/server";
import { getColoredDimensionName } from "../../include/utils";
import { SimulationMapUtils } from "../classes/SimulationMapUtils";

const MAX_CHUNK_DISTANCE = 30;

const SIMMAP_ACTIONS = Object.freeze([
    'show',
    'display',
    'follow'
]);

const SIMMAP_USAGE = '/canopy:simmap [show|display|follow] [distance] [dimension] [x] [z]';

new VanillaCommand({
    name: 'canopy:simmap',
    description: 'commands.simmap',
    enums: [
        {
            name: 'canopy:simmapAction',
            values: SIMMAP_ACTIONS
        }
    ],
    optionalParameters: [
        {
            name: 'canopy:simmapAction',
            type: CustomCommandParamType.Enum
        },
        {
            name: 'distance',
            type: CustomCommandParamType.Integer
        },
        {
            name: 'canopy:dimension',
            type: CustomCommandParamType.Enum
        },
        {
            name: 'x',
            type: CustomCommandParamType.Float
        },
        {
            name: 'z',
            type: CustomCommandParamType.Float
        }
    ],
    permissionLevel: CommandPermissionLevel.Any,
    allowedSources: [PlayerCommandOrigin],
    callback: (origin, action, distance, dimension, x, z) => {
        const sender = origin.getSource();
        system.run(() => simmapCommand(sender, {
            action: action ?? null,
            distance: distance ?? null,
            dimension: dimension ?? null,
            x: x ?? null,
            z: z ?? null
        }));
        return { status: CustomCommandStatus.Success };
    },
    wikiDescription: '',
    subCommandWikiDescription: {
        'show <distance>': {
            description: 'Displays the map with a radius of chunks equal to the specified distance.'
        },
        'show <distance> <dimension x z>': {
            description: 'Display the map around the specified location.'
        },
        'display <distance> [dimension x z]': {
            description: 'Sets the distance or location for the simulation map in your InfoDisplay.'
        },
        'follow [distance]': {
            description: 'Sets the location for the simulation map in your InfoDisplay to follow your current location.'
        }
    }
});

function simmapCommand(sender, args) {
    const { action, distance } = args;

    if (distance !== null && (distance < 1 || distance > MAX_CHUNK_DISTANCE))
        return sendInvalidDistance(sender, distance);
    if (action === null || action === 'show')
        return handleChatCommand(sender, args);
    if (action === 'display')
        return handleInfoDisplayConfig(sender, args);
    if (action === 'follow')
        return handleFollowConfig(sender, args);

    sendSimmapUsage(sender);
}

function handleChatCommand(sender, args) {
    const { distance, dimension, x, z } = args;
    const mapDistance = distance ?? SimulationMapUtils.DEFAULT_CHUNK_DISTANCE;
    const dimensionLocation = {
        dimension: sender.dimension,
        location: sender.location
    };

    if (dimension === null) {
        if (x !== null || z !== null)
            return sendSimmapUsage(sender);
        return printLoadedChunks(sender, dimensionLocation, mapDistance);
    }

    if (x === null || z === null)
        return sendSimmapUsage(sender);

    dimensionLocation.dimension = world.getDimension(dimension);
    dimensionLocation.location = { x, z };
    printLoadedChunks(sender, dimensionLocation, mapDistance);
}

function handleInfoDisplayConfig(sender, args) {
    const { distance, dimension, x, z } = args;

    if (distance === null)
        return sendSimmapUsage(sender);

    if (dimension === null) {
        if (x !== null || z !== null)
            return sendSimmapUsage(sender);
        return updateDistance(sender, distance);
    }

    if (x === null || z === null)
        return sendSimmapUsage(sender);

    updateDistance(sender, distance);
    updateLocation(sender, {
        dimension,
        x,
        z
    });
}

function handleFollowConfig(sender, args) {
    const { distance, dimension, x, z } = args;

    if (dimension !== null || x !== null || z !== null)
        return sendSimmapUsage(sender);

    if (distance !== null)
        updateDistance(sender, distance);

    resetLocation(sender);
}

function updateDistance(sender, distance) {
    SimulationMapUtils.setDistance(sender, distance);
    sender.sendMessage({
        translate: 'commands.simmap.config.distance',
        with: [String(distance)]
    });
}

function updateLocation(sender, dimensionLocation) {
    const { dimension, x, z } = dimensionLocation;
    SimulationMapUtils.setLocation(sender, dimensionLocation);
    sender.sendMessage({
        translate: 'commands.simmap.config.location',
        with: [`[${x}, ${z}]`, getColoredDimensionName(dimension)]
    });
}

function resetLocation(sender) {
    SimulationMapUtils.followPlayer(sender);
    sender.sendMessage({ translate: 'commands.simmap.config.reset' });
}

function printLoadedChunks(player, dimensionLocation, distance) {
    const { dimension, location } = dimensionLocation;
    const mapData = SimulationMapUtils.getMapData(dimension, location, distance);
    const message = formatChunkMapHeader(mapData.dimensionChunkLocation, distance, mapData.loadedChunkCount);
    message.rawtext.push(mapData.map);
    player.sendMessage(message);
}

function formatChunkMapHeader(dimensionChunkLocation, distance, loadedChunkCount) {
    return { rawtext: [
        {
            translate: 'commands.simmap.header',
            with: [
                getColoredDimensionName(dimensionChunkLocation.dimension.id),
                `[${dimensionChunkLocation.x.toFixed(0)}, ${dimensionChunkLocation.z.toFixed(0)}]`
            ]
        },
        { text: ` §7(r${distance}): §a${loadedChunkCount}\n` }
    ] };
}

function sendInvalidDistance(sender, distance) {
    sender.sendMessage({
        translate: 'commands.simmap.invalidDistance',
        with: [String(distance), String(MAX_CHUNK_DISTANCE)]
    });
}

function sendSimmapUsage(sender) {
    sender.sendMessage({
        translate: 'commands.generic.usage',
        with: [SIMMAP_USAGE]
    });
}
