import { Command } from 'lib/canopy/Canopy';
import Data from 'stickycore/data';
import Utils from 'stickycore/utils';

const MAX_DISTANCE = 6*16;
const currentQuery = {};

new Command({
    name: 'peek',
    description: { translate: 'commands.peek.description' },
    usage: 'peek [query]',
    args: [
        { type: 'string', name: 'itemQuery' }
    ],
    callback: peekCommand
})

function peekCommand(sender, args) {
    let { itemQuery } = args;
    let blockRayResult;
    let entityRayResult;
    let target;
    let inventory;
    let items = {};
    let targetName;

    updateQueryMap(sender, itemQuery);
    ({blockRayResult, entityRayResult} = Data.getRaycastResults(sender, MAX_DISTANCE));
    if (!blockRayResult && !entityRayResult[0])
        return sender.sendMessage({ translate: 'generic.target.notfound' });
    target = Utils.getClosestTarget(sender, blockRayResult, entityRayResult);
    targetName = Utils.parseName(target);
    try {
        inventory = target.getComponent('inventory');
    } catch(error) {
        return sender.sendMessage({ translate: 'commands.peek.fail.unloaded', with: [Utils.stringifyLocation(target.location, 0)] });
    }
    if (!inventory)
        return sender.sendMessage({ translate: 'commands.peek.fail.noinventory', with: [targetName, Utils.stringifyLocation(target.location, 0)] });

    items = Utils.populateItems(inventory);
    sender.sendMessage(formatOutput(targetName, target.location, items, itemQuery));
}

function formatOutput(targetName, targetLocation, items, itemQuery) {
    if (Object.keys(items).length === 0)
        return { translate: 'commands.peek.fail.noitems', with: [targetName, Utils.stringifyLocation(targetLocation, 0)] };

    let output = '§g-------------\n';
    output += `§l§e${targetName}§r: ${Utils.stringifyLocation(targetLocation, 0)}`;
    for (let itemName in items) {
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
        return sender.sendMessage({ translate: 'commands.peek.query.cleared' });
    } else {
        currentQuery[sender.name] = itemQuery;
        sender.sendMessage({ translate: 'commands.peek.query.set', with: [itemQuery] });
    }
}

export { currentQuery };
