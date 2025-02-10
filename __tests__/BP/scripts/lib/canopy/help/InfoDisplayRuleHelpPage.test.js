import { describe, it, expect, vi, beforeEach } from 'vitest';
import InfoDisplayRuleHelpPage from '../../../../../../Canopy [BP]/scripts/lib/canopy/help/InfoDisplayRuleHelpPage';
import { InfoDisplayRule } from '../../../../../../Canopy [BP]/scripts/lib/canopy/InfoDisplayRule';
import InfoDisplayRuleHelpEntry from '../../../../../../Canopy [BP]/scripts/lib/canopy/help/InfoDisplayRuleHelpEntry';
import { Rules } from '../../../../../../Canopy [BP]/scripts/lib/canopy/Rules';

vi.mock("@minecraft/server", () => ({
    world: { 
        beforeEvents: {
            chatSend: {
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

describe('InfoDisplayRuleHelpPage', () => {
    describe('constructor', () => {
        it('should create an instance of InfoDisplayRuleHelpPage', () => {
            const page = new InfoDisplayRuleHelpPage({ title: 'Test', description: 'Test description', usage: 'Test usage' });
            expect(page).toBeInstanceOf(InfoDisplayRuleHelpPage);
        });
    });

    describe('addEntry', () => {
        beforeEach(() => {
            Rules.clear();
        });

        it('should add an entry if it is an instance of InfoDisplayRule', () => {
            const page = new InfoDisplayRuleHelpPage({ title: 'Test', description: 'Test description', usage: 'Test usage' });
            const rule = new InfoDisplayRule({ identifier: 'testRule', description: 'Test rule description' });
            page.addEntry(rule, 'player1');
            expect(page.entries).toHaveLength(1);
            expect(page.entries[0]).toBeInstanceOf(InfoDisplayRuleHelpEntry);
        });

        it('should throw an error if the entry is not an instance of InfoDisplayRule', () => {
            const page = new InfoDisplayRuleHelpPage({ title: 'Test', description: 'Test description', usage: 'Test usage' });
            expect(() => page.addEntry({}, 'player1')).toThrow('[HelpPage] Entry must be an instance of InfoDisplayRule');
        });

        it('should not add duplicate entries', () => {
            const page = new InfoDisplayRuleHelpPage({ title: 'Test', description: 'Test description', usage: 'Test usage' });
            const rule = new InfoDisplayRule({ identifier: 'testRule', description: 'Test rule description' });
            page.addEntry(rule, 'player1');
            page.addEntry(rule, 'player1');
            expect(page.entries).toHaveLength(1);
        });
    });
});