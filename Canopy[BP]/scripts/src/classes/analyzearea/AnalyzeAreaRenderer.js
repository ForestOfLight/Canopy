import { debugDrawer, DebugBox } from '@minecraft/debug-utilities';

const MATCH_COLOR = { red: 0, green: 1, blue: 0, alpha: 1 };

export class AnalyzeAreaRenderer {
    constructor(dimension, locations) {
        this.dimension = dimension;
        this.locations = locations;
        this.debugShapes = [];
        this.visible = false;
    }

    show() {
        if (this.visible) return;
        for (const loc of this.locations) {
            const center = { x: loc.x + 0.5, y: loc.y + 0.5, z: loc.z + 0.5, dimension: this.dimension };
            const box = new DebugBox(center);
            box.bound = { x: 1, y: 1, z: 1 };
            box.color = MATCH_COLOR;
            this.debugShapes.push(box);
            debugDrawer.addShape(box);
        }
        this.visible = true;
    }

    hide() {
        for (const shape of this.debugShapes) shape.remove();
        this.debugShapes = [];
        this.visible = false;
    }

    destroy() {
        this.hide();
    }
}
