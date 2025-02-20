import { describe, it, expect, vi, beforeEach } from "vitest";
import { Command } from "../../../../../Canopy [BP]/scripts/lib/canopy/Command";
import { Commands } from "../../../../../Canopy [BP]/scripts/lib/canopy/Commands";
import IPC from "../../../../../Canopy [BP]/scripts/lib/ipc/ipc";
import { Extension } from "../../../../../Canopy [BP]/scripts/lib/canopy/Extension";
import { Extensions } from "../../../../../Canopy [BP]/scripts/lib/canopy/Extensions";
import { CommandCallbackRequest } from "../../../../../Canopy [BP]/scripts/lib/canopy/extension.ipc";

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
        runJob: vi.fn()
    }
}));

describe("Command", () => {
    beforeEach(() => {
        Commands.clear();
    });

    describe("constructor", () => {
        it("should throw an error if name is not provided", () => {
            expect(() => new Command({ usage: "test" })).toThrow('[Command] name is required.');
        });

        it("should throw an error if usage is not provided", () => {
            expect(() => new Command({ name: "test" })).toThrow('[Command] usage is required.');
        });

        it("should throw an error if args is not an array", () => {
            expect(() => new Command({ name: "test", usage: "test", args: "notArray" })).toThrow('[Command] args must be an array.');
        });

        it("should throw an error if contingentRules is not an array", () => {
            expect(() => new Command({ name: "test", usage: "test", contingentRules: "notArray" })).toThrow('[Command] contingentRules must be an array.');
        });

        it("should throw an error if adminOnly is not a boolean", () => {
            expect(() => new Command({ name: "test", usage: "test", adminOnly: "notBoolean" })).toThrow('[Command] adminOnly must be a boolean.');
        });

        it("should throw an error if helpEntries is not an array", () => {
            expect(() => new Command({ name: "test", usage: "test", helpEntries: "notArray" })).toThrow('[Command] helpEntries must be an array.');
        });

        it("should throw an error if extensionName is not a valid extension", () => {
            expect(() => new Command({ name: "test", usage: "test", extensionName: "invalidExtension" })).toThrow('[Command] extensionName must be a valid Extension.');
        });

        it("should register the command", () => {
            const command = new Command({ name: "test", usage: "test" });
            expect(Commands.get("test")).toBe(command);
        });
    });

    describe("getters", () => {
        let command;

        beforeEach(() => {
            command = new Command({
                name: "test",
                description: { text: "description" },
                usage: "test",
                args: ["arg1"],
                contingentRules: ["rule1"],
                adminOnly: true,
                helpEntries: ["entry1"],
                helpHidden: true,
                extensionName: undefined
            });
        });

        it("should return the correct name", () => {
            expect(command.getName()).toBe("test");
        });

        it("should return the correct description", () => {
            expect(command.getDescription()).toEqual({ text: "description" });
        });

        it("should return the correct usage", () => {
            expect(command.getUsage()).toBe(Commands.getPrefix() + "test");
        });

        it("should return the correct args", () => {
            expect(command.getArgs()).toEqual(["arg1"]);
        });

        it("should return the correct contingentRules", () => {
            expect(command.getContingentRules()).toEqual(["rule1"]);
        });

        it("should return the correct adminOnly status", () => {
            expect(command.isAdminOnly()).toBe(true);
        });

        it("should return the correct helpEntries", () => {
            expect(command.getHelpEntries()).toEqual(["entry1"]);
        });

        it("should return the correct extensionName", () => {
            expect(command.getExtension()).toBeUndefined();
        });

        it("should return the correct helpHidden status", () => {
            expect(command.isHelpHidden()).toBe(true);
        });
    });

    describe("runCallback", () => {
        it("should call the callback when not part of an extension", () => {
            const callbackMock = vi.fn();
            const command = new Command({
                name: "test",
                usage: "test",
                callback: callbackMock
            });
            const sender = { name: "sender" };
            const args = ["arg1"];

            command.runCallback(sender, args);

            expect(callbackMock).toHaveBeenCalledWith(sender, args);
        });

        it("should send an IPC message when part of an extension", () => {
            const ipcSendMock = vi.spyOn(IPC, "send");
            Extensions.extensions["extension"] = new Extension({
                name: "extension",
                version: "1.0.0",
                author: "author",
                description: { text: "description" }
            });
            const command = new Command({
                name: "test",
                usage: "test",
                extensionName: "extension",
                callback: vi.fn()
            });
            const sender = { name: "sender" };
            const args = ["arg1"];

            command.runCallback(sender, args);

            expect(ipcSendMock).toHaveBeenCalledWith("canopyExtension:extension:commandCallbackRequest", CommandCallbackRequest, {
                commandName: "test",
                senderName: "sender",
                args: ["arg1"]
            });
        });
    });

    describe("sendUsage", () => {
        it("should send the usage message to the sender", () => {
            const sendMessageMock = vi.fn();
            const sender = { sendMessage: sendMessageMock };
            const command = new Command({ name: "test", usage: "test" });

            command.sendUsage(sender);

            expect(sendMessageMock).toHaveBeenCalledWith({ translate: 'commands.generic.usage', with: [Commands.getPrefix() + "test"] });
        });
    });
});
