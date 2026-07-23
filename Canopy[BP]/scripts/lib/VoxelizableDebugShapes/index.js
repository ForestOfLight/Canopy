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
    box: VoxelizableDebugBox,
    line: VoxelizableDebugLine,
    square: VoxelizableDebugSquare,
    circle: VoxelizableDebugCircle,
    ellipse: VoxelizableDebugEllipse,
    arc: VoxelizableDebugArc,
    sphere: VoxelizableDebugSphere
};

/** Ordered list of shape type ids (box first, so it can be the UI default). */
export const shapeTypeIds = Object.keys(SHAPE_TYPES);

/** The shape class for a type id, or undefined. */
export function getShapeClass(type) {
    return SHAPE_TYPES[type];
}

/** The UI-agnostic config field descriptors for a type id. */
export function getConfigSchema(type) {
    return SHAPE_TYPES[type]?.configSchema;
}

/** Reconstruct a shape from a serialized config (its `type` selects the class). */
export function deserializeShape(config) {
    const ShapeClass = SHAPE_TYPES[config?.type];
    if (!ShapeClass)
        throw new Error(`Unknown shape type: ${config?.type}`);
    return ShapeClass.deserialize(config);
}
