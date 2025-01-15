import { Command } from "lib/canopy/Canopy";
import { MinecraftDimensionTypes, world } from "@minecraft/server";
import Utils from "include/utils";

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
    usage: 'simmap [distance] [dimension x z] OR simmap display [distance / dimension x z]',
    args: [
        { type: 'number|string', name: 'argOne' },
        { type: 'string|number', name: 'argTwo' },
        { type: 'number', name: 'argThree' },
        { type: 'number', name: 'argFour' },
    ],
    callback: simmapCommand
});

function simmapCommand(sender, args) {
    let { argOne, argTwo, argThree, argFour } = args;
    if (argOne === 'display') {
        handleInfoDisplayConfig(sender, argTwo, argThree, argFour);
        return;
    } else {
        handleChatCommand(sender, argOne, argTwo, argThree, argFour);
    }
}

function handleInfoDisplayConfig(sender, argTwo, x, z) {
    if (Utils.isNumeric(argTwo) && (argTwo < 1 || argTwo > MAX_CHUNK_DISTANCE)) {
        sender.sendMessage({ translate: 'commands.simmap.invalidDistance', with: [String(argOne), String(MAX_CHUNK_DISTANCE)] });
        return;
    }

    if (Utils.isNumeric(argTwo))
        updateDistance(sender, argTwo);
    else if (validDimensions[argTwo] && x !== null && z !== null)
        updateLocation(sender, validDimensions[argTwo], x, z);
    else
        return cmd.sendUsage(sender);
}

function updateDistance(sender, distance) {
    const config = {
        isLocked: false,
        dimension: sender.dimension,
        location: { x: 0, z: 0 },
        distance: argTwo
    };
    sender.setDynamicProperty('simulationMapConfig', JSON.stringify(config));
    sender.sendMessage({ translate: 'commands.simmap.config.distance', with: [String(argTwo)] });
}

function updateLocation(sender, dimension, x, z) {
    const config = {
        isLocked: true,
        dimension,
        location: { x, z },
        distance: 7
    };
    sender.setDynamicProperty('simulationMapConfig', JSON.stringify(config));
    sender.sendMessage({ translate: 'commands.simmap.config.location', with: [`[${x}, ${z}]`, Utils.getColoredDimensionName(dimension.id)] });
}

function handleChatCommand(sender, argOne, argTwo, argThree, argFour) {
    if (Utils.isNumeric(argOne) && (argOne < 1 || argOne > MAX_CHUNK_DISTANCE)) {
        sender.sendMessage({ translate: 'commands.simmap.invalidDistance', with: [String(argOne), String(MAX_CHUNK_DISTANCE)] });
        return;
    }

    if (argOne === null) {
        printLoadedChunks(sender, sender.dimension, sender.location, DEFAULT_CHUNK_DISTANCE);
    } else if (Utils.isNumeric(argOne) && argTwo === null) {
        printLoadedChunks(sender, sender.dimension, sender.location, argOne);
    } else if (argOne !== null && argTwo !== null && argThree === null) {
        return cmd.sendUsage(sender);
    } else if (Utils.isNumeric(argOne) && argTwo !== null && argThree !== null && argFour !== null) {
        printLoadedChunks(sender, world.getDimension(validDimensions[argTwo]), { x: argThree, z: argFour }, argOne);
    } else if (!Utils.isNumeric(argOne) && Utils.isNumeric(argTwo) && argThree !== null) {
        printLoadedChunks(sender, world.getDimension(validDimensions[argOne]), { argTwo, x: argThree }, DEFAULT_CHUNK_DISTANCE);
    } else {
        return cmd.sendUsage(sender);
    }
}

function printLoadedChunks(player, dimension, location, distance) {
    const chunkLocation = coordsToChunkLocation(location);
    const dimensionChunkLocation = { dimension, ...chunkLocation };
    const loadedChunks = getNearbyLoadedChunks(dimensionChunkLocation, distance);
    const message = formatChunkMapHeader(dimensionChunkLocation, distance, loadedChunks);
    message.rawtext.push(getLoadedChunksMessage(dimension, location, distance));
    player.sendMessage(message);
}

function formatChunkMapHeader(dimensionChunkLocation, distance, loadedChunks) {
    return { rawtext: [
        { translate: 'commands.simmap.header', with: [Utils.getColoredDimensionName(dimensionChunkLocation.dimension.id), `[${dimensionChunkLocation.x.toFixed(0)}, ${dimensionChunkLocation.z.toFixed(0)}]`] },
        { text: ` §7(${distance}x${distance}): §a${loadedChunks.length}\n` }
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
        else
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

export default getLoadedChunksMessage;
