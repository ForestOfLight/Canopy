import { VoxelizableDebugShape } from './VoxelizableDebugShape.js';
import { OrientationFrame } from './geometry/OrientationFrame.js';
import { autoSegments, smoothSphere } from './geometry/smooth.js';
import { sphereVoxel } from './geometry/sphere.js';
import { voxelizeOutline } from './geometry/line.js';

export class VoxelizableDebugSphere extends VoxelizableDebugShape {
    #center;
    #radius;
    #rotation;
    #normal;

    constructor(config = {}) {
        super(config);
        this.#center = config.center ?? { x: 0, y: 0, z: 0 };
        this.#radius = config.radius ?? 0;
        this.#rotation = config.rotation;
        this.#normal = config.normal;
    }
    get center() { return this.#center; }
    set center(value) { this.#center = value; this.markGeometryDirty(); }
    get radius() { return this.#radius; }
    set radius(value) { this.#radius = value; this.markGeometryDirty(); }
    get rotation() { return this.#rotation; }
    set rotation(value) { this.#rotation = value; this.markGeometryDirty(); }
    get normal() { return this.#normal; }
    set normal(value) { this.#normal = value; this.markGeometryDirty(); }

    #frame() {
        if (this.#rotation)
            return OrientationFrame.fromEuler(this.#rotation.x || 0, this.#rotation.y || 0, this.#rotation.z || 0);
        if (this.#normal)
            return OrientationFrame.fromNormal(this.#normal.x, this.#normal.y, this.#normal.z);
        return OrientationFrame.fromEuler(0, 0, 0);
    }

    static get configSchema() {
        return [
            VoxelizableDebugShape.vectorField('center'),
            VoxelizableDebugShape.numberField('radius'),
            VoxelizableDebugShape.vectorField('rotation', true),
            VoxelizableDebugShape.modeField,
            ...VoxelizableDebugShape.edgeFields,
            VoxelizableDebugShape.segmentsField,
            VoxelizableDebugShape.colorField
        ];
    }

    get type() { return 'sphere'; }
    serialize() { return this.serializeGeometry(super.serialize(), ['center', 'radius', 'rotation', 'normal']); }

    computeSegments() {
        const radius = this.#radius;
        if (radius <= 0)
            return [];
        const frame = this.#frame();
        const center = this.#center;
        const segmentCount = this.segments ?? autoSegments(radius);
        if (this.mode === 'smooth')
            return [{ group: 'outer', segments: smoothSphere(frame, center.x, center.y, center.z, radius, segmentCount) }];
        const voxelGroups = sphereVoxel(frame, center, radius,
            { innerEdge: this.innerEdge, outerEdge: this.outerEdge, fill: this.fill });
        if (voxelGroups !== null)
            return voxelGroups;
        return [{ group: 'outer', segments: voxelizeOutline(smoothSphere(frame, center.x, center.y, center.z, radius, segmentCount)) }];
    }
}
