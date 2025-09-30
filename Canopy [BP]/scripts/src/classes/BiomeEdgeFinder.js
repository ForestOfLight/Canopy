import { BlockVolume, system } from "@minecraft/server";
import { BiomeEdgeRenderer } from "./BiomeEdgeRenderer";
import { Vector } from "../../lib/Vector";

export class BiomeEdgeFinder {
    probeEntityId = 'canopy:probe';
    dimension;
    blockVolume;
    biomeLocations = {}; 
    renderer;
    shouldStop = false;
    populationRunner = null;
    analysisRunner = null;

    constructor(dimension, fromLocation, toLocation) {
        this.dimension = dimension;
        this.blockVolume = new BlockVolume(fromLocation, toLocation);
        this.renderBiomeEdges();
    }

    destroy() {
        this.shouldStop = true;
        this.stopRenderer();
        this.biomeLocations = {};
        this.blockVolume = null;
        this.dimension = null;
        this.renderer = null;
    }

    renderBiomeEdges() {
        this.startRenderer();
        this.populationRunner = system.runJob(this.populateBiomeLocations());
        this.waitForJobCompletion(() => this.populationRunner, () => this.renderer.drawBiomeEdges(this.biomeLocations));
    }

    startRenderer() {
        this.renderer = new BiomeEdgeRenderer(this.blockVolume);
    }

    stopRenderer() {
        if (this.renderer) {
            this.renderer.destroy();
            this.renderer = null;
        }
    }

    *populateBiomeLocations() {
        const blockLocationIterator = this.blockVolume.getBlockLocationIterator();
        let result = blockLocationIterator.next();
        while (!result.done && !this.shouldStop && this.renderer) {
            this.renderer.renderAnalysisLocation(result.value);
            this.addBiomeAtLocation(result.value);
            yield void 0;
            if (this.shouldStop)
                break;
            result = blockLocationIterator.next();
        }
        system.runTimeout(() => {
            this.populationRunner = null;
        }, 2);
    }

    addBiomeAtLocation(location) {
        const vectorLocation = Vector.from(location);
        let biome = '?';
        try {
            biome = this.dimension.getBiome(location);
        } catch {
            console.warn(`Biome not found for location ${vectorLocation.toString()}`);
        }
        this.biomeLocations[vectorLocation] = { location: vectorLocation, biome };
    }

    waitForJobCompletion(jobStatusCallback, completionCallback) {
        const waitRunner = system.runInterval(() => {
            if (this.shouldStop) {
                system.clearRun(waitRunner);
                return;
            }
            if (jobStatusCallback() === null) {
                completionCallback();
                system.clearRun(waitRunner);
            }
        }, 1);
    }
}