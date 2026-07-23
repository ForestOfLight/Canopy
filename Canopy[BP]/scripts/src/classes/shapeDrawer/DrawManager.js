import { DrawableShape } from './DrawableShape';
import { world } from '@minecraft/server';

export class DrawManager {
    static #DP_KEY = 'drawShapes';
    static #instance;

    #drawables = [];

    constructor() {
        this.#drawables = this.#load();
    }

    static getInstance() {
        if (!DrawManager.#instance)
            DrawManager.#instance = new DrawManager();
        return DrawManager.#instance;
    }

    #load() {
        const raw = world.getDynamicProperty(DrawManager.#DP_KEY);
        if (typeof raw !== 'string' || raw.length === 0)
            return [];
        try {
            return JSON.parse(raw).map((obj) => DrawableShape.deserialize(obj));
        } catch {
            return [];
        }
    }

    save() {
        world.setDynamicProperty(DrawManager.#DP_KEY, JSON.stringify(this.#drawables.map((a) => a.serialize())));
    }

    list() {
        return this.#drawables;
    }

    add(drawable) {
        this.#drawables.push(drawable);
        this.save();
    }

    remove(drawable) {
        const index = this.#drawables.indexOf(drawable);
        if (index === -1)
            return;
        this.#drawables.splice(index, 1);
        drawable.destroy();
        this.save();
    }
}
