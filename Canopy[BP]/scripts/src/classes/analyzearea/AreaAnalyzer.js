export const MATCH_CAP = 10000;
export const SCAN_CAP = 2 ** 32;
const YIELD_EVERY = 32;

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
        for (let y = this.min.y; y <= this.max.y; y++) {
            for (let x = this.min.x; x <= this.max.x; x++) {
                for (let z = this.min.z; z <= this.max.z; z++) {
                    this.scanned++;
                    const loc = { x, y, z };
                    if (this.#evaluateLocation(loc))
                        return;
                    if (++sinceYield >= YIELD_EVERY) {
                        sinceYield = 0;
                        yield;
                    }
                }
            }
        }
    }

    #evaluateLocation(loc) {
        try {
            const block = this.dimension.getBlock(loc);
            if (block === void 0) {
                this.errorCount++;
            } else if (this.evaluator.evaluate(block)) {
                this.matches.push(loc);
                if (this.matches.length >= this.matchCap) {
                    this.capped = true;
                    return true;
                }
            }
        } catch {
            this.errorCount++;
        }
        return false;
    }

    runToCompletion() {
        // eslint-disable-next-line no-unused-vars
        for (const _ of this.scan()) { /* drain */ }
    }
}
