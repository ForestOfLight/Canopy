import { describe, it, expect, vi, beforeEach } from "vitest";
import { VanillaCommand } from "../../../../../Canopy [BP]/scripts/lib/canopy/VanillaCommand";
import { Rule } from "../../../../../Canopy [BP]/scripts/lib/canopy/Rule";
import { Rules } from "../../../../../Canopy [BP]/scripts/lib/canopy/Rules";
import { FeedbackMessageType } from "../../../../../Canopy [BP]/scripts/lib/canopy/FeedbackMessageType";
import { BlockCommandOrigin } from "../../../../../Canopy [BP]/scripts/lib/canopy/BlockCommandOrigin";
import { EntityCommandOrigin } from "../../../../../Canopy [BP]/scripts/lib/canopy/EntityCommandOrigin";
import { ServerCommandOrigin } from "../../../../../Canopy [BP]/scripts/lib/canopy/ServerCommandOrigin";
import { PlayerCommandOrigin } from "../../../../../Canopy [BP]/scripts/lib/canopy/PlayerCommandOrigin";
import { Player } from "@minecraft/server";

const mockCustomCommandRegistry = {
    registerCommand: vi.fn(),
    registerEnum: vi.fn()
};

vi.mock("@minecraft/server", () => ({
    world: { 
        beforeEvents: {
            chatSend: {
                subscribe: vi.fn()
            }
        },
        afterEvents: {
            worldLoad: {
                subscribe: (callback) => {
                    callback();
                }
            }
        },
        setDynamicProperty: vi.fn(),
        getDynamicProperty: vi.fn()
    },
    system: {
        beforeEvents: {
            startup: {
                subscribe: () => ({ customCommandRegistry: mockCustomCommandRegistry }),
                unsubscribe: vi.fn()
            }
        },
        afterEvents: {
            scriptEventReceive: {
                subscribe: vi.fn()
            }
        },
        runJob: vi.fn()
    },
    CustomCommandSource: {
        Block: "Block",
        Entity: "Entity",
        Server: "Server"
    },
    CustomCommandStatus: {
        Failure: "Failure",
        Success: "Success"
    },
    Block: class {},
    Entity: class {},
    Player: class { sendMessage = vi.fn() }
}));

describe("VanillaCommand", () => {
    let mockCommand;
    beforeEach(() => {
        vi.clearAllMocks();
        Rules.clear();
        mockCommand = {
            name: "canopy:test",
            description: "Test command",
            optionalParameters: [{ name: "param", type: "string" }],
            permissionLevel: 0,
            cheatsRequired: true,
            callback: vi.fn()
        }
    });

    it("should register the command using the vanilla command system", () => {
        const command = createVanillaCommand(mockCommand);
        expect(mockCustomCommandRegistry.registerCommand).toHaveBeenCalledWith({
            name: mockCommand.name,
            description: mockCommand.description,
            optionalParameters: mockCommand.optionalParameters,
            permissionLevel: mockCommand.permissionLevel,
            cheatsRequired: mockCommand.cheatsRequired
        }, command.callback);
    });

    it("should set up an alias if provided", () => {
        mockCommand.aliases = ["canopy:alias"];
        const command = createVanillaCommand(mockCommand);
        expect(mockCustomCommandRegistry.registerCommand).toHaveBeenCalledWith({
            name: mockCommand.aliases[0],
            description: mockCommand.description,
            optionalParameters: mockCommand.optionalParameters,
            permissionLevel: mockCommand.permissionLevel,
            cheatsRequired: mockCommand.cheatsRequired
        }, command.callback);
    });

    it("should register enums if provided", () => {
        const mockEnum = {
            name: "TestEnum",
            values: ["value1", "value2"]
        };
        mockCommand.enums = [mockEnum];
        createVanillaCommand(mockCommand);
        expect(mockCustomCommandRegistry.registerEnum).toHaveBeenCalledWith(mockEnum.name, mockEnum.values);
    });

    it("should should not require cheats if not provided", () => {
        mockCommand.cheatsRequired = void 0;
        const command = new VanillaCommand(mockCommand);
        expect(command.isCheatsRequired()).toEqual(false)
    });

    it("should make called commands abort if their contingent rules are disabled", () => {
        new Rule({
            category: "test",
            identifier: "test_rule",
        });
        mockCommand.contingentRules = ["test_rule"];
        const command = createVanillaCommand(mockCommand);
        const mockOrigin = { sourceType: "Entity", sourceEntity: { sendMessage: vi.fn() } };
        runCommand(command, mockOrigin);
        expect(mockOrigin.sourceEntity.sendMessage).toHaveBeenCalledWith({ translate: "rules.generic.blocked", with: ["test_rule"] });
    });

    it("should print a message if contingent rules are disabled", () => {
        new Rule({
            category: "test",
            identifier: "test_rule",
        });
        mockCommand.contingentRules = ["test_rule"];
        const command = createVanillaCommand(mockCommand);
        const mockOrigin = { sourceType: "Entity", sourceEntity: { sendMessage: vi.fn() } };
        command.callback(mockOrigin);
        expect(mockOrigin.sourceEntity.sendMessage).toHaveBeenCalledWith({ translate: "rules.generic.blocked", with: ["test_rule"] });
    });

    it("should print a message if the command source is not allowed", () => {
        mockCommand.allowedSources = [PlayerCommandOrigin];
        const command = createVanillaCommand(mockCommand);
        const mockOrigin = { sourceType: "Entity", sourceEntity: { sendMessage: vi.fn() } };
        const result = command.callback(mockOrigin);
        expect(result).toEqual({ status: "Failure", message: 'commands.generic.invalidsource' });
    });

    it("should run the callback if all contingent rules are enabled and the source is allowed", () => {
        const mockCallback = vi.fn();
        mockCommand.callback = mockCallback;
        mockCommand.allowedSources = [EntityCommandOrigin];
        const command = createVanillaCommand(mockCommand);
        const mockOrigin = { sourceType: "Entity", sourceEntity: { sendMessage: vi.fn() } };
        command.callback(mockOrigin);
        expect(mockCallback).toHaveBeenCalled();
    });

    it("should resolve the command source when it is a block", () => {
        const mockOrigin = { sourceType: "Block", sourceBlock: true };
        expect(VanillaCommand.resolveCommandOrigin(mockOrigin)).toBeInstanceOf(BlockCommandOrigin);
    });

    it("should resolve the command source when it is an entity", () => {
        const mockOrigin = { sourceType: "Entity", sourceEntity: true };
        expect(VanillaCommand.resolveCommandOrigin(mockOrigin)).toBeInstanceOf(EntityCommandOrigin);
    });

    it("should resolve the command source when it is the server", () => {
        const mockOrigin = { sourceType: "Server" };
        expect(VanillaCommand.resolveCommandOrigin(mockOrigin)).toBeInstanceOf(ServerCommandOrigin);
    });

    it("should resolve the command source when it is a player", () => {
        const mockOrigin = { sourceType: "Entity", sourceEntity: new Player() };
        expect(VanillaCommand.resolveCommandOrigin(mockOrigin)).toBeInstanceOf(PlayerCommandOrigin);
    });

    it("should return throw an error if the command source is unknown", () => {
        const mockOrigin = {};
        expect(() => VanillaCommand.resolveCommandOrigin(mockOrigin)).toThrow();
    });

    it("should make sendMessage do nothing for a Block source", () => {
        mockCommand.callback = (origin) => origin.sendMessage();
        const command = createVanillaCommand(mockCommand);
        const mockOrigin = { sourceType: "Block", sourceBlock: true };
        const result = runCommand(command, mockOrigin);
        expect(result).toBe(FeedbackMessageType.None);
    });

    it("should make sendMessage log to console for a Server source", () => {
        mockCommand.callback = (origin) => origin.sendMessage();
        const command = createVanillaCommand(mockCommand);
        const mockOrigin = { sourceType: "Server" };
        const result = runCommand(command, mockOrigin);
        expect(result).toBe(FeedbackMessageType.ConsoleInfo);
    });
});

function createVanillaCommand(commandData) {
    const command = new VanillaCommand(commandData);
    command.setupForRegistry({ customCommandRegistry: mockCustomCommandRegistry });
    return command;
}

function runCommand(command, origin) {
    if (!origin)
        origin = { sourceType: "Entity", sourceEntity: { sendMessage: vi.fn() } }
    return command.callback(origin);
}