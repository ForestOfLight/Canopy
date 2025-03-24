import { Command } from "../../lib/canopy/Canopy";
import { getRaycastResults, getClosestTarget, stringifyLocation } from "../../include/utils";
import { InventoryUI } from "../classes/InventoryUI";

const MAX_DISTANCE = 6*16;
const currentQuery = {};

new Command({
    name: 'peek',
    description: { translate: 'commands.peek' },
    usage: 'peek [query]',
    args: [
        { type: 'string', name: 'itemQuery' }
    ],
    contingentRules: ['allowPeekInventory'],
    callback: peekCommand
});

function peekCommand(sender, args) {
    const { itemQuery } = args;
    
    updateQueryMap(sender, itemQuery);
    const target = getTarget(sender);
    if (!target) return;

    const invUI = new InventoryUI(target);
    showUI(sender, target, invUI);
}

function updateQueryMap(sender, itemQuery) {
    const oldQuery = currentQuery[sender.name];
    if ([null, undefined].includes(oldQuery) && itemQuery === null)
        return;
    if (itemQuery === null && ![null, undefined].includes(oldQuery)) {
        currentQuery[sender.name] = null;
        sender.sendMessage({ translate: 'commands.peek.query.cleared' });
        return;
    } 
    currentQuery[sender.name] = itemQuery;
    sender.sendMessage({ translate: 'commands.peek.query.set', with: [itemQuery] });   
}

function getTarget(sender) {
    const {blockRayResult, entityRayResult} = getRaycastResults(sender, MAX_DISTANCE);
    if (!blockRayResult && !entityRayResult[0])
        return sender.sendMessage({ translate: 'generic.target.notfound' });
    return getClosestTarget(sender, blockRayResult, entityRayResult);
}

function showUI(sender, target, invUI) {
    try {
        invUI.show(sender);
    } catch (error) {
        if (error.message.includes('entity may be unloaded or removed'))
            sender.sendMessage({ translate: 'commands.peek.fail.unloaded', with: [stringifyLocation(target.entity.location, 0)] });
        else if (error.message.includes('no inventory component found'))
            sender.sendMessage({ translate: 'commands.peek.fail.noinventory', with: [target.name, stringifyLocation(target.entity.location, 0)] });
        else
            new Error(`[Canopy] Error showing inventory UI:`, { cause: error });
    }
}

export { currentQuery };
