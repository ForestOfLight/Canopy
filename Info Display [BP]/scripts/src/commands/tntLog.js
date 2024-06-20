import Command from 'stickycore/command'
import * as mc from '@minecraft/server'
import Data from 'stickycore/data'
import Utils from 'stickycore/utils'

new Command()
    .setName('tntLog')
    .addArgument('string', 'value')
    .setCallback(tntLogCommand)
    .build()

function tntLogCommand(sender, args) {
    let { value } = args;
    let boolValue;
    boolValue = value === 'on' ? true : value === 'off' ? false : boolValue;
    if (sender.getDynamicProperty('tntLogPrecision') === undefined) sender.setDynamicProperty('tntLogPrecision', 2);

    if (Utils.isNumeric(value))
        return setLogPrecsion(sender, value);
    else if (value !== 'on' && value !== 'off')
        return sender.sendMessage('§cInvalid argument. Please use on or off or a precision value between 0 and 15.');

    sender.setDynamicProperty('tntLog', value);
    sender.sendMessage(`§7TNT logging has been turned ${value}.`);
}

function setLogPrecsion(sender, value) {
    const precision = Math.max(0, Math.min(parseInt(value, 10), 15));
    sender.setDynamicProperty('tntLogPrecision', precision);
    sender.sendMessage(`§7TNT logging precision set to ${precision}.`);
}

mc.system.runInterval(() => {
	const Players = mc.world.getAllPlayers();
	for (const player of Players) {
		if (player.getDynamicProperty('tntLog')) tntLog(player);
	}
});

let previousTntLocations = {};

function tntLog(player) {
    let count = 0;
    let tntLocations = [];
    const absoluteTimeStr = Data.getAbsoluteTime().toString();
    let currentTntLocations = {};
    let mainColor = '§9';
    let secondaryColor = '§b';

    for (const dimension of ['overworld', 'nether', 'the_end']) {
        const tntEntities = mc.world.getDimension(dimension).getEntities({ type: 'minecraft:tnt' });
        count += tntEntities.length;
        const precision = player.getDynamicProperty('tntLogPrecision');
        const dimensionSuffix = 'minecraft:' + dimension !== player.dimension.id ? `, ${dimension}` : '';

        tntEntities.forEach(entity => {
            const entityId = entity.id;
            const x = entity.location.x.toFixed(precision);
            const y = entity.location.y.toFixed(precision);
            const z = entity.location.z.toFixed(precision);
            const locationKey = `${x},${y},${z}`;

            const prevLocation = previousTntLocations[entityId];
            const xColor = prevLocation && prevLocation.x !== x ? secondaryColor : mainColor;
            const yColor = prevLocation && prevLocation.y !== y ? secondaryColor : mainColor;
            const zColor = prevLocation && prevLocation.z !== z ? secondaryColor : mainColor;

            tntLocations.push(`[${xColor}${x}${mainColor}, ${yColor}${y}${mainColor}, ${zColor}${z}${mainColor}${dimensionSuffix}]`);

            currentTntLocations[entityId] = { x, y, z, locationKey };
        });
    }

    if (count === 0) return;
    previousTntLocations = currentTntLocations;
    player.sendMessage(`${mainColor}======= ${count} tnt (tick: ${absoluteTimeStr.slice(0, -2)}${secondaryColor}${absoluteTimeStr.slice(-2)}${mainColor}) =======\n${mainColor}${tntLocations.join(', ')}`);
}
