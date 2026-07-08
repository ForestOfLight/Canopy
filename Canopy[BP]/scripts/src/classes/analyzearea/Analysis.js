import { system, world } from '@minecraft/server';
import { ExpressionEvaluator } from './ExpressionEvaluator.js';
import { ExpressionForbiddenError } from './ExpressionForbiddenError.js';
import { LoadCapacityError } from './LoadCapacityError.js';
import { AreaAnalyzer, SCAN_CAP } from './AreaAnalyzer.js';
import { RegionLoader } from '../RegionLoader.js';
import { AnalyzeAreaRenderer } from './AnalyzeAreaRenderer.js';
import { stringifyLocation } from '../../../include/utils';

export class Analysis {
    constructor({ id, from, to, dimensionId, expression, createdAt }) {
        const { min, max } = Analysis.#normalizeCorners(from, to);
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

    static tryCreate(from, to, dimensionId, expression) {
        const { min, max } = Analysis.#normalizeCorners(from, to);
        if (Analysis.#regionCapacity(min, max) > SCAN_CAP)
            return { ok: false, reason: 'overcapacity' };
        try {
            void new ExpressionEvaluator(expression);
        } catch (error) {
            const reason = error instanceof ExpressionForbiddenError ? 'forbidden' : 'syntaxerror';
            return { ok: false, reason };
        }
        return { ok: true, analysis: Analysis.create(from, to, dimensionId, expression) };
    }

    static errorMessage(error) {
        if (error instanceof LoadCapacityError)
            return { translate: 'commands.analyzearea.loadcapacity' };
        if (error instanceof ExpressionForbiddenError)
            return { translate: 'commands.analyzearea.forbidden' };
        console.warn('[Canopy] AnalyzeArea error:', error, error?.stack);
        return { translate: 'commands.analyzearea.unknownerror' };
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
        if (dimensionId !== this.dimensionId)
            return false;
        const { min, max } = Analysis.#normalizeCorners(from, to);
        return Analysis.#sameCorner(min, this.min) && Analysis.#sameCorner(max, this.max);
    }

    capacity() {
        return Analysis.#regionCapacity(this.min, this.max);
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

    *#runScan(analyzer, loader, total, progress, done, fail) {
        let error = void 0;
        try {
            for (const scan = analyzer.scan(); !scan.next().done;) {
                progress(Math.min(analyzer.scanned / total, 1));
                yield;
            }
            this.matches = analyzer.matches;
            this.capped = analyzer.capped;
            this.hasRun = true;
            progress(1);
            this.running = false;
            this.#finishRender();
        } catch (thrown) {
            error = thrown;
        } finally {
            this.jobId = void 0;
            loader.unload();
            if (this.loader === loader)
                this.loader = void 0;
        }
        if (error)
            fail(error);
        else
            done();
    }

    run(onProgress) {
        const dimension = world.getDimension(this.dimensionId);
        this.dimension = dimension;
        this.#cancelJob();
        const loader = this.#initializeLoader(dimension);
        if (!loader) {
            const error = new LoadCapacityError();
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
            const total = Analysis.#regionCapacity(this.min, this.max);
            const done = () => { this.#emit('onDone'); resolve(); };
            const fail = (error) => { this.#fail(error); reject(error); };
            this.jobId = system.runJob(this.#runScan(analyzer, loader, total, progress, done, fail));
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

    static #normalizeCorners(a, b) {
        return {
            min: {
                x: Math.floor(Math.min(a.x, b.x)),
                y: Math.floor(Math.min(a.y, b.y)),
                z: Math.floor(Math.min(a.z, b.z))
            },
            max: {
                x: Math.floor(Math.max(a.x, b.x)),
                y: Math.floor(Math.max(a.y, b.y)),
                z: Math.floor(Math.max(a.z, b.z))
            }
        };
    }

    static #regionCapacity(min, max) {
        return (max.x - min.x + 1) * (max.y - min.y + 1) * (max.z - min.z + 1);
    }

    static #sameCorner(a, b) {
        return a.x === b.x && a.y === b.y && a.z === b.z;
    }
}
