import { describe, it, expect } from 'vitest';
import { AreaAnalyzer, MATCH_CAP } from '../../../../../../Canopy[BP]/scripts/src/classes/analyzearea/AreaAnalyzer.js';

// A dimension whose getBlock returns a block with typeId based on coordinates.
function makeDimension(typeIdAt) {
    return {
        getBlock: (loc) => {
            const typeId = typeIdAt(loc);
            if (typeId === undefined) return undefined;
            if (typeId === 'THROW') throw new Error('unloaded');
            return { typeId, ...loc };
        }
    };
}

const isStone = { evaluate: (block) => block.typeId === 'minecraft:stone' };

describe('AreaAnalyzer', () => {
    it('collects locations whose block matches the evaluator', () => {
        const dimension = makeDimension((loc) => (loc.x === 1 ? 'minecraft:stone' : 'minecraft:air'));
        const analyzer = new AreaAnalyzer(dimension, { x: 0, y: 0, z: 0 }, { x: 2, y: 0, z: 0 }, isStone);
        analyzer.runToCompletion();
        expect(analyzer.matches).toEqual([{ x: 1, y: 0, z: 0 }]);
        expect(analyzer.scanned).toBe(3);
        expect(analyzer.capped).toBe(false);
    });

    it('counts undefined blocks and thrown evaluations as errors, not matches', () => {
        const dimension = makeDimension((loc) => (loc.x === 0 ? undefined : 'THROW'));
        const analyzer = new AreaAnalyzer(dimension, { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, isStone);
        analyzer.runToCompletion();
        expect(analyzer.matches).toEqual([]);
        expect(analyzer.errorCount).toBe(2);
    });

    it('stops at the match cap and sets capped', () => {
        const dimension = makeDimension(() => 'minecraft:stone');
        const analyzer = new AreaAnalyzer(dimension, { x: 0, y: 0, z: 0 }, { x: 4, y: 0, z: 0 }, isStone, { matchCap: 3 });
        analyzer.runToCompletion();
        expect(analyzer.matches).toHaveLength(3);
        expect(analyzer.capped).toBe(true);
    });

    it('exposes the default match cap', () => {
        expect(MATCH_CAP).toBe(1000);
    });
});
