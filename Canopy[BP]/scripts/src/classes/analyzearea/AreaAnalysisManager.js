import { world } from '@minecraft/server';
import { Analysis } from './Analysis.js';

export const PROPERTY_KEY = 'areaanalyses';

export class AreaAnalysisManager {
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
        const raw = world.getDynamicProperty(PROPERTY_KEY);
        if (typeof raw !== 'string' || raw.length === 0) return [];
        try {
            return JSON.parse(raw).map((obj) => Analysis.deserialize(obj));
        } catch {
            return [];
        }
    }

    #save() {
        world.setDynamicProperty(PROPERTY_KEY, JSON.stringify(this.analyses.map((a) => a.serialize())));
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
