import { debugDrawer, DebugBox } from '@minecraft/debug-utilities';
import { Vector } from '../../lib/Vector';

export class HSSRenderer {
    structureBounds;
    hssLocations;
    debugShapes = [];
    
    constructor(structureBounds, hssLocations) {
        this.structureBounds = structureBounds;
        this.hssLocations = hssLocations;
        this.render();
    }

    destroy() {
        this.debugShapes.forEach((shape) => shape.remove());
    }

    render() {
        this.renderBoundingBox();
        this.renderAllHSS();
    }

    renderBoundingBox() {
        const box = new DebugBox(this.structureBounds.getMin());
        box.bound = this.structureBounds.getSize();
        box.color = { red: 1, green: 1, blue: 1 };
        this.renderShape(box);
    }

    renderAllHSS() {
        for (const hss of this.hssLocations)
            this.renderSingleHSS(hss);
    }

    renderSingleHSS(location) {
        const bottom = new Vector(location.x, this.structureBounds.getMin().y, location.z);
        const box = new DebugBox(bottom);
        box.bound = new Vector(1, this.structureBounds.getSize().y, 1);
        box.color = { red: 0, green: 1, blue: 0 };
        this.renderShape(box);
    }

    renderShape(debugShape) {
        this.debugShapes.push(debugShape);
        debugDrawer.addShape(debugShape);
    }
}