import { debugDrawer, DebugLine } from "@minecraft/debug-utilities";

const WHITE = { red: 1, green: 1, blue: 1, alpha: 1 };

export class VoxelizableDebugShape {
    #pool = [];
    #groups = null;
    #shown = false;
    #geometryDirty = true;
    #appearanceDirty = true;

    #mode;
    #innerEdge;
    #outerEdge;
    #fill;
    #segmentsOverride;

    #color;
    #dimension;
    #visibleTo;
    #maximumRenderDistance;
    #attachedTo;

    #groupOf = new WeakMap();

    constructor(config = {}) {
        this.#mode = config.mode ?? 'voxel';
        this.#innerEdge = config.innerEdge ?? true;
        this.#outerEdge = config.outerEdge ?? false;
        this.#fill = config.fill ?? false;
        this.#segmentsOverride = config.segments;

        this.#color = config.color;
        this.#dimension = config.dimension;
        this.#visibleTo = config.visibleTo;
        this.#maximumRenderDistance = config.maximumRenderDistance;
        this.#attachedTo = config.attachedTo;
    }

    markGeometryDirty() { this.#geometryDirty = true; }
    markAppearanceDirty() { this.#appearanceDirty = true; }

    get lines() { return this.#pool; }

    // geometry accessors
    get mode() { return this.#mode; }
    set mode(v) { this.#mode = v; this.markGeometryDirty(); }
    get innerEdge() { return this.#innerEdge; }
    set innerEdge(v) { this.#innerEdge = v; this.markGeometryDirty(); }
    get outerEdge() { return this.#outerEdge; }
    set outerEdge(v) { this.#outerEdge = v; this.markGeometryDirty(); }
    get fill() { return this.#fill; }
    set fill(v) { this.#fill = v; this.markGeometryDirty(); }
    get segments() { return this.#segmentsOverride; }
    set segments(v) { this.#segmentsOverride = v; this.markGeometryDirty(); }

    // appearance accessors
    get color() { return this.#color; }
    set color(v) { this.#color = v; this.markAppearanceDirty(); }
    get dimension() { return this.#dimension; }
    set dimension(v) { this.#dimension = v; this.markAppearanceDirty(); }
    get visibleTo() { return this.#visibleTo; }
    set visibleTo(v) { this.#visibleTo = v; this.markAppearanceDirty(); }
    get maximumRenderDistance() { return this.#maximumRenderDistance; }
    set maximumRenderDistance(v) { this.#maximumRenderDistance = v; this.markAppearanceDirty(); }
    get attachedTo() { return this.#attachedTo; }
    set attachedTo(v) { this.#attachedTo = v; this.markAppearanceDirty(); }

    // subclasses override
    computeSegments() { throw new Error('computeSegments() must be implemented'); }

    draw() {
        if (this.#geometryDirty || this.#groups === null) {
            this.#groups = this.computeSegments() || [];
            this.#reconcile();
            this.#geometryDirty = false;
            this.#appearanceDirty = false;
            this.#shown = true;
            return this;
        }
        if (!this.#shown) {
            for (const line of this.#pool) debugDrawer.addShape(line);
            this.#shown = true;
        }
        if (this.#appearanceDirty) {
            this.#applyAppearance();
            this.#appearanceDirty = false;
        }
        return this;
    }

    remove() {
        for (const line of this.#pool) line.remove();
        this.#shown = false;
        return this;
    }

    destroy() {
        for (const line of this.#pool) line.remove();
        this.#pool.length = 0;
        this.#groups = null;
        this.#shown = false;
        return this;
    }

    #loc(s, o) {
        const l = { x: s[o], y: s[o + 1], z: s[o + 2] };
        if (this.#dimension) l.dimension = this.#dimension;
        return l;
    }

    #resolveColor(group, s) {
        const c = this.#color;
        if (typeof c === 'function')
            return c({ x: s[0], y: s[1], z: s[2] }, { x: s[3], y: s[4], z: s[5] });
        if (c && (c.inner || c.outer || c.fill || c.line))
            return c[group] ?? WHITE;
        if (c && c.red !== undefined) return c;
        return WHITE;
    }

    #applyLine(line, group, s) {
        this.#groupOf.set(line, group);
        line.setLocation(this.#loc(s, 0));
        line.endLocation = { x: s[3], y: s[4], z: s[5] };
        line.color = this.#resolveColor(group, s);
        if (this.#visibleTo !== undefined) line.visibleTo = this.#visibleTo;
        if (this.#maximumRenderDistance !== undefined) line.maximumRenderDistance = this.#maximumRenderDistance;
        if (this.#attachedTo !== undefined) line.attachedTo = this.#attachedTo;
    }

    #reconcile() {
        const desired = [];
        for (const grp of this.#groups) {
            for (let i = 0; i < grp.segments.length; i += 6)
                desired.push({ group: grp.group, s: grp.segments.slice(i, i + 6) });
        }

        const pool = this.#pool;
        const reuse = Math.min(pool.length, desired.length);
        // When hidden (after remove()), reused lines were detached from the drawer
        // and must be re-added; newly constructed lines below are added on creation.
        const readdReused = !this.#shown;
        for (let i = 0; i < reuse; i++) {
            this.#applyLine(pool[i], desired[i].group, desired[i].s);
            if (readdReused) debugDrawer.addShape(pool[i]);
        }
        for (let i = pool.length; i < desired.length; i++) {
            const d = desired[i];
            const line = new DebugLine(this.#loc(d.s, 0), { x: d.s[3], y: d.s[4], z: d.s[5] });
            this.#applyLine(line, d.group, d.s);
            debugDrawer.addShape(line);
            pool.push(line);
        }
        for (let i = pool.length - 1; i >= desired.length; i--) {
            pool[i].remove();
            pool.pop();
        }
    }

    #applyAppearance() {
        for (const line of this.#pool) {
            const s = [line.location.x, line.location.y, line.location.z,
                line.endLocation.x, line.endLocation.y, line.endLocation.z];
            line.setLocation(this.#loc(s, 0));
            line.color = this.#resolveColor(this.#groupOf.get(line), s);
            if (this.#visibleTo !== undefined) line.visibleTo = this.#visibleTo;
            if (this.#maximumRenderDistance !== undefined) line.maximumRenderDistance = this.#maximumRenderDistance;
            if (this.#attachedTo !== undefined) line.attachedTo = this.#attachedTo;
        }
    }
}
