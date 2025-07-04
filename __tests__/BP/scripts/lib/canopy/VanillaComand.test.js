import { describe, it, expect, vi, beforeEach } from "vitest";
import { VanillaCommand } from "../../../../../Canopy [BP]/scripts/lib/canopy/VanillaCommand";

const mockCustomCommandRegistry = {
    registerCommand: vi.fn(),
    registerEnum: vi.fn()
};

vi.mock("@minecraft/server", () => ({
    system: {
        beforeEvents: {
            startup: {
                subscribe: () => ({ customCommandRegistry: mockCustomCommandRegistry })
            }
        }
    },
    CustomCommandSource: {
        Block: "Block",
        Entity: "Entity",
        Server: "Server"
    }
}));

describe("VanillaCommand", () => {
    let mockCommand;
    let mockCallback;
    beforeEach(() => {
        vi.clearAllMocks();
        mockCommand = {
            name: "canopy:test",
            description: "Test command",
            optionalParameters: [{ name: "param", type: "string" }],
            permissionLevel: 0,
            cheatsRequired: true
        }
        mockCallback = vi.fn();
    });

    it("should register the command using the vanilla command system", () => {
        const command = new VanillaCommand(mockCommand, mockCallback);
        command.registerCommand(mockCustomCommandRegistry);
        expect(mockCustomCommandRegistry.registerCommand).toHaveBeenCalledWith({
            name: mockCommand.name,
            description: mockCommand.description,
            optionalParameters: mockCommand.optionalParameters,
            permissionLevel: mockCommand.permissionLevel,
            cheatsRequired: mockCommand.cheatsRequired
        }, mockCallback);
    });

    it("should set up an alias if provided", () => {
        mockCommand.aliases = ["canopy:alias"];
        const command = new VanillaCommand(mockCommand, mockCallback);
        command.registerCommand(mockCustomCommandRegistry);
        expect(mockCustomCommandRegistry.registerCommand).toHaveBeenCalledWith({
            name: mockCommand.aliases[0],
            description: mockCommand.description,
            optionalParameters: mockCommand.optionalParameters,
            permissionLevel: mockCommand.permissionLevel,
            cheatsRequired: mockCommand.cheatsRequired
        }, mockCallback);
    });

    it("should register enums if provided", () => {
        const mockEnum = {
            name: "TestEnum",
            values: ["value1", "value2"]
        };
        mockCommand.enums = [mockEnum];
        const command = new VanillaCommand(mockCommand, mockCallback);
        command.registerCommand(mockCustomCommandRegistry);
        expect(mockCustomCommandRegistry.registerEnum).toHaveBeenCalledWith(mockEnum.name, mockEnum.values);
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
