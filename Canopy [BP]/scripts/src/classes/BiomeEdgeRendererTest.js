import { DebugBox, debugDrawer, DebugLine } from "@minecraft/debug-utilities";
import { biomeToHexColorMap, intToBiomeMap } from "../../include/data";
import { hexToRGB } from "../../include/utils";
import { system } from "@minecraft/server";
import { Vector } from "../../lib/Vector";

export class BiomeEdgeRendererTest {
    biomeLocations = {};
    shapes = [];
    shouldStop = false;
    drawRunner = null;
    analysisBoundingBoxShape;
    analysisColor = { red: 0, green: 0, blue: 1 };

    constructor(blockVolume) {
        this.blockVolume = blockVolume;
        this.drawAnalysisBoundingBox(this.analysisColor);
    }

    destroy() {
        this.shouldStop = true;
        this.shapes.forEach(shape => debugDrawer.removeShape(shape));
        this.shapes = [];
    }

    drawBiomeEdges(biomeLocations) {
        this.biomeLocations = biomeLocations;
        this.drawBiomedBoundingBox();
        this.drawRunner = system.runJob(this.greedyMeshBiomeEdgeLocations());
    }

    *greedyMeshBiomeEdgeLocations() {
        for (let axis = 0; axis < 3; axis++)
            yield* this.drawAxisEdges(axis);
    }
    
    *drawAxisEdges(axis) {
        const span = [this.blockVolume.getSpan().x, this.blockVolume.getSpan().y, this.blockVolume.getSpan().z];
        const middleAxis = (axis + 1) % 3;
        const finalAxis = (axis + 2) % 3;
        const localLocation = [0, 0, 0];
        const searchDirection = [0, 0, 0];
        searchDirection[axis] = 1;

        localLocation[axis] = -1;
        while (localLocation[axis] < span[axis]) {
            const mask = this.buildMask(localLocation, middleAxis, finalAxis, span, searchDirection);
            yield void 0;
            localLocation[axis]++;
            yield* this.generateMeshFromMask(mask, middleAxis, finalAxis, span, localLocation);
        }
    }

    buildMask(localLocation, middleAxis, finalAxis, span, searchDirection) {
        const mask = [];
        let maskIndex = 0;
        const volumeLocation = this.blockVolume.getMin();
        for (localLocation[finalAxis] = 0; localLocation[finalAxis] < span[finalAxis]; ++localLocation[finalAxis]) {
            for (localLocation[middleAxis] = 0; localLocation[middleAxis] < span[middleAxis]; ++localLocation[middleAxis]) {
                const currentBiome = this.getBiomeAt({
                    x: localLocation[0] + volumeLocation.x,
                    y: localLocation[1] + volumeLocation.y,
                    z: localLocation[2] + volumeLocation.z
                });
                const nextBlockBiome = this.getBiomeAt({
                    x: localLocation[0] + searchDirection[0] + volumeLocation.x,
                    y: localLocation[1] + searchDirection[1] + volumeLocation.y,
                    z: localLocation[2] + searchDirection[2] + volumeLocation.z
                });
                if (currentBiome === void 0 || nextBlockBiome === void 0) {
                    mask[maskIndex++] = false;
                    continue;
                }
                mask[maskIndex++] = currentBiome !== nextBlockBiome;
            }
        }
        return mask;
    }

    *generateMeshFromMask(mask, middleAxis, finalAxis, span, localLocation) {
        let maskIndex = 0;
        let prevLocalLocation = localLocation
        for (let finalAxisIndex = 0; finalAxisIndex < span[finalAxis]; ++finalAxisIndex) {
            let middleAxisIndex = 0;
            let middle = false
            let start = true
            while (middleAxisIndex < span[middleAxis]) {
                if (this.shouldStop)
                    return;
                if ((mask[maskIndex] && !middle))  {
                    const quadWidth = 1
                    const quadHeight = 1
                    localLocation[middleAxis] = middleAxisIndex;
                    localLocation[finalAxis] = finalAxisIndex;

                    // this.drawLine(localLocation, middleAxis, finalAxis, 0, quadHeight, start);
                    if (start) {
                        this.drawQuad(prevLocalLocation, middleAxis, finalAxis, 1, quadHeight, 1)
                        start=false
                    } else {
                        this.drawQuad(localLocation, middleAxis, finalAxis, 0, quadHeight, 0) }
                    this.clearMaskOfQuad(mask, maskIndex, quadWidth, quadHeight, span[middleAxis]);
                    middleAxisIndex += quadWidth;
                    maskIndex += quadWidth;
                    middle = true
                    prevLocalLocation[middleAxis] = localLocation[middleAxis]
                    prevLocalLocation[finalAxis] = localLocation[finalAxis]

                } else if (middle && !mask[maskIndex]){
                    middle = false
                    start = true
                } else if (middle || !mask[maskIndex]){
                    middleAxisIndex++;
                    maskIndex++;
                } 
                yield void 0;
            }
        }
    }



    findQuad(mask, maskIndex, middleAxisIndex, finalAxisIndex, span, middleAxis, finalAxis) {
        let quadWidth = 1;
        let quadHeight = 1;

        while (middleAxisIndex + quadWidth < span[middleAxis] && mask[maskIndex + quadWidth])
            quadWidth++;

        let done = false;
        while (finalAxisIndex + quadHeight < span[finalAxis]) {
            for (let k = 0; k < quadWidth; k++) {
                if (!mask[maskIndex + k + quadHeight * span[middleAxis]]) {
                    done = true;
                    break;
                }
            }
            if (done)
                break;
            quadHeight++;
        }
        

        return { quadWidth, quadHeight };
    }

    clearMaskOfQuad(mask, maskIndex, quadWidth, quadHeight, stride) {
        for (let i = 0; i < quadHeight; i++) {
            for (let j = 0; j < quadWidth; j++)
                mask[maskIndex + j + i * stride] = false;
        }
    }

    drawLines(localLocation, middleAxis, finalAxis, length, start) {
        
        const worldLocation1 = Vector.from(this.blockVolume.getMin()).add(new Vector(...localLocation));
        
        const sidedBox = new DebugLine(worldLocation1, );
        sidedBox.color = { red: 1, green: 0, blue: 0 };
        this.drawShape(sidedBox);
    }

    drawQuad(localLocation, middleAxis, finalAxis, quadWidth, quadHeight, debug) {
        const changeInMiddleAxis = [0, 0, 0];
        changeInMiddleAxis[middleAxis] = quadWidth;
        const changeInFinalAxis = [0, 0, 0];
        changeInFinalAxis[finalAxis] = quadHeight;
        const bound = new Vector(...changeInMiddleAxis).add(new Vector(...changeInFinalAxis));
        
        const worldLocation = Vector.from(this.blockVolume.getMin()).add(new Vector(...localLocation));
        const sidedBox = new DebugBox(worldLocation);
        sidedBox.bound = bound;
        sidedBox.color = { red: debug, green: 1, blue: 0 };
        this.drawShape(sidedBox);
    }

    drawShape(shape) {
        this.shapes.push(shape);
        debugDrawer.addShape(shape);
    }

    getBiomeAt(location) {
        const biomeLocation = this.biomeLocations[Vector.from(location)];
        if (biomeLocation)
            return biomeLocation.biome;
        return void 0;
    }

    getColorByBiome(biome) {
        const biomeName = intToBiomeMap[biome];
        const hexColor = biomeToHexColorMap[biomeName];
        if (!hexColor)
            return { red: 1, green: 1, blue: 1 };
        const biomeRGB = hexToRGB(hexColor);
        return biomeRGB;
    }

    renderAnalysisLocation(location) {
        const tempBox = new DebugBox(location);
        tempBox.color = { red: 1, green: 1, blue: 1 };
        debugDrawer.addShape(tempBox);
        system.runTimeout(() => {
            debugDrawer.removeShape(tempBox);
        }, 1);
    }

    drawAnalysisBoundingBox() {
        if (this.analysisBoundingBoxShape)
            this.analysisBoundingBoxShape.remove();
        const boundingBox = new DebugBox(this.blockVolume.getMin());
        boundingBox.bound = this.blockVolume.getSpan();
        boundingBox.color = this.analysisColor;
        this.analysisBoundingBoxShape = boundingBox;
        this.drawShape(boundingBox);
    }

    drawBiomedBoundingBox() {
        if (this.analysisBoundingBoxShape)
            this.analysisBoundingBoxShape.remove();
        this.getCuboidEdgeShapes().forEach(shape => {
            this.drawShape(shape);
        });
    }
    
    getCuboidEdgeShapes() {
        const min = this.blockVolume.getMin();
        const max = Vector.from(this.blockVolume.getMax()).add({ x: 1, y: 1, z: 1 });
        const vertices = this.getVertices(min, max);
        const edges = this.getEdges();
        const debugLines = [];
        for (const [startIdx, endIdx] of edges) {
            const start = vertices[startIdx];
            const end = vertices[endIdx];
            this.drawLineBetweenVertices(start, end, max, debugLines);
        }
        return debugLines;
    }

    drawLineBetweenVertices(start, end, max, debugLines) {
        const spans = Vector.subtract(end, start);
        const steps = Math.max(Math.abs(spans.x), Math.abs(spans.y), Math.abs(spans.z));
        for (let step = 0; step < steps; step++) {
            const t = steps === 0 ? 0 : step / steps;
            const x = Math.round(start.x + spans.x * t);
            const y = Math.round(start.y + spans.y * t);
            const z = Math.round(start.z + spans.z * t);
            const segmentStart = new Vector(x, y, z);

            const nextX = Math.round(start.x + spans.x * ((step + 1) / steps));
            const nextY = Math.round(start.y + spans.y * ((step + 1) / steps));
            const nextZ = Math.round(start.z + spans.z * ((step + 1) / steps));
            const segmentEnd = new Vector(nextX, nextY, nextZ);

            const color = this.getBiomeColorForLineBetweenVertices(segmentStart, segmentEnd, max);
            const line = new DebugLine(segmentStart, segmentEnd);
            line.color = color;
            debugLines.push(line);
        }
    }

    getBiomeColorForLineBetweenVertices(segmentStart, segmentEnd, max) {
        const inwardOffset = { x: 0, y: 0, z: 0 };
        if (segmentStart.x === max.x || segmentEnd.x === max.x)
            inwardOffset.x = -1;
        if (segmentStart.y === max.y || segmentEnd.y === max.y)
            inwardOffset.y = -1;
        if (segmentStart.z === max.z || segmentEnd.z === max.z)
            inwardOffset.z = -1;
        const biome = this.getBiomeAt(segmentStart.add(inwardOffset));
        return this.getColorByBiome(biome);
    }

    getVertices(min, max) {
        return [
            new Vector(min.x, min.y, min.z),
            new Vector(max.x, min.y, min.z),
            new Vector(max.x, max.y, min.z),
            new Vector(min.x, max.y, min.z),
            new Vector(min.x, min.y, max.z),
            new Vector(max.x, min.y, max.z),
            new Vector(max.x, max.y, max.z),
            new Vector(min.x, max.y, max.z)
        ];
    }

    getEdges() {
        return [ // Arranged in pairs of smaller (closer to min) and larger (closer to max) vertices
            [0, 1], [0, 3], [0, 4],
            [1, 2], [3, 2], [4, 5],
            [5, 6], [7, 6], [4, 7],
            [1, 5], [2, 6], [3, 7]
        ];
    }
}
