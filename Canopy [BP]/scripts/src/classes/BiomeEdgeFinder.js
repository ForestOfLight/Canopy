import { BlockVolume, system } from "@minecraft/server";
import { BiomeEdgeRenderer } from "./BiomeEdgeRenderer";
import { Vector } from "../../lib/Vector";

export class BiomeEdgeFinder {
    dimension;
    blockVolume;
    probeEntityId = 'canopy:probe';
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
        this.populationRunner = null;
    }

    addBiomeAtLocation(location) {
        const probeEntity = this.createProbeEntity(location);
        system.runTimeout(() => {
            if (probeEntity?.isValid) {
                const vectorLocation = Vector.from(location);
                this.biomeLocations[vectorLocation] = { location: vectorLocation, biome: probeEntity.getProperty('canopy:biome') };
                probeEntity.remove();
            }
        }, 2);
    }
    
    createProbeEntity(location) {
        try {
            return this.dimension.spawnEntity(this.probeEntityId, location);
        } catch (error) {
            if (['LocationOutOfWorldBoundariesError', 'LocationInUnloadedChunkError'].includes(error.name))
                return void 0;
            throw error;
        }
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