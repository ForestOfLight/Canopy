import { debugDrawer, DebugBox, DebugLine } from "@minecraft/debug-utilities";
import { Vector } from "../../lib/Vector";

export class EndGatewayExitRender {
    debugShapes = [];

    constructor(dimension, location, searchAreaSize) {
        this.dimension = dimension;
        this.location = Vector.from(location).floor();
        this.searchAreaSize = searchAreaSize ?? 1;
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
        const center = this.location.add(new Vector(0.5, 0.5, 0.5));
        const box = new DebugBox(center);
        box.color = { red: 1, green: 1, blue: 0, alpha: 1 };
        this.drawShape(box);
    }

    drawSearchArea() {
        const halfSize = this.searchAreaSize / 2;
        const corners = [
            { x: this.location.x - halfSize, y: this.location.y, z: this.location.z - halfSize },
            { x: this.location.x - halfSize, y: this.location.y, z: this.location.z + halfSize },
            { x: this.location.x + halfSize, y: this.location.y, z: this.location.z + halfSize },
            { x: this.location.x + halfSize, y: this.location.y, z: this.location.z - halfSize }
        ];
        for (let i = 0; i < corners.length; i++) {
            this.drawCornerToCornerLine(corners, i);
            this.drawEnclosingBox();
        }
    }

    drawCornerToCornerLine(corners, i) {
        const start = corners[i];
        const end = corners[(i + 1) % corners.length];
        const line = new DebugLine(start, end);
        line.color = { red: 0, green: 1, blue: 0, alpha: 1 };
        this.drawShape(line);
    }

    drawEnclosingBox() {
        const box = new DebugBox(this.location);
        box.color = { red: 0, green: 1, blue: 0, alpha: 0.5 };
        box.bound = { x: this.searchAreaSize, y: this.searchAreaSize * 2, z: this.searchAreaSize };
        this.drawShape(box);
    }

    drawShape(shape) {
        debugDrawer.addShape(shape, this.dimension);
        this.debugShapes.push(shape);
    }
}