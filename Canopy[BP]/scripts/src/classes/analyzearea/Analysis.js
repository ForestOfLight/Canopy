import { system, world } from '@minecraft/server';
import { normalizeCorners, regionCapacity, sameCorner } from './regionMath.js';
import { ExpressionEvaluator } from './ExpressionEvaluator.js';
import { AreaAnalyzer } from './AreaAnalyzer.js';
import { RegionLoader } from './RegionLoader.js';
import { AnalyzeAreaRenderer } from './AnalyzeAreaRenderer.js';
import { stringifyLocation } from '../../../include/utils';

export const LOAD_CAPACITY_ERROR = 'loadcapacity';

export function analysisErrorMessage(error) {
    if (error?.message === LOAD_CAPACITY_ERROR)
        return { translate: 'commands.analyzearea.loadcapacity' };
    console.warn('[Canopy] AnalyzeArea error:', error, error?.stack);
    return { translate: 'commands.analyzearea.unknownerror' };
}

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
        this.renderer = void 0;
        this.boxesVisible = true;
        this.hasRun = false;
        this.capped = false;
        this.jobId = void 0;
        this.loader = void 0;
        this.running = false;
        this.progress = 0;
        this.subscribers = new Set();
    }

    subscribe(handlers) {
        this.subscribers.add(handlers);
        return () => this.subscribers.delete(handlers);
    }

    #emit(event, arg) {
        for (const handlers of [...this.subscribers]) {
            try {
                handlers[event]?.(arg);
            } catch {
                this.subscribers.delete(handlers);
            }
        }
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
        if (this.jobId !== void 0) {
            system.clearJob(this.jobId);
            this.jobId = void 0;
        }
    }

    #initializeLoader(dimension) {
        if (this.loader) {
            this.loader.unload();
            this.loader = void 0;
        }
        const loader = new RegionLoader(dimension, this.min, this.max, this.tickingId());
        if (!loader.hasCapacity())
            return void 0;
        this.loader = loader;
        return loader;
    }

    #createDriver(analyzer, loader, onProgress, total, resolve, reject) {
        const self = this;
        function* driver() {
            let error = null;
            try {
                for (const scan = analyzer.scan(); !scan.next().done;) {
                    if (onProgress)
                        onProgress(Math.min(analyzer.scanned / total, 1));
                    yield;
                }
                self.matches = analyzer.matches;
                self.capped = analyzer.capped;
                self.hasRun = true;
                if (onProgress)
                    onProgress(1);
                self.running = false;
                self.#finishRender();
            } catch (thrown) {
                error = thrown;
            } finally {
                self.jobId = undefined;
                loader.unload();
                if (self.loader === loader)
                    self.loader = void 0;
            }
            if (error)
                reject(error);
            else
                resolve();
        }
        return driver;
    }

    run(onProgress) {
        const dimension = world.getDimension(this.dimensionId);
        this.dimension = dimension;
        this.#cancelJob();
        const loader = this.#initializeLoader(dimension);
        if (!loader) {
            const error = new Error(LOAD_CAPACITY_ERROR);
            this.#fail(error);
            return Promise.reject(error);
        }
        this.running = true;
        this.progress = 0;
        this.#beginRender();
        const progress = (fraction) => {
            this.progress = fraction;
            this.#syncText();
            if (onProgress)
                onProgress(fraction);
            this.#emit('onProgress', fraction);
        };
        return loader.load().then(() => new Promise((resolve, reject) => {
            let evaluator;
            try {
                evaluator = new ExpressionEvaluator(this.expression);
            } catch (error) {
                loader.unload();
                if (this.loader === loader)
                    this.loader = void 0;
                this.#fail(error);
                reject(error);
                return;
            }
            const analyzer = new AreaAnalyzer(dimension, this.min, this.max, evaluator);
            const total = regionCapacity(this.min, this.max);
            const done = () => { this.running = false; this.#emit('onDone'); resolve(); };
            const fail = (error) => { this.#fail(error); reject(error); };
            const driver = this.#createDriver(analyzer, loader, progress, total, done, fail);
            this.jobId = system.runJob(driver());
        }));
    }

    #beginRender() {
        if (this.renderer)
            this.renderer.destroy();
        this.renderer = new AnalyzeAreaRenderer(this.dimension, this.min, this.max, [], this.statusMessage());
        this.renderer.showOutline();
    }

    #syncText() {
        if (this.renderer)
            this.renderer.setText(this.statusMessage());
    }

    #finishRender() {
        if (!this.renderer)
            return;
        this.renderer.locations = this.matches;
        this.#syncText();
        if (this.boxesVisible)
            this.renderer.showMatches();
    }

    #fail(error) {
        this.running = false;
        if (this.renderer) {
            this.renderer.destroy();
            this.renderer = void 0;
        }
        this.#emit('onError', error);
    }

    statusMessage() {
        const from = stringifyLocation(this.min, 0);
        const to = stringifyLocation(this.max, 0);
        if (this.running) {
            const pct = `${Math.floor(this.progress * 100)}%`;
            return { translate: 'commands.analyzearea.stats.analyzing', with: [from, to, this.expression, pct] };
        }
        if (!this.hasRun)
            return { translate: 'commands.analyzearea.ui.page.notrun' };
        const size = `${this.max.x - this.min.x + 1}x${this.max.y - this.min.y + 1}x${this.max.z - this.min.z + 1}`;
        const key = this.capped ? 'commands.analyzearea.stats.capped' : 'commands.analyzearea.stats';
        return { translate: key, with: [from, to, this.expression, String(this.matches.length), size] };
    }

    toggleBoxes() {
        if (!this.renderer)
            return;
        if (this.boxesVisible)
            this.renderer.hideMatches();
        else
            this.renderer.showMatches();
        this.boxesVisible = !this.boxesVisible;
    }

    destroy() {
        this.#cancelJob();
        if (this.renderer)
            this.renderer.destroy();
        if (this.loader)
            this.loader.unload();
    }
}
