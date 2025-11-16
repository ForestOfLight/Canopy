import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InfoDisplayRuleHelpPage } from '../../../../../../Canopy [BP]/scripts/lib/canopy/help/InfoDisplayRuleHelpPage';
import { InfoDisplayRule } from '../../../../../../Canopy [BP]/scripts/lib/canopy/rules/InfoDisplayRule';
import { InfoDisplayRuleHelpEntry } from '../../../../../../Canopy [BP]/scripts/lib/canopy/help/InfoDisplayRuleHelpEntry';
import { Rules } from '../../../../../../Canopy [BP]/scripts/lib/canopy/rules/Rules';

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

// Terrible practice. This is a workaround for a Vitest rollup error that causes the Rule class to not be imported properly in BooleanRule.
vi.mock('../../../../../../Canopy [BP]/scripts/lib/canopy/rules/Rule', () => ({
    Rule: class Rule {
        #category;
        #identifier;
        #description;
        #defaultValue;
        #contingentRules;
        #independentRules;

        constructor({ category, identifier, description = '', defaultValue = void 0,
                    contingentRules = [], independentRules = [], onModifyCallback = () => {} }) {
            this.#category = category;
            this.#identifier = identifier;
            this.#description = typeof description === 'string' ? { text: description } : description;
            this.#defaultValue = defaultValue;
            this.#contingentRules = contingentRules;
            this.#independentRules = independentRules;
            this.onModify = onModifyCallback;
        }

        getCategory() {
            return this.#category;
        }

        getID() {
            return this.#identifier;
        }

        getDescription() {
            return this.#description;
        }

        getContigentRuleIDs() {
            return this.#contingentRules;
        }

        getIndependentRuleIDs() {
            return this.#independentRules;
        }

        getDependentRuleIDs() {
            return [];
        }

        getExtension() {
            return null;
        }

        getType() {
            return 'mock';
        }

        getDefaultValue() {
            return this.#defaultValue;
        }

        resetToDefaultValue() {
            this.setValue(this.#defaultValue);
        }

        getValue() {
            return this.#defaultValue;
        }

        getNativeValue() {
            return this.#defaultValue;
        }

        setValue() {
            // Mock implementation
        }

        isInDomain() {
            return true;
        }

        isInRange() {
            return true;
        }
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