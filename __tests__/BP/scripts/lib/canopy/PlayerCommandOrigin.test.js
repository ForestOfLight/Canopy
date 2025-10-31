import { FeedbackMessageType } from "../../../../../Canopy [BP]/scripts/lib/canopy/FeedbackMessageType";
import { PlayerCommandOrigin } from "../../../../../Canopy [BP]/scripts/lib/canopy/PlayerCommandOrigin";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("PlayerCommandOrigin", () => {
    let mockOrigin;

    beforeEach(() => {
        mockOrigin = new PlayerCommandOrigin({ sourceType: "Player", sourceEntity: { sendMessage: vi.fn() } });
    })

    it ("should get the source type", () => {
        expect(mockOrigin.getType()).toBe("Player");
    });

    it("should get the source", () => {
        expect(mockOrigin.getSource()).toBeTruthy();
    });

    it("should send a chat message to the player", () => {
        const message = "Hello, Player!";
        const feedbackType = mockOrigin.sendMessage(message);
        expect(feedbackType).toBe(FeedbackMessageType.ChatMessage);
    });
});
