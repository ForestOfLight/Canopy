/* eslint-disable camelcase */
import { StructureMirrorAxis } from "@minecraft/server";

const mirrored = {
    facing_direction: {
        0: 1,
        1: 0,
        2: StructureMirrorAxis.X,
        3: StructureMirrorAxis.X,
        4: StructureMirrorAxis.Z,
        5: StructureMirrorAxis.Z
    },
    direction: {
        0: StructureMirrorAxis.Z,
        1: StructureMirrorAxis.X,
        2: StructureMirrorAxis.Z,
        3: StructureMirrorAxis.X
    },
    orientation: {
        'north_up': 'south_up',
        'south_up': 'north_up',
        'east_up': 'west_up',
        'west_up': 'east_up',
        'up_east': 'down_west',
        'up_west': 'down_east',
        'up_north': 'down_south',
        'up_south': 'down_north',
        'down_east': 'up_west',
        'down_west': 'up_east',
        'down_north': 'up_south',
        'down_south': 'up_north'
    },
    rail_direction: {
        0: StructureMirrorAxis.Z,
        1: StructureMirrorAxis.X
    },
    raw: {
        facing_direction: {
            0: 1,
            1: 0,
            2: 3,
            3: 2,
            4: 5,
            5: 4
        },
        direction: {
            0: 2,
            1: 3,
            2: 0,
            3: 1
        },
        rail_direction: {
            0: 1,
            1: 0
        }
    },
    "minecraft:vertical_half": {
        'top': 'bottom',
        'bottom': 'top'
    },
    upside_down_bit: {
        true: false,
        false: true
    }
}

const rotated = {
    facing_direction: {
        0: 1,
        1: 0,
        2: StructureMirrorAxis.X,
        3: StructureMirrorAxis.X,
        4: StructureMirrorAxis.Z,
        5: StructureMirrorAxis.Z
    },
    direction: {
        2: 4,
        4: 3,
        3: 5,
        5: 2,
        0: 1,
        1: 0
    },
    orientation: {
        'north_up': 'east_up',
        'south_up': 'west_up',
        'east_up': 'south_up',
        'west_up': 'north_up',
        'up_east': 'down_west',
        'up_west': 'down_east',
        'up_north': 'down_south',
        'up_south': 'down_north',
        'down_east': 'up_west',
        'down_west': 'up_east',
        'down_north': 'up_south',
        'down_south': 'up_north'
    },
    pillar_axis: {
        'y': 'x',
        'x': 'z',
        'z': 'y'
    }
}

class DirectionStateFinder {
    static getDirectionState(permutation) {
        const potentialStates = {
            'facing_direction': permutation.getState('facing_direction'),
            'direction': permutation.getState('direction'),
            'orientation': permutation.getState('orientation'),
            'rail_direction': permutation.getState('rail_direction'),
            'pillar_axis': permutation.getState('pillar_axis'),
            'minecraft:vertical_half': permutation.getState('minecraft:vertical_half'),
            'upside_down_bit': permutation.getState('upside_down_bit')
        };
        for (const state in potentialStates) {
            if (potentialStates[state] === void 0)
                continue;
            return { name: state, value: potentialStates[state] };
        }
        return void 0;
    }
    
    static getMirroredDirection(block) {
        const directionState = this.getDirectionState(block.permutation);
        const mirroredState = mirrored[directionState.name]?.[directionState.value];
        if (mirroredState === void 0)
            throw new Error('Could not mirror direction. Invalid direction state.');
        return mirroredState;
    }

    static getRotatedDirection(block) {
        const directionState = this.getDirectionState(block.permutation);
        const rotatedState = rotated[directionState.name]?.[directionState.value];
        if (rotatedState === void 0)
            throw new Error('Could not rotate direction. Invalid direction state.');
        return rotatedState;
    }

    static getRawMirroredDirection(block) {
        const directionState = this.getDirectionState(block.permutation);
        if (directionState === void 0)
            return 0;
        const mirroredState = mirrored.raw[directionState.name]?.[directionState.value];
        if (mirroredState === void 0)
            throw new Error('Could not mirror direction. Invalid direction state.');
        return mirroredState;
    }

    static getRelativeBlock(block, directionState) {
        switch (directionState.name) {
            case 'facing_direction':
                return {
                    0: block.below(),
                    1: block.above(),
                    2: block.south(),
                    3: block.north(),
                    4: block.east(),
                    5: block.west()
                }[directionState.value];
            case 'direction':
                return {
                    0: block.north(),
                    1: block.east(),
                    2: block.south(),
                    3: block.west()
                }[directionState.value];
            case 'orientation':
                if (directionState.value.startsWith('up'))
                    return block.above();
                else if (directionState.value.startsWith('down'))
                    return block.below();
                return {
                    'north_up': block.north(),
                    'south_up': block.south(),
                    'east_up': block.east(),
                    'west_up': block.west()
                }[directionState.value];
            default:
                return 0;
        }
    }
}

export default DirectionStateFinder;