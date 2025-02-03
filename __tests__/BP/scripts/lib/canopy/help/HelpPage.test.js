import { describe, it, expect } from 'vitest';
import HelpPage from '../../../../../../Canopy [BP]/scripts/lib/canopy/help/HelpPage';

describe('HelpPage', () => {
    describe('constructor', () => {
        it('should initialize with given title and description', () => {
            const helpPage = new HelpPage('Test Title', 'Test Description');
            expect(helpPage.title).toBe('Test Title');
            expect(helpPage.description).toEqual({ text: 'Test Description' });
            expect(helpPage.extensionName).toBe(false);
        });

        it('should initialize with extension name if provided', () => {
            const helpPage = new HelpPage('Test Title', 'Test Description', 'TestExtension');
            expect(helpPage.title).toBe('TestExtension:Test Title');
            expect(helpPage.description).toEqual({ text: 'Test Description' });
            expect(helpPage.extensionName).toBe('TestExtension');
        });

        it('should handle description as a rawtext object', () => {
            const helpPage = new HelpPage('Test Title', { text: 'Test Description' });
            expect(helpPage.title).toBe('Test Title');
            expect(helpPage.description).toEqual({ text: 'Test Description' });
            expect(helpPage.extensionName).toBe(false);
        });
    });

    describe('getEntries', () => {
        it('should return empty entries array', () => {
            const helpPage = new HelpPage('Test Title');
            expect(helpPage.getEntries()).toEqual([]);
        });

        it('should return entries array', () => {
            const helpPage = new HelpPage('Test Title');
            helpPage.entries.push('entry1', 'entry2');
            expect(helpPage.getEntries()).toEqual(['entry1', 'entry2']);
        });
    });

    describe('getPrintStarter', () => {
        it('should return correct print starter without extension name', () => {
            const helpPage = new HelpPage('Test Title');
            const expectedPrintStarter = { rawtext: [{ translate: 'commands.help.page.header', with: ['Test Title'] }] };
            expect(helpPage.getPrintStarter()).toEqual(expectedPrintStarter);
        });

        it('should return correct print starter with extension name', () => {
            const helpPage = new HelpPage('Test Title', '', 'TestExtension');
            const expectedPrintStarter = { rawtext: [{ translate: 'commands.help.page.header', with: ['§aTestExtension§f:Test Title'] }] };
            expect(helpPage.getPrintStarter()).toEqual(expectedPrintStarter);
        });
    });
});