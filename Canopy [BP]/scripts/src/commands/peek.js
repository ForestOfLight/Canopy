import Command from 'stickycore/command'
import Data from 'stickycore/data'
import Utils from 'stickycore/utils'

const MAX_DISTANCE = 6*16;

new Command()
    .setName('peek')
    .setCallback(peekCommand)
    .build();

new Command()
    .setName('p')
    .setCallback(peekCommand)
    .build();

function peekCommand(sender) {
    let blockRayResult;
    let entityRayResult;
    let target;
    let inventory;
    let items = {};
    let targetName;
    let output;

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
    output = formatOutput(targetName, target.location, items);
    sender.sendMessage(output);
}

function formatOutput(targetName, targetLocation, items) {
    let output = '';
    
    output += '§g-------------\n';
    output += `§l§e${targetName}§r: ${Utils.stringifyLocation(targetLocation, 0)}`;
    if (Object.keys(items).length === 0) output += '\n§eEmpty';
    else for (let item in items) output += `\n§e${item}§r: ${items[item]}`;
    output += '\n§g-------------';

    return output;
}