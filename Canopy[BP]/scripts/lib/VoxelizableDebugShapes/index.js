import { VoxelizableDebugLine } from './VoxelizableDebugLine.js';
import { VoxelizableDebugBox } from './VoxelizableDebugBox.js';
import { VoxelizableDebugSquare } from './VoxelizableDebugSquare.js';
import { VoxelizableDebugCircle } from './VoxelizableDebugCircle.js';
import { VoxelizableDebugEllipse } from './VoxelizableDebugEllipse.js';
import { VoxelizableDebugArc } from './VoxelizableDebugArc.js';
import { VoxelizableDebugSphere } from './VoxelizableDebugSphere.js';

export { VoxelizableDebugShape } from './VoxelizableDebugShape.js';
export { autoSegments } from './geometry/smooth.js';
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

export const shapeTypeIds = Object.keys(SHAPE_TYPES);

export function getShapeClass(type) {
    return SHAPE_TYPES[type];
}

export function getConfigSchema(type) {
    return SHAPE_TYPES[type]?.configSchema;
}

export function deserializeShape(config) {
    const ShapeClass = SHAPE_TYPES[config?.type];
    if (!ShapeClass)
        throw new Error(`Unknown shape type: ${config?.type}`);
    return ShapeClass.deserialize(config);
}

function isValidFieldValue(field, value) {
    if (field.kind === 'vector') {
        if (value === null || typeof value !== 'object')
            return false;
        return field.axes.every((axis) => Number.isFinite(value[axis]));
    }
    if (field.kind === 'number')
        return Number.isFinite(value);
    if (field.kind === 'boolean')
        return typeof value === 'boolean';
    return field.options.includes(value);
}

export function validateShapeConfig(config) {
    if (!config || typeof config !== 'object')
        return false;
    const schema = getConfigSchema(config.type);
    if (!schema)
        return false;
    for (const field of schema) {
        const value = config[field.key];
        if (value === undefined || value === null) {
            if (field.optional || field.kind === 'boolean' || field.kind === 'enum')
                continue;
            return false;
        }
        if (!isValidFieldValue(field, value))
            return false;
    }
    return true;
}
