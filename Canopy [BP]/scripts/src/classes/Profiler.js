import { system, TicksPerSecond } from "@minecraft/server";
import { wait } from "../../include/utils";

const MS_PER_SECOND = 1000;
const SAMPLE_INTERVAL = 2;
const NUM_SAMPLES = 50;

class Profiler {
    static lastTickDate = Date.now();
    static tickMs = 0;
    static tickTps = 0;
    static tps = 0;
    static profileTime = SAMPLE_INTERVAL * NUM_SAMPLES;
    static #tpsValues = [];
    static #isRunning = false;

    get lastTickDate() { return this.lastTickDate; }
    get tickMs() { return this.tickMs; }
    get tickTps() { return this.tickTps; }
    get tps() { return this.tps; }

    static start() {
        if (this.#isRunning) return;
        this.lastTickDate = Date.now();
        system.runInterval(() => this.#updateTPS(), 1);
        this.#isRunning = true;
    }

    static async profile() {
        const mspt = await this.#profileMSPT();
        const tps = await this.#profileTPS();
        return { tps, mspt };
    }

    static async #profileTPS() {
        const tpsValues = [];
        const runner = system.runInterval(() => {
            tpsValues.push(this.tickTps);
        }, SAMPLE_INTERVAL);
        await new Promise(resolve => system.runTimeout(() => {
            system.clearRun(runner);
            resolve();
        }, SAMPLE_INTERVAL * NUM_SAMPLES));
        const result = {
            result: this.tps,
            min: tpsValues.reduce((a, b) => Math.min(a, b)),
            max: tpsValues.reduce((a, b) => Math.max(a, b)),
            values: tpsValues
        }
        return result;
    }

    static async #profileMSPT() {
        const msptValues = [];
        const runner = system.runInterval( async () => {
            const mspt = await this.#getRealMspt();
            if (mspt !== null)
                msptValues.push(mspt);
        }, SAMPLE_INTERVAL);
        await new Promise(resolve => system.runTimeout(() => {
            system.clearRun(runner);
            resolve();
        }, SAMPLE_INTERVAL * NUM_SAMPLES));
        const result = {
            result: msptValues.reduce((a, b) => a + b, 0) / msptValues.length,
            min: msptValues.reduce((a, b) => Math.min(a, b)),
            max: msptValues.reduce((a, b) => Math.max(a, b)),
            values: msptValues
        }
        return result;
    }

    static #updateTPS() {
        this.tickMS = Date.now() - this.lastTickDate;
        this.tickTps = MS_PER_SECOND / this.tickMS;
        this.#tpsValues.push(this.tickTps);
        if (this.#tpsValues.length > TicksPerSecond)
            this.#tpsValues.shift();
        this.lastTickDate = Date.now();
        this.tps = this.#tpsValues.reduce((a, b) => a + b, 0) / this.#tpsValues.length;
    }

    static #getRealMspt() {
        const lastTick = system.currentTick;
        const { startTime, endTime } = wait(50);
        return new Promise(resolve => {
            system.runTimeout(() => {
                if (system.currentTick - lastTick === 1)
                    resolve(Date.now() - startTime - (endTime - startTime));
                else
                    resolve(null);
            }, 1);
        });
    }
}

Profiler.start();

export default Profiler;