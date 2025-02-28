 
import { world, ItemStack, DimensionTypes } from '@minecraft/server';

export function calcDistance(locationOne, locationTwo, useY = true) {
	const dx = locationOne.x - locationTwo.x;
	const dz = locationOne.z - locationTwo.z;
	if (!useY) return Math.sqrt(dx*dx + dz*dz);
	const dy = locationOne.y - locationTwo.y;
	return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

export function isString(str) {
	return typeof str === 'string' || str instanceof String;
}

export function isNumeric(str) {
	return !isNaN(Number(str)) && str !== null && typeof str !== 'boolean';
}

export function getClosestTarget(player, blockRayResult, entityRayResult) {
	let entity;
	let block;
	if (entityRayResult.length > 0) 
		entity = entityRayResult[0]?.entity;
	if (blockRayResult) 
		block = blockRayResult.block;
	if (!entity) 
		return block;
	if (!block) 
		return entity;
	const entityDist = calcDistance(player.getHeadLocation(), entity.location);
	const blockDist = calcDistance(player.getHeadLocation(), block.location);
	return entityDist <= blockDist ? entity : block;
}

export function parseName(target, includePrefix = true) {
	if (target.typeId.replace('minecraft:', '') === 'player') 
		return `§o${target.name}§r`;
	return includePrefix ? target.typeId : target.typeId.replace('minecraft:', '');
}

export function stringifyLocation(location, precision = 0) {
	if (precision < 0)
		throw new Error('Precision cannot be negative');
	return `[${location.x.toFixed(precision)}, ${location.y.toFixed(precision)}, ${location.z.toFixed(precision)}]`
}

export function populateItems(inventory) {
	const items = {};

	inventory = inventory.container;
	for (let i=0; i<inventory.size; i++) {
		try {
			const item = inventory.getSlot(i);
			
			const data = item.typeId.replace('minecraft:','');
			if (items[data]) items[data] += item.amount;
			else items[data] = item.amount;
		} catch {
			continue;
		}
	}

	return items;
}

export function getColorCode(color) {
	color = color.toLowerCase();
	switch (color) {
		case 'red': return '§c';
		case 'orange': return '§6';
		case 'yellow': return '§e';
		case 'lime': return '§a';
		case 'green': return '§2';
		case 'cyan': return '§3';
		case 'light_blue': return '§b';
		case 'blue': return '§9';
		case 'purple': return '§5';
		case 'pink': return '§d';
		case 'magenta': return '§d';
		case 'brown': return '§6';
		case 'black': return '§0';
		case 'white': return '§f';
		case 'light_gray': return '§7';
		case 'gray': return '§8';
		default: return '';
	}
}

export function wait(ms) {
	const startTime = Date.now();
	let endTime = Date.now();
	while (endTime - startTime < ms) 
		endTime = Date.now();
	
	return { startTime, endTime };
}

export function getInventory(block) {
	const container = block.getComponent('inventory')?.container;
	if (container === undefined) return {};
	const items = {};
	for (let i = 0; i < container.size; i++) {
		const itemStack = container.getItem(i);
		if (itemStack === undefined) continue;
		items[i] = { typeId: itemStack.type.id, amount: itemStack.amount };
	}
	return items;
}

export function restoreInventory(block, items) {
	const container = block.getComponent('inventory')?.container;
	if (container === undefined)
		return;
	for (let i = 0; i < container.size; i++) {
		const item = items[i];
		if (item === undefined)
			continue;
		container.getSlot(i).setItem(new ItemStack(item.typeId, item.amount));
	}
}

export function broadcastActionBar(message, sender) {
	let players;
	if (sender)
		players = world.getPlayers({ excludeNames: [sender.name] });
	else
		players = world.getAllPlayers();
	players.forEach(player => player?.onScreenDisplay.setActionBar(message));
}

export function locationInArea(area, position) {
	if (area?.dimensionId !== position?.dimensionId)
		return false;
	const { posOne, posTwo } = area;
	const { location } = position;
	const inX = location.x >= Math.min(posOne.x, posTwo.x) && location.x <= Math.max(posOne.x, posTwo.x);
	const inY = location.y >= Math.min(posOne.y, posTwo.y) && location.y <= Math.max(posOne.y, posTwo.y);
	const inZ = location.z >= Math.min(posOne.z, posTwo.z) && location.z <= Math.max(posOne.z, posTwo.z);
	return inX && inY && inZ;
}

export function getColoredDimensionName(dimensionId) {
	switch (dimensionId) {
		case 'minecraft:overworld':
		case 'overworld':
			return '§aOverworld';
		case 'minecraft:nether':
		case 'nether':
			return '§cNether';
		case 'minecraft:the_end':
		case 'the_end':
			return '§dEnd';
		default:
			return '§7Unknown';
	}
}

export function getScriptEventSourceName(event) {
	switch (event.sourceType) {
		case 'Block':
			if (event.sourceBlock.typeId.includes('command_block'))
				return '!';
			return event.sourceBlock.typeId;
		case 'Entity':
			if (event.sourceEntity.typeId === 'minecraft:player')
				return event.sourceEntity.name;
			return event.sourceEntity.typeId;
		case 'Server':
			return 'Server';
		default:
			return 'Unknown';
	}
}

export function getScriptEventSourceObject(event) {
	switch (event.sourceType) {
		case 'Block':
			return event.sourceBlock;
		case 'Entity':
			return event.sourceEntity;
		case 'Server':
			return 'Server';
		default:
			return 'Unknown';
	}
}

export function recolor(text, term, colorCode = '§f') {
	if (text === '' || term === '' || colorCode === '')
		return text;
	const lowerText = text.toLowerCase();
	const lowerTerm = term.toLowerCase();
	const index = lowerText.indexOf(lowerTerm);
	if (index === -1)
		return text;
	const splitText = lowerText.split(lowerTerm);
	let newText = '';
	let lastColorCode = '§f';
	let currentIndex = 0;

	for (let i = 0; i < splitText.length; i++) {
		const splice = splitText[i];
		const originalSplice = text.slice(currentIndex, currentIndex + splice.length);
		currentIndex += splice.length;

		if (i === splitText.length - 1) {
			newText += originalSplice;
			continue;
		}

		const colorCodeIndex = originalSplice.lastIndexOf('§');
		if (colorCodeIndex === -1) {
			newText += originalSplice + colorCode + text.slice(currentIndex, currentIndex + term.length) + lastColorCode;
		} else {
			lastColorCode = originalSplice.slice(colorCodeIndex, colorCodeIndex + 2);
			newText += originalSplice + colorCode + text.slice(currentIndex, currentIndex + term.length) + lastColorCode;
		}

		currentIndex += term.length;
	}

	return newText;
}

export function getEntitiesByType(type) {
	let entities = [];
	DimensionTypes.getAll().forEach(dimensionType => {
		const dimensionEntities = world.getDimension(dimensionType.typeId).getEntities({ type });
		if (dimensionEntities)
			entities = entities.concat(dimensionEntities);
	})
	return entities;
}

export function getRaycastResults(player, distance) {
	const blockRayResult = player.getBlockFromViewDirection({ includeLiquidBlocks: false, includePassableBlocks: true, maxDistance: distance });
	const entityRayResult = player.getEntitiesFromViewDirection({ ignoreBlockCollision: false, includeLiquidBlocks: false, includePassableBlocks: false, maxDistance: distance });
	return { blockRayResult, entityRayResult };
}

export function titleCase(str) {
	return str
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.toLowerCase()
		.replace(/_/g, ' ')
		.split(' ')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

export function formatColorStr(color) {
	return `${getColorCode(color)}${color}§r`;
}