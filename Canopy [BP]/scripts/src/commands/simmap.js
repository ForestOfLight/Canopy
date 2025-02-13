import { Command } from "../../lib/canopy/Canopy";
import { MinecraftDimensionTypes, world } from "@minecraft/server";
import { isNumeric, getColoredDimensionName } from "../../include/utils";

const DEFAULT_CHUNK_DISTANCE = 7;
const MAX_CHUNK_DISTANCE = 30;

const validDimensions = {
    'o': MinecraftDimensionTypes.overworld,
    'overworld': MinecraftDimensionTypes.overworld,
    'minecraft:overworld': MinecraftDimensionTypes.overworld,
    'n': MinecraftDimensionTypes.nether,
    'nether': MinecraftDimensionTypes.nether,
    'minecraft:nether': MinecraftDimensionTypes.nether,
    'e': MinecraftDimensionTypes.theEnd,
    'end': MinecraftDimensionTypes.theEnd,
    'the_end': MinecraftDimensionTypes.theEnd,
    'minecraft:the_end': MinecraftDimensionTypes.theEnd
};

const cmd = new Command({
    name: 'simmap',
    description: { translate: 'commands.simmap' },
    usage: 'simmap [distance] [dimension x z] [display <distance / dimension x z / here>]',
    args: [
        { type: 'number|string', name: 'argOne' },
        { type: 'string|number', name: 'argTwo' },
        { type: 'number', name: 'argThree' },
        { type: 'number', name: 'argFour' },
    ],
    callback: simmapCommand,
    helpEntries: [
        { usage: 'simmap <distance>', description: { translate: 'commands.simmap.help.distance' } },
        { usage: 'simmap [distance] <dimension x z>', description: { translate: 'commands.simmap.help.location' } },
        { usage: 'simmap display <distance / dimension x z>', description: { translate: 'commands.simmap.help.display.set' } },
        { usage: 'simmap display here', description: { translate: 'commands.simmap.help.display.reset' } }
    ]
});

function simmapCommand(sender, args) {
    const { argOne } = args;
    if (argOne === 'display') 
        handleInfoDisplayConfig(sender, args);
     else 
        handleChatCommand(sender, args);
    
}

function handleInfoDisplayConfig(sender, args) {
    const { argTwo, argThree: x, argFour: z } = args;
    if (isNumeric(argTwo) && (argTwo < 1 || argTwo > MAX_CHUNK_DISTANCE)) {
        sender.sendMessage({ translate: 'commands.simmap.invalidDistance', with: [String(argTwo), String(MAX_CHUNK_DISTANCE)] });
        return;
    }

    if (isNumeric(argTwo)) {
        updateDistance(sender, argTwo);
    } else if (validDimensions[argTwo] && x !== null && z !== null) {
        const dimensionLocation = { dimension: validDimensions[argTwo], x, z };
        updateLocation(sender, dimensionLocation);
    } else if (argTwo === 'here') {
        resetLocation(sender);
    } else {
        return cmd.sendUsage(sender);
    }
}

function updateDistance(sender, distance) {
    const config = getConfig(sender);
    config.distance = distance;
    sender.setDynamicProperty('simulationMapConfig', JSON.stringify(config));
    sender.sendMessage({ translate: 'commands.simmap.config.distance', with: [String(distance)] });
}

function updateLocation(sender, dimensionLocation) {
    const { dimension, x, z } = dimensionLocation;
    const config = getConfig(sender);
    config.isLocked = true;
    config.dimension = dimension;
    config.location = { x, z };
    sender.setDynamicProperty('simulationMapConfig', JSON.stringify(config));
    sender.sendMessage({ translate: 'commands.simmap.config.location', with: [`[${x}, ${z}]`, getColoredDimensionName(dimension)] });
}

function resetLocation(sender) {
    const config = getConfig(sender);
    config.isLocked = false;
    config.dimension = sender.dimension.id;
    config.location = { x: 0, z: 0 };
    sender.setDynamicProperty('simulationMapConfig', JSON.stringify(config));
    sender.sendMessage({ translate: 'commands.simmap.config.reset' });
}

function getConfig(player) {
    const dynamicConfig = player.getDynamicProperty('simulationMapConfig');
    if (dynamicConfig) 
        return JSON.parse(dynamicConfig);
    
    const config = {
        isLocked: false,
        dimension: MinecraftDimensionTypes.overworld,
        location: { x: 0, z: 0 },
        distance: 7
    };
    player.setDynamicProperty('simulationMapConfig', JSON.stringify(config));
    return config;
}

function handleChatCommand(sender, args) {
    const { argOne, argTwo, argThree, argFour } = args;
    if (isNumeric(argOne) && (argOne < 1 || argOne > MAX_CHUNK_DISTANCE)) {
        sender.sendMessage({ translate: 'commands.simmap.invalidDistance', with: [String(argOne), String(MAX_CHUNK_DISTANCE)] });
        return;
    }

    const dimensionLocation = { dimension: sender.dimension, location: sender.location };
    if (argOne === null) {
        printLoadedChunks(sender, dimensionLocation, DEFAULT_CHUNK_DISTANCE);
    } else if (isNumeric(argOne) && argTwo === null) {
        printLoadedChunks(sender, dimensionLocation, argOne);
    } else if (argOne !== null && argTwo !== null && argThree === null) {
        return cmd.sendUsage(sender);
    } else if (isNumeric(argOne) && argTwo !== null && argThree !== null && argFour !== null) {
        dimensionLocation.dimension = world.getDimension(validDimensions[argTwo]);
        dimensionLocation.location = { x: argThree, z: argFour };
        printLoadedChunks(sender, dimensionLocation, argOne);
    } else if (!isNumeric(argOne) && isNumeric(argTwo) && argThree !== null) {
        dimensionLocation.dimension = world.getDimension(validDimensions[argOne]);
        dimensionLocation.location = { x: argTwo, z: argThree };
        printLoadedChunks(sender, dimensionLocation, DEFAULT_CHUNK_DISTANCE);
    } else {
        return cmd.sendUsage(sender);
    }
}

function printLoadedChunks(player, dimensionLocation, distance) {
    const { dimension, location } = dimensionLocation;
    const chunkLocation = coordsToChunkLocation(location);
    const dimensionChunkLocation = { dimension, ...chunkLocation };
    const loadedChunks = getNearbyLoadedChunks(dimensionChunkLocation, distance);
    const message = formatChunkMapHeader(dimensionChunkLocation, distance, loadedChunks);
    message.rawtext.push(getLoadedChunksMessage(dimension, location, distance));
    player.sendMessage(message);
}

function formatChunkMapHeader(dimensionChunkLocation, distance, loadedChunks) {
    return { rawtext: [
        { translate: 'commands.simmap.header', with: [getColoredDimensionName(dimensionChunkLocation.dimension.id), `[${dimensionChunkLocation.x.toFixed(0)}, ${dimensionChunkLocation.z.toFixed(0)}]`] },
        { text: ` §7(r${distance}): §a${loadedChunks.length}\n` }
    ] };
}

function getLoadedChunksMessage(dimension, location, distance) {
    const chunkLocation = coordsToChunkLocation(location);
    const dimensionChunkLocation = { dimension, ...chunkLocation };
    const loadedChunks = getNearbyLoadedChunks(dimensionChunkLocation, distance);
    return formatVisualChunkMap(loadedChunks, dimensionChunkLocation, distance);
}

function coordsToChunkLocation(location) {
    return { x: Math.floor(location.x / 16), z: Math.floor(location.z / 16) };
}

function getNearbyLoadedChunks(dimensionChunkLocation, distance) {
    const loadedChunks = [];
    for (let x = dimensionChunkLocation.x - distance; x <= dimensionChunkLocation.x + distance; x++) {
        for (let z = dimensionChunkLocation.z - distance; z <= dimensionChunkLocation.z + distance; z++) {
            if (isChunkLoaded(dimensionChunkLocation.dimension, x, z))
                loadedChunks.push({ x, z });
        }
    }
    return loadedChunks;
}

function isChunkLoaded(dimension, x, z) {
    try {
        const block = dimension.getBlock({ x: x * 16, y: 0, z: z * 16 });
        if (block.typeId === undefined)
            return false;
        return true;
    } catch (error) {
        if (error.message === 'cannot read property \'typeId\' of undefined')
            return false;
        throw error;
    }
}

function formatVisualChunkMap(loadedChunks, dimensionChunkLocation, distance) {
    const message = { rawtext: [] };
    for (let x = dimensionChunkLocation.x - distance; x <= dimensionChunkLocation.x + distance; x++) {
        message.rawtext.push({ text: '§7[' });
        for (let z = dimensionChunkLocation.z - distance; z <= dimensionChunkLocation.z + distance; z++) {
            if (loadedChunks.some(chunk => chunk.x === x && chunk.z === z))
                message.rawtext.push({ text: '§a▒' });
            else
                message.rawtext.push({ text: '§c▒' });
        }
        message.rawtext.push({ text: '§7]' });
        if (x !== dimensionChunkLocation.x + distance)
            message.rawtext.push({ text: '\n' });
    }
    return message;
}

export { getConfig, getLoadedChunksMessage };
