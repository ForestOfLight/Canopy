import { describe, it, expect } from 'vitest';
import { AnalyzeAreaUI, LIST_PAGE_SIZE } from '../../../../../../Canopy[BP]/scripts/src/classes/analyzearea/AnalyzeAreaUI.js';

describe('AnalyzeAreaUI', () => {
    it('exposes the page builders as methods', () => {
        expect(typeof AnalyzeAreaUI).toBe('function');
        expect(typeof AnalyzeAreaUI.prototype.showSelector).toBe('function');
        expect(typeof AnalyzeAreaUI.prototype.showCreateForm).toBe('function');
        expect(typeof AnalyzeAreaUI.prototype.showAnalysisPage).toBe('function');
    });

    it('uses a 50-item page size', () => {
        expect(LIST_PAGE_SIZE).toBe(50);
    });
});
