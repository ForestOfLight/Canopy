import { Ping } from '../../../../../../Canopy[BP]/scripts/src/rules/infodisplay/Ping';
import { describe, it, expect, vi } from 'vitest';
import { InfoDisplayTextElement } from '../../../../../../Canopy[BP]/scripts/src/rules/infodisplay/InfoDisplayTextElement';
import { Rules } from '../../../../../../Canopy[BP]/scripts/lib/canopy/rules/Rules';

describe('Ping', () => {
    const mockPlayer = {
        getPing: vi.fn(() => 50),
        setDynamicProperty: vi.fn(),
        getDynamicProperty: vi.fn(),
    };
    const ping = new Ping(mockPlayer, 0);

    it('should inherit from InfoDisplayTextElement', () => {
        expect(ping).toBeInstanceOf(InfoDisplayTextElement);
    });

    it('should create a new InfoDisplay rule', () => {
        expect(Rules.get(ping.identifier)).toBeDefined();
    });

    it('should have a method to return formatted ping', () => {
        expect(ping.getFormattedDataOwnLine()).toEqual({ translate: 'rules.infoDisplay.ping.display', with: ['§a' + mockPlayer.getPing()] });
    });

    it('should color the ping value green when it is below 100ms', () => {
        expect(ping.getFormattedDataOwnLine().with[0]).toContain('§a');
    });

    it('should color the ping value yellow when it is between 100ms and 300ms', () => {
        mockPlayer.getPing.mockReturnValue(150);
        expect(ping.getFormattedDataOwnLine().with[0]).toContain('§e');
    });

    it('should color the ping value red when it is above 300ms', () => {
        mockPlayer.getPing.mockReturnValue(350);
        expect(ping.getFormattedDataOwnLine().with[0]).toContain('§c');
    });

    it('should color the ping purple when it is above 1000ms', () => {
        mockPlayer.getPing.mockReturnValue(1500);
        expect(ping.getFormattedDataOwnLine().with[0]).toContain('§5');
    });
});
