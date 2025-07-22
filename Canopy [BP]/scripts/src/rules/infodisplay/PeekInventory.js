import { InfoDisplayElement } from "./InfoDisplayElement";
import { getRaycastResults, getClosestTarget } from "../../../include/utils";
import { currentQuery } from "../../commands/peek";
import { ItemStack } from "@minecraft/server";

class PeekInventory extends InfoDisplayElement {
    player;

    constructor(player, displayLine) {
		const ruleData = { identifier: 'peekInventory', 
			description: { translate: 'rules.infoDisplay.peekInventory' }, 
			contingentRules: ['lookingAt'], 
			globalContingentRules: ['allowPeekInventory'] 
		};
        super(ruleData, displayLine, false);
        this.player = player;
    }

    getFormattedDataOwnLine() {
        return this.parsePeekInventory() || { text: '' };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }

    parsePeekInventory() {
        const { blockRayResult, entityRayResult } = getRaycastResults(this.player, 7);
		if (!blockRayResult && !entityRayResult)
			return;
		const target = getClosestTarget(this.player, blockRayResult, entityRayResult);
		if (!target)
			return;
        let container;
		try {
			container = target.getComponent('inventory')?.container;
			if (!container)
				return;
		} catch {
			return;
		}
		const itemCounts = this.countItems(container);
		return this.formatCountedItems(itemCounts);
	}

	countItems(container) {
		const items = {};
		for (let i = 0; i < container.size; i++) {
			try {
				const itemStack = container.getItem(i);
				const itemType = itemStack.typeId;
				if (items[itemType])
					items[itemType] += itemStack.amount;
				else
					items[itemType] = itemStack.amount;
			} catch {
				continue;
			}
		}
		return items;
	}

	formatCountedItems(itemCounts) {
		const output = { rawtext: [{ text: `§r` }] };
		if (Object.keys(itemCounts).length > 0) {
			for (const itemType in itemCounts) {
				if (this.includesQuery(itemType, currentQuery[this.player.name]))
					output.rawtext.push({ text: `§c` });
				else
					output.rawtext.push({ text: `§r` });
				output.rawtext.push({ translate: new ItemStack(itemType).localizationKey });
				output.rawtext.push({ text: `: ${itemCounts[itemType]}\n` });
			}
		} else {
			output.rawtext.push({ translate: 'rules.infoDisplay.peekInventory.empty' });
		}
		return output;
	}

	includesQuery(itemType, query) {
		return itemType?.replace('minecraft:', '').toLowerCase().includes(query?.toLowerCase());
	}
}

export { PeekInventory };