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
        this.populateBiomeEdges();
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

    populateBiomeEdges() {
        const blockLocationIterator = this.blockVolume.getBlockLocationIterator();
        this.populationRunner = system.runJob(this.populateBiomeLocations(blockLocationIterator));
        this.waitForJobCompletion(() => this.populationRunner, () => this.startAnalysis());
    }

    startAnalysis() {
        this.analysisRunner = system.runJob(this.analyzeBiomeEdges());
        this.waitForJobCompletion(() => this.analysisRunner, () => this.renderer.drawBiomeEdges());
    }

    *populateBiomeLocations(blockLocationIterator) {
        let result = blockLocationIterator.next();
        while (!result.done && !this.shouldStop && this.renderer) {
            this.renderer.renderAnalysisLocationOneTick(result.value);
            this.addBiomeAtLocation(result.value);
            yield void 0;
            if (this.shouldStop)
                break;
            result = blockLocationIterator.next();
        }
        this.populationRunner = null;
    }
    
    *analyzeBiomeEdges() {
        const biomeLocations = Object.values(this.biomeLocations);
        for (const biomeLocation of biomeLocations) {
            this.renderer.renderAnalysisLocationOneTick(biomeLocation.location);
            if (biomeLocation.biome && this.isBiomeEdge(biomeLocation.location, biomeLocation.biome))
                this.renderer.addBiomeEdgeLocation(biomeLocation);
            yield void 0;
            if (this.shouldStop)
                break;
        }
        this.analysisRunner = null;
    }

    isBiomeEdge(location, biome) {
        const adjacentOffsets = [Vector.up, Vector.down, Vector.left, Vector.right, Vector.forward, Vector.backward];
        for (const offset of adjacentOffsets) {
            const adjacentLocation = Vector.from(location).add(offset);
            const adjacentBiome = this.biomeLocations[adjacentLocation];
            if (adjacentBiome?.biome !== void 0 && adjacentBiome.biome !== biome)
                return true;
        }
        return false;
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