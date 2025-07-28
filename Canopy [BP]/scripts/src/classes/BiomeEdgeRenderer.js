import { DebugBox, debugDrawer } from "@minecraft/debug-utilities";
import { biomeToHexColorMap, intToBiomeMap } from "../../include/data";
import { hexToRGB } from "../../include/utils";
import { system } from "@minecraft/server";
import { Vector } from "../../lib/Vector";

export class BiomeEdgeRenderer {
    biomeLocations = {};
    shapes = [];
    shouldStop = false;
    drawRunner = null;
    boundingBoxShape;
    analysisColor = { red: 0, green: 0, blue: 1 };
    finishedColor = { red: 0, green: 1, blue: 0 };

    constructor(blockVolume) {
        this.blockVolume = blockVolume;
        this.drawBoundingBox(this.analysisColor);
    }

    destroy() {
        this.shouldStop = true;
        this.shapes.forEach(shape => debugDrawer.removeShape(shape));
        this.shapes = [];
    }

    drawBoundingBox(color) {
        if (this.boundingBoxShape)
            this.boundingBoxShape.remove();
        const boundingBox = new DebugBox(this.blockVolume.getMin());
        boundingBox.bound = this.blockVolume.getSpan();
        boundingBox.color = color;
        this.boundingBoxShape = boundingBox;
        this.drawShape(boundingBox);
    }

    drawBiomeEdges(biomeLocations) {
        this.biomeLocations = biomeLocations;
        this.drawRunner = system.runJob(this.greedyMeshBiomeEdgeLocations());
    }

    *greedyMeshBiomeEdgeLocations() {
        for (let axis = 0; axis < 3; axis++)
            yield* this.drawAxisEdges(axis);
        if (!this.shouldStop)
            this.drawBoundingBox(this.finishedColor);
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
            yield* this.generateMeshFromMask(mask, axis, middleAxis, finalAxis, span, localLocation);
        }
    }

    buildMask(localLocation, middleAxis, finalAxis, span, searchDirection) {
        const mask = [];
        let maskIndex = 0;
        const volumeLocation = this.blockVolume.getMin();
        for (localLocation[finalAxis] = 0; localLocation[finalAxis] < span[finalAxis]; ++localLocation[finalAxis]) {
            for (localLocation[middleAxis] = 0; localLocation[middleAxis] < span[middleAxis]; ++localLocation[middleAxis]) {
                const currentBiome = this.getBiomeAt(
                    localLocation[0] + volumeLocation.x,
                    localLocation[1] + volumeLocation.y,
                    localLocation[2] + volumeLocation.z
                );
                const nextBlockBiome = this.getBiomeAt(
                    localLocation[0] + searchDirection[0] + volumeLocation.x,
                    localLocation[1] + searchDirection[1] + volumeLocation.y,
                    localLocation[2] + searchDirection[2] + volumeLocation.z
                );
                if (currentBiome === void 0 || nextBlockBiome === void 0) {
                    mask[maskIndex++] = false;
                    continue;
                }
                mask[maskIndex++] = currentBiome !== nextBlockBiome;
            }
        }
        return mask;
    }

    *generateMeshFromMask(mask, axis, middleAxis, finalAxis, span, localLocation) {
        let maskIndex = 0;
        for (let finalAxisIndex = 0; finalAxisIndex < span[finalAxis]; ++finalAxisIndex) {
            let middleAxisIndex = 0;
            while (middleAxisIndex < span[middleAxis]) {
                if (this.shouldStop)
                    return;
                if (mask[maskIndex]) {
                    const { quadWidth, quadHeight } = this.findQuad(mask, maskIndex, middleAxisIndex, finalAxisIndex, span, middleAxis, finalAxis);
                    localLocation[middleAxis] = middleAxisIndex;
                    localLocation[finalAxis] = finalAxisIndex;

                    const changeInMiddleAxis = [0, 0, 0];
                    changeInMiddleAxis[middleAxis] = quadWidth;
                    const changeInFinalAxis = [0, 0, 0];
                    changeInFinalAxis[finalAxis] = quadHeight;

                    const worldLocation = Vector.from(this.blockVolume.getMin()).add(new Vector(...localLocation));
                    const box = new DebugBox(worldLocation);
                    box.bound = new Vector(...changeInMiddleAxis).add(new Vector(...changeInFinalAxis));
                    box.color = { red: 1, green: 1, blue: 1 };
                    this.drawShape(box);

                    this.clearMaskOfQuad(mask, maskIndex, quadWidth, quadHeight, span[middleAxis]);
                    middleAxisIndex += quadWidth;
                    maskIndex += quadWidth;
                } else {
                    middleAxisIndex++;
                    maskIndex++;
                }
                yield void 0;
            }
        }
    }

    findQuad(mask, maskIndex, middleAxisIndex, finalAxisIndex, span, middleAxis, finalAxis) {
        let quadWidth = 1;
        while (middleAxisIndex + quadWidth < span[middleAxis] && mask[maskIndex + quadWidth])
            quadWidth++;

        let quadHeight = 1;
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

    getBiomeAt(x, y, z) {
        const biomeLocation = this.biomeLocations[new Vector(x, y, z)];
        if (biomeLocation)
            return biomeLocation.biome;
        return void 0;
    }

    drawShape(shape) {
        this.shapes.push(shape);
        debugDrawer.addShape(shape);
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
}