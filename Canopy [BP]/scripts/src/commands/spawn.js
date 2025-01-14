import { world, DimensionTypes } from '@minecraft/server'
import { Rule, Command } from 'lib/canopy/Canopy'
import Utils from 'include/utils'
import WorldSpawns from 'src/classes/WorldSpawns'
import { categoryToMobMap } from 'src/classes/SpawnTracker';

const thisRule = new Rule({
    category: 'Rules',
    identifier: 'commandSpawnMocking',
    description: { translate: 'rules.commandSpawnMocking' }
});

const cmd = new Command({
    name: 'spawn',
    description: { translate: 'commands.spawn' },
    usage: 'spawn [action1] [action2] [x1 y1 z1] [x2 y2 z2]',
    args: [
        { type: 'string', name: 'action' },
        { type: 'string|number|boolean', name: 'actionTwo' },
        { type: 'number', name: 'x1' },
        { type: 'number', name: 'y1' },
        { type: 'number', name: 'z1' },
        { type: 'number', name: 'x2' },
        { type: 'number', name: 'y2' },
        { type: 'number', name: 'z2' }
    ],
    callback: spawnCommand,
    helpEntries: [
        { usage: 'spawn entities', description: { translate: 'commands.spawn.entities' } },
        { usage: 'spawn recent [mobName]', description: { translate: 'commands.spawn.recent' } },
        { usage: 'spawn tracking start [x1 y1 z1] [x2 y2 z2]', description: { translate: 'commands.spawn.tracking.start' } },
        { usage: 'spawn tracking <mobName> [x1 y1 z1] [x2 y2 z2]', description: { translate: 'commands.spawn.tracking.mob' } },
        { usage: 'spawn tracking', description: { translate: 'commands.spawn.tracking.query' } },
        { usage: 'spawn tracking stop', description: { translate: 'commands.spawn.tracking.stop' } },
        { usage: 'spawn test', description: { translate: 'commands.spawn.test' } },
        { usage: 'spawn mocking <true/false>', description: { translate: 'commands.spawn.mocking' } }
    ]
});

let worldSpawns = null;
let isMocking = false;
let currMobIds = [];
let currActiveArea = null;

world.afterEvents.entitySpawn.subscribe(async (event) => {
    const entity = event.entity;
    if (worldSpawns && entity.typeId !== 'minecraft:item')
        worldSpawns.sendMobToTrackers(event.entity);

    if (!isMocking || event.cause === 'Loaded' || !await Rule.getValue('commandSpawnMocking')) return;
    let shouldCancelSpawn = false;
    for (const category in categoryToMobMap) {
        if (categoryToMobMap[category].includes(event.entity.typeId.replace('minecraft:', ''))) shouldCancelSpawn = true;
    }
    if (shouldCancelSpawn && event.entity) event.entity.remove();
});

function spawnCommand(sender, args) {
    const { action, actionTwo, x1, y1, z1, x2, y2, z2 } = args;
    const posOne = { x: x1, y: y1, z: z1 };
    const posTwo = { x: x2, y: y2, z: z2 };

    if (action === 'entities') printAllEntities(sender);
    else if (action === 'mocking') handleMockingCmd(sender, actionTwo);
    else if (action === 'test') resetSpawnCounters(sender);
    else if (action === 'recent') recentSpawns(sender, actionTwo);
    else if (action === 'tracking' && actionTwo === null) printTrackingStatus(sender);
    else if (action === 'tracking' && actionTwo !== null && x1 !== null && z2 === null) sender.sendMessage({ translate: 'commands.generic.usage', with: [`${Command.prefix}spawn tracking <start/stop/mobname> [x1 y1 z1] [x2 y2 z2]`] });
    else if (action === 'tracking' && actionTwo === 'start') startTracking(sender, posOne, posTwo);
    else if (action === 'tracking' && actionTwo === 'stop') stopTracking(sender);
    else if (action === 'tracking' && actionTwo !== null) trackMob(sender, actionTwo, posOne, posTwo);
    else return cmd.sendUsage(sender);
}

function printAllEntities(sender) {
    DimensionTypes.getAll().forEach(dimension => {
        const dimensionId = dimension.typeId;
        sender.sendMessage({ translate: 'commands.spawn.tracking.query.dimension', with: [Utils.getColoredDimensionName(dimensionId)] });
        const entities = world.getDimension(dimensionId).getEntities();
        entities.forEach(entity => {
            sender.sendMessage(`§7-${Utils.stringifyLocation(entity.location)}: ${entity.typeId.replace('minecraft:', '')}`);
        });
    });
}

async function handleMockingCmd(sender, enable) {
    if (!await Rule.getValue('commandSpawnMocking'))
        return sender.sendMessage({ translate: 'rules.generic.blocked', with: [thisRule.getID()] });
    if (enable === null)
        return sender.sendMessage({ translate: 'commands.generic.usage', with: [`${Command.prefix}spawn mocking <true/false>`] });
    isMocking = enable;
    if (enable) {
        sender.sendMessage({ translate: 'commands.spawn.mocking.enable' });
        Utils.broadcastActionBar({ translate: 'commands.spawn.mocking.enable.actionbar', with: [sender.name] }, sender);
    } else {
        sender.sendMessage({ translate: 'commands.spawn.mocking.disable' });
        Utils.broadcastActionBar({ translate: 'commands.spawn.mocking.disable.actionbar', with: [sender.name] }, sender);
    }
}

function resetSpawnCounters(sender) {
    if (worldSpawns === null)
        return sender.sendMessage({ translate: 'commands.spawn.tracking.no' });
    worldSpawns.reset();
    sender.sendMessage({ translate: 'commands.spawn.tracking.test.success' });
    Utils.broadcastActionBar({ translate: 'commands.spawn.tracking.test.success.actionbar', with: [sender.name] }, sender);
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

function startTracking(sender, posOne, posTwo) {
    if (worldSpawns !== null)
        return sender.sendMessage({ translate: 'commands.spawn.tracking.already' });
    if (!isLocationNull(posOne) && !isLocationNull(posTwo))
        currActiveArea = { posOne, posTwo, dimensionId: sender.dimension.id };
    worldSpawns = new WorldSpawns([], currActiveArea);
    const message = { rawtext: [{ translate: 'commands.spawn.tracking.start.success' }] }
    if (currActiveArea)
        message.rawtext.push({ translate: 'commands.spawn.tracking.start.area', with: [Utils.stringifyLocation(posOne), Utils.stringifyLocation(posTwo)] })
    if (isMocking)
        message.rawtext.push({ translate: 'commands.spawn.tracking.start.mocking' });
    sender.sendMessage(message);
    Utils.broadcastActionBar({ translate: 'commands.spawn.tracking.start.actionbar', with: [sender.name] }, sender);
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
    Utils.broadcastActionBar({ translate: 'commands.spawn.tracking.stop.actionbar', with: [sender.name] }, sender);
}

function trackMob(sender, mobName, posOne, posTwo) {
    let isTrackable = false;
    for (const category in categoryToMobMap) {
        if (categoryToMobMap[category].includes(mobName)) isTrackable = true;
    }
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
        message.rawtext.push({ translate: 'commands.spawn.tracking.start.area', with: [Utils.stringifyLocation(posOne), Utils.stringifyLocation(posTwo)] })
    sender.sendMessage(message);
    Utils.broadcastActionBar({ translate: 'commands.spawn.tracking.start.mob.actionbar', with: [sender.name, mobName]}, sender);
}

function isLocationNull(location) {
    return location.x === null || location.y === null || location.z === null;
}

export { worldSpawns };