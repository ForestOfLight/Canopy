import { VoxelizableDebugShape } from './VoxelizableDebugShape.js';
import { OrientationFrame } from './geometry/OrientationFrame.js';
import { boxVoxel } from './geometry/box.js';
import { voxelizeOutline } from './geometry/line.js';

export class VoxelizableDebugSquare extends VoxelizableDebugShape {
    #center;
    #width;
    #height;
    #from;
    #to;
    #rotation;
    #normal;

    constructor(config = {}) {
        super(config);
        this.#center = config.center;
        this.#width = config.width;
        this.#height = config.height;
        this.#from = config.from;
        this.#to = config.to;
        this.#rotation = config.rotation;
        this.#normal = config.normal;
    }
    get center() { return this.#center; }
    set center(value) { this.#center = value; this.markGeometryDirty(); }
    get width() { return this.#width; }
    set width(value) { this.#width = value; this.markGeometryDirty(); }
    get height() { return this.#height; }
    set height(value) { this.#height = value; this.markGeometryDirty(); }
    get from() { return this.#from; }
    set from(value) { this.#from = value; this.markGeometryDirty(); }
    get to() { return this.#to; }
    set to(value) { this.#to = value; this.markGeometryDirty(); }
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
    #bounds() {
        if (this.#from && this.#to) {
            const from = this.#from;
            const to = this.#to;
            return {
                centerX: (from.x + to.x) / 2,
                centerY: (from.y + to.y) / 2,
                centerZ: (from.z + to.z) / 2,
                halfU: Math.abs(to.x - from.x) / 2,
                halfV: Math.abs(to.z - from.z) / 2,
            };
        }
        const center = this.#center || { x: 0, y: 0, z: 0 };
        return {
            centerX: center.x,
            centerY: center.y,
            centerZ: center.z,
            halfU: (this.#width || 0) / 2,
            halfV: (this.#height || 0) / 2,
        };
    }
    #corners(frame, bounds) {
        const corners = [];
        for (const signU of [-1, 1]) {
            for (const signV of [-1, 1]) {
                const corner = [0, 0, 0];
                frame.mapLocal(bounds.centerX, bounds.centerY, bounds.centerZ, signU * bounds.halfU, signV * bounds.halfV, 0, corner, 0);
                corners.push(corner);
            }
        }
        return corners;
    }
    #rectEdges(corners) {
        const edge = (startIndex, endIndex) => [
            corners[startIndex][0], corners[startIndex][1], corners[startIndex][2],
            corners[endIndex][0], corners[endIndex][1], corners[endIndex][2],
        ];
        return [...edge(0, 1), ...edge(1, 3), ...edge(3, 2), ...edge(2, 0)];
    }

    static get configSchema() {
        return [
            VoxelizableDebugShape.vectorField('from'),
            VoxelizableDebugShape.vectorField('to'),
            VoxelizableDebugShape.vectorField('rotation', true),
            VoxelizableDebugShape.modeField,
            ...VoxelizableDebugShape.edgeFields,
            VoxelizableDebugShape.colorField
        ];
    }

    get type() { return 'square'; }
    serialize() { return this.serializeGeometry(super.serialize(), ['center', 'width', 'height', 'from', 'to', 'rotation', 'normal']); }

    computeSegments() {
        const bounds = this.#bounds();
        if (bounds.halfU === 0 && bounds.halfV === 0)
            return [];
        const frame = this.#frame();
        const corners = this.#corners(frame, bounds);
        if (this.mode === 'smooth')
            return [{ group: 'outer', segments: this.#rectEdges(corners) }];
        if (frame.isAxisAligned()) {
            const minimum = [Infinity, Infinity, Infinity];
            const maximum = [-Infinity, -Infinity, -Infinity];
            for (const corner of corners) {
                for (let axis = 0; axis < 3; axis++) {
                    minimum[axis] = Math.min(minimum[axis], corner[axis]);
                    maximum[axis] = Math.max(maximum[axis], corner[axis]);
                }
            }
            return boxVoxel(minimum[0], minimum[1], minimum[2], maximum[0], maximum[1], maximum[2],
                { innerEdge: this.innerEdge, outerEdge: this.outerEdge, fill: this.fill });
        }
        return [{ group: 'outer', segments: voxelizeOutline(this.#rectEdges(corners)) }];
    }
}
