import { Command } from "lib/canopy/Canopy";
import { MinecraftDimensionTypes, world } from "@minecraft/server";
import Utils from "include/utils";

const DEFAULT_CHUNK_DISTANCE = 6;
const MAX_CHUNK_DISTANCE = 25;

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
    usage: 'simmap [distance] [dimension x z]',
    args: [
        { type: 'number|string', name: 'distance' },
        { type: 'string|number', name: 'dimension' },
        { type: 'number', name: 'x' },
        { type: 'number', name: 'z' },
    ],
    callback: checksimCommand
});

function checksimCommand(sender, args) {
    let { distance, dimension, x, z } = args;
    if (distance > MAX_CHUNK_DISTANCE) {
        sender.sendMessage({ translate: 'commands.simmap.invalidDistance', with: [String(distance), String(MAX_CHUNK_DISTANCE)] });
        return;
    }

    if (distance === null) {
        printLoadedChunks(sender, sender.dimension, sender.location, DEFAULT_CHUNK_DISTANCE);
    } else if (Utils.isNumeric(distance) && dimension === null) {
        printLoadedChunks(sender, sender.dimension, sender.location, distance);
    } else if (distance !== null && dimension !== null && x === null) {
        return cmd.sendUsage(sender);
    } else if (Utils.isNumeric(distance) && dimension !== null && x !== null && z !== null) {
        printLoadedChunks(sender, world.getDimension(validDimensions[dimension]), { x, z }, distance);
    } else if (!Utils.isNumeric(distance) && Utils.isNumeric(dimension) && x !== null) {
        z = x;
        x = dimension;
        dimension = distance;
        printLoadedChunks(sender, world.getDimension(validDimensions[dimension]), { x, z }, DEFAULT_CHUNK_DISTANCE);
    } else {
        return cmd.sendUsage(sender);
    }
}

function printLoadedChunks(player, dimension, location, distance) {
    const chunkLocation = coordsToChunkLocation(location);
    const dimensionChunkLocation = { dimension, ...chunkLocation };
    const loadedChunks = getNearbyLoadedChunks(dimensionChunkLocation, distance);
    const message = formatVisualChunkMap(loadedChunks, dimensionChunkLocation, distance);
    player.sendMessage(message);
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
    const message = { rawtext: [ 
        { translate: 'commands.simmap.header', with: [Utils.getColoredDimensionName(dimensionChunkLocation.dimension.id), `[${dimensionChunkLocation.x.toFixed(0)}, ${dimensionChunkLocation.z.toFixed(0)}]`] },
        { text: ` §7(${distance}x${distance}): §a${loadedChunks.length}`}
    ] };
    for (let x = dimensionChunkLocation.x - distance; x <= dimensionChunkLocation.x + distance; x++) {
        message.rawtext.push({ text: '\n§7[ ' });
        for (let z = dimensionChunkLocation.z - distance; z <= dimensionChunkLocation.z + distance; z++) {
            if (loadedChunks.some(chunk => chunk.x === x && chunk.z === z))
                message.rawtext.push({ text: '§a+ ' });
            else
                message.rawtext.push({ text: '§c- ' });
        }
        message.rawtext.push({ text: '§7]' });
    }
    return message;
}
