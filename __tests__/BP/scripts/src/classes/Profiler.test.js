import { describe, it, expect, vi } from "vitest";
import Profiler from "../../../../../Canopy [BP]/scripts/src/classes/Profiler";

vi.mock("@minecraft/server", () => ({
    system: {
        runInterval: vi.fn((callback, interval) => {
            const intervalId = setInterval(callback, interval * 50);
            return {
                clear: () => clearInterval(intervalId)
            };
        }),
        runTimeout: vi.fn((callback, timeout) => {
            const timeoutId = setTimeout(callback, timeout * 50);
            return {
                clear: () => clearTimeout(timeoutId)
            };
        }),
        clearRun: vi.fn((runner) => {
            runner.clear();
        })
    }
}));

describe('Profiler', () => {
    it('should have a getter for the instant MS', () => {
        expect(Profiler.tickMs).toBeDefined();
    });

    it('should have a getter for the instant TPS', () => {
        expect(Profiler.tickTps).toBeDefined();
    });

    it('should have a getter for the smoothed TPS', () => {
        expect(Profiler.tps).toBeDefined();
    });

    it('should start profiling when start() is called', () => {
        Profiler.start();
        expect(Profiler.lastTickDate).toBeLessThanOrEqual(Date.now());
    });

    it('should not start profiling if it is already running', () => {
        Profiler.start();
        const lastTickDate = Profiler.lastTickDate;
        Profiler.start();
        expect(Profiler.lastTickDate).toBeLessThanOrEqual(lastTickDate);
    });

    it.skip('should profile both TPS and MSPT when profile() is called', async () => {
        // Gametest
    });
});