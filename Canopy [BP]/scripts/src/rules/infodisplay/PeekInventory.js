import InfoDisplayElement from "./InfoDisplayElement";
import { getRaycastResults, getClosestTarget, populateItems } from "../../../include/utils";
import { currentQuery } from "../../commands/peek";

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
        const { blockRayResult, entityRayResult } = getRaycastResults(this.player, 7);
		if (!blockRayResult && !entityRayResult) return '';
		const target = getClosestTarget(this.player, blockRayResult, entityRayResult);
		if (!target) return '';
		
        let inventory;
		try {
			inventory = target.getComponent('inventory');
		} catch {
			return '';
		}
		if (!inventory) return '';
	
		let output = '';
		const items = populateItems(inventory);
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