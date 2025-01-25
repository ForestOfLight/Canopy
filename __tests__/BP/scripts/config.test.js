import { describe, it, expect } from 'vitest';
import { getCanopyVersion } from '../../utils';
import { PACK_VERSION } from 'Canopy [BP]/scripts/config';

describe('Version', () => {
    it('should match the manifest version', () => {
        expect(PACK_VERSION).toBe(getCanopyVersion());
    });
});