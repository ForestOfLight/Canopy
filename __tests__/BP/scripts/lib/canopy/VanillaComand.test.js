import { describe, it, expect, vi, beforeEach } from "vitest";
import { VanillaCommand } from "../../../../../Canopy [BP]/scripts/lib/canopy/VanillaCommand";
import { Rule } from "../../../../../Canopy [BP]/scripts/lib/canopy/Rule";
import { Rules } from "../../../../../Canopy [BP]/scripts/lib/canopy/Rules";

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
                subscribe: () => ({ customCommandRegistry: mockCustomCommandRegistry })
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
    Block: class {}
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
        const command = new VanillaCommand(mockCommand);
        command.registerCommand(mockCustomCommandRegistry);
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
        const command = new VanillaCommand(mockCommand);
        command.registerCommand(mockCustomCommandRegistry);
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
        const command = new VanillaCommand(mockCommand);
        command.registerCommand(mockCustomCommandRegistry);
        expect(mockCustomCommandRegistry.registerEnum).toHaveBeenCalledWith(mockEnum.name, mockEnum.values);
    });

    it("should make called commands end early if their contingent rules are disabled", () => {
        new Rule({
            category: "test",
            identifier: "test_rule",
        });
        mockCommand.contingentRules = ["test_rule"];
        const command = new VanillaCommand(mockCommand);
        command.registerCommand(mockCustomCommandRegistry);
        const mockOrigin = { sourceType: "Entity", sourceEntity: { sendMessage: vi.fn() } };
        const result = command.callback(mockOrigin);
        expect(result).toEqual({ status: "Failure" });
        expect(mockOrigin.sourceEntity.sendMessage).toHaveBeenCalledWith({ translate: "rules.generic.blocked", with: ["test_rule"] });
    });

    it("should print a message if contingent rules are disabled", () => {
        new Rule({
            category: "test",
            identifier: "test_rule",
        });
        mockCommand.contingentRules = ["test_rule"];
        const command = new VanillaCommand(mockCommand);
        command.registerCommand(mockCustomCommandRegistry);
        const mockOrigin = { sourceType: "Entity", sourceEntity: { sendMessage: vi.fn() } };
        command.callback(mockOrigin);
        expect(mockOrigin.sourceEntity.sendMessage).toHaveBeenCalledWith({ translate: "rules.generic.blocked", with: ["test_rule"] });
    });

    it("should resolve the command source when it is a block", () => {
        const mockOrigin = { sourceType: "Block", sourceBlock: true };
        expect(VanillaCommand.resolveCommandSource(mockOrigin)).toBe(mockOrigin.sourceBlock);
    });

    it("should resolve the command source when it is an entity", () => {
        const mockOrigin = { sourceType: "Entity", sourceEntity: true };
        expect(VanillaCommand.resolveCommandSource(mockOrigin)).toBe(mockOrigin.sourceEntity);
    });

    it("should resolve the command source when it is the server", () => {
        const mockOrigin = { sourceType: "Server" };
        expect(VanillaCommand.resolveCommandSource(mockOrigin)).toBe("Server");
    });

    it("should return undefined if the command source is neither a block nor an entity", () => {
        const mockOrigin = {};
        expect(VanillaCommand.resolveCommandSource(mockOrigin)).toBeUndefined();
    });
});
