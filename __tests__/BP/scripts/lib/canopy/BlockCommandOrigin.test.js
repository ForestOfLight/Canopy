import { BlockCommandOrigin } from "../../../../../Canopy [BP]/scripts/lib/canopy/commands/BlockCommandOrigin";
import { beforeEach, describe, expect, it } from "vitest";

describe("BlockCommandOrigin", () => {
    let mockOrigin;

    beforeEach(() => {
        mockOrigin = new BlockCommandOrigin({ sourceType: "Block", sourceBlock: true });
    })

    it("should get the source", () => {
        expect(mockOrigin.getSource()).toBeTruthy();
    });
});
