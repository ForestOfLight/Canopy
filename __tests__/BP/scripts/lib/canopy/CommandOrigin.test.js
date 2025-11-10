import { CommandOrigin } from "../../../../../Canopy [BP]/scripts/lib/canopy/commands/CommandOrigin";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FeedbackMessageType } from "../../../../../Canopy [BP]/scripts/lib/canopy/commands/FeedbackMessageType";

describe("CommandOrigin", () => {
    let mockOrigin;

    beforeEach(() => {
        mockOrigin = new CommandOrigin({ sourceType: "Player" });
    })

    it("should get the source type", () => {
        expect(mockOrigin.getType()).toBe("Player");
    });

    it("should require getSource to be implemented", () => {
        expect(() => mockOrigin.getSource()).toThrow("getSource() not implemented");
    });

    it("should error in the console if sendMessage is called", () => {
        const consoleErrorSpy = vi.spyOn(console, 'error');
        const message = { translate: 'test.message' };
        const result = mockOrigin.sendMessage(message);
        expect(consoleErrorSpy).toHaveBeenCalledWith(`Unknown source type: Player`, message);
        expect(result).toBe(FeedbackMessageType.ConsoleError);
        consoleErrorSpy.mockRestore();
    });
});
