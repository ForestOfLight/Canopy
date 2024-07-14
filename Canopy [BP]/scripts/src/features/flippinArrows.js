import * as mc from '@minecraft/server'
import Utils from 'stickycore/utils'

const WAIT_TIME_BETWEEN_USE = 5; // in ticks

let previousBlocks = new Array(WAIT_TIME_BETWEEN_USE).fill(null);
const flipBlocksOnPlace = ['piston', 'sticky_piston', 'dropper', 'dispenser', 'observer', 'crafter', 'repeater', 'comparator', 'hopper', 'end_rod', 'lightning_rod'];
const flipBlocks = ['piston', 'sticky_piston', 'observer', 'crafter', 'end_rod', 'lightning_rod'];
const openBlocks = ['iron_trapdoor', 'iron_door'];
const facingFlipMap = {
    0: 1,
    1: 0,
    2: 3,
    3: 2,
    4: 5,
    5: 4
}
const directionFlipMap = {
    0: 2,
    2: 0,
    3: 1,
    1: 3,
}
const rotateMap = {
    2: 4,
    4: 3,
    3: 5,
    5: 2,
    0: 1,
    1: 0
}
const orientationMap = {
    'east_up': 'south_up',
    'south_up': 'west_up',
    'west_up': 'north_up',
    'north_up': 'east_up',
    'up_east': 'down_west',
    'up_west': 'down_east',
    'up_north': 'down_south',
    'up_south': 'down_north',
    'down_east': 'up_west',
    'down_west': 'up_east',
    'down_north': 'up_south',
    'down_south': 'up_north'
}

class DirectionState {
    constructor(name, value) {
        this.name = name;
        this.value = value;
    }
}

mc.system.runInterval(() => {
    if (!mc.world.getDynamicProperty('flippinArrows')) return;
    previousBlocks.shift();
    if (previousBlocks.length < WAIT_TIME_BETWEEN_USE) {
        previousBlocks.push(null);
    }
});

mc.world.beforeEvents.playerPlaceBlock.subscribe(event => {
    if (!mc.world.getDynamicProperty('flippinArrows')) return;
    const offhandStack = event.player.getComponent('equippable').getEquipment("Offhand");
    if (offhandStack?.typeId !== 'minecraft:arrow') return;
    const directionState = getDirectionState(event.block, event.permutationBeingPlaced);
    if (directionState === undefined) return;

    const block = event.block;
    const itemStack = event.player.getComponent('equippable').getEquipment("Mainhand");
    const blockId = getBlockIdfromItemStack(itemStack);
    mc.system.runTimeout(() => {
        const itemStackId = itemStack.typeId.replace('minecraft:', '');
        if (flipBlocksOnPlace.includes(itemStackId))
            flip(event.player, block, blockId, directionState);
    }, 0);
});

mc.world.beforeEvents.itemUseOn.subscribe(event => {
    if (!mc.world.getDynamicProperty('flippinArrows') || event.itemStack.typeId !== 'minecraft:arrow') return;
    const block = event.block;
    if (needsCooldown(block)) return;
    previousBlocks.push(block);

    const directionState = getDirectionState(block, block.permutation);
    if (directionState === undefined) return;

    event.cancel = true;
    const blockId = block.typeId.replace('minecraft:', '');
    mc.system.runTimeout(() => {
        if (flipBlocks.includes(blockId))
            flip(event.source, block, blockId, directionState);
        else if (openBlocks.includes(blockId))
            open(event.source, block, blockId, directionState);
        else
            rotate(event.source, block, blockId, directionState);
    }, 0);
});

function getBlockIdfromItemStack(itemStack) {
    let blockId = itemStack.typeId.replace('minecraft:', '');
    if (blockId === 'repeater') blockId = 'unpowered_repeater';
    if (blockId === 'comparator') blockId = 'unpowered_comparator';
    return blockId;
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

function getDirectionState(block, permutation) {
    const allStates = permutation.getAllStates();
    for (const state in allStates) {
        if (['open_bit', 'facing_direction', 'direction', 'rail_direction', 'orientation'].includes(state)) {
            if (block.typeId === 'minecraft:barrel' && state === 'open_bit') continue;
            return new DirectionState(state, allStates[state]);
        }
    }
    return undefined;
}

function flip(player, block, blockId, directionState) {
    const permutationValue = Utils.isNumeric(directionState.value) ? getFlippedDirection(directionState) : `\"${getFlippedDirection(directionState)}\"`;
    safeSetblock(player, block, blockId, directionState, permutationValue);
}

function open(player, block, blockId, directionState) {
    let openPermutation;
    let otherPermutations = {};
    if (block.typeId === 'minecraft:iron_trapdoor') {
        openPermutation = !directionState.value; 
        otherPermutations = { 
            'direction': block.permutation.getState('direction'),
            'upside_down_bit': block.permutation.getState('upside_down_bit')
        };
    }
    else if (block.typeId === 'minecraft:iron_door') {
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
    safeSetblock(player, block, blockId, directionState, openPermutation, otherPermutations);
}

function rotate(player, block, blockId, directionState) {
    let rotatedPermutation;
    let otherPermutations = {};
    if (['minecraft:powered_repeater', 'minecraft:unpowered_repeater'].includes(block.typeId)) {
        rotatedPermutation = getRotatedDirection(directionState);
        otherPermutations = { 'repeater_delay': block.permutation.getState('repeater_delay') }
    } else if (['minecraft:powered_comparator', 'minecraft:unpowered_comparator'].includes(block.typeId)) {
        rotatedPermutation = getRotatedDirection(directionState);
        otherPermutations = { 'output_subtract_bit': block.permutation.getState('output_subtract_bit') }
    }
    else rotatedPermutation = getRotatedDirection(directionState);
    safeSetblock(player, block, blockId, directionState, rotatedPermutation, otherPermutations);
}

function getFlippedDirection(directionState) {
    if (directionState.name === 'orientation')
        return orientationMap[directionState.value];
    else if (directionState.name === 'direction')
        return directionFlipMap[directionState.value];
    else
        return facingFlipMap[directionState.value];
}

function getRotatedDirection(directionState) {
    if (directionState.name === 'direction') 
        return (directionState.value + 1) % 4;
    else if (directionState.name === 'facing_direction')
        return rotateMap[directionState.value];
    else if (directionState.name === 'rail_direction')
        return (directionState.value + 1) % 2;
    else 
        return console.warn('Invalid stateName');
}

function safeSetblock(player, block, blockId, directionState, permutationValue, otherPermutations = {}) {
    if (Object.keys(otherPermutations).length === 0) otherPermutations = '';
    else otherPermutations = ',' + Object.entries(otherPermutations).map(([key, value]) => `\"${key}\"=${value}`).join(',');
    const setblockCmd = `setblock ${block.location.x} ${block.location.y} ${block.location.z} ${blockId} ["${directionState.name}"=${permutationValue}${otherPermutations}] replace`;
    (async () => {
        player.runCommandAsync(`setblock ${block.location.x} ${block.location.y} ${block.location.z} air replace`);
        player.runCommandAsync(setblockCmd);
    })();
}
