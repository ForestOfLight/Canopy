import { ServerCommandOrigin } from "../../../../../Canopy [BP]/scripts/lib/canopy/ServerCommandOrigin";
import { beforeEach, describe, expect, it } from "vitest";

describe("ServerCommandOrigin", () => {
    let mockOrigin;

    beforeEach(() => {
        mockOrigin = new ServerCommandOrigin({ sourceType: "Server" });
    })

    it("should get the source", () => {
        expect(mockOrigin.getSource()).toBe("Server");
    });
});
