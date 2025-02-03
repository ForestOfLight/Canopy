import { describe, it, expect, vi, beforeEach } from "vitest";
import CommandHelpPage from "../../../../../../Canopy [BP]/scripts/lib/canopy/help/CommandHelpPage";
import CommandHelpEntry from "../../../../../../Canopy [BP]/scripts/lib/canopy/help/CommandHelpEntry";
import Command from "../../../../../../Canopy [BP]/scripts/lib/canopy/Command";
import Commands from "../../../../../../Canopy [BP]/scripts/lib/canopy/Commands";

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

describe('CommandHelpPage', () => {
    describe('constructor', () => {
        it('should create an instance with title and description', () => {
            const title = 'Test Title';
            const description = 'Test Description';
            const commandHelpPage = new CommandHelpPage({ title, description });

            expect(commandHelpPage.title).toBe(title);
            expect(commandHelpPage.description).toEqual({ text: description });
            expect(commandHelpPage.entries).toEqual([]);
        });

        it('should create an instance with title and default description', () => {
            const title = 'Test Title';
            const commandHelpPage = new CommandHelpPage({ title });

            expect(commandHelpPage.title).toBe(title);
            expect(commandHelpPage.description).toBeNull();
            expect(commandHelpPage.entries).toEqual([]);
        });

        it('should create an instance with title, description, and extensionName', () => {
            const title = 'Test Title';
            const description = 'Test Description';
            const extensionName = 'Test Extension';
            const commandHelpPage = new CommandHelpPage({ title, description }, extensionName);

            expect(commandHelpPage.title).toBe("Test Extension:Test Title");
            expect(commandHelpPage.description).toEqual({ text: 'Test Description' });
            expect(commandHelpPage.extensionName).toBe(extensionName);
            expect(commandHelpPage.entries).toEqual([]);
        });
    });

    describe('addEntry', () => {
        beforeEach(() => {
            Commands.clear();
        });

        it('should add a CommandHelpEntry to entries', () => {
            const title = 'Test Title';
            const description = 'Test Description';
            const commandHelpPage = new CommandHelpPage({ title, description });
            const command = new Command({ name: 'testCommand', description: 'Test Command', usage: 'testCommand' });

            commandHelpPage.addEntry(command);

            expect(commandHelpPage.entries.length).toBe(1);
            expect(commandHelpPage.entries[0]).toBeInstanceOf(CommandHelpEntry);
            expect(commandHelpPage.entries[0].command).toBe(command);
        });

        it('should not add duplicate CommandHelpEntry to entries', () => {
            const title = 'Test Title';
            const description = 'Test Description';
            const commandHelpPage = new CommandHelpPage({ title, description });
            const command = new Command({ name: 'testCommand', description: 'Test Command', usage: 'testCommand' });

            commandHelpPage.addEntry(command);
            commandHelpPage.addEntry(command);

            expect(commandHelpPage.entries.length).toBe(1);
        });

        it('should throw an error if entry is not an instance of Command', () => {
            const title = 'Test Title';
            const description = 'Test Description';
            const commandHelpPage = new CommandHelpPage({ title, description });
            const invalidCommand = {};

            expect(() => commandHelpPage.addEntry(invalidCommand)).toThrow('[HelpPage] Entry must be an instance of Command');
        });
    });

    describe('hasEntry', () => {
        beforeEach(() => {
            Commands.clear();
        });

        it('should return true if entry exists', () => {
            const title = 'Test Title';
            const description = 'Test Description';
            const commandHelpPage = new CommandHelpPage({ title, description });
            const command = new Command({ name: 'testCommand', description: 'Test Command', usage: 'testCommand' });

            commandHelpPage.addEntry(command);

            expect(commandHelpPage.hasEntry(command)).toBe(true);
        });

        it('should return false if entry does not exist', () => {
            const title = 'Test Title';
            const description = 'Test Description';
            const commandHelpPage = new CommandHelpPage({ title, description });
            const command = new Command({ name: 'testCommand', description: 'Test Command', usage: 'testCommand' });

            expect(commandHelpPage.hasEntry(command)).toBe(false);
        });
    });

    describe('toRawMessage', () => {
        beforeEach(() => {
            Commands.clear();
        });

        it('should return raw message with entries', () => {
            const title = 'Test Title';
            const description = 'Test Description';
            const commandHelpPage = new CommandHelpPage({ title, description });
            const command = new Command({ name: 'testCommand', description: 'Test Command', usage: 'testCommand' });

            commandHelpPage.addEntry(command);

            const rawMessage = commandHelpPage.toRawMessage();

            expect(rawMessage).toEqual({
                rawtext: [
                    { translate: "commands.help.page.header", with: ["Test Title"] },
                    { rawtext: [
                        { text: "\n§2" },
                        { text: "Test Description" },
                    ]},
                    { rawtext:  [
                        { text: "\n  " },
                        { rawtext:  [
                            { text: "§2undefinedtestCommand§8 - " },
                            { text: "Test Command" },
                        ]}
                    ]}
                ]
            });
        });

        it('should return raw message without description', () => {
            const title = 'Test Title';
            const commandHelpPage = new CommandHelpPage({ title });

            const rawMessage = commandHelpPage.toRawMessage();

            expect(rawMessage).toEqual({
                rawtext: [
                    { translate: 'commands.help.page.header', with: ['Test Title'] }
                ]
            });
        });
    });
});