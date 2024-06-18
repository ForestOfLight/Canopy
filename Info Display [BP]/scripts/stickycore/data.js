import * as mc from '@minecraft/server'
import MT from './src/mt.js'

class Data {
	// Private Properties
	static #dimension = mc.world.getDimension('overworld');
	
	// Cloned Methods
	static getDay = () => mc.world.getDay();
	static getTimeOfDay = () => mc.world.getTimeOfDay();
	static getMoonPhase = () => this.parseMoonPhase(mc.world.getMoonPhase());
	static getAbsoluteTime = () => mc.world.getAbsoluteTime();
	static getDefaultSpawnLocation = () => mc.world.getDefaultSpawnLocation();
	static getWeather = () => {
		return mc.system.run(() => this.#dimension.getWeather())
	};
	static getLookingAtBlock = (player) => player.getBlockFromViewDirection(
		{ includeLiquidBlocks: false, includePassableBlocks: true, maxDistance: 7 }
	);
	static getLookingAtEntities = (player) => player.getEntitiesFromViewDirection(
		{ ignoreBlockCollision: false, includeLiquidBlocks: false, includePassableBlocks: false, maxDistance: 7 }
	);
	
	// Chunk
	static Chunk = class {
		#baseX;
		#baseZ;
		
		constructor (x, z) {
			this.#baseX = x;
			this.#baseZ = z;
			this.minX = Math.floor(x / 16) * 16;
			this.minZ = Math.floor(z / 16) * 16;
			this.maxX = this.minX + 15;
			this.maxZ = this.minZ + 15;
			this.worldX = Math.floor(this.minX / 16);
			this.worldZ = Math.floor(this.minZ / 16);
			this.center = {
				x: this.minX + 7.5,
				z: this.minZ + 7.5
			}
		}
	}
	
	static isSlime(x, z) {
		const chunkX = Math.floor(x / 16) >>> 0;
		const chunkZ = Math.floor(z / 16) >>> 0;
		const seed = ((a, b) => {
			let a00 = a & 0xffff;
			let a16 = a >>> 16;
			let b00 = b & 0xffff;
			let b16 = b >>> 16;
			let c00 = a00 * b00;
			let c16 = c00 >>> 16; 
			
			c16 += a16 * b00;
			c16 &= 0xffff;
			c16 += a00 * b16; 
			
			let lo = c00 & 0xffff;
			let hi = c16 & 0xffff; 
			
			return((hi << 16) | lo) >>> 0;
		})(chunkX, 0x1f1f1f1f) ^ chunkZ;
	
		const mt = new MT(seed);
		const n = mt.nextInt();
		const isSlime = (n % 10 == 0);
		
		return(isSlime);
	}

	static getPlayerDirection(player) {
		const { x, z } = player.getViewDirection();
		const angle = Math.atan2(z, x) * (180 / Math.PI);
	
		if (angle >= -45 && angle < 45) return 'E (+x)'
		else if (angle >= 45 && angle < 135) return 'S (+z)';
		else if (angle >= 135 || angle < -135) return 'W (-x)';
		else return 'N (-z)';
	}

	static parseLookingAtBlock(lookingAtBlock) {
		let block;
		let blockName = '';
		let raycastHitFace;
		let blockLocation;

		block = lookingAtBlock?.block ?? undefined;
		if (block) {
			const raycastHitFace = lookingAtBlock.face;
			const blockLocation = block.location;
			try {
				blockName = `§a${block.typeId}`;
			} catch (error) {
				if (error.message.includes('loaded')) {
					blockName = '§cUnloaded (' + block.location.x + ' ' + block.location.y + ' ' + block.location.z + ')';
				} else if (error.message.includes('undefined')) {
					blockName = '§7Undefined';
				}
			}
		}
		if (blockName === `§aminecraft:redstone_wire`) { blockName += `§7: §c` + block.permutation.getState('redstone_signal'); }

		return { LookingAtName: blockName, LookingAtFace: raycastHitFace, LookingAtLocation: blockLocation, LookingAtBlock: block };
	}

	static parseLookingAtEntity(lookingAtEntities) {
		let entity;
		let entityName;

		entity = lookingAtEntities[0]?.entity ?? undefined;
		if (entity) {
			try {
				entityName = `§a${entity.typeId}`;

				if (entity.typeId === 'minecraft:player') {
					entityName = `§a§o${entity.name}§r`;
				}
			} catch (error) {
				if (error.message.includes('loaded')) {
					entityName = '§cUnloaded (' + entity.location.x + ' ' + entity.location.y + ' ' + entity.location.z + ')';
				} else if (error.message.includes('undefined')) {
					entityName = '§7Undefined';
				}
			}
		}

		return { LookingAtName: entityName, LookingAtEntity: entity }
	}

	static parseMoonPhase(moonPhase) {
		switch (moonPhase) {
			case 0: return 'Full';
			case 1: return 'Waning Gibbous';
			case 2: return 'First Quarter';
			case 3: return 'Waning Crescent';
			case 4: return 'New';
			case 5: return 'Waxing Crescent';
			case 6: return 'Last Quarter';
			case 7: return 'Waxing Gibbous';
			default: return 'unknown';
		}
	}

	static peekInventory(LookingAtBlock, LookingAtEntities) {
		let entity;
		let block;
		let inv;
		let items = {};

		if (!LookingAtBlock && !LookingAtEntities) {
			return '';
		} else if (LookingAtEntities) {
			entity = LookingAtEntities[0]?.entity;
		} 
		if (LookingAtBlock) {
			block = LookingAtBlock.block;
		}
	
		try {
			if (entity) inv = entity.getComponent('inventory');
        	else inv = block.getComponent('inventory');
		} catch(error) {
			return '';
		}
		if (!inv) return '';
		
		inv = inv.container;
		for (let i=0; i<inv.size; i++) {
			try {
				const item = inv.getSlot(i);
				
				let data = item.typeId.replace('minecraft:','');
				if (items[data]) items[data] += item.amount;
				else items[data] = item.amount;
			} catch {}
		}
	
		let output = '';
		if (Object.keys(items).length > 0)
			for (let i in items) output += `\n§r${i}: ${items[i]}`;
		else output = '\n§rEmpty';
				
		return output;
	}
}

export default Data;