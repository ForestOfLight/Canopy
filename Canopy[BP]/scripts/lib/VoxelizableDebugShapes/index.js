import { VoxelizableDebugLine } from './VoxelizableDebugLine.js';
import { VoxelizableDebugBox } from './VoxelizableDebugBox.js';
import { VoxelizableDebugSquare } from './VoxelizableDebugSquare.js';
import { VoxelizableDebugCircle } from './VoxelizableDebugCircle.js';
import { VoxelizableDebugEllipse } from './VoxelizableDebugEllipse.js';
import { VoxelizableDebugArc } from './VoxelizableDebugArc.js';
import { VoxelizableDebugSphere } from './VoxelizableDebugSphere.js';

export { VoxelizableDebugShape } from './VoxelizableDebugShape.js';
export {
    VoxelizableDebugLine,
    VoxelizableDebugBox,
    VoxelizableDebugSquare,
    VoxelizableDebugCircle,
    VoxelizableDebugEllipse,
    VoxelizableDebugArc,
    VoxelizableDebugSphere
};

const SHAPE_TYPES = {
    line: VoxelizableDebugLine,
    box: VoxelizableDebugBox,
    square: VoxelizableDebugSquare,
    circle: VoxelizableDebugCircle,
    ellipse: VoxelizableDebugEllipse,
    arc: VoxelizableDebugArc,
    sphere: VoxelizableDebugSphere
};

/** Reconstruct a shape from a serialized config (its `type` selects the class). */
export function deserializeShape(config) {
    const ShapeClass = SHAPE_TYPES[config?.type];
    if (!ShapeClass)
        throw new Error(`Unknown shape type: ${config?.type}`);
    return ShapeClass.deserialize(config);
}
