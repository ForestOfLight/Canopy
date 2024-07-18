import { StructureMirrorAxis } from "@minecraft/server";

class DirectionState {
    constructor(name, value) {
        this.name = name;
        this.value = value;
    }
}

class DirectionStateFinder {
    static getDirectionState(permutation) {
        const potentialStates = {
            'facing_direction': permutation.getState('facing_direction'),
            'direction': permutation.getState('direction'),
            'orientation': permutation.getState('orientation'),
            'rail_direction': permutation.getState('rail_direction'),
            'pillar_axis': permutation.getState('pillar_axis')
        };
        for (const state in potentialStates) {
            if (potentialStates[state] === undefined) continue;
            return new DirectionState(state, potentialStates[state]);
        }
        return undefined;
    }
    
    static getMirroredDirection(block) {
        const directionState = this.getDirectionState(block.permutation);
        switch (directionState.name) {
            case 'facing_direction':
                return {
                    0: 1,
                    1: 0,
                    2: StructureMirrorAxis.X,
                    3: StructureMirrorAxis.X,
                    4: StructureMirrorAxis.Z,
                    5: StructureMirrorAxis.Z
                }[directionState.value];
            case 'direction':
                return {
                    0: StructureMirrorAxis.Z,
                    1: StructureMirrorAxis.X,
                    2: StructureMirrorAxis.Z,
                    3: StructureMirrorAxis.X
                }[directionState.value];
            case 'orientation':
                return {
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
                }[directionState.value];
            case 'rail_direction':
                return {
                    0: StructureMirrorAxis.Z,
                    1: StructureMirrorAxis.X
                }[directionState.value];
        }
    }

    static getRotatedDirection(block) {
        const directionState = this.getDirectionState(block.permutation);
        switch (directionState.name) {
            case 'facing_direction':
                return {
                    0: 1,
                    1: 0,
                    2: StructureMirrorAxis.X,
                    3: StructureMirrorAxis.X,
                    4: StructureMirrorAxis.Z,
                    5: StructureMirrorAxis.Z
                }[directionState.value];
            case 'direction':
                return {
                    2: 4,
                    4: 3,
                    3: 5,
                    5: 2,
                    0: 1,
                    1: 0
                }[directionState.value];
            case 'orientation':
                return {
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
                }[directionState.value];
            case 'rail_direction':
                return (directionState.value + 1) % 2;
            case 'pillar_axis':
                return {
                    'y': 'x',
                    'x': 'z',
                    'z': 'y'
                }[directionState.value];
        }
    }

    static getRawMirroredDirection(block) {
        const directionState = this.getDirectionState(block.permutation);
        switch (directionState.name) {
            case 'facing_direction':
                return {
                    0: 1,
                    1: 0,
                    2: 3,
                    3: 2,
                    4: 5,
                    5: 4
                }[directionState.value];
            case 'direction':
                return {
                    0: 2,
                    1: 3,
                    2: 0,
                    3: 1
                }[directionState.value];
            case 'orientation':
                return {
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
                }[directionState.value];
            case 'rail_direction':
                return {
                    0: 1,
                    1: 0
                }[directionState.value];
        }
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
                    3: block.east()
                }[directionState.value];
            case 'orientation':
                if (directionState.value.startsWith('up')) return block.above();
                else if (directionState.value.startsWith('down')) return block.below();
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