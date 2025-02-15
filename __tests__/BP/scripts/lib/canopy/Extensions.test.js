import { describe, it, expect, vi, beforeEach } from "vitest";
import { Extensions } from "../../../../../Canopy [BP]/scripts/lib/canopy/Extensions.js";
import { Extension } from "../../../../../Canopy [BP]/scripts/lib/canopy/Extension.js";

vi.mock("@minecraft/server", () => ({
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

describe("Extensions", () => {
    beforeEach(() => {
        Extensions.clear();
        Extensions.extensions["test_extension"] = new Extension({
            name: "Test Extension",
            version: "1.0.0",
            author: "Author Name",
            description: "This is a test extension"
        });
    });

    describe('get()', () => {
        it('should return the extension by ID', () => {
            const extension = Extensions.extensions["test_extension"];
            expect(Extensions.get('test_extension')).toBe(extension);
        });

        it('should return undefined if the extension does not exist', () => {
            expect(Extensions.get('invalid_extension')).toBeUndefined();
        });
    });

    describe('remove()', () => {
        it('should remove the extension by ID', () => {
            Extensions.remove('test_extension');
            expect(Extensions.get('test_extension')).toBeUndefined();
        });

        it('should do nothing if the extension does not exist', () => {
            Extensions.remove('invalid_extension');
            expect(Extensions.get('test_extension')).toBeDefined();
        });
    });

    describe('clear()', () => {
        it('should remove all extensions', () => {
            Extensions.clear();
            expect(Extensions.getAll()).toEqual([]);
        });
    });

    describe('getAll()', () => {
        it('should return all extensions', () => {
            const extension = Extensions.extensions["test_extension"];
            expect(Extensions.getAll()).toEqual([extension]);
        });
    });

    describe('exists()', () => {
        it('should return true if the extension exists', () => {
            expect(Extensions.exists('test_extension')).toBe(true);
        });

        it('should return false if the extension does not exist', () => {
            expect(Extensions.exists('invalid_extension')).toBe(false);
        });
    });

    describe('getIds()', () => {
        it('should return all extension IDs', () => {
            expect(Extensions.getIds()).toEqual(['test_extension']);
        });
    });

    describe('getNames()', () => {
        it('should return all extension names', () => {
            expect(Extensions.getNames()).toEqual(['Test Extension']);
        });
    });

    describe('getVersionedNames()', () => {
        it('should return all extension names with versions', () => {
            expect(Extensions.getVersionedNames()).toEqual([{ name: 'Test Extension', version: '1.0.0' }]);
        });
    });

    describe.skip('setupExtensionRegistration()', () => {
        // Gametest
    });
});