import { describe, it, expect, vi, beforeEach } from "vitest";
import { velocityCommand } from "../../../../../Canopy [BP]/scripts/src/commands/velocity";
import { Vector } from "../../../../../Canopy [BP]/scripts/lib/Vector";

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
        Location: 'Location',
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
    let mockAllOrigins;
    let mockEntities;

    beforeEach(() => {
        mockAllOrigins = void 0;
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

    it('should allow the user to get the velocity', () => {
        velocityCommand.velocityCommand(mockAllOrigins, mockEntities, 'query');
        expect(mockEntities[0].getVelocity).toHaveReturnedWith(mockEntities[0].velocity);
    });

    it('should allow the user to add velocity', () => {
        velocityCommand.velocityCommand(mockAllOrigins, mockEntities, 'add', Vector.up);
        expect(Vector.from(mockEntities[0].getVelocity()).distance(Vector.add(Vector.up, Vector.up))).toEqual(0);
    });

    it('should allow the user to set velocity', () => {
        velocityCommand.velocityCommand(mockAllOrigins, mockEntities, 'set', Vector.down);
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
        velocityCommand.velocityCommand(mockAllOrigins, mockEntities, 'query');
        expect(mockEntities[1].getVelocity).toHaveReturnedWith(mockEntities[1].velocity);
    });

    it('should handle errors for invalid entities', () => {
        mockEntities.push({ 
            typeId: 'minecraft:pig',
            isValid: false,
            localizationKey: 'pig.name',
            getVelocity: vi.fn(),

        });
        velocityCommand.velocityCommand(mockAllOrigins, mockEntities, 'query');
        expect(mockEntities[1].getVelocity).not.toHaveBeenCalled();
    });
});