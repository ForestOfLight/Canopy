import { VoxelizableDebugShape } from './VoxelizableDebugShape.js';
import { OrientationFrame } from './geometry/OrientationFrame.js';
import { autoSegments, smoothArc } from './geometry/smooth.js';
import { planarVoxel } from './geometry/curve.js';

export class VoxelizableDebugEllipse extends VoxelizableDebugShape {
    #center;
    #radii;
    #rotation;
    #normal;

    constructor(config = {}) {
        super(config);
        this.#center = config.center ?? { x: 0, y: 0, z: 0 };
        this.#radii = config.radii ?? { x: 0, z: 0 };
        this.#rotation = config.rotation;
        this.#normal = config.normal;
    }
    get center() { return this.#center; }
    set center(value) { this.#center = value; this.markGeometryDirty(); }
    get radii() { return this.#radii; }
    set radii(value) { this.#radii = value; this.markGeometryDirty(); }
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
            { key: 'radii', kind: 'vector', axes: ['x', 'z'], optional: false },
            VoxelizableDebugShape.vectorField('rotation', true),
            VoxelizableDebugShape.modeField,
            ...VoxelizableDebugShape.edgeFields,
            VoxelizableDebugShape.segmentsField,
            VoxelizableDebugShape.colorField
        ];
    }

    get type() { return 'ellipse'; }
    serialize() { return this.serializeGeometry(super.serialize(), ['center', 'radii', 'rotation', 'normal']); }

    computeSegments() {
        const radiusU = this.#radii.x || 0;
        const radiusV = this.#radii.z || 0;
        if (radiusU <= 0 || radiusV <= 0)
            return [];
        const frame = this.#frame();
        const center = this.#center;
        const segmentCount = this.segments ?? autoSegments(Math.max(1e-6, Math.max(radiusU, radiusV)));
        const smoothSegments = smoothArc(frame, center.x, center.y, center.z, radiusU, radiusV, 0, 360, segmentCount);
        if (this.mode === 'smooth')
            return [{ group: 'outer', segments: smoothSegments }];
        return planarVoxel(frame, center, radiusU, radiusV,
            { innerEdge: this.innerEdge, outerEdge: this.outerEdge, fill: this.fill }, smoothSegments);
    }
}
