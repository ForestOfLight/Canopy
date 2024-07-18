import { system, world, DimensionTypes } from '@minecraft/server'
import Command from 'stickycore/command'
import Utils from 'stickycore/utils'
import WorldSpawns from 'src/classes/WorldSpawns'
import { channelMap } from 'src/commands/counter';

let worldSpawns = null;
let isMocking = false;
let currMobIds = [];
let currActiveArea = null;

world.afterEvents.entitySpawn.subscribe((event) => {
    if (!isMocking || event.cause === 'Loaded') return;
    event.entity.remove();
});

new Command()
    .setName('spawn')
    .addArgument('string', 'action')
    .addArgument('string|number|boolean', 'actionTwo')
    .addArgument('number', 'x1')
    .addArgument('number', 'y1')
    .addArgument('number', 'z1')
    .addArgument('number', 'x2')
    .addArgument('number', 'y2')
    .addArgument('number', 'z2')
    .setCallback(spawnCommand)
    .build()

function spawnCommand(sender, args) {
    const { action, actionTwo, x1, y1, z1, x2, y2, z2 } = args;
    const posOne = { x: x1, y: y1, z: z1 };
    const posTwo = { x: x2, y: y2, z: z2 };

    if (action === null) return sender.sendMessage('§cUsages for ./spawn:' +
                                                 '\n§c./spawn tracking [start/stop/mobname] [x1 y1 z1] [x2 y2 z2]' +
                                                 '\n§c./spawn mocking <true/false>' +
                                                 '\n§c./spawn test' +
                                                 '\n§c./spawn tracking <mobname/all>' +
                                                 '\n§c./spawn entities');

    if (action === 'entities') printAllEntities(sender);
    if (action === 'mocking') handleMockingCmd(sender, actionTwo);
    if (action === 'test') resetSpawnsAndCounters(sender);
    if (action === 'recent') recentSpawns(sender, actionTwo);
    if (action === 'tracking' && actionTwo === null) printTrackingStatus(sender);
    if (action === 'tracking' && actionTwo === 'start') startTracking(sender, posOne, posTwo);
    if (action === 'tracking' && actionTwo === 'stop') stopTracking(sender);
    if (action === 'tracking' && actionTwo !== null) trackMob(sender, actionTwo, posOne, posTwo);
}

function printAllEntities(sender) {
    DimensionTypes.getAll().forEach(dimensionId => {
        sender.sendMessage(`§7Dimension ${Utils.getColoredDimensionName(dimensionId)}§r:`);
        const entities = world.getDimension(dimensionId).getEntities();
        entities.forEach(entity => {
            sender.sendMessage(`§7-${Utils.stringifyLocation(entity.location)}: ${entity.typeId.replace('minecraft:', '')}`);
        });
    });
}

function handleMockingCmd(sender, enable) {
    if (enable === null) return sender.sendMessage('§cUsage: ./spawn mocking <true/false>');
    if (enable === 'true') {
        isMocking = true;
        sender.sendMessage('§7Spawn mocking has begun.');
        Utils.broadcastActionBar(`${sender.name} enabled spawn mocking`, sender);
    }
    if (enable === 'false') {
        isMocking = false;
        sender.sendMessage('§7Spawn mocking has ended.');
        Utils.broadcastActionBar(`${sender.name} disabled spawn mocking`, sender);
    }
}

function resetSpawnsAndCounters(sender) {
    if (worldSpawns === null) return sender.sendMessage('§cSpawns are not currently being tracked.');
    worldSpawns.reset();
    channelMap.resetAll();
    sender.sendMessage('§7Spawn counters and hopper counters reset.');
    Utils.broadcastActionBar(`§a${sender.name} reset spawn and hopper counters`, sender);
}

function recentSpawns(sender, actionTwo) {
    if (worldSpawns === null) return sender.sendMessage('§cSpawns must be tracked to use this command.');
    let output
    if (actionTwo === null)
        output = worldSpawns.getRecentSpawns();
    else
        output = worldSpawns.getRecentSpawns(actionTwo);
    sender.sendMessage(output);
}

function printTrackingStatus(sender) {
    if (worldSpawns === null) return sender.sendMessage('§cSpawns are not currently being tracked.');
    sender.sendMessage(worldSpawns.getOutput());
}

function startTracking(sender, posOne, posTwo) {
    if (worldSpawns !== null) return sender.sendMessage('§cSpawns are already being tracked.');
    if (posOne && posTwo) currActiveArea = { posOne, posTwo, dimensionId: sender.dimension.id };
    worldSpawns = new WorldSpawns(null, currActiveArea);
    worldSpawns.trackAll();
    sender.sendMessage('§7Spawns are now being tracked.');
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
    currMobIds.push(mobName);
    worldSpawns.destruct();
    if (posOne && posTwo) currActiveArea = { posOne, posTwo, dimensionId: sender.dimension.id };
    worldSpawns = new WorldSpawns(currMobIds, currActiveArea);
    if (worldSpawns !== null) return sender.sendMessage('§cReset spawns and began tracking spawns.');
    Utils.broadcastActionBar(`§a${sender.name} added ${mobName} to spawn tracking and reset`, sender);
}

export { worldSpawns };