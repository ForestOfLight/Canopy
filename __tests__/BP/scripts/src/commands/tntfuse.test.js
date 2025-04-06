import { describe, it, expect, vi } from "vitest";
import { tntfuseCommand } from "../../../../../Canopy [BP]/scripts/src/commands/tntfuse";

let mockFuseTicks = 80;
vi.mock("@minecraft/server", () => ({
    world: {
        setDynamicProperty: (_, ticks) => { mockFuseTicks = ticks; },
        getDynamicProperty: () => mockFuseTicks,
        afterEvents: {
            worldLoad: {
                subscribe: vi.fn()
            },
            entitySpawn: {
                subscribe: vi.fn()
            }
        },
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
        runTimeout: vi.fn((callback, timeout) => {
            setTimeout(callback, timeout * 50);
        }),
        runJob: vi.fn(),
    }
}));

vi.mock("@minecraft/server-ui", () => ({
    ModalFormData: vi.fn()
}));

describe('tntfuseCommand', () => {
    it('should have an argument to reset the fuse', () => {
        const args = { ticks: 'reset' };
        const mockSender = { sendMessage: vi.fn() };
        tntfuseCommand(mockSender, args);
        expect(mockFuseTicks).toBe(80);
    });

    it('should send a success message when resetting the fuse', () => {
        const args = { ticks: 'reset' };
        const mockSender = { sendMessage: vi.fn() };
        tntfuseCommand(mockSender, args);
        expect(mockSender.sendMessage).toHaveBeenCalledWith({ translate: 'commands.tntfuse.reset.success' });
    });

    it('should set the fuse time to a valid number', () => {
        const args = { ticks: 100 };
        const mockSender = { sendMessage: vi.fn() };
        tntfuseCommand(mockSender, args);
        expect(mockFuseTicks).toBe(100);
    });

    it('should send a success message when setting the fuse time', () => {
        const args = { ticks: 100 };
        const mockSender = { sendMessage: vi.fn() };
        tntfuseCommand(mockSender, args);
        expect(mockSender.sendMessage).toHaveBeenCalledWith({ translate: 'commands.tntfuse.set.success', with: ['100'] });
    });

    it('should send a failure message when setting the fuse time to an invalid number', () => {
        const args = { ticks: 100000 };
        const mockSender = { sendMessage: vi.fn() };
        tntfuseCommand(mockSender, args);
        expect(mockSender.sendMessage).toHaveBeenCalledWith({ translate: 'commands.tntfuse.set.fail', with: ['100000', '1', '72000'] });
    });

    it('should send a usage message when no arguments are provided', () => {
        const args = { ticks: null };
        const mockSender = { sendMessage: vi.fn() };
        tntfuseCommand(mockSender, args);
        expect(mockSender.sendMessage).toHaveBeenCalledWith({ translate: 'commands.generic.usage', with: ["./tntfuse <ticks/reset>"] });
    });
});