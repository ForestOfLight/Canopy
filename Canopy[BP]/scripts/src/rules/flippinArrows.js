import { BooleanRule, Rules } from "../../lib/canopy/Canopy";
import { BlockPermutation, system, world, StructureMirrorAxis, BlockPistonState, EquipmentSlot, EntityComponentTypes, BlockComponentTypes } from "@minecraft/server";
import BlockRotator from "../classes/BlockRotator";
import DirectionStateFinder from "../classes/DirectionState";

new BooleanRule({
    category: 'Rules',
    identifier: 'flippinArrows',
    description: { translate: 'rules.flippinArrows' },
    wikiDescription: 'Using an arrow on a block will flip, rotate, or open it. Keeping the arrow in your offhand while placing blocks will place them in the opposite direction they would normally face.'
});

const WAIT_TICKS_BETWEEN_USE = 5;

const previousBlocks = new Array(WAIT_TICKS_BETWEEN_USE).fill(null);
const flipOnPlaceIds = ['piston', 'sticky_piston', 'dropper', 'dispenser', 'observer', 'crafter', 'unpowered_repeater', 'unpowered_comparator', 
    'powered_repeater', 'powered_comparator', 'hopper', 'end_rod', 'lightning_rod'];
const flipIds = ['piston', 'sticky_piston', 'observer', 'end_rod', 'lightning_rod'];
const flipWhenVerticalIds = ['dropper', 'dispenser', 'crafter', 'barrel', 'command_block', 'chain_command_block', 'repeating_command_block'];
const openIds = ['iron_trapdoor', 'iron_door'];
const noInteractBlockIds = ['piston_arm_collision', 'sticky_piston_arm_collision', 'bed', 'frame', 'decorated_pot'];

system.runInterval(() => {
    previousBlocks.shift();
    if (previousBlocks.length < WAIT_TICKS_BETWEEN_USE)
        previousBlocks.push(null);
});

world.afterEvents.playerPlaceBlock.subscribe((event) => {
    if (!Rules.getNativeValue('flippinArrows')) return;
    const player = event.player;
    if (!player) return;
    const equippableComponent = player.getComponent(EntityComponentTypes.Equippable);
    const offhandStack = equippableComponent.getEquipment(EquipmentSlot.Offhand);
    if (offhandStack?.typeId !== 'minecraft:arrow') return;
    
    const block = event.block;
    if (isFlippableOnPlace(block))
        flip(block);
    else if (isStair(block))
        stairFlip(block);
    else if (isSlab(block))
        slabFlip(block);
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
            succeeded = open(block);
        else if (isStair(block))
            succeeded = stairFlip(block);
        else if (isSlab(block))
            succeeded = slabFlip(block);
        else
            succeeded = rotate(block);
        if (succeeded)
            event.player.playSound('block.itemframe.rotate_item', { pitch: 1.3 });
    }, 0);
});

function isFlippableOnPlace(block) {
    return flipOnPlaceIds.includes(block.typeId.replace('minecraft:', ''));
}

function isStair(block) {
    return block.permutation.getState('weirdo_direction') !== void 0;
}

function isSlab(block) {
    return block.permutation.getState('minecraft:vertical_half') !== void 0;
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

function open(block) {
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
    const states = {
        ...otherPermutations,
        [directionState.name]: permutationValue
    };
    block.dimension.setBlockPermutation(block.location, BlockPermutation.resolve(block.typeId, states));
    return true;
}

function flipWhenVertical(block) {
    const directionState = DirectionStateFinder.getMirroredDirection(block);
    if ([StructureMirrorAxis.X, StructureMirrorAxis.Z].includes(directionState) || isHorizontalOrientation(directionState))
        rotate(block);
    else
        flip(block);
    return true;
}

function isHorizontalOrientation(orientation) {
    return typeof orientation === 'string' && orientation.endsWith('_up');
}

function stairFlip(block) {
    const states = block.permutation.getAllStates();
    const isUpsideDown = DirectionStateFinder.getMirroredDirection(block);
    states['upside_down_bit'] = isUpsideDown;
    block.dimension.setBlockPermutation(block.location, BlockPermutation.resolve(block.typeId, states));
    return true;
}

function slabFlip(block) {
    const states = block.permutation.getAllStates();
    const topOrBottom = DirectionStateFinder.getMirroredDirection(block);
    if ('top_slot_bit' in states)
        states['top_slot_bit'] = !states['top_slot_bit'];
    states['minecraft:vertical_half'] = topOrBottom;
    block.dimension.setBlockPermutation(block.location, BlockPermutation.resolve(block.typeId, states));
    return true;
}

function checkForAbort(block, blockId) {
    if (noInteractBlockIds.includes(blockId))
        return true;
    const piston = block.getComponent(BlockComponentTypes.Piston);
    if (piston && piston.state !== BlockPistonState.Retracted)
        return true;
    if (block.getComponent(BlockComponentTypes.Inventory)?.container.size > 27)
        return true;
    return false;
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
