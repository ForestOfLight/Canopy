import InfoDisplayElement from './InfoDisplayElement.js';

class PeekInventory extends InfoDisplayElement {
    player;

    constructor(player) {
        this.player = player;
        super('peekInventory', { translate: 'rules.infoDisplay.peekInventory' }, 11, false, ['lookingAt']);
    }

    getFormattedDataOwnLine() {
        return { text: `${this.parsePeekInventory()}` };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }

    parsePeekInventory() {
        let ({ blockRayResult, entityRayResult } = Utils.getRaycastResults(this.player, 7));
		if (!blockRayResult && !entityRayResult) return '';
		const target = Utils.getClosestTarget(this.player, blockRayResult, entityRayResult);
		if (!target) return '';
		
        let inventory;
		try {
			inventory = target.getComponent('inventory');
		} catch(error) {
			return '';
		}
		if (!inventory) return '';
	
		let output = '';
		const items = Utils.populateItems(inventory, items);
		if (Object.keys(items).length > 0) {
			for (let itemName in items) {
				if (itemName.includes(currentQuery[this.player.name]))
					output += `\n§c${itemName}: ${items[itemName]}`;
				else
					output += `\n§r${itemName}: ${items[itemName]}`;
			}
		} else output = '\n§rEmpty';
				
		return output;
	}
}

export default PeekInventory;