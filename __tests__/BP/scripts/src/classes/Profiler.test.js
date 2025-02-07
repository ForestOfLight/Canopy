import { describe, it, expect, vi } from "vitest";
import Profiler from "../../../../../Canopy [BP]/scripts/src/classes/Profiler";

vi.mock("@minecraft/server", () => ({
    system: {
        runInterval: vi.fn(),
        runTimeout: vi.fn(),
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

    it('should profile real MSPT when profileMSPT() is called', () => {
        Profiler.profileMSPT().then(profile => {
            expect(profile.result).toBeDefined();
            expect(profile.min).toBeDefined();
            expect(profile.max).toBeDefined();
            expect(profile.values).toBeDefined();
        });
    });

    it('should profile TPS when profileTPS() is called', () => {
        Profiler.profileTPS().then(profile => {
            expect(profile.result).toBeDefined();
            expect(profile.min).toBeDefined();
            expect(profile.max).toBeDefined();
            expect(profile.values).toBeDefined();
        });
    });

    it('should profile both TPS and MSPT when profile() is called', () => {
        Profiler.profile().then(profile => {
            expect(profile.tps).toBeDefined();
            expect(profile.mspt).toBeDefined();
        });
    });
});