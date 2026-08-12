import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Rules } from '../../../../../../Canopy[BP]/scripts/lib/canopy/rules/Rules';
import { NoFog } from '../../../../../../Canopy[BP]/scripts/src/rules/infodisplay/NoFog';

const { InvalidEntityError, dimensionChangeSubscribers } = vi.hoisted(() => ({
    InvalidEntityError: class extends Error {},
    dimensionChangeSubscribers: new Set()
}));

vi.mock('@minecraft/server', async (importOriginal) => {
    const original = await importOriginal();
    return {
        ...original,
        InvalidEntityError,
        world: {
            ...original.world,
            afterEvents: {
                ...original.world.afterEvents,
                worldLoad: { subscribe: (callback) => callback() },
                playerDimensionChange: {
                    subscribe: (callback) => dimensionChangeSubscribers.add(callback),
                    unsubscribe: (callback) => dimensionChangeSubscribers.delete(callback)
                }
            }
        }
    };
});

function createMockPlayer(id) {
    const properties = {};
    return {
        id,
        dimension: { id: 'minecraft:nether' },
        fogSettings: { push: vi.fn(), remove: vi.fn() },
        getDynamicProperty: (key) => properties[key],
        setDynamicProperty: (key, value) => { properties[key] = value; }
    };
}

function fireDimensionChange(player) {
    for (const callback of [...dimensionChangeSubscribers])
        callback({ player });
}

describe('NoFog', () => {
    beforeEach(() => {
        Rules.clear();
        Rules.rulesToRegister = [];
        dimensionChangeSubscribers.clear();
    });

    it('enables fog removal for the toggling player, not the first player to register', () => {
        const firstPlayer = createMockPlayer('player-one');
        const secondPlayer = createMockPlayer('player-two');
        const firstElement = new NoFog(firstPlayer);
        const secondElement = new NoFog(secondPlayer);
        firstElement.rule.setPlayerElement(firstPlayer.id, firstElement);
        secondElement.rule.setPlayerElement(secondPlayer.id, secondElement);

        secondElement.rule.setValue(secondPlayer, true);

        expect(secondPlayer.fogSettings.push).toHaveBeenCalledWith('canopy:nether_no_fog', 'canopy_no_fog');
        expect(firstPlayer.fogSettings.push).not.toHaveBeenCalled();
    });

    it('disables fog removal for the toggling player, not the first player to register', () => {
        const firstPlayer = createMockPlayer('player-one');
        const secondPlayer = createMockPlayer('player-two');
        const firstElement = new NoFog(firstPlayer);
        const secondElement = new NoFog(secondPlayer);
        firstElement.rule.setPlayerElement(firstPlayer.id, firstElement);
        secondElement.rule.setPlayerElement(secondPlayer.id, secondElement);

        secondElement.rule.setValue(secondPlayer, false);

        expect(secondPlayer.fogSettings.remove).toHaveBeenCalledWith('canopy_no_fog');
        expect(firstPlayer.fogSettings.remove).not.toHaveBeenCalled();
    });

    it('uses the reconnected player after a leave and rejoin', () => {
        const beforeReconnect = createMockPlayer('same-player');
        const staleElement = new NoFog(beforeReconnect);
        staleElement.rule.setPlayerElement(beforeReconnect.id, staleElement);
        staleElement.rule.setValue(beforeReconnect, true);

        // Player leaves: the element is torn down and its dimension-change handler unsubscribed.
        staleElement.rule.removePlayerElement(beforeReconnect.id);
        staleElement.destroy();

        // Player rejoins with a fresh Player object under the same id.
        const afterReconnect = createMockPlayer('same-player');
        const freshElement = new NoFog(afterReconnect);
        freshElement.rule.setPlayerElement(afterReconnect.id, freshElement);
        beforeReconnect.fogSettings.push.mockClear();

        freshElement.rule.setValue(afterReconnect, true);

        expect(afterReconnect.fogSettings.push).toHaveBeenCalledWith('canopy:nether_no_fog', 'canopy_no_fog');
        expect(beforeReconnect.fogSettings.push).not.toHaveBeenCalled();
    });

    it('does not leak a dimension-change handler bound to a departed player', () => {
        const player = createMockPlayer('leaver');
        const element = new NoFog(player);
        element.rule.setPlayerElement(player.id, element);
        element.rule.setValue(player, true);
        expect(dimensionChangeSubscribers.size).toBe(1);

        element.destroy();

        expect(dimensionChangeSubscribers.size).toBe(0);
    });

    it('ignores dimension changes belonging to other players', () => {
        const owner = createMockPlayer('owner');
        const other = createMockPlayer('other');
        const element = new NoFog(owner);
        element.rule.setPlayerElement(owner.id, element);
        element.rule.setValue(owner, true);
        owner.fogSettings.push.mockClear();

        fireDimensionChange(other);

        expect(owner.fogSettings.push).not.toHaveBeenCalled();
    });

    it('re-applies fog removal when its own player changes dimension', () => {
        const owner = createMockPlayer('owner');
        const element = new NoFog(owner);
        element.rule.setPlayerElement(owner.id, element);
        element.rule.setValue(owner, true);
        owner.fogSettings.push.mockClear();

        fireDimensionChange(owner);

        expect(owner.fogSettings.push).toHaveBeenCalledWith('canopy:nether_no_fog', 'canopy_no_fog');
    });

    it('skips the fog push in dimensions with no fog removal id', () => {
        const player = createMockPlayer('overworlder');
        player.dimension = { id: 'minecraft:overworld' };
        const element = new NoFog(player);
        element.rule.setPlayerElement(player.id, element);

        element.rule.setValue(player, true);

        expect(player.fogSettings.remove).toHaveBeenCalledWith('canopy_no_fog');
        expect(player.fogSettings.push).not.toHaveBeenCalled();
    });
});

describe('NoFog warnings when fog settings are not applied', () => {
    let warnSpy;

    beforeEach(() => {
        Rules.clear();
        Rules.rulesToRegister = [];
        dimensionChangeSubscribers.clear();
        warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        warnSpy.mockRestore();
    });

    it('warns when the player has no fog settings', () => {
        const player = createMockPlayer('fogless');
        player.fogSettings = undefined;
        const element = new NoFog(player);
        element.rule.setPlayerElement(player.id, element);

        element.rule.setValue(player, true);

        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('apply fog removal'));
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('fogless'));
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('fog settings are unavailable'));
    });

    it('warns when the player is no longer valid', () => {
        const player = createMockPlayer('departed');
        const element = new NoFog(player);
        element.rule.setPlayerElement(player.id, element);
        Object.defineProperty(player, 'fogSettings', {
            get() { throw new InvalidEntityError('player'); }
        });

        element.rule.setValue(player, true);

        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('apply fog removal'));
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('departed'));
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('no longer valid'));
    });

    it('warns when clearing fog fails, naming the clear action', () => {
        const player = createMockPlayer('departed-on-disable');
        const element = new NoFog(player);
        element.rule.setPlayerElement(player.id, element);
        element.rule.setValue(player, true);
        warnSpy.mockClear();
        Object.defineProperty(player, 'fogSettings', {
            get() { throw new InvalidEntityError('player'); }
        });

        element.rule.setValue(player, false);

        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('clear fog removal'));
    });

    it('does not warn when fog is applied successfully', () => {
        const player = createMockPlayer('healthy');
        const element = new NoFog(player);
        element.rule.setPlayerElement(player.id, element);

        element.rule.setValue(player, true);

        expect(warnSpy).not.toHaveBeenCalled();
    });

    it('still rethrows errors that are not InvalidEntityError', () => {
        const player = createMockPlayer('broken');
        const element = new NoFog(player);
        element.rule.setPlayerElement(player.id, element);
        Object.defineProperty(player, 'fogSettings', {
            get() { throw new TypeError('something else went wrong'); }
        });

        expect(() => element.rule.setValue(player, true)).toThrow(TypeError);
    });
});
