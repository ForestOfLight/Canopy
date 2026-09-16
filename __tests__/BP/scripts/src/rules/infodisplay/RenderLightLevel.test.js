import { describe, it, expect, vi } from 'vitest';
import { RenderLightLevel } from '../../../../../../Canopy[BP]/scripts/src/rules/infodisplay/RenderLightLevel';

vi.mock('@minecraft/server', async (importOriginal) => {
    const original = await importOriginal();
    return {
        ...original,
        world: {
            ...original.world,
            afterEvents: {
                ...original.world.afterEvents,
                worldLoad: { subscribe: (callback) => callback() }
            }
        }
    };
});

const mockPlayer = {
    id: 'render-light-level-test-player'
};

describe('RenderLightLevel', () => {
    it('initializes lightLevelRenderers before start is called', () => {
        const renderLightLevel = new RenderLightLevel(mockPlayer);

        expect(renderLightLevel.lightLevelRenderers).toEqual({});
        expect(() => renderLightLevel.stop()).not.toThrow();
    });
});
