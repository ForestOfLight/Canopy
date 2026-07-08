export const MATCH_CAP = 1000;
const YIELD_EVERY = 4096; // spread work across ticks under system.runJob

export class AreaAnalyzer {
    constructor(dimension, min, max, evaluator, { matchCap = MATCH_CAP } = {}) {
        this.dimension = dimension;
        this.min = min;
        this.max = max;
        this.evaluator = evaluator;
        this.matchCap = matchCap;
        this.matches = [];
        this.scanned = 0;
        this.errorCount = 0;
        this.capped = false;
    }

    *scan() {
        let sinceYield = 0;
        for (let x = this.min.x; x <= this.max.x; x++) {
            for (let y = this.min.y; y <= this.max.y; y++) {
                for (let z = this.min.z; z <= this.max.z; z++) {
                    this.scanned++;
                    const loc = { x, y, z };
                    try {
                        const block = this.dimension.getBlock(loc);
                        if (block === undefined) {
                            this.errorCount++;
                        } else if (this.evaluator.evaluate(block)) {
                            this.matches.push(loc);
                            if (this.matches.length >= this.matchCap) {
                                this.capped = true;
                                return;
                            }
                        }
                    } catch {
                        this.errorCount++;
                    }
                    if (++sinceYield >= YIELD_EVERY) {
                        sinceYield = 0;
                        yield;
                    }
                }
            }
        }
    }

    runToCompletion() {
        for (const _ of this.scan()) { /* drain */ }
    }
}
