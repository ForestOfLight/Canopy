import { describe, it, expect, vi, beforeEach } from "vitest";
import { velocityCommand } from "../../../../../Canopy [BP]/scripts/src/commands/velocity";
import { Vector } from "../../../../../Canopy [BP]/scripts/lib/Vector";
import { PlayerCommandOrigin } from "../../../../../Canopy [BP]/scripts/lib/canopy/Canopy";

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
        run: vi.fn((callback) => callback()),
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
            },
            playerLeave: {
                subscribe: vi.fn()
            }
        },
    },
    CommandPermissionLevel: {
        GameDirectors: 'GameDirectors',
    },
    CustomCommandParamType: {
        Enum: 'Enum',
        Float: 'Float',
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

describe('velocityCommand', () => {
    let mockPlayerOrigin;
    let mockEntities;

    beforeEach(() => {
        mockPlayerOrigin = new PlayerCommandOrigin({ sourceEntity: { sendMessage: vi.fn() } });
        mockEntities = [{ 
            typeId: 'minecraft:cow',
            isValid: true,
            localizationKey: 'cow.name',
            velocity: Vector.from(Vector.up),
            getVelocity: vi.fn(() => mockEntities[0].velocity),
            clearVelocity: vi.fn(() => { this.velocity = Vector.zero }),
            applyImpulse: vi.fn((addVelocity) => { mockEntities[0].velocity = mockEntities[0].velocity.add(addVelocity) })
        }];
    });
    
    it('should handle invalid actions', () => {
        expect(velocityCommand.velocityCommand(mockPlayerOrigin, mockEntities, 'invalidAction' )).toEqual({ status: 'Failure', message: 'commands.generic.invalidaction' });
    });

    it('should allow the user to get the velocity', () => {
        velocityCommand.velocityCommand(mockPlayerOrigin, mockEntities, 'query');
        expect(mockEntities[0].getVelocity).toHaveReturnedWith(mockEntities[0].velocity);
    });

    it('should allow the user to add velocity', () => {
        velocityCommand.velocityCommand(mockPlayerOrigin, mockEntities, 'add', 0, 1, 0);
        expect(Vector.from(mockEntities[0].getVelocity()).distance(Vector.add(Vector.up, Vector.up))).toEqual(0);
    });

    it('should allow the user to set velocity', () => {
        velocityCommand.velocityCommand(mockPlayerOrigin, mockEntities, 'set', 0, -1, 0);
        expect(Vector.from(mockEntities[0].getVelocity()).distance(Vector.zero)).toEqual(0);
    });

    it('should allow the user to affect multiple entities', () => {
        mockEntities.push({ 
            typeId: 'minecraft:sheep',
            isValid: true,
            localizationKey: 'sheep.name',
            velocity: Vector.from(Vector.up),
            getVelocity: vi.fn(() => mockEntities[0].velocity),
            clearVelocity: vi.fn(() => { this.velocity = Vector.zero }),
            applyImpulse: vi.fn((addVelocity) => { mockEntities[0].velocity = mockEntities[0].velocity.add(addVelocity) })
        });
        velocityCommand.velocityCommand(mockPlayerOrigin, mockEntities, 'query');
        expect(mockEntities[1].getVelocity).toHaveReturnedWith(mockEntities[1].velocity);
    });

    it('should handle errors for invalid entities', () => {
        mockEntities.push({ 
            typeId: 'minecraft:pig',
            isValid: false,
            localizationKey: 'pig.name',
            getVelocity: vi.fn()
        });
        velocityCommand.velocityCommand(mockPlayerOrigin, mockEntities, 'query');
        velocityCommand.velocityCommand(mockPlayerOrigin, mockEntities, 'add', 0, 0, 0);
        velocityCommand.velocityCommand(mockPlayerOrigin, mockEntities, 'set', 0, 0, 0);
        expect(mockEntities[1].getVelocity).not.toHaveBeenCalled();
    });

    it('should require all three velocity cardinals for add', () => {
        expect(velocityCommand.velocityCommand(mockPlayerOrigin, mockEntities, 'add')).toEqual({ status: 'Failure', message: 'commands.velocity.missingvelocity' });
    });

    it('should require all three velocity cardinals for set', () => {
        expect(velocityCommand.velocityCommand(mockPlayerOrigin, mockEntities, 'set')).toEqual({ status: 'Failure', message: 'commands.velocity.missingvelocity' });
    });
});