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
});
