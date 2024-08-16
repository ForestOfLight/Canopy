import { system, world } from '@minecraft/server';
import { Command } from 'lib/canopy/Canopy';
import Data from 'stickycore/data';
import Utils from 'stickycore/utils';

const MAIN_COLOR = '§7';
const SECONDARY_COLOR = '§c';
const TERTIARY_COLOR = '§a';

const cmd = new Command({
    name: 'log',
    description: 'Log tnt, projectile, and falling block movement.',
    usage: 'log <tnt/projectiles/falling_blocks> [precision]',
    args: [
        { type: 'string', name: 'type' },
        { type: 'number', name: 'precision' }
    ],
    callback: logCommand
});

class LoggingPlayer {
    constructor(player) {
        this.player = player;
        this.types = [];
    }

    addType(type) {
        this.types.push(type);
    }

    removeType(type) {
        this.types = this.types.filter(t => t != type);
    }
}

class LoggingPlayers {
    constructor() {
        if (this.playerList === undefined)
            this.playerList = [];
    }

    add(player) {
        this.playerList.push(new LoggingPlayer(player));
    }

    remove(player) {
        this.playerList = this.playerList.filter(loggingPlayer => loggingPlayer.player.id !== player.id);
    }

    get(player) {
        return this.playerList.find(loggingPlayer => loggingPlayer.player.id == player.id);
    }

    includes(player) {
        return this.playerList.some(loggingPlayer => loggingPlayer.player.id === player.id);
    }

    forEach(callback) {
        this.playerList.forEach(callback);
    }
}

class TypeLog {
    constructor(logType) {
        this.logType = logType;
        this.movingEntities = [];
        this.thisTickEntities = [];
        this.lastTickEntities = [];
    }

    update() {
        this.thisTickEntities = [];
        this.movingEntities = [];
        for (const dimensionId of ['overworld', 'nether', 'the_end']) {
            const dimEntities = world.getDimension(dimensionId).getEntities();
            for (const entity of dimEntities) {
                if (hasTrait(entity, this.logType)) {
                    this.thisTickEntities.push(entity);
                }
            }
        }
        for (const entity of this.thisTickEntities) {
            if (this.hasMovedSinceLastTick(entity)) this.movingEntities.push(entity);
        }
    }

    updateLastTickEntities() {
        this.lastTickEntities = [];
        for (const entity of this.thisTickEntities) {
            if (!entity.isValid()) return;
            this.lastTickEntities.push({
                id: entity.id,
                location: entity.location,
                dimension: entity.dimension
            });
        }
    }

    hasMovedSinceLastTick(entity) {
        const lastTickEntity = this.lastTickEntities.find(lastTickEntity => 
            lastTickEntity.id === entity.id &&
            lastTickEntity.location.x === entity.location.x &&
            lastTickEntity.location.y === entity.location.y &&
            lastTickEntity.location.z === entity.location.z &&
            lastTickEntity.dimension.id === entity.dimension.id
        );
        return lastTickEntity === undefined;
    }

    printLogBody(player, precision) {
        const formattedTypeMap = this.createFormattedTypeMap(precision);
        let output = '';
        for (const typeId of Object.keys(formattedTypeMap)) {
            output += `${TERTIARY_COLOR}${typeId}\n${MAIN_COLOR} - ${formattedTypeMap[typeId].join(', ')}\n`;
        }
        player.sendMessage(output);
    }

    createFormattedTypeMap(precision) {
        const typeMap = {};
        this.movingEntities.forEach(movingEntity => {
            if (typeMap[movingEntity.typeId] === undefined) typeMap[movingEntity.typeId] = [];
            typeMap[movingEntity.typeId].push(this.getFormattedLocation(movingEntity, precision));
        });
        return typeMap;
    }

    getFormattedLocation(entity, precision) {
        const x = entity.location.x.toFixed(precision);
        const y = entity.location.y.toFixed(precision);
        const z = entity.location.z.toFixed(precision);
        const lastTickEntity = this.lastTickEntities.find(lastTickEntity => lastTickEntity.id === entity.id);
        if (lastTickEntity === undefined) return `${MAIN_COLOR}[${x}, ${y}, ${z}]`;
        const xColor = lastTickEntity.location.x !== entity.location.x ? SECONDARY_COLOR : MAIN_COLOR;
        const yColor = lastTickEntity.location.y !== entity.location.y ? SECONDARY_COLOR : MAIN_COLOR;
        const zColor = lastTickEntity.location.z !== entity.location.z ? SECONDARY_COLOR : MAIN_COLOR;
        return `${MAIN_COLOR}[${xColor}${x}${MAIN_COLOR}, ${yColor}${y}${MAIN_COLOR}, ${zColor}${z}${MAIN_COLOR}]`;
    }
}

function hasTrait(entity, logType) {
    if (logType === 'projectiles') return entity.getComponent('minecraft:projectile') !== undefined;
    if (logType === 'falling_blocks') return entity.typeId === 'minecraft:falling_block';
}

const loggingPlayers = new LoggingPlayers();
const projectileLog = new TypeLog('projectiles');
const fallingBlockLog = new TypeLog('falling_blocks');
let logStartTick = Data.getAbsoluteTime();
let activeTntLocations = {};

world.afterEvents.entitySpawn.subscribe((event) => {
    const entity = event.entity;
    if (entity.typeId === 'minecraft:tnt') {
        activeTntLocations[entity.id] = entity.location;
    }
});

world.beforeEvents.entityRemove.subscribe((event) => {
    const removedEntity = event.removedEntity;
    if (removedEntity.typeId === 'minecraft:tnt') {
        loggingPlayers.forEach(loggingPlayer => {
            if (loggingPlayer.types.includes('tnt')) {
                printTntLog(loggingPlayer.player, removedEntity);
            }
        });
    }
});

function printTntLog(player, tntEntity) {
    const tntStartLocation = activeTntLocations[tntEntity.id];
    if (tntStartLocation === undefined) return;
    const precision = player.getDynamicProperty('logPrecision');
    const startLocation = Utils.stringifyLocation(tntStartLocation, precision);
    const endLocation = Utils.stringifyLocation(tntEntity.location, precision);
    const output = `§a${startLocation}§7 --> §c${endLocation}`;
    delete activeTntLocations[tntEntity.id];
    player.sendMessage(output);
}

system.runInterval(() => {
	loggingPlayers.forEach(loggingPlayer => {
        if (loggingPlayer.types.length === 0) loggingPlayers.remove(loggingPlayer.player);
        if (loggingPlayer.types.includes('projectiles') || loggingPlayer.types.includes('falling_blocks'))
            logUpdate(loggingPlayer);
    });
});

function logUpdate(loggingPlayer) {
    const player = loggingPlayer.player;
    const precision = player.getDynamicProperty('logPrecision');

    if (loggingPlayer.types.includes('projectiles')) {
        projectileLog.update();
    }
    if (loggingPlayer.types.includes('falling_blocks')) {
        fallingBlockLog.update();
    }
    if (projectileLog.movingEntities.length === 0 && fallingBlockLog.movingEntities.length === 0) logStartTick = Data.getAbsoluteTime();

    if (projectileLog.movingEntities.length > 0 || fallingBlockLog.movingEntities.length > 0)
        player.sendMessage(getLogHeader(projectileLog.movingEntities.concat(fallingBlockLog.movingEntities)));
    if (projectileLog.movingEntities.length > 0)
        projectileLog.printLogBody(player, precision);
    if (fallingBlockLog.movingEntities.length > 0)
        fallingBlockLog.printLogBody(player, precision);
    projectileLog.updateLastTickEntities();
    fallingBlockLog.updateLastTickEntities();
}

function getLogHeader(movingEntities) {
    const absoluteTimeStr = (Data.getAbsoluteTime() - logStartTick).toString().padStart(2, '0');
    let output = `${TERTIARY_COLOR}----- Total: ${movingEntities.length}${MAIN_COLOR} (tick: ${absoluteTimeStr.slice(0, -2)}${SECONDARY_COLOR}${absoluteTimeStr.slice(-2)}${MAIN_COLOR})${TERTIARY_COLOR} -----`;
    return output;
}

function logCommand(sender, args) {
    let { type, precision } = args;

    if (sender.getDynamicProperty('logPrecision') === undefined) sender.setDynamicProperty('logPrecision', 3);
    if (precision !== null) setLogPrecsion(sender, precision);
    
    if (['tnt', 'projectiles', 'falling_blocks'].includes(type))
        toggleLogging(sender, type);
    else
        cmd.sendUsage(sender);
}

function setLogPrecsion(sender, value) {
    const precision = Math.max(0, Math.min(parseInt(value, 10), 15));
    sender.setDynamicProperty('logPrecision', precision);
    sender.sendMessage(`§7Logging precision set to ${precision}.`);
}

function toggleLogging(sender, type) {
    if (!loggingPlayers.includes(sender)) loggingPlayers.add(sender);
    const loggingPlayer = loggingPlayers.get(sender);

    let output = '';
    if (loggingPlayer.types.includes(type)) {
        loggingPlayer.removeType(type);
        output = `§7Stopped logging ${type}.`;
    } else {
        loggingPlayer.addType(type);
        output = `§7Started logging ${type}.`;
    }
    sender.sendMessage(output);
}