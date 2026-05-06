import { describe, it, expect } from "vitest";
import { CommandHelpEntry } from "../../../../../../Canopy[BP]/scripts/lib/canopy/help/CommandHelpEntry";
import { Commands } from "../../../../../../Canopy[BP]/scripts/lib/canopy/commands/Commands";

describe('CommandHelpEntry', () => {
    const mockCommand = {
        getName: () => 'testCommand',
        getDescription: () => 'This is a test command',
        getUsage: () => `${Commands.getPrefix()}test`,
        getHelpEntries: () => [
            { usage: 'subcommand1', description: 'Description for subcommand1' },
            { usage: 'subcommand2', description: 'Description for subcommand2' }
        ]
    };

    it('should create an instance with the correct properties', () => {
        const entry = new CommandHelpEntry(mockCommand);
        expect(entry.command).toBe(mockCommand);
        expect(entry.title).toBe('testCommand');
        expect(entry.description).toEqual({ text: 'This is a test command' });
    });

    it('should generate the correct raw message', () => {
        const entry = new CommandHelpEntry(mockCommand);
        const rawMessage = entry.toRawMessage();
        expect(rawMessage).toEqual({
            rawtext: [
                { text: `§2${Commands.getPrefix()}test§8 - ` },
                { text: 'This is a test command' },
                { rawtext: [{ text: `\n  §7> §2${Commands.getPrefix()}subcommand1§8 - ` }, 'Description for subcommand1'] },
                { rawtext: [{ text: `\n  §7> §2${Commands.getPrefix()}subcommand2§8 - ` }, 'Description for subcommand2'] }
            ]
        });
    });
});