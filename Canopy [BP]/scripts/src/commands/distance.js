import { Command } from 'lib/canopy/Canopy';
import Utils from 'include/utils';

let savedLocation = { x: undefined, y: undefined, z: undefined };
const MAX_DISTANCE = 64*16;

const cmd = new Command({
    name: 'distance',
    description: { translate: 'commands.distance' },
    usage: `distance [from [x y z]] [to [x y z]] OR ${Command.prefix}distance target`,
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
        { usage: `distance target`, description: { translate: 'commands.distance.target' } },
        { usage: `distance from <x y z> to [x y z]`, description: { translate: 'commands.distance.fromto' } },
        { usage: `distance from [x y z]`, description: { translate: 'commands.distance.from' } },
        { usage: `distance to [x y z]`, description: { translate: 'commands.distance.to' } }
    ]
});

new Command({
    name: 'd',
    description: { translate: 'commands.distance' },
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
    usage: `d to [from [x y z]] [to [x y z]] OR ${Command.prefix}d target`,
    callback: distanceCommand,
    helpHidden: true
});

function distanceCommand(sender, args) {
    const { actionArgOne, actionArgTwo } = args;
    
    let message;
    if (actionArgOne === 'from' && actionArgTwo !== 'to')
        message = trySaveLocation(sender, args);
    else if (actionArgOne === 'to')
        message = tryCalculateDistanceFromSave(sender, args);
    else if (actionArgOne === 'from' && actionArgTwo === 'to')
        message = tryCalculateDistance(sender, args);
    else if (actionArgOne === 'target')
        message = targetDistance(sender, args);
    else
        message = { translate: 'commands.generic.usage', with: [cmd.getUsage()] };
    sender.sendMessage(message);
}

function trySaveLocation(sender, args) {
    const { fromArgX, fromArgY, fromArgZ } = args;
    if (areUndefined(fromArgX, fromArgY, fromArgZ))
        savedLocation = sender.location;
    else if (areDefined(fromArgX, fromArgY, fromArgZ))
        savedLocation = { x: fromArgX, y: fromArgY, z: fromArgZ };
    else
        return { translate: 'commands.generic.usage', with: [`${Command.prefix}distance from [x y z]`] }

    return { translate: 'commands.distance.from.success', with: [Utils.stringifyLocation(savedLocation)] };
}

function tryCalculateDistanceFromSave(sender, args) {
    const { fromArgX, fromArgY, fromArgZ } = args;
    
    if (!hasSavedLocation() || (savedLocation.x === null && savedLocation.y === null && savedLocation.z === null))
        return { translate: 'commands.distance.to.fail.nosave', with: [Command.prefix] };
    const fromLocation = savedLocation;
    
    let toLocation;
    if (areDefined(fromArgX, fromArgY, fromArgZ))
        toLocation = { x: fromArgX, y: fromArgY, z: fromArgZ };
    else if (areUndefined(fromArgX, fromArgY, fromArgZ))
        toLocation = sender.location;
    else
        return { translate: 'commands.generic.usage', with: [`${Command.prefix}distance to [x y z]`] };

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
        return { translate: 'commands.generic.usage', with: [`${Command.prefix}distance from <x y z> to [x y z]`] };
    }

    return getCompleteOutput(fromLocation, toLocation);
}

function targetDistance(sender) {
    const playerLocation = sender.getHeadLocation();
    let targetLocation;

    const { blockRayResult, entityRayResult } = Utils.getRaycastResults(sender, MAX_DISTANCE);
    if (!blockRayResult && !entityRayResult[0])
        return { translate: 'commands.distance.target.notfound' };
    const target = Utils.getClosestTarget(sender, blockRayResult, entityRayResult);

    try {
        targetLocation = target.location;
    } catch {
        return { translate: 'commands.distance.target.notfound' };
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
    const { cartesianDistance, cylindricalDistance, manhattanDistance } = calculateDistances(locationOne, locationTwo);
    const message = {
        rawtext: [
            { text: `§7Distance from §a${Utils.stringifyLocation(locationOne)}§7 to §a${Utils.stringifyLocation(locationTwo)}§7:\n` },
            { rawtext: [
                { translate: 'commands.distance.cartesian', with: [cartesianDistance.toFixed(3)] }, { text: '\n' },
                { translate: 'commands.distance.cylindrical', with: [cylindricalDistance.toFixed(3)] }, { text: '\n' },
                { translate: 'commands.distance.manhattan', with: [manhattanDistance.toFixed(3)] }, { text: '\n' }
            ]}
        ]
    }
    return message;
}
