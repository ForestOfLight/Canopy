import { Speed } from '../../../../../../Canopy [BP]/scripts/src/rules/infodisplay/Speed';
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { InfoDisplayElement } from '../../../../../../Canopy [BP]/scripts/src/rules/infodisplay/InfoDisplayElement';
import { Rules } from '../../../../../../Canopy [BP]/scripts/lib/canopy/Rules';

vi.mock('@minecraft/server', () => ({
    world: { 
        beforeEvents: {
            chatSend: {
                subscribe: vi.fn()
            }
        },
        afterEvents: {
            worldLoad: {
                subscribe: (callback) => {
                    callback();
                }
            }
        },
        setDynamicProperty: vi.fn()
    },
    system: {
        afterEvents: {
            scriptEventReceive: {
                subscribe: vi.fn()
            }
        },
        runJob: vi.fn()
    },
    TicksPerSecond: 20
}));

vi.mock("@minecraft/server-ui", () => ({
    ModalFormData: vi.fn()
}));

const mockPlayer = {
    getVelocity: vi.fn(() => ({ x: 0, y: 0, z: 0 })),
};

describe('Speed', () => {
    let speed;
    beforeAll(() => {
        speed = new Speed(mockPlayer, 0);
    });

    it('should inherit from InfoDisplayElement', () => {
        expect(speed).toBeInstanceOf(InfoDisplayElement);
    });

    it('should create a new InfoDisplay rule', () => {
        expect(Rules.get(speed.identifier)).toBeDefined();
    });

    it('should have a method to return the player\'s formatted speed', () => {
        expect(speed.getFormattedDataOwnLine()).toEqual({
            text: `§70.000 m/s`
        });
    });

    it('should correctly calculate speed from player velocity', () => {
        mockPlayer.getVelocity.mockReturnValue({ x: 3, y: 4, z: 0 });
        expect(speed.getFormattedDataOwnLine()).toEqual({
            text: `§7100.000 m/s`
        });
    });
});