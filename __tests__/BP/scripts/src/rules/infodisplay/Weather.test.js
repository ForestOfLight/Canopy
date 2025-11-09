import { Weather } from '../../../../../../Canopy [BP]/scripts/src/rules/infodisplay/Weather';
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
    }
}));

vi.mock("@minecraft/server-ui", () => ({
    ModalFormData: vi.fn()
}));

const mockPlayer = {
    dimension: {
        getWeather: () => 'Clear'
    }
};

describe('Weather', () => {
    let weather;
    beforeAll(() => {
        weather = new Weather(mockPlayer, 0);
    });

    it('should inherit from InfoDisplayElement', () => {
        expect(weather).toBeInstanceOf(InfoDisplayElement);
    });

    it('should create a new InfoDisplay rule', () => {
        expect(Rules.get(weather.identifier)).toBeDefined();
    });

    it('should have a method to return formatted weather', () => {
        expect(weather.getFormattedDataOwnLine()).toEqual({ translate: 'rules.infoDisplay.weather.display', with: ['Clear'] });
    });
});