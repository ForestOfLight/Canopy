import { deserializeShape, validateShapeConfig } from '../../../lib/VoxelizableDebugShapes/index.js';

export class DrawableShape {
    name;
    #isRendered;
    #voxelizableDebugShape;

    constructor(name, config) {
        this.name = name;
        this.#isRendered = false;
        this.#voxelizableDebugShape = this.#createVoxelizableDebugShape(config);
    }

    destroy() {
        this.#voxelizableDebugShape.destroy();
    }

    get isRendered() {
        return this.#isRendered;
    }

    render() {
        this.#voxelizableDebugShape.draw();
        this.#isRendered = true;
    }

    hide() {
        this.#voxelizableDebugShape.remove();
        this.#isRendered = false;
    }

    serialize() {
        return {
            name: this.name,
            config: this.#voxelizableDebugShape.serialize()
        };
    }

    static deserialize(obj) {
        return new DrawableShape(obj.name, obj.config);
    }

    static tryCreate(name, config) {
        if (!DrawableShape.isValidConfig(config))
            return { ok: false, reason: 'invalid' };
        return { ok: true, drawableShape: new DrawableShape(name, config) };
    }

    tryUpdate(newConfig, shouldRender) {
        if (!DrawableShape.isValidConfig(newConfig))
            return { ok: false, reason: 'invalid' };
        const wasRendered = this.#isRendered;
        this.#voxelizableDebugShape.destroy();
        this.#voxelizableDebugShape = this.#createVoxelizableDebugShape(newConfig);
        if (wasRendered && !shouldRender)
            this.hide();
        else if (shouldRender)
            this.render();
        return { ok: true };
    }

    static isValidConfig(config) {
        return validateShapeConfig(config);
    }

    #createVoxelizableDebugShape(config) {
        return deserializeShape(config);
    }
}
