import { describe, it, expect, vi } from "vitest";
import { healthCommand } from "../../../../../Canopy [BP]/scripts/src/commands/health";

vi.mock("@minecraft/server", () => ({
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
        runJob: vi.fn(),
        runInterval: vi.fn(),
        runTimeout: vi.fn()
    },
    DimensionTypes: {
        getAll: () => [
            { typeId: "minecraft:overworld" },
            { typeId: "minecraft:nether" },
            { typeId: "minecraft:the_end" }
        ]
    }
}));

vi.mock("@minecraft/server-ui", () => ({
    ModalFormData: vi.fn()
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