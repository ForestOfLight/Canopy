import { world, DimensionTypes } from '@minecraft/server'
import { Rule, Command } from 'lib/canopy/Canopy'
import Utils from 'stickycore/utils'
import WorldSpawns from 'src/classes/WorldSpawns'
import { channelMap } from 'src/commands/counter';
import { categoryToMobMap } from 'src/classes/SpawnTracker';

new Rule({
    category: 'Rules',
    identifier: 'commandSpawnMocking',
    description: 'Enables spawn mocking command.'
});

const cmd = new Command({
    name: 'spawn',
    description: 'Spawn command for tracking and mocking spawns.',
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
        { usage: 'spawn entities', description: 'Displays a list of all entities & their positions in the world.' },
        { usage: 'spawn recent [mobName]', description: 'Displays all mob spawns from the last 30s. Specify a mob name to filter.' },
        { usage: 'spawn tracking [x1 y1 z1] [x2 y2 z2]', description: 'Starts tracking mob spawns. Specify coords to track within an area.' },
        { usage: 'spawn <mobName> [x1 y1 z1] [x2 y2 z2]', description: 'Starts tracking a specific mob spawn. Specify coords to track within an area. Run again to add more mob types to track.' },
        { usage: 'spawn tracking', description: 'Displays a summary of all spawns that have occurred since the start of your test.' },
        { usage: 'spawn tracking stop', description: 'Stops tracking mob spawns.' },
        { usage: 'spawn mocking <true/false>', description: 'Enables/disables mob spawning while allowing the spawning algorithm to run.' }
    ]
});

let worldSpawns = null;
let isMocking = false;
let currMobIds = [];
let currActiveArea = null;

world.afterEvents.entitySpawn.subscribe(async (event) => {
    const entity = event.entity;
    if (worldSpawns && entity.typeId !== 'minecraft:item') worldSpawns.sendMobToTrackers(event.entity);

    if (!isMocking || event.cause === 'Loaded' || !await Rule.getValue('commandSpawnMocking')) return;
    let shouldCancelSpawn = false;
    for (const category in categoryToMobMap) {
        if (categoryToMobMap[category].includes(event.entity.typeId.replace('minecraft:', ''))) shouldCancelSpawn = true;
    }
    if (shouldCancelSpawn) event.entity.remove();
});

function spawnCommand(sender, args) {
    const { action, actionTwo, x1, y1, z1, x2, y2, z2 } = args;
    const posOne = { x: x1, y: y1, z: z1 };
    const posTwo = { x: x2, y: y2, z: z2 };

    if (action === 'entities') printAllEntities(sender);
    else if (action === 'mocking') handleMockingCmd(sender, actionTwo);
    else if (action === 'test') resetSpawnsAndCounters(sender);
    else if (action === 'recent') recentSpawns(sender, actionTwo);
    else if (action === 'tracking' && actionTwo === null) printTrackingStatus(sender);
    else if (action === 'tracking' && actionTwo !== null && x1 !== null && z2 === null) sender.sendMessage('§cUsage: ./spawn tracking <start/stop/mobname> [x1 y1 z1] [x2 y2 z2]');
    else if (action === 'tracking' && actionTwo === 'start') startTracking(sender, posOne, posTwo);
    else if (action === 'tracking' && actionTwo === 'stop') stopTracking(sender);
    else if (action === 'tracking' && actionTwo !== null) trackMob(sender, actionTwo, posOne, posTwo);
    else return cmd.sendUsage(sender);
}

function printAllEntities(sender) {
    DimensionTypes.getAll().forEach(dimension => {
        const dimensionId = dimension.typeId;
        sender.sendMessage(`§7Dimension ${Utils.getColoredDimensionName(dimensionId)}§r:`);
        const entities = world.getDimension(dimensionId).getEntities();
        entities.forEach(entity => {
            sender.sendMessage(`§7-${Utils.stringifyLocation(entity.location)}: ${entity.typeId.replace('minecraft:', '')}`);
        });
    });
}

async function handleMockingCmd(sender, enable) {
    if (!await Rule.getValue('commandSpawnMocking')) return sender.sendMessage('§cThe commandSpawnMocking rule is disabled.');
    if (enable === null) return sender.sendMessage('§cUsage: ./spawn mocking <true/false>');
    isMocking = enable;
    const messageColor = enable ? '§c' : '§a';
    const actionText = enable ? 'enabled' : 'disabled';
    let output = `${messageColor}Spawn mocking set to ${enable}.`;
    if (enable) output += ' The spawn algorithm is running but mobs will not spawn.';
    else output += ' Mobs will spawn as normal.';
    sender.sendMessage(output);
    Utils.broadcastActionBar(`${messageColor}${sender.name} ${actionText} spawn mocking`, sender);
}

function resetSpawnsAndCounters(sender) {
    if (worldSpawns === null) return sender.sendMessage('§cSpawns are not currently being tracked.');
    worldSpawns.reset();
    channelMap.resetAll();
    sender.sendMessage('§7Spawn counters and hopper counters reset.');
    Utils.broadcastActionBar(`§7${sender.name} reset spawn and hopper counters`, sender);
}

function recentSpawns(sender, actionTwo) {
    if (worldSpawns === null) return sender.sendMessage('§cSpawns must be tracked to use this command.');
    let output
    if (actionTwo === null)
        output = worldSpawns.getRecentsOutput();
    else
        output = worldSpawns.getRecentsOutput(actionTwo);
    sender.sendMessage(output);
}

function printTrackingStatus(sender) {
    if (worldSpawns === null) return sender.sendMessage('§cSpawns are not currently being tracked.');
    sender.sendMessage(worldSpawns.getOutput());
}

function startTracking(sender, posOne, posTwo) {
    if (worldSpawns !== null) return sender.sendMessage('§cSpawns are already being tracked.');
    if (!isLocationNull(posOne) && !isLocationNull(posTwo)) currActiveArea = { posOne, posTwo, dimensionId: sender.dimension.id };
    worldSpawns = new WorldSpawns([], currActiveArea);
    let output = '§7Spawns are now being tracked.';
    if (currActiveArea) output += ` Area: ${Utils.stringifyLocation(posOne)} to ${Utils.stringifyLocation(posTwo)}.`;
    if (isMocking) output += ' Since spawn mocking is enabled, mobs will not spawn but they will be tracked.';
    sender.sendMessage(output);
    Utils.broadcastActionBar(`§a${sender.name} started tracking spawns`, sender);
}

function stopTracking(sender) {
    if (worldSpawns === null) return sender.sendMessage('§cSpawns are not currently being tracked.');
    printTrackingStatus(sender);
    worldSpawns.destruct();
    worldSpawns = null;
    currMobIds = [];
    currActiveArea = null;
    sender.sendMessage('§7Spawns are no longer being tracked.');
    Utils.broadcastActionBar(`§c${sender.name} stopped tracking spawns`, sender);
}

function trackMob(sender, mobName, posOne, posTwo) {
    let isTrackable = false;
    for (const category in categoryToMobMap) {
        if (categoryToMobMap[category].includes(mobName)) isTrackable = true;
    }
    if (!isTrackable) return sender.sendMessage('§cInvalid mob name. Usage: ./spawn tracking <start/stop/mobname> [x1 y1 z1] [x2 y2 z2]');
    if (!currMobIds.includes(mobName)) currMobIds.push(mobName);
    if (worldSpawns) worldSpawns.destruct();
    if (!isLocationNull(posOne) && !isLocationNull(posTwo)) currActiveArea = { posOne, posTwo, dimensionId: sender.dimension.id };
    worldSpawns = new WorldSpawns(currMobIds, currActiveArea);
    let output = '§7Spawns are now being tracked for: ' + currMobIds.join(', ');
    if (currActiveArea) output += `. Area: ${Utils.stringifyLocation(posOne)} to ${Utils.stringifyLocation(posTwo)}.`;
    sender.sendMessage(output);
    Utils.broadcastActionBar(`§a${sender.name} added ${mobName} to spawn tracking and reset`, sender);
}

function isLocationNull(location) {
    return location.x === null || location.y === null || location.z === null;
}

export { worldSpawns };