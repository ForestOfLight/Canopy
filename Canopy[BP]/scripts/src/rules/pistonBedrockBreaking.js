import { BooleanRule, Rules } from "../../lib/canopy/Canopy";
import { ItemStack, world } from '@minecraft/server';
import DirectionStateFinder from "../classes/DirectionState";

new BooleanRule({
    category: 'Rules',
    identifier: 'pistonBedrockBreaking',
    description: { translate: 'rules.pistonBedrockBreaking' },
    wikiDescription: 'Enables/disables the ability to break bedrock with pistons. To break bedrock, place a piston facing away from the bedrock block and power it. The piston will extend into the bedrock and break it when retracted. The piston also drops as an item.'
});

world.afterEvents.pistonActivate.subscribe((event) => {
    if (!Rules.getNativeValue('pistonBedrockBreaking') || !['Expanding', 'Retracting'].includes(event.piston.state))
        return;
    const piston = event.piston;
    const block = event.block;
    const directionState = DirectionStateFinder.getDirectionState(block.permutation);
    if (directionState === undefined) return;
    directionState.value = DirectionStateFinder.getRawMirroredDirection(block);
    if (piston.state === 'Expanding') {
        const behindBlock = DirectionStateFinder.getRelativeBlock(block, directionState);
        if (behindBlock.typeId === 'minecraft:bedrock') {
            removeBedrock(behindBlock);
            breakPiston(block);
        }
    }
});

function removeBedrock(block) {
    block.setType("minecraft:air");
}

function breakPiston(block) {
    const blockType = block.typeId;
    const dropLocation = block.center();
    block.setType('minecraft:air');
    block.dimension.spawnItem(new ItemStack(blockType, 1), dropLocation);
}
