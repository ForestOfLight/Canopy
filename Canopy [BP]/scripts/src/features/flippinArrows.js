import { system, world, StructureMirrorAxis, BlockPistonState } from "@minecraft/server";
import BlockRotator from 'src/classes/BlockRotator';
import DirectionStateFinder from 'src/classes/DirectionState';

const WAIT_TIME_BETWEEN_USE = 5; // in ticks

let previousBlocks = new Array(WAIT_TIME_BETWEEN_USE).fill(null);
const flipOnPlaceIds = ['piston', 'sticky_piston', 'dropper', 'dispenser', 'observer', 'crafter', 'unpowered_repeater', 'unpowered_comparator', 
    'powered_repeater', 'powered_comparator','hopper', 'end_rod', 'lightning_rod'];
const flipIds = ['piston', 'sticky_piston', 'observer', 'end_rod', 'lightning_rod'];
const flipWhenVerticalIds = ['dropper', 'dispenser', 'barrel', 'command_block', 'chain_command_block', 'repeating_command_block'];
const openIds = ['iron_trapdoor', 'iron_door'];
const noInteractBlockIds = ['piston_arm_collision', 'sticky_piston_arm_collision', 'bed'];

system.runInterval(() => {
    previousBlocks.shift();
    if (previousBlocks.length < WAIT_TIME_BETWEEN_USE) {
        previousBlocks.push(null);
    }
});

world.beforeEvents.playerPlaceBlock.subscribe(event => {
    if (!world.getDynamicProperty('flippinArrows')) return;
    const player = event.player;
    const offhandStack = player.getComponent('equippable').getEquipment("Offhand");
    if (offhandStack?.typeId !== 'minecraft:arrow') return;

    const mainhandStackId = player.getComponent('equippable').getEquipment("Mainhand").typeId.replace('minecraft:', '');
    if (flipOnPlaceIds.includes(mainhandStackId)) {
        system.runTimeout(() => {
            flip(event.block);
        }, 0);
    }
});

world.beforeEvents.itemUseOn.subscribe(event => {
    if (!world.getDynamicProperty('flippinArrows')) return;
    if (event.itemStack.typeId !== 'minecraft:arrow') return;
    const block = event.block;
    if (needsCooldown(block)) return;
    previousBlocks.push(block);

    event.cancel = true;
    const blockId = block.typeId.replace('minecraft:', '');
    system.runTimeout(() => {
        if (checkForAbort(block, blockId)) return;
        if (flipWhenVerticalIds.includes(blockId))
            flipWhenVertical(block);
        else if (flipIds.includes(blockId))
            flip(block);
        else if (openIds.includes(blockId))
            open(event.source, block);
        else
            rotate(block);
    }, 0);
});

function flip(block) {
    const structure = BlockRotator.saveBlock(block);
    if (structure === undefined) return;
    BlockRotator.placeMirrored(structure.id, block);
}

function rotate(block) {
    const structure = BlockRotator.saveBlock(block);
    if (structure === undefined) return;
    BlockRotator.placeRotated(structure.id, block);
}

function open(player, block) {
    let directionState = {
        name: 'open_bit',
        value: block.permutation.getState('open_bit')
    }
    let openPermutation = directionState.value;
    let otherPermutations = {};
    if (block.typeId === 'minecraft:iron_trapdoor') {
        openPermutation = !directionState.value; 
        otherPermutations = { 
            'direction': block.permutation.getState('direction'),
            'upside_down_bit': block.permutation.getState('upside_down_bit')
        };
    } else if (block.typeId === 'minecraft:iron_door') {
        let hingeBit;
        if (block.permutation.getState('upper_block_bit') === true) {
            hingeBit = block.permutation.getState('door_hinge_bit');
            block = block.below();
        } else {
            hingeBit = block.above().permutation.getState('door_hinge_bit');
        }

        openPermutation = !directionState.value;
        otherPermutations = { 
            'direction': block.permutation.getState('direction'),
            'upper_block_bit': block.permutation.getState('upper_block_bit'),
            'door_hinge_bit': hingeBit
        };
    }
    safeSetblock(player, block, directionState, openPermutation, otherPermutations);
}

function flipWhenVertical(block) {
    const directionState = DirectionStateFinder.getMirroredDirection(block);
    if ([StructureMirrorAxis.X, StructureMirrorAxis.Z].includes(directionState))
        rotate(block);
    else
        flip(block);
}

function checkForAbort(block, blockId) {
    if (noInteractBlockIds.includes(blockId)) return true;
    if (['piston', 'sticky_piston'].includes(blockId) && block.getComponent('piston').state !== BlockPistonState.Retracted) return true;
    if (['chest', 'trapped_chest'].includes(blockId) && block.getComponent('inventory')?.container.size > 27) return true;
    return false;
}

function safeSetblock(player, block, directionState, permutationValue, otherPermutations = {}) {
    if (Object.keys(otherPermutations).length === 0) otherPermutations = '';
    else otherPermutations = ',' + Object.entries(otherPermutations).map(([key, value]) => `\"${key}\"=${value}`).join(',');
    const setblockCmd = `setblock ${block.location.x} ${block.location.y} ${block.location.z} ${block.typeId} ["${directionState.name}"=${permutationValue}${otherPermutations}] replace`;
    (async () => {
        player.runCommandAsync(`setblock ${block.location.x} ${block.location.y} ${block.location.z} air replace`);
        player.runCommandAsync(setblockCmd);
    })();
    return block.dimension.getBlock(block.location);
}

function needsCooldown(block) {
    return previousBlocks.some(b => 
        b?.typeId === block.typeId 
        && b?.location.x === block.location.x 
        && b?.location.y === block.location.y 
        && b?.location.z === block.location.z 
        && b?.dimension.id === block.dimension.id
    );
}
