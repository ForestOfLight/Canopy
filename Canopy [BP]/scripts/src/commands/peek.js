import { Command } from "../../lib/canopy/Canopy";
import { populateItems, getRaycastResults, getClosestTarget, parseName, stringifyLocation } from "../../include/utils";

const MAX_DISTANCE = 6*16;
const currentQuery = {};

new Command({
    name: 'peek',
    description: { translate: 'commands.peek' },
    usage: 'peek [query]',
    args: [
        { type: 'string', name: 'itemQuery' }
    ],
    callback: peekCommand
})

function peekCommand(sender, args) {
    const { itemQuery } = args;
    
    updateQueryMap(sender, itemQuery);
    const target = getTarget(sender);
    if (!target) return;
    const inventory = getInventory(sender, target);
    if (!inventory) return;
    const items = populateItems(inventory);
    sender.sendMessage(formatOutput(target, items, itemQuery));
}

function updateQueryMap(sender, itemQuery) {
    const oldQuery = currentQuery[sender.name];
    if ([null, undefined].includes(oldQuery) && itemQuery === null) {return;}
    else if (itemQuery === null && ![null, undefined].includes(oldQuery)) {
        currentQuery[sender.name] = null;
        return sender.sendMessage({ translate: 'commands.peek.query.cleared' });
    } 
        currentQuery[sender.name] = itemQuery;
        sender.sendMessage({ translate: 'commands.peek.query.set', with: [itemQuery] });   
}

function getTarget(sender) {
    const {blockRayResult, entityRayResult} = getRaycastResults(sender, MAX_DISTANCE);
    if (!blockRayResult && !entityRayResult[0])
        return sender.sendMessage({ translate: 'generic.target.notfound' });
    const targetEntity = getClosestTarget(sender, blockRayResult, entityRayResult);
    const targetData = {
        name: parseName(targetEntity),
        entity: targetEntity,
    };
    return targetData;
}

function getInventory(sender, target) {
    let inventory;
    try {
        inventory = target.entity.getComponent('inventory');
    } catch {
        return sender.sendMessage({ translate: 'commands.peek.fail.unloaded', with: [stringifyLocation(target.entity.location, 0)] });
    }
    if (!inventory)
        return sender.sendMessage({ translate: 'commands.peek.fail.noinventory', with: [target.name, stringifyLocation(target.entity.location, 0)] });
    return inventory;
}

function formatOutput(target, items, itemQuery) {
    if (Object.keys(items).length === 0)
        return { translate: 'commands.peek.fail.noitems', with: [target.name, stringifyLocation(target.entity.location, 0)] };

    let output = '§g-------------\n';
    output += `§l§e${target.name}§r: ${stringifyLocation(target.entity.location, 0)}`;
    for (const itemName in items) {
        if (itemQuery && itemName.includes(itemQuery))
            output += `\n§c${itemName}§r: ${items[itemName]}`;
        else
            output += `\n§e${itemName}§r: ${items[itemName]}`;
    }
    output += '\n§g-------------';
    return output;
}

export { currentQuery };
