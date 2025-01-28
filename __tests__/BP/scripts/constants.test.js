import { describe, it, expect } from "vitest";
import { getCanopyVersion } from "../../utils";
import { PACK_VERSION } from "../../../Canopy [BP]/scripts/constants.js";

describe('Constants', () => {
    describe('PACK_VERSION', () => {
        it('should match the manifest version', () => {
            expect(PACK_VERSION).toBe(getCanopyVersion());
        });
    });
});