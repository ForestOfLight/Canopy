import Command from 'stickycore/command'
import * as mc from '@minecraft/server'
import Data from 'stickycore/data'
import Utils from 'stickycore/utils'

let previousTntLocations = {};
let lastObsoleteTime;

mc.system.runInterval(() => {
	const Players = mc.world.getAllPlayers();
	for (const player of Players) {
		if (player.getDynamicProperty('tntlog')) tntLog(player);
	}
});

new Command()
    .setName('tntlog')
    .addArgument('string', 'value')
    .setCallback(tntlogCommand)
    .build()

function tntlogCommand(sender, args) {
    let { value } = args;
    let boolValue;
    boolValue = value === 'on' ? true : value === 'off' ? false : boolValue;
    if (sender.getDynamicProperty('tntlogPrecision') === undefined) sender.setDynamicProperty('tntlogPrecision', 2);

    if (Utils.isNumeric(value))
        return setLogPrecsion(sender, value);
    else if (value !== 'on' && value !== 'off')
        return sender.sendMessage('§cInvalid argument. Please use on or off or a precision value between 0 and 15.');

    sender.setDynamicProperty('tntlog', value);
    sender.sendMessage(`§7TNT logging has been turned ${value}.`);
}

function setLogPrecsion(sender, value) {
    const precision = Math.max(0, Math.min(parseInt(value, 10), 15));
    sender.setDynamicProperty('tntlogPrecision', precision);
    sender.sendMessage(`§7TNT logging precision set to ${precision}.`);
}

function tntLog(player) {
    let tntLocations = [];
    let currentTntLocations = {};
    let mainColor = '§9';
    let secondaryColor = '§b';

    updateTntInfo(player, tntLocations, currentTntLocations, mainColor, secondaryColor);

    if (tntLocations.length === 0) {
        lastObsoleteTime = Data.getAbsoluteTime();
        return;
    }
    previousTntLocations = currentTntLocations;
    player.sendMessage(parseLog(tntLocations, mainColor, secondaryColor));
}

function updateTntInfo(player, tntLocations, currentTntLocations, mainColor, secondaryColor) {
    for (const dimension of ['overworld', 'nether', 'the_end']) {
        parseDimensionTntLocations(player, dimension, tntLocations, currentTntLocations, mainColor, secondaryColor);
    }
}

function parseDimensionTntLocations(player, dimension, tntLocations, currentTntLocations, mainColor, secondaryColor) {
    const tntEntities = mc.world.getDimension(dimension).getEntities({ type: 'minecraft:tnt' });
    const dimensionSuffix = ('minecraft:' + dimension) !== player.dimension.id ? `, ${dimension}` : '';
    const precision = player.getDynamicProperty('tntlogPrecision');

    tntEntities.forEach(entity => {
        const entityId = entity.id
        const x = entity.location.x.toFixed(precision)
        const y = entity.location.y.toFixed(precision)
        const z = entity.location.z.toFixed(precision)

        const prevLocation = previousTntLocations[entityId]
        const xColor = prevLocation && prevLocation.x !== x ? secondaryColor : mainColor
        const yColor = prevLocation && prevLocation.y !== y ? secondaryColor : mainColor
        const zColor = prevLocation && prevLocation.z !== z ? secondaryColor : mainColor

        tntLocations.push(`[${xColor}${x}${mainColor}, ${yColor}${y}${mainColor}, ${zColor}${z}${mainColor}${dimensionSuffix}]`)

        currentTntLocations[entityId] = { x, y, z }
    })
}

function parseLog(tntLocations, mainColor, secondaryColor) {
    const absoluteTimeStr = (Data.getAbsoluteTime()-lastObsoleteTime).toString().padStart(2, '0');
    const totalTnt = tntLocations.length;

    return `${mainColor}======= ${totalTnt} tnt (tick: ${absoluteTimeStr.slice(0, -2)}${secondaryColor}${absoluteTimeStr.slice(-2)}${mainColor}) =======\n${mainColor}${tntLocations.join(', ')}`;
}
