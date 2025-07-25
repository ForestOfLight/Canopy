import { debugDrawer, DebugLine } from "@minecraft/debug-utilities";
import { Vector } from "../../lib/Vector";

export class ChunkBorderRender {
    CHUNK_SIZE = 16;
    location;
    debugShapes;

    constructor(location) {
        this.location = location;
        this.debugShapes = [];
        this.render();
    }

    destroy() {
        this.debugShapes.forEach(shape => {
            debugDrawer.removeShape(shape);
        });
        this.debugShapes = [];
    }

    render() {
        const subChunkCoords = this.getSubChunkWorldCoords(this.location);
        this.renderCenterSubChunk(subChunkCoords);
        this.renderAdjacentChunks(subChunkCoords);
    }

    renderCenterSubChunk(subChunkCoords) {
        this.renderHorizontalLines(subChunkCoords);
        this.renderVerticalLines(subChunkCoords);
    }
    
    renderAdjacentChunks(subChunkCoords) {
        this.renderAdjacentChunkLinesAlongFace(subChunkCoords.add({ x: 0, y: 0, z: -this.CHUNK_SIZE }), subChunkCoords.x, true);
        this.renderAdjacentChunkLinesAlongFace(subChunkCoords.add({ x: this.CHUNK_SIZE*2, y: 0, z: 0 }), subChunkCoords.z, false);
        this.renderAdjacentChunkLinesAlongFace(subChunkCoords.add({ x: 0, y: 0, z: this.CHUNK_SIZE*2 }), subChunkCoords.x - this.CHUNK_SIZE, true);
        this.renderAdjacentChunkLinesAlongFace(subChunkCoords.add({ x: -this.CHUNK_SIZE, y: 0, z: 0 }), subChunkCoords.z - this.CHUNK_SIZE, false);
    }

    renderHorizontalLines(subChunkCoords) {
        for (let y = this.getLowerBound(subChunkCoords); y < this.getUpperBound(subChunkCoords); y += 2)
            this.renderHorizontalLinesLayer(subChunkCoords, y);
    }

    renderHorizontalLinesLayer(subChunkCoords, y) {
        if ((y < subChunkCoords.y - this.CHUNK_SIZE || y > subChunkCoords.y + this.CHUNK_SIZE*2) && (y % this.CHUNK_SIZE !== 0))
            return;
        let color = void 0;
        if (y % this.CHUNK_SIZE === 0)
            color = { red: 0, green: 0, blue: 255 };
        this.renderLine(new Vector(subChunkCoords.x, y, subChunkCoords.z), new Vector(subChunkCoords.x + this.CHUNK_SIZE, y, subChunkCoords.z), color);
        this.renderLine(new Vector(subChunkCoords.x, y, subChunkCoords.z + this.CHUNK_SIZE), new Vector(subChunkCoords.x + this.CHUNK_SIZE, y, subChunkCoords.z + this.CHUNK_SIZE), color);
        this.renderLine(new Vector(subChunkCoords.x, y, subChunkCoords.z), new Vector(subChunkCoords.x, y, subChunkCoords.z + this.CHUNK_SIZE), color);
        this.renderLine(new Vector(subChunkCoords.x + this.CHUNK_SIZE, y, subChunkCoords.z), new Vector(subChunkCoords.x + this.CHUNK_SIZE, y, subChunkCoords.z + this.CHUNK_SIZE), color);
    }

    renderVerticalLines(subChunkCoords) {
        this.renderVerticalLinesAlongFace(subChunkCoords, subChunkCoords.x, true);
        this.renderVerticalLinesAlongFace(subChunkCoords, subChunkCoords.z, false);
        this.renderVerticalLinesAlongFace(subChunkCoords.add({ x: 0, y: 0, z: this.CHUNK_SIZE }), subChunkCoords.x, true);
        this.renderVerticalLinesAlongFace(subChunkCoords.add({ x: this.CHUNK_SIZE, y: 0, z: 0 }), subChunkCoords.z, false);
    }

    renderVerticalLinesAlongFace(subChunkCoords, iterableCoord, isX) {
        for (let coord = iterableCoord; coord <= iterableCoord + this.CHUNK_SIZE; coord += 2) {
            let color = void 0;
            let bottomY = subChunkCoords.y - this.CHUNK_SIZE;
            let topY = subChunkCoords.y + this.CHUNK_SIZE*2;
            if (coord % this.CHUNK_SIZE === 0) {
                color = { red: 0, green: 0, blue: 255 };
                bottomY = this.getLowerBound(subChunkCoords);
                topY = this.getUpperBound(subChunkCoords);
            }
            if (isX)
                this.renderLine(new Vector(coord, bottomY, subChunkCoords.z), new Vector(coord, topY, subChunkCoords.z), color);
            else
                this.renderLine(new Vector(subChunkCoords.x, bottomY, coord), new Vector(subChunkCoords.x, topY, coord), color);
        }
    }

    renderAdjacentChunkLinesAlongFace(subChunkCoords, iterableCoord, isX) {
        for (let coord = iterableCoord; coord <= iterableCoord + this.CHUNK_SIZE * 2; coord += this.CHUNK_SIZE) {
            const color = { red: 255, green: 0, blue: 0 };
            if (isX)
                this.renderLine(new Vector(coord, this.getLowerBound(subChunkCoords), subChunkCoords.z), new Vector(coord, this.getUpperBound(subChunkCoords), subChunkCoords.z), color);
            else
                this.renderLine(new Vector(subChunkCoords.x, this.getLowerBound(subChunkCoords), coord), new Vector(subChunkCoords.x, this.getUpperBound(subChunkCoords), coord), color);
        }
    }

    renderLine(start, end, color = { red: 255, green: 255, blue: 0 }) {
        const line = new DebugLine(start, end);
        line.color = color;
        this.drawShape(line);
    }

    drawShape(shape) {
        debugDrawer.addShape(shape);
        this.debugShapes.push(shape);
    }

    getSubChunkWorldCoords(location) {
        return Vector.from(location).divide(this.CHUNK_SIZE).floor().multiply(this.CHUNK_SIZE);
    }

    getLowerBound(subChunkCoords) {
        return subChunkCoords.y - this.CHUNK_SIZE * 10;
    }

    getUpperBound(subChunkCoords) {
        return subChunkCoords.y + this.CHUNK_SIZE * 10;
    }
}