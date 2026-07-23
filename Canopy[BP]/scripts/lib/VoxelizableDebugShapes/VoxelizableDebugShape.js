import { debugDrawer, DebugLine } from "@minecraft/debug-utilities";

const WHITE = { red: 1, green: 1, blue: 1, alpha: 1 };

export class VoxelizableDebugShape {
    constructor(config = {}) {
        this._pool = [];
        this._groups = null;
        this._shown = false;
        this._geometryDirty = true;
        this._appearanceDirty = true;

        this._mode = config.mode ?? 'voxel';
        this._innerEdge = config.innerEdge ?? true;
        this._outerEdge = config.outerEdge ?? false;
        this._fill = config.fill ?? false;
        this._segmentsOverride = config.segments;

        this._color = config.color;
        this._dimension = config.dimension;
        this._visibleTo = config.visibleTo;
        this._maximumRenderDistance = config.maximumRenderDistance;
        this._attachedTo = config.attachedTo;
    }

    _markGeometry() { this._geometryDirty = true; }
    _markAppearance() { this._appearanceDirty = true; }

    // geometry accessors
    get mode() { return this._mode; }
    set mode(v) { this._mode = v; this._markGeometry(); }
    get innerEdge() { return this._innerEdge; }
    set innerEdge(v) { this._innerEdge = v; this._markGeometry(); }
    get outerEdge() { return this._outerEdge; }
    set outerEdge(v) { this._outerEdge = v; this._markGeometry(); }
    get fill() { return this._fill; }
    set fill(v) { this._fill = v; this._markGeometry(); }
    get segments() { return this._segmentsOverride; }
    set segments(v) { this._segmentsOverride = v; this._markGeometry(); }

    // appearance accessors
    get color() { return this._color; }
    set color(v) { this._color = v; this._markAppearance(); }
    get dimension() { return this._dimension; }
    set dimension(v) { this._dimension = v; this._markAppearance(); }
    get visibleTo() { return this._visibleTo; }
    set visibleTo(v) { this._visibleTo = v; this._markAppearance(); }
    get maximumRenderDistance() { return this._maximumRenderDistance; }
    set maximumRenderDistance(v) { this._maximumRenderDistance = v; this._markAppearance(); }
    get attachedTo() { return this._attachedTo; }
    set attachedTo(v) { this._attachedTo = v; this._markAppearance(); }

    // subclasses override
    computeSegments() { throw new Error('computeSegments() must be implemented'); }

    draw() {
        if (this._geometryDirty || this._groups === null) {
            this._groups = this.computeSegments() || [];
            this._reconcile();
            this._geometryDirty = false;
            this._appearanceDirty = false;
            this._shown = true;
            return this;
        }
        if (!this._shown) {
            for (const line of this._pool) debugDrawer.addShape(line);
            this._shown = true;
        }
        if (this._appearanceDirty) { this._applyAppearance(); this._appearanceDirty = false; }
        return this;
    }

    remove() {
        for (const line of this._pool) line.remove();
        this._shown = false;
        return this;
    }

    destroy() {
        for (const line of this._pool) line.remove();
        this._pool.length = 0;
        this._groups = null;
        this._shown = false;
        return this;
    }

    _loc(s, o) {
        const l = { x: s[o], y: s[o + 1], z: s[o + 2] };
        if (this._dimension) l.dimension = this._dimension;
        return l;
    }

    _resolveColor(group, s) {
        const c = this._color;
        if (typeof c === 'function')
            return c({ x: s[0], y: s[1], z: s[2] }, { x: s[3], y: s[4], z: s[5] });
        if (c && (c.inner || c.outer || c.fill || c.line))
            return c[group] ?? c.outer ?? c.inner ?? c.fill ?? c.line ?? WHITE;
        if (c && c.red !== undefined) return c;
        return WHITE;
    }

    _applyLine(line, group, s) {
        line.__group = group;
        line.setLocation(this._loc(s, 0));
        line.endLocation = { x: s[3], y: s[4], z: s[5] };
        line.color = this._resolveColor(group, s);
        if (this._visibleTo !== undefined) line.visibleTo = this._visibleTo;
        if (this._maximumRenderDistance !== undefined) line.maximumRenderDistance = this._maximumRenderDistance;
        if (this._attachedTo !== undefined) line.attachedTo = this._attachedTo;
    }

    _reconcile() {
        const desired = [];
        for (const grp of this._groups)
            for (let i = 0; i < grp.segments.length; i += 6)
                desired.push({ group: grp.group, s: grp.segments.slice(i, i + 6) });

        const pool = this._pool;
        const reuse = Math.min(pool.length, desired.length);
        for (let i = 0; i < reuse; i++) this._applyLine(pool[i], desired[i].group, desired[i].s);
        for (let i = pool.length; i < desired.length; i++) {
            const d = desired[i];
            const line = new DebugLine(this._loc(d.s, 0), { x: d.s[3], y: d.s[4], z: d.s[5] });
            this._applyLine(line, d.group, d.s);
            debugDrawer.addShape(line);
            pool.push(line);
        }
        for (let i = pool.length - 1; i >= desired.length; i--) {
            pool[i].remove();
            pool.pop();
        }
    }

    _applyAppearance() {
        for (const line of this._pool) {
            const s = [line.location.x, line.location.y, line.location.z,
                line.endLocation.x, line.endLocation.y, line.endLocation.z];
            line.color = this._resolveColor(line.__group, s);
            if (this._visibleTo !== undefined) line.visibleTo = this._visibleTo;
            if (this._maximumRenderDistance !== undefined) line.maximumRenderDistance = this._maximumRenderDistance;
            if (this._attachedTo !== undefined) line.attachedTo = this._attachedTo;
        }
    }

    serialize() {
        return {
            mode: this._mode,
            innerEdge: this._innerEdge,
            outerEdge: this._outerEdge,
            fill: this._fill,
            segmentsOverride: this._segmentsOverride,
            color: this._color,
            dimension: this._dimension,
            visibleTo: this._visibleTo,
            maximumRenderDistance: this._maximumRenderDistance,
            attachedTo: this._attachedTo
        };
    }
}
