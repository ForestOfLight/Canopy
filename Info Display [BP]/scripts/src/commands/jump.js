import Command from 'stickycore/command'

new Command()
    .setName('jump')
    .setCallback(jumpCommand)
    .build()

new Command()
    .setName('j')
    .setCallback(jumpCommand)
    .build()

function jumpCommand(sender) {
    const lookingAt = sender.getBlockFromViewDirection(
		{ includeLiquidBlocks: false, includePassableBlocks: true, maxDistance: 64*16 }
    );
    if (!lookingAt.block) return sender.sendMessage('§cNo block found.');
    const location = getBlockLocationFromFace(lookingAt.block, lookingAt.face);
    sender.teleport(location);
}

function getBlockLocationFromFace(block, face) {
    switch(face) {
        case 'Up': return { x: block.x, y: block.y + 1, z: block.z};
        case 'Down': return { x: block.x, y: block.y - 1, z: block.z};
        case 'North': return { x: block.x, y: block.y + 1, z: block.z};
        case 'South': return { x: block.x, y: block.y + 1, z: block.z};
        case 'East': return { x: block.x + 1, y: block.y + 1, z: block.z};
        case 'West': return { x: block.x - 1, y: block.y + 1, z: block.z};
    }
}