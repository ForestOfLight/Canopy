import { describe, it, expect, vi } from "vitest";
import { RuleHelpEntry } from "../../../../../../Canopy[BP]/scripts/lib/canopy/help/RuleHelpEntry";

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
                getValue: vi.fn().mockResolvedValue(true),
                getType: () => 'boolean'
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
                getValue: vi.fn().mockResolvedValue(false),
                getType: () => 'boolean'
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

        it('should prefix the value with §u for integer type', async () => {
            const mockRule = {
                getID: () => 'testRule',
                getDescription: () => 'An integer rule',
                getValue: vi.fn().mockResolvedValue(42),
                getType: () => 'integer'
            };
            const entry = new RuleHelpEntry(mockRule);
            const coloredValue = await entry.fetchColoredValue();
            expect(coloredValue).toBe('§u42');
        });

        it('should prefix the value with §d for float type', async () => {
            const mockRule = {
                getID: () => 'testRule',
                getDescription: () => 'A float rule',
                getValue: vi.fn().mockResolvedValue(1.5),
                getType: () => 'float'
            };
            const entry = new RuleHelpEntry(mockRule);
            const coloredValue = await entry.fetchColoredValue();
            expect(coloredValue).toBe('§d1.5');
        });

        it('should return the raw value for unknown types', async () => {
            const mockRule = {
                getID: () => 'testRule',
                getDescription: () => 'An unknown rule',
                getValue: vi.fn().mockResolvedValue('someValue'),
                getType: () => 'unknown'
            };
            const entry = new RuleHelpEntry(mockRule);
            const coloredValue = await entry.fetchColoredValue();
            expect(coloredValue).toBe('someValue');
        });
    });
});