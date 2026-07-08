import { system, world } from '@minecraft/server';
import { normalizeCorners, regionCapacity, sameCorner } from './regionMath.js';
import { ExpressionEvaluator } from './ExpressionEvaluator.js';
import { AreaAnalyzer } from './AreaAnalyzer.js';
import { RegionLoader } from './RegionLoader.js';
import { AnalyzeAreaRenderer } from './AnalyzeAreaRenderer.js';

export class Analysis {
    constructor({ id, from, to, dimensionId, expression, createdAt }) {
        const { min, max } = normalizeCorners(from, to);
        this.id = id;
        this.min = min;
        this.max = max;
        this.dimensionId = dimensionId;
        this.expression = expression;
        this.createdAt = createdAt;

        this.matches = [];
        this.renderer = null;
        this.boxesVisible = false;
        this.hasRun = false;
        this.capped = false;
        this.jobId = undefined;
        this.loader = null;
    }

    static create(from, to, dimensionId, expression) {
        const id = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
        return new Analysis({ id, from, to, dimensionId, expression, createdAt: Date.now() });
    }

    serialize() {
        return {
            id: this.id,
            from: this.min,
            to: this.max,
            dimensionId: this.dimensionId,
            expression: this.expression,
            createdAt: this.createdAt
        };
    }

    static deserialize(obj) {
        return new Analysis(obj);
    }

    matchesCoords(from, to, dimensionId) {
        if (dimensionId !== this.dimensionId) return false;
        const { min, max } = normalizeCorners(from, to);
        return sameCorner(min, this.min) && sameCorner(max, this.max);
    }

    capacity() {
        return regionCapacity(this.min, this.max);
    }

    tickingId() {
        return `canopy_analyzearea_${this.id}`;
    }

    #cancelJob() {
        if (this.jobId !== undefined) {
            system.clearJob(this.jobId);
            this.jobId = undefined;
        }
    }

    // Runs inside system.run (unrestricted). Returns a promise resolving when the scan finishes.
    run() {
        const dimension = world.getDimension(this.dimensionId);
        this.dimension = dimension;
        this.#cancelJob();
        if (this.loader) {
            this.loader.unload();
            this.loader = null;
        }
        const loader = new RegionLoader(dimension, this.min, this.max, this.tickingId());
        if (!loader.hasCapacity())
            return Promise.reject(new Error('loadcapacity'));
        this.loader = loader;

        return loader.load().then(() => new Promise((resolve, reject) => {
            let evaluator;
            try {
                evaluator = new ExpressionEvaluator(this.expression);
            } catch (error) {
                loader.unload();
                if (this.loader === loader) this.loader = null;
                reject(error);
                return;
            }
            const analyzer = new AreaAnalyzer(dimension, this.min, this.max, evaluator);
            const self = this;
            function* driver() {
                let error = null;
                try {
                    yield* analyzer.scan();
                    self.matches = analyzer.matches;
                    self.capped = analyzer.capped;
                    self.hasRun = true;
                    self.#refreshRender();
                } catch (thrown) {
                    error = thrown;
                } finally {
                    self.jobId = undefined;
                    loader.unload();
                    if (self.loader === loader) self.loader = null;
                }
                if (error) reject(error);
                else resolve();
            }
            this.jobId = system.runJob(driver());
        }));
    }

    #refreshRender() {
        const wasVisible = this.boxesVisible;
        if (this.renderer) this.renderer.destroy();
        this.renderer = new AnalyzeAreaRenderer(this.dimension, this.matches);
        if (wasVisible) this.renderer.show();
        this.boxesVisible = wasVisible;
    }

    toggleBoxes() {
        if (!this.renderer) return;
        if (this.boxesVisible) this.renderer.hide();
        else this.renderer.show();
        this.boxesVisible = !this.boxesVisible;
    }

    destroy() {
        this.#cancelJob();
        if (this.renderer) this.renderer.destroy();
        if (this.loader) this.loader.unload();
    }
}
