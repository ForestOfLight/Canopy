import { describe, it, expect, vi } from "vitest";
import { printRealMspt } from "../../../../../Canopy [BP]/scripts/src/commands/health";

describe('printRealMspt', () => {
    it('should send a message to the sender', () => {
        const sender = { sendMessage: vi.fn() };
        printRealMspt(sender);
        expect(sender.sendMessage).toHaveBeenCalled();
    });
});