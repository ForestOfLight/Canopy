import { Command } from 'lib/canopy/Canopy';
import Utils from 'stickycore/utils';
import Data from 'stickycore/data';

let savedLocation = { x: undefined, y: undefined, z: undefined };
const MAX_DISTANCE = 64*16;

const cmd = new Command({
    name: 'distance',
    description: 'Calculates the distance between two locations. (Alias: d)',
    usage: `distance to <x y z> from [x y z] OR ${Command.prefix}distance target`,
    args: [
        { type: 'string', name: 'actionArgOne' },
        { type: 'number', name: 'fromArgX' },
        { type: 'number', name: 'fromArgY' },
        { type: 'number', name: 'fromArgZ' },
        { type: 'string', name: 'actionArgTwo' },
        { type: 'number', name: 'toArgX' },
        { type: 'number', name: 'toArgY' },
        { type: 'number', name: 'toArgZ' }
    ],
    callback: distanceCommand,
    helpEntries: [
        { usage: `distance target`, description: `Calculates distance between you and the block or entity you are looking at.` },
        { usage: `distance to <x y z> from [x y z]`, description: `Calculates the distance between two locations.` },
        { usage: `distance from [x y z]`, description: `Saves a location to calculate distance from.` },
        { usage: `distance to [x y z]`, description: `Calculates the distance from the saved location to the specified location.` }
    ]
});

new Command({
    name: 'd',
    description: 'Calculates the distance between two locations.',
    args: [
        { type: 'string', name: 'actionArgOne' },
        { type: 'number', name: 'fromArgX' },
        { type: 'number', name: 'fromArgY' },
        { type: 'number', name: 'fromArgZ' },
        { type: 'string', name: 'actionArgTwo' },
        { type: 'number', name: 'toArgX' },
        { type: 'number', name: 'toArgY' },
        { type: 'number', name: 'toArgZ' }
    ],
    usage: `d to <x y z> from [x y z] OR ${Command.prefix}d target`,
    callback: distanceCommand,
    helpHidden: true
});

function distanceCommand(sender, args) {
    const { actionArgOne, actionArgTwo } = args;
    let output = '';

    if (actionArgOne === 'from' && actionArgTwo !== 'to')
        output = trySaveLocation(sender, args);
    else if (actionArgOne === 'to')
        output = tryCalculateDistanceFromSave(sender, args);
    else if (actionArgOne === 'from' && actionArgTwo === 'to')
        output = tryCalculateDistance(sender, args);
    else if (actionArgOne === 'target')
        output = targetDistance(sender, args);
    else
        output = '§cUsage: ' + cmd.getUsage();
    
    sender.sendMessage(output);
}

function trySaveLocation(sender, args) {
    const { fromArgX, fromArgY, fromArgZ } = args;
    if (areUndefined(fromArgX, fromArgY, fromArgZ))
        savedLocation = sender.location;
    else if (areDefined(fromArgX, fromArgY, fromArgZ))
        savedLocation = { x: fromArgX, y: fromArgY, z: fromArgZ };
    else
        return '§cUsage: ./distance from [x y z]';

    return `§7Saved location: ${Utils.stringifyLocation(savedLocation)}`;
}

function tryCalculateDistanceFromSave(sender, args) {
    const { fromArgX, fromArgY, fromArgZ } = args;
    let fromLocation;
    let toLocation;

    if (!hasSavedLocation() || (savedLocation.x === null && savedLocation.y === null && savedLocation.z === null))
        return '§cNo saved location found. Save a location with: ./distance from [x y z]';
    fromLocation = savedLocation;

    if (areDefined(fromArgX, fromArgY, fromArgZ))
        toLocation = { x: fromArgX, y: fromArgY, z: fromArgZ };
    else if (areUndefined(fromArgX, fromArgY, fromArgZ))
        toLocation = sender.location;
    else
        return '§cUsage: ./distance to [x y z]';
    
    return getCompleteOutput(fromLocation, toLocation);
}

function tryCalculateDistance(sender, args) {
    const { fromArgX, fromArgY, fromArgZ, toArgX, toArgY, toArgZ } = args;
    const necessaryArgs = areDefined(fromArgX, fromArgY, fromArgZ);
    let fromLocation;
    let toLocation;

    if (necessaryArgs && areUndefined(toArgX, toArgY, toArgZ)) {
        fromLocation = { x: fromArgX, y: fromArgY, z: fromArgZ };
        toLocation = sender.location;
    } else if (necessaryArgs && areDefined(toArgX, toArgY, toArgZ)) {
        fromLocation = { x: fromArgX, y: fromArgY, z: fromArgZ };
        toLocation = { x: toArgX, y: toArgY, z: toArgZ };
    } else {
        return '§cUsage: ./distance from <x y z> to [x y z]';
    }

    return getCompleteOutput(fromLocation, toLocation);
}

function targetDistance(sender) {
    let playerLocation = sender.getHeadLocation();
    let targetLocation;

    const { blockRayResult, entityRayResult } = Data.getRaycastResults(sender, MAX_DISTANCE);
    if (!blockRayResult && !entityRayResult[0]) return '§cNo block or entity found to calculate distance from.';
    const target = Utils.getClosestTarget(sender, blockRayResult, entityRayResult);

    try {
        targetLocation = target.location;
    } catch(error) {
        return '§cUnable to get block or entity location.';
    }

    return getCompleteOutput(playerLocation, targetLocation);
}

function areDefined(x, y, z) {
    return x !== null && y !== null && z !== null;
}

function areUndefined(x, y, z) {
    return x === null && y === null && z === null;
}

function hasSavedLocation() {
    return savedLocation && (savedLocation.x !== undefined && savedLocation.y !== undefined && savedLocation.z !== undefined);
}

function calculateDistances(locationOne, locationTwo) {
    const cartesianDistance = Utils.calcDistance(locationOne, locationTwo, true);
    const cylindricalDistance = Utils.calcDistance(locationOne, locationTwo, false);
    const manhattanDistance = Math.abs(locationOne.x - locationTwo.x) + Math.abs(locationOne.y - locationTwo.y) + Math.abs(locationOne.z - locationTwo.z);

    return { cartesianDistance, cylindricalDistance, manhattanDistance };
}

function getCompleteOutput(locationOne, locationTwo) {
    let output = '';
    const { cartesianDistance, cylindricalDistance, manhattanDistance } = calculateDistances(locationOne, locationTwo);
    output += `§7Distance from §a${Utils.stringifyLocation(locationOne)}§7 to §a${Utils.stringifyLocation(locationTwo)}§7:\n`;
    output += `§7Cartesian: §r§l${cartesianDistance.toFixed(3)}§r\n`;
    output += `§7Cartesian(XZ): §r§l${cylindricalDistance.toFixed(3)}§r\n`;
    output += `§7Manhattan: §r§l${manhattanDistance.toFixed(3)}§r\n`;
    return output;
}
