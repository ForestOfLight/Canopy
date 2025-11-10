import { describe, it, expect, vi, beforeEach } from "vitest";
import { RuleHelpPage } from "../../../../../../Canopy [BP]/scripts/lib/canopy/help/RuleHelpPage";
import { RuleHelpEntry } from "../../../../../../Canopy [BP]/scripts/lib/canopy/help/RuleHelpEntry";
import { BooleanRule } from "../../../../../../Canopy [BP]/scripts/lib/canopy/rules/BooleanRule";
import { Rules } from "../../../../../../Canopy [BP]/scripts/lib/canopy/rules/Rules";

vi.mock("@minecraft/server", () => ({
    world: { 
        beforeEvents: {
            chatSend: {
                subscribe: vi.fn()
            }
        },
        afterEvents: {
            worldLoad: {
                subscribe: vi.fn()
            }
        },
        getDynamicProperty: vi.fn()
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

describe('RuleHelpPage', () => {
    describe('constructor', () => {
        it('should create an instance with title, description, and usage', () => {
            const title = 'Test Title';
            const description = 'Test Description';
            const usage = 'Test Usage';
            const ruleHelpPage = new RuleHelpPage({ title, description, usage });

            expect(ruleHelpPage.title).toBe(title);
            expect(ruleHelpPage.description).toEqual({ text: description });
            expect(ruleHelpPage.usage).toBe(usage);
            expect(ruleHelpPage.entries).toEqual([]);
        });

        it('should create an instance with title and default description', () => {
            const title = 'Test Title';
            const usage = 'Test Usage';
            const ruleHelpPage = new RuleHelpPage({ title, usage });

            expect(ruleHelpPage.title).toBe(title);
            expect(ruleHelpPage.description).toEqual({ text: '' });
            expect(ruleHelpPage.usage).toBe(usage);
            expect(ruleHelpPage.entries).toEqual([]);
        });

        it('should create an instance with title, description, usage, and extensionName', () => {
            const title = 'Test Title';
            const description = 'Test Description';
            const usage = 'Test Usage';
            const extensionName = 'Test Extension';
            const ruleHelpPage = new RuleHelpPage({ title, description, usage }, extensionName);

            expect(ruleHelpPage.title).toBe("Test Extension:Test Title");
            expect(ruleHelpPage.description).toEqual({ text: description });
            expect(ruleHelpPage.usage).toBe(usage);
            expect(ruleHelpPage.extensionName).toBe(extensionName);
            expect(ruleHelpPage.entries).toEqual([]);
        });
    });

    describe('addEntry', () => {
        beforeEach(() => {
            Rules.clear();
        });

        it('should throw an error if entry is not a Rule', () => {
            const title = 'Test Title';
            const description = 'Test Description';
            const usage = 'Test Usage';
            const ruleHelpPage = new RuleHelpPage({ title, description, usage });
            const invalidEntry = { identifier: 'testRule', description: 'Test Rule', usage: 'testRule' };

            expect(() => ruleHelpPage.addEntry(invalidEntry)).toThrow('[HelpPage] Entry must be an instance of Rule');
        });

        it('should add a RuleHelpEntry to entries', () => {
            const title = 'Test Title';
            const description = 'Test Description';
            const usage = 'Test Usage';
            const ruleHelpPage = new RuleHelpPage({ title, description, usage });
            const rule = new BooleanRule({ identifier: 'testRule', description: 'Test Rule', usage: 'testRule' });
            const ruleHelpEntry = new RuleHelpEntry(rule);

            ruleHelpPage.addEntry(rule);

            expect(ruleHelpPage.entries[0]).toEqual(ruleHelpEntry);
        });

        it('should not add a duplicate RuleHelpEntry to entries', () => {
            const title = 'Test Title';
            const description = 'Test Description';
            const usage = 'Test Usage';
            const ruleHelpPage = new RuleHelpPage({ title, description, usage });
            const rule = new BooleanRule({ identifier: 'testRule', description: 'Test Rule', usage: 'testRule' });

            ruleHelpPage.addEntry(rule);
            ruleHelpPage.addEntry(rule);

            expect(ruleHelpPage.entries).toHaveLength(1);
        });
    });

    describe('hasEntry', () => {
        beforeEach(() => {
            Rules.clear();
        });

        it('should return true if entry exists', () => {
            const title = 'Test Title';
            const description = 'Test Description';
            const usage = 'Test Usage';
            const ruleHelpPage = new RuleHelpPage({ title, description, usage });
            const rule = new BooleanRule({ identifier: 'testRule', description: 'Test Rule', usage: 'testRule' });

            ruleHelpPage.addEntry(rule);

            expect(ruleHelpPage.hasEntry(rule)).toBe(true);
        });

        it('should return false if entry does not exist', () => {
            const title = 'Test Title';
            const description = 'Test Description';
            const usage = 'Test Usage';
            const ruleHelpPage = new RuleHelpPage({ title, description, usage });
            const rule = new BooleanRule({ identifier: 'testRule', description: 'Test Rule', usage: 'testRule' });

            expect(ruleHelpPage.hasEntry(rule)).toBe(false);
        });
    });

    describe('toRawMessage', () => {
        beforeEach(() => {
            Rules.clear();
        });

        it('should return a raw message with entries', async () => {
            const title = 'Test Title';
            const description = 'Test Description';
            const usage = 'Test Usage';
            const ruleHelpPage = new RuleHelpPage({ title, description, usage });
            const rule = new BooleanRule({ identifier: 'testRule', description: 'Test Rule', usage: 'testRule' });
            ruleHelpPage.addEntry(rule);

            const rawMessage = await ruleHelpPage.toRawMessage();

            expect(rawMessage).toEqual({
                rawtext: [
                    { translate: 'commands.help.page.header', with: ['Test Title'] },
                    { rawtext: [{ text: `\n§2${usage}§8 - ` }, { text: description }] },
                    { rawtext: [{ text: '\n  ' }, { rawtext: [
                        { text: "§7testRule: §cfalse§r§8 - "},
                        { "text": "Test Rule" }
                    ]}]}
                ]
            });
        });
    });
});