import Command from 'stickycore/command'
import Utils from 'stickycore/utils'
import Data from 'stickycore/data'

const MAX_DISTANCE = 64*16;

new Command()
    .setName('distance')
    .setCallback(distanceCommand)
    .build()

new Command()
    .setName('d')
    .setCallback(distanceCommand)
    .build()

function distanceCommand(sender, args) {
    let target;
    let targetLocation;
    let distance;
    
    let { decimalPlaces } = args; // can't be implemented with current command system
    if (!decimalPlaces) decimalPlaces = 3;
    else decimalPlaces = Math.max(0, Math.min(decimalPlaces, 15));

    const { blockRayResult, entityRayResult } = Data.getRaycastResults(sender, MAX_DISTANCE);
    if (!blockRayResult && !entityRayResult[0]) return sender.sendMessage('§cNo block or entity found to calculate distance from.');
    target = Utils.getClosestTarget(sender, blockRayResult, entityRayResult);

    try {
        targetLocation = target.location;
    } catch(error) {
        return sender.sendMessage('§cUnable to get block or entity location.');
    }

    distance = Utils.calcDistance(sender.location, targetLocation).toFixed(decimalPlaces);
    sender.sendMessage(`§7${distance} blocks.`);
}