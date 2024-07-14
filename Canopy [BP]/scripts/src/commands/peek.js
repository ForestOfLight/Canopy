import Command from 'stickycore/command'
import Data from 'stickycore/data'
import Utils from 'stickycore/utils'

const MAX_DISTANCE = 6*16;
const currentQuery = {};

new Command()
    .setName('peek')
    .setCallback(peekCommand)
    .addArgument('string', 'itemQuery')
    .build();

new Command()
    .setName('p')
    .setCallback(peekCommand)
    .addArgument('string', 'itemQuery')
    .build();

function peekCommand(sender, args) {
    let { itemQuery } = args;
    let blockRayResult;
    let entityRayResult;
    let target;
    let inventory;
    let items = {};
    let targetName;
    let output;

    updateQueryMap(sender, itemQuery);
    ({blockRayResult, entityRayResult} = Data.getRaycastResults(sender, MAX_DISTANCE));
    if (!blockRayResult && !entityRayResult[0]) return sender.sendMessage('§cNo target found.');
    target = Utils.getClosestTarget(sender, blockRayResult, entityRayResult);
    targetName = Utils.parseName(target);
    try {
        inventory = target.getComponent('inventory');
    } catch(error) {
        return sender.sendMessage(`§cTarget at ${Utils.stringifyLocation(target.location, 0)} is unloaded.`);
    }
    if (!inventory) return sender.sendMessage(`§cNo inventory found in ${targetName} at ${Utils.stringifyLocation(target.location, 0)}.`);

    items = Utils.populateItems(inventory);
    output = formatOutput(targetName, target.location, items, itemQuery);
    sender.sendMessage(output);
}

function formatOutput(targetName, targetLocation, items, itemQuery) {
    let output = '';
    
    output += '§g-------------\n';
    output += `§l§e${targetName}§r: ${Utils.stringifyLocation(targetLocation, 0)}`;
    if (Object.keys(items).length === 0) output += '\n§eEmpty';
    else for (let itemName in items) {
        if (itemQuery && itemName.includes(itemQuery))
            output += `\n§c${itemName}§r: ${items[itemName]}`;
        else
            output += `\n§e${itemName}§r: ${items[itemName]}`;
    }
    output += '\n§g-------------';

    return output;
}

function updateQueryMap(sender, itemQuery) {
    const oldQuery = currentQuery[sender.name];
    if ([null, undefined].includes(oldQuery) && itemQuery === null) return;
    else if (itemQuery === null && ![null, undefined].includes(oldQuery)) {
        currentQuery[sender.name] = null;
        return sender.sendMessage('§7Peek query cleared.');
    } else {
        currentQuery[sender.name] = itemQuery;
        sender.sendMessage(`§7Peek query set to "${itemQuery}".`);
    }
}

export { currentQuery };
