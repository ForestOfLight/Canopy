import { describe, it, expect, vi, beforeEach } from "vitest";
import { logCommand } from "../../../../../Canopy [BP]/scripts/src/commands/log";

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
        runJob: vi.fn(),
        clearRun: vi.fn((runner) => {
            runner.clear();
        }),
        afterEvents: {
            scriptEventReceive: {
                subscribe: vi.fn(),
                unsubscribe: vi.fn()
            }
        }
    },
    world: {
        afterEvents: {
            entitySpawn: {
                subscribe: vi.fn()
            }
        },
        beforeEvents: {
            entityRemove: {
                subscribe: vi.fn()
            },
            chatSend: {
                subscribe: vi.fn()
            }
        }
    }
}));

vi.mock("@minecraft/server-ui", () => ({
    ModalFormData: vi.fn()
}));

describe('logCommand', () => {
    let mockPlayer;
    let mockArgs;

    beforeEach(() => {
        mockPlayer = {
            sendMessage: vi.fn(),
            getDynamicProperty: vi.fn(),
            setDynamicProperty: vi.fn()
        };
    });

    it('should allow the user to set the precision', () => {
        mockArgs = { type: null, precision: 5 };
        logCommand(mockPlayer, mockArgs);
        expect(mockPlayer.setDynamicProperty).toHaveBeenCalledWith('logPrecision', 5);
        expect(mockPlayer.sendMessage).toHaveBeenCalledWith({ translate: 'commands.log.precision', with: ['5'] });
    });

    it('should allow the user to enable logging a valid type', () => {
        mockArgs = { type: 'projectiles', precision: null };
        logCommand(mockPlayer, mockArgs);
        expect(mockPlayer.sendMessage).toHaveBeenCalledWith({ translate: 'commands.log.started', with: ['projectiles'] });
    });

    it('should send usage message for invalid type', () => {
        mockArgs = { type: 'invalid_type', precision: null };
        logCommand(mockPlayer, mockArgs);
        expect(mockPlayer.sendMessage).toHaveBeenCalledWith({ translate: 'commands.generic.usage', with: ['./log <tnt/projectiles/falling_blocks> [precision]'] });
    });

    it('should allow the user to disable logging a valid type', () => {
        mockArgs = { type: 'projectiles', precision: null };
        logCommand(mockPlayer, mockArgs);
        expect(mockPlayer.sendMessage).toHaveBeenCalledWith({ translate: 'commands.log.stopped', with: ['projectiles'] });
    });

    it('should send usage if no arguments are provided', () => {
        mockArgs = { type: null, precision: null };
        logCommand(mockPlayer, mockArgs);
        expect(mockPlayer.sendMessage).toHaveBeenCalledWith({ translate: 'commands.generic.usage', with: ['./log <tnt/projectiles/falling_blocks> [precision]'] });
    });
});