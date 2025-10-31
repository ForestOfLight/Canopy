import { EntityCommandOrigin } from "../../../../../Canopy [BP]/scripts/lib/canopy/EntityCommandOrigin";
import { beforeEach, describe, expect, it } from "vitest";

describe("EntityCommandOrigin", () => {
    let mockOrigin;

    beforeEach(() => {
        mockOrigin = new EntityCommandOrigin({ sourceType: "Entity", sourceEntity: true });
    })

    it("should get the source", () => {
        expect(mockOrigin.getSource()).toBeTruthy();
    });
});
