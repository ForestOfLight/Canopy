import { debugDrawer, DebugLine } from "@minecraft/debug-utilities";

const WHITE = { red: 1, green: 1, blue: 1, alpha: 1 };

function idOf(value) {
    if (value !== null && typeof value === 'object' && value.id !== undefined)
        return value.id;
    return value;
}

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

    #groupOfLine = new WeakMap();

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

    get mode() { return this.#mode; }
    set mode(value) { this.#mode = value; this.markGeometryDirty(); }
    get innerEdge() { return this.#innerEdge; }
    set innerEdge(value) { this.#innerEdge = value; this.markGeometryDirty(); }
    get outerEdge() { return this.#outerEdge; }
    set outerEdge(value) { this.#outerEdge = value; this.markGeometryDirty(); }
    get fill() { return this.#fill; }
    set fill(value) { this.#fill = value; this.markGeometryDirty(); }
    get segments() { return this.#segmentsOverride; }
    set segments(value) { this.#segmentsOverride = value; this.markGeometryDirty(); }

    get color() { return this.#color; }
    set color(value) { this.#color = value; this.markAppearanceDirty(); }
    get dimension() { return this.#dimension; }
    set dimension(value) { this.#dimension = value; this.markAppearanceDirty(); }
    get visibleTo() { return this.#visibleTo; }
    set visibleTo(value) { this.#visibleTo = value; this.markAppearanceDirty(); }
    get maximumRenderDistance() { return this.#maximumRenderDistance; }
    set maximumRenderDistance(value) { this.#maximumRenderDistance = value; this.markAppearanceDirty(); }
    get attachedTo() { return this.#attachedTo; }
    set attachedTo(value) { this.#attachedTo = value; this.markAppearanceDirty(); }

    computeSegments() { throw new Error('computeSegments() must be implemented'); }

    get type() { throw new Error('type getter must be implemented'); }

    serialize() {
        const config = {
            type: this.type,
            mode: this.mode,
            innerEdge: this.innerEdge,
            outerEdge: this.outerEdge,
            fill: this.fill
        };
        if (this.segments !== undefined)
            config.segments = this.segments;
        const color = this.color;
        if (typeof color === 'function')
            config.color = { fn: color.toString() };
        else if (color !== undefined)
            config.color = color;
        if (this.dimension !== undefined)
            config.dimension = idOf(this.dimension);
        if (this.attachedTo !== undefined)
            config.attachedTo = idOf(this.attachedTo);
        if (this.visibleTo !== undefined)
            config.visibleTo = this.visibleTo.map((viewer) => idOf(viewer));
        return config;
    }

    serializeGeometry(config, propertyNames) {
        for (const propertyName of propertyNames) {
            const value = this[propertyName];
            if (value !== undefined)
                config[propertyName] = value;
        }
        return config;
    }

    static reviveConfig(config) {
        if (!config || typeof config.color !== 'object' || config.color === null
            || typeof config.color.fn !== 'string')
            return config;
        const revived = { ...config };
        try {
            revived.color = new Function(`return (${config.color.fn});`)();
        } catch {
            delete revived.color;
        }
        return revived;
    }

    static deserialize(config) {
        return new this(VoxelizableDebugShape.reviveConfig(config));
    }

    static vectorField(key, optional = false) {
        return { key, kind: 'vector', axes: ['x', 'y', 'z'], optional };
    }

    static numberField(key, optional = false) {
        return { key, kind: 'number', optional };
    }

    static get modeField() {
        return { key: 'mode', kind: 'enum', options: ['voxel', 'smooth'], default: 'voxel' };
    }

    static get edgeFields() {
        return [
            { key: 'innerEdge', kind: 'boolean', default: true },
            { key: 'outerEdge', kind: 'boolean', default: false },
            { key: 'fill', kind: 'boolean', default: false }
        ];
    }

    static get segmentsField() {
        return { key: 'segments', kind: 'number', optional: true };
    }

    static get colorField() {
        return { key: 'color', kind: 'vector', axes: ['red', 'green', 'blue', 'alpha'], optional: true };
    }

    static get configSchema() { throw new Error('configSchema must be implemented'); }

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
            for (const line of this.#pool)
                debugDrawer.addShape(line);
            this.#shown = true;
        }
        if (this.#appearanceDirty) {
            this.#applyAppearance();
            this.#appearanceDirty = false;
        }
        return this;
    }

    remove() {
        for (const line of this.#pool)
            line.remove();
        this.#shown = false;
        return this;
    }

    destroy() {
        for (const line of this.#pool)
            line.remove();
        this.#pool.length = 0;
        this.#groups = null;
        this.#shown = false;
        return this;
    }

    #toLocation(segment, offset) {
        const location = { x: segment[offset], y: segment[offset + 1], z: segment[offset + 2] };
        if (this.#dimension)
            location.dimension = this.#dimension;
        return location;
    }

    #resolveColor(group, segment) {
        const color = this.#color;
        if (typeof color === 'function')
            return color({ x: segment[0], y: segment[1], z: segment[2] }, { x: segment[3], y: segment[4], z: segment[5] });
        if (color && (color.inner || color.outer || color.fill || color.line))
            return color[group] ?? WHITE;
        if (color && color.red !== undefined)
            return color;
        return WHITE;
    }

    #applyLine(line, group, segment) {
        this.#groupOfLine.set(line, group);
        line.setLocation(this.#toLocation(segment, 0));
        line.endLocation = { x: segment[3], y: segment[4], z: segment[5] };
        line.color = this.#resolveColor(group, segment);
        if (this.#visibleTo !== undefined)
            line.visibleTo = this.#visibleTo;
        if (this.#maximumRenderDistance !== undefined)
            line.maximumRenderDistance = this.#maximumRenderDistance;
        if (this.#attachedTo !== undefined)
            line.attachedTo = this.#attachedTo;
    }

    #reconcile() {
        const desiredLines = [];
        for (const segmentGroup of this.#groups) {
            for (let offset = 0; offset < segmentGroup.segments.length; offset += 6)
                desiredLines.push({ group: segmentGroup.group, segment: segmentGroup.segments.slice(offset, offset + 6) });
        }

        const pool = this.#pool;
        const reuseCount = Math.min(pool.length, desiredLines.length);
        const mustReaddReusedLines = !this.#shown;
        for (let index = 0; index < reuseCount; index++) {
            this.#applyLine(pool[index], desiredLines[index].group, desiredLines[index].segment);
            if (mustReaddReusedLines)
                debugDrawer.addShape(pool[index]);
        }
        for (let index = pool.length; index < desiredLines.length; index++) {
            const desired = desiredLines[index];
            const line = new DebugLine(this.#toLocation(desired.segment, 0), { x: desired.segment[3], y: desired.segment[4], z: desired.segment[5] });
            this.#applyLine(line, desired.group, desired.segment);
            debugDrawer.addShape(line);
            pool.push(line);
        }
        for (let index = pool.length - 1; index >= desiredLines.length; index--) {
            pool[index].remove();
            pool.pop();
        }
    }

    #applyAppearance() {
        for (const line of this.#pool) {
            const segment = [line.location.x, line.location.y, line.location.z,
                line.endLocation.x, line.endLocation.y, line.endLocation.z];
            line.setLocation(this.#toLocation(segment, 0));
            line.color = this.#resolveColor(this.#groupOfLine.get(line), segment);
            if (this.#visibleTo !== undefined)
                line.visibleTo = this.#visibleTo;
            if (this.#maximumRenderDistance !== undefined)
                line.maximumRenderDistance = this.#maximumRenderDistance;
            if (this.#attachedTo !== undefined)
                line.attachedTo = this.#attachedTo;
        }
    }
}
