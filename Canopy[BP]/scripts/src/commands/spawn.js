import { PlayerCommandOrigin, VanillaCommand } from "../../lib/canopy/Canopy";
import { world, DimensionTypes, CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, system } from "@minecraft/server";
import { getColoredDimensionName, stringifyLocation, broadcastActionBar } from "../../include/utils";
import WorldSpawns from "../classes/WorldSpawns";
import { categoryToMobMap } from "../../include/data";

const SPAWN_ACTIONS = Object.freeze([
    'entities',
    'mocking',
    'test',
    'recent',
    'tracking'
]);

const SPAWN_USAGE = '/canopy:spawn [action] [actionTwo] [x1 y1 z1] [x2 y2 z2]';
const SPAWN_TRACKING_USAGE = '/canopy:spawn tracking <start/stop/mobname> [x1 y1 z1] [x2 y2 z2]';
const SPAWN_MOCKING_USAGE = '/canopy:spawn mocking <true/false>';

new VanillaCommand({
    name: 'canopy:spawn',
    description: 'commands.spawn',
    enums: [
        {
            name: 'canopy:spawnAction',
            values: SPAWN_ACTIONS
        }
    ],
    optionalParameters: [
        {
            name: 'canopy:spawnAction',
            type: CustomCommandParamType.Enum
        },
        {
            name: 'actionTwo',
            type: CustomCommandParamType.String
        },
        {
            name: 'x1',
            type: CustomCommandParamType.Float
        },
        {
            name: 'y1',
            type: CustomCommandParamType.Float
        },
        {
            name: 'z1',
            type: CustomCommandParamType.Float
        },
        {
            name: 'x2',
            type: CustomCommandParamType.Float
        },
        {
            name: 'y2',
            type: CustomCommandParamType.Float
        },
        {
            name: 'z2',
            type: CustomCommandParamType.Float
        }
    ],
    permissionLevel: CommandPermissionLevel.Any,
    allowedSources: [PlayerCommandOrigin],
    callback: (origin, action, actionTwo, x1, y1, z1, x2, y2, z2) => {
        const sender = origin.getSource();

        system.run(() => spawnCommand(sender, {
            action: action ?? null,
            actionTwo: normalizeSpawnActionTwo(action, actionTwo),
            x1: x1 ?? null,
            y1: y1 ?? null,
            z1: z1 ?? null,
            x2: x2 ?? null,
            y2: y2 ?? null,
            z2: z2 ?? null
        }));

        return { status: CustomCommandStatus.Success };
    }
});

function normalizeSpawnActionTwo(action, actionTwo) {
    if (action !== 'mocking')
        return actionTwo ?? null;
    if (actionTwo === 'true')
        return true;
    if (actionTwo === 'false')
        return false;
    return actionTwo ?? null;
}

let worldSpawns = null;
let isMocking = false;
let currMobIds = [];
let currActiveArea = null;

world.afterEvents.entitySpawn.subscribe((event) => {
    const entity = event.entity;
    if (worldSpawns && entity.typeId !== 'minecraft:item')
        worldSpawns.sendMobToTrackers(event.entity);

    if (!isMocking || event.cause === 'Loaded') return;
    let shouldCancelSpawn = false;
    for (const category in categoryToMobMap) {
        if (categoryToMobMap[category].includes(event.entity.typeId.replace('minecraft:', '')))
            shouldCancelSpawn = true;
    }
    if (shouldCancelSpawn && event.entity)
        {try {
            event.entity.remove();
        } catch (error) {
            if (error.message !== "Failed to call function 'remove'")
                throw error;
        }}
});

function spawnCommand(sender, args) {
    const { action, actionTwo, x1, y1, z1, x2, y2, z2 } = args;
    const area = {
        posOne: { x: x1, y: y1, z: z1 },
        posTwo: { x: x2, y: y2, z: z2 }
    };

    if (action === 'entities')
        printAllEntities(sender);
    else if (action === 'mocking')
        handleMockingCmd(sender, actionTwo);
    else if (action === 'test')
        resetSpawnCounters(sender);
    else if (action === 'recent')
        recentSpawns(sender, actionTwo);
    else if (action === 'tracking' && actionTwo === null)
        printTrackingStatus(sender);
    else if (action === 'tracking' && actionTwo !== null && x1 !== null && z2 === null)
        sender.sendMessage({ translate: 'commands.generic.usage', with: [SPAWN_TRACKING_USAGE] });
    else if (action === 'tracking' && actionTwo === 'start')
        startTracking(sender, area);
    else if (action === 'tracking' && actionTwo === 'stop')
        stopTracking(sender);
    else if (action === 'tracking' && actionTwo !== null)
        trackMob(sender, actionTwo, area);
    else
        return sendSpawnUsage(sender);
}

function sendSpawnUsage(sender) {
    sender.sendMessage({
        translate: 'commands.generic.usage',
        with: [SPAWN_USAGE]
    });
}

function printAllEntities(sender) {
    DimensionTypes.getAll().forEach(dimension => {
        const dimensionId = dimension.typeId;
        sender.sendMessage({ translate: 'commands.spawn.tracking.query.dimension', with: [getColoredDimensionName(dimensionId)] });
        const entities = world.getDimension(dimensionId).getEntities();
        entities.forEach(entity => {
            sender.sendMessage(`§7-${stringifyLocation(entity.location)}: ${entity.typeId.replace('minecraft:', '')}`);
        });
    });
}

function handleMockingCmd(sender, enable) {
    if (sender.commandPermissionLevel === CommandPermissionLevel.Any)
        return sender.sendMessage({ translate: 'commands.generic.nopermission' });
    if (enable === null)
        return sender.sendMessage({ translate: 'commands.generic.usage', with: [SPAWN_MOCKING_USAGE] });
    isMocking = enable;
    if (enable) {
        sender.sendMessage({ translate: 'commands.spawn.mocking.enable' });
        broadcastActionBar({ translate: 'commands.spawn.mocking.enable.actionbar', with: [sender.name] }, sender);
    } else {
        sender.sendMessage({ translate: 'commands.spawn.mocking.disable' });
        broadcastActionBar({ translate: 'commands.spawn.mocking.disable.actionbar', with: [sender.name] }, sender);
    }
}

function resetSpawnCounters(sender) {
    if (worldSpawns === null)
        return sender.sendMessage({ translate: 'commands.spawn.tracking.no' });
    worldSpawns.reset();
    sender.sendMessage({ translate: 'commands.spawn.tracking.test.success' });
    broadcastActionBar({ translate: 'commands.spawn.tracking.test.success.actionbar', with: [sender.name] }, sender);
}

function recentSpawns(sender, actionTwo) {
    if (worldSpawns === null)
        return sender.sendMessage({ translate: 'commands.spawn.tracking.no' });
    let output
    if (actionTwo === null) {
        output = worldSpawns.getRecentsOutput();
    } else {
        const mobname = actionTwo.includes('minecraft:') ? actionTwo : `minecraft:${actionTwo}`;
        output = worldSpawns.getRecentsOutput(mobname);
    }
    sender.sendMessage(output);
}

function printTrackingStatus(sender) {
    if (worldSpawns === null)
        return sender.sendMessage({ translate: 'commands.spawn.tracking.no' });
    sender.sendMessage(worldSpawns.getOutput());
}

function startTracking(sender, area) {
    const { posOne, posTwo } = area;
    if (worldSpawns !== null)
        return sender.sendMessage({ translate: 'commands.spawn.tracking.already' });
    if (!isLocationNull(posOne) && !isLocationNull(posTwo))
        currActiveArea = { posOne, posTwo, dimensionId: sender.dimension.id };
    worldSpawns = new WorldSpawns([], currActiveArea);
    const message = { rawtext: [{ translate: 'commands.spawn.tracking.start.success' }] }
    if (currActiveArea)
        message.rawtext.push({ translate: 'commands.spawn.tracking.start.area', with: [stringifyLocation(posOne), stringifyLocation(posTwo)] })
    if (isMocking)
        message.rawtext.push({ translate: 'commands.spawn.tracking.start.mocking' });
    sender.sendMessage(message);
    broadcastActionBar({ translate: 'commands.spawn.tracking.start.actionbar', with: [sender.name] }, sender);
}

function stopTracking(sender) {
    if (worldSpawns === null)
        return sender.sendMessage({ translate: 'commands.spawn.tracking.no' });
    printTrackingStatus(sender);
    worldSpawns.destruct();
    worldSpawns = null;
    currMobIds = [];
    currActiveArea = null;
    sender.sendMessage({ translate: 'commands.spawn.tracking.stop.success' });
    broadcastActionBar({ translate: 'commands.spawn.tracking.stop.actionbar', with: [sender.name] }, sender);
}

function trackMob(sender, mobName, area) {
    const { posOne, posTwo } = area;
    let isTrackable = false;
    for (const category in categoryToMobMap)
        if (categoryToMobMap[category].includes(mobName)) isTrackable = true;

    if (!isTrackable)
        return sender.sendMessage({ translate: 'commands.spawn.tracking.mob.invalid', with: [String(mobName)] });
    if (!currMobIds.includes(mobName))
        currMobIds.push(mobName);
    if (worldSpawns)
        worldSpawns.destruct();
    if (!isLocationNull(posOne) && !isLocationNull(posTwo))
        currActiveArea = { posOne, posTwo, dimensionId: sender.dimension.id };
    worldSpawns = new WorldSpawns(currMobIds, currActiveArea);
    const message = { rawtext: [{ translate: 'commands.spawn.tracking.start.mob', with: [currMobIds.join(', ')] }] }
    if (currActiveArea)
        message.rawtext.push({ translate: 'commands.spawn.tracking.start.area', with: [stringifyLocation(posOne), stringifyLocation(posTwo)] })
    sender.sendMessage(message);
    broadcastActionBar({ translate: 'commands.spawn.tracking.start.mob.actionbar', with: [sender.name, mobName]}, sender);
}

function isLocationNull(location) {
    return location.x === null || location.y === null || location.z === null;
}

export { worldSpawns };
