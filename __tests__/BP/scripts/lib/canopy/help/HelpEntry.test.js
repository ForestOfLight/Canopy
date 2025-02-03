/* eslint-disable max-classes-per-file */
import { describe, it, expect } from "vitest";
import HelpEntry from "../../../../../../Canopy [BP]/scripts/lib/canopy/help/HelpEntry";

describe('HelpEntry', () => {
    it('should throw an error when instantiated directly', () => {
        expect(() => new HelpEntry('Title', 'Description')).toThrow(TypeError);
    });

    it('should set title and description properties when instantiated through a subclass', () => {
        class TestHelpEntry extends HelpEntry {
            toRawMessage() {
                return `${this.title}: ${this.description}`;
            }
        }

        const entry = new TestHelpEntry('Test Title', 'Test Description');
        expect(entry.title).toBe('Test Title');
        expect(entry.description).toEqual({ text: 'Test Description' });
    });

    it('should throw an error when toRawMessage is not implemented in a subclass', () => {
        class TestHelpEntry extends HelpEntry {}

        const entry = new TestHelpEntry('Test Title', 'Test Description');
        expect(() => entry.toRawMessage()).toThrow(TypeError);
    });

    it('should not throw an error when toRawMessage is implemented in a subclass', () => {
        class TestHelpEntry extends HelpEntry {
            toRawMessage() {
                return { rawtext: [
                    { text: this.title },
                    this.description
                ]};
            }
        }

        const entry = new TestHelpEntry('Test Title', 'Test Description');
        expect(entry.toRawMessage()).toEqual({ rawtext: [
            { text: "Test Title" },
            { text: "Test Description" }
        ]});
    });
});