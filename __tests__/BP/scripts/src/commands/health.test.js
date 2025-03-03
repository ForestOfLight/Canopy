import { describe, it, expect, vi } from "vitest";
import { healthCommand } from "../../../../../Canopy [BP]/scripts/src/commands/health";

vi.mock("@minecraft/server", () => ({
    world: { 
        beforeEvents: {
            chatSend: {
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
        runJob: vi.fn(),
        runInterval: vi.fn(),
        runTimeout: vi.fn(),
    },
    MinecraftDimensionTypes: {
        overworld: "minecraft:overworld",
        nether: "minecraft:the_nether",
        theEnd: "minecraft:the_end"
    }
}));

describe('healthCommand', () => {
    it('should profile the tps & mspt', () => {
        const sender = {
            sendMessage: vi.fn()
        };
        healthCommand(sender);
        expect(sender.sendMessage).toHaveBeenCalled();
    });

    it('should print the dimension entities', () => {
        const sender = {
            sendMessage: vi.fn()
        };
        healthCommand(sender);
        expect(sender.sendMessage).toHaveBeenCalled();
    });
});