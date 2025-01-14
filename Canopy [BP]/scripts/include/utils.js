import { world, ItemStack, DimensionTypes } from '@minecraft/server';

class Utils {
    static calcDistance(locationOne, locationTwo, useY = true) {
		const x = locationOne.x - locationTwo.x;
		const z = locationOne.z - locationTwo.z;
		if (!useY) return Math.sqrt(x*x + z*z);
		const y = locationOne.y - locationTwo.y;
		return Math.sqrt(x*x + y*y + z*z);
	}

	static isString(str) {
		return typeof str === 'string' || str instanceof String;
	}

    static isNumeric(str) {
        return !isNaN(Number(str)) && isFinite(str);
    }

	static parseLookingAtBlock(lookingAtBlock) {
		let block;
		let blockName = '';
		let raycastHitFace;

		block = lookingAtBlock?.block ?? undefined;
		if (block) {
			raycastHitFace = lookingAtBlock.face;
			try {
				blockName = `§a${Utils.parseName(block)}`;
			} catch (error) {
				if (error.message.includes('loaded')) {
					blockName = `§c${Utils.stringifyLocation(block.location, 0)} Unloaded`;
				} else if (error.message.includes('undefined')) {
					blockName = '§7Undefined';
				}
			}
		}

		return { LookingAtName: blockName, LookingAtFace: raycastHitFace, LookingAtLocation: block?.location, LookingAtBlock: block };
	}

	static parseLookingAtEntity(lookingAtEntities) {
		let entityName;

		const entity = lookingAtEntities[0]?.entity ?? undefined;
		if (entity) {
			try {
				entityName = `§a${Utils.parseName(entity)}`;

				if (entity.typeId === 'minecraft:player') {
					entityName = `§a§o${entity.name}§r`;
				}
			} catch (error) {
				if (error.message.includes('loaded')) {
					entityName = `§c${Utils.stringifyLocation(entity.location, 0)} Unloaded`;
				} else if (error.message.includes('undefined')) {
					entityName = '§7Undefined';
				}
			}
		}

		return { LookingAtName: entityName, LookingAtEntity: entity }
	}

	static getClosestTarget(player, blockRayResult, entityRayResult) {
		let entity;
		let block;
		let entityDist;
		let blockDist;
		
		if (entityRayResult.length > 0) entity = entityRayResult[0]?.entity;
		if (blockRayResult) block = blockRayResult.block;
		if (!entity) return block;
		if (!block) return entity;
		entityDist = Utils.calcDistance(player.getHeadLocation(), entity.location);
		blockDist = Utils.calcDistance(player.getHeadLocation(), block.location);
	
		return entityDist < blockDist ? entity : block;
	}

	static parseName(target, includePrefix = true) {
		return target.typeId.replace('minecraft:', '') === 'player' ? `§o${target.name}§r` : (includePrefix ? target.typeId : target.typeId.replace('minecraft:', ''));
	}

	static stringifyLocation(location, precision = 0) {
		return `[${location.x.toFixed(precision)}, ${location.y.toFixed(precision)}, ${location.z.toFixed(precision)}]`
	}

	static populateItems(inventory) {
		let items = {};
	
		inventory = inventory.container;
		for (let i=0; i<inventory.size; i++) {
			try {
				const item = inventory.getSlot(i);
				
				let data = item.typeId.replace('minecraft:','');
				if (items[data]) items[data] += item.amount;
				else items[data] = item.amount;
			} catch {}
		}
	
		return items;
	}

	static getColorCode(color) {
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

	static wait(ms) {
		let startTime = Date.now();
		let endTime = Date.now();
		while (endTime - startTime < ms) {
			endTime = Date.now();
		}
		return { startTime, endTime };
	}

	static calculatePerTime(totalCount, deltaTime, mode = 'countMode') {
		const ticksPerHour = 72000;
		let itemsPerHour = totalCount / (deltaTime / ticksPerHour);
		let unit = 'h';
		if (mode === 'perminuteMode') {
			itemsPerHour /= 60;
			unit = 'm';
		}
		if (mode === 'persecondMode') {
			itemsPerHour /= 3600;
			unit = 's';
		}
		if (itemsPerHour == NaN || itemsPerHour == Infinity) return '?/?';
		return `${itemsPerHour.toFixed(1)}/${unit}`;
	}

	static getInventory(block) {
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

    static restoreInventory(block, items) {
        const container = block.getComponent('inventory')?.container;
        if (container === undefined) return;
		for (let i = 0; i < container.size; i++) {
			const item = items[i];
			if (item === undefined) continue;
			container.getSlot(i).setItem(new ItemStack(item.typeId, item.amount));
		}
    }

	static broadcastActionBar(message, sender) {
		let players;
		if (sender) players = world.getPlayers({ excludeNames: [sender.name] });
		else players = world.getAllPlayers();
		players.forEach(player => player?.onScreenDisplay.setActionBar(message));
	}

	static locationInArea(area, position) {
		if (area?.dimensionId !== position.dimensionId) return false;
		const { posOne, posTwo } = area;
		const { location } = position;
		const inX = location.x >= Math.min(posOne.x, posTwo.x) && location.x <= Math.max(posOne.x, posTwo.x);
		const inY = location.y >= Math.min(posOne.y, posTwo.y) && location.y <= Math.max(posOne.y, posTwo.y);
		const inZ = location.z >= Math.min(posOne.z, posTwo.z) && location.z <= Math.max(posOne.z, posTwo.z);
		return inX && inY && inZ;
	}

	static getColoredDimensionName(dimensionId) {
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

	static getScriptEventSourceName(event) {
		switch (event.sourceType) {
			case 'Block':
				if (event.sourceBlock.typeId.includes('command_block'))
					return '!';
				return event.sourceBlock.typeId;
			case 'Entity':
				if (event.sourceEntity.typeId === 'minecraft:player')
					return event.sourceEntity.name;
				else 
					return event.sourceEntity.typeId;
			case 'Server':
				return 'Server';
			default:
				return 'Unknown';
		}
	}

	static recolor(text, term, colorCode = '§f') {
		const lowerText = text.toLowerCase();
		const lowerTerm = term.toLowerCase();
		const index = lowerText.indexOf(lowerTerm);
		if (index === -1) return text;
		const splitText = lowerText.split(lowerTerm);
		let newText = '';
		let lastColorCode = '';
		let currentIndex = 0;
	
		for (let i = 0; i < splitText.length; i++) {
			let splice = splitText[i];
			let originalSplice = text.slice(currentIndex, currentIndex + splice.length);
			currentIndex += splice.length;
	
			if (i === splitText.length - 1) {
				newText += originalSplice;
				continue;
			}
	
			let colorCodeIndex = originalSplice.lastIndexOf('§');
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

	static getEntitiesByType(type) {
		let entities = [];
		DimensionTypes.getAll().forEach(dimensionType => {
			const dimensionEntities = world.getDimension(dimensionType.typeId).getEntities({ type });
			if (dimensionEntities)
				entities = entities.concat(dimensionEntities);
		})
		return entities;
	}

	static getRaycastResults(player, distance) {
		let blockRayResult;
		let entityRayResult;
	
		blockRayResult = player.getBlockFromViewDirection({ includeLiquidBlocks: false, includePassableBlocks: true, maxDistance: distance });
		entityRayResult = player.getEntitiesFromViewDirection({ ignoreBlockCollision: false, includeLiquidBlocks: false, includePassableBlocks: false, maxDistance: distance });
	
		return { blockRayResult, entityRayResult };
	}
}

export default Utils;