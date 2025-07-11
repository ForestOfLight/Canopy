import { describe, it, expect, vi, beforeEach } from "vitest";
import { logCommand } from "../../../../../Canopy [BP]/scripts/src/commands/log";
import { Player } from "@minecraft/server";

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
        },
        beforeEvents: {
            startup: {
                subscribe: vi.fn()
            }
        }
    },
    world: {
        afterEvents: {
            entitySpawn: {
                subscribe: vi.fn()
            },
            worldLoad: {
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
        },
        getDimension: vi.fn(() => ({
            id: 'overworld',
            runCommand: vi.fn(),
            getEntities: vi.fn(() => [
                { typeId: 'minecraft:falling_block', id: 'entity1', location: { x: 1, y: 2, z: 3 }, dimension: { id: 'overworld' },
                    getComponent: vi.fn(() => ({ })),
                    isValid: vi.fn(() => true)
                },
                { typeId: 'minecraft:projectile', id: 'entity2', location: { x: 4, y: 5, z: 6 }, dimension: { id: 'overworld' },
                    getComponent: vi.fn(() => ({ projectile: { isValid: true } })),
                    isValid: vi.fn(() => true)
                },
                { typeId: 'minecraft:item', id: 'entity3', location: { x: 7, y: 8, z: 9 }, dimension: { id: 'overworld' },
                    getComponent: vi.fn(() => ({ })),
                    isValid: vi.fn(() => false)
                }
            ])
        }))
    },
    CommandPermissionLevel: {
        Any: 'Any',
    },
    CustomCommandParamType: {
        Enum: 'Enum',
        Integer: 'Integer',
    },
    CustomCommandStatus: {
        Success: 'Success',
        Failure: 'Failure',
    },
    Player: class {
        sendMessage = vi.fn();
        getDynamicProperty = vi.fn();
        setDynamicProperty = vi.fn();
    }
}));

vi.mock("@minecraft/server-ui", () => ({
    ModalFormData: vi.fn()
}));

describe('logCommand', () => {
    let mockPlayer;

    beforeEach(() => {
        mockPlayer = new Player();
    });

    it('should allow the user to set the precision', () => {
        logCommand(mockPlayer, 'na', 5);
        expect(mockPlayer.setDynamicProperty).toHaveBeenCalledWith('logPrecision', 5);
        expect(mockPlayer.sendMessage).toHaveBeenCalledWith({ translate: 'commands.log.precision', with: ['5'] });
    });

    it('should allow the user to enable logging a valid type', () => {
        logCommand(mockPlayer, 'projectiles', void 0);
        expect(mockPlayer.sendMessage).toHaveBeenCalledWith({ translate: 'commands.log.started', with: ['projectiles'] });
    });

    it('should send usage message for invalid type', () => {
        const commandResult = logCommand(mockPlayer, 'invalid_type', void 0);
        expect(commandResult).toEqual({ status: "Failure", message: 'commands.log.invalidtype' });
    });

    it('should allow the user to disable logging a valid type', () => {
        logCommand(mockPlayer, 'projectiles', void 0);
        expect(mockPlayer.sendMessage).toHaveBeenCalledWith({ translate: 'commands.log.stopped', with: ['projectiles'] });
    });
});