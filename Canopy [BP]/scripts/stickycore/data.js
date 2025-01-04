import * as mc from '@minecraft/server'
import MT from 'lib/mt.js'
import Utils from 'stickycore/utils'
import { currentQuery } from 'src/commands/peek'

class Data {

	static getMoonPhase = () => this.parseMoonPhase(mc.world.getMoonPhase());
	
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

	static peekInventory(sender, blockRayResult, entityRayResult) {
		let target;
		let inventory;
		let items = {};
		let output;

		if (!blockRayResult && !entityRayResult) return '';
		target = Utils.getClosestTarget(sender, blockRayResult, entityRayResult);
		if (!target) return '';
		try {
			inventory = target.getComponent('inventory');
		} catch(error) {
			return '';
		}
		if (!inventory) return '';
	
		output = '';
		items = Utils.populateItems(inventory, items);
		if (Object.keys(items).length > 0) {
			for (let itemName in items) {
				if (itemName.includes(currentQuery[sender.name]))
					output += `\n§c${itemName}: ${items[itemName]}`;
				else
					output += `\n§r${itemName}: ${items[itemName]}`;
			}
		} else output = '\n§rEmpty';
				
		return output;
	}

	static updateJoinDate(player) {
		player.setDynamicProperty('joinDate', Date.now());
	}

	static getSessionTime(player) {
		const joinDate = player.getDynamicProperty('joinDate');
		if (!joinDate) return '?:?';
		const sessionTime = (Date.now() - joinDate) / 1000;
		const hours = Math.floor(sessionTime / 3600);
		const minutes = Math.floor((sessionTime % 3600) / 60);
		const seconds = Math.floor(sessionTime % 60);
		let output = '';
		if (hours > 0) output += `${hours}:`;
		output += `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
		return output;
	}
}

export default Data;