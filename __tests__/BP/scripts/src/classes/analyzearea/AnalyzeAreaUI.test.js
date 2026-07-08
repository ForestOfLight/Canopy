import { describe, it, expect } from 'vitest';
import { showSelector, showCreateForm, showAnalysisPage, LIST_PAGE_SIZE } from '../../../../../../Canopy[BP]/scripts/src/classes/analyzearea/AnalyzeAreaUI.js';

describe('AnalyzeAreaUI', () => {
    it('exports the three page builders', () => {
        expect(typeof showSelector).toBe('function');
        expect(typeof showCreateForm).toBe('function');
        expect(typeof showAnalysisPage).toBe('function');
    });

    it('uses a 50-item page size', () => {
        expect(LIST_PAGE_SIZE).toBe(50);
    });
});
