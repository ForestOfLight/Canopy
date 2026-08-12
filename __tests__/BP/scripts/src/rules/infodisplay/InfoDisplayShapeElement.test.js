import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Rules } from '../../../../../../Canopy[BP]/scripts/lib/canopy/rules/Rules';
import { InfoDisplayShapeElement } from '../../../../../../Canopy[BP]/scripts/src/rules/infodisplay/InfoDisplayShapeElement';

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

class TestShapeElement extends InfoDisplayShapeElement {
    static getRuleIdentifier() {
        return 'testShapeElement';
    }

    constructor() {
        super({ description: { text: 'test' } }, 0);
    }

    onTick() {
        /* pass */
    }
}

function createMockPlayer(id) {
    const properties = {};
    return {
        id,
        getDynamicProperty: (key) => properties[key],
        setDynamicProperty: (key, value) => { properties[key] = value; }
    };
}

describe('InfoDisplayShapeElement render state', () => {
    beforeEach(() => {
        Rules.clear();
        Rules.rulesToRegister = [];
    });

    it('starts rendering only for the player whose rule was enabled', () => {
        const firstPlayer = createMockPlayer('player-one');
        const secondPlayer = createMockPlayer('player-two');
        const firstElement = new TestShapeElement();
        const secondElement = new TestShapeElement();
        firstElement.rule.setPlayerElement(firstPlayer.id, firstElement);
        secondElement.rule.setPlayerElement(secondPlayer.id, secondElement);

        secondElement.rule.setValue(secondPlayer, true);

        expect(secondElement.shouldRender()).toBe(true);
        expect(firstElement.shouldRender()).toBe(false);
    });

    it('stops rendering only for the player whose rule was disabled', () => {
        const firstPlayer = createMockPlayer('player-one');
        const secondPlayer = createMockPlayer('player-two');
        const firstElement = new TestShapeElement();
        const secondElement = new TestShapeElement();
        firstElement.rule.setPlayerElement(firstPlayer.id, firstElement);
        secondElement.rule.setPlayerElement(secondPlayer.id, secondElement);
        firstElement.rule.setValue(firstPlayer, true);
        secondElement.rule.setValue(secondPlayer, true);

        secondElement.rule.setValue(secondPlayer, false);

        expect(secondElement.shouldRender()).toBe(false);
        expect(firstElement.shouldRender()).toBe(true);
    });
});
