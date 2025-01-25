import { describe, it, expect } from 'vitest';
import ArgumentParser from '../../../../../Canopy [BP]/scripts/lib/canopy/ArgumentParser.js';

describe('ArgumentParser', () => {
    it('should parse boolean arguments correctly', () => {
        const resultTrue = ArgumentParser.parseArgs('true');
        const resultFalse = ArgumentParser.parseArgs('false');
        expect(resultTrue).toEqual([true]);
        expect(resultFalse).toEqual([false]);
    });

    it('should parse number arguments correctly', () => {
        const result = ArgumentParser.parseArgs('123');
        expect(result).toEqual([123]);
    });

    it('should parse string arguments correctly', () => {
        const result = ArgumentParser.parseArgs('"hello"');
        expect(result).toEqual(['hello']);
    });

    it('should parse array arguments correctly', () => {
        const result = ArgumentParser.parseArgs('[1,2,3]');
        expect(result).toEqual([[1, 2, 3]]);
    });

    it('should parse lone entity arguments correctly', () => {
        const result = ArgumentParser.parseArgs('@e');
        expect(result).toEqual(['@e']);
    });

    it('should parse entity arguments correctly', () => {
        const result = ArgumentParser.parseArgs('@e[type=creeper]');
        expect(result).toEqual(['@e[type=creeper]']);
    });

    it('should parse mixed arguments correctly', () => {
        const result = ArgumentParser.parseArgs('true 123 "hello" [1,2,3] @e[type=creeper]');
        expect(result).toEqual([true, 123, 'hello', [1, 2, 3], '@e[type=creeper]']);
    });

    it('should handle empty input correctly', () => {
        const result = ArgumentParser.parseArgs('');
        expect(result).toEqual([]);
    });
});