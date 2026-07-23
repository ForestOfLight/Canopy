import { VoxelizableDebugShape } from './VoxelizableDebugShape.js';
import { OrientationFrame } from './geometry/OrientationFrame.js';
import { autoSegments, smoothArc } from './geometry/smooth.js';
import { arcVoxel2D } from './geometry/arc.js';
import { lift2D } from './geometry/plane.js';
import { mergeAxisAligned } from './geometry/merge.js';
import { voxelizeOutline } from './geometry/line.js';

export class VoxelizableDebugArc extends VoxelizableDebugShape {
    #center;
    #radius;
    #radii;
    #startAngle;
    #endAngle;
    #rotation;
    #normal;

    constructor(config = {}) {
        super(config);
        this.#center = config.center ?? { x: 0, y: 0, z: 0 };
        this.#radius = config.radius;
        this.#radii = config.radii;
        this.#startAngle = config.startAngle ?? 0;
        this.#endAngle = config.endAngle ?? 360;
        this.#rotation = config.rotation;
        this.#normal = config.normal;
    }
    get center() { return this.#center; }
    set center(value) { this.#center = value; this.markGeometryDirty(); }
    get radius() { return this.#radius; }
    set radius(value) { this.#radius = value; this.markGeometryDirty(); }
    get radii() { return this.#radii; }
    set radii(value) { this.#radii = value; this.markGeometryDirty(); }
    get startAngle() { return this.#startAngle; }
    set startAngle(value) { this.#startAngle = value; this.markGeometryDirty(); }
    get endAngle() { return this.#endAngle; }
    set endAngle(value) { this.#endAngle = value; this.markGeometryDirty(); }
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
    #radiusPair() {
        if (this.#radii)
            return [this.#radii.x || 0, this.#radii.z || 0];
        return [this.#radius || 0, this.#radius || 0];
    }

    static get configSchema() {
        return [
            VoxelizableDebugShape.vectorField('center'),
            VoxelizableDebugShape.numberField('radius'),
            VoxelizableDebugShape.numberField('startAngle'),
            VoxelizableDebugShape.numberField('endAngle'),
            VoxelizableDebugShape.vectorField('rotation', true),
            VoxelizableDebugShape.modeField,
            ...VoxelizableDebugShape.edgeFields,
            VoxelizableDebugShape.segmentsField,
            VoxelizableDebugShape.colorField
        ];
    }

    get type() { return 'arc'; }
    serialize() { return this.serializeGeometry(super.serialize(), ['center', 'radius', 'radii', 'startAngle', 'endAngle', 'rotation', 'normal']); }

    computeSegments() {
        const [radiusU, radiusV] = this.#radiusPair();
        if (radiusU <= 0 || radiusV <= 0 || this.#startAngle === this.#endAngle)
            return [];
        const frame = this.#frame();
        const center = this.#center;
        const segmentCount = this.segments ?? autoSegments(Math.max(1e-6, Math.max(radiusU, radiusV)));
        const smoothSegments = smoothArc(frame, center.x, center.y, center.z, radiusU, radiusV, this.#startAngle, this.#endAngle, segmentCount);
        if (this.mode === 'smooth')
            return [{ group: 'outer', segments: smoothSegments }];

        const axisMapping = frame.planeAxes();
        if (!axisMapping)
            return [{ group: 'outer', segments: voxelizeOutline(smoothSegments) }];
        const centerCoordinates = [center.x, center.y, center.z];
        const planarGroups = arcVoxel2D(
            centerCoordinates[axisMapping.uAxis], centerCoordinates[axisMapping.vAxis],
            radiusU, radiusV, this.#startAngle, this.#endAngle,
            { innerEdge: this.innerEdge, outerEdge: this.outerEdge, fill: this.fill },
            axisMapping.uSign, axisMapping.vSign
        );
        return planarGroups.map((planarGroup) => ({
            group: planarGroup.group,
            segments: mergeAxisAligned(lift2D(axisMapping, center, planarGroup.segments)),
        }));
    }
}
