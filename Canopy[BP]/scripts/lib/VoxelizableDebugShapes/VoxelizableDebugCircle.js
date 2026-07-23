import { VoxelizableDebugShape } from './VoxelizableDebugShape.js';
import { OrientationFrame } from './geometry/OrientationFrame.js';
import { autoSegments, smoothArc } from './geometry/smooth.js';
import { planarVoxel } from './geometry/curve.js';

export class VoxelizableDebugCircle extends VoxelizableDebugShape {
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
    #segmentCount() { return this.segments ?? autoSegments(Math.max(1e-6, this.#radius)); }

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

    get type() { return 'circle'; }
    serialize() { return this.serializeGeometry(super.serialize(), ['center', 'radius', 'rotation', 'normal']); }

    computeSegments() {
        const radius = this.#radius;
        if (radius <= 0)
            return [];
        const frame = this.#frame();
        const center = this.#center;
        const segmentCount = this.#segmentCount();
        const smoothSegments = smoothArc(frame, center.x, center.y, center.z, radius, radius, 0, 360, segmentCount);
        if (this.mode === 'smooth')
            return [{ group: 'outer', segments: smoothSegments }];
        return planarVoxel(frame, center, radius, radius,
            { innerEdge: this.innerEdge, outerEdge: this.outerEdge, fill: this.fill }, smoothSegments);
    }
}
