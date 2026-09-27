import { PlayerCommandOrigin, VanillaCommand } from "../../lib/canopy/Canopy";
import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, system } from "@minecraft/server";
import { stringifyLocation, getRaycastResults, getClosestTarget, calcDistance } from "../../include/utils";

let savedLocation = { x: undefined, y: undefined, z: undefined };
const MAX_DISTANCE = 64*16;

const DISTANCE_ACTIONS = Object.freeze([
    'target',
    'from',
    'to'
]);

const DISTANCE_CONNECTORS = Object.freeze([
    'to'
]);

const NATIVE_PREFIX = '/';
const DISTANCE_USAGE = '/distance <target|from|to> [location] [to] [location]';

new VanillaCommand({
    name: 'canopy:distance',
    description: 'commands.distance',
    enums: [
        {
            name: 'canopy:distanceAction',
            values: DISTANCE_ACTIONS
        },
        {
            name: 'canopy:distanceConnector',
            values: DISTANCE_CONNECTORS
        }
    ],
    mandatoryParameters: [
        {
            name: 'canopy:distanceAction',
            type: CustomCommandParamType.Enum
        }
    ],
    optionalParameters: [
        {
            name: 'location',
            type: CustomCommandParamType.Location
        },
        {
            name: 'canopy:distanceConnector',
            type: CustomCommandParamType.Enum
        },
        {
            name: 'location',
            type: CustomCommandParamType.Location
        }
    ],
    permissionLevel: CommandPermissionLevel.Any,
    allowedSources: [PlayerCommandOrigin],
    aliases: ['canopy:d'],
    callback: (origin, actionArgOne, location, actionArgTwo, destination) => {
        const sender = origin.getSource();

        system.run(() => distanceCommand(sender, {
            actionArgOne: actionArgOne ?? null,
            fromArgX: location?.x ?? null,
            fromArgY: location?.y ?? null,
            fromArgZ: location?.z ?? null,
            actionArgTwo: actionArgTwo ?? null,
            toArgX: destination?.x ?? null,
            toArgY: destination?.y ?? null,
            toArgZ: destination?.z ?? null
        }));

        return { status: CustomCommandStatus.Success };
    },
    wikiDescription: 'Calculates the cartesian, flat cartesian, and manhattan distances between two points.'
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
        message = { translate: 'commands.generic.usage', with: [DISTANCE_USAGE] };
    sender.sendMessage(message);
}

function trySaveLocation(sender, args) {
    const { fromArgX, fromArgY, fromArgZ } = args;
    if (areUndefined(fromArgX, fromArgY, fromArgZ))
        savedLocation = sender.location;
    else if (areDefined(fromArgX, fromArgY, fromArgZ))
        savedLocation = { x: fromArgX, y: fromArgY, z: fromArgZ };
    else
        return { translate: 'commands.generic.usage', with: [`${NATIVE_PREFIX}distance from [x y z]`] }

    return { translate: 'commands.distance.from.success', with: [stringifyLocation(savedLocation)] };
}

function tryCalculateDistanceFromSave(sender, args) {
    const { fromArgX, fromArgY, fromArgZ } = args;
    
    if (!hasSavedLocation() || (savedLocation.x === null && savedLocation.y === null && savedLocation.z === null))
        return { translate: 'commands.distance.to.fail.nosave', with: [NATIVE_PREFIX] };
    const fromLocation = savedLocation;
    
    let toLocation;
    if (areDefined(fromArgX, fromArgY, fromArgZ))
        toLocation = { x: fromArgX, y: fromArgY, z: fromArgZ };
    else if (areUndefined(fromArgX, fromArgY, fromArgZ))
        toLocation = sender.location;
    else
        return { translate: 'commands.generic.usage', with: [`${NATIVE_PREFIX}distance to [x y z]`] };

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
        return { translate: 'commands.generic.usage', with: [`${NATIVE_PREFIX}distance from <x y z> to [x y z]`] };
    }

    return getCompleteOutput(fromLocation, toLocation);
}

function targetDistance(sender) {
    const playerLocation = sender.getHeadLocation();
    let targetLocation;

    const { blockRayResult, entityRayResult } = getRaycastResults(sender, MAX_DISTANCE);
    if (!blockRayResult && !entityRayResult[0])
        return { translate: 'commands.distance.target.notfound' };
    const target = getClosestTarget(sender, blockRayResult, entityRayResult);

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
    const cartesianDistance = calcDistance(locationOne, locationTwo, true);
    const cylindricalDistance = calcDistance(locationOne, locationTwo, false);
    const manhattanDistance = Math.abs(locationOne.x - locationTwo.x) + Math.abs(locationOne.y - locationTwo.y) + Math.abs(locationOne.z - locationTwo.z);

    return { cartesianDistance, cylindricalDistance, manhattanDistance };
}

function getCompleteOutput(locationOne, locationTwo) {
    const { cartesianDistance, cylindricalDistance, manhattanDistance } = calculateDistances(locationOne, locationTwo);
    const message = {
        rawtext: [
            { text: `§7Distance from §a${stringifyLocation(locationOne)}§7 to §a${stringifyLocation(locationTwo)}§7:\n` },
            { rawtext: [
                { translate: 'commands.distance.cartesian', with: [cartesianDistance.toFixed(3)] }, { text: '\n' },
                { translate: 'commands.distance.cylindrical', with: [cylindricalDistance.toFixed(3)] }, { text: '\n' },
                { translate: 'commands.distance.manhattan', with: [manhattanDistance.toFixed(3)] }, { text: '\n' }
            ]}
        ]
    }
    return message;
}
