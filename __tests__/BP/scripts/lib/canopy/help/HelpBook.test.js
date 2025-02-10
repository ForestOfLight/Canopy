import { describe, it, expect, beforeEach, vi } from "vitest";
import HelpBook from "../../../../../../Canopy [BP]/scripts/lib/canopy/help/HelpBook";
import RuleHelpPage from "../../../../../../Canopy [BP]/scripts/lib/canopy/help/RuleHelpPage";
import { Rule } from "../../../../../../Canopy [BP]/scripts/lib/canopy/Rule";
import { Rules } from "../../../../../../Canopy [BP]/scripts/lib/canopy/Rules";
import CommandHelpPage from "../../../../../../Canopy [BP]/scripts/lib/canopy/help/CommandHelpPage";
import { Command } from "../../../../../../Canopy [BP]/scripts/lib/canopy/Command";
import { Commands } from "../../../../../../Canopy [BP]/scripts/lib/canopy/Commands";

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

describe('HelpBook', () => {
    let book;
    beforeEach(() => {
        Rules.clear();
        Commands.clear();
        book = new HelpBook();
    });

    describe('constructor', () => {
        it('should initialize with the correct properties', () => {
            expect(book.getNumPages()).toEqual(0);
        });
    });

    describe('newPage', () => {
        it('should add a new page to the book', () => {
            book.newPage(new RuleHelpPage('Test Page'));
            expect(book.getNumPages()).toEqual(1);
        });

        it('should throw an error if the page is not an instance of RuleHelpPage', () => {
            expect(() => book.newPage({})).toThrow('[HelpBook] Page must be an instance of HelpPage');
        });
    });

    describe('getPage', () => {
        it('should return the correct page', () => {
            const page = new RuleHelpPage({ title: 'Test Page'});
            book.newPage(page);
            expect(book.getPage('Test Page')).toEqual(page);
        });

        it('should throw an error if the page does not exist', () => {
            expect(() => book.getPage('Nonexistent Page')).toThrow('[HelpBook] Page does not exist');
        });
    });

    describe('addEntry', () => {
        it('should add an entry to the specified page', () => {
            const page = new RuleHelpPage({ title: 'Test Page' });
            book.newPage(page);
            const rule = new Rule({ id: 'testRule', category: 'testCategory', description: 'Test Rule' });
            book.addEntry("Test Page", rule);
            expect(page.hasEntry(rule)).toBeTruthy();
        });

        it('should add InfoDisplay pages to the InfoDisplay page', () => {
            const page = new RuleHelpPage({ title: 'InfoDisplay' });
            book.newPage(page);
            const rule = new Rule({ id: 'testRule', category: 'InfoDisplay', description: 'Test Rule' });
            book.addEntry("InfoDisplay", rule, true);
            expect(page.hasEntry(rule)).toBeTruthy();
        });

        it('should throw an error if the page does not exist', () => {
            expect(() => book.addEntry('Nonexistent Page', 'Test Entry')).toThrow('[HelpBook] Page does not exist');
        });
    });

    describe('getPages', () => {
        it('should return all pages in the book', () => {
            book.newPage(new RuleHelpPage({ title: 'Page 1' }));
            book.newPage(new RuleHelpPage({ title: 'Page 2' }));
            expect(book.getPages().length).toEqual(2);
        });
    });

    describe('getPageNames', () => {
        it('should return the names of all pages in the book', () => {
            book.newPage(new RuleHelpPage({ title: 'Page 1' }));
            book.newPage(new RuleHelpPage({ title: 'Page 2' }));
            expect(book.getPageNames()).toEqual(['Page 1', 'Page 2']);
        });
    });

    describe('getNumPages', () => {
        it('should return the correct number of pages', () => {
            book.newPage(new RuleHelpPage({ title: 'Page 1' }));
            book.newPage(new RuleHelpPage({ title: 'Page 2' }));
            expect(book.getNumPages()).toEqual(2);
        });
    });

    describe('print', () => {
        it('should print all pages to the player', async () => {
            const page1 = new RuleHelpPage({ title: 'Page 1' });
            const page2 = new RuleHelpPage({ title: 'Page 2' });
            book.newPage(page1);
            book.newPage(page2);

            const player = {
                sendMessage: vi.fn(),
            };

            await book.print(player);
            expect(player.sendMessage).toHaveBeenCalledTimes(2);
        });

        it('should handle empty book', async () => {
            const player = {
                sendMessage: vi.fn(),
            };

            await book.print(player);
            expect(player.sendMessage).toHaveBeenCalledTimes(0);
        });
    });

    describe('printPage', () => {
        it('should print the specified page to the player', async () => {
            const page = new RuleHelpPage({ title: 'Test Page' });
            book.newPage(page);

            const player = {
                sendMessage: vi.fn(),
            };

            await book.printPage('Test Page', player);
            expect(player.sendMessage).toHaveBeenCalledTimes(1);
        });

        it('should throw an error if the page does not exist', async () => {
            const player = {
                sendMessage: vi.fn(),
            };

            await expect(book.printPage('Nonexistent Page', player)).rejects.toThrow('[HelpBook] Page does not exist');
        });
    });

    describe('printSearchResults', () => {
        it('should print search results to the player', async () => {
            const page1 = new RuleHelpPage({ title: 'Page 1' });
            const page2 = new RuleHelpPage({ title: 'Page 2' });
            page1.addEntry(new Rule({ identifier: 'searchableRule', category: 'testCategory', description: 'Searchable Rule' }));
            book.newPage(page1);
            book.newPage(page2);

            const player = {
                sendMessage: vi.fn(),
            };

            await book.printSearchResults('searchable', player);
            expect(player.sendMessage).toHaveBeenCalledTimes(1);
        });

        it('should handle no search results', async () => {
            const page1 = new RuleHelpPage('Page 1');
            const page2 = new RuleHelpPage('Page 2');
            book.newPage(page1);
            book.newPage(page2);

            const player = {
                sendMessage: vi.fn(),
            };

            await book.printSearchResults('Nonexistent', player);
            expect(player.sendMessage).toHaveBeenCalledWith({ translate: 'commands.help.search.noresult', with: ['Nonexistent'] });
        });

        it('should handle translatable descriptions', async () => {
            const page1 = new RuleHelpPage({ title: 'Page 1' });
            const page2 = new RuleHelpPage({ title: 'Page 2' });
            page1.addEntry(new Rule({ identifier: 'searchableRule', category: 'testCategory', description: { translate: 'rule.searchable' } }));
            book.newPage(page1);
            book.newPage(page2);

            const player = {
                sendMessage: vi.fn(),
            };

            await book.printSearchResults('searchable', player);
            expect(player.sendMessage).toHaveBeenCalledTimes(1);
        });

        it('should handle commands with help entries with text descriptions', async () => {
            const page1 = new CommandHelpPage({ title: 'Page 1' });
            const page2 = new CommandHelpPage({ title: 'Page 2' });
            const command = new Command({
                name: 'searchableCommand',
                description: 'Searchable Command',
                usage: 'searchable <arg>',
                helpEntries: [
                    { usage: 'searchable arg', description: 'An argument' },
                ]
            });
            page1.addEntry(command);
            book.newPage(page1);
            book.newPage(page2);

            const player = {
                sendMessage: vi.fn(),
            };

            await book.printSearchResults('searchable', player);
            expect(player.sendMessage).toHaveBeenCalledTimes(1);
        });

        it('should handle commands with help entries with translatable descriptions', async () => {
            const page1 = new CommandHelpPage({ title: 'Page 1' });
            const page2 = new CommandHelpPage({ title: 'Page 2' });
            const command = new Command({
                name: 'searchableCommand',
                description: 'Searchable Command',
                usage: 'searchable <arg>',
                helpEntries: [
                    { usage: 'searchable arg', description: { translate: 'command.searchable.arg' } },
                ]
            });
            page1.addEntry(command);
            book.newPage(page1);
            book.newPage(page2);

            const player = {
                sendMessage: vi.fn(),
            };

            await book.printSearchResults('searchable', player);
            expect(player.sendMessage).toHaveBeenCalledTimes(1);
        });
    });
});