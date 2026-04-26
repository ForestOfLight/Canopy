import { debugDrawer, DebugBox, DebugLine } from "@minecraft/debug-utilities";

export class EndGatewayExitRender {
    debugShapes = [];
    SEARCH_AREA_SIZE = 16;

    constructor(player, dimension, location) {
        this.player = player;
        this.dimension = dimension;
        this.location = location;
        this.render();
    }

    destroy() {
        for(const shape of this.debugShapes)
            shape.remove();
        this.debugShapes.length = 0;
    }

    render() {
        this.drawExit();
        this.drawSearchArea();
    }

    drawExit() {
        const center = { x: this.location.x + 0.5, y: this.location.y + 0.5, z: this.location.z + 0.5 };
        const box = new DebugBox(center);
        box.color = { r: 1, g: 1, b: 0, a: 1 };
        this.drawShape(box);
    }

    drawSearchArea() {
        const halfSize = this.SEARCH_AREA_SIZE / 2;
        const corners = [
            { x: this.location.x - halfSize, y: this.location.y, z: this.location.z - halfSize },
            { x: this.location.x - halfSize, y: this.location.y, z: this.location.z + halfSize },
            { x: this.location.x + halfSize, y: this.location.y, z: this.location.z + halfSize },
            { x: this.location.x + halfSize, y: this.location.y, z: this.location.z - halfSize }
        ];
        for (let i = 0; i < corners.length; i++) {
            const start = corners[i];
            const end = corners[(i + 1) % corners.length];
            const line = new DebugLine(start, end);
            line.color = { r: 0, g: 1, b: 0, a: 1 };
            this.drawShape(line);
        }
    }

    drawShape(shape) {
        shape.visibleTo = [this.player];
        debugDrawer.addShape(shape, this.dimension);
        this.debugShapes.push(shape);
    }
}