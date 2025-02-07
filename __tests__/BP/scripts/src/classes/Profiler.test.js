import { describe, it, expect } from "vitest";
import Profiler from "../../../../../Canopy [BP]/scripts/src/classes/Profiler";

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

    it('should have a getter for the smoothed MSPT', () => {
        expect(Profiler.lastMSPTProfile).toBeDefined();
    });

    it('should start profiling when start() is called', () => {
        Profiler.start();
        expect(Profiler.lastTickDate).toBeCloseTo(Date.now());
    });

    it('should profile real MSPT when profileMSPT() is called', () => {
        
    });
});