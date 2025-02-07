import InfoDisplayElement from './InfoDisplayElement.js';
import Utils from 'include/utils';
import { currentQuery } from 'src/commands/peek.js';

class PeekInventory extends InfoDisplayElement {
    player;

    constructor(player, displayLine) {
		const ruleData = { identifier: 'peekInventory', description: { translate: 'rules.infoDisplay.peekInventory', contingentRules: ['lookingAt'] } };
        super(ruleData, displayLine, false);
        this.player = player;
    }

    getFormattedDataOwnLine() {
        return { text: `${this.parsePeekInventory()}` };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }

    parsePeekInventory() {
        const { blockRayResult, entityRayResult } = Utils.getRaycastResults(this.player, 7);
		if (!blockRayResult && !entityRayResult) return '';
		const target = Utils.getClosestTarget(this.player, blockRayResult, entityRayResult);
		if (!target) return '';
		
        let inventory;
		try {
			inventory = target.getComponent('inventory');
		} catch {
			return '';
		}
		if (!inventory) return '';
	
		let output = '';
		const items = Utils.populateItems(inventory);
		if (Object.keys(items).length > 0) {
			for (const itemName in items) {
				if (itemName.includes(currentQuery[this.player.name]))
					output += `§c${itemName}: ${items[itemName]}\n`;
				else
					output += `§r${itemName}: ${items[itemName]}\n`;
			}
		} else {output = '§rEmpty';}
				
		return output;
	}
}

export default PeekInventory;