import { DebugBox, debugDrawer } from "@minecraft/debug-utilities";
import { biomeToHexColorMap, intToBiomeMap } from "../../include/data";
import { hexToRGB } from "../../include/utils";
import { system } from "@minecraft/server";

export class BiomeEdgeRenderer {
    biomeEdgeLocations = [];
    centerpointLocation;
    shapes = [];
    shouldStop = false;
    drawRunner = null;

    constructor(blockVolume) {
        this.blockVolume = blockVolume;
        this.drawBoundingBox();
    }

    destroy() {
        this.shouldStop = true;
        this.shapes.forEach(shape => debugDrawer.removeShape(shape));
        this.shapes = [];
        this.biomeEdgeLocations = [];
        this.centerpointLocation = null;
        this.renderer = null;
    }

    addBiomeEdgeLocation(location) {
        this.biomeEdgeLocations.push(location);
    }

    drawBoundingBox() {
        const boundingBox = new DebugBox(this.blockVolume.getMin());
        boundingBox.bound = this.blockVolume.getSpan();
        boundingBox.color = { red: 1, green: 0, blue: 0 };
        this.drawShape(boundingBox);
    }

    drawBiomeEdges() {
        this.drawRunner = system.runJob(this.drawBiomeEdgeLocations());
    }

    *drawBiomeEdgeLocations() {
        for (const biomeEdgeLocation of this.biomeEdgeLocations) {
            const edgeBox = new DebugBox(biomeEdgeLocation.location);
            edgeBox.color = this.getColorByBiome(biomeEdgeLocation.biome);
            this.drawShape(edgeBox);
            yield void 0;
            if (this.shouldStop) {
                system.clearJob(this.drawRunner);
                return;
            }
        }
    }

    drawShape(shape) {
        this.shapes.push(shape);
        debugDrawer.addShape(shape);
    }

    getColorByBiome(biome) {
        const biomeName = intToBiomeMap[biome];
        const biomeRGB = hexToRGB(biomeToHexColorMap[biomeName]);
        return biomeRGB || { red: 0, green: 0, blue: 0 };
    }

    renderAnalysisLocationOneTick(location) {
        const tempBox = new DebugBox(location);
        tempBox.color = { red: 1, green: 1, blue: 1 };
        debugDrawer.addShape(tempBox);
        system.runTimeout(() => {
            debugDrawer.removeShape(tempBox);
        }, 1);
    }
}