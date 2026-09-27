import { describe, it, expect } from "vitest";
import * as Canopy from "../../../../../Canopy[BP]/scripts/lib/canopy/Canopy";

describe('Canopy module', () => {
    it('should export Commands', () => {
        expect(Canopy.Commands).toBeDefined();
    });

    it('should export Command', () => {
        expect(Canopy.Command).toBeDefined();
    });

    it('should export VanillaCommand', () => {
        expect(Canopy.VanillaCommand).toBeDefined();
    });

    it('should export Rules', () => {
        expect(Canopy.Rules).toBeDefined();
    });

    it('should export Rule', () => {
        expect(Canopy.Rule).toBeDefined();
    });

    it('should export GlobalRule', () => {
        expect(Canopy.GlobalRule).toBeDefined();
    });

    it('should export InfoDisplayRule', () => {
        expect(Canopy.InfoDisplayRule).toBeDefined();
    });

    it('should export AbilityRule', () => {
        expect(Canopy.AbilityRule).toBeDefined();
    });

    it('should export Extensions', () => {
        expect(Canopy.Extensions).toBeDefined();
    });
});
