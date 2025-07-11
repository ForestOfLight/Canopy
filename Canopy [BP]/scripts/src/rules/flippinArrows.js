import { Rule, Rules } from "../../lib/canopy/Canopy";
import { system, world, StructureMirrorAxis, BlockPistonState, EquipmentSlot } from "@minecraft/server";
import BlockRotator from "../classes/BlockRotator";
import DirectionStateFinder from "../classes/DirectionState";

new Rule({
    category: 'Rules',
    identifier: 'flippinArrows',
    description: { translate: 'rules.flippinArrows' }
});

const WAIT_TICKS_BETWEEN_USE = 5;

const previousBlocks = new Array(WAIT_TICKS_BETWEEN_USE).fill(null);
const flipOnPlaceIds = ['piston', 'sticky_piston', 'dropper', 'dispenser', 'observer', 'crafter', 'unpowered_repeater', 'unpowered_comparator', 
    'powered_repeater', 'powered_comparator','hopper', 'end_rod', 'lightning_rod'];
const flipIds = ['piston', 'sticky_piston', 'observer', 'end_rod', 'lightning_rod'];
const flipWhenVerticalIds = ['dropper', 'dispenser', 'barrel', 'command_block', 'chain_command_block', 'repeating_command_block'];
const openIds = ['iron_trapdoor', 'iron_door'];
const noInteractBlockIds = ['piston_arm_collision', 'sticky_piston_arm_collision', 'bed', 'frame'];

system.runInterval(() => {
    previousBlocks.shift();
    if (previousBlocks.length < WAIT_TICKS_BETWEEN_USE)
        previousBlocks.push(null);
});

world.afterEvents.playerPlaceBlock.subscribe((event) => {
    if (!Rules.getNativeValue('flippinArrows')) return;
    const player = event.player;
    if (!player) return;
    const offhandStack = player.getComponent('equippable').getEquipment(EquipmentSlot.Offhand);
    if (offhandStack?.typeId !== 'minecraft:arrow') return;
    
    const block = event.block;
    if (isFlippableOnPlace(block))
        flip(block);
});

world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    if (event.player === undefined || !Rules.getNativeValue('flippinArrows')) return;
    if (event.itemStack?.typeId !== 'minecraft:arrow') return;
    const block = event.block;
    if (isOnCooldown(block)) return;
    previousBlocks.push(block);

    const blockId = block.typeId.replace('minecraft:', '');
    if (checkForAbort(block, blockId)) return;
    event.cancel = true;
    system.runTimeout(() => {
        let succeeded;
        if (flipWhenVerticalIds.includes(blockId))
            succeeded = flipWhenVertical(block);
        else if (flipIds.includes(blockId))
            succeeded = flip(block);
        else if (openIds.includes(blockId))
            succeeded = open(event.player, block);
        else if (block.permutation.getState('upside_down_bit') !== void 0)
            succeeded = stairFlip(event.player, block);
        else if (block.permutation.getState('minecraft:vertical_half'))
            succeeded = slabFlip(event.player, block);
        else
            succeeded = rotate(block);
        if (succeeded)
            event.player.playSound('block.itemframe.rotate_item', { pitch: 1.3 });
    }, 0);
});

function isFlippableOnPlace(block) {
    return flipOnPlaceIds.includes(block.typeId.replace('minecraft:', ''));
}

function flip(block) {
    const structure = BlockRotator.saveBlock(block);
    if (structure === undefined)
        return false;
    BlockRotator.placeMirrored(structure.id, block);
    return true;
}

function rotate(block) {
    const structure = BlockRotator.saveBlock(block);
    if (structure === undefined)
        return false;
    BlockRotator.placeRotated(structure.id, block);
    return true;
}

function open(player, block) {
    const directionState = {
        name: 'open_bit',
        value: block.permutation.getState('open_bit')
    }
    let permutationValue = directionState.value;
    let otherPermutations = {};
    if (block.typeId === 'minecraft:iron_trapdoor') {
        permutationValue = !directionState.value; 
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

        permutationValue = !directionState.value;
        otherPermutations = { 
            'direction': block.permutation.getState('direction'),
            'upper_block_bit': block.permutation.getState('upper_block_bit'),
            'door_hinge_bit': hingeBit
        };
    }
    const blockData = {
        block,
        directionState,
        permutationValue,
        otherPermutations
    }
    safeSetblock(player, blockData);
    return true;
}

function flipWhenVertical(block) {
    const directionState = DirectionStateFinder.getMirroredDirection(block);
    if ([StructureMirrorAxis.X, StructureMirrorAxis.Z].includes(directionState))
        rotate(block);
    else
        flip(block);
    return true;
}

function stairFlip(player, block) {
    const states = block.permutation.getAllStates();
    const isUpsideDown = DirectionStateFinder.getMirroredDirection(block);
    safeSetblock(player, { block, directionState: { name: 'upside_down_bit' }, permutationValue: isUpsideDown, otherPermutations: states });
    return true;
}

function slabFlip(player, block) {
    const states = block.permutation.getAllStates();
    const topOrBottom = DirectionStateFinder.getMirroredDirection(block);
    if ('top_slot_bit' in states)
        states['top_slot_bit'] = !states['top_slot_bit'];
    safeSetblock(player, { block, directionState: { name: 'minecraft:vertical_half' }, permutationValue: topOrBottom, otherPermutations: states });
    return true;
}

function checkForAbort(block, blockId) {
    if (noInteractBlockIds.includes(blockId)) return true;
    if (['piston', 'sticky_piston'].includes(blockId) && block.getComponent('piston').state !== BlockPistonState.Retracted) return true;
    if (['chest', 'trapped_chest'].includes(blockId) && block.getComponent('inventory')?.container.size > 27) return true;
    return false;
}

function safeSetblock(player, blockData) {
    const { block, directionState, permutationValue } = blockData;
    let otherPermutations = blockData.otherPermutations;
    delete otherPermutations[directionState.name];
    if (Object.keys(otherPermutations).length === 0) {
        otherPermutations = '';
    } else {
        otherPermutations = ',' + Object.entries(otherPermutations).map(([key, value]) => {
            const val = typeof value === "string" ? `"${value}"` : value;
            return `"${key}"=${val}`;
        }).join(',');
    }
    const permValue = typeof permutationValue === "string" ? `"${permutationValue}"` : permutationValue;
    const setblockCmd = `setblock ${block.location.x} ${block.location.y} ${block.location.z} ${block.typeId} ["${directionState.name}"=${permValue}${otherPermutations}] replace`;
    player.runCommand(`setblock ${block.location.x} ${block.location.y} ${block.location.z} air replace`);
    player.runCommand(setblockCmd);
    return block.dimension.getBlock(block.location);
}

function isOnCooldown(block) {
    return previousBlocks.some(b => 
        b?.typeId === block.typeId 
        && b?.location.x === block.location.x 
        && b?.location.y === block.location.y 
        && b?.location.z === block.location.z 
        && b?.dimension.id === block.dimension.id
    );
}
