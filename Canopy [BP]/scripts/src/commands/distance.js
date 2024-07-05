import Command from 'stickycore/command'
import Utils from 'stickycore/utils'
import Data from 'stickycore/data'

let savedLocation = { x: undefined, y: undefined, z: undefined };
const MAX_DISTANCE = 64*16;

new Command()
    .setName('distance')
    .addArgument('string', 'actionArgOne')
    .addArgument('number', 'fromArgX')
    .addArgument('number', 'fromArgY')
    .addArgument('number', 'fromArgZ')
    .addArgument('string', 'actionArgTwo')
    .addArgument('number', 'toArgX')
    .addArgument('number', 'toArgY')
    .addArgument('number', 'toArgZ')
    .setCallback(distanceCommand)
    .build()

new Command()
    .setName('d')
    .addArgument('string', 'actionArgOne')
    .addArgument('number', 'fromArgX')
    .addArgument('number', 'fromArgY')
    .addArgument('number', 'fromArgZ')
    .addArgument('string', 'actionArgTwo')
    .addArgument('number', 'toArgX')
    .addArgument('number', 'toArgY')
    .addArgument('number', 'toArgZ')
    .setCallback(distanceCommand)
    .build()

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
        output = '§cUsage: ./distance to <x y z> from [x y z] or ./distance target';
    
    sender.sendMessage(output);
}

function trySaveLocation(sender, args) {
    const { fromArgX, fromArgY, fromArgZ } = args;
    if (areUndefined(fromArgX, fromArgY, fromArgZ))
        savedLocation = sender.location;
    else if (areDefined(fromArgX, fromArgY, fromArgZ))
        savedLocation = { x: fromArgX, y: fromArgY, z: fromArgZ };
    else
        return '§cInvalid arguments. Usage: ./distance from [x y z]';

    return `§7Saved location: ${Utils.stringifyLocation(savedLocation)}`;
}

function tryCalculateDistanceFromSave(sender, args) {
    const { fromArgX, fromArgY, fromArgZ } = args;
    let fromLocation;
    let toLocation;

    if (!hasSavedLocation() || (savedLocation.x === null && savedLocation.y === null && savedLocation.z === null))
        return '§cNo saved location found. Save a location with this command: ./distance from [x y z]';
    fromLocation = savedLocation;

    if (areDefined(fromArgX, fromArgY, fromArgZ))
        toLocation = { x: fromArgX, y: fromArgY, z: fromArgZ };
    else if (areUndefined(fromArgX, fromArgY, fromArgZ))
        toLocation = sender.location;
    else
        return '§cInvalid arguments. Usage: ./distance to [x y z]';
    
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
        return '§cInvalid arguments. Usage: ./distance from <x y z> to [x y z]';
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
    const unitVectorOne = Utils.normalizeVector(locationOne);
    const unitVectorTwo = Utils.normalizeVector(locationTwo);
    const cartesianDistance = Utils.calcDistance(locationOne, locationTwo, true);
    const manhattanDistance = Math.abs(locationOne.x - locationTwo.x) + Math.abs(locationOne.y - locationTwo.y) + Math.abs(locationOne.z - locationTwo.z);
    const sphericalDistance = Math.acos(Utils.dotProduct(unitVectorOne, unitVectorTwo));

    return { cartesianDistance, manhattanDistance, sphericalDistance };
}

function getCompleteOutput(locationOne, locationTwo) {
    let output = '';
    const { cartesianDistance, manhattanDistance, sphericalDistance } = calculateDistances(locationOne, locationTwo);
    output += `§7Distance from ${Utils.stringifyLocation(locationOne)} to ${Utils.stringifyLocation(locationTwo)}:\n`;
    output += `§7Cartesian: ${cartesianDistance.toFixed(3)}\n`;
    output += `§7Manhattan: ${manhattanDistance.toFixed(0)}\n`;
    output += `§7Spherical: ${sphericalDistance.toFixed(3)}\n`;
    return output;
}
