import Command from 'stickycore/command'
import Utils from 'stickycore/utils'

new Command()
    .setName('distance')
    .setCallback(distanceCommand)
    .build()

function distanceCommand(sender, args) {
    let { decimalPlaces } = args;
    if (!decimalPlaces) decimalPlaces = 3;
    else decimalPlaces = Math.max(0, Math.min(decimalPlaces, 15));

    let lookingAtBlock = sender.getBlockFromViewDirection({ includeLiquidBlocks: false, includePassableBlocks: true, maxDistance: 64*16 });
    let lookingAtEntities = sender.getEntitiesFromViewDirection({ includePlayers: false, maxDistance: 64*16 });
    
    let entity;
    let block;
    if (!lookingAtBlock && !lookingAtEntities) {
        sender.sendMessage('§cNo block or entity found to calculate distance from.');
        return;
    } else if (lookingAtEntities.length > 0) {
        entity = lookingAtEntities[0]?.entity;
    } else if (lookingAtBlock) {
        block = lookingAtBlock.block;
    }

    let lookingAtLocation;
    try {
        if (entity) lookingAtLocation = entity.location;
        else lookingAtLocation = block.location;
    } catch(error) {
        sender.sendMessage('§cUnable to get block or entity location.');
        return;
    }

    const playerLocation = sender.location;
    const distance = Utils.calcDistance(playerLocation, lookingAtLocation).toFixed(decimalPlaces);
    sender.sendMessage(`§7${distance} blocks.`);
}