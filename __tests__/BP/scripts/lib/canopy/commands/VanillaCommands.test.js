import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VanillaCommands } from '../../../../../../Canopy[BP]/scripts/lib/canopy/commands/VanillaCommands.js';
import { VanillaCommand } from '../../../../../../Canopy[BP]/scripts/lib/canopy/commands/VanillaCommand.js';

describe('VanillaCommands registry', () => {
    beforeEach(() => {
        VanillaCommands.clear();
    });

    it('should register a VanillaCommand on construction', () => {
        new VanillaCommand({ name: 'canopy:testcmd', description: 'test', callback: vi.fn() });
        expect(VanillaCommands.getAll()).toHaveLength(1);
    });

    it('should return all registered commands', () => {
        new VanillaCommand({ name: 'canopy:cmd1', description: 'a', callback: vi.fn() });
        new VanillaCommand({ name: 'canopy:cmd2', description: 'b', callback: vi.fn() });
        expect(VanillaCommands.getAll()).toHaveLength(2);
    });

    it('should clear all commands', () => {
        new VanillaCommand({ name: 'canopy:clearcmd', description: 'x', callback: vi.fn() });
        VanillaCommands.clear();
        expect(VanillaCommands.getAll()).toHaveLength(0);
    });
});

describe('VanillaCommand.getName', () => {
    beforeEach(() => { VanillaCommands.clear(); });

    it('should return the name without the namespace prefix', () => {
        const cmd = new VanillaCommand({ name: 'canopy:biomeedges', description: 'test', callback: vi.fn() });
        expect(cmd.getName()).toBe('biomeedges');
    });
});

describe('VanillaCommand.getSubCommandWikiDescription', () => {
    beforeEach(() => { VanillaCommands.clear(); });

    it('should return the subCommandWikiDescription map when provided', () => {
        const sub = { 'add': { description: 'Adds.', params: ['from', 'to'] } };
        const cmd = new VanillaCommand({ name: 'canopy:test', description: 'x', subCommandWikiDescription: sub, callback: vi.fn() });
        expect(cmd.getSubCommandWikiDescription()).toEqual(sub);
    });

    it('should return an empty object when not provided', () => {
        const cmd = new VanillaCommand({ name: 'canopy:plain', description: 'x', callback: vi.fn() });
        expect(cmd.getSubCommandWikiDescription()).toEqual({});
    });
});
