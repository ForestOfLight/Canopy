import { world } from '@minecraft/server';
import { Analysis } from './Analysis.js';

export class AreaAnalysisManager {
    static #DP_KEY = 'areaanalyses';
    static #instance;

    constructor() {
        this.analyses = this.#load();
    }

    static getInstance() {
        if (!AreaAnalysisManager.#instance)
            AreaAnalysisManager.#instance = new AreaAnalysisManager();
        return AreaAnalysisManager.#instance;
    }

    #load() {
        const raw = world.getDynamicProperty(AreaAnalysisManager.#DP_KEY);
        if (typeof raw !== 'string' || raw.length === 0)
            return [];
        try {
            return JSON.parse(raw).map((obj) => Analysis.deserialize(obj));
        } catch {
            return [];
        }
    }

    #save() {
        world.setDynamicProperty(AreaAnalysisManager.#DP_KEY, JSON.stringify(this.analyses.map((a) => a.serialize())));
    }

    list() {
        return this.analyses;
    }

    add(analysis) {
        this.analyses.push(analysis);
        this.#save();
    }

    remove(analysis) {
        const index = this.analyses.indexOf(analysis);
        if (index === -1) return;
        this.analyses.splice(index, 1);
        analysis.destroy();
        this.#save();
    }

    findByCoords(from, to, dimensionId) {
        return this.analyses.find((a) => a.matchesCoords(from, to, dimensionId));
    }
}
