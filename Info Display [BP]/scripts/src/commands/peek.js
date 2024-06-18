import Command from 'stickycore/command'
import Data from 'stickycore/data'

new Command()
    .setName('peek')
    .setCallback(peekCommand)
    .build();

new Command()
    .setName('p')
    .setCallback(peekCommand)
    .build();

function peekCommand(sender) {
    let lookingAtBlock = sender.getBlockFromViewDirection(
		{ includeLiquidBlocks: false, includePassableBlocks: true, maxDistance: 6*16 }
	);
	let lookingAtEntities = sender.getEntitiesFromViewDirection(
		{ ignoreBlockCollision: false, includeLiquidBlocks: false, includePassableBlocks: false, maxDistance: 6*16 }
	);

    let entity;
    let block;
    if (!lookingAtBlock && !lookingAtEntities) {
        sender.sendMessage('§cNo inventory found.');
        return;
    } else if (lookingAtEntities.length > 0) {
        entity = lookingAtEntities[0]?.entity;
    } else if (lookingAtBlock) {
        block = lookingAtBlock.block;
    }

    let inv;
    try {
        if (entity) inv = entity.getComponent('inventory');
        else inv = block.getComponent('inventory');
    } catch(error) {
        sender.sendMessage('§cBlock is unloaded.');
        return;
    }
    const items = {};

    if (!inv) {
        sender.sendMessage('§cNo inventory found.');
        return;
    }
    inv = inv.container;

    for (let i=0; i<inv.size; i++) {
        try {
            const item = inv.getSlot(i);
            
            let data = item.typeId.replace('minecraft:','');
            if (items[data]) items[data] += item.amount;
            else items[data] = item.amount;
        } catch {}
    }

    let containerId = entity ? entity.typeId.replace('minecraft:','') : block.typeId.replace('minecraft:','');
    if (containerId === 'player') containerId = `§o${entity.name}§r`;
    const coords = entity ? entity.location : block.location;

    let message = '§g-------------§r\n';
    message += `§l§e${containerId}§r: [${Math.floor(coords.x)}, ${Math.floor(coords.y)}, ${Math.floor(coords.z)}]`;
    if (Object.keys(items).length === 0) message += '\n§r§eEmpty';
    else for (let i in items) message += `\n§r§e${i}§r: ${items[i]}`;
    message += '\n§r§g-------------';

    sender.sendMessage(message.trim());
}