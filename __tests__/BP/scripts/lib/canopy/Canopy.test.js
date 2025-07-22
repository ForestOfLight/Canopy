import { describe, it, expect, vi } from "vitest";
import * as Canopy from "../../../../../Canopy [BP]/scripts/lib/canopy/Canopy";

vi.mock('@minecraft/server', () => ({
    world: { 
        beforeEvents: {
            chatSend: {
                subscribe: vi.fn()
            }
        },
        afterEvents: {
            worldLoad: {
                subscribe: vi.fn()
            }
        }
    },
    system: {
        afterEvents: {
            scriptEventReceive: {
                subscribe: vi.fn()
            }
        },
        runJob: vi.fn()
    }
}));

vi.mock("@minecraft/server-ui", () => ({
    ModalFormData: vi.fn()
}));

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

    it('should export RuleHelpEntry', () => {
        expect(Canopy.RuleHelpEntry).toBeDefined();
    });

    it('should export CommandHelpEntry', () => {
        expect(Canopy.CommandHelpEntry).toBeDefined();
    });

    it('should export InfoDisplayRuleHelpEntry', () => {
        expect(Canopy.InfoDisplayRuleHelpEntry).toBeDefined();
    });

    it('should export RuleHelpPage', () => {
        expect(Canopy.RuleHelpPage).toBeDefined();
    });

    it('should export CommandHelpPage', () => {
        expect(Canopy.CommandHelpPage).toBeDefined();
    });

    it('should export InfoDisplayRuleHelpPage', () => {
        expect(Canopy.InfoDisplayRuleHelpPage).toBeDefined();
    });

    it('should export HelpBook', () => {
        expect(Canopy.HelpBook).toBeDefined();
    });

    it('should export Extensions', () => {
        expect(Canopy.Extensions).toBeDefined();
    });
});