import { describe, it, expect, vi } from "vitest";
import { RuleHelpEntry } from "../../../../../../Canopy [BP]/scripts/lib/canopy/help/RuleHelpEntry";

describe('RuleHelpEntry', () => {
    describe('constructor', () => {
        it('should create an instance with the correct properties', () => {
            const mockRule = {
                getID: () => 'testRule',
                getDescription: () => 'This is a test rule',
                getValue: () => true
            };
            const entry = new RuleHelpEntry(mockRule);
            expect(entry.rule).toBe(mockRule);
            expect(entry.title).toBe('testRule');
            expect(entry.description).toEqual({ text: 'This is a test rule' });
        });
    });

    describe('fetchColoredValue', () => {
        it('should generate the correct raw message', async () => {
            const mockRule = {
                getID: () => 'testRule',
                getDescription: () => 'This is a test rule',
                getValue: vi.fn().mockResolvedValue(true)
            };
            const entry = new RuleHelpEntry(mockRule);
            const rawMessage = await entry.toRawMessage();
            expect(rawMessage).toEqual({
                rawtext: [
                    { text: '§7testRule: §atrue§r§8 - ' },
                    { text: 'This is a test rule' }
                ]
            });
        });

        it('should generate the correct raw message when value is false', async () => {
            const mockRule = {
                getID: () => 'testRule',
                getDescription: () => 'This is a test rule',
                getValue: vi.fn().mockResolvedValue(false)
            };
            const entry = new RuleHelpEntry(mockRule);
            const rawMessage = await entry.toRawMessage();
            expect(rawMessage).toEqual({
                rawtext: [
                    { text: '§7testRule: §cfalse§r§8 - ' },
                    { text: 'This is a test rule' }
                ]
            });
        });
    });
});