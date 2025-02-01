import { describe, it, expect, vi, beforeEach } from 'vitest';
import InfoDisplayRuleHelpEntry from '../../../../../../Canopy [BP]/scripts/lib/canopy/help/InfoDisplayRuleHelpEntry';
import InfoDisplayRule from '../../../../../../Canopy [BP]/scripts/lib/canopy/InfoDisplayRule';
import Rules from '../../../../../../Canopy [BP]/scripts/lib/canopy/Rules';

vi.mock('@minecraft/server', () => ({
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

describe('InfoDisplayRuleHelpEntry', () => {
    let entry;
    beforeEach(() => {
        Rules.clear();
        const infoDisplayRule = new InfoDisplayRule({ identifier: 'testRule', description: 'This is a test rule' });
        entry = new InfoDisplayRuleHelpEntry(infoDisplayRule, 'player');
    });

    describe('constructor', () => {
        it('should throw a TypeError if infoDisplayRule is not an instance of InfoDisplayRule', () => {
            expect(() => new InfoDisplayRuleHelpEntry({}, 'player')).toThrow(TypeError);
        });

        it('should create an instance of InfoDisplayRuleHelpEntry', () => {
            expect(entry).toBeInstanceOf(InfoDisplayRuleHelpEntry);
        });
    });

    describe('fetchColoredValue', () => {
        it('should return the correct colored value', async () => {
            vi.spyOn(entry.rule, 'getValue').mockResolvedValue(true);
            const result = await entry.fetchColoredValue();
            expect(result).toBe('§atrue§r');
        });

        it('should return the correct colored value when false', async () => {
            vi.spyOn(entry.rule, 'getValue').mockResolvedValue(false);
            const result = await entry.fetchColoredValue();
            expect(result).toBe('§cfalse§r');
        });
    });

    describe('toRawMessage', () => {
        it('should return the correct raw message', async () => {
            vi.spyOn(entry.rule, 'getValue').mockResolvedValue(true);
            const result = await entry.toRawMessage();
            expect(result).toEqual({
                rawtext: [
                    { text: '§7testRule: §atrue§r§8 - ' },
                    { text: 'This is a test rule' }
                ]
            });
        });
    });
});