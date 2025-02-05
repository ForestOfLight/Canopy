/* eslint-disable max-classes-per-file */
import { describe, it, expect } from 'vitest';
import HelpPage from '../../../../../../Canopy [BP]/scripts/lib/canopy/help/HelpPage';

describe('HelpPage', () => {
    describe('constructor', () => {
        it('should throw an error when instantiated directly', () => {
            expect(() => new HelpPage('Test Title')).toThrow(TypeError);
        });

        it('should set title, description, and extensionName properties when instantiated through a subclass', () => {
            class TestHelpPage extends HelpPage {}
            const helpPage = new TestHelpPage('Test Title', 'Test Description', 'TestExtension');
            expect(helpPage.title).toBe('TestExtension:Test Title');
            expect(helpPage.description).toEqual({ text: 'Test Description' });
            expect(helpPage.extensionName).toBe('TestExtension');
        });
    });

    describe('addEntry', () => {
        it('should throw an error when addEntry is not implemented in a subclass', () => {
            class TestHelpPage extends HelpPage {}
            const helpPage = new TestHelpPage('Test Title');
            expect(() => helpPage.addEntry()).toThrow(Error);
        });
    });

    describe('hasEntry', () => {
        it('should throw an error when hasEntry is not implemented in a subclass', () => {
            class TestHelpPage extends HelpPage {}
            const helpPage = new TestHelpPage('Test Title');
            expect(() => helpPage.hasEntry()).toThrow(Error);
        });
    });

    describe('toRawMessage', () => {
        it('should throw an error when toRawMessage is not implemented in a subclass', () => {
            class TestHelpPage extends HelpPage {}
            const helpPage = new TestHelpPage('Test Title');
            expect(() => helpPage.toRawMessage()).toThrow(Error);
        });
    });

    describe('getEntries', () => {
        it('should return empty entries array', () => {
            class TestHelpPage extends HelpPage {}
            const helpPage = new TestHelpPage('Test Title');
            expect(helpPage.getEntries()).toEqual([]);
        });

        it('should return entries array', () => {
            class TestHelpPage extends HelpPage {}
            const helpPage = new TestHelpPage('Test Title');
            helpPage.entries.push('entry1', 'entry2');
            expect(helpPage.getEntries()).toEqual(['entry1', 'entry2']);
        });
    });

    describe('getPrintStarter', () => {
        it('should return correct print starter without extension name', () => {
            class TestHelpPage extends HelpPage {}
            const helpPage = new TestHelpPage('Test Title');
            const expectedPrintStarter = { rawtext: [{ translate: 'commands.help.page.header', with: ['Test Title'] }] };
            expect(helpPage.getPrintStarter()).toEqual(expectedPrintStarter);
        });

        it('should return correct print starter with extension name', () => {
            class TestHelpPage extends HelpPage {}
            const helpPage = new TestHelpPage('Test Title', '', 'TestExtension');
            const expectedPrintStarter = { rawtext: [{ translate: 'commands.help.page.header', with: ['§aTestExtension§f:Test Title'] }] };
            expect(helpPage.getPrintStarter()).toEqual(expectedPrintStarter);
        });
    });
});